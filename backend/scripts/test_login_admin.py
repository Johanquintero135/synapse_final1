import json
import urllib.request
import urllib.error

body = {'correo':'admin@synapse.com','password':'admin123'}
data = json.dumps(body).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:5000/api/auth/login', data=data, headers={'Content-Type':'application/json'})
try:
    resp = urllib.request.urlopen(req, timeout=8)
    print('STATUS', resp.getcode())
    print(resp.read().decode())
except urllib.error.HTTPError as e:
    print('HTTP ERROR', e.code)
    try:
        print(e.read().decode())
    except:
        pass
except Exception as e:
    print('ERROR', repr(e))
