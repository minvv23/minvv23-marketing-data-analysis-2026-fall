import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {marked} from 'marked';
import katex from 'katex';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=path.resolve(root,'materials');
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const weeks=[], pages={}, routes=new Map([[path.join(base,'README.md'),'']]);let mathCount=0;
const labels=['기업의 의사결정','무작위 실험','고정효과와 DID','도구변수의 원리','도구변수와 효과의 해석','LATE와 실제 연구','매칭과 선택편향','RD와 광고효과','경계에서의 비교','정책 도입과 파급효과','리뷰 조작','리뷰어의 영향력','리뷰와 광고예산'];
for(const [i,folder] of fs.readdirSync(base).filter(n=>/^Week \d/.test(n)).sort().entries()){
 const files=fs.readdirSync(path.join(base,folder));const week={id:String(i+1).padStart(2,'0'),folder,label:labels[i],date:folder.match(/\d{4}-\d{2}-\d{2}/)[0],docs:[],extras:[]};
 for(const [j,pdf] of files.filter(n=>n.endsWith('.pdf')).entries()){
  const stem=pdf.slice(0,-4),id=`w${week.id}-${j+1}`;
  const doc={id,title:stem,pdf:'materials/'+[folder,pdf].map(encodeURIComponent).join('/')};
  for(const [mode,suffix] of [['summary','_심층요약.md'],['quiz','_QnA.md']]){const name=stem+suffix;if(!files.includes(name))throw Error('Missing '+name);routes.set(path.join(base,folder,name),`${id}/${mode}`);}
  week.docs.push(doc);
 }
 for(const name of files.filter(n=>n.endsWith('.md')&&!/_심층요약|_QnA/.test(n))){const id=`w${week.id}-${name==='README.md'?'overview':'extra'}`;week.extras.push({id,title:name==='README.md'?'이번 주 안내':'RCT 확장 쟁점',name});routes.set(path.join(base,folder,name),id+'/summary');}
 weeks.push(week);
}
function compile(src,file){
 const math=[];
 // Shield math before Markdown can consume TeX backslashes, underscores, or table pipes.
 const protectedSource=src.replace(/```[\s\S]*?```|`[^`\n]+`|\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|(?<![\\$])\$(?!\$)([^\n$]+?)(?<!\\)\$(?!\$)/g,(full,a,b,c,d)=>{
  if(full.startsWith('`'))return full;
  const display=a!==undefined||b!==undefined;
  const html=katex.renderToString(a??b??c??d,{displayMode:display,throwOnError:true,strict:'ignore',trust:false,output:'htmlAndMathml'});
  mathCount++;const key=`MATHPLACEHOLDER${math.length}END`;math.push(display?`<span class="math-scroll">${html}</span>`:html);return key;
 });
 const renderer=new marked.Renderer();
 renderer.link=function({href,title,tokens}){let target=href; if(!/^(?:[a-z]+:|#|\/)/i.test(href)){
   const abs=path.resolve(path.dirname(file),decodeURIComponent(href));
   target=routes.has(abs)?'#/'+routes.get(abs):'materials/'+path.relative(base,abs).split(path.sep).map(encodeURIComponent).join('/');
  }return `<a href="${esc(target)}"${/\.pdf$/i.test(target)?' target="_blank" rel="noopener"':''}>${this.parser.parseInline(tokens)}</a>`;};
 let html=marked.parse(protectedSource,{renderer,gfm:true});
 html=html.replace(/MATHPLACEHOLDER(\d+)END/g,(_,i)=>math[Number(i)]);
 return html;
}
for(const week of weeks){
 for(const doc of [...week.docs,...week.extras]){
  for(const mode of (doc.name?['summary']:['summary','quiz'])){
   const file=path.join(base,week.folder,doc.name??doc.title+(mode==='summary'?'_심층요약.md':'_QnA.md'));
   const src=fs.readFileSync(file,'utf8');const key=doc.id+'/'+mode;
   pages[key]={html:compile(src,file),text:src.replace(/[#*$>|]/g,''),title:src.match(/^# (.+)/m)?.[1]??doc.title};
  }
 }
}
fs.mkdirSync(path.join(root,'assets'),{recursive:true});
const katexAssets=path.join(root,'assets/katex');
fs.rmSync(katexAssets,{recursive:true,force:true});
fs.mkdirSync(katexAssets,{recursive:true});
fs.cpSync(path.join(root,'../node_modules/katex/dist/fonts'),path.join(katexAssets,'fonts'),{recursive:true});
fs.copyFileSync(path.join(root,'../node_modules/katex/dist/katex.min.css'),path.join(katexAssets,'katex.min.css'));
fs.copyFileSync(path.join(root,'../node_modules/katex/LICENSE'),path.join(root,'assets/katex/LICENSE'));
fs.writeFileSync(path.join(root,'assets/content.js'),'window.LEARNING_DATA='+JSON.stringify({weeks,pages,mathCount}).replaceAll('<','\\u003c')+';\n');
console.log(`${weeks.length} weeks, ${Object.keys(pages).length} pages, ${mathCount} math expressions compiled successfully.`);
