// Individual fixed effects: pooled OLS slope versus the within (demeaned) slope in a union-wage panel,
// and how misreported union status shrinks the within slope toward zero.
LI.register('fe-within',root=>{
 const {C,fmt,pct}=LI;
 const N=16,T=6,BASE=2.6,SA=0.09,SE=0.035;
 // Number of union years per worker: most never or always belong, a few change status.
 const K=[0,0,0,0,0,0,6,6,6,6,6,1,2,3,3,4];
 const rand=LI.rng(503);
 const start=K.map(k=>k>0&&k<T?Math.floor(rand()*(T-k+1)):0);
 const dTrue=K.map((k,i)=>Array.from({length:T},(_,t)=>t>=start[i]&&t<start[i]+k?1:0));
 // a: standardized union share. b: a second standardized score, orthogonal to a, so corr(ability, share)=c exactly.
 const std=v=>{const m=v.reduce((s,x)=>s+x,0)/v.length,sd=Math.sqrt(v.reduce((s,x)=>s+(x-m)**2,0)/v.length);return v.map(x=>(x-m)/sd)};
 const a=std(K.map(k=>k/T));
 const raw=K.map(()=>LI.normal(rand)),rm=raw.reduce((s,x)=>s+x,0)/N;
 const proj=raw.reduce((s,x,i)=>s+(x-rm)*a[i],0)/N;
 const b=std(raw.map((x,i)=>x-rm-proj*a[i]));
 const eps=K.map(()=>Array.from({length:T},()=>SE*LI.normal(rand)));
 const flipU=K.map(()=>Array.from({length:T},()=>rand()));
 // Horizontal lanes so each worker's points sit in their own column in the raw view.
 const order=Array.from({length:N},(_,i)=>i).sort((i,j)=>((i*7)%N)-((j*7)%N));
 const lane=Array(N);order.forEach((p,r)=>lane[p]=-0.32+0.64*r/(N-1));

 const st=LI.stage(root,{width:640,height:380,narrowWidth:360,narrowHeight:420,label:'노조 가입 여부와 로그 임금의 산점도, 풀링 OLS 기울기와 개인 내부 기울기'});
 LI.legend(root,[['풀링 OLS 기울기',C.rust],['개인 내부(within) 기울기',C.blue],['참 노조 효과 기울기 (평균을 뺀 그림)',C.ink,true],['잘못 기록된 가입 상태',C.ink,false,true]]);
 const show=LI.readout(root);
 const msg=LI.note(root,'');
 const ctl=LI.controls(root,[
  {key:'c',label:'능력(개인 절편)과 노조 가입의 상관',min:-0.9,max:0.9,step:0.05,value:0.6},
  {key:'rho',label:'참 노조 효과 (로그 임금)',min:0,max:0.3,step:0.01,value:0.1},
  {key:'m',label:'연도별 가입 상태 오기록 확률',min:0,max:0.2,step:0.01,value:0,format:v=>pct(v,0)},
  {key:'within',label:'개인 평균 빼기 (within 변환)',type:'toggle',value:false}],draw);

 function slope(xs,ys){const n=xs.length,mx=xs.reduce((s,x)=>s+x,0)/n,my=ys.reduce((s,y)=>s+y,0)/n;let sxy=0,sxx=0;for(let k=0;k<n;k++){sxy+=(xs[k]-mx)*(ys[k]-my);sxx+=(xs[k]-mx)**2}return {b:sxx>0?sxy/sxx:NaN,mx,my}}

 function compute(s){
  const alpha=a.map((ai,i)=>SA*(s.c*ai+Math.sqrt(1-s.c*s.c)*b[i]));
  const rows=[];let changes=0,fake=0;
  for(let i=0;i<N;i++){
   const d=dTrue[i].map((v,t)=>flipU[i][t]<s.m?1-v:v);
   const y=dTrue[i].map((v,t)=>BASE+alpha[i]+s.rho*v+eps[i][t]);
   const dm=d.reduce((p,x)=>p+x,0)/T,ym=y.reduce((p,x)=>p+x,0)/T;
   for(let t=0;t<T;t++)rows.push({i,t,d:d[t],y:y[t],dd:d[t]-dm,yd:y[t]-ym,err:d[t]!==dTrue[i][t]});
   for(let t=1;t<T;t++)if(d[t]!==d[t-1]){changes++;if(dTrue[i][t]===dTrue[i][t-1])fake++}
  }
  const pooled=slope(rows.map(r=>r.d),rows.map(r=>r.y));
  const within=slope(rows.map(r=>r.dd),rows.map(r=>r.yd));
  return {rows,pooled,within,changes,fake};
 }

 function draw(s){
  st.layout();
  const R=compute(s),W=s.within,n=st.narrow;
  const L=n?52:64,Rr=st.width-(n?14:24),top=56,bot=st.height-(n?58:58);
  const xs=W?LI.scale([-1,1],[L,Rr]):LI.scale([-0.5,1.5],[L,Rr]);
  const ys=W?LI.scale([-0.5,0.5],[bot,top]):LI.scale([2.2,3.2],[bot,top]);
  const svg=st.svg,fs=n?14:13;
  const clipId=st.id('clip');
  const defs=LI.el('defs',{},svg),cp=LI.el('clipPath',{id:clipId},defs);LI.el('rect',{x:L,y:top,width:Rr-L,height:bot-top},cp);
  // Axes
  LI.axis(svg,ys,{side:'left',at:L,ticks:W?[-0.5,-0.25,0,0.25,0.5]:[2.2,2.45,2.7,2.95,3.2],format:v=>fmt(v,2),label:W?'로그 임금 - 개인 평균':'로그 임금',size:fs});
  if(W){
   LI.axis(svg,xs,{side:'bottom',at:bot,ticks:[-1,-0.5,0,0.5,1],format:v=>fmt(v,1),label:'노조 가입 - 개인 평균 가입률',size:fs});
   LI.el('line',{x1:xs(0),x2:xs(0),y1:top,y2:bot,stroke:C.line},svg);
   LI.el('line',{x1:L,x2:Rr,y1:ys(0),y2:ys(0),stroke:C.line},svg);
  }else{
   LI.axis(svg,xs,{side:'bottom',at:bot,ticks:[0,1],format:v=>v?'노조 (1)':'비노조 (0)',label:n?'가입 여부 (가로는 사람별로 벌림)':'노조 가입 여부 (가로 위치는 사람을 구분하려고 조금씩 벌림)',size:fs});
  }
  const g=LI.el('g',{'clip-path':`url(#${clipId})`},svg);
  if(!W){
   // Each worker's own comparison: mean wage in non-union years joined to mean wage in union years.
   for(let i=0;i<N;i++){
    const mine=R.rows.filter(r=>r.i===i),z=mine.filter(r=>!r.d),o=mine.filter(r=>r.d);
    if(!z.length||!o.length)continue;
    const my=arr=>arr.reduce((p,r)=>p+r.y,0)/arr.length;
    LI.el('line',{x1:xs(lane[i]),y1:ys(my(z)),x2:xs(1+lane[i]),y2:ys(my(o)),stroke:C.blue,'stroke-width':1.6,opacity:.7},g);
   }
  }
  // Points
  for(const r of R.rows){
   const x=W?xs(r.dd):xs(r.d+lane[r.i]),y=W?ys(r.yd):ys(r.y);
   if(r.err)LI.el('circle',{cx:x,cy:y,r:4.2,fill:'none',stroke:C.ink,'stroke-width':1.6},g);
   else LI.el('circle',{cx:x,cy:y,r:3.6,fill:C.gray,opacity:.75},g);
  }
  // Fitted lines
  const line=(x0,x1,f,attrs)=>LI.el('line',{x1:xs(x0),y1:ys(f(x0)),x2:xs(x1),y2:ys(f(x1)),'stroke-width':2.5,...attrs},g);
  if(W){
   line(-1,1,x=>s.rho*x,{stroke:C.ink,'stroke-width':1.6,'stroke-dasharray':'5 4'});
   line(-1,1,x=>R.pooled.b*x,{stroke:C.rust});
   line(-1,1,x=>R.within.b*x,{stroke:C.blue});
  }else{
   const p=R.pooled,f=x=>p.my+p.b*(x-p.mx);
   line(-0.45,1.45,f,{stroke:C.rust});
  }
  const cap=W?'점 하나는 한 사람의 한 해. 모든 사람이 자기 평균만큼 옮겨짐':'점 하나는 한 사람의 한 해 (가상 자료 16명 × 6년)';
  LI.el('text',{x:L,y:18,'font-size':fs,fill:C.muted,text:n&&W?'각 점을 자기 평균만큼 옮긴 모습':cap},svg);

  const bp=R.pooled.b,bw=R.within.b,rho=s.rho;
  show([
   ['풀링 OLS 기울기',fmt(bp,3),`참 효과와의 차이 ${bp-rho>=0?'+':''}${fmt(bp-rho,3)}`],
   ['개인 내부(within) 기울기',fmt(bw,3),'같은 사람의 가입 변화만 사용',true],
   ['참 노조 효과',fmt(rho,3),null,true],
   ['관측된 가입, 탈퇴 중 응답 오류',R.changes?`${R.fake} / ${R.changes}건`:'변화 없음','실제로는 상태가 바뀌지 않은 경우']]);
  let t;
  const R0=s.m>0?compute({...s,m:0}):R;
  if(s.m>0&&rho>=0.03&&bw<0.8*rho)
   t=`응답 오류가 연도별로 ${pct(s.m,0)}만 있어도 관측된 상태 변화 ${R.changes}건 중 ${R.fake}건이 가짜입니다. 오류가 없을 때와 비교하면 within 기울기는 ${pct(bw/R0.within.b,0)}${R0.pooled.b>0.03?`, 풀링 기울기는 ${pct(bp/R0.pooled.b,0)}`:''} 수준으로 줄었습니다. 가입 상태는 해마다 거의 그대로여서 개인 내부 변동에서 오류가 차지하는 비중이 크고, 그래서 within 기울기가 더 크게 0쪽으로 줄어듭니다.`;
  else if(Math.abs(s.c)<0.1)
   t='능력과 가입의 상관이 0에 가까우면 개인 절편이 가입과 무관해 풀링 기울기와 within 기울기가 거의 같습니다. 이때 고정효과는 편향을 줄이지 않고 정보만 덜 씁니다.';
  else if(s.c>0)
   t='능력이 높은 사람이 노조에 더 많이 있으면 풀링 기울기가 높은 개인 절편까지 노조 효과로 읽어 참 효과보다 커집니다. 개인 평균을 빼면 절편이 사라져 within 기울기가 참 효과 근처로 돌아옵니다.';
  else
   t='능력이 낮은 사람이 노조에 더 많이 있으면 풀링 기울기가 참 효과보다 작아지고, 상관이 충분히 음수이면 부호까지 뒤집힙니다. within 기울기는 절편과 무관하게 참 효과 근처에 머뭅니다.';
  if(W)t+=' 평균을 뺀 그림에서 사람 간 수준 차이는 사라지고, 한 번도 상태가 바뀌지 않은 사람은 가로 0에 모여 within 기울기에 기여하지 않습니다.';
  msg.textContent=t;
 }
 draw(ctl.state);
 st.onResize(()=>draw(ctl.state));
});
