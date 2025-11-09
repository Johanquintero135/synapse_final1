// frontend/src/pages/SesionesTareas.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, CheckCircle, XCircle, Filter, Search } from 'lucide-react';
import api from '../services/api';
import cfg from '../services/config';

export default function SesionesTareas() {
    const { t } = useTranslation();
    const [sesiones, setSesiones] = useState([]);
    const [tareas, setTareas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroEstado, setFiltroEstado] = useState('todas');
    const [busqueda, setBusqueda] = useState('');
    const [modalNuevaSesion, setModalNuevaSesion] = useState(false);
    const [nuevaSesion, setNuevaSesion] = useState({
        nombre: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        tareas_seleccionadas: []
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);

            // Cargar sesiones y tareas en paralelo
            const [sesionesRes, tareasRes] = await Promise.all([
                api.get('/sesiones'),
                api.get(cfg.paths.tareas)
            ]);

            setSesiones(Array.isArray(sesionesRes.data) ? sesionesRes.data : []);
            setTareas(Array.isArray(tareasRes.data) ? tareasRes.data : []);
        } catch (err) {
            console.error('Error al cargar datos:', err);
            setError('No se pudieron cargar las sesiones y tareas');
        } finally {
            setLoading(false);
        }
    };

    const crearSesion = async () => {
        if (!nuevaSesion.nombre.trim() || nuevaSesion.tareas_seleccionadas.length === 0) {
            setError('El nombre es obligatorio y debes seleccionar al menos una tarea');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                nombre: nuevaSesion.nombre.trim(),
                descripcion: nuevaSesion.descripcion.trim() || null,
                fecha_inicio: nuevaSesion.fecha_inicio || new Date().toISOString(),
                fecha_fin: nuevaSesion.fecha_fin || null,
                tareas_ids: nuevaSesion.tareas_seleccionadas
            };

            await api.post('/sesiones/tareas', payload);
            await cargarDatos();
            cerrarModal();
        } catch (err) {
            console.error('Error al crear sesión:', err);
            setError(err.response?.data?.error || 'No se pudo crear la sesión');
        } finally {
            setLoading(false);
        }
    };

    const toggleTareaSeleccionada = (tareaId) => {
        setNuevaSesion(prev => {
            if (prev.tareas_seleccionadas.includes(tareaId)) {
                return {
                    ...prev,
                    tareas_seleccionadas: prev.tareas_seleccionadas.filter(id => id !== tareaId)
                };
            } else {
                return {
                    ...prev,
                    tareas_seleccionadas: [...prev.tareas_seleccionadas, tareaId]
                };
            }
        });
    };

    const cerrarModal = () => {
        setModalNuevaSesion(false);
        setNuevaSesion({
            nombre: '',
            descripcion: '',
            fecha_inicio: '',
            fecha_fin: '',
            tareas_seleccionadas: []
        });
        setError(null);
    };

    const tareasFiltradas = tareas.filter(tarea => {
        const coincideBusqueda = tarea.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
            (tarea.descripcion && tarea.descripcion.toLowerCase().includes(busqueda.toLowerCase()));
        const coincideEstado = filtroEstado === 'todas' || tarea.estado === filtroEstado;
        return coincideBusqueda && coincideEstado;
    });

    const sesionesFiltradas = sesiones.filter(sesion => {
        const coincideBusqueda = sesion.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            (sesion.descripcion && sesion.descripcion.toLowerCase().includes(busqueda.toLowerCase()));
        return coincideBusqueda;
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('task_sessions')}</h1>
                    <p className="text-gray-500">
                        {t('task_sessions_desc', 'Organiza tus tareas en sesiones temáticas para mejorar tu productividad')}
                    </p>
                </div>

                <button
                    onClick={() => setModalNuevaSesion(true)}
                    style={{
                        background: 'linear-gradient(135deg, #7c3aed, #667eea)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 6px rgba(124, 58, 237, 0.3)'
                    }}
                >
                    <Plus size={18} />
                    {t('new_session')}
                </button>
            </div>

            {/* Filtros y búsqueda */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                    <Search size={18} style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8'
                    }} />
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder={t('search_sessions_tasks', 'Buscar sesiones o tareas...')}
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 40px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            fontSize: '14px'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            background: 'white'
                        }}
                    >
                        <option value="todas">{t('all_tasks', 'Todas las tareas')}</option>
                        <option value="Pendiente">{t('pending', 'Pendientes')}</option>
                        <option value="EnProgreso">{t('in_progress', 'En Progreso')}</option>
                        <option value="Completado">{t('completed', 'Completadas')}</option>
                    </select>
                </div>
            </div>

            {/* Vista de sesiones */}
            <div className="mb-12">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar size={20} />
                    {t('my_sessions', 'Mis Sesiones')}
                </h2>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 animate-pulse">
                                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-12 bg-gray-100 rounded mt-4"></div>
                            </div>
                        ))}
                    </div>
                ) : sesionesFiltradas.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <Calendar className="mx-auto text-gray-400" size={48} />
                        <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                            {t('no_sessions_yet', 'Aún no tienes sesiones')}
                        </h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            {t('create_first_session_desc', 'Crea tu primera sesión para empezar a organizar tus tareas de forma más eficiente')}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sesionesFiltradas.map(sesion => (
                            <div
                                key={sesion.id_sesion}
                                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
                                onClick={() => {/* Navegar a detalles de sesión */ }}
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">{sesion.nombre}</h3>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${sesion.estado === 'Completada' ? 'bg-green-100 text-green-800' :
                                                sesion.estado === 'EnProgreso' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {sesion.estado === 'Completada' ? t('completed') :
                                                sesion.estado === 'EnProgreso' ? t('in_progress') : t('pending')}
                                        </div>
                                    </div>

                                    {sesion.descripcion && (
                                        <p className="text-gray-600 mb-4 line-clamp-2">{sesion.descripcion}</p>
                                    )}

                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Calendar size={16} className="mr-2" />
                                            {new Date(sesion.fecha_inicio).toLocaleDateString()}
                                            {sesion.fecha_fin && ` - ${new Date(sesion.fecha_fin).toLocaleDateString()}`}
                                        </div>

                                        <div className="flex items-center text-sm text-gray-500">
                                            <Clock size={16} className="mr-2" />
                                            {sesion.tareas?.length || 0} {t('tasks')}
                                        </div>

                                        {sesion.progreso !== undefined && (
                                            <div className="mt-3">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600">{t('progress')}</span>
                                                    <span className="font-medium">{Math.round(sesion.progreso)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-indigo-600 rounded-full h-2"
                                                        style={{ width: `${Math.min(sesion.progreso || 0, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {sesion.tareas && sesion.tareas.length > 0 && (
                                    <div className="px-6 pb-6 mt-4 border-t border-gray-100">
                                        <h4 className="text-sm font-medium text-gray-600 mb-2">
                                            {t('session_tasks', 'Tareas de la sesión')}
                                        </h4>
                                        <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                            {sesion.tareas.slice(0, 3).map(tarea => (
                                                <div key={tarea.id_tarea} className="flex items-start">
                                                    {tarea.estado === 'Completado' ? (
                                                        <CheckCircle className="text-green-500 mr-2 flex-shrink-0 mt-1" size={16} />
                                                    ) : (
                                                        <XCircle className="text-gray-400 mr-2 flex-shrink-0 mt-1" size={16} />
                                                    )}
                                                    <span className={`text-sm ${tarea.estado === 'Completado' ? 'text-gray-400 line-through' : 'text-gray-700'
                                                        }`}>
                                                        {tarea.titulo}
                                                    </span>
                                                </div>
                                            ))}
                                            {sesion.tareas.length > 3 && (
                                                <p className="text-xs text-indigo-600 mt-1">
                                                    +{sesion.tareas.length - 3} {t('more_tasks', 'más tareas')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Vista de tareas disponibles */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle size={20} />
                    {t('available_tasks', 'Tareas Disponibles')}
                </h2>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : tareasFiltradas.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">{t('no_tasks_found', 'No se encontraron tareas que coincidan con tu búsqueda')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {tareasFiltradas.map(tarea => (
                            <div
                                key={tarea.id_tarea}
                                className={`bg-white rounded-lg border ${tarea.estado === 'Completado'
                                        ? 'border-green-200 bg-green-50'
                                        : 'border-gray-200'
                                    } p-3 hover:shadow-md transition-all`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className={`font-medium ${tarea.estado === 'Completado'
                                                ? 'text-gray-400 line-through'
                                                : 'text-gray-800'
                                            }`}>
                                            {tarea.titulo}
                                        </h4>
                                        {tarea.sala_id && (
                                            <p className="text-xs text-indigo-600 mt-1">
                                                {t('in_session', 'En sesión')} {tarea.sala_id.substring(0, 5)}...
                                            </p>
                                        )}
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-medium ${tarea.prioridad === 'alta' ? 'bg-red-100 text-red-800' :
                                            tarea.prioridad === 'media' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                        }`}>
                                        {tarea.prioridad}
                                    </div>
                                </div>
                                {tarea.descripcion && (
                                    <p className={`text-sm mt-2 ${tarea.estado === 'Completado'
                                            ? 'text-gray-400 line-through'
                                            : 'text-gray-600'
                                        }`}>
                                        {tarea.descripcion.substring(0, 50)}{tarea.descripcion.length > 50 ? '...' : ''}
                                    </p>
                                )}
                                {tarea.fecha_vencimiento && (
                                    <p className={`text-xs mt-2 flex items-center ${tarea.estado === 'Completado'
                                            ? 'text-gray-400'
                                            : new Date(tarea.fecha_vencimiento) < new Date()
                                                ? 'text-red-500'
                                                : 'text-gray-500'
                                        }`}>
                                        <Calendar size={12} className="mr-1" />
                                        {new Date(tarea.fecha_vencimiento).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal para crear nueva sesión */}
            {modalNuevaSesion && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }} onClick={cerrarModal}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        width: '90%',
                        maxWidth: '600px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        position: 'relative'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '24px' }}>
                            <h2 className="text-xl font-bold text-gray-800 mb-6">
                                {t('create_new_session', 'Crear nueva sesión')}
                            </h2>

                            {error && (
                                <div style={{
                                    background: '#fee2e2',
                                    color: '#b91c1c',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    marginBottom: '16px'
                                }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontWeight: '500',
                                    color: '#334155'
                                }}>
                                    {t('session_name', 'Nombre de la sesión')}
                                </label>
                                <input
                                    type="text"
                                    value={nuevaSesion.nombre}
                                    onChange={(e) => setNuevaSesion({ ...nuevaSesion, nombre: e.target.value })}
                                    placeholder={t('session_name_placeholder', 'Ej: Estudio Matemáticas')}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '16px'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontWeight: '500',
                                    color: '#334155'
                                }}>
                                    {t('description', 'Descripción')} (opcional)
                                </label>
                                <textarea
                                    value={nuevaSesion.descripcion}
                                    onChange={(e) => setNuevaSesion({ ...nuevaSesion, descripcion: e.target.value })}
                                    placeholder={t('session_description_placeholder', 'Describe los objetivos de esta sesión...')}
                                    rows="3"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '12px',
                                    fontWeight: '600',
                                    color: '#1e293b'
                                }}>
                                    {t('select_tasks', 'Seleccionar tareas')}
                                </label>

                                {tareas.length === 0 ? (
                                    <p className="text-gray-500 text-sm">
                                        {t('no_tasks_available', 'No hay tareas disponibles. Crea algunas tareas primero.')}
                                    </p>
                                ) : (
                                    <div style={{
                                        maxHeight: '300px',
                                        overflowY: 'auto',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        padding: '8px'
                                    }}>
                                        {tareas.map(tarea => (
                                            <label
                                                key={tarea.id_tarea}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '8px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    background: nuevaSesion.tareas_seleccionadas.includes(tarea.id_tarea)
                                                        ? 'rgba(124, 58, 237, 0.1)'
                                                        : 'transparent',
                                                    '&:hover': {
                                                        background: 'rgba(124, 58, 237, 0.05)'
                                                    }
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={nuevaSesion.tareas_seleccionadas.includes(tarea.id_tarea)}
                                                    onChange={() => toggleTareaSeleccionada(tarea.id_tarea)}
                                                    style={{ marginRight: '10px' }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{
                                                        fontWeight: 500,
                                                        color: tarea.estado === 'Completado' ? '#94a3b8' : '#1e293b',
                                                        textDecoration: tarea.estado === 'Completado' ? 'line-through' : 'none'
                                                    }}>
                                                        {tarea.titulo}
                                                    </div>
                                                    {tarea.descripcion && (
                                                        <div style={{
                                                            fontSize: '14px',
                                                            color: '#64748b',
                                                            marginTop: '2px',
                                                            maxHeight: '36px',
                                                            overflow: 'hidden'
                                                        }}>
                                                            {tarea.descripcion}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{
                                                    background: tarea.prioridad === 'alta' ? '#fee2e2' :
                                                        tarea.prioridad === 'media' ? '#fef3c7' : '#dcfce7',
                                                    color: tarea.prioridad === 'alta' ? '#b91c1c' :
                                                        tarea.prioridad === 'media' ? '#b45309' : '#15803d',
                                                    fontSize: '12px',
                                                    padding: '2px 6px',
                                                    borderRadius: '10px',
                                                    fontWeight: 500
                                                }}>
                                                    {tarea.prioridad}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '12px',
                                marginTop: '24px',
                                paddingTop: '16px',
                                borderTop: '1px solid #e2e8f0'
                            }}>
                                <button
                                    onClick={cerrarModal}
                                    style={{
                                        background: 'transparent',
                                        color: '#4b5563',
                                        border: '1px solid #e2e8f0',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        fontWeight: 500,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {t('cancel', 'Cancelar')}
                                </button>
                                <button
                                    onClick={crearSesion}
                                    disabled={loading || !nuevaSesion.nombre.trim() || nuevaSesion.tareas_seleccionadas.length === 0}
                                    style={{
                                        background: loading || !nuevaSesion.nombre.trim() || nuevaSesion.tareas_seleccionadas.length === 0
                                            ? '#9ca3af'
                                            : 'linear-gradient(135deg, #7c3aed, #667eea)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        fontWeight: 500,
                                        cursor: loading ? 'wait' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    {loading ? (
                                        <span style={{ width: 16, height: 16, border: '2px solid white', borderLeft: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                    ) : (
                                        <Plus size={16} />
                                    )}
                                    {t('create_session', 'Crear Sesión')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}