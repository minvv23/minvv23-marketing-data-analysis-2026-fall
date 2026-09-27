// Staggered adoption with growing effects: the static TWFE coefficient, its Goodman-Bacon decomposition into 2x2 DIDs,
// and a clean-comparison (Callaway-Sant'Anna style) estimate, on a small noiseless balanced panel.
// Untreated outcomes are 0 everywhere (parallel trends hold exactly), so every gap between TWFE and the true ATT
// comes from the comparison structure. Defaults reproduce the three-group example in section 6.2 (TWFE 1.5).
LI.register('staggered-twfe',root=>{
 const {C,fmt,pct}=LI;
 const A0=1; // effect in the adoption period; it then grows by the slope each period.
 const st=LI.stage(root,{width:640,height:520,narrowWidth:360,narrowHeight:640,label:'도입 시점이 다른 코호트의 결과 경로와 TWFE 계수의 Goodman-Bacon 분해'});
 LI.legend(root,[['조기 코호트 k',C.ink],['후기 코호트 l',C.blue],['미처치 U',C.gray],['음의 가중치를 받는 처치 칸',C.rust,false,true],
  ['깨끗한 2x2 비교',C.muted,false,true],['이미 처치된 집단이 비교집단인 2x2',C.rust],['그 2x2 처치집단의 실제 평균효과',C.ink,false,true]]);
 const show=LI.readout(root);
 const msg=LI.note(root,'');
 const ctl=LI.controls(root,[
  {key:'T',label:'관측 기간 (기)',min:5,max:10,step:1,value:5},
  {key:'Gk',label:'조기 코호트 k의 도입 시점',min:2,max:10,step:1,value:2,format:v=>`${v}기`},
  {key:'Gl',label:'후기 코호트 l의 도입 시점',min:2,max:10,step:1,value:4,format:v=>`${v}기`},
  {key:'b',label:'도입 후 효과의 연간 증가 (첫해 효과 1)',min:0,max:4,step:0.5,value:2,format:v=>fmt(v,1)},
  {key:'nU',label:'미처치 집단 U의 단위 수 (k, l은 각 1)',min:1,max:10,step:1,value:1},
  {key:'withU',label:'한 번도 처치되지 않는 집단 U 포함',type:'toggle',value:true}],update);

 const eff=(G,t)=>G!=null&&t>=G?A0+ctl.state.b*(t-G):0;
 const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:NaN;
 const range=(a,b)=>{const r=[];for(let t=a;t<=b;t++)r.push(t);return r};

 function compute(s){
  const T=s.T,Gk=s.Gk,Gl=s.Gl,nU=s.withU?s.nU:0;
  const groups=[{key:'U',G:null,n:nU},{key:'k',G:Gk,n:1},{key:'l',G:Gl,n:1}].filter(g=>g.n>0);
  const N=groups.reduce((p,g)=>p+g.n,0),ts=range(1,T);
  // Frisch-Waugh-Lovell on the balanced panel: double-demeaned treatment, then delta = sum(D~ Y) / sum(D~^2).
  const D=(g,t)=>g.G!=null&&t>=g.G?1:0;
  const Di=g=>mean(ts.map(t=>D(g,t))),Dt=t=>groups.reduce((p,g)=>p+g.n*D(g,t),0)/N;
  const Dbar=groups.reduce((p,g)=>p+g.n*Di(g),0)/N;
  let sxy=0,sxx=0;const cells=[];
  for(const g of groups)for(const t of ts){
   const dd=D(g,t)-Di(g)-Dt(t)+Dbar,y=eff(g.G,t);
   sxy+=g.n*dd*y;sxx+=g.n*dd*dd;cells.push({g:g.key,t,dd,treated:D(g,t)===1});
  }
  const twfe=sxx>1e-12?sxy/sxx:NaN;
  for(const c of cells)c.w=sxx>1e-12?c.dd/sxx:NaN;
  const negCells=cells.filter(c=>c.treated&&c.w<-1e-12);

  // Goodman-Bacon (2021) decomposition with one never-treated group and two timing groups (eqs. 10e-10g).
  const comps=[],share=n=>n/N;
  const sU=share(nU);
  const win=(G,a,b)=>({pre:range(a,G-1),post:range(G,b)});
  const did=(Gt,Gc,a,b,G)=>{const w=win(G,a,b);
   return {est:(mean(w.post.map(t=>eff(Gt,t)))-mean(w.pre.map(t=>eff(Gt,t))))-(mean(w.post.map(t=>eff(Gc,t)))-mean(w.pre.map(t=>eff(Gc,t)))),
    att:mean(w.post.map(t=>eff(Gt,t))),dComp:mean(w.post.map(t=>eff(Gc,t)))-mean(w.pre.map(t=>eff(Gc,t)))}};
  if(Gk===Gl){
   // One adoption date: the two cohorts form a single timing group, compared only with U.
   if(nU>0){const D1=(T-Gk+1)/T,sg=share(2),r=sg/(sg+sU);
    comps.push({name:'k, l 대 U',desc:'미처치 U와 비교, 전 기간',raw:(sg+sU)**2*r*(1-r)*D1*(1-D1),bad:false,...did(Gk,null,1,T,Gk)})}
  }else{
   const sk=share(1),sl=share(1),Dk=(T-Gk+1)/T,Dl=(T-Gl+1)/T;
   if(nU>0){
    for(const [nm,G,sg,Dg] of [['k',Gk,sk,Dk],['l',Gl,sl,Dl]]){const r=sg/(sg+sU);
     comps.push({name:`${nm} 대 U`,desc:'미처치 U와 비교, 전 기간',raw:(sg+sU)**2*r*(1-r)*Dg*(1-Dg),bad:false,...did(G,null,1,T,G)})}
   }
   const r=sk/(sk+sl);
   comps.push({name:'k 대 l',desc:`아직 미처치인 l과 비교, 1-${Gl-1}기`,raw:((sk+sl)*(1-Dl))**2*r*(1-r)*((Dk-Dl)/(1-Dl))*((1-Dk)/(1-Dl)),bad:false,...did(Gk,Gl,1,Gl-1,Gk)});
   comps.push({name:'l 대 k',desc:`이미 처치된 k와 비교, ${Gk}-${T}기`,raw:((sk+sl)*Dk)**2*r*(1-r)*(Dl/Dk)*((Dk-Dl)/Dk),bad:true,...did(Gl,Gk,Gk,T,Gl)});
  }
  const rawSum=comps.reduce((p,c)=>p+c.raw,0);
  for(const c of comps)c.w=rawSum>0?c.raw/rawSum:NaN;
  const bacon=comps.reduce((p,c)=>p+c.w*c.est,0);
  const vwatt=comps.reduce((p,c)=>p+c.w*c.att,0),dATT=comps.filter(c=>c.bad).reduce((p,c)=>p+c.w*c.dComp,0);
  const bad=comps.find(c=>c.bad);

  // True effects: cell average and cohort average (k and l have the same size, so cohort weights are equal).
  const kv=range(Gk,T).map(t=>eff(Gk,t)),lv=range(Gl,T).map(t=>eff(Gl,t));
  const attCell=mean(kv.concat(lv)),attCohort=(mean(kv)+mean(lv))/2;
  // Clean comparisons only: ATT(g,t) against units still untreated at t (never-treated U or the not-yet-treated cohort),
  // base period g-1. With noiseless data each identified cell equals its true effect; cells without a clean comparison drop out.
  const csCoh=[];let idCells=0,allCells=0;
  for(const [G,G2] of [[Gk,Gl],[Gl,Gk]]){
   const vals=[];
   for(const t of range(G,T)){
    allCells++;
    const ctrl=[];if(nU>0)ctrl.push([null,nU]);if(G2>t)ctrl.push([G2,1]);
    if(!ctrl.length)continue;
    const dC=ctrl.reduce((p,[g2,n])=>p+n*(eff(g2,t)-eff(g2,G-1)),0)/ctrl.reduce((p,[,n])=>p+n,0);
    vals.push(eff(G,t)-eff(G,G-1)-dC);idCells++;
   }
   if(vals.length)csCoh.push(mean(vals));
  }
  const cs=csCoh.length?mean(csCoh):NaN;
  return {T,Gk,Gl,nU,groups,cells,twfe,bacon,comps,vwatt,dATT,bad,negCells,attCell,attCohort,cs,idCells,allCells,maxY:Math.max(...kv,...lv)};
 }

 // Keep 2 <= Gk <= Gl <= T. When the sliders cross, the one that did not move follows the one that did.
 let prev=null;
 function update(s){
  const iK=ctl.inputs.Gk,iL=ctl.inputs.Gl;iK.max=s.T;iL.max=s.T;
  let Gk=Math.min(s.Gk,s.T),Gl=Math.min(s.Gl,s.T);
  if(Gk>Gl){if(prev&&s.Gl!==prev.Gl&&s.Gk===prev.Gk)Gk=Gl;else Gl=Gk}
  if(Gk!==s.Gk){ctl.set('Gk',Gk);return}
  if(Gl!==s.Gl){ctl.set('Gl',Gl);return}
  ctl.inputs.nU.disabled=!s.withU;ctl.inputs.nU.closest('label').style.opacity=s.withU?1:.45;
  prev={...s};draw(s);
 }

 const niceStep=span=>{const raw=span/4,p=10**Math.floor(Math.log10(raw)),m=raw/p;return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p};
 function ticksFor(lo,hi){const step=niceStep(hi-lo||1),out=[];for(let v=Math.ceil(lo/step-1e-9)*step;v<=hi+1e-9;v+=step)out.push(+v.toFixed(6));return out}

 function draw(s){
  st.layout();
  const R=compute(s),n=st.narrow;
  const rows=Math.max(1,R.comps.length);
  const pathTop=n?40:36,pathBot=n?232:222;
  const decTop=pathBot+(n?92:78),rowH=n?74:48;
  st.layout(decTop+rows*rowH+(n?40:34));
  const svg=st.svg,fs=n?14:13,W=st.width;
  // ---- Panel 1: outcome paths by cohort
  const L=n?40:48,Rr=W-(n?30:40);
  const xs=LI.scale([1,R.T],[L+10,Rr]);
  const yMax=Math.max(2,Math.ceil(R.maxY)),yt=ticksFor(0,yMax);if(yt[yt.length-1]<yMax-1e-9)yt.push(+(yt[yt.length-1]+(yt[1]-yt[0])).toFixed(6));const ys=LI.scale([0,yt[yt.length-1]],[pathBot,pathTop+8]);
  LI.el('text',{x:0,y:16,'font-size':fs,fill:C.ink,'font-weight':600,text:n?'코호트별 결과 (미처치 결과는 모두 0)':'코호트별 결과 경로 (처치가 없으면 모든 집단의 결과가 0, 평행추세 성립)'},svg);
  LI.axis(svg,ys,{side:'left',at:L,ticks:yt,format:v=>fmt(v,v%1?1:0),size:fs});
  LI.axis(svg,xs,{side:'bottom',at:pathBot,ticks:range(1,R.T),format:v=>n&&R.T>7?`${v}`:`${v}기`,size:fs});
  // Adoption dates.
  const marks=R.Gk===R.Gl?[[R.Gk,'k, l 도입',C.ink]]:[[R.Gk,'k 도입',C.ink],[R.Gl,'l 도입',C.blue]];
  const half=(xs(2)-xs(1))/2,stackL=marks.length>1&&xs(R.Gl)-xs(R.Gk)<(n?62:58);
  marks.forEach(([G,t,col],j)=>{const x=xs(G)-half,ly=pathTop+2+(j&&stackL?17:0);
   LI.el('line',{x1:x,x2:x,y1:ly+4,y2:pathBot,stroke:col,'stroke-dasharray':'3 4','stroke-width':1.2,opacity:.7},svg);
   LI.el('text',{x:x+4,y:ly,'font-size':fs,fill:col,text:t},svg)});
  const pathOf=G=>range(1,R.T).map(t=>[xs(t),ys(eff(G,t))]);
  const lines=[];
  if(R.nU>0)lines.push({key:'U',G:null,col:C.gray,label:n?'U':`U (${R.nU}단위)`});
  lines.push({key:'l',G:R.Gl,col:C.blue,label:'l'},{key:'k',G:R.Gk,col:C.ink,label:'k'});
  for(const ln of lines){LI.polyline(svg,pathOf(ln.G),{stroke:ln.col,'stroke-width':ln.key==='U'?3.5:2.5});
   for(const t of range(1,R.T))LI.el('circle',{cx:xs(t),cy:ys(eff(ln.G,t)),r:3.5,fill:ln.col},svg)}
  // Treated cells whose TWFE weight is negative: rust rings.
  for(const c of R.negCells){const G=c.g==='k'?R.Gk:R.Gl;
   LI.el('circle',{cx:xs(c.t),cy:ys(eff(G,c.t)),r:8,fill:'none',stroke:C.rust,'stroke-width':2},svg)}
  // End labels, pushed apart vertically.
  const ends=lines.map(ln=>({y:ys(eff(ln.G,R.T)),t:ln.label,c:ln.col})).sort((a,b)=>a.y-b.y);
  for(let k=1;k<ends.length;k++)if(ends[k].y-ends[k-1].y<16)ends[k].y=ends[k-1].y+16;
  const over=ends[ends.length-1].y-(pathBot+4);if(over>0)for(const e of ends)e.y-=over;
  for(const e of ends)LI.el('text',{x:Rr+8,y:e.y+5,'font-size':fs,fill:e.c,'font-weight':600,text:e.t},svg);

  // ---- Panel 2: Goodman-Bacon decomposition
  const hY=pathBot+(n?66:64);
  LI.el('text',{x:0,y:hY-(n?20:18),'font-size':fs,fill:C.ink,'font-weight':600,text:n?'TWFE = 2x2 비교들의 가중평균':'Goodman-Bacon 분해: TWFE 계수는 2x2 DID들의 가중평균'},svg);
  const wx0=n?0:206,wx1=n?128:356,dx0=n?150:392,dx1=W-(n?4:10);
  LI.el('text',{x:wx0,y:hY,'font-size':fs,fill:C.muted,text:'가중치'},svg);
  LI.el('text',{x:dx0,y:hY,'font-size':fs,fill:C.muted,text:'2x2 추정치'},svg);
  if(!R.comps.length){
   LI.el('text',{x:0,y:decTop+22,'font-size':fs,fill:C.muted,text:'처치 변수가 고정효과로 모두 흡수되어 TWFE를 계산할 수 없습니다.'},svg);
  }else{
   const vals=R.comps.flatMap(c=>[c.est,c.att]).concat([0]);
   let lo=Math.min(...vals),hi=Math.max(...vals);const pad=(hi-lo||1)*.08;lo-=lo<0?pad:0;hi+=pad;
   const dxs=LI.scale([lo,hi],[dx0+(n?4:6),dx1-(n?34:40)]),wxs=LI.scale([0,1],[wx0,wx1-(n?40:46)]);
   const zx=dxs(0);
   LI.el('line',{x1:zx,x2:zx,y1:decTop-6,y2:decTop+rows*rowH-8,stroke:C.muted,'stroke-width':1},svg);
   LI.el('text',{x:zx,y:decTop+rows*rowH+10,'text-anchor':'middle','font-size':fs,fill:C.muted,text:'0'},svg);
   R.comps.forEach((c,i)=>{
    const y=decTop+i*rowH,col=c.bad?C.rust:C.ink;
    const by=n?y+30:y+2,bh=n?18:18;
    // Label and window.
    LI.el('text',{x:0,y:n?y+4:y+11,'font-size':fs,fill:col,'font-weight':600,text:c.name+(n?`  ${c.desc}`:'')},svg);
    if(!n)LI.el('text',{x:0,y:y+29,'font-size':fs-0.5,fill:C.muted,text:c.desc},svg);
    // Weight bar.
    LI.el('rect',{x:wx0,y:by,width:wxs(1)-wx0,height:bh,fill:'none',stroke:C.line},svg);
    LI.el('rect',{x:wx0,y:by,width:Math.max(0,wxs(c.w)-wx0),height:bh,fill:c.bad?C.rust:C.pale,stroke:c.bad?C.rust:C.muted,'stroke-width':1},svg);
    LI.el('text',{x:wxs(1)+5,y:by+bh-4,'font-size':fs,fill:col,text:pct(c.w,1)},svg);
    // DID bar from zero, with the treated group's true mean effect in the same window as a hollow dot.
    const x1=dxs(c.est);
    LI.el('rect',{x:Math.min(zx,x1),y:by,width:Math.max(1.5,Math.abs(x1-zx)),height:bh,fill:c.bad?C.rust:C.pale,stroke:c.bad?C.rust:C.muted,'stroke-width':1},svg);
    LI.el('circle',{cx:dxs(c.att),cy:by+bh/2,r:5.5,fill:'var(--bg)',stroke:C.ink,'stroke-width':2},svg);
    const lx=Math.max(x1,zx,dxs(c.att))+9;
    LI.el('text',{x:lx,y:by+bh-4,'font-size':fs,fill:col,'font-weight':600,text:fmt(c.est,2)},svg);
   });
   const terms=R.comps.map(c=>`${fmt(c.w,3)}×${c.est<0?`(${fmt(c.est,2)})`:fmt(c.est,2)}`).join(' + ');
   LI.el('text',{x:0,y:decTop+rows*rowH+(n?30:24),'font-size':fs,fill:C.ink,text:n?`가중치를 곱해 더하면 ${fmt(R.bacon,2)} = TWFE`:`가중합 ${terms} = ${fmt(R.bacon,2)} = TWFE`},svg);
  }

  // ---- Readout
  const negList=R.negCells.map(c=>`${c.g}의 ${c.t}기`).join(', ');
  show([
   ['TWFE 계수',fmt(R.twfe,2),'Y = 단위 고정효과 + 기간 고정효과 + δD에서 δ',true],
   ['참 평균효과 (코호트 평균)',fmt(R.attCohort,2),`처치 칸 단순평균 ${fmt(R.attCell,2)}`,true],
   ['깨끗한 비교만 쓴 추정치 (CS 방식)',fmt(R.cs,2),`처치 칸 ${R.allCells}개 중 ${R.idCells}개 식별, 코호트 평균`],
   ['l 대 k 비교의 가중치',R.bad?pct(R.bad.w,1):'없음',R.bad?`이미 처치된 k가 비교집단, 이 2x2 추정치 ${fmt(R.bad.est,2)}`:'도입 시점이 하나라 이 비교가 생기지 않음'],
   ['편향 분해 VWATT - ΔATT',R.comps.length?`${fmt(R.vwatt,2)} - ${fmt(R.dATT,2)}`:'정의되지 않음','평행추세가 성립해 VWCT = 0'],
   ['음의 가중치를 받는 처치 칸',R.negCells.length?`${R.negCells.length}칸`:'없음',R.negCells.length?negList:null]]);

  // ---- Note
  let t;
  if(!Number.isFinite(R.twfe))
   t='두 코호트가 같은 시점에 도입하고 미처치 집단도 없으면 처치 여부가 기간 고정효과와 완전히 겹쳐 TWFE 계수가 정의되지 않습니다.';
  else if(R.Gk===R.Gl)
   t=`도입 시점이 하나이면 비교집단은 미처치 U뿐이고, TWFE(${fmt(R.twfe,2)})는 처치 칸 단순평균(${fmt(R.attCell,2)})과 같습니다. 효과가 해마다 커져도 이미 처치된 비교집단이 없으므로 편향이 생기지 않습니다.`;
  else if(s.b===0)
   t=`효과가 도입 후 일정하고 두 코호트에서 같으면(모두 ${fmt(A0,0)}) 이미 처치된 k와 비교한 2x2도 k의 변화가 0이라 올바른 값을 내고, TWFE가 참효과와 같습니다. 기울기를 올리면 그 2x2부터 무너집니다.`;
  else if(R.twfe<0)
   t=`모든 처치 칸의 효과가 ${fmt(A0,0)} 이상인데 TWFE는 음수(${fmt(R.twfe,2)})입니다. 이미 처치된 k를 비교집단으로 쓰는 l 대 k 비교가 가중치 ${pct(R.bad.w,0)}를 받고, 이 비교는 l의 개선에서 같은 기간 k의 효과 증가분(${fmt(R.bad.dComp,2)})을 빼므로 음수(${fmt(R.bad.est,2)})가 됩니다.`;
  else if(R.twfe<R.attCohort/2)
   t=`TWFE(${fmt(R.twfe,2)})는 참 평균효과(${fmt(R.attCohort,2)})의 절반에도 못 미칩니다. 평행추세가 완벽해도 이미 처치된 k를 비교집단으로 쓰는 2x2가 계수를 ΔATT에 해당하는 크기(${fmt(R.dATT,2)})만큼 끌어내립니다.`;
  else
   t=`TWFE(${fmt(R.twfe,2)})와 참 평균효과(${fmt(R.attCohort,2)})의 차이 가운데 ΔATT에 해당하는 부분(${fmt(R.dATT,2)})은 이미 처치된 k를 비교집단으로 쓴 데서, 나머지는 OLS가 분산 기준으로 코호트를 가중한 데서 생깁니다. U의 단위 수를 늘리면 l 대 k 비교의 가중치가 줄어듭니다.`;
  if(Number.isFinite(R.twfe)&&R.nU===0&&R.idCells<R.allCells)
   t+=` 미처치 집단이 없으면 ${R.Gl}기부터는 깨끗한 비교집단이 없어, CS 방식 추정치는 식별되는 ${R.idCells}칸만 평균합니다(참 평균효과와 대상이 다름).`;
  msg.textContent=t;
 }
 update(ctl.state);
 st.onResize(()=>draw(ctl.state));
});
