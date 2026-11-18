// 독해가이드 조립: parts/*.html을 이어 붙이고 수식 렌더, 덱 링크, 목차를 만들어 독립 웹 폴더로 출력한다.
// 실행: web 폴더에서 `node presentation/_guide/build.mjs`
// 출력: presentation/20261118-guide/ (index.html, guide.css, stats.js, widgets.js, img/)
//   글꼴과 KaTeX 스타일은 덱처럼 ../../learning/assets의 로컬 파일을 쓰고, 폴더만 따로 옮겨 열면 CDN으로 대신 불러온다.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const G = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(G, '../..');
const require = createRequire(path.join(WEB, 'package.json'));
const katex = require('katex');
const KVER = require('katex/package.json').version;
const SRC = path.join(WEB, 'presentation/_src/20261118');
// GUIDE_OUT=presentation/20261118-guide-tmpN 처럼 presentation 바로 아래 다른 폴더로 출력할 수 있다(동시 작업용, 배포 대상 아님).
const OUT = process.env.GUIDE_OUT ? path.resolve(WEB, process.env.GUIDE_OUT) : path.join(WEB, 'presentation/20261118-guide');
const DECK = '../20261118-presentation.html';

const order = ['0-intro', '1-basics', '2-sim', '3-alt', '4-deck', '5-qa'];
const missing = [];
let body = order.map(n => {
  const p = path.join(G, 'parts', n + '.html');
  if (!fs.existsSync(p)) { missing.push(n); return ''; }
  return fs.readFileSync(p, 'utf8');
}).join('\n');

// ---------- 수식 ----------
// \gl{키}{식}: 기호에 키를 단다. 키는 용어 풀이(parts/gloss-*.html)의 data-k와 맞추며, 유도 단계(.deriv)에서는 같은 키의 항이 자리를 옮겨 이어진다.
// \gl을 쓰지 않은 수식에는 아래 AUTO 목록의 기호에 자동으로 키를 단다(뜻이 하나로 정해지는 기호만).
const unesc = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const texErr = [];
let nTex = 0;
// 악센트 명령(\hat, \tilde 등) 바로 뒤의 기호는 건드리지 않는다. 악센트의 인자가 \gl로 바뀌면 KaTeX가 해석하지 못한다.
const ACC = String.raw`(?<!\\(?:hat|tilde|bar|widehat|widetilde|dot|ddot|vec|check|breve|acute|grave|underline|overline|mathbf|boldsymbol|mathrm|text)\s*)`;
const AUTO = [
  [String.raw`\\tilde D_\{(?:it|js)\}`, 'Dtil'], [String.raw`\\tilde D(?![_a-zA-Z])`, 'Dtil'],
  [String.raw`\\widehat\{D\}_\{it\}`, 'Dhat'], [String.raw`\\widehat\{D\}(?![_a-zA-Z])`, 'Dhat'],
  [String.raw`\\bar D_t(?![a-zA-Z{])`, 'Dbt'], [String.raw`\\bar D_[A-Za-z](?![a-zA-Z{])`, 'Dbi'], [String.raw`\\bar D(?![_a-zA-Z])`, 'Db'],
  [String.raw`\\hat\\delta\^\{DD\}`, 'dhat'], [String.raw`\\hat\\delta(?![a-zA-Z_^])`, 'dhat'], [String.raw`\\delta\^\{DD\}`, 'd'], [String.raw`\\delta(?![a-zA-Z_^])`, 'd'],
  [String.raw`\\alpha_i(?![a-zA-Z{])`, 'ai'], [String.raw`\\lambda_t(?![a-zA-Z{])`, 'lt'],
  [String.raw`\\tau_\{it\}`, 'tau'], [String.raw`\\tau_\{(?:E2|E3|L3)\}`, m => 'tau' + m.slice(-3, -1)],
  [String.raw`\\(?:var)?epsilon_\{it\}`, 'eps'], [String.raw`(?<![\\a-zA-Z{])D_\{it\}`, 'D'], [String.raw`(?<![\\a-zA-Z{])Y_\{it\}`, 'Y'],
  [String.raw`(?<![\\a-zA-Z{])w_\{it\}`, 'w'], [String.raw`(?<![\\a-zA-Z{])G_i(?![a-zA-Z{])`, 'G'],
].map(([src, key]) => [new RegExp(ACC + src, 'g'), key]);
function autotag(tex) {
  if (tex.includes('\\gl')) return tex;
  const keep = []; let t = tex;
  for (const [re, key] of AUTO) t = t.replace(re, m => { keep.push(`\\gl{${typeof key === 'function' ? key(m) : key}}{${m}}`); return `\u0000${keep.length - 1}\u0000`; });
  return t.replace(/\u0000(\d+)\u0000/g, (m, i) => keep[+i]);
}
const kopt = d => ({ displayMode: !!d, output: 'html', strict: 'ignore', trust: c => c.command === '\\htmlClass', macros: { '\\gl': '\\htmlClass{tk k-#1}{#2}' } });
const renderTex = (src, where, auto = true) => src.replace(/<tex(\s+class="d")?>([\s\S]*?)<\/tex>/g, (m, d, tex) => {
  nTex++;
  const t = auto ? autotag(unesc(tex).trim()) : unesc(tex).trim();
  try { return katex.renderToString(t, { ...kopt(d), throwOnError: true }); }
  catch (e) { texErr.push(where + ': ' + tex.slice(0, 80) + ' :: ' + e.message.slice(0, 120)); return katex.renderToString(t, { ...kopt(d), throwOnError: false }); }
});
body = renderTex(body, 'body');

