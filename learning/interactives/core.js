// Shared toolkit for the in-page learning interactives.
// Each interactive draws its picture as a pure function of its control values, so the same settings
// always produce the same figure, and random draws come from a fixed seed.
(function(){
 const registry={};
 const NS='http://www.w3.org/2000/svg';
 let uid=0;

 // Colors are CSS variables so the light and dark themes both work (see styles.css).
 const C={blue:'var(--data-blue)',rust:'var(--data-rust)',gray:'var(--data-gray)',pale:'var(--data-pale)',ink:'var(--ink)',muted:'var(--muted)',line:'var(--line)',accent:'var(--accent)'};

 function el(tag,attrs={},parent){
  const node=document.createElementNS(NS,tag);
  for(const [k,v] of Object.entries(attrs)){if(v==null)continue;if(k==='text')node.textContent=v;else node.setAttribute(k,v)}
  if(parent)parent.append(node);
  // On narrow layouts keep SVG text at 14 or larger so it stays above ~12px on a 360px phone.
  if(tag==='text'&&parent){const svg=node.ownerSVGElement;const fs=parseFloat(node.getAttribute('font-size'));if(svg&&svg.dataset.narrow==='1'&&fs<14)node.setAttribute('font-size',14)}
  return node;
 }
 function html(tag,attrs={},parent){
  const node=document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)){if(v==null)continue;if(k==='text')node.textContent=v;else if(k==='html')node.innerHTML=v;else node.setAttribute(k,v)}
  if(parent)parent.append(node);
  return node;
 }
 // Linear scale from a data domain to a pixel range.
 function scale([d0,d1],[r0,r1]){const f=v=>r0+(v-d0)/(d1-d0)*(r1-r0);f.domain=[d0,d1];f.range=[r0,r1];return f}
 // Deterministic random numbers (mulberry32) and standard normal draws.
 function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
 function normal(rand){let u=0,v=0;while(u===0)u=rand();while(v===0)v=rand();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
 const fmt=(v,d=2)=>Number.isFinite(v)?v.toLocaleString('ko-KR',{minimumFractionDigits:d,maximumFractionDigits:d}):'정의되지 않음';
 const pct=(v,d=1)=>Number.isFinite(v)?fmt(v*100,d)+'%':'정의되지 않음';

 // A responsive SVG stage. On narrow columns the interactive gets a narrower viewBox (and usually a stacked
 // layout) instead of shrinking a wide drawing until its labels become unreadable.
 // Call st.layout() at the start of every draw; then read st.narrow, st.width and st.height.
 function stage(root,{width=640,height=360,narrowWidth=360,narrowHeight=height,label}){
  const svg=el('svg',{role:'img','aria-label':label||'인터랙티브 그림',class:'li-svg'});
  root.append(svg);
  const st={svg,narrow:false,width,height,
   clear(){while(svg.firstChild)svg.firstChild.remove()},
   layout(h){st.narrow=(root.clientWidth||width)<560;svg.dataset.narrow=st.narrow?'1':'0';st.width=st.narrow?narrowWidth:width;st.height=h??(st.narrow?narrowHeight:height);svg.setAttribute('viewBox',`0 0 ${st.width} ${st.height}`);st.clear();return st},
   id:p=>`li${++uid}-${p}`,
   // Redraw when the column crosses the narrow breakpoint (e.g. rotating a phone).
   onResize(fn){if(!('ResizeObserver' in window))return;let last=null;new ResizeObserver(()=>{const n=root.clientWidth<560;if(last!==null&&n!==last)fn();last=n}).observe(root)}};
  return st;
 }
 // Axis with a few ticks. side: 'bottom' or 'left'.
 function axis(svg,s,{side,at,ticks=5,format=v=>fmt(v,0),label,size=13}){
  const [d0,d1]=s.domain,g=el('g',{class:'li-axis'},svg);
  const values=Array.isArray(ticks)?ticks:Array.from({length:ticks},(_,i)=>d0+(d1-d0)*i/(ticks-1));
  if(side==='bottom'){
   el('line',{x1:s.range[0],x2:s.range[1],y1:at,y2:at,stroke:C.line},g);
   for(const v of values){const x=s(v);el('line',{x1:x,x2:x,y1:at,y2:at+5,stroke:C.line},g);el('text',{x,y:at+19,'text-anchor':'middle','font-size':size,fill:C.muted,text:format(v)},g)}
   if(label)el('text',{x:(s.range[0]+s.range[1])/2,y:at+38,'text-anchor':'middle','font-size':size,fill:C.muted,text:label},g);
  }else{
   el('line',{y1:s.range[0],y2:s.range[1],x1:at,x2:at,stroke:C.line},g);
   for(const v of values){const y=s(v);el('line',{y1:y,y2:y,x1:at-5,x2:at,stroke:C.line},g);el('text',{x:at-8,y:y+4,'text-anchor':'end','font-size':size,fill:C.muted,text:format(v)},g)}
   if(label)el('text',{x:at,y:Math.min(s.range[0],s.range[1])-12,'text-anchor':'start','font-size':size,fill:C.muted,text:label},g);
  }
  return g;
 }
 function polyline(svg,points,attrs){return el('polyline',{points:points.map(p=>p.join(',')).join(' '),fill:'none','stroke-width':2.5,'stroke-linejoin':'round',...attrs},svg)}

 // Range sliders and toggles. specs: [{key,label,min,max,step,value,format}] or {key,label,type:'toggle',value}
 function controls(root,specs,onChange){
  const box=html('div',{class:'li-controls'},root),state={},inputs={};
  const emit=()=>onChange({...state});
  for(const sp of specs){
   const row=html('label',{class:'li-control'+(sp.type==='toggle'?' li-toggle':'')},box);
   if(sp.type==='toggle'){
    const input=html('input',{type:'checkbox'},row);input.checked=!!sp.value;state[sp.key]=input.checked;
    html('span',{text:sp.label},row);
    input.addEventListener('change',()=>{state[sp.key]=input.checked;emit()});inputs[sp.key]=input;continue;
   }
   const head=html('span',{class:'li-control-head'},row);html('span',{text:sp.label},head);
   const out=html('output',{},head);
   const input=html('input',{type:'range',min:sp.min,max:sp.max,step:sp.step,value:sp.value},row);
   const show=()=>{state[sp.key]=Number(input.value);out.textContent=(sp.format||(v=>fmt(v,sp.step<1?2:0)))(state[sp.key])};
   show();input.addEventListener('input',()=>{show();emit()});inputs[sp.key]=input;
  }
  const reset=html('button',{type:'button',class:'li-reset',text:'처음 값으로'},box);
  reset.addEventListener('click',()=>{for(const sp of specs){const i=inputs[sp.key];if(sp.type==='toggle')i.checked=!!sp.value;else i.value=sp.value;i.dispatchEvent(new Event(sp.type==='toggle'?'change':'input'))}});
  return {state,inputs,set(key,v){const i=inputs[key];if(i.type==='checkbox')i.checked=v;else i.value=v;i.dispatchEvent(new Event(i.type==='checkbox'?'change':'input'))}};
 }
 // Key numbers under the figure. rows: [[label, value, note?, emphasis?]]
 function readout(root){
  const box=html('dl',{class:'li-readout','aria-live':'polite'},root);
  return rows=>{box.innerHTML='';for(const [k,v,note,strong] of rows){const d=html('div',{class:strong?'li-strong':null},box);html('dt',{text:k},d);html('dd',{text:v},d);if(note)html('small',{text:note},d)}};
 }
 function legend(root,items){const box=html('ul',{class:'li-legend'},root);for(const [label,color,dash,hollow] of items){const li=html('li',{},box);const sw=html('span',{class:'li-swatch'+(dash?' li-dash':'')+(hollow?' li-hollow':'')},li);sw.style.setProperty('--sw',color);html('span',{text:label},li)}return box}
 function note(root,text){return html('p',{class:'li-note',text},root)}

 function register(id,mount){registry[id]=mount}
 function mountAll(scope){
  for(const node of scope.querySelectorAll('.learning-interactive[data-interactive]')){
   if(node.dataset.mounted)continue;
   const mount=registry[node.dataset.interactive],target=node.querySelector('.li-mount');
   if(!mount||!target){if(target)target.textContent='이 인터랙티브를 불러오지 못했습니다.';continue}
   node.dataset.mounted='1';
   try{mount(target)}catch(err){target.textContent='인터랙티브를 표시하는 중 오류가 발생했습니다.';console.error(err)}
  }
 }
 window.LI={register,mountAll,ids:()=>Object.keys(registry),el,html,scale,rng,normal,fmt,pct,stage,axis,polyline,controls,readout,legend,note,C};
})();
