// Harmony case: is the "synergy" of dealer and manufacturer ads positive? It depends on the scale
// (difference of percentage-point differences vs. ratio of multipliers) and on how much of the
// both-ads group's high rate is selection (people who were going to buy anyway).
LI.register('harmony-synergy',root=>{
 const {C,fmt}=LI;
 const st=LI.stage(root,{width:640,height:330,narrowWidth:360,narrowHeight:650,label:'네 광고 집단의 구매 전환율과 두 척도에서 계산한 상호작용'});
 LI.legend(root,[['제조사 광고 없음',C.gray],['제조사 광고 있음 (선택 보정 후)',C.blue],['관찰값',C.blue,false,true],['상호작용이 없을 때의 기준',C.rust,true]]);
 const show=LI.readout(root);
 const warn=LI.note(root,'');
 const P=v=>fmt(v,1)+'%';
 const R=v=>v<100?P(v):fmt(v,0)+'%';
 const PP=v=>(v>0.049?'+':'')+fmt(v,1).replace('-','−')+'%p';
 const X=v=>v<.01?'0.01배 미만':fmt(v,v<.1?3:2)+'배';
 const ctl=LI.controls(root,[
  {key:'p00',label:'광고 없음 집단 전환율',min:.2,max:3,step:.1,value:.7,format:P},
  {key:'p10',label:'딜러 광고만 본 집단 전환율',min:.5,max:10,step:.1,value:3,format:P},
  {key:'p01',label:'제조사 광고만 본 집단 전환율',min:.5,max:10,step:.1,value:5,format:P},
  {key:'p11',label:'두 광고를 모두 본 집단 전환율',min:1,max:30,step:.1,value:14,format:P},
  {key:'s',label:'선택편향: 두 광고 집단이 원래 더 살 정도',min:0,max:13,step:.1,value:0,format:v=>fmt(v,1)+'%p'},
  {key:'log',label:'왼쪽 그림의 세로축을 로그 눈금으로',type:'toggle',value:false}],draw);

 // Pure calculation, shared by the figure, the readout and the note.
 function calc({p00,p10,p01,p11,s}){
  const cap=+(p11-.1).toFixed(1),sEff=Math.min(s,cap),m11=p11-sEff;
  const A=p10+p01-p00,M=p10*p01/p00;              // no-interaction benchmarks for the both-ads cell
  const addObs=p11-A,add=m11-A;                    // additive interaction (percentage points)
  const ratioObs=p11/M,ratio=m11/M;                // ratio interaction (1 means none)
  return {sEff,clamped:s>cap,m11,A,M,addObs,add,ratioObs,ratio,multNo:p10/p00,multYes:m11/p01};
 }

 // Spread end-of-line labels vertically so they never overlap.
 function place(items,gap,lo,hi){
  items.sort((a,b)=>a.y-b.y);
  for(let i=0;i<items.length;i++){items[i].ly=Math.max(items[i].y,i?items[i-1].ly+gap:lo)}
  const over=items.length?items[items.length-1].ly-hi:0;
  if(over>0)for(let i=items.length-1;i>=0;i--){items[i].ly=Math.min(items[i].ly,(i<items.length-1?items[i+1].ly-gap:hi))}
  return items;
 }

 function lines(s,r,ox,oy,w,h){
  const svg=st.svg,log=s.log;
  const top=oy+44,bottom=oy+h-44,left=ox+46,x0=left+26,x1=ox+w-118;
  const lo=Math.log10(.1),hi=Math.log10(50);
  const sc=log?LI.scale([lo,hi],[bottom,top]):LI.scale([0,30],[bottom,top]);
  const inDom=v=>log?Math.min(Math.max(v,.1),50):Math.min(Math.max(v,0),30);
  const y=v=>sc(log?Math.log10(inDom(v)):inDom(v));
    LI.el('text',{x:ox,y:oy+16,'font-size':14,fill:C.ink,'font-weight':600,text:log?'네 집단의 전환율 (로그 눈금)':'네 집단의 전환율 (선형 눈금)'},svg);
  if(log)LI.axis(svg,sc,{side:'left',at:left,ticks:[.1,.3,1,3,10,30].map(Math.log10),format:v=>{const t=10**v;return (t<1?fmt(t,1):fmt(t,0))+'%'},size:13});
  else LI.axis(svg,sc,{side:'left',at:left,ticks:[0,5,10,15,20,25,30],format:v=>v+'%',size:13});
  LI.el('line',{x1:left,x2:x1+14,y1:bottom,y2:bottom,stroke:C.line},svg);
  for(const [x,t] of [[x0,'딜러 광고 없음'],[x1,'딜러 광고 있음']])LI.el('text',{x,y:bottom+22,'text-anchor':'middle','font-size':14,fill:C.muted,text:t},svg);
  // The band between the two benchmarks: a both-ads rate inside it gets opposite signs on the two scales.
  const yA=y(r.A),yM=y(r.M);
  LI.el('rect',{x:x1-8,y:Math.min(yA,yM),width:16,height:Math.max(1,Math.abs(yA-yM)),fill:C.pale},svg);
  const bench=[[r.A,'6 4','가법 기준'],[r.M,'2 4','곱셈 기준']];
  for(const [v,dash] of bench)LI.polyline(svg,[[x0,y(s.p01)],[x1,y(v)]],{stroke:C.rust,'stroke-dasharray':dash,'stroke-width':2});
  LI.polyline(svg,[[x0,y(s.p00)],[x1,y(s.p10)]],{stroke:C.gray});
  if(r.sEff>0)LI.el('line',{x1,x2:x1,y1:y(s.p11),y2:y(r.m11),stroke:C.blue,'stroke-width':1.5,'stroke-dasharray':'3 3'},svg);
  LI.polyline(svg,[[x0,y(s.p01)],[x1,y(r.m11)]],{stroke:C.blue});
  for(const [x,v,c] of [[x0,s.p00,C.gray],[x1,s.p10,C.gray],[x0,s.p01,C.blue],[x1,r.m11,C.blue]])LI.el('circle',{cx:x,cy:y(v),r:4.5,fill:c},svg);
  if(r.sEff>0)LI.el('circle',{cx:x1,cy:y(s.p11),r:5,fill:'var(--bg)',stroke:C.blue,'stroke-width':2},svg);
  const labels=[
   {y:y(s.p10),t:'제조사 없음 '+P(s.p10),c:C.muted},
   {y:y(r.m11),t:(r.sEff>0?'보정 후 ':'두 광고 ')+P(r.m11),c:C.blue,b:1},
   {y:y(r.A),t:'가법 기준 '+R(r.A),c:C.rust},
   {y:y(r.M),t:'곱셈 기준 '+R(r.M),c:C.rust}];
  if(r.sEff>0)labels.push({y:y(s.p11),t:'관찰 '+P(s.p11),c:C.blue});
  for(const l of place(labels,17,top-6,bottom+4))LI.el('text',{x:x1+14,y:l.ly+5,'font-size':13,fill:l.c,'font-weight':l.b?600:null,text:l.t},svg);
 }

 function bars(r,ox,oy,w){
  const svg=st.svg,left=ox+14,right=ox+w-14;
  LI.el('text',{x:ox,y:oy+16,'font-size':14,fill:C.ink,'font-weight':600,text:'두 광고 상호작용의 크기와 부호'},svg);
  const rows=[
   {title:'가법 척도: 차이의 차이',dom:[-20,20],obs:r.addObs,adj:r.add,val:PP(r.add),ticks:[-20,-10,0,10,20],tf:v=>(v>0?'+':'')+v,unit:'%p'},
   {title:'비율 척도: 배수의 비 (로그)',dom:[Math.log(.08),Math.log(12.5)],obs:Math.log(r.ratioObs),adj:Math.log(r.ratio),val:X(r.ratio),ticks:[.1,.3,1,3,10].map(Math.log),tf:v=>{const t=Math.exp(v);return (t<1?fmt(t,1):fmt(t,0))+'배'}}];
  rows.forEach((d,i)=>{
   const ty=oy+56+i*132,by=ty+14,bh=22,ax=by+bh+8;
   const sc=LI.scale(d.dom,[left,right]),cl=v=>Math.min(Math.max(v,d.dom[0]),d.dom[1]),x=v=>sc(cl(v)),z=sc(0);
   LI.el('text',{x:left,y:ty,'font-size':14,fill:C.ink,text:d.title},svg);
   LI.el('text',{x:right,y:ty,'text-anchor':'end','font-size':14,'font-weight':600,fill:C.accent,text:d.val},svg);
   const bar=(v,attrs)=>{const a=x(v);LI.el('rect',{x:Math.min(a,z),y:by,width:Math.max(Math.abs(a-z),.01),height:bh,...attrs},svg)};
   if(Number.isFinite(d.obs))bar(d.obs,{fill:'none',stroke:C.blue,'stroke-width':2});
   if(Number.isFinite(d.adj))bar(d.adj,{fill:C.blue,'fill-opacity':.85});
   LI.axis(svg,sc,{side:'bottom',at:ax,ticks:d.ticks,format:d.tf,size:13});
   LI.el('line',{x1:z,x2:z,y1:by-6,y2:ax,stroke:C.ink,'stroke-width':1.5},svg);
   LI.el('text',{x:left,y:ax+42,'font-size':13,fill:C.muted,text:i===0?'0보다 크면 시너지, 작으면 상쇄':'1배보다 크면 시너지, 작으면 상쇄'},svg);
  });
 }

 function draw(s){
  st.layout();
  const r=calc(s);
  if(st.narrow){lines(s,r,0,0,360,340);bars(r,0,366,360)}
  else{lines(s,r,0,0,340,330);bars(r,366,0,274)}
  const share=r.addObs>0?fmt(Math.min(r.sEff/r.addObs,9.99)*100,0)+'%':'해당 없음';
  show([
   ['가법 상호작용 (관찰값)',PP(r.addObs),`${fmt(s.p11,1)} − ${fmt(s.p01,1)} − ${fmt(s.p10,1)} + ${fmt(s.p00,1)}`],
   ['가법 상호작용 (선택 보정 후)',PP(r.add),'관찰값에서 선택편향을 뺀 값',true],
   ['비율 척도 상호작용 (선택 보정 후)',X(r.ratio),`딜러 광고 배수 ${X(r.multYes)} (제조사 있음) ÷ ${X(r.multNo)} (제조사 없음)`,true],
   ['관찰 가법 상호작용 중 선택편향의 몫',share,r.addObs>0?'100%를 넘으면 보정 후 부호가 음으로 바뀜':'관찰 가법 상호작용이 0 이하'],
   ['척도에 따라 부호가 갈리는 구간',`${R(Math.min(r.A,r.M))}에서 ${R(Math.max(r.A,r.M))} 사이`,'두 광고 집단 전환율이 이 구간에 있으면 두 척도의 부호가 다름']]);
  const eps=.05,aS=Math.abs(r.add)<eps?0:Math.sign(r.add),rS=Math.abs(Math.log(r.ratio))<.005?0:Math.sign(Math.log(r.ratio));
  let t;
  if(aS>0&&rS<0)t=`두 광고 집단 전환율이 ${P(r.m11)}로 가법 기준 ${P(r.A)}보다 높고 곱셈 기준 ${R(r.M)}보다 낮습니다. 퍼센트포인트로는 시너지이지만, 배수로는 제조사 광고가 있을 때 딜러 광고의 상대적 증가가 오히려 작습니다. 척도를 밝히지 않은 "시너지"는 부호조차 정해지지 않습니다.`+(r.sEff<r.addObs?` 선택편향을 ${fmt(r.addObs,1)}%p 이상으로 두면 가법 척도의 시너지도 사라집니다.`:'');
  else if(aS<0&&rS>0)t=`두 광고 집단 전환율이 ${P(r.m11)}로 곱셈 기준 ${R(r.M)}보다 높고 가법 기준 ${P(r.A)}보다 낮습니다. 한 광고의 효과가 음수인 조합이라 기준의 순서가 뒤바뀌었고, 이번에는 비율 척도에서만 시너지가 나타납니다.`;
  else if(aS>0&&rS>0)t=`두 척도 모두 양의 상호작용입니다. 그래도 선택편향이 ${fmt(s.p11-r.A,1)}%p를 넘으면 가법 척도의 시너지가, ${fmt(s.p11-r.M,1)}%p를 넘으면 비율 척도의 시너지가 사라집니다.`;
  else if(aS<0&&rS<0)t=r.sEff>0&&r.addObs>0?`선택편향 ${fmt(r.sEff,1)}%p가 관찰 가법 상호작용 ${fmt(r.addObs,1)}%p보다 커서, 관찰표의 "시너지"가 전부 두 광고 집단의 원래 구매 의향으로 설명되고도 남습니다. 이 가정에서는 두 척도 모두 상쇄입니다.`:'두 척도 모두 음의 상호작용입니다. 두 광고를 함께 줄 때의 증가가 따로 줄 때의 증가를 합한 것보다 작습니다.';
  else t='한 척도에서 상호작용이 거의 0입니다. 기준값 근처에서는 작은 측정 차이나 선택편향으로도 부호가 바뀝니다.';
  if(r.clamped)t='선택편향이 두 광고 집단 전환율보다 클 수는 없어 '+fmt(r.sEff,1)+'%p로 제한해 계산했습니다. '+t;
  warn.textContent=t;
 }
 draw(ctl.state);
 st.onResize(()=>draw(ctl.state));
});
