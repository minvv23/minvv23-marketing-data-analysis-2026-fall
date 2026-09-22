const {weeks,pages}=window.LEARNING_DATA;
const $=s=>document.querySelector(s), main=$('#main');
const safe=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const readStore=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const quizState=new Map();
let finished=readStore('learning-finished',[]), dark=readStore('learning-dark',false), fontLevel=Math.max(0,Math.min(2,Number(readStore('learning-font-level',readStore('learning-large',false)?1:0))||0));
document.body.classList.toggle('dark',dark);
function nav(active){$('#weeks').innerHTML=weeks.map(w=>`<a href="#/week/${w.id}" class="week-link ${active===w.id?'active':''}"><span class="week-number">${w.id}</span><span>Week ${w.id} <time class="nav-date" datetime="${w.date}">· ${w.date.slice(5).replace('-','.')}</time><small>${w.label}</small></span><span class="count">${w.docs.length}</span></a>`).join('')}
function readingList(w){return `<ol class="reading-list">${w.docs.map(d=>`<li><a class="reading-title" href="#/${d.id}/summary">${safe(d.title.replaceAll('_',' '))}</a>${finished.includes(d.id)?'<span class="read-status">읽음</span>':''}<div class="reading-links"><a href="#/${d.id}/summary">심층요약</a><a href="#/${d.id}/quiz">개념 퀴즈</a><a href="${d.pdf}" target="_blank" rel="noopener">PDF ↗</a></div></li>`).join('')}</ol>`}
function home(){main.innerHTML=`<section class="hero"><div class="eyebrow">2026 가을학기 · 윤태중 교수</div><h1>마케팅자료분석론</h1><p>주차별 읽기 자료와 심층요약, 개념 퀴즈</p></section><section class="library"><div class="section-heading"><h2>강의 목차</h2><span>13주 · 자료 28편</span></div>${weeks.map(w=>`<section class="syllabus-week"><div class="syllabus-heading"><a href="#/week/${w.id}"><span>Week ${w.id}</span><h3>${w.label}</h3></a><time>${w.date.slice(5).replace('-','.')}</time></div>${readingList(w)}</section>`).join('')}</section>`}
function showWeek(w){main.innerHTML=`<section class="week-hero"><div class="eyebrow">Week ${w.id} · ${w.date}</div><h1>${w.label}</h1><div class="extra-links">${w.extras.map(d=>`<a href="#/${d.id}/summary">${d.title}</a>`).join('')}</div></section><section class="library"><div class="section-heading"><h2>읽기 자료</h2><span>${w.docs.length}편</span></div>${readingList(w)}</section>`}
function showDoc(key,w,d,mode){const page=pages[key];main.innerHTML=`<div class="reading-head"><a href="#/week/${w.id}">← Week ${w.id} · ${w.label}</a><div class="reading-actions"><div class="tabs" role="navigation" aria-label="문서 종류">${d.name?'':`<a class="${mode==='summary'?'selected':''}" href="#/${d.id}/summary">심층요약</a><a class="${mode==='quiz'?'selected':''}" href="#/${d.id}/quiz">개념 퀴즈</a>`}</div>${d.pdf?`<a class="pdf" href="${d.pdf}" target="_blank" rel="noopener">원문 PDF ↗</a><button id="complete">${finished.includes(d.id)?'✓ 읽음':'읽음 표시'}</button>`:''}</div><p class="mobile-reading-hint">긴 수식과 표는 좌우로 밀어서 볼 수 있습니다.</p></div><div class="reading-layout"><article class="prose">${page.html}</article><aside class="toc"><details open><summary>문서 목차</summary><nav></nav></details><a class="to-top" href="#">↑ 맨 위로</a></aside></div>`;
 const article=$('.prose');
 article.querySelectorAll('p').forEach(p=>{if(p.children.length===1&&p.firstElementChild.matches('.math-scroll')&&[...p.childNodes].every(n=>n.nodeType!==3||!n.textContent.trim()))p.classList.add('display-only')});
 article.querySelectorAll('.math-scroll, table, pre').forEach(el=>{el.tabIndex=0;el.setAttribute('role','region');el.setAttribute('aria-label',el.matches('table')?'표, 가로 스크롤 가능':el.matches('pre')?'코드, 가로 스크롤 가능':'수식, 가로 스크롤 가능')});
 if(mode==='quiz'){
  const toggle=document.createElement('button');toggle.className='answer-toggle';toggle.textContent='예상 답안 모두 펼치기';article.insertBefore(toggle,article.querySelector('h2'));
  [...article.querySelectorAll('h2')].filter(h=>/^Q\d+/i.test(h.textContent)).forEach(h=>{const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='예상 답안 보기';details.append(summary);let answer=h.nextElementSibling;
   while(answer&&!/^H[12]$/.test(answer.tagName)&&!/^(?:예상\s*답안)$/.test(answer.textContent.trim()))answer=answer.nextElementSibling;
   // Earlier notes put the whole question in the heading. New notes add visible context before the answer marker.
   if(!answer||/^H[12]$/.test(answer.tagName))answer=h.nextElementSibling;
   if(answer)answer.before(details);else h.after(details);
   let next=answer;
   if(answer&&/^예상\s*답안$/.test(answer.textContent.trim())){next=answer.nextElementSibling;answer.remove()}
   while(next&&!/^H[12]$/.test(next.tagName)){const move=next;next=next.nextElementSibling;details.append(move)}details.open=quizState.get(key)?.has(h.textContent)??false;details.addEventListener('toggle',()=>{const opened=quizState.get(key)??new Set();if(details.open)opened.add(h.textContent);else opened.delete(h.textContent);quizState.set(key,opened)})});
  toggle.onclick=()=>{const open=[...article.querySelectorAll('details')].some(d=>!d.open);article.querySelectorAll('details').forEach(d=>d.open=open);toggle.textContent=open?'예상 답안 모두 접기':'예상 답안 모두 펼치기'};
 }
 const headings=[...article.querySelectorAll('h2')];headings.forEach((h,i)=>h.id='section-'+i);
 if(matchMedia('(max-width:1100px)').matches)$('.toc details').open=false;
 $('.toc nav').innerHTML=headings.map((h,i)=>`<a href="#section-${i}" data-section="${i}">${safe(h.textContent)}</a>`).join('');
 $('.toc').onclick=e=>{const a=e.target.closest('a');if(!a)return;e.preventDefault();if(a.dataset.section){if(matchMedia('(max-width:1100px)').matches)$('.toc details').open=false;$('#section-'+a.dataset.section).scrollIntoView({behavior:'smooth'});}else window.scrollTo({top:0,behavior:'smooth'})};
 if($('#complete'))$('#complete').onclick=()=>{finished=finished.includes(d.id)?finished.filter(id=>id!==d.id):[...finished,d.id];save('learning-finished',finished);$('#complete').textContent=finished.includes(d.id)?'✓ 읽음':'읽음 표시'};
}
function render(){const route=decodeURIComponent(location.hash.slice(2)),parts=route.split('/');$('#search').value='';$('#search-results-button').hidden=true;document.body.classList.remove('menu-open');$('#menu').setAttribute('aria-expanded','false');let w;
 if(!route){home();$('#breadcrumb').textContent='나의 학습 서재'}else if(parts[0]==='week'&&(w=weeks.find(w=>w.id===parts[1]))){showWeek(w);$('#breadcrumb').textContent='Week '+w.id+' / '+w.label}else{w=weeks.find(w=>[...w.docs,...w.extras].some(d=>d.id===parts[0]));const d=w&&[...w.docs,...w.extras].find(d=>d.id===parts[0]);if(d&&pages[route]){showDoc(route,w,d,parts[1]);$('#breadcrumb').textContent='Week '+w.id+' / '+(parts[1]==='quiz'?'개념 퀴즈':'심층요약')}else{home();$('#breadcrumb').textContent='나의 학습 서재'}}nav(w?.id);const activeLink=$('.week-link.active');if(activeLink)activeLink.setAttribute('aria-current','page');window.scrollTo(0,0);document.title=(w?'Week '+w.id+' · ':'')+'마케팅자료분석론';}
