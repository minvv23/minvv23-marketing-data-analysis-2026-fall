// 도식마다 단계별로 보이는 내용의 아래 끝을 재서 viewBox 아래 빈 여백을 보고한다.
// 사용: node presentation/_guide/tools/vizgap.mjs <guide index.html 경로> [도식이름...]
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire('/home/hunnae/.npm/_npx/e41f203b7505f1fb/node_modules/');
const { chromium } = require('playwright');
const [file, ...only] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.addInitScript(() => { window.GV_INSTANT = true; });
await p.goto(pathToFileURL(file).href, { waitUntil: 'load' });
await p.evaluate(() => window.__initAllWidgets());
await p.waitForTimeout(800);
const res = await p.evaluate(async (only) => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = [];
  const vis = (el, svg) => { for (let e = el; e && e !== svg.parentNode; e = e.parentNode) { if (e.nodeType !== 1) continue; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return false; const o = e.getAttribute('opacity'); if (o != null && +o < 0.05) return false; if (+cs.opacity < 0.05) return false; } return true; };
  function measure(svg) {
    const vb = svg.viewBox.baseVal, r = svg.getBoundingClientRect(), k = vb.height / r.height; let lo = Infinity, hi = -Infinity;
    svg.querySelectorAll('text,line,rect,circle,polyline,polygon,path,ellipse').forEach(el => { if (!vis(el, svg)) return; const q = el.getBoundingClientRect(); if (!q.width && !q.height) return; lo = Math.min(lo, (q.top - r.top) * k); hi = Math.max(hi, (q.bottom - r.top) * k); });
    return { H: Math.round(vb.height), top: Math.round(lo), bot: Math.round(hi) };
  }
  for (const w of document.querySelectorAll('.widget[data-w]')) {
    const name = w.dataset.w; if (only.length && !only.includes(name)) continue;
    const svg = w.querySelector('svg.wsvg'); if (!svg) continue;
    const dots = [...w.querySelectorAll('.vdots i')]; const steps = [];
    if (!dots.length) steps.push(measure(svg));
    for (const d of dots) { d.click(); await sleep(60); steps.push(measure(svg)); }
    out.push({ name, sec: (w.closest('section.sub') || {}).id, H: steps[0].H, botMax: Math.max(...steps.map(s => s.bot)), bots: steps.map(s => s.bot).join(','), tops: steps.map(s => s.top).join(',') });
  }
  return out;
}, only);
for (const r of res) { const waste = r.H - r.botMax; const per = r.bots.split(',').map(x => r.H - x); console.log(`${r.name.padEnd(16)} ${String(r.sec).padEnd(12)} H=${r.H} 정적여백=${waste} 단계별여백=[${per.join(',')}] top=[${r.tops}]`); }
await b.close();
