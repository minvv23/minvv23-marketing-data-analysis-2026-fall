"""덱을 headless Chrome으로 열어 특정 장/단계에서 JS 식을 평가한다. usage: python3 _tools/ev-20261118.py SLIDE BUILD 'JS' [shot.jpg]"""
import sys, os, json, time, base64, shutil, subprocess, tempfile, urllib.request, urllib.parse
import websocket
HERE = os.path.dirname(os.path.abspath(__file__)); PAGE = os.path.join(os.path.dirname(HERE), '20261118-presentation.html')
s, b, expr = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]; shot = sys.argv[4] if len(sys.argv) > 4 else None
port = 9620 + (os.getpid() % 40); tmp = tempfile.mkdtemp(prefix='deckshot_')
chrome = subprocess.Popen(['google-chrome', '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', f'--remote-debugging-port={port}', '--remote-allow-origins=*',
    f'--user-data-dir={tmp}/p', '--allow-file-access-from-files', '--no-first-run', 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(80):
        try:
            pg = [t for t in json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json')) if t.get('type') == 'page']
            if pg: break
        except Exception: pass
        time.sleep(.25)
    ws = websocket.create_connection(pg[0]['webSocketDebuggerUrl'], timeout=90); mid = [0]
    def call(m, p=None):
        mid[0] += 1; ws.send(json.dumps({'id': mid[0], 'method': m, 'params': p or {}}))
        while True:
            r = json.loads(ws.recv())
            if r.get('method') == 'Runtime.exceptionThrown': print('EXC', r['params']['exceptionDetails'].get('exception', {}).get('description', '')[:600])
            if r.get('id') == mid[0]: return r.get('result', {})
    ev = lambda e: call('Runtime.evaluate', {'expression': e, 'returnByValue': True, 'awaitPromise': True}).get('result', {})
    call('Emulation.setDeviceMetricsOverride', {'width': 1600, 'height': 900, 'deviceScaleFactor': 1, 'mobile': False})
    call('Runtime.enable'); call('Page.enable'); call('Page.navigate', {'url': os.environ.get('DECK_URL') or ('file://' + urllib.parse.quote(PAGE))}); time.sleep(2.2)
    ev(f'DECK.go({s-1},{b},true)'); ev('DECK.finish()'); time.sleep(.4)
    r = ev(expr); print(json.dumps(r.get('value', r), ensure_ascii=False, indent=1)[:6000])
    if shot: open(shot, 'wb').write(base64.b64decode(call('Page.captureScreenshot', {'format': 'jpeg', 'quality': 85})['data']))
finally:
    chrome.kill(); chrome.wait(timeout=10); shutil.rmtree(tmp, ignore_errors=True)
