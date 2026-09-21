"""Rebuild explanatory SVGs. Requires Python, numpy, matplotlib and a Korean font.
Usage: python scripts/generate-learning-figures.py --output ../literatures/figures
Ordinary npm builds use the committed SVGs and do not require Python.
"""
from pathlib import Path
import argparse, json, xml.etree.ElementTree as ET
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, Rectangle
from matplotlib.font_manager import fontManager
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=ROOT/'learning/materials/figures');parser.add_argument('--preview',type=Path)
args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
font=next((n for n in ['NanumBarunGothic','NanumGothic','Malgun Gothic','Apple SD Gothic Neo'] if any(f.name==n for f in fontManager.ttflist)),None)
if not font: raise RuntimeError('Install a Korean font (e.g. fonts-nanum) to regenerate figures.')
plt.rcParams.update({'font.family':font,'font.size':12,'axes.unicode_minus':False,'svg.fonttype':'path','svg.hashsalt':'marketing-learning-figures','axes.spines.top':False,'axes.spines.right':False,'axes.labelcolor':'#303a43','text.color':'#26323d','xtick.color':'#4d5863','ytick.color':'#4d5863','axes.edgecolor':'#a5adb5','axes.titleweight':'bold','figure.facecolor':'white','savefig.facecolor':'white'})
BLUE='#235f9a';RUST='#a44e2c';GRAY='#626b73';PALE='#e8eff5';INK='#26323d'
specs=json.loads((ROOT/'learning/figures.json').read_text())
def plot():
 f,a=plt.subplots(figsize=(8.4,4.9));f.subplots_adjust(left=.13,right=.94,bottom=.20,top=.91);a.grid(axis='y',alpha=.16);a.set_axisbelow(True);return f,a

def diagram(height=4.6):
 f,a=plt.subplots(figsize=(8.4,height));f.subplots_adjust(left=.035,right=.965,bottom=.04,top=.96);a.set(xlim=(0,10),ylim=(0,6));a.axis('off');return f,a

def txt(a,x,y,s,color=INK,size=13,ha='center',**kw):return a.text(x,y,s,color=color,fontsize=size,ha=ha,va='center',linespacing=1.65,**kw)
def arrow(a,start,end,color=BLUE,dashed=False,curve=0):
 a.add_patch(FancyArrowPatch(start,end,arrowstyle='-|>',mutation_scale=15,linewidth=1.7,color=color,linestyle='--' if dashed else '-',connectionstyle=f'arc3,rad={curve}'))
def band(a,x,y,w,h,color=PALE):a.add_patch(Rectangle((x,y),w,h,facecolor=color,edgecolor='none',zorder=0))
def note(a,s):a.text(0,-.23,s,transform=a.transAxes,fontsize=11,color=GRAY,va='top')
def line(a,x,y,label,color,style='-',marker='o'):a.plot(x,y,style,marker=marker,color=color,lw=2.2,label=label,markersize=6)

