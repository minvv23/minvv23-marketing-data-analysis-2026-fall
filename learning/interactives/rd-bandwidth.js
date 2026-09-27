// Sharp RD with a fixed simulated sample: bandwidth, polynomial order and the curve-mistaken-for-a-jump problem.
// Data follow the summary's teaching example: X ~ U(0,1), cutoff 0.5, noise sd 0.1, N = 1,000,
// f(x) = 0.2x + A / (1 + exp(-(x - 0.5) / 0.04)). With A = 0.8 and no jump this is Figure 6.1.1 C's situation.
LI.register('rd-bandwidth',root=>{
 const {C}=LI;
 const fmt=(v,d)=>LI.fmt(Math.abs(v)<.5*10**-d?0:v,d);
 const N=1000,CUT=.5,SIG=.1,SCALE=.04;
 // One seeded draw: score positions first, then the noise. Sliders only change the mean, never the draws.
 const rand=LI.rng(55);
 const xs=Array.from({length:N},()=>rand());
 const es=Array.from({length:N},()=>SIG*LI.normal(rand));
 const f0=(x,A)=>.2*x+A/(1+Math.exp(-(x-CUT)/SCALE));
 const mean=(x,s)=>f0(x,s.A)+(x>=CUT?s.tau:0);

 // Solve a small symmetric system with Gaussian elimination and partial pivoting. Returns null if singular.
 function solve(M,b){
  const k=b.length,a=M.map((r,i)=>[...r,b[i]]);
  for(let c=0;c<k;c++){
   let p=c;for(let r=c+1;r<k;r++)if(Math.abs(a[r][c])>Math.abs(a[p][c]))p=r;
   if(Math.abs(a[p][c])<1e-10)return null;
   [a[c],a[p]]=[a[p],a[c]];
   for(let r=0;r<k;r++){if(r===c)continue;const m=a[r][c]/a[c][c];if(m)for(let j=c;j<=k;j++)a[r][j]-=m*a[c][j]}
  }
  return a.map((r,i)=>r[k]/r[i]);
 }
 // Regressors for one observation. Powers use R/h so the system stays well conditioned; the D coefficient is unchanged.
 function row(x,h,p,sep){
  const u=(x-CUT)/h,d=x>=CUT?1:0,r=[1,d];
  for(let j=1;j<=p;j++)r.push(u**j);
  if(sep)for(let j=1;j<=p;j++)r.push(d*u**j);
  return r;
 }
 // The jump estimate is linear in y: tau_hat = sum w_i y_i. Returns the weights (and full coefficients for drawing).
 function fit(h,p,sep,s){
  const idx=[];let nl=0,nr=0;
  for(let i=0;i<N;i++){const r=xs[i]-CUT;if(r>=-h&&r<h){idx.push(i);r<0?nl++:nr++}}
  const need=sep?p+1:1;
  if(nl<need||nr<need||idx.length<(sep?2*p+2:p+2)+3)return {ok:false,nl,nr};
  const rows=idx.map(i=>row(xs[i],h,p,sep)),k=rows[0].length;
  const M=Array.from({length:k},()=>Array(k).fill(0));
  for(const r of rows)for(let a=0;a<k;a++)for(let b=a;b<k;b++)M[a][b]+=r[a]*r[b];
  for(let a=0;a<k;a++)for(let b=0;b<a;b++)M[a][b]=M[b][a];
  const e=Array(k).fill(0);e[1]=1;
  const v=solve(M,e);if(!v)return {ok:false,nl,nr};
  const w=rows.map(r=>r.reduce((t,rv,j)=>t+rv*v[j],0));
  let est=0,expect=0,ss=0;
  idx.forEach((i,j)=>{const m=mean(xs[i],s);est+=w[j]*(m+es[i]);expect+=w[j]*m;ss+=w[j]*w[j]});
  return {ok:true,nl,nr,idx,rows,M,est,expect,sd:SIG*Math.sqrt(ss)};
 }
 // Full coefficient vector for the current sample (only needed for the drawn curves).
 function coefs(F,s){
  const k=F.rows[0].length,b=Array(k).fill(0);
  F.rows.forEach((r,j)=>{const i=F.idx[j],y=mean(xs[i],s)+es[i];for(let a=0;a<k;a++)b[a]+=r[a]*y});
  return solve(F.M,b);
 }

 const st=LI.stage(root,{width:640,height:350,narrowWidth:360,narrowHeight:640,label:'실행변수와 결과의 산점도에 기준점 좌우 적합선을 그린 그림과 대역폭별 점프 추정치의 분포'});
 LI.legend(root,[['참 평균 E[Y|X]',C.ink,true],['기준점 왼쪽 적합선',C.rust],['기준점 오른쪽 적합선',C.blue],['창 밖 관측치',C.gray],['반복 표본 추정치의 95% 범위',C.pale]]);
 const show=LI.readout(root);
 const warn=LI.note(root,'');
 const ctl=LI.controls(root,[
  {key:'tau',label:'참 점프 τ',min:0,max:.3,step:.01,value:0},
  {key:'A',label:'S자 굴곡의 높이 (연속, 점프 아님)',min:0,max:.8,step:.05,value:.8},
  {key:'h',label:'대역폭 h (기준점 ± h만 사용)',min:.03,max:.5,step:.01,value:.5},
  {key:'p',label:'다항식 차수 p',min:1,max:4,step:1,value:1},
  {key:'sep',label:'양쪽 곡선의 기울기, 모양을 따로 추정 (식 6.1.6)',type:'toggle',value:true}],draw);

 const HS=Array.from({length:48},(_,i)=>+(0.03+i*.01).toFixed(2));
 const halo={'paint-order':'stroke',stroke:'var(--bg)','stroke-width':4,'stroke-linejoin':'round'};

 function draw(s){
  st.layout();
  const n=st.narrow,fs=n?14:13,svg=st.svg;
  // Panel geometry: side by side on wide columns, stacked on narrow ones.
  const A={x0:48,x1:n?344:392,y0:50,y1:n?300:292};
  const B={x0:n?48:462,x1:n?344:628,y0:n?400:50,y1:n?574:292};
  const sx=LI.scale([0,1],[A.x0,A.x1]),sy=LI.scale([-.3,1.5],[A.y1,A.y0]);
  const F=fit(s.h,s.p,s.sep,s);

  // Panel A: scatter, window, true mean and the two fitted curves.
  const clipA=st.id('a');
  const defs=LI.el('defs',{},svg);
  LI.el('rect',{x:A.x0,y:A.y0,width:A.x1-A.x0,height:A.y1-A.y0},LI.el('clipPath',{id:clipA},defs));
  const clipB=st.id('b');
  LI.el('rect',{x:B.x0,y:B.y0,width:B.x1-B.x0,height:B.y1-B.y0},LI.el('clipPath',{id:clipB},defs));
  LI.el('text',{x:A.x0-40,y:18,'font-size':fs,fill:C.ink,'font-weight':600,text:'이 표본(관측치 1,000개)과 적합선'},svg);
  LI.el('rect',{x:sx(Math.max(0,CUT-s.h)),y:A.y0,width:sx(Math.min(1,CUT+s.h))-sx(Math.max(0,CUT-s.h)),height:A.y1-A.y0,fill:C.pale},svg);
  LI.axis(svg,sx,{side:'bottom',at:A.y1,ticks:[0,.25,.5,.75,1],format:v=>fmt(v,2),label:'점수 X (기준점 0.5)',size:fs});
  LI.axis(svg,sy,{side:'left',at:A.x0,ticks:[0,.5,1,1.5],format:v=>fmt(v,1),label:'결과 Y',size:fs});
  LI.el('line',{x1:sx(CUT),x2:sx(CUT),y1:A.y0,y2:A.y1,stroke:C.muted,'stroke-dasharray':'3 4'},svg);
  const gA=LI.el('g',{'clip-path':`url(#${clipA})`},svg);
  const dots={out:'',l:'',r:''};
  for(let i=0;i<N;i++){const r=xs[i]-CUT,key=(r>=-s.h&&r<s.h)?(r<0?'l':'r'):'out';dots[key]+=`M${sx(xs[i]).toFixed(1)} ${sy(mean(xs[i],s)+es[i]).toFixed(1)}h0`}
  const dot=(d,color,op)=>LI.el('path',{d,stroke:color,'stroke-width':n?4:3.6,'stroke-linecap':'round',opacity:op,fill:'none'},gA);
  dot(dots.out,C.gray,.35);dot(dots.l,C.rust,.4);dot(dots.r,C.blue,.4);
  const grid=(a,b)=>Array.from({length:81},(_,i)=>a+(b-a)*i/80);
  LI.polyline(gA,grid(0,CUT-1e-9).map(x=>[sx(x),sy(mean(x,s))]),{stroke:C.ink,'stroke-dasharray':'6 5','stroke-width':2});
  LI.polyline(gA,grid(CUT,1).map(x=>[sx(x),sy(mean(x,s))]),{stroke:C.ink,'stroke-dasharray':'6 5','stroke-width':2});
  if(F.ok){
   const b=coefs(F,s);
   const pred=x=>row(x,s.h,s.p,s.sep).reduce((t,v,j)=>t+v*b[j],0);
   const lo=Math.max(0,CUT-s.h),hi=Math.min(1,CUT+s.h);
   LI.polyline(gA,grid(lo,CUT-1e-9).map(x=>[sx(x),sy(pred(x))]),{stroke:C.rust,'stroke-width':3.2});
   LI.polyline(gA,grid(CUT,hi).map(x=>[sx(x),sy(pred(x))]),{stroke:C.blue,'stroke-width':3.2});
   // Bracket at the cutoff: the vertical gap between the two fitted curves is the estimate.
   const yl=sy(pred(CUT-1e-9)),yr=sy(pred(CUT));
   LI.el('line',{x1:sx(CUT),x2:sx(CUT),y1:yl,y2:yr,stroke:C.accent,'stroke-width':3},gA);
   for(const y of [yl,yr])LI.el('line',{x1:sx(CUT)-6,x2:sx(CUT)+6,y1:y,y2:y,stroke:C.accent,'stroke-width':2.5},gA);
   const ty=Math.max(A.y0+16,Math.min(A.y1-8,(yl+yr)/2+5));
   LI.el('text',{x:sx(CUT)+10,y:ty,'font-size':fs,'font-weight':600,fill:C.accent,text:`추정 점프 ${fmt(F.est,3)}`,...halo},gA);
  }

  // Panel B: expected estimate and 95% range across bandwidths for the current order and toggle.
  const bx=LI.scale([0,.5],[B.x0,B.x1]),by=LI.scale([-.4,1],[B.y1,B.y0]);
  LI.el('text',{x:B.x0-(n?40:30),y:n?B.y0-22:18,'font-size':fs,fill:C.ink,'font-weight':600,text:'대역폭별 점프 추정치'},svg);
  LI.axis(svg,bx,{side:'bottom',at:B.y1,ticks:[.1,.2,.3,.4,.5],format:v=>fmt(v,1),label:'대역폭 h',size:fs});
  LI.axis(svg,by,{side:'left',at:B.x0,ticks:[-.4,0,.5,1],format:v=>fmt(v,1),size:fs});
  const gB=LI.el('g',{'clip-path':`url(#${clipB})`},svg);
  const path=HS.map(h=>[h,fit(h,s.p,s.sep,s)]).filter(([,G])=>G.ok);
  if(path.length){
   const up=path.map(([h,G])=>[bx(h),by(G.expect+1.96*G.sd)]),dn=path.map(([h,G])=>[bx(h),by(G.expect-1.96*G.sd)]).reverse();
   LI.el('polygon',{points:[...up,...dn].map(p=>p.join(',')).join(' '),fill:C.pale,stroke:C.blue,'stroke-opacity':.35},gB);
   LI.polyline(gB,path.map(([h,G])=>[bx(h),by(G.expect)]),{stroke:C.blue,'stroke-width':2.5});
   LI.polyline(gB,path.map(([h,G])=>[bx(h),by(G.est)]),{stroke:C.muted,'stroke-width':1.3});
  }
  LI.el('line',{x1:B.x0,x2:B.x1,y1:by(s.tau),y2:by(s.tau),stroke:C.ink,'stroke-dasharray':'6 5','stroke-width':1.6},gB);
  LI.el('text',{x:B.x1-2,y:by(s.tau)+(s.tau>.8?16:-6),'text-anchor':'end','font-size':fs,fill:C.ink,text:`참 점프 ${fmt(s.tau,2)}`,...halo},gB);
  LI.el('line',{x1:bx(s.h),x2:bx(s.h),y1:B.y0,y2:B.y1,stroke:C.accent,'stroke-width':1.5},gB);
  if(F.ok)LI.el('circle',{cx:bx(s.h),cy:by(F.est),r:5,fill:C.accent,stroke:'var(--bg)','stroke-width':1.5},gB);
  const capY=B.y1+(n?40:40);
  LI.el('text',{x:B.x0-(n?40:30),y:capY+(n?16:14),'font-size':fs-1,fill:C.muted,text:'굵은 선은 기댓값, 가는 선은 이 표본'},svg);

  // Readout and a note that changes with the regime.
  const bias=F.ok?F.expect-s.tau:NaN;
  show([
   ['이 표본의 점프 추정치',F.ok?fmt(F.est,3):'추정 불가','기준점에서 두 적합선의 세로 간격',true],
   ['참 점프 τ',fmt(s.tau,2),'S자 굴곡은 연속이므로 점프에 들어가지 않음'],
   ['편의 (추정치 기댓값 − 참값)',F.ok?fmt(bias,3):'추정 불가','잡음을 새로 뽑아 반복할 때의 평균 오차'],
   ['추정치의 표준편차',F.ok?fmt(F.sd,3):'추정 불가',`사용 관측치 왼쪽 ${F.nl}개, 오른쪽 ${F.nr}개`]]);
  const k=s.sep?2*s.p+2:s.p+2;
  warn.textContent=!F.ok?`창 안의 관측치(왼쪽 ${F.nl}개, 오른쪽 ${F.nr}개)가 계수 ${k}개를 추정하기에 부족합니다. 대역폭을 넓히거나 차수를 낮추십시오.`
   :Math.abs(bias)>=.03&&Math.abs(bias)>2*F.sd?(s.tau===0
     ?`참 점프가 0인데 추정치의 기댓값이 ${fmt(F.expect,3)}입니다. 창 안의 S자 곡률을 ${s.p}차식이 따라가지 못해, 연속인 곡선이 기준점에서 점프처럼 보입니다. 차수를 올리거나 창을 좁혀 추정치가 0 근처로 내려오는지 확인하십시오.`
     :`추정치의 기댓값 ${fmt(F.expect,3)}은 참 점프 ${fmt(s.tau,2)}에 곡률 때문에 생긴 편의 ${fmt(bias,3)}이 더해진 값입니다. 점프가 실제로 있어도 함수형태가 틀리면 크기를 잘못 잽니다.`)
   :F.sd>=.05?`편의는 작지만 표준편차가 ${fmt(F.sd,3)}로 큽니다. 창이 좁거나 차수가 높아 적은 관측치로 많은 계수를 추정하기 때문입니다. 대역폭별 추정치 그림에서 대역폭을 줄일수록 95% 범위가 벌어지는 모습을 확인하십시오.`
   :s.A===0&&s.h<.2?'참 함수가 직선이면 넓은 창에서도 편의가 생기지 않습니다. 이 경우 창을 좁히면 정밀도만 잃습니다.'
   :'편의와 표준편차가 모두 작은 조합입니다. 대역폭별 추정치 그림에서 추정치가 대역폭과 차수를 바꿔도 비슷하게 유지되는지 보는 것이 원문이 권하는 강건성 점검입니다.';
 }
 draw(ctl.state);
 st.onResize(()=>draw(ctl.state));
});
