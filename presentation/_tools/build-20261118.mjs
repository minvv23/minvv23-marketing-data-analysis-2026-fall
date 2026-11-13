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

// 대본: notes.md를 읽어 {장 id: [0단계, 1단계, ...]}로 만들고, 장마다 단계 수 + 1개가 있는지 확인한다
const notes = {}; { let cur = null, last = null;
  for (const line of read('notes.md').replace(/<!--[\s\S]*?-->/g, '').split('\n')) {
    const h = line.match(/^#\s+(s-[a-z0-9]+)\s*$/), m = line.match(/^(\d+):\s*(.*)$/);
    if (h) { cur = notes[h[1]] = []; last = null; } else if (m && cur) { last = +m[1]; cur[last] = m[2].trim(); } else if (line.trim() && cur && last !== null) cur[last] += ' ' + line.trim();
  } }
const secs = [...slides.matchAll(/<section class="slide[^"]*" id="(s-[a-z0-9]+)" data-builds="(\d+)"[^>]*>([\s\S]*?)<\/section>/g)].map(m => {
  const h1 = (m[3].match(/<h1>([\s\S]*?)<\/h1>/) || [, ''])[1].replace(/<small>[\s\S]*?<\/small>/, '').replace(/<br>/g, ' ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
  return { id: m[1], builds: +m[2], title: h1 }; });
for (const sc of secs) { const a = notes[sc.id] || []; for (let b = 0; b <= sc.builds; b++) if (!a[b]) throw new Error(`대본 없음: ${sc.id} ${b}단계`); if (a.length > sc.builds + 1) throw new Error(`대본이 단계보다 많음: ${sc.id}`); }
for (const id in notes) if (!secs.find(x => x.id === id)) throw new Error(`대본의 장 id가 덱에 없음: ${id}`);

let nTex = 0;
slides = slides.replace(/<tex( d)?>([\s\S]*?)<\/tex>/g, (_, d, t) => { nTex++; return render(t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'), !!d); });
js = js.replace(/TEX(D)?\(`([^`]*)`\)/g, (_, d, t) => { nTex++; return JSON.stringify(render(t, !!d)); });
const img = s => s.replace(/src="img\/([^"]+)"/g, (_, n) => {
  const b = fs.readFileSync(path.join(src, 'img', n));
  return `src="data:image/${path.extname(n).slice(1)};base64,${b.toString('base64')}"`;
});
slides = img(slides);
js = `/* ===== 대본 (notes.md) ===== */\nconst DECK_NOTES = ${JSON.stringify(notes).replace(/</g, '\\u003c')};\n` + js;
if (/<\/script/i.test(js)) throw new Error('JS 안에 </script 문자열이 있음');

const html = read('index.html').replace('/*CSS*/', () => css).replace('<!--SLIDES-->', () => slides).replace('/*JS*/', () => js);
fs.writeFileSync(out, html);
// 읽기용 대본 문서
{ const CPM = 320, len = t => t.replace(/\s/g, '').length, mins = n => (Math.round(n / CPM * 2) / 2).toFixed(1).replace('.0', '');
  const tot = secs.reduce((a, sc) => a + notes[sc.id].reduce((x, t) => x + len(t), 0), 0);
  let md = `# 20261118 Staggered DID 발표 대본\n\n> 이 파일은 빌드가 만든다. 고칠 때는 \`_src/20261118/notes.md\`를 고치고 \`node presentation/_tools/build-20261118.mjs\`를 실행한다.\n> 슬라이드: [20261118-presentation.html](20261118-presentation.html). 대본 전체 분량은 약 ${Math.round(tot / CPM)}분이다 (1분에 ${CPM}자로 계산, 공백 제외 ${tot.toLocaleString('en-US')}자).\n\n`;
  md += `## 덱에서 보는 법\n\n- **N**: 지금 단계의 대본을 화면 아래에 띄우거나 숨긴다. 혼자 읽거나 연습할 때 쓴다.\n- **P**: 발표자 화면을 새 창으로 연다. 그 창을 노트북 화면에 두고 슬라이드 창을 프로젝터로 옮긴다. 어느 창에서 넘겨도 두 창이 함께 넘어간다.\n- 발표자 화면에는 현재 장의 대본(지금 단계 강조), 다음에 말할 내용, 현재 화면, 경과 시간, 남은 대본 분량이 나온다. 시간은 처음 넘길 때부터 잰다. R 키나 시간을 누르면 0으로 돌아간다.\n- 주소 끝에 \`?presenter\`를 붙여 발표자 화면만 따로 열 수도 있다. 이때는 그 창 안의 작은 화면만 넘어간다.\n- 팝업이 차단되면 주소창의 팝업 허용을 누른다.\n\n`;
  md += `## 장별 분량\n\n| 장 | 제목 | 단계 | 분량 |\n|---:|---|---:|---:|\n` + secs.map((sc, i) => `| ${i + 1} | ${sc.title} | ${sc.builds} | ${mins(notes[sc.id].reduce((x, t) => x + len(t), 0))}분 |`).join('\n') + `\n\n시간이 부족하면 가중치의 성질(9), Sun-Abraham 분해(16), 세 대안의 비교(20), 논문 이후(26)를 건너뛰어도 앞뒤가 이어진다. 건너뛸 때는 Shift와 오른쪽 화살표를 쓴다.\n\n---\n\n`;
  md += secs.map((sc, i) => `## ${i + 1}. ${sc.title}\n\n` + notes[sc.id].map((t, b) => `- **${b === 0 ? '시작' : b + '단계'}.** ${t}`).join('\n')).join('\n\n') + '\n';
  fs.writeFileSync(path.join(here, '../20261118_발표대본.md'), md);
  console.log(`대본: ${Object.values(notes).reduce((a, x) => a + x.length, 0)}꼭지, 약 ${Math.round(tot / CPM)}분`); }
console.log(`빌드: ${path.basename(out)} ${(html.length / 1024).toFixed(0)}KB, 수식 ${nTex}개, 슬라이드 ${(slides.match(/<section /g) || []).length}장`);
