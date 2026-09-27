// IV with heterogeneous effects: compliance types, the Wald ratio and what it identifies.
LI.register('iv-types',root=>{
 const {C,fmt,pct}=LI;
 const TYPES=[
  {key:'C',label:'순응자',color:C.blue},
  {key:'A',label:'항상 처치자',color:C.rust},
  {key:'N',label:'절대불참자',color:C.gray},
  {key:'D',label:'역행자',color:C.ink,hollow:true}];
 const st=LI.stage(root,{width:640,height:300,narrowWidth:360,narrowHeight:520,label:'100명의 순응 유형 구성과 도구 배정별 처치 여부'});
 LI.legend(root,TYPES.map(t=>[t.label,t.color,false,t.hollow]));
 const show=LI.readout(root);
 const warn=LI.note(root,'');
 const ctl=LI.controls(root,[
  {key:'pA',label:'항상 처치자 비율',min:0,max:.6,step:.01,value:.2,format:v=>pct(v,0)},
  {key:'pN',label:'절대불참자 비율',min:0,max:.6,step:.01,value:.3,format:v=>pct(v,0)},
  {key:'pD',label:'역행자 비율 (단조성 위반)',min:0,max:.3,step:.01,value:0,format:v=>pct(v,0)},
  {key:'tC',label:'순응자의 처치효과',min:-20,max:30,step:1,value:10},
  {key:'tA',label:'항상 처치자의 처치효과',min:-20,max:30,step:1,value:20},
  {key:'tD',label:'역행자의 처치효과',min:-20,max:30,step:1,value:0}],draw);

 function draw(s){
  st.layout();
  let {pA,pN,pD}=s;const over=pA+pN+pD>1;
  if(over){const k=1/(pA+pN+pD);pA*=k;pN*=k;pD*=k}
  const pC=Math.max(0,1-pA-pN-pD),share={C:pC,A:pA,N:pN,D:pD};
  // 100 people, filled type by type so each block of colour matches its share.
  const counts={};let left=100;
  for(const t of TYPES.slice(1)){counts[t.key]=Math.round(share[t.key]*100);left-=counts[t.key]}
  counts.C=Math.max(0,left);
  const people=TYPES.flatMap(t=>Array(counts[t.key]).fill(t));
  const cell=22,x0=16,y0=38;
  LI.el('text',{x:x0,y:22,'font-size':14,fill:C.muted,text:'한 칸이 1%인 모집단'},st.svg);
  people.forEach((t,i)=>{const x=x0+(i%10)*cell,y=y0+Math.floor(i/10)*cell;
   LI.el('rect',{x:x+2,y:y+2,width:cell-5,height:cell-5,rx:2,fill:t.hollow?'none':t.color,stroke:t.color,'stroke-width':t.hollow?2:0},st.svg)});
  // Treated shares when the instrument is off and on, stacked by type.
  const bx=st.narrow?16:300,bw=st.narrow?320:300,by=st.narrow?300:48,rows=[['도구 z = 0일 때 처치받는 사람',['A','D']],['도구 z = 1일 때 처치받는 사람',['A','C']]];
  rows.forEach(([title,keys],r)=>{
   const y=by+r*110;LI.el('text',{x:bx,y:y-10,'font-size':14,fill:C.ink,text:title},st.svg);
   LI.el('rect',{x:bx,y,width:bw,height:30,fill:'none',stroke:C.line},st.svg);
   let x=bx,total=0;
   for(const k of keys){const t=TYPES.find(t=>t.key===k),w=share[k]*bw;
    if(w>0)LI.el('rect',{x,y,width:w,height:30,fill:t.hollow?'none':t.color,stroke:t.color,'stroke-width':t.hollow?2:0},st.svg);
    x+=w;total+=share[k]}
   LI.el('text',{x:bx,y:y+50,'font-size':14,fill:C.muted,text:`처치율 ${pct(total,0)}`},st.svg);
  });
  // First stage and reduced form come from the types whose treatment responds to z.
  const fs=pC-pD,rf=pC*s.tC-pD*s.tD,wald=fs!==0?rf/fs:NaN;
  const treated=pA+.5*pC+.5*pD,att=treated>0?(pA*s.tA+.5*pC*s.tC+.5*pD*s.tD)/treated:NaN;
  show([
   ['1단계: 처치율 차이',pct(fs,1),'순응자 비율에서 역행자 비율을 뺀 값'],
   ['축약형: 결과 평균 차이',fmt(rf,2),'항상 처치자와 절대불참자는 z에 반응하지 않아 사라짐'],
   ['Wald 추정치 = 축약형 ÷ 1단계',fmt(wald,2),null,true],
   ['순응자의 평균효과 (LATE)',fmt(s.tC,2),null,true],
   ['처치받은 사람의 평균효과 (ATT, 도구 배정 50%)',fmt(att,2),'항상 처치자가 많을수록 LATE와 멀어짐']]);
  warn.textContent=over?'세 비율의 합이 100%를 넘어 비율을 합이 100%가 되도록 줄여서 그렸습니다.'
   :pD>0?'역행자가 있으면 축약형에서 역행자 효과가 빠지고 1단계도 줄어들어, Wald 추정치가 순응자 효과와 달라질 수 있습니다.'
   :'단조성이 성립하면 Wald 추정치는 항상 순응자의 평균효과와 같습니다. 항상 처치자의 효과는 추정치에 들어오지 않습니다.';
 }
 draw(ctl.state);
 st.onResize(()=>draw(ctl.state));
});
