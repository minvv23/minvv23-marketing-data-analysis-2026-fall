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
const OUT = path.join(WEB, 'presentation/20261118-guide');
const DECK = '../20261118-presentation.html';

const order = ['0-intro', '1-basics', '2-sim', '3-alt', '4-deck', '5-qa'];
const missing = [];
let body = order.map(n => {
  const p = path.join(G, 'parts', n + '.html');
  if (!fs.existsSync(p)) { missing.push(n); return ''; }
  return fs.readFileSync(p, 'utf8');
}).join('\n');

// ---------- 수식 ----------
const unesc = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const texErr = [];
let nTex = 0;
body = body.replace(/<tex(\s+class="d")?>([\s\S]*?)<\/tex>/g, (m, d, tex) => {
  nTex++;
  try { return katex.renderToString(unesc(tex).trim(), { displayMode: !!d, throwOnError: true, output: 'html', strict: 'ignore', trust: false }); }
  catch (e) { texErr.push(tex.slice(0, 80) + ' :: ' + e.message.slice(0, 120)); return katex.renderToString(unesc(tex).trim(), { displayMode: !!d, throwOnError: false, strict: 'ignore' }); }
});

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
const header = `<header class="top">
<p class="kicker">BME 642 마케팅자료분석론 / Week 10 / 발제 독해가이드</p>
<h1>Staggered DID 발표 독해가이드</h1>
<p class="dek">Baker, Larcker &amp; Wang (2022)을 OLS와 2×2 DID에서 출발해 끝까지 따라가고 29장의 발표를 한 장씩 해설하는 자료</p>
<div class="meta"><span><b>발표</b> 2026년 11월 18일(수)</span><span><b>덱</b> <a href="${DECK}" target="_blank" rel="noopener">29장 124단계</a>, 대본 약 38분</span><span><b>원문</b> Journal of Financial Economics 144(2), 370-395</span></div>
<div class="grid-cells" aria-hidden="true">${cells}</div>
<p class="grid-cap">행은 단위, 열은 시점이고 색칠된 칸이 도입 이후(D = 1)다. 세 코호트가 서로 다른 시점에 도입하는 것이 시차 도입이다.</p>
</header>`;
const footer = `<footer class="end">
<p>근거 자료는 원문 PDF, 수업 자료 폴더의 심층요약과 Cheat Sheet, 덱 원고(<code>presentation/_src/20261118</code>)와 대본, 슬라이드 작업기록, 후속논의 문서(2026-11-13 조사)다. 계산기와 도식은 덱의 계산 코어 <code>stats.js</code>, <code>simcore.js</code>를 그대로 사용한다.</p>
<p>원본은 <code>presentation/_guide/parts/</code>에 있고, <code>web</code> 폴더에서 <code>node presentation/_guide/build.mjs</code>로 이 폴더를 다시 만든다.</p>
</footer>`;

// 스크립트 순서: 계산 코어, 시뮬레이션 코어, 도식 도구, 부별 도식, 마지막에 초기화(widgets.js)
const SCRIPTS = ['stats.js', 'simcore.js', 'viz-kit.js', ...['viz-p1.js', 'viz-p2.js', 'viz-p3.js'].filter(n => fs.existsSync(path.join(G, n))), 'widgets.js'];
const tocBlock = `<p class="ttl">목차</p>${tocHTML}<div class="prog">읽은 절 <span class="pc">0</span> / <span class="tot">${nSubs}</span><div class="bar"><i></i></div></div>`;
const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Staggered DID 독해가이드</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="../../learning/assets/katex/katex.min.css" onerror="this.onerror=null;this.href='https://cdn.jsdelivr.net/npm/katex@${KVER}/dist/katex.min.css'">
<link rel="stylesheet" href="guide.css">
</head>
<body>
<div class="wrap">
<nav class="toc" aria-label="목차">${tocBlock}</nav>
<main>
${header}
<details class="toc-m"><summary>목차</summary><div class="tocbody toc">${tocBlock}</div></details>
${body}
${footer}
</main>
</div>
${SCRIPTS.map(n => `<script src="${n}"></script>`).join('\n')}
</body>
</html>
`;

const fontCSS = `@font-face{font-family:'PretendardGuide';font-weight:100 900;font-display:swap;
  src:url('../../learning/assets/fonts/PretendardVariable.woff2') format('woff2'),
      url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/variable/woff2/PretendardVariable.woff2') format('woff2')}
`;
fs.writeFileSync(path.join(OUT, 'index.html'), html);
fs.writeFileSync(path.join(OUT, 'guide.css'), fontCSS + fs.readFileSync(path.join(G, 'guide.css'), 'utf8'));
for (const n of SCRIPTS) fs.copyFileSync(path.join(['stats.js', 'simcore.js'].includes(n) ? SRC : G, n), path.join(OUT, n));

const plain = body.replace(/<span class="katex[\s\S]*?<\/span><\/span><\/span>/g, '').replace(/<[^>]+>/g, ' ');
console.log(JSON.stringify({
  out: path.relative(WEB, OUT), missing, tex: nTex, texErr, figErr, figs: figs.size,
  sections: toc.map(p => `${p.id}:${p.subs.length}`).join(' '),
  hangul: (plain.match(/[가-힣]/g) || []).length, kb: Math.round(Buffer.byteLength(html) / 1024)
}, null, 1));
