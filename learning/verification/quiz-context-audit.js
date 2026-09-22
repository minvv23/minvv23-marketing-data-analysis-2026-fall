(async()=>{
 const failures=[];let quizzes=0,questions=0;
 for(const key of Object.keys(LEARNING_DATA.pages).filter(k=>k.endsWith('/quiz'))){
  location.hash='/'+key;await new Promise(r=>setTimeout(r,30));
  const article=document.querySelector('.prose');
  const headings=[...article.querySelectorAll('h2')].filter(h=>/^Q\d+/.test(h.textContent));
  if(headings.length!==10)failures.push(key+': question count');
  for(const h of headings){
   const context=[];let n=h.nextElementSibling;
   while(n&&!n.matches('h2,details')){context.push(n);n=n.nextElementSibling}
   if(!context.length||context.map(n=>n.textContent).join('').trim().length<90)failures.push(key+': missing visible context '+h.textContent);
   if(!n?.matches('details')){failures.push(key+': missing answer');continue}
   n.open=false;
   if(context.some(el=>el.getBoundingClientRect().height===0))failures.push(key+': hidden question');
   if(!/^예상\s*답안/.test(n.querySelector('summary')?.textContent||''))failures.push(key+': missing answer control');
   if(n.textContent.trim().length<240)failures.push(key+': short answer');
   n.querySelector('summary').click();if(!n.open)failures.push(key+': answer failed to open');
   n.open=false;questions++;
  }
  if(document.documentElement.scrollWidth>innerWidth)failures.push(key+': closed page overflow');
  const toggle=article.querySelector('.answer-toggle');toggle.click();
  if([...article.querySelectorAll('details')].some(d=>!d.open))failures.push(key+': open all failed');
  if(document.documentElement.scrollWidth>innerWidth)failures.push(key+': expanded page overflow');
  toggle.click();if([...article.querySelectorAll('details')].some(d=>d.open))failures.push(key+': close all failed');
  quizzes++;
 }
 return {viewport:innerWidth,quizzes,questions,failures};
})()
