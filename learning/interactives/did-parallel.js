// DID with the New Jersey-Pennsylvania minimum wage means: the counterfactual path under parallel trends,
// and why the DID estimate misses the true effect by exactly the trend gap when parallel trends fail.
LI.register('did-parallel',root=>{
 const {C,fmt}=LI;
 // Card and Krueger (1994), MHE Table 5.2.1: mean FTE employment per restaurant.
 const PA0=23.33,PA1=21.17,NJ0=20.44,CF=NJ0+(PA1-PA0);
 const st=LI.stage(root,{width:640,height:350,narrowWidth:360,narrowHeight:400,label:'펜실베이니아와 뉴저지의 평균 고용, 평행추세 반사실과 실제 무처치 경로'});
 LI.legend(root,[['펜실베이니아 (비교집단)',C.rust],['뉴저지 관측',C.blue],['평행추세가 가정하는 뉴저지 반사실',C.rust,true],['뉴저지의 실제 무처치 경로',C.gray,true]]);
 const show=LI.readout(root);
 const msg=LI.note(root,'');
 const sgn=v=>(v>0.004?'+':v<-0.004?'-':'')+fmt(Math.abs(v),2);
 const ctl=LI.controls(root,[
  {key:'gap',label:'추세 차이 (NJ 무처치 - PA)',min:-2.5,max:2.5,step:0.05,value:0,format:sgn},
  {key:'delta',label:'최저임금 인상의 참효과 (FTE)',min:-2.5,max:4,step:0.05,value:2.75,format:sgn}],draw);

 function draw(s){
  st.layout();
  const n=st.narrow,svg=st.svg,fs=n?14:13;
  const x0=n?98:150,x1=n?218:400,top=56,bot=st.height-(n?52:50);
  const ys=LI.scale([13,25],[bot,top]);
  const U=CF+s.gap,NJ1=U+s.delta,did=NJ1-NJ0-(PA1-PA0);
  LI.axis(svg,ys,{side:'left',at:n?44:56,ticks:[13,15,17,19,21,23,25],format:v=>fmt(v,0),label:'식당당 평균 FTE 고용',size:fs});
  // Time axis with the two survey waves.
  const ax=n?44:56;
  LI.el('line',{x1:ax,x2:st.width-(n?8:20),y1:bot,y2:bot,stroke:C.line},svg);
  [[x0,n?'2월 (인상 전)':'1992년 2월 (인상 전)'],[x1,n?'11월 (인상 후)':'1992년 11월 (인상 후)']].forEach(([x,t])=>{
   LI.el('line',{x1:x,x2:x,y1:bot,y2:bot+5,stroke:C.line},svg);
   LI.el('text',{x,y:bot+21,'text-anchor':'middle','font-size':fs,fill:C.muted,text:t},svg)});
  LI.el('line',{x1:x0,x2:x0,y1:top,y2:bot,stroke:C.line,'stroke-dasharray':'2 4'},svg);
  LI.el('line',{x1:x1,x2:x1,y1:top,y2:bot,stroke:C.line,'stroke-dasharray':'2 4'},svg);
  // Paths: comparison, assumed counterfactual, true untreated path, observed treated.
  LI.polyline(svg,[[x0,ys(NJ0)],[x1,ys(U)]],{stroke:C.gray,'stroke-dasharray':'6 5'});
  LI.polyline(svg,[[x0,ys(NJ0)],[x1,ys(CF)]],{stroke:C.rust,'stroke-dasharray':'6 5'});
  LI.polyline(svg,[[x0,ys(PA0)],[x1,ys(PA1)]],{stroke:C.rust});
  LI.polyline(svg,[[x0,ys(NJ0)],[x1,ys(NJ1)]],{stroke:C.blue});
  const dot=(x,v,col,hollow)=>LI.el('circle',{cx:x,cy:ys(v),r:4.5,fill:hollow?'var(--bg)':col,stroke:col,'stroke-width':2},svg);
  dot(x0,PA0,C.rust);dot(x1,PA1,C.rust);dot(x0,NJ0,C.blue);dot(x1,NJ1,C.blue);dot(x1,CF,C.rust,true);
  if(Math.abs(s.gap)>0.001)dot(x1,U,C.gray,true);
  // Value labels at the pre-period points.
  LI.el('text',{x:x0-10,y:ys(PA0)+5,'text-anchor':'end','font-size':fs,fill:C.rust,text:n?fmt(PA0,2):`PA ${fmt(PA0,2)}`},svg);
  LI.el('text',{x:x0-10,y:ys(NJ0)+5,'text-anchor':'end','font-size':fs,fill:C.blue,text:n?fmt(NJ0,2):`NJ ${fmt(NJ0,2)}`},svg);
  // Brackets at the post period: trend gap, true effect, DID estimate.
  const bx=[x1+(n?16:22),x1+(n?30:40),x1+(n?44:58)];
  const bracket=(x,lo,hi,col,w)=>{if(Math.abs(hi-lo)<1e-9)return;const a=ys(lo),b=ys(hi);
   LI.el('line',{x1:x,x2:x,y1:a,y2:b,stroke:col,'stroke-width':w},svg);
   for(const y of [a,b])LI.el('line',{x1:x-4,x2:x+4,y1:y,y2:y,stroke:col,'stroke-width':w},svg)};
  bracket(bx[0],CF,U,C.gray,2);
  bracket(bx[1],U,NJ1,C.blue,2.5);
  bracket(bx[2],CF,NJ1,C.ink,2.5);
  // Labels for the brackets, pushed apart so they never overlap.
  const labs=[
   {y:ys((CF+U)/2),t:`${n?'추세차':'추세 차이'} ${sgn(s.gap)}`,c:C.muted},
   {y:ys((U+NJ1)/2),t:`참효과 ${sgn(s.delta)}`,c:C.blue},
   {y:ys((CF+NJ1)/2),t:`DID ${sgn(did)}`,c:C.ink}].sort((p,q)=>p.y-q.y);
  const gapPx=19;
  for(let k=1;k<labs.length;k++)if(labs[k].y-labs[k-1].y<gapPx)labs[k].y=labs[k-1].y+gapPx;
  const over=labs[labs.length-1].y-(bot-6);if(over>0)for(const l of labs)l.y-=over;
  for(let k=labs.length-2;k>=0;k--)if(labs[k+1].y-labs[k].y<gapPx)labs[k].y=labs[k+1].y-gapPx;
  const lx=bx[2]+(n?10:14);
  for(const l of labs)LI.el('text',{x:lx,y:l.y+5,'font-size':fs,fill:l.c,'font-weight':l.c===C.ink?600:400,text:l.t},svg);
  LI.el('text',{x:ax,y:18,'font-size':fs,fill:C.muted,text:n?'원문 Table 5.2.1의 네 평균에서 출발':'원문 Table 5.2.1의 네 평균에서 출발 (PA 23.33, 21.17 / NJ 20.44, 21.03)'},svg);

  show([
   ['DID 추정치',fmt(did,2),'(NJ 변화) - (PA 변화)',true],
   ['참효과',fmt(s.delta,2),null,true],
   ['추정치 - 참효과',fmt(did-s.delta,2),'NJ 무처치 추세 - PA 추세와 같음'],
   ['뉴저지 11월 평균',fmt(NJ1,2),'원문 21.03'],
   ['평행추세 반사실 / 실제 무처치',`${fmt(CF,2)} / ${fmt(U,2)}`,'PA 감소폭 2.16을 NJ에 적용한 값과 실제 경로']]);
  const same=Math.abs(NJ1-21.03)<0.026;
  let t;
  if(Math.abs(s.gap)<0.001)
   t='평행추세가 성립하면 뉴저지의 실제 무처치 경로가 점선 반사실과 겹치고, DID 추정치가 참효과와 같습니다.';
  else if(same)
   t=`관측된 네 평균은 원문과 같아 DID는 ${fmt(did,2)}이지만 참효과는 ${fmt(s.delta,2)}입니다. 네 평균만으로는 두 설명을 구분할 수 없고, 비교집단의 추세가 반사실을 대신한다는 가정이 답을 정합니다.`;
  else if(Math.sign(did)!==Math.sign(s.delta)&&Math.abs(did)>=0.05&&Math.abs(s.delta)>=0.05)
   t=`추세 차이(${sgn(s.gap)})의 방향이 참효과와 반대이고 크기가 더 커서, DID 추정치의 부호가 참효과와 반대가 되었습니다. 추정치와 참효과의 차이는 이때도 추세 차이와 정확히 같습니다.`;
  else if(s.gap>0)
   t=`뉴저지가 처치 없이도 펜실베이니아보다 ${fmt(s.gap,2)}만큼 나은 추세였다면, DID는 그 차이까지 정책효과로 읽어 참효과보다 ${fmt(s.gap,2)} 높게 나옵니다.`;
  else
   t=`뉴저지가 처치 없이는 펜실베이니아보다 ${fmt(-s.gap,2)}만큼 나쁜 추세였다면, DID는 그 차이만큼 참효과보다 ${fmt(-s.gap,2)} 낮게 나옵니다.`;
  msg.textContent=t;
 }
 draw(ctl.state);
 st.onResize(()=>draw(ctl.state));
});
