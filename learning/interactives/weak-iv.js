// Weak and many instruments: the sampling distribution of 2SLS drifts from the true return to schooling
// toward the OLS probability limit as the first stage weakens or irrelevant instruments are added.
// Same hypothetical design as the Monte Carlo table in the MHE 4.1 summary (w04-mhe41/s3_weak.py):
//   s = 12 + pi*z1 + 0.8*A + e,   y = 1 + 0.08*s + kappa*A + 0.3*u,   z1..zK ~ N(0,1), only z1 relevant.
// Instead of regressing on n rows each replication, we draw the exact finite-sample sufficient statistics:
// projected onto the K-dimensional instrument space the errors are K i.i.d. normal pairs, the signal is
// pi*||z1|| along one axis, and the orthogonal complement contributes a 2x2 Wishart(n-1-K) block (Bartlett).
// This reproduces the brute-force distribution (checked in Python) at O(K) cost per replication.
LI.register('weak-iv',root=>{
 const {C,fmt}=LI;
 const RHO=0.08,LAM=0.8,SIG_U=0.3,REPS=1000,SEED=20260923;
 const NS=[250,500,1000,2000,4000,8000];
 const X0=-0.05,X1=0.25,BW=0.005,NB=Math.round((X1-X0)/BW);

 const st=LI.stage(root,{width:640,height:318,narrowWidth:360,narrowHeight:352,label:'OLS와 2SLS 추정치 1,000개의 분포와 참값, OLS 확률극한'});
 LI.legend(root,[['OLS 추정치 분포',C.rust],['2SLS 추정치 분포',C.blue],['5-95 백분위 구간',C.pale],['참값 0.08',C.ink],['OLS 확률극한',C.rust,true]]);
 const show=LI.readout(root);
 const msg=LI.note(root,'');
 const ctl=LI.controls(root,[
  {key:'pi',label:'관련 도구의 1단계 계수',min:0,max:0.5,step:0.01,value:0.5,format:v=>fmt(v,2)},
  {key:'extra',label:'교육과 무관한 추가 도구 수',min:0,max:29,step:1,value:0,format:v=>`${v}개 (도구 총 ${v+1}개)`},
  {key:'kappa',label:'능력이 로그임금에 주는 효과 (내생성 강도)',min:-0.1,max:0.2,step:0.01,value:0.1,format:v=>fmt(v,2)},
  {key:'nIdx',label:'표본 크기',min:0,max:NS.length-1,step:1,value:2,format:v=>NS[v].toLocaleString('ko-KR')+'명'}],update);

 // Marsaglia-Tsang gamma draw (shape >= 1); chi-square(k) = 2 * Gamma(k/2).
 function chisq(rand,k){
  const d=k/2-1/3,c=1/Math.sqrt(9*d);
  for(;;){const x=LI.normal(rand),v0=1+c*x;if(v0<=0)continue;const v=v0*v0*v0,u=rand();
   if(u<1-0.0331*x*x*x*x||Math.log(u)<0.5*x*x+d*(1-v+Math.log(v)))return 2*d*v}
 }
 const cache=new Map();
 function simulate(pi,extra,kappa,n){
  const key=[pi,extra,kappa,n].join('|');if(cache.has(key))return cache.get(key);
  const K=1+extra,df=n-1-K;
  // Covariance of the first-stage error v = 0.8A + e and the structural error eta = kappa*A + 0.3u.
  const a=LAM*LAM+1,b=kappa*kappa+SIG_U*SIG_U,c=LAM*kappa;
  const L11=Math.sqrt(a),L21=c/L11,L22=Math.sqrt(Math.max(b-L21*L21,0));
  const tsls=new Float64Array(REPS),ols=new Float64Array(REPS),F=new Float64Array(REPS);
  for(let r=0;r<REPS;r++){
   // Separate streams per replication keep common random numbers across settings, so the figure moves smoothly.
   const rn=LI.rng(SEED+7919*r),rc=LI.rng(SEED+104729*r+17);
   const m=pi*Math.sqrt(chisq(rc,n-1));
   let num=0,den=0;
   for(let j=0;j<K;j++){const g1=LI.normal(rn),g2=LI.normal(rn),xv=L11*g1+(j===0?m:0),xe=L21*g1+L22*g2;num+=xv*xe;den+=xv*xv}
   const t11=chisq(rc,df),t21=LI.normal(rc);
   const W11=a*t11,W12=c*t11+L11*L22*Math.sqrt(t11)*t21;
   tsls[r]=RHO+num/den;ols[r]=RHO+(num+W12)/(den+W11);F[r]=(den/K)/(W11/df);
  }
  const q=(arr,p)=>{const s=Float64Array.from(arr).sort(),i=p*(s.length-1),lo=Math.floor(i);return s[lo]+(s[Math.min(lo+1,s.length-1)]-s[lo])*(i-lo)};
  const hist=arr=>{const h=new Array(NB).fill(0);let lo=0,hi=0;for(const v of arr){if(v<X0)lo++;else if(v>=X1)hi++;else h[Math.floor((v-X0)/BW)]++}return {h,out:(lo+hi)/arr.length}};
  const res={
   med:q(tsls,.5),p5:q(tsls,.05),p95:q(tsls,.95),oP5:q(ols,.05),oP95:q(ols,.95),
   olsMean:ols.reduce((s,v)=>s+v,0)/REPS,Fmed:q(F,.5),
   plim:RHO+c/(pi*pi+a),hT:hist(tsls),hO:hist(ols)};
  if(cache.size>200)cache.clear();
  cache.set(key,res);return res;
 }

 function draw(s,R){
  st.layout();
  const nar=st.narrow,W=st.width,svg=st.svg,fs=nar?14:13;
  const L=nar?14:24,Rr=W-(nar?14:24);
  const x=LI.scale([X0,X1],[L,Rr]);
  const rowA=16,rowB=nar?36:35;
  const p1={top:nar?48:46,h:nar?74:70},p2={top:nar?136:130,h:nar?118:110};
  const axisY=p2.top+p2.h+8;

  function panel(p,hist,lo,hi,color,title){
   const bottom=p.top+p.h;
   // 5-95 percentile band behind the bars (clipped to the drawing range).
   const bl=Math.max(X0,Math.min(X1,lo)),bh=Math.max(X0,Math.min(X1,hi));
   if(bh>bl)LI.el('rect',{x:x(bl),y:p.top,width:Math.max(1,x(bh)-x(bl)),height:p.h,fill:C.pale,opacity:.7},svg);
   LI.el('line',{x1:L,x2:Rr,y1:bottom,y2:bottom,stroke:C.line},svg);
   const max=Math.max(1,...hist.h),bw=x(X0+BW)-x(X0);
   hist.h.forEach((cnt,i)=>{if(!cnt)return;const hh=cnt/max*(p.h-22);
    LI.el('rect',{x:x(X0+i*BW)+.5,y:bottom-hh,width:Math.max(1,bw-1),height:hh,fill:color,'fill-opacity':.85},svg)});
   const tail=hist.out>=0.005?` (그림 범위 밖 ${LI.pct(hist.out,0)})`:'';
   // Title drawn later, on top of the reference lines, with a background-coloured halo so it stays legible.
   return ()=>LI.el('text',{x:L+2,y:p.top+14,'font-size':fs,fill:C.ink,stroke:'var(--bg)','stroke-width':7,'stroke-linejoin':'round','paint-order':'stroke',text:title+tail},svg);
  }
  const titles=[panel(p1,R.hO,R.oP5,R.oP95,C.rust,nar?'OLS 추정치':'OLS 추정치 1,000개'),
   panel(p2,R.hT,R.p5,R.p95,C.blue,nar?'2SLS 추정치':'2SLS 추정치 1,000개')];

  // Reference lines through both panels, labelled on two rows so they never collide.
  const vline=(v,row,label,dash,color)=>{
   const px=x(v);LI.el('line',{x1:px,x2:px,y1:rowB+8,y2:p2.top+p2.h,stroke:color,'stroke-width':2,'stroke-dasharray':dash?'6 4':null},svg);
   const half=label.length*fs*0.32,cx=Math.min(Math.max(px,L+half),Rr-half);
   LI.el('text',{x:cx,y:row,'text-anchor':'middle','font-size':fs,fill:color,text:label},svg);
  };
  vline(RHO,rowA,'참값 0.08',false,C.ink);
  vline(R.plim,rowB,`OLS 확률극한 ${fmt(R.plim,3)}`,true,C.rust);
  titles.forEach(f=>f());
  // 2SLS median marker: a small triangle sitting on the axis.
  if(R.med>=X0&&R.med<X1){const mx=x(R.med);LI.el('path',{d:`M${mx-6},${axisY+1} L${mx+6},${axisY+1} L${mx},${axisY-9} Z`,fill:C.blue},svg)}

  LI.axis(svg,x,{side:'bottom',at:axisY,ticks:nar?[0,0.1,0.2]:[-0.05,0,0.05,0.1,0.15,0.2,0.25],format:v=>fmt(v,v===0?0:2),size:fs});
  LI.el('text',{x:(L+Rr)/2,y:axisY+38,'text-anchor':'middle','font-size':fs,fill:C.muted,text:nar?'교육 효과 추정치, 삼각형은 2SLS 중앙값':'교육 1년의 효과 추정치 (로그임금 단위, 삼각형은 2SLS 중앙값)'},svg);
 }

 function update(s){
  const n=NS[s.nIdx],R=simulate(s.pi,s.extra,s.kappa,n);
  draw(s,R);
  const gap=R.plim-RHO,pull=Math.abs(gap)>0.004?(R.med-RHO)/gap:NaN,width=R.p95-R.p5;
  show([
   ['1단계 F 중앙값',fmt(R.Fmed,1),(s.extra?`도구 ${s.extra+1}개의 1단계 계수가 모두 0이라는 가설의 F`:'도구의 1단계 계수가 0이라는 가설의 F')+', 1,000회 반복의 중앙값'],
   ['2SLS 중앙값',fmt(R.med,3),'참값은 0.080',true],
   ['2SLS 5-95 백분위',`[${fmt(R.p5,3)}, ${fmt(R.p95,3)}]`,`구간 폭 ${fmt(width,3)}`],
   ['OLS 평균과 확률극한',`${fmt(R.olsMean,3)} / ${fmt(R.plim,3)}`,'능력 편향이 더해진 값'],
   ['OLS 쪽으로 이동한 정도',Number.isFinite(pull)?LI.pct(pull,0):'계산하지 않음',
    !Number.isFinite(pull)?'OLS 편향이 거의 없어 기준이 되는 거리가 0에 가까움':Math.abs(pull)<0.1?'(2SLS 중앙값 - 참값) ÷ (OLS 확률극한 - 참값), 이 정도는 모의실험 오차 수준':'(2SLS 중앙값 - 참값) ÷ (OLS 확률극한 - 참값)',true]]);
  const moved=Number.isFinite(pull)&&pull>=0.15;
  let t;
  if(!Number.isFinite(pull))
   t='능력이 임금에 영향을 주지 않으면 OLS도 참값 근처에 있어 2SLS가 끌려갈 방향이 없습니다. 이때 약한 도구의 문제는 편향보다 넓은 산포로 나타납니다.';
  else if(s.extra>=10&&pull>=0.4&&width<0.3)
   t=`무관한 도구 ${s.extra}개가 1단계 적합값에 잡음을 채워, 분포는 좁아 정밀해 보이지만 중심이 참값에서 OLS 쪽으로 ${LI.pct(pull,0)} 이동했습니다. 좁은 구간이 참값 근처에 있다는 보장이 없습니다.`;
  else if(width>0.3)
   t=`1단계가 약해 2SLS 추정치의 90%가 ${fmt(R.p5,2)}에서 ${fmt(R.p95,2)} 사이에 흩어집니다. 교육효과의 부호도 확신하기 어렵습니다.`+(moved?` 중앙값도 OLS 쪽으로 ${LI.pct(pull,0)} 이동했습니다.`:s.extra===0?' 도구가 하나뿐이면 중앙값의 이동은 작지만, 표본 하나에서 얻는 추정치는 참값에서 크게 벗어날 수 있습니다. 여기에 무관한 도구를 더하면 분포가 좁아지면서 OLS 쪽으로 이동합니다.':'');
  else if(moved)
   t=`1단계 F 중앙값 ${fmt(R.Fmed,1)}에서는 2SLS 중앙값이 참값과 OLS 확률극한 사이 거리의 ${LI.pct(pull,0)}만큼 OLS 쪽으로 끌려갑니다. 표본을 늘리거나 무관한 도구를 빼면 이동이 줄어듭니다.`;
  else
   t=`1단계가 충분히 강해(F 중앙값 ${fmt(R.Fmed,1)}) 2SLS는 참값 0.08 근처에 모이고, OLS는 능력 편향 때문에 ${fmt(R.plim,3)} 근처에 모입니다.`+(gap<0?' 능력 효과가 음수이면 OLS가 참값보다 작아지므로, 도구가 약해질 때 2SLS도 아래쪽으로 끌려갑니다.':' 1단계 계수를 낮추거나 무관한 도구를 늘려 보십시오.');
  msg.textContent=t;
 }
 update(ctl.state);
 st.onResize(()=>update(ctl.state));
});
