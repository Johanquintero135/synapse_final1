import sqlite3
import os
from werkzeug.security import check_password_hash

p = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'instance', 'synapse_dev.db'))
print('DB:', p)
if not os.path.exists(p):
    print('DB no existe')
    raise SystemExit
conn = sqlite3.connect(p)
c = conn.cursor()
email = 'admin@synapse.com'
c.execute("SELECT id_usuario, username, correo, password, activo, rol_id FROM usuario WHERE correo = ?", (email,))
row = c.fetchone()
if not row:
    print('Usuario admin no encontrado')
else:
    id_usuario, username, correo, pw_hash, activo, rol_id = row
    print('id_usuario:', id_usuario)
    print('username:', username)
    print('correo:', correo)
    print('activo:', activo)
    print('rol_id:', rol_id)
    print('password hash:', pw_hash)
    ok = check_password_hash(pw_hash, 'admin123')
    print('check_password admin123 ->', ok)

# show role name
c.execute('SELECT id, nombre FROM rol WHERE id = ?', (rol_id,))
role = c.fetchone()
print('role row:', role)
conn.close()