$('#search').addEventListener('input',e=>{const q=e.target.value.trim().toLocaleLowerCase();if(!q){const wasOpen=document.body.classList.contains('menu-open');render();if(wasOpen){document.body.classList.add('menu-open');$('#menu').setAttribute('aria-expanded','true')}return}const results=[];for(const w of weeks)for(const d of [...w.docs,...w.extras]){const modes=d.name?['summary']:['summary','quiz'];for(const mode of modes){const p=pages[d.id+'/'+mode],index=p.text.toLocaleLowerCase().indexOf(q);if(index>=0){results.push(`<a class="search-result" href="#/${d.id}/${mode}"><small>WEEK ${w.id} · ${mode==='quiz'?'개념 퀴즈':d.name?'보충 자료':'심층요약'}</small><h3>${safe(d.title)}</h3><p>…${safe(p.text.slice(Math.max(0,index-45),index+140))}…</p></a>`)}}}$('#search-results-button').hidden=false;$('#search-results-button').textContent=`검색 결과 ${results.length}개 보기`;main.innerHTML=`<section class="library search-page"><div class="eyebrow">자료 검색</div><h1>검색 결과 <span>${results.length}</span></h1><p>“${safe(e.target.value)}”이 포함된 자료입니다.</p>${results.join('')||'<div class="empty">검색 결과가 없습니다. 다른 표현으로 찾아보세요.</div>'}</section>`});
$('#theme').onclick=()=>{dark=!dark;document.body.classList.toggle('dark',dark);save('learning-dark',dark)};
function applyFontSize(){document.body.style.setProperty('--font-step',`${fontLevel*2}px`);$('#font-decrease').disabled=fontLevel===0;$('#font').disabled=fontLevel===2;$('#font-status').textContent='글자 크기: '+['보통','크게','더 크게'][fontLevel];save('learning-font-level',fontLevel)}
$('#font').onclick=()=>{fontLevel=Math.min(2,fontLevel+1);applyFontSize()};
$('#font-decrease').onclick=()=>{fontLevel=Math.max(0,fontLevel-1);applyFontSize()};
applyFontSize();
$('#menu').onclick=()=>{$('#menu').setAttribute('aria-expanded',String(document.body.classList.toggle('menu-open')))};
window.addEventListener('hashchange',render);render();
// Preserve the current document when following an anchor within it.
document.addEventListener('click',e=>{const a=e.target.closest('a');const href=a?.getAttribute('href');if(href?.startsWith('#/')&&href===location.hash){e.preventDefault();render();return}if(href?.startsWith('#')&&!href.startsWith('#/')){e.preventDefault();const target=document.getElementById(decodeURIComponent(href.slice(1)));if(target){target.scrollIntoView({behavior:'smooth'});if(target.id==='main')target.focus({preventScroll:true})}}});

