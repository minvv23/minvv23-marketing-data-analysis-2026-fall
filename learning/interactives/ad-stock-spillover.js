// Shapiro (2018): advertising stock with a concave monthly transform and geometric carry-over.
// Two symmetric firms. The market stage transforms the SUM of both firms' monthly ads and carries it over
// with lambda_l; the brand stage transforms each firm's own ads and carries them over with lambda_p.
// The reader moves the retention rates, the curvature of the transform, how a fixed yearly budget is timed,
// the spillover ratio rho and the rival's monthly ads, and sees stocks, prescriptions and who gains.
LI.register('ad-stock-spillover',root=>{
 const {C,fmt,pct}=LI;
 const T=36,YEAR=12,BUDGET=12,BASE=100;      // months shown, ad year, yearly budget ($ per 100 people), baseline monthly Rx
 const GM=.0496;                              // Table 5 market-stage coefficient, used as the log-demand effect of the market stock
 const KS=[1,2,3,4,6,12];
 const patName=k=>k===1?'한 달 집중':k===12?'12개월 고르게 분산':`${k}개월 분산`;

 // Concave transform of one month's spending. kappa = 1 is the paper's log(1+a); kappa = 0 is no transform.
 const f=(a,kap)=>Math.abs(kap-1)<1e-9?Math.log1p(a):(Math.pow(1+a,1-kap)-1)/(1-kap);
 // Stock recursion A_t = f(a_t) + lambda * A_{t-1}, starting from zero.
 const stock=(x,lam)=>{let s=0;return x.map(v=>s=v+lam*s)};
 // The yearly budget split into k equal pulses spaced evenly through months 1-12.
 const spend=k=>{const a=Array(T).fill(0),step=YEAR/k;for(let i=0;i<k;i++)a[i*step]=BUDGET/k;return a};

 function sim(k,{ll,lp,kap,rho,aK}){
  const gB=GM*(1-rho)/(1+rho);                // brand-stage weight implied by rho = (GM - gB)/(GM + gB)
  const aJ=spend(k),aR=Array.from({length:T},(_,t)=>t<YEAR?aK:0);
  const Al=stock(aJ.map((v,t)=>f(v+aR[t],kap)),ll);    // market stock, both firms
  const Al0=stock(aR.map(v=>f(v,kap)),ll);             // market stock without my ads
  const AlJ=stock(aJ.map(v=>f(v,kap)),ll);             // market stock without the rival's ads
  const AJ=stock(aJ.map(v=>f(v,kap)),lp),AR=stock(aR.map(v=>f(v,kap)),lp);
  const rx=d=>BASE*(Math.exp(d)-1);
  const me=Al.map((v,t)=>rx(GM*(v-Al0[t])+gB*AJ[t]));        // my extra Rx caused by my ads
  const rv=Al.map((v,t)=>rx(GM*(v-Al0[t])-gB*AJ[t]));        // rival's extra Rx caused by my ads
  const fromR=Al.map((v,t)=>rx(GM*(v-AlJ[t])-gB*AR[t]));     // my extra Rx caused by the rival's ads
  let last=0;aJ.forEach((v,t)=>{if(v>0)last=t});
  const sum=(x,a=0)=>x.slice(a).reduce((p,q)=>p+q,0);
  const mine=sum(Al.map((v,t)=>v-Al0[t])),alone=sum(AlJ);
  return {aJ,aR,Al,Al0,AJ,me,rv,fromR,last,
   M:sum(me),R:sum(rv),FR:sum(fromR),meAfter:sum(me,last+1),rvAfter:sum(rv,last+1),
   mktRatio:alone>0?mine/alone:NaN};
 }

 const st=LI.stage(root,{width:640,height:520,narrowWidth:360,narrowHeight:560,label:'월별 광고 지출, 광고 stock, 내 광고가 만든 두 회사의 추가 처방'});
 LI.legend(root,[['내 광고, 내 브랜드 stock, 내 처방',C.blue],['경쟁사 광고, 경쟁사 처방',C.rust],['시장 stock (두 회사 광고의 합)',C.gray],['경쟁사 광고만 있을 때의 시장 stock',C.gray,true],['비교 패턴이었다면 내 처방',C.blue,true]]);
 const show=LI.readout(root);
 const msg=LI.note(root,'');
 const DEF={pat:0,kap:1,ll:.68,lp:.324,rho:.48,aK:1};
 const ctl=LI.controls(root,[
  {key:'pat',label:'집행 패턴 (내 연간 예산 12달러)',min:0,max:5,step:1,value:DEF.pat,format:v=>patName(KS[v])},
  {key:'kap',label:'오목 변환의 곡률 (1이면 원문의 log(1+a))',min:0,max:2,step:.1,value:DEF.kap,format:v=>fmt(v,1)},
  {key:'ll',label:'시장 단계 잔존계수 (원문 .680)',min:0,max:.9,step:.01,value:DEF.ll,format:v=>fmt(v,3)},
  {key:'lp',label:'제품 단계 잔존계수 (원문 .324)',min:0,max:.9,step:.001,value:DEF.lp,format:v=>fmt(v,3)},
  {key:'rho',label:'경쟁사 광고의 파급 비중 (교차 ÷ 자기 효과)',min:-.5,max:1,step:.01,value:DEF.rho,format:v=>fmt(v,2)},
  {key:'aK',label:'경쟁사 월 광고 (1-12월, 100명당)',min:0,max:10,step:.5,value:DEF.aK,format:v=>fmt(v,1)+'달러'}],draw);

 // Round a positive maximum up to a round multiple of a power of ten.
 function nice(v){
  if(!(v>0))return 1;
  const p=Math.pow(10,Math.floor(Math.log10(v))),m=v/p;
  return p*[1,1.5,2,2.5,3,4,5,6,8,10].find(x=>m<=x+1e-9);
 }
 const tickFmt=v=>{const a=Math.abs(v);return fmt(v,Number.isInteger(a)?0:Number.isInteger(a*10)?1:2)};

 function draw(s){
  st.layout();
  const n=st.narrow,fs=n?14:13,fsT=n?15:14;
  const k=KS[s.pat],kc=k===12?1:12;
  const S=sim(k,s),Cm=sim(kc,s);
  const x0=n?44:52,x1=st.width-(n?10:14),bw=(x1-x0)/T,xc=t=>x0+(t+.5)*bw;
  const panels=n?[{t:24,y:40,h:92},{t:176,y:192,h:112},{t:348,y:364,h:128}]:[{t:22,y:38,h:86},{t:170,y:186,h:106},{t:336,y:352,h:118}];

  // Ad months 1-12 shaded across all three panels.
  for(const p of panels)LI.el('rect',{x:x0,y:p.y,width:bw*YEAR,height:p.h,fill:C.pale},st.svg);
  const title=(p,text)=>LI.el('text',{x:n?8:12,y:p.t,'font-size':fsT,fill:C.ink,'font-weight':600,text},st.svg);
  const yAxis=(p,lo,hi)=>{
   const y=LI.scale([lo,hi],[p.y+p.h,p.y]);
   // With a small negative range the 0 label would collide with the lower label, so only the line stays.
   const ticks=lo<0?(y(lo)-y(0)<fs+4?[lo,hi]:[lo,0,hi]):[0,hi/2,hi];
   for(const v of ticks)LI.el('line',{x1:x0,x2:x1,y1:y(v),y2:y(v),stroke:C.line,'stroke-dasharray':'2 4'},st.svg);
   LI.el('line',{x1:x0,x2:x1,y1:y(0),y2:y(0),stroke:C.muted,'stroke-width':1},st.svg);
   LI.axis(st.svg,y,{side:'left',at:x0,ticks,format:tickFmt,size:fs});
   return y;
  };

  // Panel 1: monthly spending, mine beside the rival's.
  const p1=panels[0];
  title(p1,n?'월별 광고 지출 (100명당 달러)':`월별 광고 지출 (인구 100명당 달러). 내 예산은 ${patName(k)}`);
  const y1=yAxis(p1,0,nice(Math.max(BUDGET/k,s.aK)));
  const w=Math.max(1.5,bw*.4);
  for(let t=0;t<T;t++){
   if(S.aJ[t]>0)LI.el('rect',{x:xc(t)-w,y:y1(S.aJ[t]),width:w,height:y1(0)-y1(S.aJ[t]),fill:C.blue},st.svg);
   if(S.aR[t]>0)LI.el('rect',{x:xc(t),y:y1(S.aR[t]),width:w,height:y1(0)-y1(S.aR[t]),fill:C.rust},st.svg);
  }

  // Panel 2: stocks after the transform and carry-over.
  const p2=panels[1];
  title(p2,'광고 stock (변환한 뒤 잔존계수로 누적)');
  const y2=yAxis(p2,0,nice(Math.max(...S.Al,...S.AJ,.01)));
  LI.polyline(st.svg,S.Al0.map((v,t)=>[xc(t),y2(v)]),{stroke:C.gray,'stroke-dasharray':'5 4'});
  LI.polyline(st.svg,S.Al.map((v,t)=>[xc(t),y2(v)]),{stroke:C.gray});
  LI.polyline(st.svg,S.AJ.map((v,t)=>[xc(t),y2(v)]),{stroke:C.blue});

  // Panel 3: extra prescriptions per month caused by my ads (each firm's baseline is 100 a month).
  const p3=panels[2];
  title(p3,n?'내 광고가 만든 월별 추가 처방':'내 광고가 만든 월별 추가 처방 (각 회사 기준 월 100건)');
  const hi=nice(Math.max(...S.me,...Cm.me,.01)),lo=Math.min(...S.rv)<0?-nice(-Math.min(...S.rv)):0;
  const y3=yAxis(p3,lo,hi);
  LI.polyline(st.svg,Cm.me.map((v,t)=>[xc(t),y3(v)]),{stroke:C.blue,'stroke-dasharray':'5 4','stroke-width':2});
  LI.polyline(st.svg,S.rv.map((v,t)=>[xc(t),y3(v)]),{stroke:C.rust});
  LI.polyline(st.svg,S.me.map((v,t)=>[xc(t),y3(v)]),{stroke:C.blue});
  // Month axis under the last panel; the shaded band is the ad year.
  const g=LI.el('g',{class:'li-axis'},st.svg),yb=p3.y+p3.h;
  for(const m of [1,6,12,18,24,30,36]){LI.el('line',{x1:xc(m-1),x2:xc(m-1),y1:yb,y2:yb+5,stroke:C.line},g);LI.el('text',{x:xc(m-1),y:yb+19,'text-anchor':'middle','font-size':fs,fill:C.muted,text:String(m)},g)}
  LI.el('text',{x:(x0+x1)/2,y:yb+38,'text-anchor':'middle','font-size':fs,fill:C.muted,text:'개월 (음영은 광고 집행 연도 1-12월)'},g);

  // Key numbers.
  const share=S.R>=0?S.R/(S.M+S.R):NaN;
  const m0=S.me[0],r0=S.rv[0],first=r0>=0?r0/(m0+r0):NaN,after=S.rvAfter>=0&&S.meAfter+S.rvAfter>0?S.rvAfter/(S.meAfter+S.rvAfter):NaN;
  const sh=v=>Number.isFinite(v)?pct(v,0):'경쟁사 처방 감소';
  const half=s.ll>0?Math.log(.5)/Math.log(s.ll):0;
  show([
   [`${patName(k)}: 내 추가 처방`,fmt(S.M,1)+'건','36개월 합계, 광고를 하지 않았을 때 대비'],
   [`비교: ${patName(kc)}`,fmt(Cm.M,1)+'건',`선택한 패턴은 이 값의 ${fmt(S.M/Cm.M,2)}배`],
   ['내 광고가 만든 경쟁사 처방 변화',fmt(S.R,1)+'건',`경쟁사 광고가 만든 내 처방 변화 ${fmt(S.FR,1)}건`],
   ['내 광고 이익 중 경쟁사 몫',sh(share),`첫 달 ${sh(first)}, 마지막 집행 달 이후 ${sh(after)}`,true],
   ['마지막 집행 달 이후에 생긴 내 효과',pct(S.meAfter/S.M,0),`시장 stock 반감기 ${fmt(half,1)}개월`]]);

  // Commentary that follows the settings.
  const out=[],r=S.M/Cm.M;
  if(s.kap<.05)out.push('곡률이 0이면 매달의 지출이 변환 없이 stock에 들어가 집중과 분산의 stock 총량이 같아집니다. 남는 차이는 로그 처방을 처방 건수로 바꾸는 지수 변환과 관측 기간 36개월에서 생깁니다.');
  else if(k===12)out.push(`같은 12달러를 12개월에 나누면 한 달 집중보다 누적 추가 처방이 ${fmt(r,2)}배입니다. 오목 변환이 매달의 지출에 먼저 적용되므로 한 달에 몰아 쓴 금액은 수확체감을 크게 겪습니다.`);
  else out.push(`같은 12달러를 ${patName(k)}하면 누적 추가 처방이 12개월 분산의 ${pct(r,0)}입니다. 오목 변환이 매달의 지출에 먼저 적용되므로 한 달에 몰린 금액일수록 수확체감을 크게 겪습니다.`);
  if(S.R<0)out.push('파급 비중이 낮아 고객 탈취가 시장확대보다 크므로 내 광고가 경쟁사 처방을 줄입니다. 경쟁사 광고에 기대어 광고를 줄일 무임승차 유인도 약해집니다.');
  else if(s.rho>=.995)out.push('파급 비중이 1이면 광고효과가 모두 시장확대여서 두 회사가 광고 이익을 똑같이 나눕니다. 광고비는 한 회사만 내므로 무임승차 유인이 가장 큽니다.');
  else if(s.ll>s.lp)out.push(`시장 stock(잔존 ${fmt(s.ll,3)})이 브랜드 stock(${fmt(s.lp,3)})보다 오래 남아 경쟁사 몫이 첫 달 ${sh(first)}에서 마지막 집행 달 이후 ${sh(after)}로 커집니다. 원문 그림 8에서 총처방 대 Zoloft 처방 비율이 시간이 갈수록 높아지는 것과 같은 방향입니다.`);
  else out.push('브랜드 stock이 시장 stock만큼 또는 그보다 오래 남으면 시간이 지나도 경쟁사 몫이 커지지 않습니다. 원문 추정치(.680 대 .324)는 시장 stock이 더 오래 남는 경우입니다.');
  if(s.aK>0&&s.kap>=.05)out.push(`경쟁사가 매달 ${fmt(s.aK,1)}달러를 광고하면 시장 단계의 변환이 두 회사 광고의 합에 적용되어, 내 광고가 시장 stock에 더하는 양이 경쟁사 광고가 없을 때의 ${pct(S.mktRatio,0)}로 줄어듭니다.${s.aK>=3?' 원문 그림 9는 경쟁사 광고 3달러와 10달러에서 Zoloft 광고의 한계수입이 크게 낮아진다고 보고합니다.':''}`);
  else if(s.aK===0)out.push('경쟁사 광고가 0이면 내 광고의 시장 효과를 깎는 요인이 없어 무임승차의 두 번째 경로(경쟁사 광고가 내 한계효과를 낮추는 경로)가 사라집니다.');
  msg.textContent=out.join(' ');
 }
 draw(ctl.state);
 st.onResize(()=>draw(ctl.state));
});
