// 도식 점검: 지정한 도식을 단계마다 하나씩 띄운 접촉 시트를 headless Chrome으로 캡처한다.
// 사용: node presentation/_guide/tools/viz-sheet.mjs <도식이름> <출력폴더> [폭=760] [dark]
//   먼저 `node presentation/_guide/build.mjs`로 20261118-guide/를 만든 뒤 실행한다.
//   단계가 없는 도식(슬라이더형)은 한 장만 찍힌다. 콘솔 오류와 svg 밖으로 나간 텍스트를 함께 보고한다.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const U = p => pathToFileURL(p).href;

const [name, outDir, width = '760', theme] = process.argv.slice(2);
if (!name || !outDir) { console.error('usage: viz-sheet.mjs <name> <outDir> [width] [dark]'); process.exit(1); }
const G = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.resolve(G, '../20261118-guide');
const idx = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const scripts = [...idx.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
fs.mkdirSync(outDir, { recursive: true });
const html = `<!doctype html><html lang="ko"${theme === 'dark' ? ' data-theme="dark"' : ''}><head><meta charset="utf-8">
<link rel="stylesheet" href="${U(path.resolve(SITE, '../../learning/assets/katex/katex.min.css'))}"><link rel="stylesheet" href="${U(path.join(SITE, 'guide.css'))}">
<style>body{padding:16px!important}.cell{max-width:${width}px;margin:0 0 18px}.cell>b{font:600 12px sans-serif;color:#888}</style></head><body>
<div id="host"></div>
<script>window.GV_INSTANT=true</script>
${scripts.filter(s => s !== 'widgets.js').map(s => `<script src="${U(path.join(SITE, s))}"></script>`).join('\n')}
<script>
window.__errs=[];window.addEventListener('error',e=>window.__errs.push(e.message));
const fn=GV.R[${JSON.stringify(name)}];const host=document.getElementById('host');
function mk(){const c=document.createElement('div');c.className='cell';const w=document.createElement('div');w.className='widget';w.dataset.w=${JSON.stringify(name)};c.appendChild(w);host.appendChild(c);try{fn(w);}catch(e){window.__errs.push(String(e&&e.stack||e));}return [c,w];}
if(!fn){document.body.textContent='NOT REGISTERED';}else{
 const [c0,w0]=mk();const n=w0.querySelectorAll('.vdots i').length||1;
 for(let i=1;i<n;i++){const [c,w]=mk();const d=w.querySelectorAll('.vdots i');setTimeout(()=>d[i].click(),50);c.insertAdjacentHTML('afterbegin','<b>step '+(i+1)+'</b>');}
 c0.insertAdjacentHTML('afterbegin','<b>step 1</b>');
 setTimeout(()=>{const bad=[];document.querySelectorAll('svg.wsvg').forEach((sv,k)=>{const vb=sv.viewBox.baseVal;sv.querySelectorAll('text').forEach(t=>{if(t.getAttribute('opacity')==='0'||t.style.visibility==='hidden')return;const sr=sv.getBoundingClientRect(),b=t.getBoundingClientRect();if(b.width&&(b.left<sr.left-1||b.top<sr.top-1||b.right>sr.right+1||b.bottom>sr.bottom+1))bad.push('cell'+k+': '+t.textContent.slice(0,30));});});
 document.title='ERR='+JSON.stringify(window.__errs)+' OUT='+JSON.stringify(bad);},3500);}
</script></body></html>`;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vizsheet-'));
const f = path.join(tmp, 'sheet.html'); fs.writeFileSync(f, html);
const prof = path.join(tmp, 'prof');
const chrome = (args) => execFileSync('google-chrome', ['--headless=new', '--disable-gpu', '--no-sandbox', `--user-data-dir=${prof}`, '--hide-scrollbars', '--virtual-time-budget=6000', ...args, U(f)], { stdio: ['ignore', 'pipe', 'ignore'], timeout: 90000, maxBuffer: 256 * 1024 * 1024 }).toString();
const dom = chrome(['--dump-dom']);
const title = (dom.match(/<title>([\s\S]*?)<\/title>/) || [, 'no title'])[1];
const nCells = (dom.match(/class="cell"/g) || []).length;
const H = Math.min(16000, 120 + nCells * 760);
const png = path.join(outDir, `${name}${theme === 'dark' ? '-dark' : ''}.png`);
chrome([`--window-size=${+width + 40},${H}`, `--screenshot=${png}`]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(JSON.stringify({ png, cells: nCells, report: title.replace(/&quot;/g, '"') }));
