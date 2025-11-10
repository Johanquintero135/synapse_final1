import sqlite3
import os
p = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'instance', 'synapse_dev.db'))
print('DB_PATH=', p)
if not os.path.exists(p):
    raise SystemExit('DB no existe: ' + p)
conn = sqlite3.connect(p)
c = conn.cursor()
# Helper to add column if not exists (sqlite doesn't support IF NOT EXISTS for add column)
def has_column(table, column):
    c.execute("PRAGMA table_info('%s')" % table)
    cols = [r[1] for r in c.fetchall()]
    return column in cols

cols_to_add = [
    ("nivel","INTEGER NOT NULL DEFAULT 0"),
    ("sesiones_totales","INTEGER NOT NULL DEFAULT 0"),
    ("tiempo_total_minutos","INTEGER NOT NULL DEFAULT 0"),
    ("racha_actual","INTEGER NOT NULL DEFAULT 0"),
    ("xp","INTEGER NOT NULL DEFAULT 0"),
]
for col, definition in cols_to_add:
    if not has_column('usuario', col):
        sql = f"ALTER TABLE usuario ADD COLUMN {col} {definition};"
        print('Adding', col)
        c.execute(sql)
    else:
        print('Already has', col)

# Create estado_animo table if not exists
c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='estado_animo'")
if not c.fetchone():
    print('Creating estado_animo table')
    c.execute('''CREATE TABLE estado_animo (
        id VARCHAR(36) PRIMARY KEY,
        usuario_id VARCHAR(36) NOT NULL,
        fecha DATE NOT NULL,
        valor INTEGER NOT NULL,
        nota VARCHAR(255),
        FOREIGN KEY(usuario_id) REFERENCES usuario(id_usuario)
    )''')
else:
    print('estado_animo exists')

conn.commit()
conn.close()
print('Done')
