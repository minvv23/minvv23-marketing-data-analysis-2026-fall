(async()=>{
 const failures=[];let pages=0,tables=0,scrollable=0;
 for(const [key,page] of Object.entries(LEARNING_DATA.pages).filter(([key])=>key.endsWith('/summary'))){
  location.hash='/'+key;await new Promise(r=>setTimeout(r,35));
  const article=document.querySelector('.prose');
  if(!article){failures.push(key+': article missing');continue}
  for(const table of article.querySelectorAll('table')){
   tables++;
   const rows=[...table.rows],cols=rows[0]?.cells.length;
   if(!cols||rows.some(row=>row.cells.length!==cols))failures.push(key+': table column mismatch');
   if(table.scrollWidth>table.clientWidth+1){
    scrollable++;table.scrollLeft=table.scrollWidth;
    if(table.scrollLeft===0)failures.push(key+': table cannot scroll');
    table.scrollLeft=0;
   }
   if(table.getAttribute('tabindex')!=='0')failures.push(key+': table not keyboard focusable');
  }
  if(article.querySelector('.katex-error'))failures.push(key+': math error');
  if(document.documentElement.scrollWidth>innerWidth+1)failures.push(key+': page overflow');
  pages++;
 }
 return {width:innerWidth,pages,tables,scrollable,failures};
})()
