import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {marked} from 'marked';
import katex from 'katex';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=path.resolve(root,'materials');
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const weeks=[], pages={}, routes=new Map([[path.join(base,'README.md'),'']]);let mathCount=0;
// Summary and concept quiz are required; the model quiz and cheat sheet are added when present.
const MODES=[['summary','_심층요약.md',true],['quiz','_QnA.md',true],['model','_수식모델퀴즈.md',false],['cheatsheet','_실무CheatSheet.md',false]];
const labels=['기업의 의사결정','무작위 실험','고정효과와 DID','도구변수의 원리','도구변수와 효과의 해석','LATE와 실제 연구','매칭과 선택편향','RD와 광고효과','경계에서의 비교','정책 도입과 파급효과','리뷰 조작','리뷰어의 영향력','리뷰와 광고예산'];
for(const [i,folder] of fs.readdirSync(base).filter(n=>/^Week \d/.test(n)).sort().entries()){
 const files=fs.readdirSync(path.join(base,folder));const week={id:String(i+1).padStart(2,'0'),folder,label:labels[i],date:folder.match(/\d{4}-\d{2}-\d{2}/)[0],docs:[],extras:[]};
 for(const [j,pdf] of files.filter(n=>n.endsWith('.pdf')).entries()){
  const stem=pdf.slice(0,-4),id=`w${week.id}-${j+1}`;
  const doc={id,title:stem,pdf:'materials/'+[folder,pdf].map(encodeURIComponent).join('/'),modes:[]};
  for(const [mode,suffix,required] of MODES){const name=stem+suffix;if(!files.includes(name)){if(required)throw Error('Missing '+name);continue;}doc.modes.push(mode);routes.set(path.join(base,folder,name),`${id}/${mode}`);}
  week.docs.push(doc);
 }
 for(const name of files.filter(n=>n.endsWith('.md')&&!MODES.some(([,suffix])=>n.endsWith(suffix)))){const id=`w${week.id}-${name==='README.md'?'overview':'extra'}`;week.extras.push({id,title:name==='README.md'?'이번 주 안내':'RCT 확장 쟁점',name});routes.set(path.join(base,folder,name),id+'/summary');}
 weeks.push(week);
}
// Multi-line derivations in aligned blocks render with tight rows by default; widen only their row breaks.
const ROW_GAP='0.55em',SPACED_ENVS=new Set(['aligned','align','align*','gathered','gather','gather*','split']);
function spaceRows(tex){
 const stack=[];
 return tex.replace(/\\begin\{([^}]+)\}|\\end\{([^}]+)\}|\\\\(?!\s*\[)/g,(m,open,close)=>{
  if(open){stack.push(open);return m}
  if(close){stack.pop();return m}
  return SPACED_ENVS.has(stack.at(-1))?`\\\\[${ROW_GAP}]`:m;
 });
}
// Interactive blocks: <!-- learning-interactive:id --> caption Markdown <!-- /learning-interactive -->
const INTERACTIVE_BLOCK=/<!-- learning-interactive:([a-z0-9-]+) -->\n([\s\S]*?)\n<!-- \/learning-interactive -->/g;
const usedInteractives=new Set();
function compile(src,file){
 const blocks=[];
 src=src.replace(INTERACTIVE_BLOCK,(m,id,body)=>{
  if(!fs.existsSync(path.join(root,'interactives',id+'.js')))throw Error(`Unknown interactive "${id}" in ${file}`);
  usedInteractives.add(id);blocks.push({id,caption:compile(body.trim(),file)});
  return `\n\nINTERACTIVEPLACEHOLDER${blocks.length-1}END\n\n`;
 });
 const math=[];
 // Shield math before Markdown can consume TeX backslashes, underscores, or table pipes.
 const protectedSource=src.replace(/```[\s\S]*?```|`[^`\n]+`|\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|(?<![\\$])\$(?!\$)([^\n$]+?)(?<!\\)\$(?!\$)/g,(full,a,b,c,d)=>{
  if(full.startsWith('`'))return full;
  const display=a!==undefined||b!==undefined;
  const tex=a??b??c??d,html=katex.renderToString(display?spaceRows(tex):tex,{displayMode:display,throwOnError:true,strict:'ignore',trust:false,output:'htmlAndMathml'});
  mathCount++;const key=`MATHPLACEHOLDER${math.length}END`;math.push(display?`<span class="math-scroll">${html}</span>`:html);return key;
 });
 const renderer=new marked.Renderer();
 renderer.image=function({href,text,title}){
  const abs=path.resolve(path.dirname(file),decodeURIComponent(href));
  if(!abs.startsWith(base+path.sep)||!fs.existsSync(abs)||!abs.endsWith('.svg'))throw Error('Invalid figure: '+href);
  const svg=fs.readFileSync(abs,'utf8');
  const [,width,height]=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)||[];
  if(!width||!height)throw Error('Missing figure dimensions: '+href);
  const target='materials/'+path.relative(base,abs).split(path.sep).map(encodeURIComponent).join('/');
  return `<a class="figure-image" href="${esc(target)}" target="_blank" rel="noopener"><img src="${esc(target)}" alt="${esc(text)}" width="${width}" height="${height}" loading="lazy" decoding="async"></a>`;
 };
 renderer.paragraph=function({tokens}){
  if(tokens.length===1&&tokens[0].type==='image'){
   const token=tokens[0],target='materials/'+path.relative(base,path.resolve(path.dirname(file),decodeURIComponent(token.href))).split(path.sep).map(encodeURIComponent).join('/');
   return `<figure class="learning-figure">${this.parser.parseInline(tokens)}<figcaption><span>${esc(token.title||'설명 그림')}</span><a href="${esc(target)}" target="_blank" rel="noopener">크게 보기</a></figcaption></figure>\n`;
  }
  return `<p>${this.parser.parseInline(tokens)}</p>\n`;
 };
 renderer.link=function({href,title,tokens}){let target=href; if(!/^(?:[a-z]+:|#|\/)/i.test(href)){
   const abs=path.resolve(path.dirname(file),decodeURIComponent(href));
   target=routes.has(abs)?'#/'+routes.get(abs):'materials/'+path.relative(base,abs).split(path.sep).map(encodeURIComponent).join('/');
  }return `<a href="${esc(target)}"${/\.pdf$/i.test(target)?' target="_blank" rel="noopener"':''}>${this.parser.parseInline(tokens)}</a>`;};
 // A lone "~" in prose is a range mark ("(1)~(4)열"); GFM would pair two of them into strikethrough.
 const tildeSafe=protectedSource.replace(/```[\s\S]*?```|`[^`\n]+`|(?<!~)~(?!~)/g,m=>m.startsWith('`')?m:'\\~');
 let html=marked.parse(tildeSafe,{renderer,gfm:true});
 html=html.replace(/MATHPLACEHOLDER(\d+)END/g,(_,i)=>math[Number(i)]);
 html=html.replace(/<p>INTERACTIVEPLACEHOLDER(\d+)END<\/p>/g,(_,i)=>{const b=blocks[Number(i)];return `<figure class="learning-interactive" data-interactive="${b.id}"><div class="li-mount"></div><figcaption>${b.caption}</figcaption></figure>`});
 return html;
}
for(const week of weeks){
 for(const doc of [...week.docs,...week.extras]){
  for(const mode of (doc.name?['summary']:doc.modes)){
   const file=path.join(base,week.folder,doc.name??doc.title+MODES.find(([m])=>m===mode)[1]);
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
// Split output so the first visit only downloads a small index; each page and the search text load on demand.
// Hashed file names under data/immutable/ can be cached for a year because any content change renames the file.
const dataDir=path.join(root,'assets/data'),immutable=path.join(dataDir,'immutable');
fs.rmSync(dataDir,{recursive:true,force:true});fs.rmSync(path.join(root,'assets/content.js'),{force:true});
fs.mkdirSync(immutable,{recursive:true});
const js=v=>JSON.stringify(v).replaceAll('<','\\u003c');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,10);
const pageIndex={},searchText={};
for(const [key,page] of Object.entries(pages)){
 const body=`window.__learningPage(${js(key)},${js({html:page.html,title:page.title})});\n`;
 const name=`${key.replace('/','-')}.${hash(body)}.js`;
 fs.writeFileSync(path.join(immutable,name),body);
 pageIndex[key]={file:'assets/data/immutable/'+name,title:page.title};searchText[key]=page.text;
}
const searchBody=`window.__learningSearch(${js(searchText)});\n`,searchName=`search.${hash(searchBody)}.js`;
// All interactives share one lazily loaded bundle: the toolkit first, then every module.
const interactiveDir=path.join(root,'interactives');
const modules=fs.readdirSync(interactiveDir).filter(n=>n.endsWith('.js')&&n!=='core.js').sort();
// Syntax-check every module and isolate runtime errors so one broken module cannot disable the others.
const isolate=name=>{const code=fs.readFileSync(path.join(interactiveDir,name),'utf8');try{new vm.Script(code,{filename:name})}catch(e){throw Error(`Interactive ${name} has a syntax error: ${e.message}`)}return `try{\n${code}\n}catch(e){console.error('interactive ${name}',e)}`};
const interactivesBody=[fs.readFileSync(path.join(interactiveDir,'core.js'),'utf8'),...modules.map(isolate)].join('\n;\n');
const interactivesName=`interactives.${hash(interactivesBody)}.js`;
fs.writeFileSync(path.join(immutable,interactivesName),interactivesBody);
fs.writeFileSync(path.join(immutable,searchName),searchBody);
fs.writeFileSync(path.join(dataDir,'index.js'),`window.LEARNING_INDEX=${js({weeks,pages:pageIndex,search:'assets/data/immutable/'+searchName,interactives:'assets/data/immutable/'+interactivesName,usedInteractives:[...usedInteractives].sort(),mathCount})};\n`);
console.log(`${weeks.length} weeks, ${Object.keys(pages).length} pages, ${mathCount} math expressions compiled successfully.`);
