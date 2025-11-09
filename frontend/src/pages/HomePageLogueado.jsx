// frontend/src/pages/HomePageLogueado.jsx
import React, { useState, useEffect } from 'react';
import {Clock,Brain,Users,Star,Calendar,Flame,TrendingUp,Plus,Play,Trophy,} from 'lucide-react';
// Traducciones eliminadas — app en español
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import {LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,} from 'recharts';

export default function HomePageLogueado() {
    // Labels y textos en español fijos
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        nombre: '',
        sesionesHoy: 0,
        tiempoTotal: '0h',
        tareasCompletadas: 0,
        racha: 0,
        nivel: 1,
        puntos: 0,
    });
    const [proximasTareas, setProximasTareas] = useState([]);
    const [ultimasSesiones, setUltimasSesiones] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const [statsRes, tareasRes, sesionesRes, progresoSemanaRes] = await Promise.all([
                    api.get('/estadisticas'),
                    api.get('/tareas?estado=Pendiente&limit=5'),
                    api.get('/sesiones?limit=5'),
                    api.get('/progreso/semana'),
                ]);

                setStats(statsRes.data);
                setProximasTareas(Array.isArray(tareasRes.data) ? tareasRes.data : []);
                setUltimasSesiones(Array.isArray(sesionesRes.data) ? sesionesRes.data : []);

                // Usar datos reales de la semana
                const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                const data = diasSemana.map((name, index) => {
                    const diaData = progresoSemanaRes.data.dias[index];
                    return {
                        name,
                        sesiones: diaData ? diaData.sesiones_realizadas || 0 : 0,
                    };
                });
                setChartData(data);
            } catch (err) {
                console.error('Error al cargar datos:', err);
                setError('Error al cargar tus estadísticas');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [t]);

    const getTecnicaIcon = (tecnica) => {
        const lower = tecnica?.toLowerCase() || '';
        if (lower.includes('meditacion') || lower.includes('meditación')) return <Brain size={18} />;
        if (lower.includes('pomodoro')) return <Clock size={18} />;
        if (lower.includes('grupo') || lower.includes('sesion grupal')) return <Users size={18} />;
        return <Flame size={18} />;
    };

    const getTecnicaColor = (tecnica) => {
        const lower = tecnica?.toLowerCase() || '';
        if (lower.includes('meditacion') || lower.includes('meditación'))
            return 'bg-purple-100 text-purple-800';
        if (lower.includes('pomodoro')) return 'bg-blue-100 text-blue-800';
        if (lower.includes('grupo') || lower.includes('sesion grupal'))
            return 'bg-green-100 text-green-800';
        return 'bg-amber-100 text-amber-800';
    };

    const getPrioridadColor = (prioridad) => {
        switch (prioridad) {
            case 'alta': return 'border-l-red-500 bg-red-50';
            case 'media': return 'border-l-amber-500 bg-amber-50';
            default: return 'border-l-green-500 bg-green-50';
        }
    };

    const getPrioridadBadge = (prioridad) => {
        switch (prioridad) {
            case 'alta': return 'bg-red-100 text-red-800';
            case 'media': return 'bg-amber-100 text-amber-800';
            default: return 'bg-green-100 text-green-800';
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse border border-gray-100">
                            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100 animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            {/* Encabezado */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        Bienvenido de nuevo{' '}
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {stats.nombre || 'Usuario'}
                        </span>
                    </h1>
                    <p className="text-gray-600 mt-1">Tu progreso y actividades recientes</p>
                </div>

                <div className="flex items-center gap-3 bg-indigo-50 rounded-xl p-3 px-4">
                    <div className="bg-indigo-100 rounded-full p-2">
                        <Star className="text-indigo-600" size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-indigo-900 text-sm">Nivel {stats.nivel || 1}</div>
                        <div className="text-xs text-indigo-700">{stats.puntos || 0} pts</div>
                    </div>
                </div>
            </div>

            {/* Estadísticas clave */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {[
                    {
                        title: 'Sesiones hoy',
                        value: stats.sesionesHoy || 0,
                        icon: <Clock className="text-indigo-500" size={20} />,
                        change: `+${Math.min(3, stats.sesionesHoy)} desde ayer`,
                        changeColor: 'text-green-600',
                    },
                    {
                        title: 'Tiempo total',
                        value: stats.tiempoTotal || '0h',
                        icon: <Clock className="text-purple-500" size={20} />,
                        change: 'Este mes',
                        changeColor: 'text-gray-500',
                    },
                    {
                        title: 'Tareas completadas',
                        value: stats.tareasCompletadas || 0,
                        icon: <Calendar className="text-blue-500" size={20} />,
                        change:
                            stats.tareasCompletadas > 0
                                ? `${Math.min(100, Math.round((stats.tareasCompletadas / 10) * 100))}%`
                                : 'Comienza hoy',
                        changeColor: stats.tareasCompletadas > 0 ? 'text-blue-600' : 'text-gray-500',
                    },
                    {
                        title: 'Racha',
                        value: `${stats.racha || 0} días`,
                        icon: <Flame className="text-red-500" size={20} />,
                        change: stats.racha > 0 ? 'Sigue así' : 'Comienza tu racha',
                        changeColor: stats.racha > 0 ? 'text-amber-600' : 'text-gray-500',
                    },
                ].map((item, i) => (
                    <div
                        key={i}
                        className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="text-sm font-medium text-gray-600">{item.title}</h3>
                            {item.icon}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                        <div className={`mt-2 text-xs font-medium ${item.changeColor}`}>{item.change}</div>
                    </div>
                ))}
            </div>

            {/* Gráfico de progreso */}
            <div className="bg-white rounded-xl p-6 mb-8 border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-5">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp size={20} className="text-indigo-600" />
                        {t('progress_chart')}
                    </h2>
                    <div className="flex space-x-2 mt-2 sm:mt-0">
                        <button className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-md font-medium">
                            {t('week')}
                        </button>
                        <button className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-md font-medium">
                            {t('month')}
                        </button>
                    </div>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '10px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                }}
                                labelStyle={{ fontWeight: '600', color: '#4b5563' }}
                                formatter={(value) => [`${value} sesiones`, 'Sesiones']}
                            />
                            <Line
                                type="monotone"
                                dataKey="sesiones"
                                stroke="#7c3aed"
                                strokeWidth={2}
                                dot={{ fill: '#7c3aed', r: 5 }}
                                activeDot={{ r: 7, stroke: '#7c3aed', strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Actividades y tareas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
                {/* Últimas sesiones */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-lg font-bold text-gray-900">{t('recent_activities')}</h2>
                        <Link to="/sesiones" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                            {t('view_all')}
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {ultimasSesiones.length > 0 ? (
                            ultimasSesiones.map((sesion, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${getTecnicaColor(sesion.tecnica_nombre)}`}>
                                            {getTecnicaIcon(sesion.tecnica_nombre)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-800">{sesion.tecnica_nombre}</div>
                                            <div className="text-xs text-gray-600">
                                                {new Date(sesion.inicio).toLocaleDateString()} • {sesion.duracion || 0} min
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold text-indigo-600">+{sesion.puntos || 0} pts</div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                {t('no_recent_activities')}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => navigate('/tecnica')}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-indigo-600 bg-indigo-50 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
                    >
                        <Play size={16} />
                        {t('start_new_session')}
                    </button>
                </div>

                {/* Próximas tareas */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-lg font-bold text-gray-900">{t('upcoming_tasks')}</h2>
                        <Link to="/tareas" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                            {t('view_all')}
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {proximasTareas.length > 0 ? (
                            proximasTareas.map((tarea, index) => (
                                <div
                                    key={index}
                                    className={`pl-3 py-3 rounded-r-lg border-l-4 ${getPrioridadColor(tarea.prioridad)}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="font-medium text-gray-800">{tarea.titulo}</div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${getPrioridadBadge(tarea.prioridad)}`}>
                                            {tarea.prioridad}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1 line-clamp-1">
                                        {tarea.descripcion || t('no_description')}
                                    </div>
                                    <div className="mt-2 flex justify-between text-xs text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} /> {new Date(tarea.fecha_vencimiento).toLocaleDateString()}
                                        </div>
                                        <button className="text-indigo-600 hover:text-indigo-800 font-medium">
                                            {t('mark_complete')}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                {t('no_upcoming_tasks')}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => navigate('/tareas/crear')}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-dashed border-gray-400 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        <Plus size={16} />
                        {t('add_new_task')}
                    </button>
                </div>
            </div>

            {/* Logros */}
            <div className="mt-9 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-6 border border-indigo-100">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-5">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Trophy className="text-amber-500" size={20} />
                        {t('achievements_and_rewards')}
                    </h2>
                    <Link
                        to="/recompensas"
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1"
                    >
                        {t('view_all')} →
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((index) => (
                        <Link
                            key={index}
                            to="/recompensas"
                            className="bg-white rounded-lg p-4 text-center border border-gray-200 hover:border-indigo-300 transition-colors"
                        >
                            <div className="w-10 h-10 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-2">
                                <Star className="text-amber-500" size={18} />
                            </div>
                            <div className="font-medium text-gray-800 text-sm">Recompensa {index}</div>
                            <div className="text-xs text-gray-600">{index * 50} pts</div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}