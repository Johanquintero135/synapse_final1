// Este archivo define la barra de navegación, gestionando enlaces, temas y autenticación.

import { Brain, Calendar, Clock, Home, LogIn, Menu, Shield, Star, User, UserPlus, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import isotipo from "../IMG/isotipo.png";
import ThemeSelector from './ThemeSelector';

export default function Navbar({ user, onAuthClick, onLogout, theme, setTheme }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  // Navbar uses fixed Spanish labels now (app is Spanish-only)
  // Por defecto colapsado; se expandirá solo cuando el usuario pase el mouse
  // por encima (hover) en pantallas grandes.
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  // Mantiene una clase global en <body> para facilitar reglas CSS que dependan
  // del estado de la barra lateral (evita selectors frágiles entre hermanos).

  useEffect(() => {
    try {
      if (expanded) document.body.classList.add('sidebar-expanded');
      else document.body.classList.remove('sidebar-expanded');
    } catch (e) {
      // ignore
    }
    return () => {
      try { document.body.classList.remove('sidebar-expanded'); } catch (e) {}
    };
  }, [expanded]);

  // Limpiar cualquier timeout pendiente al desmontar
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, []);

  // Escucha cambios de tamaño para forzar colapso en pantallas pequeñas
  useEffect(() => {
    const handleResize = () => {
      try {
        if (window.innerWidth <= 900 && expanded) setExpanded(false);
      } catch (e) {}
    };
    try {
      window.addEventListener('resize', handleResize);
    } catch (e) {}
    return () => { try { window.removeEventListener('resize', handleResize); } catch (e) {} };
  }, [expanded]);

  const navItems = [
    { path: '/', label: 'Inicio', icon: <Home size={18} /> },
    { path: '/pomodoro', label: 'Pomodoro', icon: <Clock size={18} />, requiresAuth: true },
    { path: '/meditacion', label: 'Meditación', icon: <Brain size={18} />, requiresAuth: true },
    { path: '/sesion-grupal', label: 'Sesión grupal', icon: <Users size={18} />, requiresAuth: true },
    { path: '/tareas', label: 'Tareas', icon: <Calendar size={18} />, requiresAuth: true },
    { path: '/recompensas', label: 'Recompensas', icon: <Star size={18} />, requiresAuth: true },
    { path: '/admin', label: 'Administración', icon: <Shield size={18} />, requiresAuth: true, adminOnly: true },
  ].filter(item => !item.adminOnly || (user?.rol_id === 1)); // Mostrar panel de admin solo para administradores

  const closeTimeoutRef = useRef(null);

  const handleProfileMenuMouseLeave = () => {
    // Usar el timeout compartido para cierre (coherente con el avatar)
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setOpenProfile(false);
      closeTimeoutRef.current = null;
    }, 200);
  };

  // Handlers específicos del avatar (trigger sólo en avatar)
  const handleAvatarMouseEnter = () => {
    if (!user) return;
    if (window && window.innerWidth > 900) {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setOpenProfile(true);
    }
  };

  const handleAvatarMouseLeave = () => {
    if (!user) return;
    if (window && window.innerWidth > 900) {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = setTimeout(() => {
        setOpenProfile(false);
        closeTimeoutRef.current = null;
      }, 200);
    }
  };
  
  const closeProfileMenu = () => {
    setOpenProfile(false);
    setIsMenuOpen(false); 
  }
  
  // Lógica de tema para el menú
  const isDarkOrMidnight = theme === 'dark' || theme === 'midnight';
  
  // Define los estilos del menú basados en el tema
  const menuStyles = {
    background: isDarkOrMidnight ? '#1f2937' : '#ffffff',
    textColor: isDarkOrMidnight ? '#f3f4f6' : '#111827',
    logoutColor: isDarkOrMidnight ? '#f87171' : '#ef4444',
    boxShadow: isDarkOrMidnight ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(2,6,23,0.12)',
  };

  const selectorLiftDistance = openProfile ? '-140px' : '0';
  const profileMenuBottom = '48px'; 

  return (
    <>
      <aside
        className={`sidebar ${isMenuOpen ? 'open' : ''} ${expanded ? 'expanded' : 'collapsed'}`}
        aria-label={'Navegación principal'}
        onMouseEnter={() => {
          // Al pasar el mouse por la barra en pantallas grandes, expandirla
          // y, si hay usuario, abrir el menú de perfil para que el avatar dependa del hover.
          if (window && window.innerWidth > 900) {
            setExpanded(true);
            // Abrir el perfil cuando el puntero entre por la barra (comportamiento solicitado)
            if (user) {
              if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
              }
              setOpenProfile(true);
            }
          }
        }}
        onMouseLeave={() => {
          // Al salir con el mouse, colapsar la barra y cerrar el menú de perfil.
          if (window && window.innerWidth > 900) {
            setExpanded(false);
            // Usar el timeout compartido para cerrar el perfil con debounce
            handleProfileMenuMouseLeave();
          }
        }}
      >
        <div className="sidebar-top">
            <Link to="/" className="nav-logo">
              <img src={isotipo} alt={'Logo'} className="logo-img" />
              <span className="logo-text">Synapse</span>
            </Link>
        </div>

        <nav>
          <ul className="sidebar-menu">
            {navItems.map(item => {
              if (item.requiresAuth && !user) return null;
              
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link to={item.path} className={`sidebar-link ${isActive ? 'active' : ''}`} aria-current={isActive ? 'page' : undefined} onClick={() => setIsMenuOpen(false)}>
                    <span className="link-icon">{item.icon}</span>
                    <span className="link-label">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-bottom">
          
          {!user ? (
            <>
              {/* Selectores para usuarios NO autenticados */}
              <div className="sidebar-selectors">
                <ThemeSelector theme={theme} setTheme={setTheme} compact={!expanded} />
              </div>
              <button onClick={() => onAuthClick('login')} className="btn-login">
                <LogIn size={16} className="btn-icon" />
                <span className="btn-label">Iniciar sesión</span>
              </button>
              <button onClick={() => onAuthClick('register')} className="btn-register">
                <UserPlus size={16} className="btn-icon" />
                <span className="btn-label">Regístrate</span>
              </button>
            </>
          ) : (
            // Bloque para usuario AUTENTICADO
            <>
              {/* 1. Selector de Tema (con animación de elevación) */}
              <div className="sidebar-selectors sidebar-selectors--lift" style={{ transform: `translateY(${selectorLiftDistance})`, transition: 'transform 200ms ease-out' }}>
                <ThemeSelector theme={theme} setTheme={setTheme} compact={!expanded} />
              </div>

              {/* 2. Botón de Perfil y Menú Desplegable (Abre con Click) */}
              <div className="profile-wrap" onMouseEnter={handleAvatarMouseEnter} onMouseLeave={handleAvatarMouseLeave}>
                <button 
                    onClick={() => setOpenProfile(s => !s)} // Abre/Cierra con CLICK
                    className="profile-btn btn-register" 
                    aria-expanded={openProfile} 
                    aria-haspopup="true"
                >
                  <div className="profile-avatar">{(user?.Username || user?.nombre || user?.correo || 'U').charAt(0).toUpperCase()}</div>
                  <span className="profile-name">{user?.Username || user?.nombre || user?.correo}</span>
                </button>

                {openProfile && (
                  <div 
                      className="profile-menu"
                      style={{ right: expanded ? '0' : '8px', bottom: profileMenuBottom }}
                      onMouseEnter={() => {
                        // Evitar que el timeout cierre el menú mientras el puntero está sobre él
                        if (closeTimeoutRef.current) {
                          clearTimeout(closeTimeoutRef.current);
                          closeTimeoutRef.current = null;
                        }
                        setOpenProfile(true);
                      }} 
                      onMouseLeave={handleProfileMenuMouseLeave}
                  >
                    {/* Secciones de Perfil y Configuración */}
                    <Link to="/perfil" onClick={closeProfileMenu} className="profile-menu-link">Perfil</Link>
                    <Link to="/config" onClick={closeProfileMenu} className="profile-menu-link">Configuración</Link>
                    <button onClick={() => { closeProfileMenu(); onLogout && onLogout(); }} className="profile-menu-logout">Cerrar sesión</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Hamburger fixed small square in top-right (separate from sidebar to avoid hover expanding the bar) */}
        <div className="hamburger-wrap" aria-hidden={isMenuOpen ? 'false' : 'true'}>
          <button
          className="hamburger-btn"
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen(prev => !prev)}
        >
          <Menu size={16} />
        </button>
      </div>

      {/* Mobile menu dropdown shown when hamburger is open */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`} aria-hidden={!isMenuOpen}>
      <div className="mobile-menu-card" role="dialog" aria-modal={isMenuOpen} tabIndex={-1}>
                <div className="mobile-menu-header">
                <ThemeSelector theme={theme} setTheme={setTheme} compact={true} />
                <button className="mobile-close" aria-label={'Cerrar menú'} onClick={() => setIsMenuOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <nav className="mobile-nav">
                <ul>
                  {navItems.map(item => {
                    if (item.requiresAuth && !user) return null;
                    return (
                      <li key={`mobile-${item.path}`}>
                        <Link to={item.path} className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                          <span className="link-icon">{item.icon}</span>
                          <span className="link-label">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="mobile-actions">
                {!user ? (
                  <>
                    <button onClick={() => { onAuthClick('login'); setIsMenuOpen(false); }} className="mobile-action-btn btn-login">
                      <LogIn size={16} />
                      <span>Iniciar sesión</span>
                    </button>
                    <button onClick={() => { onAuthClick('register'); setIsMenuOpen(false); }} className="mobile-action-btn btn-register">
                      <UserPlus size={16} />
                      <span>Regístrate</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/perfil" className="mobile-action-btn" onClick={() => setIsMenuOpen(false)}>
                      <User size={16} />
                      <span>Mi cuenta</span>
                    </Link>
                    <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="mobile-action-btn btn-logout">
                      <User size={16} />
                      <span>Cerrar sesión</span>
                    </button>
                  </>
                )}
              </div>

              <div className="mobile-footer">
                <small>Bienvenido</small>
              </div>
            </div>
      </div>


      <style>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 56px; /* collapsed width: aumentado ligeramente */
          background: #d1d5db; /* gray background as requested */
          backdrop-filter: blur(4px);
          border-right: 1px solid rgba(0,0,0,0.06);
          border-bottom: none !important;
          box-shadow: none !important;
          padding: 0.6rem 0.3rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 0.6rem;
          z-index: 1000;
          transition: width 200ms ease, background 200ms ease;
          overflow: visible; /* Mantener visible para el menú desplegable */
        }

        /* hide hamburger and mobile menu by default (visible only on small screens) */
        .hamburger-wrap { display: none; }
        .hamburger-btn { display: none; }
        .mobile-menu { display: none; }

  .sidebar.expanded { width: 210px; padding-left: 0.65rem; padding-right: 0.65rem; }
        .sidebar .nav-logo { display:flex; align-items:center; gap:0.5rem; text-decoration:none; }
        .sidebar .logo-img { width:28px; height:28px; object-fit:contain; border-radius:6px; }
          .sidebar-top { display:flex; align-items:center; justify-content:space-between; position: relative; }
        .sidebar .logo-text { font-weight:800; color: #111827; font-size:0.85rem; }
        /* hide logo text when collapsed */
        .sidebar.collapsed .logo-text { display: none; }

        .sidebar-menu { list-style:none; padding:0; margin: 0.4rem 0; display:flex; flex-direction:column; gap:0.35rem; }
        .sidebar-link { display:flex; align-items:center; gap:0.5rem; color: #111827; text-decoration:none; padding:0.4rem 0.4rem; border-radius:7px; font-weight:600; transition: all 0.18s ease; outline: none; font-size:0.85rem; }
        .sidebar-link .link-icon { display:inline-flex; width:22px; height:22px; align-items:center; justify-content:center; color: #111827; }
        .sidebar-link .link-label { color: #111827; }
        /* Hide labels when collapsed */
        .sidebar.collapsed .link-label { display: none; }
        .sidebar.expanded .link-label { display: inline-block; }
        .sidebar-link:hover, .sidebar-link:focus, .sidebar-link:active { background: rgba(0,0,0,0.04); color:#111827; transform: none; outline: none; }
        .sidebar-link.active { background: transparent; color: #ffffff; }
        .sidebar-link.active { background: rgba(0,0,0,0.06); }
        .sidebar-link.active .link-icon { color: #111827; }

        .sidebar-bottom { display:flex; flex-direction:column; gap:0.5rem; }
        .btn-login { background:transparent; border:1px solid transparent; color:#111827; padding:0.5rem; text-align:left; cursor:pointer; border-radius:8px; display:flex; align-items:center; gap:0.5rem; }
        .btn-login:hover { background: rgba(0,0,0,0.04); }
        .btn-register { background: linear-gradient(90deg,#7c3aed,#667eea); color:white; border:none; padding:0.55rem 0.9rem; border-radius:999px; cursor:pointer; box-shadow: 0 6px 18px rgba(99,102,241,0.12); display:flex; align-items:center; gap:0.5rem; }
        .btn-icon { color: #111827; }
        .btn-label { display: inline-block; }
        /* hide labels when collapsed */
        .sidebar.collapsed .btn-label { display: none; }

        /* Keep the bottom area visually pinned on tall sidebars */
        .sidebar-bottom { margin-top: auto; }

        /* Responsive: collapse sidebar to top bar on small screens */
        @media (max-width: 900px) {
        .mobile-menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between; 
    padding: 0.75rem 1rem; 
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}
.mobile-selectors-top {
    display: flex;
    gap: 12px; 
    align-items: center;
}
          .sidebar { position: fixed; width: 100%; height: 70px; bottom: auto; left: 0; right:0; display:flex; flex-direction:row; align-items:center; padding:0.5rem 1rem; }
          .sidebar-menu { flex-direction:row; gap:1rem; margin:0; display: none; }
          .sidebar-bottom { flex-direction:row; gap:0.5rem; margin-left:auto; display: none; }
          .sidebar .logo-text { display:none; }
          .sidebar .link-label { display:none; }

          /* Disable hover expansion behavior on small screens so navbar doesn't shift left/right */
          .sidebar { width: 100% !important; }
          .sidebar.expanded, .sidebar.collapsed { width: 100% !important; }
          .sidebar .logo-img { width:32px; height:32px; }

          /* Hamburger: small fixed square in the corner. Only this small box responds to hover. */
        .hamburger-wrap { display:flex !important; position: fixed; right: 8px; top: 8px; width:34px; height:34px; align-items:center; justify-content:center; z-index:1101; border-radius:6px; background: transparent !important; box-shadow: none !important; transition: background 160ms ease, transform 120ms ease; }
        .hamburger-wrap:hover { background: linear-gradient(90deg,#7c3aed,#667eea) !important; transform: scale(1.02); }
        .hamburger-btn { display:inline-flex !important; background: transparent !important; border: none !important; width:22px; height:22px; align-items:center; justify-content:center; padding:0; cursor:pointer; color: #6b7280 !important; box-shadow: none !important; }
        .hamburger-btn svg { display:block; }
        .hamburger-wrap:hover .hamburger-btn { color: #ffffff !important; }

          /* Lower logo slightly and ensure full visibility */
          .sidebar .logo-img { margin-top:10px; width:40px; height:40px; }

          /* Mobile menu dropdown (hidden by default) */
          .mobile-menu { display:block; position: fixed; top: 70px; left: 0; right: 0; background: transparent; max-height: 0; overflow: hidden; transition: max-height 220ms ease, opacity 200ms ease; opacity: 0; z-index: 999; display:flex; justify-content:center; }
          .mobile-menu.open { max-height: 80vh; opacity: 1; }
          .mobile-menu-card { width: 100%; max-width: 520px; background: #ffffff; border-radius: 10px; margin: 0.5rem; box-shadow: 0 8px 30px rgba(2,6,23,0.08); overflow: hidden; display:flex; flex-direction:column; }

          .mobile-menu-header {display:flex; align-items:center;justify-content:space-between; padding:0.75rem 1rem; border-bottom:1px solid rgba(0,0,0,0.04);  }
          .mobile-close { background: transparent; border:none; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding:6px; width:28px; height:28px; border-radius:6px; color:#374151; }
          .mobile-close:hover { background: rgba(0,0,0,0.03); }
          .mobile-selectors-top {display: flex;gap: 12px; align-items: center;}
          .mobile-nav ul { list-style:none; margin:0; padding:0.5rem 0.75rem; display:flex; flex-direction:column; gap:4px; }
          .mobile-link { display:flex; align-items:center; gap:0.75rem; padding:0.75rem 0.75rem; text-decoration:none; color:#111827; border-radius:8px; }
          .mobile-link:hover { background: rgba(0,0,0,0.04); }

          .mobile-actions { display:flex; flex-direction:column; gap:0.5rem; padding:0.75rem; }
          .mobile-action-btn { display:flex; align-items:center; gap:0.6rem; width:100%; padding:0.7rem 0.9rem; border-radius:10px; border: none; cursor:pointer; text-decoration:none; color:#111827; background: transparent; justify-content:center; }
          /* medium-light gray actions on mobile */
          .mobile-action-btn.btn-register { background: linear-gradient(90deg,#eef0f2,#d1d5db); color:#374151; border:1px solid #d1d5db; }
          .mobile-action-btn.btn-login { background: linear-gradient(90deg,#ffffff,#eef0f2); border:1px solid #d1d5db; color:#374151; }
          .mobile-action-btn.btn-logout { background: linear-gradient(90deg,#ef4444,#f97316); color: #fff; }

          .mobile-footer { padding:0.6rem 1rem 1rem; border-top:1px solid rgba(0,0,0,0.04); color:#6b7280; font-size:0.85rem; }
        }
          /* ==================== */
  /* Corrección de Color de ÍCONOS Fijos */
  /* ==================== */

  /* Selecciona el span que contiene el ícono y fuerza su color */
  .sidebar-link .link-icon { 
      /* El color gris oscuro deseado que no debe cambiar */
      color: #374151 !important; 
  }

  /* Asegura que los íconos SVG dentro del link-icon también usen ese color */
  .sidebar-link .link-icon svg {
      color: #374151 !important;
      /* Relleno (fill) opcional si los íconos lo usan */
      fill: none !important; 
  }

  /* Manejo del color cuando el link está ACTIVO (puede ser diferente) */
  .sidebar-link.active .link-icon,
  .sidebar-link.active .link-icon svg {
      /* Si quieres que los íconos activos SÍ cambien (ej. al color primario o blanco) 
         ajusta este color. De lo contrario, mantenlo fijo. */
      color: #111827 !important; /* Ejemplo: se vuelven más oscuros cuando están activos */
  }
      `}</style>
    </>
  );
}