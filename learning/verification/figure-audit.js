(async()=>{
 const failures=[],checks=[];
 for(const [key,page] of Object.entries(LEARNING_DATA.pages)){
  if(!page.html.includes('learning-figure'))continue;
  location.hash='/'+key;
  await new Promise(r=>setTimeout(r,40));
  for(const img of document.querySelectorAll('.learning-figure img')){
   img.loading='eager';
   try{await img.decode()}catch{failures.push(key+': figure failed to load')}
   const box=img.getBoundingClientRect();
   if(!img.naturalWidth||box.width<=0)failures.push(key+': empty figure');
   if(box.width>document.querySelector('.prose').clientWidth+1)failures.push(key+': figure overflow');
   const figure=img.closest('figure'),link=figure.querySelector('figcaption a');
   if(!img.alt||!figure.querySelector('figcaption').textContent.trim())failures.push(key+': missing description');
   if(link?.target!=='_blank'||link.href!==img.src)failures.push(key+': enlarged view link');
   const response=await fetch(img.src);if(!response.ok||!response.headers.get('content-type')?.includes('svg'))failures.push(key+': invalid SVG response');
   link.focus();link.click();
   const dialog=document.querySelector('.figure-dialog');
   if(!dialog?.open)failures.push(key+': enlarged view did not open');
   else{
    const enlarged=dialog.querySelector('img');await enlarged.decode();
    const before=enlarged.getBoundingClientRect().width;
    dialog.querySelector('.figure-larger').click();
    if(enlarged.getBoundingClientRect().width<=before)failures.push(key+': zoom did not enlarge');
    dialog.querySelector('.figure-smaller').click();
    if(enlarged.getBoundingClientRect().width!==before)failures.push(key+': zoom did not reduce');
    dialog.querySelector('.figure-close').click();
    await new Promise(r=>setTimeout(r,20));
    if(document.activeElement!==link||document.body.classList.contains('figure-open'))failures.push(key+': close did not restore reading');
   }
   checks.push({key,width:Math.round(box.width),naturalWidth:img.naturalWidth});
  }
  if(document.documentElement.scrollWidth>innerWidth)failures.push(key+': page overflow');
 }
 return {viewport:innerWidth,figures:checks.length,failures,checks};
})()
