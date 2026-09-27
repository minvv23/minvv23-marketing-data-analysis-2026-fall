// MHE Ch.2 hospital example: observed difference = ATT + selection bias, and what random assignment removes.
// Population of two kinds: people who choose hospitalization (share p) and the rest. The rest have mean
// health 3.93 without hospitalization (NHIS 2005 non-hospitalized mean). Everything is a population mean,
// so there is no sampling noise and no random draw.
LI.register('selection-bias',root=>{
 const {C,fmt,pct}=LI;
 const Y0_REST=3.93;
 const clean=v=>Math.abs(v)<.005?0:v;
 const sg=v=>{v=clean(v);return (v>0?'+':'')+fmt(v,2)};
 const st=LI.stage(root,{width:640,height:410,narrowWidth:360,narrowHeight:506,label:'입원자와 비입원자의 평균 건강, 그리고 관측 차이를 입원의 효과와 선택편향으로 나눈 막대'});
 LI.legend(root,[['입원했을 때의 평균 건강 Y(1)',C.blue],['입원하지 않았을 때의 평균 건강 Y(0)',C.rust],['속이 빈 점: 관측되지 않는 반사실 평균',C.muted,false,true]]);
 const show=LI.readout(root);
 const msg=LI.note(root,'');
 const ctl=LI.controls(root,[
  {key:'s',label:'입원을 택하는 사람의 원래 건강 차이',min:-2,max:.3,step:.01,value:-1.43,format:sg},
  {key:'t1',label:'입원을 택하는 사람에게 입원의 효과',min:-.8,max:1.2,step:.01,value:.71,format:sg},
  {key:'t0',label:'입원하지 않는 사람에게 입원의 효과',min:-.8,max:1,step:.01,value:.71,format:sg},
  {key:'p',label:'입원을 택하는 사람의 비율',min:.05,max:.95,step:.01,value:.08,format:v=>pct(v,0)},
  {key:'rand',label:'무작위 배정 (동전 던지기로 입원 여부 결정)',type:'toggle',value:false}],draw);

 // Group means and the decomposition for the current settings.
 function model({s,t1,t0,p,rand}){
  const y0Self=Y0_REST+s,y1Self=y0Self+t1,y1Rest=Y0_REST+t0;
  const ate=p*t1+(1-p)*t0;
  if(!rand){
   // Self-selection: the treated group is exactly the people who choose hospitalization.
   return {rand,ate,treat:{y1:y1Self,y0:y0Self},ctrl:{y0:Y0_REST,y1:y1Rest},att:t1,sb:s,obs:t1+s,atu:t0,over:y1Self>5};
  }
  // Coin flip: both groups are random halves of the same population, so they share the same mean potential outcomes.
  const ey0=p*y0Self+(1-p)*Y0_REST,ey1=p*y1Self+(1-p)*y1Rest;
  return {rand,ate,treat:{y1:ey1,y0:ey0},ctrl:{y0:ey0,y1:ey1},att:ate,sb:0,obs:ey1-ey0,atu:ate,over:y1Self>5};
 }

 function draw(state){
  st.layout();
  const m=model(state),n=st.narrow,svg=st.svg,W=st.width;
  const fs=n?15:13,fsT=n?16:14;
  const x0=n?44:180,x1=n?340:612;
  const T=(x,y,text,a={})=>LI.el('text',{x,y,'font-size':fs,fill:C.ink,text,...a},svg);

  // Panel 1: group means on the 1-5 health scale.
  const hx=LI.scale([1,5],[x0,x1]);
  const L=n?{title:20,r1lab:48,r1:72,mid:110,r2lab:140,r2:162,axis:190}:{title:20,r1:60,mid:95,r2:130,axis:158};
  T(16,L.title,m.rand?'무작위 배정: 두 집단의 평균 건강':'스스로 입원한 경우: 두 집단의 평균 건강',{'font-size':fsT,'font-weight':600});
  const rows=[
   {y:L.r1,ly:n?L.r1lab:L.r1+5,label:m.rand?'처치집단 (입원 배정)':'입원자',obs:{v:m.treat.y1,c:C.blue},cf:{v:m.treat.y0,c:C.rust}},
   {y:L.r2,ly:n?L.r2lab:L.r2+5,label:m.rand?'통제집단 (비입원 배정)':'비입원자',obs:{v:m.ctrl.y0,c:C.rust},cf:{v:m.ctrl.y1,c:C.blue}}];
  const cx=v=>hx(Math.min(5,Math.max(1,v)));
  for(const r of rows){
   T(16,r.ly,r.label,{fill:C.ink});
   LI.el('line',{x1:x0,x2:x1,y1:r.y,y2:r.y,stroke:C.line},svg);
  }
  // ATT segment inside the treated row: from its unobserved Y(0) mean to its observed Y(1) mean.
  LI.el('line',{x1:cx(m.treat.y0),x2:cx(m.treat.y1),y1:L.r1,y2:L.r1,stroke:C.blue,'stroke-width':5,'stroke-opacity':.45},svg);
  // Selection bias: gap between the two Y(0) means, drawn on a line between the rows.
  const a=cx(m.treat.y0),b=cx(m.ctrl.y0);
  LI.el('line',{x1:a,x2:a,y1:L.r1+7,y2:L.mid,stroke:C.rust,'stroke-dasharray':'3 3'},svg);
  LI.el('line',{x1:b,x2:b,y1:L.mid,y2:L.r2-7,stroke:C.rust,'stroke-dasharray':'3 3'},svg);
  LI.el('line',{x1:a,x2:b,y1:L.mid,y2:L.mid,stroke:C.rust,'stroke-width':3},svg);
  // Label centred on the segment when it is long enough, otherwise beside the dashed drop lines.
  const sbText=`선택편향 ${sg(m.sb)}`,lo=Math.min(a,b),hi=Math.max(a,b);
  if(hi-lo>120)T((a+b)/2,L.mid-7,sbText,{'text-anchor':'middle',fill:C.rust});
  else if(x1-hi>110)T(hi+8,L.mid+5,sbText,{fill:C.rust});
  else T(lo-8,L.mid+5,sbText,{'text-anchor':'end',fill:C.rust});
  for(const r of rows){
   const pts=[{...r.obs,hollow:false},{...r.cf,hollow:true}].sort((u,w)=>u.v-w.v);
   pts.forEach((d,i)=>{
    const x=cx(d.v);
    LI.el('circle',{cx:x,cy:r.y,r:6,fill:d.hollow?C.pale:d.c,stroke:d.c,'stroke-width':2,'stroke-dasharray':d.hollow?'2 2':null},svg);
    // Left point labelled on its left, right point on its right, so the two labels never overlap.
    const right=i===1,lab={fill:d.hollow?C.muted:C.ink};
    if(right&&x+50>W)T(x+6,r.y-12,fmt(d.v,2),{...lab,'text-anchor':'end'});
    else T(x+(right?11:-11),r.y+5,fmt(d.v,2),{...lab,'text-anchor':right?'start':'end'});
   });
  }
  LI.axis(svg,hx,{side:'bottom',at:L.axis,ticks:[1,2,3,4,5],size:fs,format:v=>fmt(v,0)});
  T(x1,L.axis+38,'평균 건강점수 (1 나쁨, 5 최상)',{'text-anchor':'end',fill:C.muted});

  // Panel 2: waterfall of the decomposition on a common difference scale.
  const top=n?262:222;
  T(16,top,m.rand?'분해: 관측 차이 = ATT + 선택편향(0) = ATE':'분해: 관측 차이 = ATT + 선택편향',{'font-size':fsT,'font-weight':600});
  const dx=LI.scale([-3,2],[x0,x1]),pitch=n?52:34,bh=n?18:18;
  const first=n?top+42:top+28;
  const bars=[
   {label:m.rand?'처치집단의 효과 ATT':'입원자의 효과 ATT',from:0,to:m.att,fill:C.blue,stroke:C.blue},
   {label:'선택편향',from:m.att,to:m.att+m.sb,fill:C.rust,stroke:C.rust},
   {label:'관측 차이',from:0,to:m.obs,fill:C.gray,stroke:C.gray},
   {label:'전체 평균효과 ATE',from:0,to:m.ate,fill:C.pale,stroke:C.blue}];
  const yOf=i=>first+i*pitch;
  const zx=dx(0);
  LI.el('line',{x1:zx,x2:zx,y1:first-bh/2-6,y2:yOf(3)+bh/2+6,stroke:C.ink,'stroke-width':1},svg);
  bars.forEach((bar,i)=>{
   const y=yOf(i),xa=dx(bar.from),xb=dx(bar.to),v=clean(bar.to-bar.from);
   if(n)T(16,y-bh/2-6,bar.label);else T(16,y+5,bar.label);
   const w=Math.abs(xb-xa);
   LI.el('rect',{x:Math.min(xa,xb),y:y-bh/2,width:Math.max(w,v===0?0:1),height:bh,fill:bar.fill,stroke:bar.stroke,'stroke-width':bar.fill===C.pale?1.5:0},svg);
   // Value label just past the far end of the bar; if that runs off the plot, put it past the near end instead.
   const dir=v<0?-1:1,room=dir<0?xb-x0:x1-xb;
   const lx=room>52?xb+dir*8:xa-dir*8,anchor=(room>52?dir:-dir)<0?'end':'start';
   T(lx,y+5,sg(v),{'text-anchor':anchor,'font-weight':i===2?600:400});
  });
  // Waterfall connectors: the ATT bar ends where the selection-bias bar starts, which ends where the observed bar ends.
  const link=(v,i)=>LI.el('line',{x1:dx(v),x2:dx(v),y1:yOf(i)+bh/2,y2:yOf(i+1)-bh/2,stroke:C.muted,'stroke-dasharray':'2 3'},svg);
  link(m.att,0);link(m.att+m.sb,1);
  LI.axis(svg,dx,{side:'bottom',at:yOf(3)+bh/2+10,ticks:[-3,-2,-1,0,1,2],size:fs,format:v=>v>0?'+'+v:String(v)});

  show([
   ['관측 차이 (입원 집단 평균 - 비입원 집단 평균)',sg(m.obs),'자료에서 직접 계산할 수 있는 유일한 값',true],
   [m.rand?'처치집단의 평균효과 ATT':'입원자의 평균효과 ATT',sg(m.att),m.rand?'처치집단이 모집단을 대표하므로 ATE와 같음':'실제 입원자가 얻은 평균 이익, 관측 불가'],
   ['선택편향',sg(m.sb),'두 집단의 Y(0) 평균 차이, 관측 불가'],
   ['전체 평균효과 ATE',sg(m.ate),`두 사람 유형의 효과를 비율 ${pct(state.p,0)}, ${pct(1-state.p,0)}로 가중평균`,m.rand]]);

  let t;
  if(m.rand){
   t=`무작위 배정에서는 두 집단의 Y(0) 평균이 같아(모두 ${fmt(m.treat.y0,2)}) 선택편향이 0이고, 관측 차이가 ATE와 같습니다(${sg(m.ate)}).`;
   if(Math.abs(state.t1-state.t0)>=.005)t+=` 이 값은 스스로 입원하는 사람의 효과(${sg(state.t1)})와 다릅니다. 무작위 실험의 평균 차이는 모집단 전체의 평균효과를 추정합니다.`;
  }else{
   const obs=clean(m.obs),att=clean(m.att),sb=clean(m.sb);
   if(sb===0)t='선택편향이 0이므로 관측 차이가 입원자의 효과 ATT와 같습니다.'+(Math.abs(att-clean(m.ate))>=.005?` 다만 두 사람 유형의 효과가 달라 전체 평균효과 ATE(${sg(m.ate)})와는 다릅니다.`:'');
   else if(att===0)t=`입원의 효과가 0이어도 관측 차이는 0이 아니고 선택편향과 같은 값(${sg(obs)})이 됩니다.`;
   else if(obs!==0&&Math.sign(obs)!==Math.sign(att))t=`부호 역전: 입원은 입원자에게 ${att>0?'도움이 되었지만':'해로웠지만'}(ATT ${sg(att)}) 관측 차이는 ${obs<0?'음수':'양수'}(${sg(obs)})입니다. 선택편향(${sg(sb)})의 크기가 효과보다 커서 방향이 뒤집혔습니다.`;
   else if(sb>0)t=`입원을 택하는 사람이 원래 더 건강한 설정이라 선택편향이 양수이고, 관측 차이(${sg(obs)})는 ATT(${sg(att)})보다 선택편향만큼 큽니다.`;
   else t=`입원을 택하는 사람이 원래 덜 건강해 선택편향이 음수이고, 관측 차이(${sg(obs)})는 ATT(${sg(att)})보다 선택편향만큼 작습니다. 부호는 같아도 효과의 크기를 잘못 읽게 됩니다.`;
  }
  if(m.over)t+=' 이 조합에서는 입원자의 Y(1) 평균이 건강점수 상한 5를 넘어 점을 5에 붙여 그렸습니다.';
  msg.textContent=t;
 }
 draw(ctl.state);
 st.onResize(()=>draw(ctl.state));
});
