import { Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function ThemeSelector({ theme, setTheme, compact = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const themes = [
    { name: 'light', icon: <Sun size={20} /> },
    { name: 'midnight', icon: <span style={{fontSize:18}}>🌙</span> },
  ];

  const activeTheme = themes.find(t => t.name === theme) || themes[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button onClick={() => setIsOpen(o => !o)} className="theme-toggle-btn" aria-label="Select theme">
        {activeTheme.icon}
      </button>
      {isOpen && (
        <div className="theme-menu" role="menu" style={compact ? { left: '100%', bottom: '0', transform: 'translateX(8px) translateY(-8px)' } : undefined}>
          {themes.map(t => (
            <button
              key={t.name}
              onClick={() => { setTheme(t.name); setIsOpen(false); }}
              className={`theme-menu-item ${theme === t.name ? 'active' : ''}`}
              role="menuitem"
            >
              {t.icon}
              <span style={{ textTransform: 'capitalize' }}>{t.name}</span>
            </button>
          ))}
        </div>
      )}
      <style>{`
        .theme-toggle-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.12s ease;
        }
        .theme-toggle-btn:hover { color: var(--text-primary); background-color: rgba(0,0,0,0.03); }
        .theme-menu {
         position: absolute;
         bottom: calc(100% + 8px);
         left: 50%;
         transform: translateX(-50%);
          width: 140px;
          background: var(--bg-primary);
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(2,6,23,0.06);
          overflow: hidden;
          border: 1px solid var(--border-default);
          z-index: 10;
          padding: 6px;
          animation: popUpUp 150ms ease-out;
          transform-origin: bottom center;
        }
        .theme-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          text-align: left;
          padding: 10px 12px;
          border: none;
          background: transparent;
          cursor: pointer;
          text-decoration: none;
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          transition: background-color 0.12s ease;
        }
        .theme-menu-item:hover { background: var(--bg-tertiary); }
        .theme-menu-item.active { background: var(--accent); color: var(--text-on-primary); }
      `}</style>
    </div>
  );
}
