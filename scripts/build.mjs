import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
await import('../learning/scripts/build.mjs');
const dist=path.join(root,'dist');
fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(path.join(dist,'learning'),{recursive:true});
fs.mkdirSync(path.join(dist,'presentation'),{recursive:true});
for(const name of ['index.html','app.js','styles.css','assets'])fs.cpSync(path.join(root,'learning',name),path.join(dist,'learning',name),{recursive:true});
for(const week of fs.readdirSync(path.join(root,'learning/materials')).filter(n=>/^Week \d/.test(n))){
 const out=path.join(dist,'learning/materials',week);fs.mkdirSync(out,{recursive:true});
 for(const name of fs.readdirSync(path.join(root,'learning/materials',week)).filter(n=>/\.(pdf|md)$/.test(n)))fs.copyFileSync(path.join(root,'learning/materials',week,name),path.join(out,name));
}
fs.copyFileSync(path.join(root,'learning/materials/README.md'),path.join(dist,'learning/materials/README.md'));
fs.cpSync(path.join(root,'learning/materials/figures'),path.join(dist,'learning/materials/figures'),{recursive:true});
const presentations=fs.readdirSync(path.join(root,'presentation')).filter(n=>/^\d{8}.*\.html$/.test(n)).sort().reverse();
for(const name of presentations){
 fs.copyFileSync(path.join(root,'presentation',name),path.join(dist,'presentation',name));
 // Preserve every previously published dated presentation URL.
 fs.copyFileSync(path.join(root,'presentation',name),path.join(dist,name));
}
function index(prefix){return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>마케팅자료분석론 · 발표자료</title><link rel="icon" href="data:,"><style>@font-face{font-family:Pretendard;src:url('${prefix?'':'../'}learning/assets/fonts/PretendardVariable.woff2') format('woff2');font-weight:100 900}*{box-sizing:border-box}body{font-family:Pretendard,sans-serif;color:#24292f;margin:0;line-height:1.65}main{max-width:800px;margin:auto;padding:64px 24px}small,footer{color:#606873}h1{font-size:30px;letter-spacing:-.6px;margin:12px 0 8px}p{margin:0 0 40px;color:#606873}ol{padding-left:24px}li{padding:20px 0;border-bottom:1px solid #e3e6ea}a{color:#285bb3;text-decoration:none}a:hover{text-decoration:underline}footer{font-size:12px;margin-top:48px}@media(max-width:600px){main{padding:36px 22px}h1{font-size:26px}}</style></head><body><main><small>2026 가을학기 · 윤태중 교수</small><h1>마케팅자료분석론 발표자료</h1><p>수업 발표용 슬라이드입니다.</p><ol>${presentations.map(name=>`<li><a href="${prefix}${name}">${name.slice(0,4)}.${name.slice(4,6)}.${name.slice(6,8)} 발표자료</a></li>`).join('')}</ol><footer>by TaeYoung Kang</footer></main></body></html>`}
fs.writeFileSync(path.join(dist,'index.html'),index('presentation/'));
fs.writeFileSync(path.join(dist,'presentation/index.html'),index(''));
console.log(`배포 출력: dist (발표 ${presentations.length}개, 학습 /learning/)`);
