// Home Alarm LTV: survival curves and discounted yearly margins for auto-pay and non-auto-pay customers,
// with the discount rate, price growth, horizon and the two timing conventions under the reader's control.
LI.register('ltv-calculator',root=>{
 const {C,fmt,pct}=LI;
 // Case p.3 attrition table: share of customers still active at the start of year t who leave during year t.
 const Q={N:[.084,.122,.162,.154,.134,.120,.111,.096,.086],A:[.032,.070,.097,.103,.095,.078,.069,.059,.053]};
 const PRICE=40,COST=.20,SETUP=195-492,DATA_YEARS=9,PV_MAX=500;
 const CHURN=['연초','연중','연말'],DISC=['연초','연중','연말'];
 const usd=v=>(v<0?'-$':'$')+fmt(Math.abs(v),2);

 // Expected discounted margin per original customer, year by year.
 // churn: 0 = leavers go at the start of the year (use S_t), 1 = mid-year (average of S_{t-1} and S_t), 2 = end (S_{t-1}).
 // disc: 0 = the year's margin arrives at the start of year t (t-1 discount periods), 1 = mid-year (t-0.5), 2 = end (t).
 function group(q,{r,g,H,churn,disc}){
  const S=[1],pv=[];
  for(let t=1;t<=H;t++){
   const qt=t<=q.length?q[t-1]:q[q.length-1];
   S.push(S[t-1]*(1-qt));
   const w=churn===0?S[t]:churn===1?(S[t-1]+S[t])/2:S[t-1];
   const m=12*PRICE*(1-COST)*Math.pow(1+g,t-1);
   pv.push(w*m/Math.pow(1+r,disc===0?t-1:disc===1?t-.5:t));
  }
  return {S,pv,total:pv.reduce((a,b)=>a+b,0)};
 }
 const DEFAULTS={r:.10,g:.03,H:9,churn:0,disc:2};

 const st=LI.stage(root,{width:640,height:330,narrowWidth:360,narrowHeight:640,label:'자동이체 사용 집단과 미사용 집단의 잔존율 곡선과 연차별 운영마진 현재가치'});
 LI.legend(root,[['자동이체 사용',C.blue],['자동이체 미사용',C.rust],['10년차 이후 가정 구간',C.gray,true]]);
 const show=LI.readout(root);
 const msg=LI.note(root,'');
 const ctl=LI.controls(root,[
  {key:'r',label:'연 할인율',min:0,max:.2,step:.005,value:DEFAULTS.r,format:v=>pct(v,1)},
  {key:'g',label:'요금과 비용의 연 인상률',min:0,max:.08,step:.005,value:DEFAULTS.g,format:v=>pct(v,1)},
  {key:'H',label:'계산 기간 (절단 연수)',min:1,max:20,step:1,value:DEFAULTS.H,format:v=>v+'년'},
  {key:'churn',label:'그해 이탈자가 나가는 시점',min:0,max:2,step:1,value:DEFAULTS.churn,format:v=>CHURN[v]},
  {key:'disc',label:'그해 마진을 받는 시점 (할인)',min:0,max:2,step:1,value:DEFAULTS.disc,format:v=>DISC[v]}],draw);

 function panel(x0,y0,w,h,title,fs){
  LI.el('text',{x:x0-44,y:y0-22,'font-size':fs,fill:C.ink,'font-weight':600,text:title},st.svg);
  return {x0,y0,w,h};
 }
 function yearTicks(H){
  if(H<=10)return Array.from({length:H+1},(_,i)=>i);
  const step=H<=14?2:5,out=[];for(let t=0;t<=H;t+=step)out.push(t);if(out[out.length-1]!==H&&H-out[out.length-1]>=2)out.push(H);return out;
 }

 function draw(s){
  st.layout();
  const n=st.narrow,fs=n?14:13,fsT=n?15:14;
  const N=group(Q.N,s),A=group(Q.A,s),H=s.H,diff=A.total-N.total;
  const dYear=A.pv.map((v,i)=>v-N.pv[i]);

  // Panel 1: share of the original customers still active after each year's attrition.
  const p1=n?panel(58,48,282,220,'최초 가입자 중 잔존율',fsT):panel(58,48,232,210,'최초 가입자 중 잔존율',fsT);
  const x1=LI.scale([0,H],[p1.x0,p1.x0+p1.w]),y1=LI.scale([0,1],[p1.y0+p1.h,p1.y0]);
  for(const v of [.25,.5,.75,1])LI.el('line',{x1:p1.x0,x2:p1.x0+p1.w,y1:y1(v),y2:y1(v),stroke:C.line,'stroke-dasharray':'2 4'},st.svg);
  LI.axis(st.svg,x1,{side:'bottom',at:p1.y0+p1.h,ticks:yearTicks(H),format:v=>String(v),label:'가입 후 연수',size:fs});
  LI.axis(st.svg,y1,{side:'left',at:p1.x0,ticks:[0,.25,.5,.75,1],format:v=>pct(v,0),size:fs});
  if(H>DATA_YEARS){
   const xd=x1(DATA_YEARS);
   LI.el('line',{x1:xd,x2:xd,y1:p1.y0,y2:p1.y0+p1.h,stroke:C.gray,'stroke-dasharray':'4 4'},st.svg);
   LI.el('text',{x:xd+4,y:p1.y0+12,'font-size':fs-1,fill:C.muted,text:'원문 자료 끝'},st.svg);
  }
  for(const [G,color] of [[N,C.rust],[A,C.blue]]){
   const obs=G.S.slice(0,Math.min(H,DATA_YEARS)+1).map((v,t)=>[x1(t),y1(v)]);
   LI.polyline(st.svg,obs,{stroke:color});
   if(H>DATA_YEARS)LI.polyline(st.svg,G.S.slice(DATA_YEARS).map((v,i)=>[x1(DATA_YEARS+i),y1(v)]),{stroke:color,'stroke-dasharray':'5 4'});
   G.S.forEach((v,t)=>{if(H<=10||t===H)LI.el('circle',{cx:x1(t),cy:y1(v),r:t===H?4:2.6,fill:color},st.svg)});
  }
  // End labels sit just below each curve's last point (the curves fall to the right, so the space below the
  // end point is free); the lower label is pushed down when the two curves end close together.
  const lx=p1.x0+p1.w-4,la=y1(A.S[H])+fs+5,ln=Math.max(y1(N.S[H])+fs+5,la+fs+3);
  LI.el('text',{x:lx,y:la,'text-anchor':'end','font-size':fs,fill:C.blue,'font-weight':600,text:pct(A.S[H],1)},st.svg);
  LI.el('text',{x:lx,y:ln,'text-anchor':'end','font-size':fs,fill:C.rust,'font-weight':600,text:pct(N.S[H],1)},st.svg);

  // Panel 2: expected margin per original customer, discounted to sign-up. The blue segment on top of the
  // non-auto-pay bar is the auto-pay group's extra present value in that year, so the bar top is the auto-pay PV.
  const p2=n?panel(58,370,282,210,'연차별 운영마진 현재가치 (달러)',fsT):panel(376,48,250,210,'연차별 운영마진 현재가치 (달러)',fsT);
  const bandW=p2.w/H,barW=Math.max(3,Math.min(24,bandW*.62));
  const x2=t=>p2.x0+bandW*(t-.5),y2=LI.scale([0,PV_MAX],[p2.y0+p2.h,p2.y0]);
  for(const v of [100,200,300,400,500])LI.el('line',{x1:p2.x0,x2:p2.x0+p2.w,y1:y2(v),y2:y2(v),stroke:C.line,'stroke-dasharray':'2 4'},st.svg);
  LI.axis(st.svg,y2,{side:'left',at:p2.x0,ticks:[0,100,200,300,400,500],format:v=>fmt(v,0),size:fs});
  const g2=LI.el('g',{class:'li-axis'},st.svg);
  LI.el('line',{x1:p2.x0,x2:p2.x0+p2.w,y1:p2.y0+p2.h,y2:p2.y0+p2.h,stroke:C.line},g2);
  for(const t of yearTicks(H).filter(t=>t>0))LI.el('text',{x:x2(t),y:p2.y0+p2.h+19,'text-anchor':'middle','font-size':fs,fill:C.muted,text:String(t)},g2);
  LI.el('text',{x:p2.x0+p2.w/2,y:p2.y0+p2.h+38,'text-anchor':'middle','font-size':fs,fill:C.muted,text:'서비스 연차'},g2);
  let peak=0;dYear.forEach((d,i)=>{if(d>dYear[peak])peak=i});
  for(let t=1;t<=H;t++){
   const a=A.pv[t-1],b=N.pv[t-1],x=x2(t)-barW/2,op=t>DATA_YEARS?.45:1;
   LI.el('rect',{x,y:y2(b),width:barW,height:y2(0)-y2(b),fill:C.rust,opacity:op},st.svg);
   LI.el('rect',{x,y:y2(a),width:barW,height:Math.max(0,y2(b)-y2(a)),fill:C.blue,opacity:op},st.svg);
  }
  // Mark the year where the auto-pay advantage in present value is largest (the amount is in the readout).
  const px=x2(peak+1),py=y2(A.pv[peak]);
  LI.el('line',{x1:px,x2:px,y1:py-4,y2:py-14,stroke:C.ink,'stroke-width':1.5},st.svg);
  if(bandW>=24)LI.el('text',{x:px,y:py-19,'text-anchor':'middle','font-size':fs,fill:C.ink,text:'최대'},st.svg);

  // Key numbers.
  const late=H>=3?dYear.slice(2).reduce((a,b)=>a+b,0)/diff:0;
  show([
   [`미사용 운영 PV (${H}년)`,usd(N.total),`설치비 포함 ${usd(N.total+SETUP)}`],
   [`자동이체 운영 PV (${H}년)`,usd(A.total),`설치비 포함 ${usd(A.total+SETUP)}`],
   ['LTV 차이 (자동이체 - 미사용)',usd(diff),'설치 순비용 $297은 두 집단에 같아 차이는 그대로',true],
   ['차이 중 3년차 이후 몫',H>=3?pct(late,0):'해당 없음',H>=3?`첫 2년 몫 ${usd(dYear[0]+(dYear[1]||0))}`:'계산 기간이 2년 이하'],
   ['연차별 차이가 가장 큰 해',`${peak+1}년차, ${usd(dYear[peak])}`,`${H}년 뒤 잔존율 ${pct(A.S[H],1)} 대 ${pct(N.S[H],1)}`]]);

  // Commentary that changes with the settings.
  const isDefault=Object.keys(DEFAULTS).every(k=>s[k]===DEFAULTS[k]);
  const out=[];
  if(isDefault)out.push('기본값은 본문 6절 계산표(연초 이탈, 연말 할인, 9년 절단)와 같습니다. 연차별 이탈률 차이는 3-7%포인트지만, 잔존 격차가 해마다 누적되어 차이의 대부분이 3년차 이후에 생깁니다.');
  else{
   const base=group(Q.A,{...s,churn:0}).total-group(Q.N,{...s,churn:0}).total;
   if(s.churn!==0)out.push(`이탈 시점을 ${CHURN[s.churn]}로 늦추면 두 집단의 PV는 모두 커지지만, 이탈률 차이가 그만큼 늦게 금액에 반영되어 차이는 연초 이탈일 때(${usd(base)})보다 작아집니다.`);
   if(s.disc!==2)out.push(`할인 시점을 ${DISC[s.disc]}로 앞당기면 모든 해의 할인이 같은 폭으로 줄어, 두 PV와 차이가 모두 연말 할인일 때의 ${fmt(Math.pow(1+s.r,s.disc===0?1:.5),3)}배가 됩니다. 두 집단 PV의 비율은 그대로입니다.`);
   if(s.H>DATA_YEARS)out.push(`10년차 이후 이탈률은 원문에 없어 9년차 값(미사용 8.6%, 자동이체 5.3%)이 계속된다고 가정했습니다. 남은 고객이 많은 자동이체 집단의 가치가 더 늘어, 9년 절단 차이는 차이를 과소평가한 값이 됩니다.`);
   if(s.H<DATA_YEARS)out.push(`${s.H}년에서 자르면 그 뒤 해의 차이가 모두 빠집니다. 측정 기간이 짧은 실험으로는 장기 가치 차이의 일부만 관측된다는 뜻입니다.`);
   if(s.r!==DEFAULTS.r&&out.length<3)out.push(s.r>DEFAULTS.r?'할인율을 높이면 먼 해의 금액이 크게 줄어듭니다. 자동이체 집단의 우위는 뒤쪽 해에 몰려 있어 차이가 수준보다 빠르게 줄어듭니다.':'할인율을 낮추면 먼 해의 금액이 덜 줄어, 뒤쪽 해에 몰린 자동이체 집단의 우위가 더 크게 반영됩니다.');
   if(s.g!==DEFAULTS.g&&out.length<3)out.push('인상률은 두 집단의 마진에 똑같이 곱해지므로 차이의 원천은 여전히 잔존확률뿐입니다. 인상률이 할인율에 가까울수록 먼 해의 비중이 커집니다.');
  }
  msg.textContent=out.slice(0,3).join(' ');
 }
 draw(ctl.state);
 st.onResize(()=>draw(ctl.state));
});