def make(slug):
 if slug=='ltv-survival':
  f,a=plot(); n=np.array([8.4,12.2,16.2,15.4,13.4,12,11.1,9.6,8.6]); au=np.array([3.2,7,9.7,10.3,9.5,7.8,6.9,5.9,5.3]);x=np.arange(10)
  for q,label,color in [(au,'자동이체 사용',BLUE),(n,'자동이체 미사용',RUST)]:line(a,x,np.r_[1,np.cumprod(1-q/100)]*100,label,color)
  a.set(xlabel='가입 후 경과 연수',ylabel='최초 가입자 중 잔존 비율 (%)',xticks=x,ylim=(0,105));a.legend(frameon=False,loc='lower left');note(a,'0년의 100%에서 출발해, 매년 남는 확률을 곱한다.')
 elif slug=='potential-outcomes':
  f,a=diagram();txt(a,1.45,3,'같은 사람 i\n같은 결과 측정 시점',size=14);arrow(a,(3,3.3),(4.35,4.55));arrow(a,(3,2.7),(4.35,1.45),GRAY,True)
  txt(a,6.75,4.6,'처치를 받은 경우: Y(1)\n실제로 D = 1이면 관측',BLUE,15);txt(a,6.75,1.5,'처치를 받지 않은 경우: Y(0)\nD = 1인 사람에게는 미관측',GRAY,15)
  txt(a,5,.25,'실제 D = 0인 사람은 반대 갈래의 결과만 관측한다.',size=12)
 elif slug=='did-counterfactual':
  f,a=plot();line(a,[0,1],[23.33,21.17],'PA 관측',GRAY);line(a,[0,1],[20.44,21.03],'NJ 관측',BLUE);line(a,[0,1],[20.44,18.28],'NJ 무처치 반사실',RUST,'--',None)
  a.set(xlim=(-.12,1.42),ylim=(17.7,24.3),xticks=[0,1],xticklabels=['정책 이전','정책 이후'],ylabel='평균 고용 (전일제 환산 인원)')
  for x,y in [(0,23.33),(0,20.44),(1,21.17),(1,18.28)]:a.annotate(str(y),(x,y),xytext=(0,10 if y!=18.28 else -20),textcoords='offset points',fontsize=11,ha='center')
  a.annotate('21.03',(1,21.03),xytext=(-44,-17),textcoords='offset points',color=BLUE)
  a.annotate('',(1.13,21.03),(1.13,18.28),arrowprops={'arrowstyle':'<->','color':RUST});txt(a,1.27,19.65,'DID\n2.75',RUST,12);a.legend(frameon=False,loc='upper right',fontsize=10);note(a,'점선은 PA의 변화 -2.16을 NJ에 적용한 가정상의 경로다.')
 elif slug in ['iv-paths','ad-assignment']:
  f,a=diagram(5.0);ad=slug=='ad-assignment'
  txt(a,5,5.4,'이용 성향 U' if ad else '능력 U',GRAY,15)
  txt(a,1.25,2.7,'무작위 배정 Z' if ad else '도구 Z',BLUE,15);txt(a,5,2.7,'실제 노출 D' if ad else '교육 D',BLUE,15);txt(a,8.8,2.7,'구매 Y' if ad else '임금 Y',BLUE,15)
  arrow(a,(2.6,2.7),(3.9,2.7));arrow(a,(6.1,2.7),(7.85,2.7));arrow(a,(5,4.9),(5,3.2),GRAY);arrow(a,(5.9,5.05),(8.55,3.2),GRAY)
  if ad:txt(a,5,.6,'배정은 무작위여도 실제 노출은 이용자의 행동에 달려 있다.',size=12)
  else:
   arrow(a,(1.35,2.15),(8.7,2.15),RUST,True,.36);txt(a,5,.48,'Z가 교육을 거치지 않고 임금에 영향을 주면 배제제약 위반',RUST,12)
   txt(a,1.3,4.65,'독립성 가정:\nZ와 U의 연관 없음',size=11)
 elif slug=='report-card-selection':
  f,a=diagram(5.2);txt(a,1.35,3.1,'성적 공개',BLUE,15)
  for y,middle,end in [(4.6,'진료의 질 개선','같은 위험의 환자도\n사망 가능성 감소'),(1.7,'고위험 환자의 수술 감소','수술환자 구성이 바뀌어\n관측 사망률 감소 가능')]:
   arrow(a,(2.2,3.1),(3.4,y));txt(a,5,y,middle,BLUE,14);arrow(a,(6.7,y),(7.4,y));txt(a,8.7,y,end,size=12)
  txt(a,5,.15,'수술환자 밖으로 빠진 사람의 결과도 함께 확인해야 한다.',RUST,12)
 elif slug=='late-types':
  f,axs=plt.subplots(2,2,figsize=(8.4,5.8));f.subplots_adjust(left=.1,right=.95,bottom=.12,top=.88,hspace=.65,wspace=.42)
  for a,(title,ys,col) in zip(axs.flat,[('순응자',[0,1],BLUE),('항상 처치자',[1,1],GRAY),('절대불참자',[0,0],GRAY),('역행자: 단조성으로 제외',[1,0],RUST)]):
   a.plot([0,1],ys,'o-',color=col,lw=2.2);a.set(xlim=(-.15,1.15),ylim=(-.22,1.22),xticks=[0,1],xticklabels=['도구 0','도구 1'],yticks=[0,1],yticklabels=['미처치','처치']);a.set_title(title,fontsize=13,color=col,pad=10);a.grid(alpha=.12)
 elif slug=='iv-weights':
  f,a=plot(); vals=[-.084,-.138,-.09804,-.111]; labels=['쌍둥이 IV (가중치 0.74)','성별 IV (가중치 0.26)','가중 결합','단순평균'];colors=[BLUE,BLUE,RUST,GRAY]
  f.subplots_adjust(left=.34,right=.94,bottom=.2,top=.91)
  for y,v,c in zip([3,2,1,0],vals,colors):a.plot(v,y,'o',color=c,ms=9);a.text(v+.0017,y+.15,f'{v:.5f}'.rstrip('0'),fontsize=11,color=c)
  a.set(yticks=[3,2,1,0],yticklabels=labels,xlim=(-.15,-.07),ylim=(-.6,3.6),xlabel='자녀 증가가 취업확률에 미치는 효과 (확률 단위)');a.grid(axis='x',alpha=.15);note(a,'0.74 × (-0.084) + 0.26 × (-0.138) = -0.09804')
 elif slug=='matching-overlap':
  f,a=plot();f.subplots_adjust(left=.15,right=.95,bottom=.23,top=.91)
  a.axvspan(50,150,color=PALE);a.scatter([50,70,90,110,130,150],[0]*6,color=GRAY,s=45,label='비참가자');a.scatter([75,100,135,300],[1]*4,color=BLUE,s=55,marker='D',label='참가자');a.set(xlim=(25,325),ylim=(-.6,1.6),yticks=[0,1],yticklabels=['비참가','참가'],xlabel='훈련 이전 소득 (본문 예제의 단위)');a.text(100,1.4,'관측 범위가 겹침',ha='center',fontsize=12,color=BLUE);a.annotate('가까운 비참가자 없음',(300,1),xytext=(190,.35),arrowprops={'arrowstyle':'->','color':RUST},color=RUST,fontsize=12);note(a,'음영 밖의 예측은 관측된 비교집단에서 멀어질수록 함수형태에 더 의존한다.')
 elif slug=='logit-probability':
  f,a=plot();x=np.linspace(-6,6,300);a.plot(x,100/(1+np.exp(-x)),color=BLUE,lw=2.5);p=100/(1+np.exp(3));a.plot(-3,p,'o',color=RUST);a.plot([-3,-3],[-2,p],'--',color=RUST);a.annotate('η = -3\np ≈ 4.743%',(-3,p),xytext=(-5.4,32),arrowprops={'arrowstyle':'->','color':RUST},color=RUST);a.set(xlim=(-6,6),ylim=(-2,102),xlabel='선형지수 η',ylabel='예상 사망확률 p (%)');note(a,'p = exp(η) / [1 + exp(η)]')
 elif slug=='rd-cutoff':
  f,a=plot();l=np.linspace(76,80,60);r=np.linspace(80,84,60);a.plot(l,30+(l-80),color=GRAY,lw=2.3,label='경계 왼쪽');a.plot(r,38+1.5*(r-80),color=BLUE,lw=2.3,label='경계 오른쪽');a.axvline(80,ls=':',color=GRAY);a.scatter([80,80],[30,38],s=65,facecolors=['white',BLUE],edgecolors=[GRAY,BLUE],zorder=4);a.annotate('',(80.2,38),(80.2,30),arrowprops={'arrowstyle':'<->','color':RUST});txt(a,81.5,33,'경계의 차이\n8%포인트',RUST,12);a.scatter([79,81],[29,39.5],color=GRAY,s=25);a.annotate('79점: 29%',(79,29),xytext=(77,26),fontsize=11);a.annotate('81점: 39.5%',(81,39.5),xytext=(81.25,41.2),fontsize=11);a.set(xlabel='시험 점수 X',ylabel='대학 진학확률 (%)',xticks=np.arange(76,85,2),ylim=(24,47));note(a,'본문의 가상 예제. 경계 80에서 양쪽 회귀선의 높이를 비교한다.')
 elif slug=='rebate-pass-through':
  f,a=diagram(5.2)
  rows=[(5.3,'지원금 이전 순지출','25,000달러',INK),(4.0,'협상가격 인상','+200달러',RUST),(2.7,'고객 리베이트','-1,000달러',BLUE),(1.4,'지원금 이후 순지출','24,200달러',BLUE)]
  for y,l,r,c in rows:txt(a,.8,y,l,ha='left',size=14);txt(a,9.2,y,r,c,ha='right',size=16)
  a.plot([.8,9.2],[2.05,2.05],color=GRAY,lw=1);txt(a,5,.2,'순지출 800달러 감소 / 지원금 1,000달러 = 전가율 80%',size=13)
 elif slug=='staggered-comparison':
  f,a=plot();line(a,[1,2,3],[0,2,10],'조기도입 E',BLUE);line(a,[1,2,3],[0,0,2],'늦은 도입 L',RUST, '--','s');a.axvspan(2,3,color=PALE,alpha=.5);a.set(xlim=(.85,3.5),ylim=(-1,12),xticks=[1,2,3],xticklabels=['1기','2기: E 도입','3기: L 도입'],ylabel='결과 Y (가상 단위)');a.legend(frameon=False,loc='upper left');txt(a,3.23,8.7,'E: +8',BLUE,12);txt(a,3.23,1.3,'L: +2',RUST,12);note(a,'음영 구간에서 L의 도입을 E와 비교하면: 2 - 8 = -6')
 elif slug=='advertising-spillover':
  f,a=diagram(5.3);txt(a,1.3,3.1,'브랜드 A\n광고 증가',BLUE,15)
  arrow(a,(2.25,3.4),(3.5,4.8));arrow(a,(2.25,2.8),(3.5,1.7));txt(a,5.1,4.8,'치료 시작 증가\n시장 전체 확대',size=14);txt(a,5.1,1.7,'A로 브랜드 전환\n경쟁사 고객 이동',size=14);arrow(a,(6.7,4.8),(7.6,4.8));arrow(a,(6.7,1.7),(7.6,1.7),RUST);txt(a,8.8,4.8,'경쟁사 수요\n증가 경로 (+)',BLUE,13);txt(a,8.8,1.7,'경쟁사 수요\n감소 경로 (-)',RUST,13);txt(a,5,.2,'경쟁사의 순변화는 두 경로의 크기에 달려 있다.',size=12)
 elif slug=='review-deletion':
  f,a=diagram(5.4);txt(a,1.3,3,'리뷰를\n모집한 상품',BLUE,15)
  arrow(a,(2.3,3.35),(3.3,4.7));arrow(a,(2.3,2.65),(3.3,1.55));txt(a,5.1,4.7,'삭제 집중시기 밖\n논문의 처치집단',BLUE,14);txt(a,5.1,1.55,'삭제 집중시기와 겹침\n논문의 통제집단',GRAY,14);arrow(a,(6.7,4.7),(7.4,4.7));arrow(a,(6.7,1.55),(7.4,1.55),GRAY);txt(a,8.7,4.7,'긍정적 리뷰가\n더 축적될 여지',size=12);txt(a,8.7,1.55,'삭제 때문에\n축적 이익 감소',size=12);txt(a,5,.13,'두 집단의 시기별 수요 변화가 비교 가능하다는 근거가 필요하다.',RUST,12)
 elif slug=='review-rank':
  f,a=diagram(5.0)
  for y,l,r,c in [(4.9,'리뷰어 순위 숫자 감소','사람의 지위 상승',BLUE),(3.05,'상품 판매순위 숫자 감소','상품의 판매성과 개선',BLUE),(1.2,'상품 판매수량 증가','상품의 판매성과 개선',RUST)]:
   txt(a,.35,y,l,ha='left',size=14);arrow(a,(4.85,y),(6,y),c);txt(a,9.65,y,r,c,ha='right',size=14)
 elif slug=='review-rounding':
  f,a=plot();a.plot([3.5,3.75],[3.5,3.5],color=GRAY,lw=2.5);a.plot([3.75,3.99],[4,4],color=BLUE,lw=2.5);a.scatter([3.75,3.75],[3.5,4],s=80,facecolors=['white',BLUE],edgecolors=[GRAY,BLUE],zorder=4);a.axvline(3.75,ls=':',color=GRAY);a.set(xlim=(3.49,4),ylim=(3.3,4.25),xticks=[3.5,3.65,3.75,3.85,4],yticks=[3.5,4],xlabel='실제 평균평점 R',ylabel='화면의 표시평점');txt(a,3.6,3.65,'낮은 표시: 3.5',GRAY,12);txt(a,3.875,4.14,'높은 표시: 4.0',BLUE,12);note(a,'경계 c = 3.75. 이 그림의 세로축은 광고비가 아니라 표시평점이다.')
 else:raise ValueError(slug)
 return f

for spec in specs:
 fig=make(spec['id']);out=args.output/(spec['id']+'.svg');fig.savefig(out,format='svg',metadata={'Date':None,'Title':spec['title'],'Description':spec['alt']+' '+spec['source']})
 # Accessible title/description also travel with the standalone SVG.
 svg=out.read_text();desc='<title>'+spec['title']+'</title><desc>'+spec['alt']+'</desc>'
 start=svg.index('>',svg.index('<svg'))+1;svg=svg[:start]+desc+svg[start:];out.write_text('\n'.join(line.rstrip() for line in svg.splitlines())+'\n')
 ET.parse(out)
 if args.preview:
  args.preview.mkdir(parents=True,exist_ok=True);fig.savefig(args.preview/(spec['id']+'.png'),dpi=120)
 plt.close(fig)
print(f'Generated {len(specs)} SVG figures in {args.output}')
