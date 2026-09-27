// Placebo-law experiment after Bertrand, Duflo and Mullainathan (2004), Table II Panel B.
// A state-year panel with AR(1) errors, a law with zero effect given to half the states from a random year,
// a DID regression with state and year fixed effects, and the share of placebo laws judged significant
// under the usual OLS standard error and under a state-clustered standard error.
LI.register('placebo-clustering',root=>{
 const {C,fmt,pct}=LI;
 // Two-sided 5% critical values of t with 1..49 degrees of freedom (scipy.stats.t.ppf(.975, df)).
 const T975=[12.706,4.303,3.182,2.776,2.571,2.447,2.365,2.306,2.262,2.228,2.201,2.179,2.16,2.145,2.131,2.12,2.11,2.101,2.093,2.086,2.08,2.074,2.069,2.064,2.06,2.056,2.052,2.048,2.045,2.042,2.04,2.037,2.035,2.032,2.03,2.028,2.026,2.024,2.023,2.021,2.02,2.018,2.017,2.015,2.014,2.013,2.012,2.011,2.01];
 // Original rejection rates with no effect: Table II Panel B rows 9-14 (N=50, T=21) and Table III AR(1) column (rho=.8).
 const PANEL_B=[[-.4,.008,14],[0,.053,10],[.2,.123,11],[.4,.19,12],[.6,.333,13],[.8,.373,9]];
 const TABLE3={'50,21':.35,'20,21':.35,'10,21':.3975,'6,21':.393,'50,11':.335,'50,5':.175,'50,3':.09,'50,50':.4975};

 // One Monte Carlo run. Draws do not depend on rho, so moving rho reshapes the same underlying shocks.
 function simulate(rho,N,T,R,seed=2004){
  const rand=LI.rng(seed);let spare=null;
  const gauss=()=>{if(spare!==null){const v=spare;spare=null;return v}
   let u=0;while(u===0)u=rand();const v=rand(),r=Math.sqrt(-2*Math.log(u));
   spare=r*Math.sin(2*Math.PI*v);return r*Math.cos(2*Math.PI*v)};
  // Adoption year: the paper draws 1985-1995 out of 1979-1999, i.e. positions 6..16 of 21; scaled to T.
  const n1=Math.floor(N/2),lo=Math.max(1,Math.round(T*6/21)),hi=Math.min(T-1,Math.max(lo,Math.round(T*16/21)));
  const k=Math.sqrt(1-rho*rho),NT=N*T,idx=new Int32Array(N),treat=new Uint8Array(N);
  const y=new Float64Array(NT),ys=new Float64Array(N),yt=new Float64Array(T);
  const beta=new Float64Array(R),seOLS=new Float64Array(R),seCl=new Float64Array(R);
  for(let r=0;r<R;r++){
   for(let i=0;i<N;i++){idx[i]=i;treat[i]=0}
   for(let i=0;i<n1;i++){const j=i+Math.floor(rand()*(N-i)),tmp=idx[i];idx[i]=idx[j];idx[j]=tmp;treat[idx[i]]=1}
   const t0=lo+Math.floor(rand()*(hi-lo+1));
   // Stationary AR(1) errors with variance 1. State and year effects are omitted: the fixed effects remove them exactly.
   ys.fill(0);yt.fill(0);let yg=0;
   for(let s=0;s<N;s++){let e=gauss();for(let t=0;t<T;t++){if(t>0)e=rho*e+k*gauss();y[s*T+t]=e;ys[s]+=e;yt[t]+=e}}
   for(let s=0;s<N;s++){yg+=ys[s];ys[s]/=T}
   for(let t=0;t<T;t++)yt[t]/=N;
   yg/=NT;
   // Two-way demeaning of the law dummy has a closed form in a balanced panel.
   const post=(T-t0)/T,share=n1/N,dg=share*post;
   let Sdd=0,Sdy=0;
   for(let s=0;s<N;s++)for(let t=0;t<T;t++){
    const dd=(treat[s]&&t>=t0?1:0)-treat[s]*post-(t>=t0?share:0)+dg;
    Sdd+=dd*dd;Sdy+=dd*(y[s*T+t]-ys[s]-yt[t]+yg)}
   const b=Sdy/Sdd;let SSR=0,G2=0;
   for(let s=0;s<N;s++){let G=0;
    for(let t=0;t<T;t++){
     const dd=(treat[s]&&t>=t0?1:0)-treat[s]*post-(t>=t0?share:0)+dg;
     const e=y[s*T+t]-ys[s]-yt[t]+yg-b*dd;SSR+=e*e;G+=dd*e}
    G2+=G*G}
   beta[r]=b;
   seOLS[r]=Math.sqrt(SSR/(NT-N-T)/Sdd);   // residual df: NT minus N state, T-1 year, 1 law parameter
   seCl[r]=Math.sqrt(G2)/Sdd;              // sum over states of (sum over years of d*e)^2
  }
  return {beta,seOLS,seCl};
 }

 const st=LI.stage(root,{width:640,height:430,narrowWidth:360,narrowHeight:740,label:'가짜 법 t값의 분포와 자기상관계수별 기각률'});
 LI.legend(root,[['보통 OLS 표준오차로 기각',C.blue],['주 단위 군집 표준오차로 기각',C.rust],['기각되지 않은 반복',C.gray],
  ['표준오차가 옳을 때의 표준정규분포',C.ink,true],['원문 Table II Panel B (N=50, T=21)',C.gray,false,true]]);
 const show=LI.readout(root);
 const msg=LI.note(root,'');
 const ctl=LI.controls(root,[
  {key:'rho',label:'오차의 자기상관계수 ρ',min:-.4,max:.9,step:.1,value:.8,format:v=>fmt(v,1)},
  {key:'N',label:'주의 수 N (절반이 처치)',min:6,max:50,step:1,value:50},
  {key:'T',label:'연도 수 T',min:2,max:50,step:1,value:21},
  {key:'R',label:'가짜 법 반복 수',min:100,max:1000,step:100,value:400},
  {key:'small',label:'군집 표준오차에 소표본 보정과 t(N-1) 임계값 적용',type:'toggle',value:false}],schedule);

 let cache={key:null,sim:null},pending=null;
 function schedule(s){
  if(pending!==null)return void(pending=s);
  pending=s;requestAnimationFrame(()=>{const v=pending;pending=null;draw(v)});
 }

 function draw(s){
  // Keep one redraw light on phones: at most about 500,000 simulated state-years per setting.
  const rho=Math.round(s.rho*10)/10+0,{N,T,small}=s,R=Math.min(s.R,Math.max(100,Math.floor(5e5/(N*T)/50)*50)),key=[rho,N,T,R].join(',');
  if(cache.key!==key)cache={key,sim:simulate(rho,N,T,R)};
  const {beta,seOLS,seCl}=cache.sim,NT=N*T;
  const c=small?N/(N-1)*(NT-1)/(NT-T-1):1,critCl=small?T975[N-2]:1.96;
  let rejO=0,rejC=0,mb=0,vb=0,mO=0,mC=0;
  const bins=32,w=.5,lo=-8,hO=Array.from({length:bins},()=>[0,0]),hC=Array.from({length:bins},()=>[0,0]);
  const bin=t=>Math.min(bins-1,Math.max(0,Math.floor((t-lo)/w)));
  for(let r=0;r<R;r++){
   const tO=beta[r]/seOLS[r],tC=beta[r]/(seCl[r]*Math.sqrt(c)),aO=Math.abs(tO)>1.96,aC=Math.abs(tC)>critCl;
   rejO+=aO;rejC+=aC;hO[bin(tO)][aO?1:0]++;hC[bin(tC)][aC?1:0]++;
   mb+=beta[r];mO+=seOLS[r];mC+=seCl[r]*Math.sqrt(c)}
  mb/=R;mO/=R;mC/=R;
  for(let r=0;r<R;r++)vb+=(beta[r]-mb)**2;
  const sd=Math.sqrt(vb/(R-1)),pO=rejO/R,pC=rejC/R;

  st.layout();
  const n=st.narrow,svg=st.svg,fs=n?15:14,fa=n?14:13;
  // Histograms of t: shared vertical scale so the two spreads can be compared directly.
  const hx=n?[40,344]:[40,392],x=LI.scale([lo,-lo],hx);
  const peak=R*w*0.3989,ymax=Math.max(peak,...hO.map(b=>b[0]+b[1]),...hC.map(b=>b[0]+b[1]))*1.08;
  const panels=[[hO,'보통 OLS 표준오차의 t',pO,C.blue,1.96],[hC,small?'주 단위 군집 표준오차의 t (보정 적용)':'주 단위 군집 표준오차의 t',pC,C.rust,critCl]];
  panels.forEach(([h,title,p,col,crit],i)=>{
   const top=i*(n?200:196),y0=top+148,y=LI.scale([0,ymax],[y0,top+30]);
   LI.el('text',{x:hx[0],y:top+16,'font-size':fs,fill:C.ink,text:title},svg);
   LI.el('text',{x:hx[1],y:top+16,'font-size':fs,'font-weight':600,'text-anchor':'end',fill:col,text:'기각 '+pct(p,1)},svg);
   h.forEach(([keep,rej],j)=>{
    const bx=x(lo+j*w)+.5,bw=x(lo+w)-x(lo)-1;
    if(keep)LI.el('rect',{x:bx,y:y(keep),width:bw,height:y0-y(keep),fill:C.gray,'fill-opacity':.45},svg);
    if(rej)LI.el('rect',{x:bx,y:y(keep+rej),width:bw,height:y(keep)-y(keep+rej),fill:col},svg);
   });
   const curve=[];for(let v=lo;v<=-lo+1e-9;v+=.1)curve.push([x(v),y(R*w*Math.exp(-v*v/2)/Math.sqrt(2*Math.PI))]);
   LI.polyline(svg,curve,{stroke:C.ink,'stroke-width':1.5,'stroke-dasharray':'4 3'});
   for(const sgn of[-1,1])LI.el('line',{x1:x(sgn*crit),x2:x(sgn*crit),y1:top+30,y2:y0,stroke:C.muted,'stroke-width':1,'stroke-dasharray':'2 3'},svg);
   LI.el('text',{x:x(crit)+4,y:top+42,'font-size':fa,fill:C.muted,text:'±'+fmt(crit,2)},svg);
   LI.axis(svg,x,{side:'bottom',at:y0,ticks:[-6,-4,-2,0,2,4,6],format:v=>fmt(v,0),size:fa});
  });
  LI.el('text',{x:(hx[0]+hx[1])/2,y:(n?200:196)+186,'text-anchor':'middle','font-size':fa,fill:C.muted,text:'t값 (양 끝 막대는 ±8 밖의 값 포함)'},svg);

  // Rejection rate against rho, with the paper's Panel B points for reference.
  const rx=n?[64,340]:[474,626],ry=n?[682,452]:[330,62],top=n?418:22;
  const ytop=Math.max(.6,Math.ceil(Math.max(pO,pC)*10)/10);
  const X=LI.scale([-.4,.9],rx),Y=LI.scale([0,ytop],ry);
  LI.el('text',{x:n?16:rx[0]-40,y:top,'font-size':fs,fill:C.ink,text:'ρ별 가짜 법 기각률'},svg);
  LI.axis(svg,Y,{side:'left',at:rx[0],ticks:ytop>.6?[0,.2,.4,.6,.8,1].filter(v=>v<=ytop):[0,.2,.4,.6],format:v=>pct(v,0),size:fa});
  LI.axis(svg,X,{side:'bottom',at:ry[0],ticks:[-.4,0,.4,.8],format:v=>fmt(v,1),label:'자기상관계수 ρ',size:fa});
  LI.el('line',{x1:rx[0],x2:rx[1],y1:Y(.05),y2:Y(.05),stroke:C.muted,'stroke-dasharray':'4 3'},svg);
  // Put the 5% label on the side away from the current rho so the markers do not cover it.
  LI.el('text',{x:rho>0?X(.06):rx[1],y:Y(.05)-7,'text-anchor':rho>0?'start':'end','font-size':fa,fill:C.muted,text:'명목 5%'},svg);
  LI.el('line',{x1:X(rho),x2:X(rho),y1:ry[0],y2:ry[1],stroke:C.line},svg);
  for(const [r0,v] of PANEL_B)LI.el('circle',{cx:X(r0),cy:Y(v),r:5,fill:'none',stroke:C.gray,'stroke-width':2},svg);
  LI.el('circle',{cx:X(rho),cy:Y(pO),r:6,fill:C.blue},svg);
  LI.el('rect',{x:X(rho)-5.5,y:Y(pC)-5.5,width:11,height:11,fill:C.rust},svg);

  // Readout, with the matching number from the paper when one exists.
  const mc=v=>'반복 수에 따른 오차 ±'+fmt(200*Math.sqrt(v*(1-v)/R),1)+'%p',reps=R<s.R?`N×T가 커서 반복을 ${R}회로 줄여 계산, `:`반복 ${R}회, `;
  const pb=PANEL_B.find(([r0])=>r0===rho),t3=rho===.8?TABLE3[N+','+T]:undefined;
  let orig='같은 설정 없음',origNote='원문 AR(1) 결과는 N=50, T=21의 ρ 여섯 값과 ρ=0.8의 N, T 변형뿐';
  if(N===50&&T===21&&pb){orig=pct(pb[1],1);origNote=`Table II 행 ${pb[2]}, 보통 OLS 표준오차`+(t3!=null?`. Table III 같은 설정은 ${pct(t3,1)}`:'')}
  else if(t3!=null){orig=pct(t3,1);origNote='Table III AR(1) 열, 보통 OLS 표준오차'}
  show([
   ['보통 OLS 표준오차의 기각률',pct(pO,1),reps+mc(pO),true],
   ['주 단위 군집 표준오차의 기각률',pct(pC,1),`임계값 ${fmt(critCl,2)}, `+mc(pC),true],
   ['원문의 OLS 기각률',orig,origNote],
   ['계수의 실제 표준편차 ÷ 평균 OLS 표준오차',fmt(sd/mO,2)+'배','1보다 크면 OLS 표준오차가 변동을 과소평가'],
   ['계수의 실제 표준편차 ÷ 평균 군집 표준오차',fmt(sd/mC,2)+'배','주가 적을수록 1보다 커지기 쉬움'],
   ['가짜 법 계수의 평균',fmt(Math.abs(mb)<5e-4?0:mb,3),'참효과 0 근처. 중심은 맞고 산포 판단만 틀림']]);

  msg.textContent=rho<0
   ?`음의 자기상관에서는 OLS 표준오차가 오히려 실제 변동보다 커서 5%보다 적게 기각합니다. 원문 행 14(ρ=-0.4)도 0.8%였습니다.`
   :rho===0
   ?'오차에 자기상관이 없으면 한 해의 충격이 다음 해로 이어지지 않아 OLS 표준오차도 옳습니다. 두 방법 모두 5% 근처에 머뭅니다(원문 행 10: 5.3%).'
   :T<=3
   ?`기간이 ${T}년뿐이면 같은 충격을 여러 해에 걸쳐 중복 계산할 여지가 작아 OLS 과대기각도 작습니다. 원문 Table III에서 T=3은 9%, T=5는 17.5%였습니다.`
   :N<=15&&!small&&pC>.08
   ?`주가 ${N}개뿐이면 군집 표준오차는 주별 합 ${N}개로 분산을 추정하므로 작게 나오는 반복이 많아 ${pct(pC,1)}를 기각합니다. 소표본 보정과 t(N-1) 임계값을 켜면 5% 근처로 돌아옵니다. OLS 기각률은 N을 줄여도 거의 그대로입니다.`
   :`ρ=${fmt(rho,1)}에서 OLS 표준오차는 계수의 실제 변동을 ${fmt(sd/mO,2)}배 과소평가해 효과가 없는 법의 ${pct(pO,0)}를 유의하다고 판정합니다. 주 단위 군집은 같은 주의 여러 해를 한 묶음으로 계산해 기각률을 ${pct(pC,1)}로 낮춥니다.`;
 }
 draw(ctl.state);
 st.onResize(()=>draw(ctl.state));
});