// ---------- 기호 풀이: parts/gloss-*.html의 <dl class="gloss"><dt data-k="키">기호와 이름</dt><dd>설명</dd></dl>를 모아 숨긴 블록으로 넣는다 ----------
const glossFiles = fs.readdirSync(path.join(G, 'parts')).filter(n => /^gloss-.*\.html$/.test(n)).sort();
const gloss = {}, glossDup = [];
for (const n of glossFiles) {
  const src = renderTex(fs.readFileSync(path.join(G, 'parts', n), 'utf8'), n, false);
  for (const m of src.matchAll(/<dt data-k="([^"]+)">([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g)) { if (gloss[m[1]]) glossDup.push(m[1]); gloss[m[1]] = `<div data-k="${m[1]}"><p class="gh">${m[2].trim()}</p><div class="gd">${m[3].trim()}</div></div>`; }
}
const glossHTML = `<div id="gloss" hidden>${Object.values(gloss).join('')}</div>`;
const usedKeys = new Set([...body.matchAll(/class="enclosing tk k-([A-Za-z0-9]+)/g)].map(m => m[1]).filter(k => !/^z[A-Z0-9]/.test(k)));
const glossMissing = [...usedKeys].filter(k => !gloss[k]);

// ---------- 출력 폴더 ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'img'), { recursive: true });

// ---------- 그림 ----------
const figErr = [], figs = new Set();
body = body.replace(/<img([^>]*?)data-fig="([^"]+)"([^>]*)>/g, (m, a, name, b) => {
  const p = path.join(SRC, 'img', name);
  if (!fs.existsSync(p)) { figErr.push(name); return m; }
  figs.add(name);
  return `<img${a}src="img/${name}" loading="lazy"${b}>`;
});
figs.forEach(n => fs.copyFileSync(path.join(SRC, 'img', n), path.join(OUT, 'img', n)));

// ---------- 덱 링크 ----------
body = body.replace(/<a class="deck"([^>]*)>/g, (m, attrs) => {
  const s = (attrs.match(/data-s="(\d+)"/) || [])[1], b = (attrs.match(/data-b="(\d+)"/) || [, '0'])[1];
  return `<a class="deck" href="${DECK}#s${s}b${b}" target="_blank" rel="noopener"${attrs}>`;
});

// ---------- 4부 슬라이드 미리보기: 장 소절마다 제목 다음 첫 문단 뒤에 넣는다 ----------
body = body.replace(/(<section class="sub" id="p4-s(\d+)"[^>]*>\s*<h3>[\s\S]*?<\/h3>[\s\S]*?<\/p>)/g, (m, head, n) => `${head}\n<div class="widget" data-w="slide" data-s="${n}"></div>`);

// ---------- 장 번호 ----------
body = body.replace(/<section class="part" id="(p\d)"([^>]*)>\s*<h2>/g, (m, id, rest) => {
  const n = +id.slice(1); const lab = n === 0 ? '시작하기' : `${n}부`;
  return `<section class="part" id="${id}"${rest}>\n<h2><span class="no">${lab}</span>`;
});

