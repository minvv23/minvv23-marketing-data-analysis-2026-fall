// TripAdvisor's half-star rounding and the RD window around one rounding threshold (Hollenbeck, Moorthy, Proserpio 2019).
// Panel A: continuous average rating against the displayed star step. Panel B: simulated hotel-month bin means around
// the threshold nearest to the chosen hotel. Panel C: the jump estimate across window widths.
// Simulation: log ad spending = trend * X + tau * D + noise, X = rating - c, uniform density (Figure 8 is flat).
// Hotel-months per unit of X follow Table 4's N at bandwidth 0.05, and the bin noise is set so that the two-line RD
// standard error at h = 0.05 equals Table 4's SE for that threshold. Year-month and brand fixed effects are left out.
LI.register('rating-rounding',root=>{
 const {C,fmt}=LI;
 const W=.005,NB=100,HALF=.25;
 // Table 4: Above Threshold coefficient, robust SE and N for each threshold (bandwidth 0.05, 20+ reviews).
 const TH=[{c:3.25,b:-.156,se:.044,n:10825},{c:3.75,b:-.028,se:.032,n:22113},{c:4.25,b:-.062,se:.029,n:24824},{c:4.75,b:-.108,se:.042,n:10215}];
 // Seed base chosen among 400 candidates so that no sample estimate strays beyond 1.6 SE of its expectation at any
 // window width; otherwise pure noise at one width could read as bias. Variance factor of a boundary intercept from k equally spaced bins on one side: 1/k + xbar^2/Sxx.
 const vf=k=>1/k+3*k/(k*k-1);
 TH.forEach((t,i)=>{
  t.sb=t.se/Math.sqrt(2*vf(10));
  const r=LI.rng(20190596+i);
  t.z=Array.from({length:NB},()=>LI.normal(r));
 });
 const xc=j=>-HALF+(j+.5)*W;
 const shown=R=>Math.min(5,Math.floor(R*2+.5+1e-9)/2);
 const nearest=R=>TH[Math.max(0,Math.min(3,Math.round((R-3.25)/.5)))];
 const sgn=(v,d)=>(v>0?'+':'')+fmt(v,d);

 function side(js,y){
  const k=js.length;let mx=0,my=0;
  for(const j of js){mx+=xc(j);my+=y[j]}mx/=k;my/=k;
  let sxx=0,sxy=0;
  for(const j of js){const dx=xc(j)-mx;sxx+=dx*dx;sxy+=dx*(y[j]-my)}
  const b=sxy/sxx;return {a:my-b*mx,b,mean:my};
 }
 function sample(t,s){return Array.from({length:NB},(_,j)=>s.beta*xc(j)+(j>=NB/2?s.tau:0)+t.sb*t.z[j])}
 function estimate(t,y,k){
  const L=side(Array.from({length:k},(_,i)=>NB/2-k+i),y),R=side(Array.from({length:k},(_,i)=>NB/2+i),y);
  return {L,R,rd:R.a-L.a,naive:R.mean-L.mean,seRD:t.sb*Math.sqrt(2*vf(k)),seN:t.sb*Math.sqrt(2/k)};
 }

 const st=LI.stage(root,{width:640,height:604,narrowWidth:360,narrowHeight:830,label:'실제 평균평점과 표시 별점의 계단 관계, 반올림 문턱 주변 호텔-월의 로그광고비 모의자료와 두 추정량, 창 폭별 점프 추정치'});
 LI.legend(root,[['표시가 낮은 쪽 (문턱 아래)',C.rust],['표시가 높은 쪽 (문턱 위)',C.blue],['창 밖 호텔-월',C.gray],['창 안 평균 비교',C.muted,true],['참 평균과 참 점프 (가상)',C.ink,true],['양쪽 직선 RD의 95% 범위',C.pale],['새 리뷰 1개로 가능한 평균',C.ink]]);
 const show=LI.readout(root);
 const noteA=LI.note(root,''),noteB=LI.note(root,'');
 const ctl=LI.controls(root,[
  {key:'R',label:'호텔의 실제 평균평점',min:3,max:5,step:.01,value:3.74,format:v=>fmt(v,2)},
  {key:'n',label:'그 호텔의 리뷰 수 (보조)',min:5,max:300,step:1,value:20,format:v=>fmt(v,0)+'개'},
  {key:'h',label:'RD 창의 폭 h (문턱 ± h)',min:.01,max:.25,step:.005,value:.05,format:v=>fmt(v,3)},
  {key:'tau',label:'표시 반 별 상승의 점프 τ (가상)',min:-.3,max:.3,step:.005,value:-.07,format:v=>fmt(v,3)},
  {key:'beta',label:'실행변수 추세 (평점 1점당 로그광고비)',min:-3,max:3,step:.005,value:1.035,format:v=>fmt(v,3)}],draw);

 const HS=Array.from({length:49},(_,i)=>2+i);
 const halo={'paint-order':'stroke',stroke:'var(--bg)','stroke-width':4,'stroke-linejoin':'round'};

 function draw(s){
  st.layout();
  const n=st.narrow,fs=n?14:13,svg=st.svg,E=LI.el;
  const A=n?{x0:52,x1:344,y0:48,y1:228}:{x0:52,x1:292,y0:48,y1:232};
  const B=n?{x0:52,x1:344,y0:334,y1:524,t:302}:{x0:52,x1:628,y0:336,y1:546,t:306};
  const P=n?{x0:52,x1:344,y0:630,y1:780,t:598}:{x0:380,x1:628,y0:48,y1:232,t:18};
  const t=nearest(s.R),c=t.c;
  const k=Math.round(s.h/W),y=sample(t,s),F=estimate(t,y,k);
  const d=shown(s.R),X=s.R-c,above=X>=-1e-9;
  const up=(s.R*s.n+5)/(s.n+1),dn=(s.R*s.n+1)/(s.n+1),dUp=shown(up),dDn=shown(dn);
  const defs=E('defs',{},svg);
  const clip=(G,id)=>{E('rect',{x:G.x0,y:G.y0,width:G.x1-G.x0,height:G.y1-G.y0},E('clipPath',{id},defs));return `url(#${id})`};
  const cA=clip(A,st.id('a')),cB=clip(B,st.id('b')),cP=clip(P,st.id('c'));

  // Panel A: the display rule.
  const ax=LI.scale([3,5],[A.x0,A.x1]),ay=LI.scale([2.75,5.1],[A.y1,A.y0]);
  E('text',{x:12,y:18,'font-size':fs,fill:C.ink,'font-weight':600,text:'표시 별점은 0.5 단위 계단'},svg);
  E('rect',{x:ax(Math.max(3,c-s.h)),y:A.y0,width:ax(Math.min(5,c+s.h))-ax(Math.max(3,c-s.h)),height:A.y1-A.y0,fill:C.pale},svg);
  for(const q of TH)E('line',{x1:ax(q.c),x2:ax(q.c),y1:A.y0,y2:A.y1,stroke:q.c===c?C.muted:C.line,'stroke-dasharray':'3 4'},svg);
  LI.axis(svg,ax,{side:'bottom',at:A.y1,ticks:TH.map(q=>q.c),format:v=>fmt(v,2),label:'실제 평균평점 (눈금은 반올림 문턱)',size:fs});
  LI.axis(svg,ay,{side:'left',at:A.x0,ticks:[3,3.5,4,4.5,5],format:v=>fmt(v,1),label:'표시 별점',size:fs});
  const gA=E('g',{'clip-path':cA},svg);
  E('line',{x1:ax(3),y1:ay(3),x2:ax(5),y2:ay(5),stroke:C.muted,'stroke-width':1.5,'stroke-dasharray':'5 5'},gA);
  const steps=[[3,3,3.25],[3.5,3.25,3.75],[4,3.75,4.25],[4.5,4.25,4.75],[5,4.75,5]];
  for(const [lv,a,b] of steps){
   E('line',{x1:ax(a),x2:ax(b),y1:ay(lv),y2:ay(lv),stroke:C.ink,'stroke-width':2.5},gA);
   if(a>3)E('circle',{cx:ax(a),cy:ay(lv),r:3.5,fill:C.ink},gA);
   if(b<5)E('circle',{cx:ax(b),cy:ay(lv),r:3.5,fill:'var(--bg)',stroke:C.ink,'stroke-width':1.5},gA);
  }
  // One extra review: the band of averages it can produce.
  const by=A.y1-9;
  E('line',{x1:ax(dn),x2:ax(up),y1:by,y2:by,stroke:C.ink,'stroke-width':3},gA);
  for(const v of [dn,up])E('line',{x1:ax(v),x2:ax(v),y1:by-5,y2:by+5,stroke:C.ink,'stroke-width':2},gA);
  const hc=above?C.blue:C.rust;
  E('line',{x1:ax(s.R),x2:ax(s.R),y1:ay(s.R),y2:ay(d),stroke:hc,'stroke-width':1.5,'stroke-dasharray':'2 3'},gA);
  E('circle',{cx:ax(s.R),cy:ay(d),r:6,fill:hc,stroke:'var(--bg)','stroke-width':1.5},gA);
  const right=s.R<4.2;
  E('text',{x:ax(s.R)+(right?9:-9),y:ay(d)-10,'text-anchor':right?'start':'end','font-size':fs,'font-weight':600,fill:hc,text:`실제 ${fmt(s.R,2)}, 표시 ${fmt(d,1)}`,...halo},gA);

  // Panel B: hotel-month bin means around c, the window, the two fitted lines and the two window means.
  const bx=LI.scale([-HALF,HALF],[B.x0,B.x1]),byS=LI.scale([-.7,.7],[B.y1,B.y0]);
  E('text',{x:12,y:B.t,'font-size':fs,fill:C.ink,'font-weight':600,text:n?`문턱 ${fmt(c,2)} 주변 모의자료 (구간 평균)`:`문턱 ${fmt(c,2)} 주변 모의 호텔-월 (0.005 구간 평균)`},svg);
  E('rect',{x:bx(-s.h),y:B.y0,width:bx(s.h)-bx(-s.h),height:B.y1-B.y0,fill:C.pale},svg);
  LI.axis(svg,bx,{side:'bottom',at:B.y1,ticks:[-.2,-.1,0,.1,.2],format:v=>fmt(c+v,2),label:`평균평점 (왼쪽 표시 ${fmt(c-.25,1)}, 오른쪽 표시 ${fmt(c+.25,1)})`,size:fs});
  LI.axis(svg,byS,{side:'left',at:B.x0,ticks:[-.6,-.3,0,.3,.6],format:v=>fmt(v,1),label:'이후 6개월 로그광고비 (문턱 왼쪽 = 0)',size:fs});
  E('line',{x1:bx(0),x2:bx(0),y1:B.y0,y2:B.y1,stroke:C.muted,'stroke-dasharray':'3 4'},svg);
  const gB=E('g',{'clip-path':cB},svg);
  const dots={o:'',l:'',r:''};
  y.forEach((v,j)=>{const key=j<NB/2-k||j>=NB/2+k?'o':j<NB/2?'l':'r';dots[key]+=`M${bx(xc(j)).toFixed(1)} ${byS(v).toFixed(1)}h0`});
  const dot=(p,col,op)=>E('path',{d:p,stroke:col,'stroke-width':6,'stroke-linecap':'round',opacity:op,fill:'none'},gB);
  dot(dots.o,C.gray,.45);dot(dots.l,C.rust,.75);dot(dots.r,C.blue,.75);
  LI.polyline(gB,[[bx(-HALF),byS(-s.beta*HALF)],[bx(0),byS(0)]],{stroke:C.ink,'stroke-width':1.6,'stroke-dasharray':'6 5'});
  LI.polyline(gB,[[bx(0),byS(s.tau)],[bx(HALF),byS(s.tau+s.beta*HALF)]],{stroke:C.ink,'stroke-width':1.6,'stroke-dasharray':'6 5'});
  E('line',{x1:bx(-s.h),x2:bx(0),y1:byS(F.L.mean),y2:byS(F.L.mean),stroke:C.rust,'stroke-width':2,'stroke-dasharray':'4 4'},gB);
  E('line',{x1:bx(0),x2:bx(s.h),y1:byS(F.R.mean),y2:byS(F.R.mean),stroke:C.blue,'stroke-width':2,'stroke-dasharray':'4 4'},gB);
  E('line',{x1:bx(-s.h),x2:bx(0),y1:byS(F.L.a-F.L.b*s.h),y2:byS(F.L.a),stroke:C.rust,'stroke-width':3},gB);
  E('line',{x1:bx(0),x2:bx(s.h),y1:byS(F.R.a),y2:byS(F.R.a+F.R.b*s.h),stroke:C.blue,'stroke-width':3},gB);
  const yl=byS(F.L.a),yr=byS(F.R.a);
  E('line',{x1:bx(0),x2:bx(0),y1:yl,y2:yr,stroke:C.accent,'stroke-width':3},gB);
  for(const v of [yl,yr])E('line',{x1:bx(0)-6,x2:bx(0)+6,y1:v,y2:v,stroke:C.accent,'stroke-width':2.5},gB);
  const low=Math.max(yl,yr);
  E('text',{x:bx(0)+10,y:Math.min(B.y1-8,low+22),'font-size':fs,'font-weight':600,fill:C.accent,text:`RD ${fmt(F.rd,3)}`,...halo},gB);
  // Where the chosen hotel sits on this axis.
  const hx=bx(X),tx=Math.max(B.x0+28,Math.min(B.x1-28,hx));
  E('path',{d:`M${hx-6} ${B.y0+20}h12l-6 9z`,fill:hc},gB);
  E('text',{x:tx,y:B.y0+15,'text-anchor':'middle','font-size':fs,fill:hc,'font-weight':600,text:'이 호텔',...halo},gB);

  // Panel C: estimates across window widths for this sample.
  const px=LI.scale([0,HALF],[P.x0,P.x1]),py=LI.scale([-.5,.5],[P.y1,P.y0]);
  E('text',{x:n?12:P.x0-40,y:P.t,'font-size':fs,fill:C.ink,'font-weight':600,text:'창 폭 h별 점프 추정치'},svg);
  LI.axis(svg,px,{side:'bottom',at:P.y1,ticks:[0,.05,.1,.15,.2,.25],format:v=>fmt(v,2),label:'창 폭 h',size:fs});
  LI.axis(svg,py,{side:'left',at:P.x0,ticks:[-.4,-.2,0,.2,.4],format:v=>fmt(v,1),size:fs});
  const gP=E('g',{'clip-path':cP},svg);
  const path=HS.map(kk=>[kk*W,estimate(t,y,kk)]);
  const upB=path.map(([h,G])=>[px(h),py(s.tau+1.96*G.seRD)]),dnB=path.map(([h,G])=>[px(h),py(s.tau-1.96*G.seRD)]).reverse();
  E('polygon',{points:[...upB,...dnB].map(p=>p.join(',')).join(' '),fill:C.pale,stroke:C.blue,'stroke-opacity':.35},gP);
  E('line',{x1:P.x0,x2:P.x1,y1:py(0),y2:py(0),stroke:C.line},gP);
  E('line',{x1:P.x0,x2:P.x1,y1:py(s.tau),y2:py(s.tau),stroke:C.ink,'stroke-width':1.6,'stroke-dasharray':'6 5'},gP);
  LI.polyline(gP,path.map(([h,G])=>[px(h),py(G.naive)]),{stroke:C.muted,'stroke-width':2.2,'stroke-dasharray':'5 4'});
  LI.polyline(gP,path.map(([h,G])=>[px(h),py(G.rd)]),{stroke:C.blue,'stroke-width':2.5});
  E('line',{x1:px(.05),x2:px(.05),y1:P.y0,y2:P.y1,stroke:C.line,'stroke-dasharray':'2 3'},gP);
  E('text',{x:px(.05)+4,y:P.y0+14,'font-size':fs,fill:C.muted,text:'원문 0.05',...halo},gP);
  E('line',{x1:px(s.h),x2:px(s.h),y1:P.y0,y2:P.y1,stroke:C.accent,'stroke-width':1.5},gP);
  E('circle',{cx:px(s.h),cy:py(F.naive),r:4.5,fill:'var(--bg)',stroke:C.muted,'stroke-width':2},gP);
  E('circle',{cx:px(s.h),cy:py(F.rd),r:5,fill:C.accent,stroke:'var(--bg)','stroke-width':1.5},gP);
  E('text',{x:P.x1-4,y:P.y1-8,'text-anchor':'end','font-size':fs,fill:C.muted,text:'실선 RD, 점선 평균 비교',...halo},gP);

  // Readout.
  const N=Math.round(t.n*20*s.h),lo=F.rd-1.96*F.seRD,hi=F.rd+1.96*F.seRD,trendPart=s.beta*s.h;
  const move=dUp>d?`5점 리뷰 하나면 표시 ${fmt(dUp,1)}`:dDn<d?`1점 리뷰 하나면 표시 ${fmt(dDn,1)}`:'리뷰 하나로는 표시가 바뀌지 않음';
  show([
   ['이 호텔의 표시 별점',fmt(d,1),`실제 ${fmt(s.R,2)}, 문턱 ${fmt(c,2)}까지 거리 ${sgn(X,2)}`],
   ['새 리뷰 1개 뒤 평균',`${fmt(dn,3)} ~ ${fmt(up,3)}`,move],
   ['창 안 평균 비교 (위 − 아래)',fmt(F.naive,3),`기댓값 ${fmt(s.tau+trendPart,3)} = 점프 ${fmt(s.tau,3)} + 추세 몫 ${sgn(trendPart,3)}`],
   ['양쪽 직선 RD 추정치 (원문 식 (1))',fmt(F.rd,3),`표준오차 ${fmt(F.seRD,3)}, 95% 구간 ${fmt(lo,3)} ~ ${fmt(hi,3)}`,true],
   ['창 안 호텔-월 수 (모의)',fmt(N,0),`원문 Table 4 문턱 ${fmt(c,2)}: ${fmt(t.b,3)} (${fmt(t.se,3)}), 관측 ${fmt(t.n,0)}`]]);

  // Notes: the review band, then the estimator comparison.
  const crossUp=dUp>d,crossDn=dDn<d;
  noteA.textContent=`리뷰 ${fmt(s.n,0)}개인 호텔에 리뷰 하나가 더해지면 평균은 최대 ${fmt((5-s.R)/(s.n+1),3)} 오르거나 ${fmt((s.R-1)/(s.n+1),3)} 내립니다. `+
   (crossUp&&crossDn?'이 호텔은 리뷰 하나에 따라 표시가 위로도 아래로도 바뀔 수 있습니다. '
   :crossUp?`5점 리뷰 하나만으로 표시가 한 단계(${fmt(d,1)}에서 ${fmt(dUp,1)}) 오릅니다. `
   :crossDn?`1점 리뷰 하나만으로 표시가 한 단계(${fmt(d,1)}에서 ${fmt(dDn,1)}) 내려갑니다. `
   :'어떤 리뷰 하나로도 표시가 바뀌지 않습니다. ')+
   '문턱 근처에서 어느 쪽에 놓이는지가 리뷰 표본의 우연에 달려 있다는 점이 양쪽 비교의 근거이며(4장), 원문은 평균이 지나치게 요동하는 관측을 줄이려고 리뷰 20개 이상인 호텔만 사용했습니다.';
  const flip=Math.abs(s.tau)>=.005&&Math.sign(s.tau+trendPart)!==Math.sign(s.tau)&&Math.abs(s.tau+trendPart)>=.005;
  const se05=t.sb*Math.sqrt(2*vf(10));
  noteB.textContent=flip
   ?`창 안 평균만 비교하면 기댓값이 참 점프와 부호가 반대입니다(기댓값 ${fmt(s.tau+trendPart,3)}, 참 점프 ${fmt(s.tau,3)}). 추세와 창 폭을 곱한 몫(${fmt(s.beta,3)} × ${fmt(s.h,3)} = ${sgn(trendPart,3)})이 점프에 섞였기 때문입니다. 원문 식 (1)처럼 문턱 양쪽에 기울기를 따로 두면 직선 추세는 빠지고 기댓값이 참 점프와 같아집니다.`
   :k<=3?`창이 좁아 호텔-월이 약 ${fmt(N,0)}개만 남았고, 양쪽 직선 RD의 표준오차는 ${fmt(F.seRD,3)}입니다. 원문 대역폭 0.05에서는 ${fmt(se05,3)}입니다. 추세 몫(${sgn(trendPart,3)})은 작아졌지만 추정치가 표본에 따라 크게 흔들립니다.`
   :Math.abs(trendPart)>=Math.max(.01,1.96*F.seN)?`창 안 평균 비교에는 추세 몫(${sgn(trendPart,3)})이 섞여 기댓값이 참 점프와 다릅니다(${fmt(s.tau+trendPart,3)} 대 ${fmt(s.tau,3)}). 양쪽 직선 RD는 기댓값이 참 점프와 같지만 표준오차가 평균 비교보다 큽니다(${fmt(F.seRD,3)} 대 ${fmt(F.seN,3)}). 기울기를 추정하는 대가입니다.`
   :Math.abs(s.beta)<.05?`추세가 거의 없으면 두 추정량의 기댓값이 모두 참 점프와 같고, 표준오차는 평균 비교 쪽이 작습니다(${fmt(F.seN,3)} 대 ${fmt(F.seRD,3)}). 이때 기울기를 두는 비용은 정밀도뿐입니다.`
   :`이 창 폭에서는 추세 몫(${sgn(trendPart,3)})이 평균 비교의 표준오차(${fmt(F.seN,3)})에 묻힐 만큼 작습니다. 창을 넓히면서 창 폭별 그림의 점선이 참 점프에서 멀어지는지 확인하십시오. 실제 관계가 휘어 있으면 넓은 창에서는 양쪽 직선에도 근사 오차가 섞입니다(7.1절).`;
 }
 draw(ctl.state);
 st.onResize(()=>draw(ctl.state));
});
