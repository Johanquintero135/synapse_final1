import React, { useEffect, useState } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import api from '../services/api';

export default function EditProfileModal({ open, onClose, usuario, onUpdated }) {
  const [form, setForm] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && usuario) {
      setForm({
        nombre_completo: usuario.nombre_completo || '',
        telefono: usuario.telefono || '',
        ubicacion: usuario.ubicacion || '',
        descripcion: usuario.descripcion || ''
      });
      setAvatarPreview(usuario.avatar_url || null);
    }
  }, [open, usuario]);

  if (!open) return null;

  const handleFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    
    // Validar tamaño (2MB)
    if (f.size > 2 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 2MB.');
      return;
    }
    
    setForm(prev => ({ ...prev, avatar: f }));
    setAvatarPreview(URL.createObjectURL(f));
  };

  const handleRemoveNow = async () => {
    if (!window.confirm('¿Eliminar la foto de perfil?')) return;
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('remove_avatar', '1');
      const res = await api.put('/auth/me', fd);
      // clear local preview and form
      setAvatarPreview(null);
      setForm(f => ({ ...f, avatar: null, remove_avatar: false }));
      try {
        localStorage.setItem('synapse_usuario', JSON.stringify(res.data));
      } catch (e) {}
      onUpdated && onUpdated(res.data);
    } catch (e) {
      console.error('Error removing avatar:', e);
      alert('No se pudo eliminar la foto');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      // Only send editable fields requested: nombre_completo, telefono, ubicacion, descripcion and avatar
      if (form.nombre_completo) fd.append('nombre_completo', form.nombre_completo);
      if (form.telefono) fd.append('telefono', form.telefono);
      if (form.ubicacion) fd.append('ubicacion', form.ubicacion);
      if (form.descripcion) fd.append('descripcion', form.descripcion);
      if (form.avatar) fd.append('avatar', form.avatar);
      // If user marked remove_avatar, include that flag so backend can delete existing file
      if (form.remove_avatar) fd.append('remove_avatar', '1');

      // Don't set Content-Type manually so the browser can add the multipart boundary
      const res = await api.put('/auth/me', fd);

      // Try to fetch fresh user data from the server (in case PUT returns partial data)
      let fresh = res.data;
      try {
        const meRes = await api.get('/auth/me');
        if (meRes && meRes.data) fresh = meRes.data;
      } catch (e) {
        // ignore, we'll use res.data
      }

      try {
        localStorage.setItem('synapse_usuario', JSON.stringify(fresh));
      } catch (e) {
        // ignore storage errors
      }

      onUpdated && onUpdated(fresh);
      onClose && onClose();
    } catch (e) {
      console.error('Error saving profile:', e);
      if (e?.response?.status === 409) {
        alert('El correo ya está en uso');
      } else {
        alert('No se pudo actualizar el perfil');
      }
    } finally {
      setSaving(false);
    }
  };

  // getInitials robusta: acepta string o objeto usuario
  const getInitials = (nameOrUser) => {
    if (!nameOrUser) return 'U';
    let str = '';
    if (typeof nameOrUser === 'string') {
      str = nameOrUser;
    } else if (typeof nameOrUser === 'object') {
      str = nameOrUser.nombre_completo || nameOrUser.name || nameOrUser.Username || nameOrUser.username || nameOrUser.email || '';
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

  return (
    <div className="modal-root">
      {/* Overlay */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="confirmation-modal">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Editar Perfil</h2>
          <button onClick={onClose} className="modal-close" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="form-grid">
            {/* Columna Izquierda */}
            <div>
              <div className="form-group">
                <label>Nombre completo</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.nombre_completo || ''}
                  onChange={e => setForm(f => ({ ...f, nombre_completo: e.target.value }))}
                  placeholder="Ingresa tu nombre completo"
                />
              </div>

              {/* Email removed per request - not editable here */}

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.telefono || ''}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  placeholder="+34 612 345 678"
                />
              </div>

              <div className="form-group">
                <label>Ubicación</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.ubicacion || ''}
                  onChange={e => setForm(f => ({ ...f, ubicacion: e.target.value }))}
                  placeholder="Madrid, España"
                />
              </div>

              {/* Fecha de nacimiento removed per request - not editable here */}
            </div>

            {/* Columna Derecha */}
            <div>
              <div className="form-group">
                <label>Foto de perfil</label>
                <div className="avatar-dropzone">
                  <div className="avatar-preview">
                    <div className="avatar-inner">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="avatar" className="avatar-img" />
                      ) : (
                        <div className="avatar-initials">{getInitials(form.nombre_completo || usuario?.nombre_completo)}</div>
                      )}
                      {(avatarPreview || usuario?.avatar_url) && (
                        <button type="button" onClick={handleRemoveNow} disabled={saving} className="avatar-remove" title="Eliminar foto">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <label htmlFor="avatar-upload" className="upload-label">
                    <Upload size={16} />
                    Seleccionar archivo
                  </label>
                  <input id="avatar-upload" type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                  <p className="note">PNG, JPG — máximo 2MB</p>
                </div>
              </div>

              <div className="form-group">
                <label>Biografía</label>
                <textarea
                  className="form-textarea"
                  value={form.descripcion || ''}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Cuéntanos sobre ti..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} disabled={saving} className="cancel-button">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="confirm-button">{saving ? 'Guardando...' : 'Guardar Cambios'}</button>
        </div>
      </div>
    </div>
  );
}