import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Clock, Calendar, Zap } from 'lucide-react';
import cfg from '../services/config';
import api from '../services/api';
import { getUsuario, logout, getToken, saveUsuario } from '../services/auth';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LineChart, Line, AreaChart, Area, CartesianGrid, Legend } from 'recharts';
import '../pages/styles/Dashboard.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function colorForId(id) {
  const s = id?.toString() || '';
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash << 5) - hash + s.charCodeAt(i);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 50%)`;

}

export default function WellnessDashboard() {
  const usuario = getUsuario();
  const navigate = useNavigate();
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    titulo: '', descripcion: '', fecha_vencimiento: '', prioridad: 'baja', comentario: '', sala_id: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [stats, setStats] = useState(null);
  const safeStats = stats || {};
  const [moodHistory, setMoodHistory] = useState([]);
  const [filters, setFilters] = useState({ estado: '', prioridad: '' });
  const [showForm, setShowForm] = useState(false);

  // Saludo dinámico según hora del día
  function getGreeting() {
    try {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 12) return '¡Buenos días';
      if (hour >= 12 && hour < 19) return '¡Buenas tardes';
      return '¡Buenas noches';
    } catch (e) {
      return '¡Hola';
    }
  }
  // Preferir el nombre con el que el usuario se registró (campo `nombre`),
  // si no está disponible usar `nombre_completo`, `Username` o `name`.
  const displayName = usuario?.nombre || usuario?.nombre_completo || usuario?.Username || usuario?.name || 'Usuario';
  const greeting = getGreeting();

  // Lógica para mostrar rachas sólo cuando el usuario tiene al menos dos rachas
  // comprobamos varios nombres de campo posibles en `safeStats` para compatibilidad.
  function getStreakCount(stats) {
    if (!stats) return 0;
    let count = 0;
    const tryGet = (keys) => {
      for (const k of keys) {
        const v = Number(stats[k]);
        if (!isNaN(v) && v >= 2) return true;
      }
      return false;
    };

    // Pomodoro streak keys (posibles nombres desde el backend)
    if (tryGet(['racha_pomodoro', 'pomodoro_racha', 'pomodoro_days', 'pomodoro_consecutivos', 'pomodoro_dias'])) count++;
    // Meditación streak keys
    if (tryGet(['racha_meditacion', 'meditacion_racha', 'meditacion_days', 'meditacion_consecutivos', 'meditacion_minutos_dias'])) count++;
    // Práctica continua u otra métrica genérica
    if (tryGet(['racha', 'practica_continua_dias', 'consecutivos'])) count++;

    return count;
  }

  const streakActivities = getStreakCount(safeStats);
  const showStreakBadge = streakActivities >= 2 || (Number(safeStats?.racha) >= 2 && streakActivities > 0);

  // Estado emocional: si hay meditación o pomodoro recientes consideramos 'Enfocado'
  function isFocused(stats) {
    if (!stats) return false;
    const positive = (keys) => keys.some(k => {
      const v = stats[k];
      return v !== undefined && v !== null && Number(v) > 0;
    });
    return positive(['meditacion_minutos', 'meditacion_minutos_hoy', 'pomodoro_minutos', 'pomodoro_hoy', 'conexion_hoy', 'tareas_completadas_dia', 'pomodoro_sessions_today']);
  }

  const focused = isFocused(safeStats);

  // Métrica seleccionada en el área (conexion | meditacion | tareas)
  const [selectedMetric, setSelectedMetric] = useState('conexion');
  // Modal de configuración de hábitos
  const [habitsModalOpen, setHabitsModalOpen] = useState(false);
  const [habitForm, setHabitForm] = useState({ madrugar: '06:00', ejercicio_min: 30, lectura_paginas: 20, agua_vasos: 4 });
  const [savingHabits, setSavingHabits] = useState(false);
  const [habitSaveError, setHabitSaveError] = useState('');
  const [habitSaveSuccess, setHabitSaveSuccess] = useState('');

  useEffect(() => {
    fetchAll();
    if (getToken()) fetchStats();
    if (getToken()) fetchMoodHistory();

    // Refrescar estadísticas periódicamente para mantener porcentajes actualizados
    let intervalId = null;
    if (getToken()) {
      intervalId = setInterval(() => {
        fetchStats();
      }, 60000); // cada 60s
    }

    return () => { if (intervalId) clearInterval(intervalId); };

  }, []);

  async function fetchMoodHistory(days = 14) {
    try {
      const res = await api.get(cfg.paths.estadoAnimoHistory + `?days=${days}`);
      const hist = res.data?.history || [];
      // Map to chart data: { date: 'DD/MM', avg: number|null }
      const chart = hist.map(h => ({ date: h.date.slice(5), avg: h.avg }));
      setMoodHistory(chart);
    } catch (e) {
      console.error('Error cargando historial de estado de ánimo', e);
      // Fallback: evitar que el componente rompa si el backend falla.
      setMoodHistory([]);
      setError(prev => prev || 'No se pudo cargar historial de estado de ánimo');
    }
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
      const payload = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion?.trim() || '',
        fecha_vencimiento: form.fecha_vencimiento,
        prioridad: form.prioridad,
        comentario: form.comentario?.trim() || ''
      };

      if (form.sala_id && form.sala_id.trim() !== '') payload.sala_id = form.sala_id.trim();

      if (editingId) {
        payload.estado = form.estado;
        await api.put(`${cfg.paths.tareas}/${editingId}`, payload);
      } else {
        await api.post(cfg.paths.tareas, payload);
      }

      setForm({ titulo: '', descripcion: '', fecha_vencimiento: '', prioridad: 'baja', comentario: '', sala_id: '' });
      setEditingId(null);
      setShowForm(false);
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
      titulo: t.titulo || '',
      descripcion: t.descripcion || '',
      fecha_vencimiento: t.fecha_vencimiento || '',
      prioridad: t.prioridad || 'baja',
      estado: t.estado || 'Pendiente',
      comentario: t.comentario || '',
      sala_id: t.sala_id || ''
    });
    setShowForm(true);
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

  function formatDateIsoToDisplay(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d)) return dateStr.slice(0,10);
      const today = new Date();
      const isToday = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
      if (isToday) return 'Hoy';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch (e) {
      return dateStr.slice(0,10);
    }
  }

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

  // Preparar datos para gráficas (fallback a datos de ejemplo si no hay stats)
  const sampleChart = [
    { name: 'lunes', conexion: 60, meditacion: 10, tareas: 6 },
    { name: 'martes', conexion: 75, meditacion: 8, tareas: 5 },
    { name: 'miércoles', conexion: 50, meditacion: 12, tareas: 8 },
    { name: 'jueves', conexion: 95, meditacion: 18, tareas: 12 },
    { name: 'viernes', conexion: 70, meditacion: 10, tareas: 9 },
    { name: 'sábado', conexion: 85, meditacion: 14, tareas: 7 },
    { name: 'domingo', conexion: 60, meditacion: 12, tareas: 6 }
  ];

  const chartData = (Array.isArray(monthlyData) && monthlyData.length > 0)
    ? (() => {
        const daysEs = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];
        // If we have at least 7 data points, prefer mapping them to the weekdays (lunes..domingo)
        if (monthlyData.length >= 7) {
          // Use only the first 7 entries to represent the week consistently
          return monthlyData.slice(0, 7).map((m, idx) => ({
            name: m.label || m.dia || daysEs[idx],
            conexion: m.conexion ?? m.conexion_hoy ?? m.value ?? 0,
            meditacion: m.meditacion ?? m.meditacion_minutos ?? 0,
            tareas: m.tareas ?? m.tareas_completadas ?? 0
          }));
        }

        // Otherwise preserve whatever labels the backend provides or fallback to D1, D2...
        return monthlyData.map((m, idx) => ({
          name: m.label || m.dia || `D${idx + 1}`,
          conexion: m.conexion ?? m.conexion_hoy ?? m.value ?? 0,
          meditacion: m.meditacion ?? m.meditacion_minutos ?? 0,
          tareas: m.tareas ?? m.tareas_completadas ?? 0
        }));
      })()
    : sampleChart;

  const moodSample = [
    { name: 'Excelente', value: 35, color: '#10B981' },
    { name: 'Bien', value: 40, color: '#3B82F6' },
    { name: 'Regular', value: 20, color: '#FBBF24' },
    { name: 'Bajo', value: 5, color: '#EF4444' }
  ];

  // Convertir datos crudos del backend (counts) a porcentajes para la visualización de donut
  // Normalize backend estado_animo into array of { name, count, color, pct, value }
  let moodData = moodSample.map(s => ({ name: s.name, count: s.value, color: s.color, pct: s.value }));
  if (safeStats && safeStats.estado_animo) {
    const rawItems = [];
    if (Array.isArray(safeStats.estado_animo) && safeStats.estado_animo.length > 0) {
      safeStats.estado_animo.forEach((e, i) => {
        const count = Number(e.value ?? e.count ?? e.count_total ?? 0) || 0;
        rawItems.push({ name: e.label || e.name || `L${i+1}`, count, color: e.color || COLORS[i % COLORS.length] });
      });
    } else if (typeof safeStats.estado_animo === 'object') {
      // support object map { Excelente: 10, Bien: 5 }
      const keys = Object.keys(safeStats.estado_animo);
      keys.forEach((k, i) => {
        const count = Number(safeStats.estado_animo[k] ?? 0) || 0;
        rawItems.push({ name: k, count, color: COLORS[i % COLORS.length] });
      });
    }

    if (rawItems.length > 0) {
      const totalCount = rawItems.reduce((s, r) => s + r.count, 0) || 0;
      if (totalCount === 0) {
        // no real data, fall back to sample distribution
        moodData = moodSample.map(s => ({ name: s.name, value: s.value, pct: s.value, count: s.value, color: s.color }));
      } else {
        let withPct = rawItems.map(r => ({ ...r, pct: Math.round((r.count / totalCount) * 100) }));
      const pctSum = withPct.reduce((s, r) => s + r.pct, 0);
      if (pctSum !== 100) {
        // distribute the rounding difference to the item with largest count
        const idxMax = withPct.reduce((imax, cur, idx, arr) => (cur.count > arr[imax].count ? idx : imax), 0);
        withPct[idxMax].pct += (100 - pctSum);
      }
      // produce entries: value is pct (for Pie), keep count separately
      moodData = withPct.map(r => ({ name: r.name, value: r.pct, pct: r.pct, count: r.count, color: r.color }));
      }
    }
  }

  // Custom tooltip for pie to show raw counts + pct
  function CustomPieTooltip({ active, payload }) {
    if (!active || !payload || !payload.length) return null;
    const p = payload[0].payload;
    return (
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', padding: 8, borderRadius: 6, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
        <div style={{ fontSize: 13, color: '#374151' }}>{p.pct}% • {p.count} registro{p.count !== 1 ? 's' : ''}</div>
      </div>
    );
  }

  // Reordenar moodData para que la leyenda muestre en el orden: Excelente, Bien, Regular, Bajo
  const preferredOrder = ['Excelente', 'Bien', 'Regular', 'Bajo'];
  const orderedMoodData = [];
  preferredOrder.forEach(name => {
    moodData.forEach(m => { if ((m.name || '').toString().toLowerCase() === name.toLowerCase()) orderedMoodData.push(m); });
  });
  // agregar el resto que no estén en preferredOrder
  moodData.forEach(m => { if (!orderedMoodData.includes(m)) orderedMoodData.push(m); });

  // ---------------------- Helpers para tarjetas estadísticas ----------------------
  function formatMinutesToHuman(v) {
    if (v === undefined || v === null) return '0m';
    const n = Number(v);
    if (isNaN(n)) return String(v);
    const minutes = Math.floor(n);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  function computePercentFromMinutes(value, goalMinutes) {
    const n = Number(value);
    if (!n || !goalMinutes) return 0;
    return Math.min(100, Math.round((n / goalMinutes) * 100));
  }

  function computePercentSimple(value, goal) {
    const n = Number(value);
    if (!n || !goal) return 0;
    return Math.min(100, Math.round((n / goal) * 100));
  }

  function computePercentTasks(statsObj) {
    if (!statsObj) return 0;
    const completed = Number(statsObj.tareas_completadas_dia) || 0;
    const total = Number(statsObj.tareas_planificadas_dia ?? statsObj.tareas_total_dia ?? statsObj.tareas_objetivo) || 0;
    if (total === 0) {
      // Si no hay total definido intentar inferir porcentaje por campos disponibles
      // fallback: usar 80% si hay completadas > 0
      return completed > 0 ? 80 : 0;
    }
    return Math.min(100, Math.round((completed / total) * 100));
  }

  function formatTasksProgress(v) {
    if (!v) return '0/0';
    if (typeof v === 'object') {
      const c = Number(v.completed) || 0;
      const t = Number(v.total) || 0;
      if (t > 0) return `${c}/${t}`;
      return `${c}`;
    }
    return String(v);
  }

  // Componente pequeño para evitar repetir markup de tarjeta
  function StatCard({ icon, color, title, value, rawValue, formatter, percent }) {
    const pct = typeof percent === 'number' ? percent : 0;
    const display = formatter ? formatter(rawValue ?? value) : (value ?? '-');
    return (
      <div className="stat-card">
        <div className="stat-header">
          <div className={`stat-icon ${color}`}>{icon}</div>
          <span className="stat-badge">{pct > 0 ? `${pct}%` : ''}</span>
        </div>
        <p className="stat-value">{display}</p>
        <p className="stat-label">{title}</p>
        <div className="progress-bar"><div className={`progress-fill ${color}`} style={{width:`${pct}%`}}/></div>
      </div>
    );
  }

  // ---------------- Habits modal helpers ----------------
  function openHabitsModal() {
    // try to populate from safeStats if available
    const fromStats = (safeStats && (safeStats.habitos || safeStats.habits || safeStats.habits_config || safeStats.habitos_config)) || {};
    setHabitForm({
      madrugar: fromStats.madrugar_hora || fromStats.madrugar || habitForm.madrugar || '06:00',
      ejercicio_min: fromStats.ejercicio_minutos || fromStats.ejercicio_min || habitForm.ejercicio_min || 30,
      lectura_paginas: fromStats.lectura_paginas || fromStats.lectura || habitForm.lectura_paginas || 20,
      agua_vasos: fromStats.agua_vasos || fromStats.agua || habitForm.agua_vasos || 4
    });
    setHabitsModalOpen(true);
  }

  function closeHabitsModal() {
    setHabitsModalOpen(false);
  }

  async function saveHabits() {
    // Persistir al backend: intentamos PUT a /usuarios/:id si hay usuario
    if (!usuario || !usuario.id) {
      setError('No hay usuario válido para guardar la configuración.');
      return;
    }

    setSavingHabits(true);
    setError('');
    setHabitSaveError('');
    setHabitSaveSuccess('');
    try {
      const payload = { preferencias: { habitos: {
        madrugar_hora: habitForm.madrugar,
        ejercicio_minutos: Number(habitForm.ejercicio_min) || 0,
        lectura_paginas: Number(habitForm.lectura_paginas) || 0,
        agua_vasos: Number(habitForm.agua_vasos) || 0
      } } };

      // Determinar id de usuario de forma tolerante
      const possibleId = usuario?.id || usuario?.usuario_id || usuario?.id_usuario || usuario?.uuid || usuario?._id;
      if (!possibleId) {
        throw new Error('No se encontró id de usuario en el cliente.');
      }

      let res;
      // cfg.paths.usuarioById es una función en config.jsx
      const userUrl = (typeof cfg.paths.usuarioById === 'function') ? cfg.paths.usuarioById(possibleId) : `/usuarios/${possibleId}`;
      console.debug('Intentando PUT a', userUrl, payload);
      try {
        res = await api.put(userUrl, payload);
      } catch (errPut) {
        console.warn('PUT principal falló, intento fallback', errPut?.response?.status);
        // fallback: intentar patch al mismo recurso
        try {
          res = await api.patch(userUrl, payload);
        } catch (errPatch) {
          console.warn('PATCH también falló, intentar escribir preferencias directamente', errPatch?.response?.status);
          // fallback: intentar PUT a /usuarios/:id/preferencias
          try {
            const prefUrl = `/usuarios/${possibleId}/preferencias`;
            res = await api.put(prefUrl, payload.preferencias || payload);
          } catch (errPref) {
            console.error('Todos los intentos de guardar fallaron', errPref);
            throw errPref || errPatch || errPut;
          }
        }
      }

      console.debug('Respuesta guardar hábitos:', res?.status, res?.data);

      // Intentar actualizar usuario local si el endpoint /auth/me existe
      try {
        const me = await api.get(cfg.paths.me);
        if (me && me.data) {
          try { saveUsuario(me.data); } catch (e) { console.warn('No se pudo guardar usuario localmente', e); }
        }
      } catch (e) {
        console.debug('GET /auth/me falló:', e?.response?.status || e?.message);
      }

      // refrescar stats
      await fetchStats();
      // mostrar éxito en modal
      setHabitSaveSuccess('Guardado correctamente');
      setSavingHabits(false);
      // cerrar modal después de 900ms para que el usuario vea el success
      setTimeout(() => {
        setHabitsModalOpen(false);
        setHabitSaveSuccess('');
      }, 900);
      return res;
    } catch (e) {
      console.error('Error guardando hábitos', e);
      const serverMsg = e.response?.data?.message || e.response?.data?.error || JSON.stringify(e.response?.data) || e.message || 'error';
      setError('Error guardando hábitos: ' + serverMsg);
      setHabitSaveError(serverMsg);
      setSavingHabits(false);
      return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 dashboard-container">
      <div className="max-w-[1400px] mx-auto space-y-5">
        {/* Header Card */}
        <div className="header-card">
          <div className="header-content">
            <div className="header-left">
              <h1 className="header-title">
                {greeting}, {displayName}!
                <span className="text-3xl"></span>
              </h1>
              <p className="header-subtitle">Tu bienestar mental es nuestra prioridad. Aquí tienes tu resumen del día.</p>
              <div className="header-buttons">
                <button onClick={() => navigate('/pomodoro')} className="btn-header"> Comenzar Sesión</button>
                <button className="btn-header">📅 Ver agenda</button>
                <button onClick={() => navigate('/tareas')} className="btn-header">➕ {editingId ? 'Editar tarea' : 'Crear tarea'}</button>
              </div>
            </div>
              <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                {showStreakBadge && (
                  <div className="streak-badge">
                    <p className="streak-label">Racha</p>
                    <p className="streak-value">🔥 <span>{safeStats?.racha ?? 0}</span></p>
                  </div>
                )}

                <div className="streak-badge" style={{minWidth: '180px', display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
                  <div style={{textAlign:'left', width: '100%'}}>
                    <p style={{fontSize:'0.80rem',opacity:0.95}}>Estado emocional</p>
                    <div style={{textAlign: 'center', marginTop: 8}} aria-hidden="true">
                      <span style={{fontSize: 40, lineHeight: 1}}>🧘‍♀️</span>
                    <p style={{fontWeight:700}}>{focused ? 'Enfocado' : 'Desenfocado'}</p>
                    
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
       

        {/* Stats Cards: dinámicas a partir de `stats` */}
        <div className="stats-grid">
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            color="purple"
            title="Conexión hoy"
            value={safeStats?.conexion_hoy}
            rawValue={safeStats?.conexion_hoy_minutos ?? safeStats?.conexion_hoy_minutes ?? safeStats?.conexion_hoy}
            formatter={(v) => formatMinutesToHuman(v)}
            percent={computePercentFromMinutes(safeStats?.conexion_hoy_minutos ?? safeStats?.conexion_hoy_minutes ?? safeStats?.conexion_hoy, 180)}
          />

          <StatCard
            icon={<Heart className="w-5 h-5" />}
            color="green"
            title="Meditación hoy"
            value={safeStats?.meditacion_minutos}
            rawValue={safeStats?.meditacion_minutos}
            formatter={(v) => (Number(v) ? `${v} min` : (v || '0min'))}
            percent={computePercentSimple(safeStats?.meditacion_minutos, 20)}
          />

          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            color="blue"
            title="Tareas"
            value={safeStats?.tareas_completadas_dia}
            rawValue={{ completed: safeStats?.tareas_completadas_dia, total: safeStats?.tareas_planificadas_dia ?? safeStats?.tareas_total_dia ?? safeStats?.tareas_objetivo }}
            formatter={(v) => formatTasksProgress(v)}
            percent={computePercentTasks(safeStats)}
          />

          <StatCard
            icon={<Zap className="w-5 h-5" />}
            color="orange"
            title="Práctica continua"
            value={safeStats?.practica_continua_dias}
            rawValue={safeStats?.practica_continua_dias}
            formatter={(v) => (v ? `${v} días` : '0 días')}
            percent={computePercentSimple(safeStats?.practica_continua_dias, 30)}
          />
        </div>

        {/* Charts Section */}
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-header">
              <h2 className="chart-title">Actividad Semanal</h2>
              <div className="chart-filters">
                <button
                  className={`filter-btn ${selectedMetric === 'conexion' ? 'active' : ''}`}
                  onClick={() => setSelectedMetric('conexion')}
                >
                  <span className="filter-dot purple"/>Conexión día
                </button>
                <button
                  className={`filter-btn ${selectedMetric === 'meditacion' ? 'active' : ''}`}
                  onClick={() => setSelectedMetric('meditacion')}
                >
                  <span className="filter-dot pink"/>Meditación
                </button>
                <button
                  className={`filter-btn ${selectedMetric === 'tareas' ? 'active' : ''}`}
                  onClick={() => setSelectedMetric('tareas')}
                >
                  <span className="filter-dot blue"/>Tareas
                </button>
              </div>
            </div>
            <div className="area-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    {/* Bottom: purple */}
                    <linearGradient id="colorPurple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.35}/>
                    </linearGradient>
                    {/* Middle: pink */}
                    <linearGradient id="colorPink" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EC4899" stopOpacity={0.85}/>
                      <stop offset="95%" stopColor="#EC4899" stopOpacity={0.28}/>
                    </linearGradient>
                    {/* Top: blue */}
                    <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.95}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.32}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2FF" />
                  <XAxis dataKey="name" tick={{ fill: '#6B7280' }} />
                  <YAxis tick={{ fill: '#9CA3AF' }} />
                  <Tooltip />
                  {/* Renderizar sólo la métrica seleccionada */}
                  {selectedMetric === 'conexion' && (
                    <Area type="monotone" dataKey="conexion" stroke="none" fill="url(#colorPurple)" fillOpacity={1} />
                  )}
                  {selectedMetric === 'meditacion' && (
                    <Area type="monotone" dataKey="meditacion" stroke="none" fill="url(#colorPink)" fillOpacity={1} />
                  )}
                  {selectedMetric === 'tareas' && (
                    <Area type="monotone" dataKey="tareas" stroke="none" fill="url(#colorBlue)" fillOpacity={1} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <h2 className="chart-title">Estado de Ánimo</h2>
            <div className="pie-chart-container" style={{flexDirection:'column',alignItems:'center'}}>
              <div style={{width: 220, height: 220}}>
                <PieChart width={220} height={220}>
                  <Pie data={moodData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {moodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </div>
            </div>
            <div className="mood-legend">
              {orderedMoodData.map((m, i) => (
                <div className="legend-item" key={m.name} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:10,height:10,borderRadius:999,background: m.color || COLORS[i % COLORS.length]}} />
                    <span className="legend-label">{m.name}</span>
                  </div>
                  <div style={{minWidth:36,textAlign:'right'}} className="legend-value">{m.pct}%</div>
                </div>
              ))}
            </div>
           
          </div>
        </div>

        {/* Habit Tracking */}
        <div className="habits-card">
          <div className="habits-header">
            <h2 className="text-lg font-bold text-gray-900">Seguimiento de Hábitos</h2>
            <button className="configure-btn" onClick={() => openHabitsModal()}>⚙️ Configurar</button>
          </div>
          <div className="habits-grid">
            <div className="habit-item">
              <div className="habit-header">
                <span className="habit-name">Madrugar</span>
                <span className="habit-counter">0-3</span>
              </div>
              <div className="habit-progress"><div className="habit-progress-fill purple" style={{width:'90%'}}/></div>
              <div className="habit-detail">06:00 AM</div>
              <button className="habit-mark purple">Marcar hoy</button>
            </div>

            <div className="habit-item">
              <div className="habit-header">
                <span className="habit-name">Ejercicio</span>
                <span className="habit-counter">0-1</span>
              </div>
              <div className="habit-progress"><div className="habit-progress-fill pink" style={{width:'60%'}}/></div>
              <div className="habit-detail">30 minutos</div>
              <button className="habit-mark pink">Marcar hoy</button>
            </div>

            <div className="habit-item">
              <div className="habit-header">
                <span className="habit-name">Lectura</span>
                <span className="habit-counter">0-5</span>
              </div>
              <div className="habit-progress"><div className="habit-progress-fill pink" style={{width:'100%'}}/></div>
              <div className="habit-detail">20 páginas</div>
              <button className="habit-mark pink">Marcar hoy</button>
            </div>

            <div className="habit-item">
              <div className="habit-header">
                <span className="habit-name">Agua</span>
                <span className="habit-counter">0-0</span>
              </div>
              <div className="habit-progress"><div className="habit-progress-fill purple" style={{width:'40%'}}/></div>
              <div className="habit-detail">4 vasos</div>
              <button className="habit-mark purple">Marcar hoy</button>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="action-cards-grid">
          <div className="action-card purple">
            <h3 className="action-card-title">Recordatorio</h3>
            <p className="action-card-description">¡Agenda tu sesión personal con un profesional!</p>
            <button className="action-card-btn purple">Comenzar ahora</button>
          </div>

          <div className="action-card pink">
            <h3 className="action-card-title">Mindfulness</h3>
            <p className="action-card-description">Explora ejercicios guiados de relajación.</p>
            <button className="action-card-btn pink">Explorar ahora</button>
          </div>

          <div className="action-card blue">
            <h3 className="action-card-title">Nuevas Tareas</h3>
            <p className="action-card-description">Organiza tus actividades diarias con gratitud.</p>
            <button onClick={() => navigate('/tareas')} className="action-card-btn blue">Crear Tareas</button>
          </div>

          <div className="action-card green">
            <h3 className="action-card-title">Kit Personal</h3>
            <p className="action-card-description">Accede a herramientas de bienestar emocional.</p>
            <button className="action-card-btn green">Conocer Kit</button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-card">
          <div className="activity-header">
            <h2 className="text-lg font-bold text-gray-900">Actividad Reciente</h2>
            
          </div>
          <div className="activity-list">
            {safeTareas.length === 0 ? (
              <>
                <div className="activity-item purple">
                  <div className="activity-avatar purple"><Zap className="w-5 h-5" /></div>
                  <div className="activity-content">
                    <h4 className="activity-title">Sesión de Concentración Completada</h4>
                    <p className="activity-description">Pomodoro Clásico · 25 minutos · Hace 1 hora</p>
                  </div>
                </div>

                <div className="activity-item green">
                  <div className="activity-avatar green"><Heart className="w-5 h-5" /></div>
                  <div className="activity-content">
                    <h4 className="activity-title">Meditación Matutina</h4>
                    <p className="activity-description">Respiración Consciente · 15 minutos · Hace 3 horas</p>
                  </div>
                </div>

                <div className="activity-item blue">
                  <div className="activity-avatar blue"><Calendar className="w-5 h-5" /></div>
                  <div className="activity-content">
                    <h4 className="activity-title">5 Tareas Completadas</h4>
                    <p className="activity-description">Proyecto de matemáticas, Lectura, Ejercicio · Hoy</p>
                  </div>
                </div>
              </>
            ) : (
              safeTareas.slice(0,6).map(t => {
                const colorClass = t.prioridad === 'alta' ? 'purple' : t.prioridad === 'media' ? 'green' : 'blue';
                const IconComp = t.prioridad === 'alta' ? Zap : t.prioridad === 'media' ? Heart : Calendar;
                const displayDate = formatDateIsoToDisplay(t.fecha_vencimiento);
                return (
                  <div
                    key={t.id_tarea}
                    className={`activity-item ${colorClass} clickable`}
                    role={t.id_tarea ? 'button' : undefined}
                    tabIndex={t.id_tarea ? 0 : -1}
                    onClick={() => { if (t.id_tarea) navigate(`/tareas/${t.id_tarea}`); }}
                    onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && t.id_tarea) navigate(`/tareas/${t.id_tarea}`); }}
                  >
                    <div className={`activity-avatar ${colorClass}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="activity-content">
                      <h4 className="activity-title">{t.titulo || 'Tarea sin título'}</h4>
                      <p className="activity-description">{t.descripcion?.slice(0,100) || ''}{t.descripcion && t.descripcion.length>100 ? '…' : ''}</p>
                    </div>
                    <div className="activity-meta">
                      <div className="text-xs text-gray-500">{t.estado || 'Pendiente'} • {t.prioridad || 'media'}</div>
                      <div className="text-xs text-gray-400">{displayDate}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

        {/* Habits configuration modal */}
        {habitsModalOpen && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:60}}>
            <div style={{width: 'min(720px,95%)', background:'#fff', borderRadius:12, padding:20, boxShadow:'0 10px 30px rgba(2,6,23,0.2)'}} role="dialog" aria-modal="true">
              <h3 style={{margin:0,marginBottom:12}}>Configurar Seguimiento de Hábitos</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <label style={{display:'flex',flexDirection:'column'}}>
                  <span style={{fontSize:12,marginBottom:6}}>Hora de madrugar</span>
                  <input type="time" value={habitForm.madrugar} onChange={(e)=>setHabitForm({...habitForm,madrugar:e.target.value})} />
                </label>
                <label style={{display:'flex',flexDirection:'column'}}>
                  <span style={{fontSize:12,marginBottom:6}}>Minutos de ejercicio</span>
                  <input type="number" min={0} value={habitForm.ejercicio_min} onChange={(e)=>setHabitForm({...habitForm,ejercicio_min: e.target.value})} />
                </label>
                <label style={{display:'flex',flexDirection:'column'}}>
                  <span style={{fontSize:12,marginBottom:6}}>Páginas de lectura</span>
                  <input type="number" min={0} value={habitForm.lectura_paginas} onChange={(e)=>setHabitForm({...habitForm,lectura_paginas: e.target.value})} />
                </label>
                <label style={{display:'flex',flexDirection:'column'}}>
                  <span style={{fontSize:12,marginBottom:6}}>Vasos de agua</span>
                  <input type="number" min={0} value={habitForm.agua_vasos} onChange={(e)=>setHabitForm({...habitForm,agua_vasos: e.target.value})} />
                </label>
              </div>
              {habitSaveError && <div style={{color:'#b91c1c',marginTop:12}} role="alert">{habitSaveError}</div>}
              {habitSaveSuccess && <div style={{color:'#065f46',marginTop:12}} role="status">{habitSaveSuccess}</div>}
              <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:16}}>
                <button onClick={closeHabitsModal} className="btn-header" style={{background:'#F3F4F6'}}>Cancelar</button>
                <button onClick={saveHabits} className="btn-header" style={{background:'#7C3AED',color:'#fff'}} disabled={savingHabits}>{savingHabits ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}