// ---------- 목차 ----------
const strip = s => s.replace(/<span class="no">[\s\S]*?<\/span>/, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const toc = []; const re = /<section class="(part|sub)" id="([^"]+)"[^>]*>\s*<h([23])>([\s\S]*?)<\/h\3>/g; let mm;
while ((mm = re.exec(body))) {
  if (mm[1] === 'part') toc.push({ id: mm[2], t: strip(mm[4]), subs: [] });
  else if (toc.length) toc[toc.length - 1].subs.push({ id: mm[2], t: strip(mm[4]) });
}
const tocHTML = '<ol>' + toc.map(p => {
  const n = +p.id.slice(1), lab = n === 0 ? '' : `<span class="no">${n}부</span>`;
  const li = s => `<li data-id="${s.id}"><a href="#${s.id}">${s.t}</a></li>`;
  let subs;
  if (p.id === 'p4') {
    const isS = s => /^p4-s\d+$/.test(s.id), first = p.subs.findIndex(isS);
    const before = p.subs.slice(0, first).filter(s => !isS(s)), slides = p.subs.filter(isS), after = p.subs.slice(first).filter(s => !isS(s));
    subs = `<ol>${before.map(li).join('')}</ol><ol class="grid">${slides.map(s => `<li data-id="${s.id}"><a href="#${s.id}" aria-label="${s.t.replace(/"/g, '&quot;')}">${s.id.slice(4)}</a></li>`).join('')}</ol><ol>${after.map(li).join('')}</ol>`;
  } else subs = `<ol>${p.subs.map(li).join('')}</ol>`;
  return `<li><a class="pt" href="#${p.id}">${lab}${p.t}</a>${p.subs.length ? subs : ''}</li>`;
}).join('') + '</ol>';
const nSubs = toc.reduce((a, p) => a + p.subs.length, 0);

// ---------- 머리와 꼬리 ----------
const cells = (() => { const rows = [3, 3, 8, 8, 13, 13], cls = ['a', 'a', 'b', 'b', 'c', 'c']; let s = ''; rows.forEach((g, r) => { for (let c = 0; c < 18; c++) s += `<i${c >= g ? ` class="${cls[r]}"` : ''}></i>`; }); return s; })();
// 화면 테마 단추(자동은 기기 설정을 따른다). 넓은 화면에서는 목차 위, 좁은 화면에서는 머리말 아래에 보인다.
const themeCtl = `<div class="theme"><span class="seg-l">화면</span><span class="seg" role="group" aria-label="화면 테마"><button type="button" data-t="auto">자동</button><button type="button" data-t="light">밝게</button><button type="button" data-t="dark">어둡게</button></span></div>`;
const header = `<header class="top">
<p class="kicker">BME 642 마케팅자료분석론 / Week 10 / 발제 독해가이드</p>
<h1>Staggered DID 발표 독해가이드</h1>
<p class="dek">Baker, Larcker &amp; Wang (2022)을 OLS와 2×2 DID에서 출발해 끝까지 따라가고 29장의 발표를 한 장씩 해설하는 자료</p>
<div class="meta"><span><b>발표</b> 2026년 11월 18일(수)</span><span><b>덱</b> <a href="${DECK}" target="_blank" rel="noopener">29장 124단계</a>, 대본 약 38분</span><span><b>원문</b> Journal of Financial Economics 144(2), 370-395</span></div>
<div class="grid-cells" aria-hidden="true">${cells}</div>
<p class="grid-cap">행은 단위, 열은 시점이고 색칠된 칸이 도입 이후(D = 1)다. 세 코호트가 서로 다른 시점에 도입하는 것이 시차 도입이다.</p>
${themeCtl}
</header>`;
const footer = `<footer class="end">
<p>근거 자료는 원문 PDF, 수업 자료 폴더의 심층요약과 Cheat Sheet, 덱 원고(<code>presentation/_src/20261118</code>)와 대본, 슬라이드 작업기록, 후속논의 문서(2026-11-13 조사)다. 계산기와 도식은 덱의 계산 코어 <code>stats.js</code>, <code>simcore.js</code>를 그대로 사용한다.</p>
<p>원본은 <code>presentation/_guide/parts/</code>에 있고, <code>web</code> 폴더에서 <code>node presentation/_guide/build.mjs</code>로 이 폴더를 다시 만든다.</p>
</footer>`;

