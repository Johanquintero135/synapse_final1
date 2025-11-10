import sqlite3
import os
import uuid
from datetime import datetime
from werkzeug.security import generate_password_hash

p = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'instance', 'synapse_dev.db'))
print('DB:', p)
if not os.path.exists(p):
    raise SystemExit('DB not found: ' + p)
conn = sqlite3.connect(p)
c = conn.cursor()
# Ensure role 'admin' exists
c.execute("SELECT id, nombre FROM rol WHERE nombre = 'admin'")
role = c.fetchone()
if role:
    role_id = role[0]
    print('Found admin role id', role_id)
else:
    # insert role
    c.execute("INSERT INTO rol (nombre) VALUES ('admin')")
    role_id = c.lastrowid
    print('Created admin role id', role_id)

# Check if admin user exists
email = 'admin@synapse.com'
c.execute('SELECT id_usuario FROM usuario WHERE correo = ?', (email,))
if c.fetchone():
    print('Admin user already exists')
else:
    pw_hash = generate_password_hash('admin123')
    username = 'admin'
    uid = str(uuid.uuid4())
    fecha = datetime.utcnow().isoformat()
    # Insert user with generated UUID
    c.execute('INSERT INTO usuario (id_usuario, username, correo, password, rol_id, activo, fecha_registro, nivel, sesiones_totales, tiempo_total_minutos, racha_actual, xp) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
              (uid, username, email, pw_hash, role_id, 1, fecha, 0, 0, 0, 0, 0))
    print('Created admin user with id', uid)

conn.commit()
conn.close()
print('Done')
