import React, { useEffect, useState } from 'react';
import cfg from '../services/config';
import api from '../services/api';
import { getUsuario, logout, getToken } from '../services/auth';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, LineChart, Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function colorForId(id) {
  const s = id?.toString() || '';
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash << 5) - hash + s.charCodeAt(i);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 50%)`;
}

export default function Dashboard() {
  const usuario = getUsuario();
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Elimine 'estado' del estado inicial
  const [form, setForm] = useState({
    titulo: '', descripcion: '', fecha_vencimiento: '',
    prioridad: 'baja', comentario: '', sala_id: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ estado: '', prioridad: '' });

  useEffect(() => {
    fetchAll();
    if (getToken()) fetchStats();
  }, []);

  async function fetchAll() {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams(filters).toString();
      const path = cfg.paths.tareas + (q ? ('?' + q) : '');
      const res = await api.get(path);
      setTareas(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (e) {
      console.error(e);
      setError('Error cargando tareas: ' + (e.response?.data?.message || e.response?.data?.error || e.message));
    }
    setLoading(false);
  }

  async function fetchStats() {
    try {
      const res = await api.get(cfg.paths.estadisticas);
      setStats(res.data);
    } catch (e) {
      if (e?.response?.status === 401) return;
      console.error(e);
    }
  }

  async function handleCreateOrUpdate(e) {
    e.preventDefault();
    setError('');

    if (!form.fecha_vencimiento) {
      setError('La fecha de vencimiento es requerida');
      return;
    }

    try {
      // NO inclui 'estado' en el payload al crear
      const payload = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion?.trim() || '',
        fecha_vencimiento: form.fecha_vencimiento,
        prioridad: form.prioridad,
        comentario: form.comentario?.trim() || '',
      };

      if (form.sala_id && form.sala_id.trim() !== '') {
        payload.sala_id = form.sala_id.trim();
      }

      if (editingId) {
        payload.estado = form.estado;
        await api.put(`${cfg.paths.tareas}/${editingId}`, payload);
      } else {
        await api.post(cfg.paths.tareas, payload);
      }

      //  Reset sin 'estado'
      setForm({
        titulo: '',
        descripcion: '',
        fecha_vencimiento: '',
        prioridad: 'baja',
        comentario: '',
        sala_id: ''
      });
      setEditingId(null);
      await fetchAll();
      await fetchStats();
    } catch (e) {
      console.error('Error completo:', e);
      const errorMsg =
        e.response?.data?.error ||
        e.response?.data?.message ||
        e.message ||
        'Error desconocido al guardar la tarea';
      setError('Error guardando tarea: ' + errorMsg);
    }
  }

  function startEdit(t) {
    setEditingId(t.id_tarea);
    //   Al editar, sí cargue el estado
    setForm({
      titulo: t.titulo || '',
      descripcion: t.descripcion || '',
      fecha_vencimiento: t.fecha_vencimiento || '',
      prioridad: t.prioridad || 'baja',
      estado: t.estado || 'Pendiente', //  inclui estado solo en edición
      comentario: t.comentario || '',
      sala_id: t.sala_id || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar tarea?')) return;
    try {
      await api.delete(`${cfg.paths.tareas}/${id}`);
      await fetchAll();
      await fetchStats();
    } catch (e) {
      console.error(e);
      setError('Error eliminando: ' + (e.response?.data?.message || e.response?.data?.error || e.message));
    }
  }

  // --- resto del código (gráficos, etc.) ---
  const safeStats = stats || {};
  const monthlyData = Array.isArray(safeStats.monthly) ? safeStats.monthly : [];
  const recientesData = Array.isArray(safeStats.recientes) ? safeStats.recientes : [];
  const porPrioridad = safeStats.por_prioridad || { alta: 0, media: 0, baja: 0 };
  const safeTareas = Array.isArray(tareas) ? tareas : [];

  const taskColors = {};
  safeTareas.forEach(t => { taskColors[t.id_tarea] = colorForId(t.id_tarea); });

  const estadoOrder = ['Pendiente', 'EnProgreso', 'EnEspera', 'Completado'];
  const prioridadKeys = ['alta', 'media', 'baja'];
  const grouped = {};
  estadoOrder.forEach(e => { grouped[e] = { estado: e, alta: 0, media: 0, baja: 0 }; });
  safeTareas.forEach(t => {
    const e = t.estado || 'Pendiente';
    const p = (t.prioridad || 'baja').toLowerCase();
    if (!grouped[e]) grouped[e] = { estado: e, alta: 0, media: 0, baja: 0 };
    if (prioridadKeys.includes(p)) grouped[e][p] = (grouped[e][p] || 0) + 1;
  });
  const groupedData = Object.values(grouped);

  const priorityRank = { alta: 0, media: 1, baja: 2 };
  const estadoRank = { Pendiente: 0, EnProgreso: 1, EnEspera: 2, Completado: 3 };
  const taskBars = safeTareas.slice().sort((a, b) => {
    const ea = estadoRank[a.estado] ?? 99; const eb = estadoRank[b.estado] ?? 99;
    if (ea !== eb) return ea - eb;
    const pa = priorityRank[(a.prioridad || 'baja').toLowerCase()] ?? 9; const pb = priorityRank[(b.prioridad || 'baja').toLowerCase()] ?? 9;
    if (pa !== pb) return pa - pb;
    return (a.titulo || '').localeCompare(b.titulo || '');
  }).map(t => ({ id: t.id_tarea, titulo: t.titulo || ('#' + t.id_tarea), count: 1, color: taskColors[t.id_tarea] }));

  return (
    <div className="dashboard-root">
      <div className="dashboard-grid">
        <div className="dashboard-left">
          <div className="left-form card">
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary-gradient)', padding: '10px 14px', borderRadius: 8, color: '#ffffff' }}>
              <h2 style={{ margin: 0 }}>Bienvenido de nuevo a Synapse, {usuario?.nombre_completo || usuario?.Username || usuario?.name || 'Usuario'}</h2>
              <button
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
                style={{
                  backgroundColor: '#8b3c86ff',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cerrar sesión
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} style={{ marginTop: 12 }}>
              <label>Título</label>
              <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required />
              <label>Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
              <label>Fecha vencimiento</label>
              <input type="date" value={form.fecha_vencimiento || ''} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} required />

              <label>Prioridad</label>
              <select value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })}>
                <option value="baja">baja</option>
                <option value="media">media</option>
                <option value="alta">alta</option>
              </select>

              {/* Solo mostramos el selector de estado si estamos editando */}
              {editingId && (
                <>
                  <label>Estado</label>
                  <select value={form.estado || 'Pendiente'} onChange={e => setForm({ ...form, estado: e.target.value })}>
                    <option value="Pendiente">Pendiente</option>
                    <option value="EnProgreso">EnProgreso</option>
                    <option value="EnEspera">EnEspera</option>
                    <option value="Completado">Completado</option>
                  </select>
                </>
              )}

              <label>Comentario</label>
              <textarea value={form.comentario} onChange={e => setForm({ ...form, comentario: e.target.value })} />
              <label>Sala ID (opcional)</label>
              <input value={form.sala_id} onChange={e => setForm({ ...form, sala_id: e.target.value })} />

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button type="submit">{editingId ? 'Guardar cambios' : 'Crear tarea'}</button>
                {editingId && <button type="button" onClick={() => {
                  setEditingId(null);
                  setForm({ titulo: '', descripcion: '', fecha_vencimiento: '', prioridad: 'baja', comentario: '', sala_id: '' });
                }}>Cancelar</button>}
              </div>
            </form>

            {loading ? (
              <div style={{ marginTop: 12 }}>Cargando tareas...</div>
            ) : (
              <table className="table" style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Estado</th>
                    <th>Prioridad</th>
                    <th>Vence</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {safeTareas.map(t => (
                    <tr key={t.id_tarea}>
                      <td>{t.titulo}</td>
                      <td>{t.estado}</td>
                      <td>{t.prioridad}</td>
                      <td>{t.fecha_vencimiento || '-'}</td>
                      <td>
                        <button onClick={() => startEdit(t)}>Editar</button>
                        <button onClick={() => handleDelete(t.id_tarea)} style={{ marginLeft: 8 }}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {error && <div className="error-message" style={{ marginTop: 12, color: 'crimson', whiteSpace: 'pre-wrap' }}>{error}</div>}
          </div>
        </div>

        {/* --- Sección de estadísticas (sin cambios) --- */}
        <div className="dashboard-right">
          <div className="card">
            <h3>Resumen</h3>
            {stats ? (
              <div>
                <div className="metrics-row">
                  <div className="metric"><small>Total tareas</small><div className="value">{safeStats.total ?? 0}</div></div>
                  <div className="metric"><small>Pendientes</small><div className="value">{safeStats.pendientes ?? 0}</div></div>
                  <div className="metric"><small>Completadas</small><div className="value">{safeStats.completadas ?? 0}</div></div>
                </div>

                <div className="chart-wrap" style={{ marginBottom: 12 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pendientes', value: safeStats.pendientes || 0 },
                          { name: 'En Progreso', value: safeStats.en_progreso || 0 },
                          { name: 'En Espera', value: safeStats.en_espera || 0 },
                          { name: 'Completadas', value: safeStats.completadas || 0 }
                        ]}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={70}
                        isAnimationActive={true}
                        animationDuration={800}
                      >
                        {['Pendientes', 'EnProgreso', 'EnEspera', 'Completadas'].map((k, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <h4>Por prioridad</h4>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={[
                    { name: 'alta', value: porPrioridad.alta || 0 },
                    { name: 'media', value: porPrioridad.media || 0 },
                    { name: 'baja', value: porPrioridad.baja || 0 }
                  ]} isAnimationActive={true} animationDuration={700}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>

                <h4 style={{ marginTop: 12 }}>Por estado y prioridad</h4>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={groupedData} margin={{ left: 8, right: 8 }} isAnimationActive={true} animationDuration={700}>
                    <XAxis dataKey="estado" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="alta" stackId="a" fill="#ef4444" />
                    <Bar dataKey="media" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="baja" stackId="a" fill="#60a5fa" />
                  </BarChart>
                </ResponsiveContainer>

                <h4 style={{ marginTop: 12 }}>Tareas (por estado/prioridad) — colores por tarea</h4>
                <div style={{ maxHeight: 220, overflowY: 'auto', paddingRight: 8 }}>
                  <ResponsiveContainer width="100%" height={Math.min(320, taskBars.length * 28)}>
                    <BarChart layout="vertical" data={taskBars} margin={{ left: 8, right: 24 }} isAnimationActive={true} animationDuration={600}>
                      <XAxis type="number" hide domain={[0, 1]} />
                      <YAxis dataKey="titulo" type="category" width={140} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count">
                        {taskBars.map((t, i) => (<Cell key={t.id} fill={t.color} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <h4 style={{ marginTop: 12 }}>Actividad mensual</h4>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData.map(m => ({ name: `${m.month}/${m.year}`, creadas: m.creadas || 0, completadas: m.completadas || 0 }))}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="creadas" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="completadas" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <h4 style={{ marginTop: 12 }}>Tareas recientes</h4>
                <div className="recent-list">
                  {recientesData.map(r => (
                    <div className="recent-item" key={r.id_tarea}>
                      <div style={{ fontWeight: 700 }}>{r.titulo}</div>
                      <div className="muted">{r.estado} • {r.prioridad} • {r.fecha_vencimiento || 'sin fecha'}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 8 }}>
                  <div>Total: {safeStats.total ?? 0}</div>
                  <div>Vencidas: {safeStats.vencidas ?? 0}</div>
                  <div>Hoy: {safeStats.hoy ?? 0}</div>
                </div>
              </div>
            ) : (
              <div>Cargando estadísticas...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}