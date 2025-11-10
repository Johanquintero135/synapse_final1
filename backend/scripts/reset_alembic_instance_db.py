import os, shutil, sqlite3

BASE = os.path.dirname(os.path.dirname(__file__))
DB_REL = os.path.join('instance','synapse_dev.db')
DB_PATH = os.path.join(BASE, DB_REL)
print('DB_PATH=', DB_PATH)
if not os.path.exists(DB_PATH):
    print('DB not found, exiting')
    raise SystemExit(1)

bak = DB_PATH + '.bak'
print('Copying to', bak)
shutil.copy2(DB_PATH, bak)
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='alembic_version'")
if cur.fetchone() is None:
    print('No alembic_version table')
else:
    try:
        cur.execute('SELECT version_num FROM alembic_version')
        rows = cur.fetchall()
        print('alembic_version rows before:', rows)
    except Exception as e:
        print('read error:', e)
    try:
        cur.execute('DELETE FROM alembic_version')
        conn.commit()
        print('Deleted alembic_version rows')
    except Exception as e:
        print('delete error:', e)
conn.close()
print('Done')
