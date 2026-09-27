// Gordon et al. (2019): why comparing exposed with unexposed users inflates ad lift, and how the
// randomized control group recovers the exposed users' counterfactual by the share argument (Figure 7).
// Population model (no sampling noise). Each user has a baseline conversion propensity s ~ N(0,1) and a
// baseline rate m*exp(s - 1/2), so the average baseline rate is m. In the test group the ad is shown when
// rho*s + sqrt(1-rho^2)*e exceeds the cutoff that gives exposure rate p (rho = targeting strength).
// The ad multiplies an exposed user's rate by (1+L). An observed covariate X carries the share r of s
// (s = sqrt(r) X + sqrt(1-r) U); matching on X removes only that part of the selection.
LI.register('ad-exposure-lift',root=>{
 const {C,fmt,pct}=LI;
 const M=0.033,BETA=1; // control conversion rate of Study 4 in %, spread of baseline propensity (assumed)
 // Normal tail via erfc with small relative error in the tails (Numerical Recipes erfcc).
 const erfc=z=>{const a=Math.abs(z),t=1/(1+.5*a);
  const r=t*Math.exp(-a*a-1.26551223+t*(1.00002368+t*(.37409196+t*(.09678418+t*(-.18628806+t*(.27886807+t*(-1.13520398+t*(1.48851587+t*(-.82215223+t*.17087277)))))))));
  return z>=0?r:2-r};
 const sf=z=>.5*erfc(z/Math.SQRT2),cdf=z=>sf(-z);
 // Inverse normal CDF (Acklam).
 function ppf(q){
  const a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.357751867269,-30.66479806614716,2.506628277459239],
   b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572],
   c=[-.007784894002430293,-.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783],
   d=[.007784695709041462,.3224671290700398,2.445134137142996,3.754408661907416],lo=.02425;
  if(q<lo){const t=Math.sqrt(-2*Math.log(q));return(((((c[0]*t+c[1])*t+c[2])*t+c[3])*t+c[4])*t+c[5])/((((d[0]*t+d[1])*t+d[2])*t+d[3])*t+1)}
  if(q>1-lo){const t=Math.sqrt(-2*Math.log(1-q));return-(((((c[0]*t+c[1])*t+c[2])*t+c[3])*t+c[4])*t+c[5])/((((d[0]*t+d[1])*t+d[2])*t+d[3])*t+1)}
  const t=q-.5,u=t*t;return(((((a[0]*u+a[1])*u+a[2])*u+a[3])*u+a[4])*u+a[5])*t/(((((b[0]*u+b[1])*u+b[2])*u+b[3])*u+b[4])*u+1);
 }
 // Integrate over the observed covariate X on a fixed grid; the unobserved part is integrated in closed form.
 const GRID=Array.from({length:281},(_,i)=>-7+i*.05),W0=GRID.map(x=>Math.exp(-x*x/2)),WS=W0.reduce((a,b)=>a+b,0),WG=W0.map(w=>w/WS);
 function model({p,L,rho,r}){
  const c=ppf(1-p),sw=Math.sqrt(1-rho*rho*r),sr=Math.sqrt(r);
  let e1=0,e0=0,em=0;
  GRID.forEach((x,i)=>{
   const a=(rho*sr*x-c)/sw,a2=a+rho*BETA*(1-r)/sw,base=Math.exp(BETA*sr*x-BETA*BETA*r/2),w=WG[i];
   const tail=sf(a);
   e1+=w*base*cdf(a2);e0+=w*base*sf(a2);
   if(tail>1e-300)em+=w*cdf(a)*base*sf(a2)/tail; // exposed share at x times unexposed mean rate at x
  });
  const mu0E=M*e1/p,m10=M*e0/(1-p),muM=M*em/p,m11=(1+L)*mu0E,m0=M,mT=p*m11+(1-p)*m10;
  const itt=mT-m0,muC0=(m0-(1-p)*m10)/p,att=m11-muC0;
  const eu=m11/m10-1,match=m11/muM-1,gap=Math.abs(eu-L);
  return {mu0E,m10,muM,m11,m0,mT,itt,ittLift:itt/m0,muC0,att,attLift:att/muC0,eu,match,brr:gap>1e-9?Math.abs(match-L)/gap:NaN};
 }

 const st=LI.stage(root,{width:640,height:330,narrowWidth:360,narrowHeight:620,label:'Study 4 구조의 네 칸 전환율과 실험, 관측 방법별 lift 비교'});
 LI.legend(root,[['test 노출자',C.blue],['test 비노출자',C.gray],['노출자의 반사실 = control 중 노출되었을 사람 (역산)',C.rust,true],['control 중 노출되지 않았을 사람 (가정)',C.gray,true]]);
 const show=LI.readout(root);
 const note=LI.note(root,'');
 const ctl=LI.controls(root,[
  {key:'p',label:'test 집단 노출률',min:.05,max:.95,step:.01,value:.37,format:v=>pct(v,0)},
  {key:'L',label:'광고의 실제 효과 (노출자 lift)',min:-.2,max:1.5,step:.01,value:.73,format:v=>pct(v,0)},
  {key:'rho',label:'타기팅 강도 (노출과 기본 전환 성향의 상관)',min:-.5,max:.9,step:.01,value:.37,format:v=>fmt(v,2)},
  {key:'r',label:'관측 공변량이 설명하는 선택의 비율',min:0,max:1,step:.01,value:.78,format:v=>pct(v,0)}],draw);

 // Round tiny values to zero so the display never shows '-0.000'.
 const z=(v,d)=>Math.abs(v)<.5*Math.pow(10,-d)?0:v;
 const rate=v=>fmt(z(v,3),3)+'%';
 const lift=v=>pct(z(v,3),Math.abs(v)>=10?0:1);
 // Text with a background-coloured outline so dotted guide lines never run through the numbers.
 const HALO={stroke:'var(--bg)','stroke-width':4,'paint-order':'stroke','stroke-linejoin':'round'};
 function niceMax(v){const e=Math.pow(10,Math.floor(Math.log10(v))),f=v/e;return(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*e}

 function drawRates(g,d,s,{x0,y0,w,base,fs}){
  const top=y0+46,ymax=niceMax(Math.max(d.m11,d.muC0,d.m10,d.mT)*1.12),y=LI.scale([0,ymax],[base,top]);
  LI.el('text',{x:x0,y:y0+4,'font-size':fs,fill:C.ink,'font-weight':600,text:'전환율 (%): 원문 Figure 7의 네 칸'},g);
  LI.el('text',{x:x0,y:y0+24,'font-size':fs-1,fill:C.muted,text:'막대 아래 숫자는 집단 안의 비중'},g);
  const ax=x0+44,dec=ymax<.1?3:ymax<1?2:1;
  LI.axis(g,y,{side:'left',at:ax,ticks:[0,ymax/2,ymax],format:v=>fmt(v,dec),size:fs-1});
  const bw=w<340?40:46,span=w-(ax-x0)-10,cx=k=>ax+span*(k<2?[.2,.44][k]:[.68,.9][k-2]);
  const bars=[
   {v:d.m11,fill:C.blue,share:s.p},
   {v:d.m10,fill:C.gray,share:1-s.p},
   {v:d.muC0,stroke:C.rust,share:s.p},
   {v:d.m10,stroke:C.gray,share:1-s.p}];
  // Group means. In the control group only this overall mean is observed directly.
  [[0,1,'test 집단',d.mT],[2,3,'control 집단',d.m0]].forEach(([a,b,label,v])=>{
   const x1=cx(a)-bw/2-6,x2=cx(b)+bw/2+6,ym=y(v),mid=(cx(a)+cx(b))/2;
   LI.el('line',{x1,x2,y1:ym,y2:ym,stroke:C.ink,'stroke-width':1.2,'stroke-dasharray':'1 3'},g);
   LI.el('text',{x:mid,y:base+38,'text-anchor':'middle','font-size':fs,fill:C.ink,text:label},g);
   LI.el('text',{x:mid,y:base+56,'text-anchor':'middle','font-size':fs-1,fill:C.muted,text:'전체 '+rate(v)+' (점선)'},g);
  });
  bars.forEach((b,k)=>{
   const x=cx(k)-bw/2,h=Math.max(0,base-y(b.v));
   LI.el('rect',{x,y:base-h,width:bw,height:h,fill:b.fill||'none',stroke:b.stroke||'none','stroke-width':b.stroke?2:0,'stroke-dasharray':b.stroke?'5 3':null},g);
   // For the exposed bar keep the number clear of the counterfactual line when the effect is negative.
   const ty=k===0?Math.min(base-h,y(d.muC0))-6:base-h-6;
   LI.el('text',{x:cx(k),y:ty,'text-anchor':'middle','font-size':fs-1,fill:C.ink,...HALO,text:rate(b.v)},g);
   LI.el('text',{x:cx(k),y:base+18,'text-anchor':'middle','font-size':fs-1,fill:C.muted,text:pct(b.share,0)},g);
  });
  // The counterfactual of the exposed users equals the back-solved control cell; draw both at the same height.
  const yc=y(d.muC0);
  LI.el('line',{x1:cx(0)-bw/2-4,x2:cx(0)+bw/2+4,y1:yc,y2:yc,stroke:C.rust,'stroke-width':2.5,'stroke-dasharray':'6 3'},g);
  LI.el('line',{x1:cx(0)+bw/2+4,x2:cx(2)-bw/2,y1:yc,y2:yc,stroke:C.rust,'stroke-width':1,'stroke-dasharray':'2 4',opacity:.7},g);
 }

 function drawLifts(g,d,s,{x0,y0,w,fs}){
  LI.el('text',{x:x0,y:y0+4,'font-size':fs,fill:C.ink,'font-weight':600,text:'lift 비교 (%)'},g);
  const rows=[
   ['실험: ITT lift (control 전체 대비)',d.ittLift,C.blue,true],
   ['실험: 노출자 ATT lift (역산)',d.attLift,C.blue,false],
   ['관측: 매칭 후 lift',d.match,C.gray,true],
   ['관측: 단순 비교 (E-U)',d.eu,C.gray,false]];
  const vals=rows.map(r=>r[1]).concat([s.L]),lo=Math.min(0,...vals),hi=Math.max(0,...vals);
  const pad=fs*4.2,x=LI.scale([lo,hi===lo?1:hi],[x0+(lo<0?pad:0),x0+w-pad]);
  const rowH=fs*4,top=y0+20,bottom=top+rows.length*rowH;
  rows.forEach(([label,v,color,hollow],i)=>{
   const ty=top+i*rowH+fs,by=ty+7,bh=fs+5,xa=Math.min(x(0),x(v)),wd=Math.abs(x(v)-x(0));
   LI.el('text',{x:x0,y:ty,'font-size':fs-1,fill:C.muted,text:label},g);
   // Zero line and the true-effect line are drawn only beside the bars, so they never cross the row labels.
   LI.el('line',{x1:x(0),x2:x(0),y1:by-4,y2:by+bh+4,stroke:C.line,'stroke-width':1.5},g);
   LI.el('line',{x1:x(s.L),x2:x(s.L),y1:by-4,y2:by+bh+(i===rows.length-1?10:4),stroke:C.ink,'stroke-width':1.5,'stroke-dasharray':'4 3'},g);
   LI.el('rect',{x:xa,y:by,width:Math.max(wd,1),height:bh,fill:hollow?'none':color,stroke:color,'stroke-width':2},g);
   LI.el('text',{x:v>=0?x(v)+6:x(v)-6,y:by+bh-4,'text-anchor':v>=0?'start':'end','font-size':fs,fill:C.ink,'font-weight':600,...HALO,text:lift(v)},g);
  });
  const lx=x(s.L),anchor=lx>x0+w-60?'end':lx<x0+60?'start':'middle';
  LI.el('text',{x:lx,y:bottom+20,'text-anchor':anchor,'font-size':fs-1,fill:C.ink,text:'실제 효과 '+lift(s.L)},g);
 }

 function draw(s){
  st.layout();
  const d=model(s),g=st.svg;
  if(st.narrow){
   drawRates(g,d,s,{x0:8,y0:14,w:344,base:252,fs:14});
   drawLifts(g,d,s,{x0:8,y0:346,w:344,fs:14});
  }else{
   drawRates(g,d,s,{x0:4,y0:14,w:340,base:252,fs:14});
   drawLifts(g,d,s,{x0:368,y0:14,w:268,fs:14});
  }
  show([
   ['ITT: test 전체 대 control 전체',fmt(d.itt,3)+'%p','ITT lift '+lift(d.ittLift)+', 분모는 control 전체 '+rate(d.m0)],
   ['노출자 ATT = ITT ÷ 노출률',fmt(d.att,3)+'%p','반사실 '+rate(d.muC0)+'를 역산, lift '+lift(d.attLift),true],
   ['매칭 후 관측 lift',lift(d.match),'노출자의 반사실을 '+rate(d.muM)+'로 둔 셈'],
   ['단순 비교 (E-U) lift',lift(d.eu),'test 비노출자 '+rate(d.m10)+'를 반사실로 사용'],
   ['매칭 후 남은 편향 비율 (brr)',Number.isFinite(d.brr)?pct(d.brr,0):'정의되지 않음','|매칭 lift - 실제| ÷ |E-U lift - 실제|, 원문 Table 6']]);
  const neutral=Math.abs(s.rho)<.005,noEffect=Math.abs(s.L)<.005;
  note.textContent=neutral
   ?'노출이 기본 전환 성향과 무관하면 test 비노출자가 곧 좋은 비교집단이 되어, 단순 비교와 매칭 모두 실험 lift와 같아집니다. 선택편향은 노출과 기본 전환율의 상관에서만 생깁니다.'
   :noEffect
   ?`광고 효과가 0인데도 단순 비교는 ${lift(d.eu)}, 매칭 후에도 ${lift(d.match)}의 lift를 보고합니다. 이 값은 전부 누가 노출되었는가에서 나온 선택편향입니다. 실험의 ITT와 ATT는 0입니다.`
   :s.rho<0
   ?'노출이 기본 전환율이 낮은 사용자에게 몰리면 관측 lift가 실험보다 작아집니다. 원문은 클릭을 최적화한 캠페인이 클릭은 잘 하지만 구매는 덜 하는 사용자에게 광고를 몰아주는 경우를 예로 듭니다. 편향의 방향은 선택의 방향을 따르므로 하나의 보정계수로 고칠 수 없습니다.'
   :s.r>=.995
   ?'관측 공변량이 선택을 모두 설명하면 매칭 lift가 실험 lift와 같아집니다. 원문은 이 조건(비교란성)을 실험 없이는 확인할 수 없다고 강조합니다.'
   :s.p<.15
   ?`노출률이 ${pct(s.p,0)}로 낮으면 노출자가 기본 전환 성향 분포의 위쪽에 더 몰려 단순 비교의 편향이 커집니다. 원문 Study 9는 노출률 6.6%에서 E-U lift 4,074%, 실험 lift 2.4%였습니다.`
   :`매칭은 관측 공변량이 설명하는 선택만 제거합니다. 남은 편향은 관측되지 않은 전환 성향에서 나오며 표본을 늘려도 줄지 않습니다. 실험은 control 전체 평균과 노출률만으로 노출자의 반사실 ${rate(d.muC0)}를 복원합니다.`;
 }
 draw(ctl.state);
 st.onResize(()=>draw(ctl.state));
});
