import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import cfg from '../services/config';
import api from '../services/api';
import { getUsuario, logout, getToken } from '../services/auth';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Dashboard() {
    const usuario = getUsuario();
    const navigate = useNavigate();
    const [tareas, setTareas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        titulo: '', descripcion: '', fecha_vencimiento: '',
        prioridad: 'baja', estado: 'Pendiente', comentario: '', sala_id: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [stats, setStats] = useState(null);
    const [filters, setFilters] = useState({ estado: '', prioridad: '' });

    useEffect(() => {
        fetchAll();
        // Only fetch stats if we have an auth token to avoid 401 responses
        if (getToken()) fetchStats();
    }, []);
    function handleLogout() {
        logout(); // Elimina el token y los datos del usuario
        navigate('/login'); // Redirige a la página de login
    }

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
            setError('Error cargando tareas: ' + (e.response?.data || e.message));
        }
        setLoading(false);
    }

    async function fetchStats() {
        try {
            const res = await api.get(cfg.paths.estadisticas);
            setStats(res.data);
        } catch (e) {
            // If unauthorized, ignore and keep stats null (frontend will show fallback)
            if (e?.response?.status === 401) return;
            console.error(e);
        }
    }

    async function handleCreateOrUpdate(e) {
        e.preventDefault();
        setError('');
        try {
            const payload = { ...form };
            if (editingId) {
                await api.put(`${cfg.paths.tareas}/${editingId}`, payload);
            } else {
                await api.post(cfg.paths.tareas, payload);
            }
            setForm({ titulo: '', descripcion: '', fecha_vencimiento: '', prioridad: 'baja', estado: 'Pendiente', comentario: '', sala_id: '' });
            setEditingId(null);
            await fetchAll();
            await fetchStats();
        } catch (e) {
            console.error('Error completo:', e);
            const errorMsg = e.response?.data?.error || e.response?.data?.message || e.message || 'Error desconocido al guardar la tarea';
            setError('Error guardando tarea: ' + errorMsg);
        }
    }

    function startEdit(t) {
        setEditingId(t.id_tarea);
        setForm({
            titulo: t.titulo || '', descripcion: t.descripcion || '',
            fecha_vencimiento: t.fecha_vencimiento || '',
            prioridad: t.prioridad || 'baja', estado: t.estado || 'Pendiente',
            comentario: t.comentario || '', sala_id: t.sala_id || ''
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
            setError('Error eliminando: ' + (e.response?.data || e.message));
        }
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20 }}>

            {/* Tareas Section */}
            <div className="card">
                {/* Header with light purple background */}
                <div
                    style={{
                        backgroundColor: '#c5a4ebec', // Morado claro
                        padding: '10px 20px',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <h2 style={{ margin: 0 }}>Tareas</h2>
                    <div>
                        <strong>{usuario?.Username || usuario?.username || usuario?.correo}</strong>
                        <button
                            onClick={() => { logout(); window.location.href = '/login'; }}
                            style={{
                                marginLeft: 8,
                                backgroundColor: '#8b3c86ff', // Morado
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
                </div>

                <form onSubmit={handleCreateOrUpdate} style={{ marginTop: 12 }}>
                    <label>Título</label>
                    <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required />

                    <label>Descripción</label>
                    <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />

                    <label>Fecha vencimiento</label>
                    <input type="date" value={form.fecha_vencimiento || ''} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} />

                    <label>Prioridad</label>
                    <select value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })}>
                        <option value="baja">baja</option>
                        <option value="media">media</option>
                        <option value="alta">alta</option>
                    </select>

                    <label>Estado</label>
                    <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                        <option value="Pendiente">Pendiente</option>
                        <option value="EnProgreso">EnProgreso</option>
                        <option value="EnEspera">EnEspera</option>
                        <option value="Completado">Completado</option>
                    </select>

                    <label>Comentario</label>
                    <textarea value={form.comentario} onChange={e => setForm({ ...form, comentario: e.target.value })} />

                    <label>Sala ID (opcional)</label>
                    <input value={form.sala_id} onChange={e => setForm({ ...form, sala_id: e.target.value })} />

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button type="submit">{editingId ? 'Guardar cambios' : 'Crear tarea'}</button>
                        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ titulo: '', descripcion: '', fecha_vencimiento: '', prioridad: 'baja', estado: 'Pendiente', comentario: '', sala_id: '' }); }}>Cancelar</button>}
                    </div>
                </form>

                <div style={{ marginTop: 12 }}>
                    <h3>Filtros</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <select value={filters.estado} onChange={e => { setFilters({ ...filters, estado: e.target.value }); }}>
                            <option value="">Todos estados</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="EnProgreso">EnProgreso</option>
                            <option value="EnEspera">EnEspera</option>
                            <option value="Completado">Completado</option>
                        </select>
                        <select value={filters.prioridad} onChange={e => { setFilters({ ...filters, prioridad: e.target.value }); }}>
                            <option value="">Todas prioridades</option>
                            <option value="alta">alta</option>
                            <option value="media">media</option>
                            <option value="baja">baja</option>
                        </select>
                        <button onClick={fetchAll}>Aplicar</button>
                    </div>
                </div>

                {loading ? (
                    <div>Cargando tareas...</div>
                ) : (
                    <table className="table">
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
                            {tareas.map(t => (
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

                {error && <div style={{ color: 'crimson', whiteSpace: 'pre-wrap' }}>{error}</div>}
            </div>

            {/* Estadísticas Section */}
            <div className="card">
                <h3>Estadísticas</h3>
                {stats ? (
                    <div>
                        <div style={{ height: 240 }}>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                                    <Pie data={[
                                                    { name: 'Pendientes', value: stats?.pendientes ?? 0 },
                                                    { name: 'En Progreso', value: stats?.en_progreso ?? 0 },
                                                    { name: 'En Espera', value: stats?.en_espera ?? 0 },
                                                    { name: 'Completadas', value: stats?.completadas ?? 0 }
                                                ]} dataKey="value" nameKey="name" outerRadius={80}>
                                        {['Pendientes', 'EnProgreso', 'EnEspera', 'Completadas'].map((k, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <h4>Por prioridad</h4>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={[
                                { name: 'alta', value: stats?.por_prioridad?.alta ?? 0 },
                                { name: 'media', value: stats?.por_prioridad?.media ?? 0 },
                                { name: 'baja', value: stats?.por_prioridad?.baja ?? 0 }
                            ]}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" />
                            </BarChart>
                        </ResponsiveContainer>

                        <div style={{ marginTop: 12 }}>
                            <div>Total: {stats?.total ?? 0}</div>
                            <div>Vencidas: {stats?.vencidas ?? 0}</div>
                            <div>Hoy: {stats?.hoy ?? 0}</div>
                        </div>
                    </div>
                ) : (
                    <div>Cargando estadísticas...</div>
                )}
            </div>
        </div>
    );
}