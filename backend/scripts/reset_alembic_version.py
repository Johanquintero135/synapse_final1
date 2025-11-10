"""
Script de ayuda para resetear la tabla alembic_version en la base SQLite de desarrollo.
Uso (desde cmd o PowerShell, en backend/):
  python scripts\reset_alembic_version.py

Este script:
- Hace una copia de seguridad del archivo sqlite (synapse_dev.db -> synapse_dev.db.bak).
- Comprueba si existe la tabla alembic_version.
- Si existe, borra sus filas (vaciando la fila de versión). Esto permite volver a crear las migraciones y `flask db stamp` sin que Alembic intente buscar una revisión inexistente.

ADVERTENCIA: Haz backup antes de ejecutar. Si usas otra BD (MySQL, etc.) NO ejecutes este script tal cual.
"""

import os
import shutil
import sqlite3

BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # backend/
DB_FILE = os.environ.get('DATABASE_URL') or 'synapse_dev.db'
# if DATABASE_URL contains sqlite:///, extract path
if DB_FILE.startswith('sqlite:///'):
    DB_FILE = DB_FILE.replace('sqlite:///', '')

DB_PATH = os.path.join(BASE_DIR, DB_FILE) if not os.path.isabs(DB_FILE) else DB_FILE

print('Using DB path:', DB_PATH)
if not os.path.exists(DB_PATH):
    print('DB file not found. Exiting.')
    raise SystemExit(1)

bak = DB_PATH + '.bak'
print('Creating backup:', bak)
shutil.copy2(DB_PATH, bak)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Check if alembic_version table exists
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='alembic_version'")
if cur.fetchone() is None:
    print('No table alembic_version found. Nothing to do.')
else:
    try:
        cur.execute('SELECT version_num FROM alembic_version')
        rows = cur.fetchall()
        print('Current alembic_version rows:', rows)
    except Exception as e:
        print('Could not read alembic_version:', e)

    # Delete rows to allow stamping
    try:
        cur.execute('DELETE FROM alembic_version')
        conn.commit()
        print('Deleted alembic_version rows (table left empty).')
    except Exception as e:
        print('Error deleting alembic_version rows:', e)

conn.close()
print('Done. Now run:')
print('  set FLASK_APP=app')
print('  set FLASK_ENV=development')
print('  python -m flask db migrate -m "recreate migrations"')
print('  python -m flask db upgrade   (or: python -m flask db stamp head)')
