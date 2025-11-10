import sqlite3
import os
paths = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'synapse_dev.db')),
    os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'instance', 'synapse_dev.db')),
]

for p in paths:
    print('\n--- Checking', p)
    if not os.path.exists(p):
        print('MISSING')
        continue
    conn = sqlite3.connect(p)
    c = conn.cursor()
    try:
        c.execute("PRAGMA table_info('usuario')")
        cols = c.fetchall()
        print('COLUMNS:', cols)
    except Exception as e:
        print('PRAGMA error:', e)

    try:
        c.execute("SELECT * FROM alembic_version")
        print('ALEMBIC_VERSION:', c.fetchall())
    except Exception as e:
        print('alembic_version error:', e)
    conn.close()
