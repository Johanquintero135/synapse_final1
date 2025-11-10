import React, { useEffect, useState } from 'react';
import { Edit2, Phone, Calendar, MapPin, Trash2, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import EditProfileModal from '../components/EditProfileModal';
import { logout } from '../services/auth';
// Import styles for the Edit Profile modal and related UI
import '../components/ProfileSettings.css';
import '../components/ProfileStats.css';

export default function Profile({ defaultTab = 'info' }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const cached = localStorage.getItem('synapse_usuario');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [tareas, setTareas] = useState([]);
  const [logros, setLogros] = useState([
    { nombre: 'Meditador Novato', icono: '🎯', unlocked: false },
    { nombre: 'Concentración 7 días', icono: '🎯', unlocked: false },
    { nombre: 'Primer Pomodoro', icono: '🎯', unlocked: false },
    { nombre: 'Explorador Zen', icono: '🎯', unlocked: false }
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('tab') || defaultTab;
    } catch (e) {
      return defaultTab;
    }
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [cpCurrent, setCpCurrent] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [cpError, setCpError] = useState('');
  const [cpSuccess, setCpSuccess] = useState('');
  const [cpLoading, setCpLoading] = useState(false);
  const [showCpCurrent, setShowCpCurrent] = useState(false);
  const [showCpNew, setShowCpNew] = useState(false);
  const [showCpConfirm, setShowCpConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/auth/me');
        setUsuario(res.data);
      } catch (e) {
        console.error('Error cargando usuario:', e);
        setUsuario({
          username: 'Usuario',
          telefono: '',
          ubicacion: '',
          avatar_url: null,
          nivel: 1,
          sesiones: 0,
          meditadas: '0h',
          descripcion: ''
        });
      }

      try {
        const res2 = await api.get('/tareas');
        setTareas(Array.isArray(res2.data) ? res2.data : res2.data.results || []);
      } catch (e) {
        console.error('Error cargando tareas:', e);
        setTareas([]);
      }
      // Cargar recompensas/logros (mostrar unlocked si el backend lo devuelve)
      try {
        const resp = await api.get('/recompensa');
        if (Array.isArray(resp.data)) {
          // normalizar formato esperado
          const normalized = resp.data.map(r => ({
            nombre: r.nombre || r.nombre_recompensa || 'Logro',
            descripcion: r.descripcion || r.requisitos || '',
            icono: r.icono || '🏅',
            unlocked: !!r.unlocked
          }));
          setLogros(normalized);
        }
      } catch (e) {
        console.debug('No se pudieron cargar recompensas:', e?.message || e);
      }
    };
    load();
  }, []);

  const handleDeleteAccount = async () => {
    try {
      await api.post('/auth/delete-account', { password });
      logout();
    } catch (error) {
      setError(error.response?.data?.error || 'Error al eliminar la cuenta');
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      // No password required for logout-all from the client side. Server should validate token/session.
      await api.post('/auth/logout-all-devices');
      // Clear local session immediately
      logout();
    } catch (error) {
      setError(error.response?.data?.error || 'Error al cerrar sesión en todos los dispositivos');
    }
  };

  function validatePasswordLocal(password) {
    if (!password || password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/[A-Z]/.test(password)) return 'La contraseña debe incluir al menos una letra mayúscula.';
    if (!/[a-z]/.test(password)) return 'La contraseña debe incluir al menos una letra minúscula.';
    if (!/[0-9]/.test(password)) return 'La contraseña debe incluir al menos un número.';
    if (!/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(password)) return 'La contraseña debe incluir al menos un carácter especial.';
    return null;
  }

  const handleChangePassword = async () => {
    setCpError('');
    setCpSuccess('');
    if (!cpCurrent) return setCpError('Introduce tu contraseña actual.');
    if (cpNew !== cpConfirm) return setCpError('La nueva contraseña y su confirmación no coinciden.');
    const v = validatePasswordLocal(cpNew);
    if (v) return setCpError(v);
    setCpLoading(true);
    try {
      const res = await api.put('/auth/change-password', { current_password: cpCurrent, new_password: cpNew });
      setCpSuccess(res.data?.message || 'Contraseña actualizada correctamente.');
      setCpCurrent(''); setCpNew(''); setCpConfirm('');
      // Close after short delay
      setTimeout(() => { setShowChangePassword(false); setCpSuccess(''); }, 1200);
    } catch (err) {
      setCpError(err.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setCpLoading(false);
    }
  };

  const getInitials = (nameOrUser) => {
    if (!nameOrUser) return 'U';
    let str = '';
    if (typeof nameOrUser === 'string') {
      str = nameOrUser;
    } else if (typeof nameOrUser === 'object') {
      str = nameOrUser.nombre_completo || nameOrUser.name || nameOrUser.username || nameOrUser.username || nameOrUser.email || '';
    } else {
      str = String(nameOrUser || '');
    }
    if (!str) return 'U';
    return String(str)
      .split(' ')
      .map(n => (n && n[0]) ? n[0] : '')
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const displayName = usuario?.nombre_completo || usuario?.username || usuario?.name || 'Usuario'
  const displayEmail = usuario?.correo || usuario?.email || '';

  const handleModalUpdated = (updatedUser) => {
    setUsuario(updatedUser);
    try {
      localStorage.setItem('synapse_usuario', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!usuario) return;
    if (!window.confirm('¿Eliminar la foto de perfil?')) return;
    try {
      const fd = new FormData();
      fd.append('remove_avatar', '1');
      const res = await api.put('/auth/me', fd);
      setUsuario(res.data);
      try { localStorage.setItem('synapse_usuario', JSON.stringify(res.data)); } catch(e){}
    } catch (e) {
      console.error('Error eliminando avatar:', e);
      alert('No se pudo eliminar la foto');
    }
  };

  const handleDescripcionBlur = async () => {
    if (!usuario) return;
    try {
      const fd = new FormData();
      fd.append('descripcion', usuario.descripcion || '');
      const res = await api.put('/auth/me', fd);
      setUsuario(res.data);
      try {
        localStorage.setItem('synapse_usuario', JSON.stringify(res.data));
      } catch (e) {
        console.error('Error guardando en localStorage:', e);
      }
    } catch (e) {
      console.error('Error actualizando descripción:', e);
      alert('No se pudo actualizar la descripción');
    }
  };

  // Helpers para la sección de estadísticas
  const formatTiempo = (minutos) => {
    if (minutos == null) return '0m';
    if (isNaN(minutos)) return minutos;
    if (minutos >= 60) {
      const h = Math.floor(minutos / 60);
      const m = Math.round(minutos % 60);
      return `${h}h${m ? ' ' + m + 'm' : ''}`;
    }
    return `${minutos}m`;
  };

  const levelCap = (user) => {
    // Umbral simple por nivel (puedes ajustar según la fórmula real)
    const lvl = (user?.nivel) || 1;
    return 3000; // valor fijo para mostrar la barra; reemplazar si hay regla real
  };

  const estimateSemana = (user) => {
    // Estimación simple: 8 sesiones por semana por cada 100 sesiones totales
    const total = user?.sesiones_totales || 0;
    return `${Math.min(total, Math.round(total * 0.08) || 0)} sesiones`;
  };

  const estimateMes = (user) => {
    const total = user?.sesiones_totales || 0;
    return `${Math.min(total, Math.round(total * 0.34) || 0)} sesiones`;
  };

  const estimatePromedioDiario = (user) => {
    const minutos = user?.tiempo_total_minutos || 0;
    // promedio sobre 30 días
    const avg = Math.round(minutos / 30) || 0;
    return `${avg} min`;
  };

  if (!usuario) return <div style={{ padding: 20 }}>Cargando perfil...</div>;

  return (
    <div style={{
      maxWidth: 1400,
      margin: '0 auto',
      padding: 20,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, color:'var(--text-primary)' }}>
          Mi Perfil
        </h1>
        <p style={{ color: 'var(--text-primary)', fontSize: 14, margin: '4px 0 0 0' }}>
          Gestiona tu información personal y preferencias
        </p>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          onClick={() => setTab('info')}
          className={`profile-tab-button ${tab === 'info' ? 'active' : ''}`}
        >
          Información
        </button>
        <button
          onClick={() => setTab('stats')}
          className={`profile-tab-button ${tab === 'stats' ? 'active' : ''}`}
        >
          Estadísticas
        </button>
        <button
          onClick={() => setTab('settings')}
          className={`profile-tab-button ${tab === 'settings' ? 'active' : ''}`}
        >
          Configuración
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'settings' && (
        <div className="settings-section">
          {error && <div className="error-message">{error}</div>}
          
          <div className="settings-group">
            <h3>Seguridad de la Cuenta</h3>
            <div className="settings-option">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Cambiar contraseña</div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Actualiza tu contraseña de acceso</div>
              </div>
              <button
                className="action-button primary-button"
                onClick={() => {
                  setCpCurrent(''); setCpNew(''); setCpConfirm(''); setCpError(''); setCpSuccess('');
                  setShowChangePassword(true);
                }}
              >
                Cambiar contraseña
              </button>
            </div>

            <div className="settings-option">
              <button 
                className="danger-button"
                onClick={() => setShowLogoutAllConfirm(true)}
              >
                Cerrar sesión en todos los dispositivos
              </button>
            </div>

            <div className="settings-option">
              <button 
                className="danger-button"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Eliminar cuenta
              </button>
            </div>
          </div>

          {/* Modal de confirmación para cerrar sesión en todos los dispositivos */}
          {showLogoutAllConfirm && (
            <div className="modal-backdrop">
              <div className="confirmation-modal">
                <h3>Cerrar sesión en todos los dispositivos</h3>
                <p>¿Deseas cerrar la sesión en todos los dispositivos conectados? Esta acción cerrará tus sesiones activas, pero no eliminará tu cuenta.</p>
                <div className="modal-actions">
                  <button 
                    className="cancel-button"
                    onClick={() => {
                      setShowLogoutAllConfirm(false);
                      setPassword('');
                      setError('');
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="confirm-button"
                    onClick={handleLogoutAllDevices}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de confirmación para eliminar cuenta */}
          {showDeleteConfirm && (
            <div className="modal-backdrop">
              <div className="confirmation-modal">
                <h3>Eliminar cuenta</h3>
                <p>¿Estás seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer.</p>
                <p>Por favor, introduce tu contraseña para confirmar:</p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                />
                <div className="modal-actions">
                  <button 
                    className="cancel-button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setPassword('');
                      setError('');
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="confirm-button danger"
                    onClick={handleDeleteAccount}
                  >
                    Eliminar cuenta
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal para cambiar contraseña */}
          {showChangePassword && (
            <div className="modal-backdrop">
              <div className="confirmation-modal">
                <h3>Cambiar contraseña</h3>
                <p>Introduce tu contraseña actual y la nueva contraseña.</p>
                {cpError && <div className="error-message" style={{ marginBottom: 12 }}>{cpError}</div>}
                {cpSuccess && <div className="" style={{ marginBottom: 12, color: 'green' }}>{cpSuccess}</div>}
                <div style={{ display: 'grid', gap: 12 }}>
                  <div className="password-field">
                    <input
                      className="form-input password-input"
                      type={showCpCurrent ? 'text' : 'password'}
                      value={cpCurrent}
                      onChange={(e) => setCpCurrent(e.target.value)}
                      placeholder="Contraseña actual"
                    />
                    <button
                      type="button"
                      className="pw-toggle"
                      onClick={() => setShowCpCurrent(s => !s)}
                      aria-label={showCpCurrent ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showCpCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div className="password-field">
                    <input
                      className="form-input password-input"
                      type={showCpNew ? 'text' : 'password'}
                      value={cpNew}
                      onChange={(e) => setCpNew(e.target.value)}
                      placeholder="Nueva contraseña"
                    />
                    <button
                      type="button"
                      className="pw-toggle"
                      onClick={() => setShowCpNew(s => !s)}
                      aria-label={showCpNew ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showCpNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div className="password-field">
                    <input
                      className="form-input password-input"
                      type={showCpConfirm ? 'text' : 'password'}
                      value={cpConfirm}
                      onChange={(e) => setCpConfirm(e.target.value)}
                      placeholder="Confirmar nueva contraseña"
                    />
                    <button
                      type="button"
                      className="pw-toggle"
                      onClick={() => setShowCpConfirm(s => !s)}
                      aria-label={showCpConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showCpConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="modal-actions" style={{ marginTop: 14 }}>
                  <button
                    className="cancel-button"
                    onClick={() => { setShowChangePassword(false); setCpError(''); setCpSuccess(''); }}
                  >
                    Cancelar
                  </button>
                  <button
                    className="confirm-button"
                    onClick={handleChangePassword}
                    disabled={cpLoading}
                  >
                    {cpLoading ? 'Guardando...' : 'Guardar contraseña'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Información */}
      {tab === 'info' && (
        <div className="profile-info">
          {/* Profile Card */}
          <div className="hover-card profile-header" style={{
            background: 'var(--primary-gradient)',
            borderRadius: 20,
            padding: 32,
            color: 'white',
            marginBottom: 24,
            boxShadow: '0 10px 30px rgba(168, 85, 247, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ marginRight: 20, position: 'relative' }}>
                  <div
                        style={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: usuario?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      fontWeight: 800,
                      color: 'white',
                      border: '3px solid rgba(255,255,255,0.8)',
                      boxShadow: '0 8px 20px rgba(16,24,40,0.12)'
                    }}
                  >
                    {usuario?.avatar_url ? (
                      <img
                        src={usuario.avatar_url}
                        alt="avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span>{getInitials(usuario)}</span>
                    )}
                  </div>
                  {usuario?.avatar_url && (
                    <button
                      onClick={handleRemoveAvatar}
                      title="Eliminar foto"
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: '1px solid var(--bg-accent)',
                        background: 'var(--bg-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        cursor: 'pointer',
                        boxShadow: '0 6px 14px rgba(16,24,40,0.08)'
                      }}
                    >
                      <Trash2 size={14} color="var(--primary-purple-dark)" />
                    </button>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{displayName}</div>
                  <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>{displayEmail}</div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => setModalOpen(true)}
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: 10,
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Edit2 size={16} />
                  Editar perfil
                </button>
              </div>
            </div>
          </div>

          {/* Grid de información */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
            {/* Información Personal */}
            <div className="hover-card" style={{
              background: 'var(--bg-primary)',
              borderRadius: 16,
              padding: 24,
              boxShadow: 'var(--shadow-light)'
            }}>
              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)'
              }}>
                Información Personal
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: 'var(--bg-accent)', padding: 8, borderRadius: 8 }}>
                    <Phone size={18} color="#a855f7" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Teléfono</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {usuario?.telefono || '—'}
                    </div>
                  </div>
                </div>


                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: 'var(--bg-accent)', padding: 8, borderRadius: 8 }}>
                    <MapPin size={18} color="#a855f7" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Ubicación</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {usuario?.ubicacion || '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Logros Recientes */}
            <div className="hover-card" style={{
              background: 'var(--bg-primary)',
              borderRadius: 16,
              padding: 24,
              boxShadow: 'var(--shadow-light)'
            }}>
              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)'
              }}>
                Logros Recientes
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {logros.map((logro, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      background: 'var(--bg-secondary)',
                      borderRadius: 10,
                      border: '1px solid var(--bg-accent)'
                    }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--primary-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: 18
                    }}>
                      {logro.icono}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
                      {logro.nombre}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sobre mí */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 24,
            marginTop: 24
          }}>
            <div className="hover-card" style={{
              background: 'var(--bg-primary)',
              borderRadius: 16,
              padding: 24,
              boxShadow: 'var(--shadow-light)'
            }}>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)'
              }}>
                Sobre mí
              </h3>
              <input
                type="text"
                placeholder="Añade una breve biografía sobre ti."
                value={usuario.descripcion || ''}
                onChange={e => setUsuario(u => ({ ...u, descripcion: e.target.value }))}
                onBlur={handleDescripcionBlur}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid var(--border-default)',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Estadísticas */}
      {tab === 'stats' && (
        <div className="stats-root">
          <h3 className="stats-title">Estadísticas</h3>

          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-value">{usuario?.nivel ?? 0}</div>
              <div className="stat-label">Nivel actual</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⬜</div>
              <div className="stat-value">{usuario?.sesiones_totales ?? 0}</div>
              <div className="stat-label">Sesiones totales</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-value">{formatTiempo(usuario?.tiempo_total_minutos)}</div>
              <div className="stat-label">Tiempo total</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🔥</div>
              <div className="stat-value">{usuario?.racha_actual ?? 0}</div>
              <div className="stat-label">Racha actual</div>
            </div>
          </div>

          <div className="stats-row">
            <div className="card large-card">
              <div className="card-header">Progreso del Nivel</div>
              <div className="card-body">
                <div className="level-info">
                  <div className="level-label">Nivel {usuario?.nivel ?? 0}</div>
                  <div className="level-xp">{(usuario?.xp ?? 0).toLocaleString()} / {levelCap(usuario)} XP</div>
                </div>
                <div className="level-bar">
                  <div className="level-fill" style={{ width: `${Math.min(100, ((usuario?.xp ?? 0) / levelCap(usuario)) * 100)}%` }} />
                </div>
                <div className="level-footer">{Math.max(0, levelCap(usuario) - (usuario?.xp ?? 0))} XP hasta el siguiente nivel</div>
              </div>
            </div>

            <div className="card large-card">
              <div className="card-header">Actividad Reciente</div>
              <div className="card-body activity-list">
                <div className="activity-item"><span>Esta semana</span><span>{estimateSemana(usuario)}</span></div>
                <div className="activity-item"><span>Este mes</span><span>{estimateMes(usuario)}</span></div>
                <div className="activity-item"><span>Promedio diario</span><span>{estimatePromedioDiario(usuario)}</span></div>
              </div>
            </div>
          </div>

          <div className="card achievements-card">
            <div className="card-header">Todos los Logros</div>
            <div className="card-body achievements-grid">
              {logros && logros.length ? logros.map((lg, idx) => (
                <div key={idx} className={`achievement-card ${lg.unlocked ? 'unlocked' : ''}`}>
                  <div className="achievement-icon">{lg.icono || '🏅'}</div>
                  <div className="achievement-title">{lg.nombre || 'Logro'}</div>
                  <div className="achievement-desc">{lg.descripcion || ''}</div>
                </div>
              )) : (
                <div className="no-achievements">No hay logros aún</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      <EditProfileModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        usuario={usuario}
        onUpdated={handleModalUpdated}
      />
    </div>
  );
}