// 스크립트 순서: 계산 코어, 시뮬레이션 코어, 도식 도구, 부별 도식, 마지막에 초기화(widgets.js)
const SCRIPTS = ['stats.js', 'simcore.js', 'viz-kit.js', 'viz-math.js', ...['viz-p1.js', 'viz-p2.js', 'viz-p3.js', 'viz-p4.js', 'viz-p5.js'].filter(n => fs.existsSync(path.join(G, n))), 'widgets.js'];
const tocBlock = `<p class="ttl">목차</p>${tocHTML}`;
// 장 해설 모드 (index.html?pv&s=장&b=단계): 4부의 그 장 절만 보이고, 덱 발표자 화면이 {pv:'show', n, b}를 보내면 장을 바꾸고 단계 표의 현재 줄을 강조한다.
// 다른 절로 가는 링크는 새 탭에서 가이드 전체로 연다.
const pvJS = `(function () {
  if (!document.documentElement.classList.contains('pv')) return;
  var cur = 0;
  function show(n, b) {
    var sec = document.getElementById('p4-s' + n); if (!sec) return;
    document.querySelectorAll('tr.pvcur').forEach(function (r) { r.classList.remove('pvcur'); });
    if (n !== cur) { document.querySelectorAll('#p4>section.sub').forEach(function (x) { x.classList.toggle('pvon', x === sec); }); cur = n; window.scrollTo(0, 0); }
    sec.querySelectorAll('table').forEach(function (t) {
      var th = t.querySelector('thead th'); if (!th || th.textContent.trim() !== '단계') return;
      t.querySelectorAll('tbody tr').forEach(function (tr) { var c = tr.firstElementChild; tr.classList.toggle('pvcur', !!c && c.textContent.trim() === String(b)); });
    });
  }
  addEventListener('message', function (e) { var m = e.data; if (m && m.pv === 'show') show(+m.n, +m.b); });
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return; e.preventDefault(); window.open(location.pathname + a.getAttribute('href'), '_blank', 'noopener'); }, true);
  var q = new URLSearchParams(location.search); show(+(q.get('s') || 1), +(q.get('b') || 0));
  if (parent !== window) parent.postMessage({ pv: 'ready' }, '*');
})();`;
const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Staggered DID 독해가이드</title>
<link rel="icon" href="data:,">
<script>try{var t=localStorage.getItem('sdid-guide-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}
if(/[?&]pv(=|&|$)/.test(location.search)){document.documentElement.classList.add('pv');document.documentElement.setAttribute('data-theme','dark')}</script>
<link rel="stylesheet" href="../../learning/assets/katex/katex.min.css" onerror="this.onerror=null;this.href='https://cdn.jsdelivr.net/npm/katex@${KVER}/dist/katex.min.css'">
<link rel="stylesheet" href="guide.css">
</head>
<body>
<div class="wrap">
<nav class="toc" aria-label="목차">${themeCtl}${tocBlock}</nav>
<main>
${header}
<details class="toc-m"><summary>목차</summary><div class="tocbody toc">${tocBlock}</div></details>
${body}
${footer}
</main>
${glossHTML}
</div>
${SCRIPTS.map(n => `<script src="${n}"></script>`).join('\n')}
<script>${pvJS}</script>
</body>
</html>
`;

const fontCSS = `@font-face{font-family:'PretendardGuide';font-weight:100 900;font-display:swap;
  src:url('../../learning/assets/fonts/PretendardVariable.woff2') format('woff2'),
      url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/variable/woff2/PretendardVariable.woff2') format('woff2')}
`;
fs.writeFileSync(path.join(OUT, 'index.html'), html);
// 도식 하나만 띄우는 페이지: 발표 덱이 iframe으로 불러 쓴다 (w.html?w=도식이름&nw=자연폭).
// 덱이 {gw:'states'}로 단계별 조작 목록을 주고 {gw:'set', b}로 단계를 고르면 그 조작을 재현한다.
// 키보드와 휠은 덱으로 넘겨서 iframe 안을 누른 뒤에도 덱 넘기기가 그대로 동작한다.
const soloJS = `(function () {
  var q = new URLSearchParams(location.search), NW = +(q.get('nw') || 660), root = document.getElementById('solo');
  var host = root.querySelector('.widget'), states = [[]], cur = -1, H = 0, ready = false;
  root.style.width = NW + 'px';
  function act(a) {
    if (a[0] === 'step') { var d = host.querySelectorAll('.vdots i')[a[1]]; if (d) d.click(); }
    else if (a[0] === 'seg') { var g = host.querySelectorAll('.ctrls .seg')[a[1]], b = g && g.children[a[2]]; if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); }
  }
  function measure() {
    root.style.zoom = 1; var m = 0;
    states.forEach(function (s) { s.forEach(act); m = Math.max(m, host.offsetHeight); });
    H = m; if (cur >= 0) (states[cur] || []).forEach(act);
  }
  function fit() {
    if (!innerWidth || !innerHeight) return;
    if (!H) measure();
    var z = Math.min(innerWidth / NW, innerHeight / (H + 2)); root.style.zoom = z;
  }
  addEventListener('resize', fit);
  addEventListener('message', function (e) {
    var m = e.data; if (!m || !m.gw || e.source !== parent) return;
    if (m.gw === 'states') { states = m.states || [[]]; H = 0; }
    if (m.gw === 'set') { cur = m.b; (states[cur] || []).forEach(act); }
    fit();
  });
  var KEYS = { ArrowRight: 'next', ' ': 'next', PageDown: 'next', Enter: 'next', ArrowDown: 'next', ArrowLeft: 'prev', PageUp: 'prev', Backspace: 'prev', ArrowUp: 'prev', Home: 'first', End: 'last', k: 'kb', K: 'kb', f: 'fs', F: 'fs', n: 'notes', N: 'notes', Escape: 'esc' };
  addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.matches && e.target.matches('input[type=range]') && /^Arrow/.test(e.key)) return;
    var k = KEYS[e.key]; if (!k) return;
    if (e.shiftKey && k === 'next') k = 'ns'; else if (e.shiftKey && k === 'prev') k = 'ps';
    e.preventDefault(); e.stopPropagation(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    parent.postMessage({ deck: 'cmd', k: k }, '*');
  }, true);
  var acc = 0, lock = 0;
  addEventListener('wheel', function (e) { e.preventDefault(); var now = Date.now(); if (now < lock) return; acc += e.deltaY; if (Math.abs(acc) < 40) return;
    parent.postMessage({ deck: 'cmd', k: acc > 0 ? 'next' : 'prev' }, '*'); acc = 0; lock = now + 450; }, { passive: false });
  window.__initAllWidgets && window.__initAllWidgets();
  ready = true; fit(); if (parent !== window) parent.postMessage({ gw: 'ready' }, '*');
})();`;
const solo = `<!doctype html>
<html lang="ko" data-theme="light" class="solo">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>도식</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="../../learning/assets/katex/katex.min.css" onerror="this.onerror=null;this.href='https://cdn.jsdelivr.net/npm/katex@${KVER}/dist/katex.min.css'">
<link rel="stylesheet" href="guide.css">
<style>
html.solo,html.solo body{background:transparent;margin:0;padding:0;overflow:hidden;height:100%}
html.solo body{display:flex;justify-content:center;align-items:flex-start}
#solo .widget{margin:0;border:0;border-radius:0;padding:2px 4px;background:transparent}
#solo .wt,#solo .wh,#solo .wnote,#solo .vbar,#solo .vcalc{display:none}
#solo .vcap{min-height:0}
</style>
</head>
<body>
<div id="solo"></div>
<script>(function () { var w = new URLSearchParams(location.search).get('w') || '', d = document.createElement('div'); d.className = 'widget'; d.setAttribute('data-w', w); document.getElementById('solo').appendChild(d); })();</script>
${SCRIPTS.map(n => `<script src="${n}"></script>`).join('\n')}
<script>${soloJS}</script>
</body>
</html>
`;
fs.writeFileSync(path.join(OUT, 'w.html'), solo);
fs.writeFileSync(path.join(OUT, 'guide.css'), fontCSS + fs.readFileSync(path.join(G, 'guide.css'), 'utf8'));
for (const n of SCRIPTS) fs.copyFileSync(path.join(['stats.js', 'simcore.js'].includes(n) ? SRC : G, n), path.join(OUT, n));

const plain = body.replace(/<span class="katex[\s\S]*?<\/span><\/span><\/span>/g, '').replace(/<[^>]+>/g, ' ');
console.log(JSON.stringify({
  out: path.relative(WEB, OUT), missing, tex: nTex, texErr, figErr, figs: figs.size,
  gloss: Object.keys(gloss).length, glossDup, glossMissing, derivs: (body.match(/<div class="deriv"/g) || []).length,
  sections: toc.map(p => `${p.id}:${p.subs.length}`).join(' '),
  hangul: (plain.match(/[가-힣]/g) || []).length, kb: Math.round(Buffer.byteLength(html) / 1024)
}, null, 1));
