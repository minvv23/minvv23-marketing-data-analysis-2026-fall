// Propensity score overlap, IPW weights and trimming (Imbens 2004, sections 9 and 11).
// One fixed simulated sample of 1000 people. Selection strength changes who is treated through a fixed
// uniform draw per person, so moving a slider re-sorts the same people instead of drawing a new sample.
LI.register('ps-overlap',root=>{
 const {C,fmt,pct}=LI;
 const N=1000,SEED=2004,B0=-1,CURVE=1.5;
 // Draw order per person: X, noise for Y(0), noise for Y(1), uniform for treatment.
 const rand=LI.rng(SEED),X=[],E0=[],E1=[],U=[];
 for(let i=0;i<N;i++){X.push(LI.normal(rand));E0.push(LI.normal(rand));E1.push(LI.normal(rand));U.push(rand())}
 const y0=x=>10+2*x+CURVE*x*x;
 const tau=(x,het)=>het?2-x:2;

 // Logistic regression of W on (1, X) by Newton steps; the model is correctly specified.
 function logit(W){
  let a=0,b=0;
  for(let it=0;it<50;it++){
   let g0=0,g1=0,h00=0,h01=0,h11=0;
   for(let i=0;i<N;i++){const p=1/(1+Math.exp(-(a+b*X[i]))),r=W[i]-p,s=p*(1-p);g0+=r;g1+=r*X[i];h00+=s;h01+=s*X[i];h11+=s*X[i]*X[i]}
   const det=h00*h11-h01*h01,da=(h11*g0-h01*g1)/det,db=(h00*g1-h01*g0)/det;
   a+=da;b+=db;if(Math.abs(da)+Math.abs(db)<1e-10)break;
  }
  return X.map(x=>1/(1+Math.exp(-(a+b*x))));
 }
 function ols(idx,Y){
  const n=idx.length;let mx=0,my=0;for(const i of idx){mx+=X[i];my+=Y[i]}mx/=n;my/=n;
  let sxx=0,sxy=0;for(const i of idx){sxx+=(X[i]-mx)**2;sxy+=(X[i]-mx)*(Y[i]-my)}
  const b=sxy/sxx;return [my-b*mx,b];
 }
 const sum=a=>a.reduce((s,v)=>s+v,0);
 const ess=w=>sum(w)**2/sum(w.map(v=>v*v));

 function compute({gam,alpha,het}){
  const W=X.map((x,i)=>U[i]<1/(1+Math.exp(-(B0-gam*x)))?1:0);
  const Y=X.map((x,i)=>W[i]?y0(x)+tau(x,het)+E1[i]:y0(x)+E0[i]);
  const eh=logit(W);
  const keep=eh.map(e=>alpha<=0||(e>=alpha&&e<=1-alpha));
  const S=[],T=[],Cc=[];
  for(let i=0;i<N;i++)if(keep[i]){S.push(i);(W[i]?T:Cc).push(i)}
  const mean=(idx,f)=>sum(idx.map(f))/idx.length;
  const diff=mean(T,i=>Y[i])-mean(Cc,i=>Y[i]);
  const [a1,b1]=ols(T,Y),[a0,b0]=ols(Cc,Y);
  const reg=mean(S,i=>(a1+b1*X[i])-(a0+b0*X[i]));
  const wT=T.map(i=>1/eh[i]),wC=Cc.map(i=>1/(1-eh[i]));
  const ipw=sum(T.map((i,k)=>wT[k]*Y[i]))/sum(wT)-sum(Cc.map((i,k)=>wC[k]*Y[i]))/sum(wC);
  // The person with the largest share of their group's weighted mean.
  const sT=sum(wT),sC=sum(wC);let top={share:0};
  T.forEach((i,k)=>{if(wT[k]/sT>top.share)top={share:wT[k]/sT,w:wT[k],e:eh[i],treated:true}});
  Cc.forEach((i,k)=>{if(wC[k]/sC>top.share)top={share:wC[k]/sC,w:wC[k],e:eh[i],treated:false}});
  const nT=sum(W),dropT=nT-T.length,dropC=N-nT-Cc.length;
  return {W,eh,keep,S,T,Cc,nT,dropT,dropC,diff,reg,ipw,top,
   essT:ess(wT),essC:ess(wC),
   truthAll:sum(X.map(x=>tau(x,het)))/N,truthS:mean(S,i=>tau(X[i],het)),
   dropX:dropT+dropC?sum(X.filter((x,i)=>!keep[i]))/(dropT+dropC):NaN};
 }

 const st=LI.stage(root,{width:640,height:430,narrowWidth:360,narrowHeight:470,label:'처치자와 통제자의 추정 성향점수 분포, 트리밍 구간, 세 추정치와 참값의 비교'});
 LI.legend(root,[['처치자',C.blue],['통제자',C.rust],['트리밍으로 제외되는 구간',C.pale]]);
 const show=LI.readout(root);
 const msg=LI.note(root,'');
 const ctl=LI.controls(root,[
  {key:'gam',label:'참가 전 소득이 참가를 좌우하는 강도',min:0,max:3,step:.1,value:2,format:v=>fmt(v,1)},
  {key:'alpha',label:'트리밍 기준',min:0,max:.15,step:.01,value:0,format:v=>v?`${fmt(v,2)}-${fmt(1-v,2)}만 사용`:'제외 없음'},
  {key:'het',label:'처치효과가 참가 전 소득에 따라 다름',type:'toggle',value:true}],draw);

 function draw(s){
  st.layout();
  const n0=st.narrow,top=50,half=n0?96:92,p2=top+2*half+66,rowH=n0?40:36,y1p=p2+18+rowH*3;
  st.layout(y1p+4+30);
  const r=compute(s),svg=st.svg,n=st.narrow,W=st.width;
  const L=n?16:24,R=W-(n?16:20),fs=n?14:13;
  // Panel 1: mirrored histogram of estimated propensity scores.
  const base=top+half,bins=20;
  const cT=Array(bins).fill(0),cC=Array(bins).fill(0);
  r.eh.forEach((e,i)=>{const b=Math.min(bins-1,Math.floor(e*bins));(r.W[i]?cT:cC)[b]++});
  const maxC=Math.max(...cT,...cC,1),xs=LI.scale([0,1],[L+(n?26:30),R]),hs=v=>v/maxC*half;
  LI.el('text',{x:L,y:16,'font-size':fs,fill:C.ink,'font-weight':600,text:'추정 성향점수 분포'},svg);
  LI.el('text',{x:R,y:16,'text-anchor':'end','font-size':fs,fill:C.muted,text:n?'위 처치자, 아래 통제자':'위: 처치자, 아래: 통제자'},svg);
  if(s.alpha>0){
   for(const [a,b] of [[0,s.alpha],[1-s.alpha,1]])LI.el('rect',{x:xs(a),y:top,width:xs(b)-xs(a),height:2*half,fill:C.pale},svg);
   for(const v of [s.alpha,1-s.alpha])LI.el('line',{x1:xs(v),x2:xs(v),y1:top,y2:top+2*half,stroke:C.gray,'stroke-dasharray':'4 3'},svg);
  }
  const bw=xs(1/bins)-xs(0);
  for(let b=0;b<bins;b++){
   const x=xs(b/bins)+1;
   if(cT[b])LI.el('rect',{x,y:base-hs(cT[b]),width:bw-2,height:hs(cT[b]),fill:C.blue},svg);
   if(cC[b])LI.el('rect',{x,y:base,width:bw-2,height:hs(cC[b]),fill:C.rust},svg);
  }
  LI.el('line',{x1:xs(0),x2:xs(1),y1:base,y2:base,stroke:C.ink},svg);
  LI.el('text',{x:xs(0)-6,y:top+12,'text-anchor':'end','font-size':fs,fill:C.muted,text:String(maxC)},svg);
  LI.el('text',{x:xs(0)-6,y:top+2*half,'text-anchor':'end','font-size':fs,fill:C.muted,text:String(maxC)},svg);
  LI.el('text',{x:xs(0)-6,y:base+4,'text-anchor':'end','font-size':fs,fill:C.muted,text:'0'},svg);
  LI.axis(svg,xs,{side:'bottom',at:top+2*half+6,ticks:n?[0,.25,.5,.75,1]:[0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1],format:v=>fmt(v,n?2:1),size:fs});
  // Mark where the heaviest single weight sits (its bar can be too short to see).
  const tx=xs(r.top.e);
  LI.el('line',{x1:tx,x2:tx,y1:top,y2:top+2*half,stroke:C.ink,'stroke-dasharray':'1 3'},svg);
  LI.el('path',{d:`M${tx-5},${top-8} L${tx+5},${top-8} L${tx},${top-1} Z`,fill:C.ink},svg);
  const topLab=`가장 큰 가중치 ${fmt(r.top.w,1)} (${r.top.treated?'처치자':'통제자'})`,right=tx<(L+R)/2;
  LI.el('text',{x:right?Math.max(L,tx-8):Math.min(R,tx+8),y:top-12,'text-anchor':right?'start':'end','font-size':fs,fill:C.ink,text:topLab},svg);

  // Panel 2: three estimates against the two true averages.
  const labW=n?92:118;
  const es=LI.scale([-.5,3.5],[L+labW,R-8]);
  LI.el('text',{x:L,y:p2,'font-size':fs,fill:C.ink,'font-weight':600,text:'평균처치효과 추정치'},svg);
  const y0p=p2+18;
  for(const [v,col] of [[r.truthAll,C.ink],[r.truthS,C.gray]])
   LI.el('line',{x1:es(v),x2:es(v),y1:y0p-4,y2:y1p,stroke:col,'stroke-width':2,'stroke-dasharray':col===C.ink?'6 4':'2 3'},svg);
  // Label the true-value lines directly; merge the labels when the two values coincide.
  if(fmt(r.truthAll,2)===fmt(r.truthS,2))
   LI.el('text',{x:es(r.truthAll)+6,y:p2,'font-size':fs,fill:C.muted,text:`참값 ${fmt(r.truthAll,2)}`},svg);
  else{const hi=r.truthS>r.truthAll;
   LI.el('text',{x:es(r.truthAll)+(hi?-6:6),y:p2,'text-anchor':hi?'end':'start','font-size':fs,fill:C.ink,text:n?'전체':'전체 참값'},svg);
   LI.el('text',{x:es(r.truthS)+(hi?6:-6),y:p2,'text-anchor':hi?'start':'end','font-size':fs,fill:C.muted,text:n?'남은 사람':'남은 사람 참값'},svg)}
  [['단순 차이',r.diff],[n?'회귀조정':'회귀조정(직선)',r.reg],['IPW',r.ipw]].forEach(([lab,v],k)=>{
   const y=y0p+rowH*(k+.5);
   LI.el('line',{x1:es.range[0],x2:es.range[1],y1:y,y2:y,stroke:C.line},svg);
   LI.el('text',{x:L,y:y+5,'font-size':fs,fill:C.ink,text:lab},svg);
   const cx=es(Math.max(-.5,Math.min(3.5,v)));
   LI.el('circle',{cx,cy:y,r:6,fill:C.ink},svg);
   const right=cx<es.range[1]-46;
   LI.el('text',{x:right?cx+11:cx-11,y:y-8,'text-anchor':right?'start':'end','font-size':fs,fill:C.muted,stroke:'var(--bg)','stroke-width':4,'paint-order':'stroke',text:fmt(v,2)},svg);
  });
  LI.axis(svg,es,{side:'bottom',at:y1p+4,ticks:[-.5,0,.5,1,1.5,2,2.5,3,3.5].filter((_,k)=>!n||k%2===1),format:v=>fmt(v,1),size:fs});

  const drop=r.dropT+r.dropC;
  show([
   ['트리밍 후 남은 사람',`${r.S.length}명 / ${N}명`,drop?`${pct(drop/N,1)} 제외 (처치자 ${r.dropT}명, 통제자 ${r.dropC}명)`:'제외된 사람 없음'],
   ['가장 큰 IPW 가중치',fmt(r.top.w,1),`${r.top.treated?'처치자':'통제자'} 가중평균의 ${pct(r.top.share,1)}를 한 사람이 차지`],
   ['유효 표본 크기 (처치자 / 통제자)',`${Math.round(r.essT)} / ${Math.round(r.essC)}`,`실제 인원 ${r.T.length} / ${r.Cc.length}명`],
   ['참 평균효과 (전체 / 남은 사람)',`${fmt(r.truthAll,2)} / ${fmt(r.truthS,2)}`,'모의자료라서 알 수 있는 값',true],
   ['추정치 (단순 차이 / 회귀조정 / IPW)',`${fmt(r.diff,2)} / ${fmt(r.reg,2)} / ${fmt(r.ipw,2)}`,null,true]]);

  const shift=r.truthS-r.truthAll;
  msg.textContent=s.gam===0
   ?'참가가 참가 전 소득과 무관하면 무작위 배정과 같아서 두 분포가 겹치고, 가중치가 작으며 세 추정치가 모두 참값 근처에 모입니다.'
   :s.alpha===0&&r.top.share>.05
   ?`트리밍하지 않으면 성향점수가 0이나 1에 가까운 한 사람이 가중평균의 ${pct(r.top.share,0)}를 좌우합니다. 원문의 기준(한 사람의 기여 5% 이하)을 이 표본 ${N}명에 적용하면 성향점수 .02 미만과 .98 초과를 제외합니다.`
   :s.alpha>0&&drop>0&&s.het&&Math.abs(shift)>=.05
   ?`트리밍으로 가중치는 안정되지만 제외된 ${drop}명은 주로 참가 전 소득이 ${r.dropX>0?'높아 효과가 작은':'낮아 효과가 큰'} 사람들이어서, 추정 대상이 전체 ${fmt(r.truthAll,2)}에서 남은 사람 ${fmt(r.truthS,2)}로 바뀝니다. 추정치는 남은 사람의 참값과 비교해야 합니다.`
   :s.alpha>0&&!s.het&&drop>0
   ?'효과가 모든 사람에게 같으면 트리밍으로 사람을 제외해도 추정 대상의 참값은 2로 그대로입니다. 트리밍이 대상 모집단을 바꾸는 문제는 효과가 이질적일 때 생깁니다.'
   :'겹침이 줄수록 단순 차이는 선택편향으로 참값에서 멀어지고, 직선 회귀는 상대 집단이 드문 구간을 외삽해 곡선 관계를 놓칩니다. IPW는 평균적으로 편향이 없지만 소수의 큰 가중치에 의존합니다.';
 }
 draw(ctl.state);
 st.onResize(()=>draw(ctl.state));
});
