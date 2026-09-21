import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const dist=path.join(root,'dist');const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(dist,'learning/assets/content.js'),'utf8'),ctx);
const data=ctx.window.LEARNING_DATA;let questions=0,math=0,links=0;
assert.equal(data.weeks.length,13);assert.equal(Object.keys(data.pages).length,70);
for(const [key,page] of Object.entries(data.pages)){
 if(key.endsWith('/quiz')){const n=(page.html.match(/<h2>Q\s*\d+/g)||[]).length;assert.equal(n,10,key);questions+=n;}
 math+=(page.html.match(/class="katex"/g)||[]).length;
 assert(!/MATHPLACEHOLDER\d+END|class="katex-error"/.test(page.html),key);
 for(const m of page.html.matchAll(/href="([^"]+)"/g)){
  const url=m[1].replaceAll('&amp;','&');
  if(url.startsWith('#/'))assert(url==='#/'||data.pages[url.slice(2)],`Missing route: ${key}: ${url}`);
  else if(!/^(?:[a-z]+:|#|\/)/i.test(url)){assert(fs.existsSync(path.resolve(dist,'learning',decodeURIComponent(url.split('#')[0]))),`Missing file: ${key}: ${url}`);links++;}
 }
}
assert.equal(math,data.mathCount);assert.equal(questions,280);
for(const week of data.weeks)for(const doc of week.docs)assert(fs.existsSync(path.resolve(dist,'learning',decodeURIComponent(doc.pdf))),doc.pdf);
const home=fs.readFileSync(path.join(dist,'index.html'),'utf8');assert(!home.includes('LEARNING_DATA'));assert(!home.includes('href="learning/'));assert(home.includes('presentation/20260909-presentation.html'));
assert.deepEqual(fs.readFileSync(path.join(dist,'20260909-presentation.html')),fs.readFileSync(path.join(root,'presentation/20260909-presentation.html')));
console.log(JSON.stringify({pages:70,questions,math,links,root:'presentations only',legacyPresentation:'preserved'},null,2));
