"""20261118 덱 점검: 장 × 단계를 headless Chrome으로 캡처하고 넘침, 글자 겹침, 콘솔 오류를 보고한다.
usage: python3 _tools/shot-20261118.py OUT_DIR [slides=all|1,5,9] [builds=all|last] [W=1600] [H=900]
장마다 단계별 캡처를 한 장에 모은 접촉 시트(sheet_XX.jpg)도 만든다."""
import sys, os, json, time, base64, shutil, subprocess, tempfile, urllib.request, urllib.parse, io
import websocket
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
PAGE = os.path.join(os.path.dirname(HERE), os.environ.get('DECK_PAGE', '20261118-presentation.html'))
out = sys.argv[1]; pick = sys.argv[2] if len(sys.argv) > 2 else 'all'; mode = sys.argv[3] if len(sys.argv) > 3 else 'all'
W = int(sys.argv[4]) if len(sys.argv) > 4 else 1600; H = int(sys.argv[5]) if len(sys.argv) > 5 else 900
os.makedirs(out, exist_ok=True)
port = 9530 + (os.getpid() % 40); tmp = tempfile.mkdtemp(prefix='deckshot_')
url = 'file://' + urllib.parse.quote(PAGE)
chrome = subprocess.Popen(['google-chrome', '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb',
    f'--remote-debugging-port={port}', '--remote-allow-origins=*', f'--user-data-dir={tmp}/p', '--allow-file-access-from-files', '--no-first-run', 'about:blank'],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
CHECK = r"""(() => { const s = document.querySelector('.slide.on'), st = document.getElementById('stage').getBoundingClientRect(), k = st.width / 1600, r = [];
  const vis = e => { const c = getComputedStyle(e); if (c.visibility === 'hidden' || c.display === 'none') return false; let o = 1, n = e; while (n && n !== s) { const cs = getComputedStyle(n); o *= +cs.opacity; if (n.getAttribute && n.getAttribute('opacity') !== null) o *= 1; n = n.parentElement; } return o > .05; };
  const R = e => { const b = e.getBoundingClientRect(); return { l: (b.left - st.left) / k, t: (b.top - st.top) / k, r: (b.right - st.left) / k, b: (b.bottom - st.top) / k }; };
  // 1) 무대 밖으로 나간 요소
  s.querySelectorAll('*').forEach(e => { if (!vis(e)) return; const q = R(e); if (q.r - q.l < 1 || q.b - q.t < 1) return; if (e.tagName === 'svg' || e.closest('.katex')) return;
    if (q.r > 1600 - 20 || q.b > 900 - 22 || q.l < 20 || q.t < 6) { const txt = (e.textContent || '').trim().slice(0, 24); if (e.children.length === 0 || e.tagName === 'text') r.push('OUT ' + e.tagName + ' "' + txt + '" ' + Math.round(q.l) + ',' + Math.round(q.t) + '-' + Math.round(q.r) + ',' + Math.round(q.b)); } });
  // 2) 왼쪽 글 영역이 아래로 넘침
  const txt = s.querySelector('.txt'); if (txt) { const q = R(txt); if (q.b > 900 - 40) r.push('TXT bottom ' + Math.round(q.b)); }
  // 3) SVG 글자끼리, SVG 글자와 얹은 HTML 글의 겹침
  const ts = [...s.querySelectorAll('svg text')].filter(e => e.textContent.trim() && vis(e)).map(e => ({ e, q: R(e), s: e.textContent.trim().slice(0, 18) }));
  s.querySelectorAll('.ov').forEach(o => { if (!vis(o)) return; o.querySelectorAll('.katex-html, .cap, button, td, th').forEach(e => { if (e.closest('[data-on]') && !e.closest('[data-on]').classList.contains('on')) return; if (!vis(e)) return; if (e.classList.contains('cap') && e.querySelector('.katex')) return; const q = R(e); if (q.r - q.l > 1) ts.push({ e, q, s: 'HTML:' + (e.textContent || '').trim().slice(0, 14), h: 1 }); }); });
  for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) { const a = ts[i].q, b = ts[j].q; if (ts[i].h && ts[j].h) continue; const w = Math.min(a.r, b.r) - Math.max(a.l, b.l), h = Math.min(a.b, b.b) - Math.max(a.t, b.t); if (w > 2 && h > 4) r.push('OVERLAP "' + ts[i].s + '" x "' + ts[j].s + '"'); }
  // 4) 작은 글자
  const small = new Set(); s.querySelectorAll('svg text, .txt *, .ov *').forEach(e => { if (!vis(e) || !e.textContent.trim() || e.closest('.katex') || e.tagName === 'SUB' || e.tagName === 'SUP') return; if ([...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) { const f = parseFloat(getComputedStyle(e).fontSize); if (f < 15.9) small.add(f + 'px "' + e.textContent.trim().slice(0, 12) + '"'); } });
  small.forEach(x => r.push('SMALL ' + x));
  return r.slice(0, 14).join('\n    '); })()"""
try:
    for _ in range(80):
        try:
            pg = [t for t in json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json')) if t.get('type') == 'page']
            if pg: break
        except Exception: pass
        time.sleep(.25)
    ws = websocket.create_connection(pg[0]['webSocketDebuggerUrl'], timeout=90); mid = [0]; logs = []
    def call(m, p=None):
        mid[0] += 1; ws.send(json.dumps({'id': mid[0], 'method': m, 'params': p or {}}))
        while True:
            r = json.loads(ws.recv())
            if r.get('method') in ('Runtime.exceptionThrown', 'Runtime.consoleAPICalled'): logs.append(r)
            if r.get('id') == mid[0]: return r.get('result', {})
    ev = lambda e: call('Runtime.evaluate', {'expression': e, 'returnByValue': True, 'awaitPromise': True}).get('result', {}).get('value')
    call('Emulation.setDeviceMetricsOverride', {'width': W, 'height': H, 'deviceScaleFactor': 1, 'mobile': False})
    call('Runtime.enable'); call('Page.enable'); call('Page.navigate', {'url': url}); time.sleep(2.5)
    n = ev('DECK.n'); builds = ev('DECK.builds'); ids = ev('DECK.ids()')
    fonts = ev("document.fonts.check('20px Pretendard') + ' katex:' + document.fonts.check('20px KaTeX_Main')")
    print('slides', n, 'builds', sum(builds), 'fonts', fonts)
    idx = range(n) if pick == 'all' else [int(x) - 1 for x in pick.split(',')]
    for i in idx:
        bs = [builds[i]] if mode == 'last' else list(range(builds[i] + 1)); shots = []
        for b in bs:
            ev(f'DECK.go({i},{b},true)'); ev('DECK.finish()'); time.sleep(.35)
            ev('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))')
            o = ev(CHECK)
            if o: print(f'[{i+1} {ids[i]} b{b}]\n    {o}')
            shot = call('Page.captureScreenshot', {'format': 'jpeg', 'quality': 82})
            data = base64.b64decode(shot['data']); open(f'{out}/s{i+1:02d}_b{b}.jpg', 'wb').write(data); shots.append(Image.open(io.BytesIO(data)))
        cols = 2 if len(shots) > 1 else 1; tw_, th_ = 800, 450; rows = (len(shots) + cols - 1) // cols
        sh = Image.new('RGB', (tw_ * cols, th_ * rows), 'white')
        for k, im in enumerate(shots): sh.paste(im.resize((tw_, th_), Image.LANCZOS), ((k % cols) * tw_, (k // cols) * th_))
        sh.save(f'{out}/sheet_{i+1:02d}.jpg', quality=84)
    for l in logs:
        if l['method'] == 'Runtime.exceptionThrown': print('EXC', l['params']['exceptionDetails'].get('exception', {}).get('description', '')[:500])
        elif l['params'].get('type') in ('error', 'warning'): print('CONSOLE', [a.get('value', a.get('description')) for a in l['params']['args']][:3])
finally:
    chrome.kill(); chrome.wait(timeout=10); shutil.rmtree(tmp, ignore_errors=True)