function closeMenu(){document.body.classList.remove('menu-open');$('#menu').setAttribute('aria-expanded','false')}
$('#search-results-button').onclick=()=>{closeMenu();main.focus();window.scrollTo(0,0)};
$('#search').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();closeMenu();main.focus();window.scrollTo(0,0)}});
$('#menu-backdrop').onclick=closeMenu;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.target.closest('dialog')){closeMenu();$('#menu').focus()}});

// Native dialog keeps keyboard focus inside the enlarged figure and restores it on close.
const figureDialog=document.createElement('dialog');
figureDialog.className='figure-dialog';
figureDialog.setAttribute('aria-labelledby','figure-dialog-title');
figureDialog.innerHTML=`<div class="figure-dialog-content"><div class="figure-dialog-header"><h2 id="figure-dialog-title"></h2><button type="button" class="figure-close" autofocus>닫기</button></div><div class="figure-controls"><button type="button" class="figure-smaller" aria-label="그림 축소">−</button><output aria-live="polite"></output><button type="button" class="figure-larger" aria-label="그림 확대">+</button><span>그림을 밀어서 살펴보세요.</span></div><div class="figure-viewport" tabindex="0" role="region" aria-label="확대한 그림, 가로 세로 스크롤 가능"><img alt=""></div></div>`;
document.body.append(figureDialog);
let figureZoom=1,figureBaseWidth=640;
function sizeFigure(){
 figureDialog.querySelector('img').style.width=`${figureBaseWidth*figureZoom}px`;
 figureDialog.querySelector('output').textContent=`${Math.round(figureZoom*100)}%`;
 figureDialog.querySelector('.figure-smaller').disabled=figureZoom<=.5;
 figureDialog.querySelector('.figure-larger').disabled=figureZoom>=2;
}
figureDialog.querySelector('.figure-close').onclick=()=>figureDialog.close();
figureDialog.querySelector('.figure-smaller').onclick=()=>{figureZoom=Math.max(.5,figureZoom-.25);sizeFigure()};
figureDialog.querySelector('.figure-larger').onclick=()=>{figureZoom=Math.min(2,figureZoom+.25);sizeFigure()};
figureDialog.addEventListener('close',()=>document.body.classList.remove('figure-open'));
figureDialog.addEventListener('click',e=>{if(e.target===figureDialog)figureDialog.close()});
document.addEventListener('click',e=>{
 const link=e.target.closest('.learning-figure a');
 if(!link||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||typeof figureDialog.showModal!=='function')return;
 e.preventDefault();
 const figure=link.closest('figure'),source=figure.querySelector('img'),img=figureDialog.querySelector('img');
 img.src=source.src;img.alt=source.alt;
 figureDialog.querySelector('h2').textContent=figure.querySelector('figcaption>span').textContent;
 figureBaseWidth=Math.max(640,Math.min(960,innerWidth-64));figureZoom=1;sizeFigure();
 figureDialog.showModal();document.body.classList.add('figure-open');
 const viewport=figureDialog.querySelector('.figure-viewport');viewport.scrollTop=0;viewport.scrollLeft=Math.max(0,(figureBaseWidth-viewport.clientWidth)/2);
});
window.addEventListener('hashchange',()=>{if(figureDialog.open)figureDialog.close()});
