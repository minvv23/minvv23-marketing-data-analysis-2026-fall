import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const dist=path.join(root,'dist');const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(dist,'learning/assets/data/index.js'),'utf8'),ctx);
const index=ctx.window.LEARNING_INDEX,loadedPages={};let searchText;
ctx.window.__learningPage=(key,value)=>{loadedPages[key]=value};ctx.window.__learningSearch=value=>{searchText=value};
assert(!fs.existsSync(path.join(dist,'learning/assets/content.js')),'Stale bundled content.js');
for(const [key,meta] of Object.entries(index.pages)){
 assert(/^assets\/data\/immutable\/.+\.[0-9a-f]{10}\.js$/.test(meta.file),`Unhashed page file: ${key}`);
 vm.runInNewContext(fs.readFileSync(path.join(dist,'learning',meta.file),'utf8'),ctx);
 assert(loadedPages[key],`Page script did not register: ${key}`);
}
vm.runInNewContext(fs.readFileSync(path.join(dist,'learning',index.search),'utf8'),ctx);
assert.equal(Object.keys(searchText).join(),Object.keys(index.pages).join(),'Search index keys differ from pages');
const data={weeks:index.weeks,pages:loadedPages,mathCount:index.mathCount};let questions=0,modelQuestions=0,sheetItems=0,math=0,links=0,figures=0;
assert.equal(data.weeks.length,13);
const MODES=['summary','quiz','model','cheatsheet'];
for(const week of data.weeks)for(const doc of week.docs){assert.equal(doc.modes.join(),MODES.join(),`Missing document type: ${doc.title}`);for(const mode of MODES)assert(data.pages[`${doc.id}/${mode}`],`Missing page: ${doc.id}/${mode}`);}
const docCount=data.weeks.reduce((n,w)=>n+w.docs.length,0),extraCount=data.weeks.reduce((n,w)=>n+w.extras.length,0);
assert.equal(docCount,28);assert.equal(Object.keys(data.pages).length,docCount*MODES.length+extraCount);
for(const [key,page] of Object.entries(data.pages)){
 if(key.endsWith('/model')){
  const blocks=[...page.html.matchAll(/<h2>Q\s*\d+[^]*?<\/h2>([^]*?)(?=<h2>|$)/g)];
  assert(blocks.length>=10&&blocks.length<=20,`${key}: ${blocks.length} model questions`);modelQuestions+=blocks.length;
  for(const [i,block] of blocks.entries()){
   const parts=block[1].split('<p><strong>예상답안</strong></p>');
   assert.equal(parts.length,2,`${key} Q${i+1}: missing answer boundary`);
   assert(parts[0].replace(/<[^>]*>/g,'').trim().length>=15,`${key} Q${i+1}: missing question`);
   assert(parts[1].replace(/<[^>]*>/g,'').trim().length>=300,`${key} Q${i+1}: answer too short`);
  }
 }
 if(key.endsWith('/cheatsheet')){
  const items=(page.html.match(/<li>\s*(?:<p>)?<strong>/g)||[]).length;
  assert(items>=10&&items<=20,`${key}: ${items} cheat sheet items`);sheetItems+=items;
 }
 if(key.endsWith('/quiz')){
  const blocks=[...page.html.matchAll(/<h2>Q\s*\d+[^]*?<\/h2>([^]*?)(?=<h2>|$)/g)];
  assert.equal(blocks.length,10,key);questions+=blocks.length;
  for(const [i,block] of blocks.entries()){
   const parts=block[1].split('<p><strong>예상답안</strong></p>');
   assert.equal(parts.length,2,`${key} Q${i+1}: missing answer boundary`);
   assert(parts[0].replace(/<[^>]*>/g,'').trim().length>=90,`${key} Q${i+1}: missing question context`);
   assert(parts[1].replace(/<[^>]*>/g,'').trim().length>=240,`${key} Q${i+1}: missing answer explanation`);
  }
 }
 math+=(page.html.match(/class="katex"/g)||[]).length;
 assert(!/MATHPLACEHOLDER\d+END|class="katex-error"/.test(page.html),key);
 for(const m of page.html.matchAll(/<img\s+[^>]*src="([^"]+)"[^>]*>/g)){
  assert(key.endsWith('/summary'),`Unexpected quiz image: ${key}`);
  assert(/alt="[^"]+"/.test(m[0]),`Missing figure description: ${key}`);
  assert(/width="[\d.]+" height="[\d.]+"/.test(m[0]),`Missing figure size: ${key}`);
  const svg=fs.readFileSync(path.resolve(dist,'learning',decodeURIComponent(m[1])),'utf8');
  assert(svg.includes('<title>')&&svg.includes('<desc>'),`Missing SVG description: ${key}`);
  assert(!/<script|<foreignObject|(?:href|src)="https?:/i.test(svg),`Nonlocal SVG dependency: ${key}`);
  figures++;
 }
 for(const m of page.html.matchAll(/href="([^"]+)"/g)){
  const url=m[1].replaceAll('&amp;','&');
  if(url.startsWith('#/'))assert(url==='#/'||data.pages[url.slice(2)],`Missing route: ${key}: ${url}`);
  else if(!/^(?:[a-z]+:|#|\/)/i.test(url)){assert(fs.existsSync(path.resolve(dist,'learning',decodeURIComponent(url.split('#')[0]))),`Missing file: ${key}: ${url}`);links++;}
 }
}
assert.equal(math,data.mathCount);assert.equal(questions,280);
const figureManifest=JSON.parse(fs.readFileSync(path.join(root,'learning/figures.json'),'utf8'));
assert.equal(figures,figureManifest.length);
for(const figure of figureManifest){
 const doc=fs.readFileSync(path.join(root,'learning/materials',figure.file),'utf8');
 assert(doc.includes(`../figures/${figure.id}.svg`),`Figure missing from Markdown: ${figure.id}`);
 assert(doc.includes(figure.source),`Figure source note missing: ${figure.id}`);
 assert.deepEqual(fs.readFileSync(path.join(root,'learning/materials/figures',figure.id+'.svg')),fs.readFileSync(path.join(dist,'learning/materials/figures',figure.id+'.svg')));
}
for(const week of data.weeks)for(const doc of week.docs)assert(fs.existsSync(path.resolve(dist,'learning',decodeURIComponent(doc.pdf))),doc.pdf);
const home=fs.readFileSync(path.join(dist,'index.html'),'utf8');assert(!home.includes('LEARNING_DATA'));assert(!home.includes('href="learning/'));assert(home.includes('presentation/20260909-presentation.html'));
assert.deepEqual(fs.readFileSync(path.join(dist,'20260909-presentation.html')),fs.readFileSync(path.join(root,'presentation/20260909-presentation.html')));
console.log(JSON.stringify({pages:Object.keys(data.pages).length,questions,modelQuestions,sheetItems,math,figures,links,root:'presentations only',legacyPresentation:'preserved'},null,2));
