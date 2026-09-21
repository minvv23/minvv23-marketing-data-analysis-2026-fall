(async()=>{
 const failures=[];const wait=()=>new Promise(r=>setTimeout(r,25));
 for(const key of Object.keys(LEARNING_DATA.pages)){
  location.hash='/'+key;await wait();
  if(!document.querySelector('.prose')){failures.push(key+': missing article');continue}
  if(key.endsWith('/quiz')){
   const answers=[...document.querySelectorAll('.prose details')];
   if(answers.length!==10)failures.push(key+': answer count');
   answers.forEach(d=>d.open=true);await wait();
  }
  if(document.documentElement.scrollWidth>innerWidth)failures.push(key+': page overflow');
 }
 location.hash='/';await wait();document.querySelector('#menu').click();
 if(!document.body.classList.contains('menu-open'))failures.push('menu did not open');
 document.querySelector('a[href="#/week/06"]').click();await wait();
 if(document.body.classList.contains('menu-open')||!document.querySelector('.reading-title'))failures.push('week navigation');
 document.querySelector('.reading-title').click();await wait();
 document.querySelector('.tabs a:last-child').click();await wait();
 document.querySelectorAll('.prose details').forEach(d=>d.open=false);await wait();
 document.querySelector('.prose summary').click();await wait();
 if(!document.querySelector('.prose details').open)failures.push('individual answer');
 const quiz=location.hash;document.querySelector('.tabs a:first-child').click();await wait();location.hash=quiz;await wait();
 if(!document.querySelector('.prose details').open)failures.push('answer state lost');
 document.querySelector('.answer-toggle').click();await wait();
 if(![...document.querySelectorAll('.prose details')].every(d=>d.open))failures.push('expand all');
 document.querySelector('#menu').click();const search=document.querySelector('#search');search.value='도구변수';search.dispatchEvent(new Event('input',{bubbles:true}));
 const results=document.querySelectorAll('.search-result').length;
 document.querySelector('#search-results-button').click();
 if(!results||document.body.classList.contains('menu-open'))failures.push('search results obscured');
 document.querySelector('.search-result').click();await wait();
 if(!document.querySelector('.prose'))failures.push('search result navigation');
 document.querySelector('#complete').click();if(!document.querySelector('#complete').textContent.includes('✓'))failures.push('read marker');document.querySelector('#complete').click();
 document.querySelector('#font').click();document.querySelector('#theme').click();await wait();
 if(document.documentElement.scrollWidth>innerWidth)failures.push('large text overflow');
 document.querySelector('#font-decrease').click();document.querySelector('#theme').click();
 document.querySelector('#menu').click();document.querySelector('#menu-backdrop').click();
 if(document.body.classList.contains('menu-open'))failures.push('backdrop close');
 return {width:innerWidth,pages:70,quizAnswers:280,searchResults:results,failures};
})()
