import React, { useState } from 'react';
import api from '../services/api';
import cfg from '../services/config';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// === VALIDACIONES IDÉNTICAS AL BACKEND ===
const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

function validateEmail(email) {
  return EMAIL_REGEX.test(email.trim());
}

function validatePassword(password) {
  if (password.length < 8) return 'err_password_length';
  if (!/[A-Z]/.test(password)) return 'err_password_uppercase';
  if (!/[a-z]/.test(password)) return 'err_password_lowercase';
  if (!/[0-9]/.test(password)) return 'err_password_digit';
  if (!/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(password)) return 'err_password_special';
  return null;
}

const getErrorMessage = (key) => {
  const messages = {
    err_password_length: 'La contraseña debe tener al menos 8 caracteres',
    err_password_uppercase: 'La contraseña debe contener al menos una letra mayúscula',
    err_password_lowercase: 'La contraseña debe contener al menos una letra minúscula',
    err_password_digit: 'La contraseña debe contener al menos un número',
    err_password_special: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*, etc.)',
    err_invalid_email: 'Por favor ingresa un correo válido',
    err_name_length: 'El nombre debe tener al menos 2 caracteres',
    err_password_mismatch: 'Las contraseñas no coinciden',
  };
  return messages[key] || key;
};

export default function Register({ onSuccess, onSwitchMode }) {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [err, setErr] = useState('');
  const [touched, setTouched] = useState({});
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);

  const validName = name.trim().length >= 2;
  const validEmail = validateEmail(email);
  const passwordErrorKey = validatePassword(password);
  const validPassword = !passwordErrorKey;
  const passwordsMatch = password === password2 && password2.length > 0;

  const handle = async (e) => {
    e.preventDefault();
    setErr('');

  if (!validName) return setErr(getErrorMessage('err_name_length'));
  if (!validEmail) return setErr(getErrorMessage('err_invalid_email'));
  if (!validPassword) return setErr(getErrorMessage(passwordErrorKey));
  if (!passwordsMatch) return setErr(getErrorMessage('err_password_mismatch'));

    try {
      await api.post(cfg.paths.register, { username: name, correo: email, password });
      if (onSuccess) onSuccess('register');
      // Después de registrar con éxito, navegar siempre al dashboard
      nav('/dashboard');
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || error.message || 'Error al registrar';
      setErr(msg);
    }
  };

  return (
    <div className="auth-panel">
      <div className="auth-header">
  <h2 className="auth-title">Regístrate</h2>
      </div>

      <button className="google-btn" type="button">
        <span className="google-icon"><img src="/static/IMG/google.svg" alt="Google" /></span>
        <span>Continuar con Google</span>
      </button>

      {err && <div className="error-message" style={{ marginBottom: 8 }}>{err}</div>}

      <form onSubmit={handle}>
        {/* Nombre */}
        <div className="input-wrap" onFocus={() => setTouched(t => ({ ...t, name: true }))}>
          <span className="input-icon"><User size={18} /></span>
          <input className="auth-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={'Nombre'} />
        </div>
  {!validName && touched.name && <div style={{ color: '#f43f5e', fontSize: 12, marginTop: 6 }}>{getErrorMessage('err_name_length')}</div>}

        {/* Email */}
        <div className="input-wrap" onFocus={() => setTouched(t => ({ ...t, email: true }))}>
          <span className="input-icon"><Mail size={18} /></span>
          <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={'Correo electrónico'} />
        </div>
  {!validEmail && touched.email && <div style={{ color: '#f43f5e', fontSize: 12, marginTop: 6 }}>{getErrorMessage('err_invalid_email')}</div>}

        {/* Contraseña */}
        <div className="input-wrap" onFocus={() => setTouched(t => ({ ...t, password: true }))}>
          <span className="input-icon"><Lock size={18} /></span>
          <input
            className="auth-input"
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={'Contraseña'}
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            autoComplete="new-password"
          />
          <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Ocultar' : 'Mostrar'}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {touched.password && passwordErrorKey && (
          <div style={{ color: '#f43f5e', fontSize: 12, marginTop: 6 }}>{getErrorMessage(passwordErrorKey)}</div>
        )}

        {/* Confirmar contraseña */}
        <div className="input-wrap" onFocus={() => setTouched(t => ({ ...t, password2: true }))}>
          <span className="input-icon"><Lock size={18} /></span>
          <input
            className="auth-input"
            type={show2 ? 'text' : 'password'}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder={'Confirmar contraseña'}
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            autoComplete="new-password"
          />
          <button type="button" onClick={() => setShow2(s => !s)} aria-label={show2 ? 'Ocultar' : 'Mostrar'}>
            {show2 ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {!passwordsMatch && touched.password2 && (
          <div style={{ color: '#f43f5e', fontSize: 12, marginTop: 6 }}>{getErrorMessage('err_password_mismatch')}</div>
        )}

        <button
          type="submit"
          className="submit-btn"
          disabled={!(validName && validEmail && validPassword && passwordsMatch)}
        >
          Regístrate
        </button>
      </form>

      <div className="auth-footer">
        <span>¿Ya tienes cuenta? </span>
        <button className="switch-link" onClick={() => onSwitchMode && onSwitchMode()}>Iniciar sesión</button>
      </div>
    </div>
  );
}