// 20261118 발제 덱 빌드: _src/20261118/ 조각을 단일 HTML로 묶는다.
// 실행 (web 폴더에서): node presentation/_tools/build-20261118.mjs
// - <tex>..</tex>, <tex d>..</tex>, JS 안의 TEX(`..`), TEXD(`..`)를 KaTeX로 미리 렌더한다 (런타임 KaTeX JS 불필요)
// - src="img/이름"을 data URI로 넣는다
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, '../_src/20261118');
const out = path.join(here, '../20261118-presentation.html');
const katex = createRequire(path.join(here, '../../package.json'))('katex');

const render = (tex, display) => katex.renderToString(tex.trim(), { displayMode: display, throwOnError: true, strict: 'ignore', trust: true, output: 'html' });
const read = f => fs.readFileSync(path.join(src, f), 'utf8');
const list = re => fs.readdirSync(src).filter(n => re.test(n)).sort();

let css = read('deck.css');
let slides = list(/^slides.*\.html$/).map(read).join('\n');
let js = ['stats.js', 'simcore.js', 'engine.js', ...list(/^viz.*\.js$/), 'boot.js'].map(f => `/* ===== ${f} ===== */\n` + read(f)).join('\n');

let nTex = 0;
slides = slides.replace(/<tex( d)?>([\s\S]*?)<\/tex>/g, (_, d, t) => { nTex++; return render(t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'), !!d); });
js = js.replace(/TEX(D)?\(`([^`]*)`\)/g, (_, d, t) => { nTex++; return JSON.stringify(render(t, !!d)); });
const img = s => s.replace(/src="img\/([^"]+)"/g, (_, n) => {
  const b = fs.readFileSync(path.join(src, 'img', n));
  return `src="data:image/${path.extname(n).slice(1)};base64,${b.toString('base64')}"`;
});
slides = img(slides);
if (/<\/script/i.test(js)) throw new Error('JS 안에 </script 문자열이 있음');

const html = read('index.html').replace('/*CSS*/', () => css).replace('<!--SLIDES-->', () => slides).replace('/*JS*/', () => js);
fs.writeFileSync(out, html);
console.log(`빌드: ${path.basename(out)} ${(html.length / 1024).toFixed(0)}KB, 수식 ${nTex}개, 슬라이드 ${(slides.match(/<section /g) || []).length}장`);
