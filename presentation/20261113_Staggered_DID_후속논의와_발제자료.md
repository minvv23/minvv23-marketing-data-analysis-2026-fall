# Staggered DID 후속 논의: Baker·Larcker·Wang (2022) 발제를 위한 2026년 시점 정리

조사 기준일: **2026-11-13**. Codex 웹검색(3개 갈래 병렬 조사)으로 저널 페이지·arXiv/SSRN/NBER·저자 홈페이지·공식 패키지 문서를 확인했고, 이 중 발제의 중심이 될 주장 일부는 별도로 교차검증했다(문서 끝 [검증 범위](#9-검증-범위와-주의) 참조). 출판본과 working paper·최신 개정일은 구분해서 적었다.

함께 읽을 문서:

- 논문 자체의 내용: [심층요약](<../learning/materials/Week 10 (2026-11-18)/How much should we trust staggered difference-in-differences estimates (2022)_심층요약.md>), [실무 Cheat Sheet](<../learning/materials/Week 10 (2026-11-18)/How much should we trust staggered difference-in-differences estimates (2022)_실무CheatSheet.md>)
- 연속형 처치로의 확장: [Continuous DID 최신 논의](20261111_Continuous_DID_최신논의.md), [쉬운 이해와 시각화 자료](20261111_Continuous_DID_쉬운이해와_시각화자료.md)

이 문서는 **논문 이후 무엇이 달라졌는지**만 다룬다. 원문의 시뮬레이션·재분석 수치는 위 심층요약과 Cheat Sheet에 있다.

---

## 0. 발제에서 한 문단으로 말할 것

> BLW(2022)는 도입 시점이 다르고 효과가 시간에 따라 변하면, TWFE가 이미 처치된 집단을 비교군으로 쓰면서 부호까지 뒤집힐 수 있음을 보였다. 이후 4년간 논의는 **"TWFE가 틀릴 수 있는가"에서 "실제 연구에서 얼마나 자주, 얼마나 크게 달라지는가"**로 옮겨 갔다. 경제학(Hull 2026)과 정치학(Chiu 등 2026)의 대규모 재분석에서는 부호가 대체로 유지됐지만, **경영·마케팅 논문을 재분석한 Proserpio(2026-11)는 부호 반전이 18–25%로 경제학보다 훨씬 잦았다.** 그리고 새 추정법도 평행추세 자체를 보장하지는 않으므로, 이제 요구되는 것은 추정 명령어를 바꾸는 일에 더해 **추정대상(estimand)·비교군·사전계수의 의미·추론**을 공개하는 것이다.

마케팅 수업 청중에게 가장 강한 연결고리는 **Proserpio(2026)**다. "경제학에선 괜찮다더라"는 결론을 우리 분야에 그대로 옮길 수 없다는 근거가 되기 때문이다.

---

## 1. BLW의 영향: 무엇이 실제로 바뀌었나

**서지.** Baker, Larcker & Wang, *Journal of Financial Economics* **144(2), 370–395, 2022년 5월**(온라인 2022-02-22). [저자 공개 출판본](https://andrew-charles-baker.github.io/research/articles/staggered_did/did.pdf), [DOI](https://doi.org/10.1016/j.jfineco.2022.01.004)

**인용 규모.** Scilit 기준 **3,415건**이 확인됐다. Google Scholar 수치는 접근 제한으로 확인하지 못했으므로 Scilit 수치를 Google Scholar 수치로 소개하지 않는다. [Scilit](https://www.scilit.com/publications/1d978226a04efd96bd4a9e40a0932a4a)

**관행 변화의 예.** BLW를 명시적으로 인용하며 설계를 바꾼 논문들이다. 단, 관행 변화가 BLW 한 편 때문이라는 인과적 증거는 아니다. 같은 시기의 Goodman-Bacon, CS, SA, BJS 등 문헌 전체의 영향이다.

| 분야 | 논문 | 바뀐 점 |
|---|---|---|
| 재무 | De Vito, Jacob, Schindler & Xu, *Review of Finance* 29(2), 2025 | BLW를 따라 stacked DID, 사건별 ±3년 창과 clean control 구성. [DOI](https://doi.org/10.1093/rof/rfaf006) |
| 회계 | Li, Monroe & Coulton, *International Journal of Auditing* 28(1), 2024 | BLW의 편향 경고를 이유로 stacked regression 채택. [DOI](https://doi.org/10.1111/ijau.12322) |
| 경영 | Gulati, Marchetti & Puranam, *Management Science*, 온라인 2026-03-20 | stacked DID 주 분석 + CS doubly robust 강건성. [DOI](https://doi.org/10.1287/mnsc.2023.04127) |

**정량적 변화(경영·마케팅).** Proserpio(2026) 부록 Table 17에 따르면, 재분석 표본의 staggered 설계 중 현대 추정법을 보고한 비율이 *Management Science* **2019–2022년 0%(29편) → 2025–2026년 32.6%(89편)**, *Marketing Science* **0%(14편) → 26.7%(15편)**이다. 전수조사가 아니라 해당 연구의 선별 표본이다. [원문](https://arxiv.org/pdf/2611.11003v2)

→ 발제 표현: "TWFE가 사라졌다"가 아니라 **"비교군·처치 시점·집계에 대한 설명과 대안 추정이 요구되는 방향으로 이동했고, 마케팅 분야에서는 아직 3분의 1에 못 미친다."**

---

## 2. "그래서 TWFE가 실제로 얼마나 틀렸나?": 대규모 재분석 세 편

BLW는 시뮬레이션과 두 편의 재분석으로 **실패 가능성**을 보였다. 실제 출판 연구에서의 **실패 빈도**는 이후 재분석들이 다룬다.

용어: **DA** = DiD-averaging(CS류), **IM** = imputation(BJS류). **유의한 부호 반전** = 두 추정치의 부호가 반대이고 **두 추정치의 차이가 유의**한 경우.

| 연구 | 출판 상태 | 표본 | 핵심 수치 |
|---|---|---|---|
| **Hull**, *How Different are Different Differences-in-Differences? A Large-Scale Meta-Analysis* | Working paper. arXiv v1 2026-10-29, **v2 2026-11-03**. [arXiv](https://arxiv.org/abs/2610.39995) | 경제학 종합저널 **116편·1,430개 사양**. 선별 후 DA 1,205개, IM 1,254개 비교 | 상관 **0.889 / 0.930**. 부호 반전 **14.9% / 12.0%**. 유의한 반전 **3.9% / 2.8%**. 현대 추정법 표준오차가 평균 **40% / 9%** 큼 |
| **Chiu, Lan, Liu & Xu**, *Causal Panel Analysis under Parallel Trends: Lessons from a Large Reanalysis Study* | ***APSR* 120(1), 245–266, 2026년 2월** (온라인 2025-06-09). [DOI](https://doi.org/10.1017/S0003055425000243) | 정치학 주요 저널 **49편**(그중 staggered adoption 13편) | imputation과 TWFE의 **부호는 49편 모두 동일**. 그러나 5% 비유의 연구가 **1편 → 12편(24%)**. 효과 크기가 원래의 ¼ 또는 2배 이상인 사례도 존재 |
| **Proserpio**, *Do Modern Difference-in-Differences Estimators Change Published Findings in Business Research?* | Preliminary WP. arXiv v1 2026-11-07, **v2 2026-11-10**. [arXiv](https://arxiv.org/abs/2611.11003) | ***Management Science* 36편 + *Marketing Science* 4편, 355개 사양**. 선별 후 DA 283개(28편), IM 306개(29편) | 상관 **0.61 / 0.70**. 부호 반전 **25.1% / 18.0%**. 유의한 반전 **10.2% / 7.2%**. 표준오차 비율 **1.61 / 1.30** |

### 2.1 세 결과를 읽는 법

- **Hull의 계층모형 결과는 관측 비율과 다르다.** 추정 잡음을 제거한 estimand 간 상관은 **0.911 / 0.971**, 현대 estimand와 반대 방향으로 TWFE가 유의할 확률은 **2.4% / 0.7%**로 추정된다. 모형에 의존한 확률이다. 또 공개 복제자료가 있는 **이진 처치** 설계에 한정하고 시변 통제변수 등은 제외한다. [원문](https://arxiv.org/pdf/2610.39995v2)
- **Chiu 등의 진짜 경고는 평행추세 쪽이다.** 민감도 분석이 가능한 42편에서 제한적 위반(\(\bar M=0.5\))을 허용하면 5% 유의가 유지되는 연구는 **8편(19%)**뿐이다. 나머지가 틀렸다는 뜻이 아니라, 효과와 그럴듯한 추세 위반을 구분할 **검정력이 부족**하다는 뜻이다.
- **Proserpio의 불일치는 특정 조건에 몰려 있다.** 불균형 패널, never-treated 부재, 일부 논문에 집중된다. 시변 통제변수를 포함한 IM 비교 100개에서는 상관 0.99, 부호 반전 3.0%였다. 따라서 "경영학 논문의 4분의 1이 틀렸다"고 말하면 과장이다. 저자 스스로 Hull의 방법(LLM 에이전트로 사양 식별·복제)을 따랐다고 밝힌 **예비 원고**라는 점도 같이 말한다.
- **부호가 같아도 결론은 바뀔 수 있다.** BJS(2024)는 2008년 미국 세금 환급의 첫 분기 MPC가 기존 15.9–23.4%에서 **7.8–11.4%로 절반**이 됨을 보였다. 정책적으로는 큰 차이다. [*REStud* 91(6), 2024](https://doi.org/10.1093/restud/rdae007)

### 2.2 이론 쪽의 재평가와 오용 주의

- **Borusyak & Hull, "Negative Weights Are No Concern in Design-Based Specifications"**, *AEA P&P* 114, 597–600, 2024. 처치 배정의 조건부 기대값을 통제하는 **design-based** 사양에서는 실현된 음의 가중치가 배정 분포 전체로 평균하면 비음이 된다는 결과다. 평행추세만 가정하는 일반 관찰자료 DID에 자동으로 적용되는 면책 논리가 아니다. [AEA](https://www.aeaweb.org/articles?id=10.1257/pandp.20241046)
- **Coglianese & Fang, FEDS 2026-045**: 13개 추정법·134,000회 이상의 placebo event study에서 보편적으로 가장 좋은 추정법은 없었다. 다만 **단일 처치 단위·단일 사건**의 비교라서 staggered 음의 가중치 문제에 대한 반론으로 인용하면 안 된다. [연준](https://www.federalreserve.gov/econres/feds/an-evaluation-of-difference-in-differences-methods-using-placebo-event-studies.htm)

---

## 3. BLW가 재분석한 두 응용의 이후 논쟁

### 3.1 이사회 개혁(Fauver, Hung, Li & Taboada 2017): 원저자의 직접 반론이 있다

- BLW 재분석에서 주요 개혁 계수는 TWFE **0.096** → CS **0.062 (SE 0.135)**, stacked **0.063 (0.051)**. 그러나 **최초 개혁 기준 stacked 0.166 (0.055)은 1% 수준에서 유의**하다. "모든 결과가 사라졌다"고 말하면 틀린다. 이 0.166은 사전 하락이 있는 사건연구와 함께 읽어야 한다(심층요약 13절).
- 원저자 반론: **Fauver 등(2021), SSRN 3885472**(2021-07 게시). BLW 출판 **이전**의 working paper 단계 반론이므로 "2022년 이후 새 반론"으로 소개하면 연대가 틀린다. [SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3885472), [저자들의 Duke FinReg 블로그 설명](https://sites.duke.edu/thefinregblog/2021/08/23/re-examining-board-reforms-and-firm-value-response-to-how-much-should-we-trust-staggered-differences-in-differences-estimates-by-baker-larcker-and-wang-2021/)
  - 주장: 유의성 상실은 추정법 변경 외에도 ① 마지막 개혁 이후 관측치 절단으로 사후 기간 축소, ② 후기 개혁의 비교군이 극히 적어짐, ③ 사건 시점·기준기간 변경에서 비롯됐다.
  - 대응: 미개혁국 **코트디부아르·베네수엘라·베트남**을 never-treated로 추가하는 등으로 양의 유의한 결과가 유지된다고 주장한다. 추가한 국가의 비교 가능성이 낮다는 점은 스스로 인정한다.
- BLW 최종판 **각주 17**은 이 반론을 언급하고, 추가 국가를 쓴 새 분석은 검토하지 않으며 원자료의 강건성 평가가 목적이라고 답한다.

→ 이 논쟁은 **"비교 가능성이 낮은 never-treated를 들여와 검정력을 얻을 것인가, 적은 not-yet-treated로 버틸 것인가"**라는 트레이드오프다. 토론 질문으로 쓰기 좋다(8.3절).

### 3.2 은행 규제완화(Beck, Levine & Levkov 2010)

- BLW: log Gini TWFE **−0.022 (0.008)** → CS **0.001 (0.007)**, stacked **0.000 (0.005)**.
- BLL 저자들의 공식 답글은 확인되지 않았다.
- Wang & Jv, *Finance Research Letters* 50, 103319, 2022: 비선형 smooth-transition DID로 불평등 감소라는 BLL 결론을 지지한다. 다만 BLW에 대한 직접 반론인지, 표본·계수는 확인하지 못했다. 이질성-강건 추정법으로 BLW를 반박한 결과로 소개할 근거는 없다. [DOI](https://doi.org/10.1016/j.frl.2022.103319)

---

## 4. 2026년의 추정법 지형

BLW가 소개한 대안은 CS, SA, stacked 세 가지였다. 이후 정식 출판·확장된 것까지 합쳐 정리한다.

| 추정법 | 서지 (출판 상태) | 비교군 | 한 줄 특징·주의 | 대표 구현 |
|---|---|---|---|---|
| **Callaway & Sant'Anna (CS)** | *J. Econometrics* 225(2), 2021 | never-treated 또는 not-yet-treated | \(ATT(g,t)\) 추정 후 집계. 회귀조정·IPW·DR. DR은 nuisance 모형 오지정에 대한 강건성이지 **평행추세 위반에 대한 강건성이 아님** | R `did`, Stata `csdid`, Py `differences`/`csdid` |
| **Sun & Abraham (SA)** | *J. Econometrics* 225(2), 2021 | never-treated 또는 마지막 처치 코호트 | 기존 사건연구 회귀와 연결 쉬움. 긴 사건시간에선 기여 코호트가 줄어 구성효과 | R `fixest::sunab`, Stata `eventstudyinteract` |
| **Borusyak, Jaravel & Spiess (imputation)** | ***REStud* 91(6), 3253–3285, 2024** | 모든 미처치 관측치 | 미처치 모형(FE)으로 반사실을 추정해 대입. 구면오차 등 조건에서 효율적 | Stata `did_imputation`, R `didimputation` |
| **Gardner two-stage DID** | Gardner–Thakral–Tô–Yap 2026-06 개정본, *EJ* under revision(정식 출판 미확인) | 미처치 관측치 | 같은 사양이면 BJS와 점추정이 같을 수 있음. **단순 2단계 OLS 표준오차는 부적절** | R/Stata `did2s`, `pyfixest` |
| **Wooldridge ETWFE** | ***Empirical Economics* 69(5), 2545–2587, 2025** (2021 WP) | not-yet 또는 never | 코호트×시점 상호작용을 넣은 하나의 회귀. 전통적 단일계수 TWFE와 **다른 회귀** | R `etwfe`, Stata `jwdid` |
| **dCDH 동적 버전** | ***REStat* 108(4), 863–880, 2026** | 아직 처치가 바뀌지 않은 단위 | 비흡수적·다치·연속 처치 허용. 2020 AER 정적 진단 논문과 구분 | R `DIDmultiplegtDYN`, Stata `did_multiplegt_dyn` |
| **Stacked (Cengiz et al.)** | *QJE* 134(3), 2019 | 사건창 내 clean control | 직관적이지만 **쌓기만으로 원하는 ATT가 보장되지 않음** | 수동 구현 |
| **Weighted stacked (Wing, Freedman & Hollingsworth)** | NBER WP 32054, 2024(SSRN 2026-08 개정, 저널 미확인) | 사건창 내 clean control | 단순 stacked가 처치·비교군 추세에 다른 암묵적 가중치를 준다는 점을 보정가중치로 교정 | R `stackdid`(저자) |
| **LP-DiD (Dube, Girardi, Jordà & Taylor)** | ***J. Applied Econometrics* 40(7), 2025** | horizon별 clean control | 빠르고 단순. 기본형은 분산가중, 재가중하면 동일가중 ATT | Stata `lpdid`, `pyfixest.lpdid` |
| **Roth & Sant'Anna** | *JPE Micro* 1(4), 2023 | — | 도입 시점이 **무작위**일 때 효율적. 관찰자료에 자동 적용 불가 | R/Stata `staggered` |

**BLW 원문과 연결되는 업데이트 두 가지.**

1. **BLW가 "TWFE에 가장 가까운 대안"으로 권한 stacked에도 가중 문제가 있다.** Wing 등(2024)의 보정이 그 답이다. 원문 Fig. 6–7에서 stacked가 표본 ATT와 달랐던 이유와 같은 맥락이다.
2. **방법 간 결과를 비교하려면 먼저 같은 ATT인지 확인한다.** 전체 처치 관측치 평균, 코호트 동일가중, 사건시간 동일가중, 공통 창 평균은 서로 다른 숫자다. 표준오차가 작다고 더 좋은 방법이라는 뜻도 아니다.

신규 working paper(소개만): Chen, Sant'Anna & Xie *Efficient DiD and Event Study Estimators*(2025), Faletto FETWFE(R `fetwfe`), Ustyuzhanin *Covariate-Balanced Weighted Stacked DID*(arXiv 2026-04).

### 4.1 Practitioner's Guide: 사실상 "BLW의 후속 교과서"

Baker, Callaway, Cunningham, Goodman-Bacon & Sant'Anna, **"Difference-in-Differences Designs: A Practitioner's Guide," *JEL* 64(2), 498–557, 2026년 6월**. 일부 저자 홈페이지의 "forthcoming" 표기는 오래된 정보다. [JEL](https://www.aeaweb.org/articles?id=10.1257/jel.20251650), [arXiv v3](https://arxiv.org/abs/2503.13323)

핵심 관점은 **forward engineering: 목표 모수 → 식별 가정 → 추정·추론** 순서다.

- **목표 estimand부터 정의**: 전체 ATT? 코호트별? 도입 후 k년? 고객 수·매출·기업 수 중 무엇으로 가중할지도 연구 질문의 일부다.
- **2×2 building block**: \(ATT(g,t)\)를 기본 단위로 삼아 유효한 비교군과 비교한 뒤 집계한다.
- **비교군을 가정과 연결**: never-treated와 not-yet-treated는 서로 다른 평행추세 가정이다.
- **공변량은 설계 단계에서**: 통제변수를 넣는다고 식별이 되지 않는다.

BLW와 1저자가 같다는 점에서, 발제 마지막에 "저자들이 4년 뒤 정리한 처방"으로 소개하기 좋다.

---

## 5. 사건연구 사전계수: 서로 다른 세 문제를 구분한다

BLW 원문의 Simulation 7(평행추세 위반인데 TWFE 사전계수가 0 근처)과 바로 연결되는 부분이다.

1. **SA의 오염 문제** (BLW도 다룸): 코호트별 효과가 이질적이면 TWFE의 사전계수에 다른 사건시간 효과가 섞인다.
2. **Roth, "Interpreting Event-Studies from Recent Difference-in-Differences Methods"** — ***Japanese Economic Review* 77(2), 275–288, 2026** (2024 arXiv 초고와 구분). [저널](https://link.springer.com/article/10.1007/s42973-026-00235-x)
   - 새 추정법은 평행추세 아래에선 타당하지만, **평행추세가 위반되면 사전·사후 계수가 편향을 같은 방식으로 보여주지 않는다.**
   - CS의 기본값(`varying` base)에서 사전계수는 인접 기간 차이, 사후계수는 처치 직전 대비 장기 차분이다. 꾸준한 추세 차이가 **처치 시점의 꺾임처럼** 보일 수 있다. `base_period = "universal"`로 맞출 수 있다.
   - BJS 기본 그림도 사전·사후 기준이 달라 인위적 점프가 생길 수 있다.
   - → **이 논점은 SA의 오염 문제와 별개다.** "새 추정법으로 그린 그림이니 사전계수를 그대로 믿으면 된다"가 아니다.
3. **Roth (2022) Pretest with Caution** (*AER: Insights* 4(3)): 사전추세 검정은 검정력이 낮고, 통과한 사양만 보고하면 추정과 구간이 왜곡된다.
4. **해결책 쪽: Rambachan & Roth (2023) HonestDiD** (*REStud* 90(5)): 평행추세 위반을 어느 정도 허용해도 결론이 유지되는지, 결론이 무너지는 **breakdown value**를 보고한다. 단, 기준기간이 엇갈린 사건연구 계수를 그대로 넣으면 안 된다.

---

## 6. 그 밖에 짧게 언급할 쟁점

| 쟁점 | 핵심 |
|---|---|
| **시변 공변량** | BLW 각주 2의 문제의식이 이어진다. Caetano & Callaway의 후속 논문(arXiv 최신 2026-06-01)은 FE 제거 변환이 공변량 정보를 지우거나 함수형태를 암묵적으로 제한하는 **hidden linearity bias**를 다룬다. 처치 후 변한 가격·광고비를 통제하면 bad control이 된다. [arXiv](https://arxiv.org/abs/2406.15288) |
| **비흡수적 처치** | 할인·광고 캠페인처럼 켜졌다 꺼지는 처치를 "최초 시행 후 영구 처치"로 코딩하면 질문이 바뀐다. dCDH 동적 방법이나 LP-DiD 확장을 쓰고 잔존효과를 명시한다. **마케팅에서 특히 흔한 상황이다.** |
| **불균형 패널** | 명령어가 돌아간다고 선택적 이탈이 해결된 것은 아니다. R `did`는 기본적으로 모든 기간에 관측되지 않는 단위를 제외한다. Proserpio에서 불일치가 몰린 조건이기도 하다. |
| **소수 클러스터** | 처치가 배정된 **처치 클러스터 수**가 중요하다. Karim–Nielsen–MacKinnon–Webb(arXiv 2026-02)는 CS에서도 과잉기각이 심할 수 있음을 보이고 cluster jackknife(R `didjack`, Stata `csdidjack`)를 제안한다. BLW Simulation 6′의 "클러스터링으로 중심의 편향은 못 고친다"와 별개의 문제다. |

---

## 7. 마케팅 분야 적용 사례

### 7.1 이질성-강건 추정법을 쓴 마케팅 논문

| 논문 | 처치(단계적 도입) | 추정법 | TWFE와 비교 |
|---|---|---|---|
| **Guo & Liu**, *JM* 87(6), 2023 — 회원제 무료배송 [DOI](https://journals.sagepub.com/doi/10.1177/00222429231158116) | 소비자별로 다른 시점에 가입 | Stacked DID | 미확인. **초기엔 지출 증가가 없다가 시간이 지나며 증가** → BLW가 말하는 "효과가 시간에 따라 커지는" 전형적 사례 |
| **Kim & Chen**, *Mktg Sci* 44(3), 2025 — 총기 휴대 규제 완화 [DOI](https://pubsonline.informs.org/doi/10.1287/mksc.2023.0480) | 주별 법 시행 시점(2010–2017) | CS \(ATT(g,t)\) | 수치 비교 미확인 |
| **Ananthakrishnan, Basavaraj, Karmegam, Sen & Smith**, *Mktg Sci* 44(4), 933–953, 2025 — 금서와 도서 대출 [DOI](https://pubsonline.informs.org/doi/10.1287/mksc.2024.0716) | 도서별 최초 금지 시점 | TWFE + **CS, SA, BJS 모두** | **보고됨.** TWFE 0.113, CS 0.114, SA 0.115, BJS 0.115 (로그계수). Table 3·5, Figure 4 |
| **Guyt, van Lin & Keller**, *Mktg Sci* 44(5), 2025 — 광고 전단 opt-in 규제 [DOI](https://pubsonline.informs.org/doi/10.1287/mksc.2023.0020) | 네덜란드 7개 시: Amsterdam 2018-01, 4개 시 2020-01, Hague 2020-07, Rotterdam 2020-11 | **Stacked synthetic DID** | **보고됨.** Table 8에서 TWFE와 유사. 결론은 구매행동 변화가 작고 대체로 비유의 |
| **Janakiraman, Kamatham, Rishika & Kumar**, *JMR* 62(6), 2025 — 오프프라이스 매장 개점 [DOI](https://journals.sagepub.com/doi/10.1177/00222437251347193) | 10개 매장, 7개 시점 | CS doubly robust (R `did`), **나중에 개점할 지역을 not-yet-treated로** | 미확인. 정규매장 지출 감소·온라인 증가 |
| **Proserpio, Goli, Mangini, Lau & Yu**, *IJRM* 43(2), 2026 — Amazon 친환경 인증 [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0167811625000369) | 제품별 프로그램 편입 시점 | TWFE vs **Gardner two-stage** | **보고됨.** 결과 유사 |

**발제 활용 제안**

- **금서 논문의 Figure 4**: 네 추정법이 거의 일치하는 사례. "항상 뒤집히는 것은 아니다"를 보여준다.
- **무료배송 논문**: 효과가 시간이 지나며 커지는 마케팅 개입. BLW Simulation 5–6과 같은 구조라 TWFE가 위험한 상황임을 설명하기 좋다.
- **오프프라이스 매장**: "나중에 처치될 지역을 통제군으로" 쓰는 not-yet-treated 설계와 그때의 무예상 가정(BLW 권고 5)을 설명하기 좋다.
- 이 세 사례에 Proserpio의 부호 반전 18–25%를 겹치면 "잘 맞는 논문도 있고, 분야 전체로는 경제학보다 불일치가 크다"는 균형 잡힌 메시지가 된다.

### 7.2 마케팅 연구자 대상 방법론 자료

- **Goldfarb, Tucker & Wang (2022), "Conducting Research in Marketing with Quasi-Experiments," *JM* 86(3)** — BLW와 같은 해. 처치 시점 차이와 효과 이질성 때문에 고정효과 DID가 오도할 수 있다는 점과 CS·SA 대안을 설명한다. [DOI](https://journals.sagepub.com/doi/10.1177/00222429221082977)
- **He & Rao (2024), "Methods for Causal Inference in Marketing," *Foundations and Trends in Marketing* 18(3–4)** — 넓은 지도. staggered 집중 해설은 아니다.
- **Li, Luo & Pattabhiramaiah, "Causal Inference with Quasi-Experimental Data," AMA 웹 글, 2024-11-20** — 학술논문이 아닌 교육용 글. "Staggered Treatment Timing" 절이 BLW로 들어가는 짧은 다리다. [AMA](https://www.ama.org/marketing-news/causal-inference-with-quasi-experimental-data/)

---

## 8. 발제 준비용 자료

### 8.1 그림·코드·강의자료

| 자료 | 쓰임 |
|---|---|
| [BLW 출판 원문](https://andrew-charles-baker.github.io/research/articles/staggered_did/did.pdf) Fig. 2·3·6·7 | Fig. 2(문제)와 Fig. 7(해결책)을 짝지으면 흐름이 선명하다 |
| [Baker의 JFE_DID 재현 코드](https://github.com/andrewchbaker/JFE_DID) | 2022-01 버전 재현 코드. 원래 자료 준비에는 **WRDS/Compustat 접근 필요** |
| [Cunningham, *Mixtape* Ch.10](https://mixtape.scunning.com/10-complex_diff_in_diff) Fig. 10.6·10.8·10.9 | 네 가지 2×2 비교, 효과가 일정할 때와 변할 때의 대비. forbidden comparison 설명용 정적 그림 |
| [Goodman-Bacon 2019 WP](https://cdn.vanderbilt.edu/vu-my/wp-content/uploads/sites/2318/2019/07/29170757/ddtiming_7_29_2019.pdf) Fig. 1–3 | 세 집단에서 네 개의 2×2가 만들어지는 그림. **최종 출판본(*J. Econometrics* 2021)과 그림 번호가 다를 수 있음** |
| [`did` 패키지 TWFE 시뮬레이션 문서](https://bcallaway11.github.io/did/articles/TWFE.html) | R 코드와 그림으로 TWFE 사건연구의 문제를 재현. 실습용으로 가장 간편 |
| [`bacondecomp` vignette](https://cran.r-project.org/web/packages/bacondecomp/vignettes/bacon.html) | 2×2 추정치–가중치 산점도 |
| [PyFixest DiD 튜토리얼](https://pyfixest.org/tutorials/difference-in-differences.html) | Python으로 처치 시점 패널 그림, TWFE, SA형 event study, Gardner 2단계 |
| [Roth DiD Resources](https://www.jonathandroth.com/did-resources/), [Mixtape Advanced-DID staggered 슬라이드](https://github.com/Mixtape-Sessions/Advanced-DID/blob/main/Slides/02-staggered.pdf) | 강의 슬라이드. 출처 표기 시 교육 목적 활용을 허용 |

준비 시간을 줄이려면 Compustat 재현보다 **`did` 공식 시뮬레이션 → `bacondecomp` 또는 PyFixest**로 그림을 만드는 편이 쉽다.

### 8.2 마케팅 맥락의 가상 예시 (모두 교육용 가상 수치)

**예시 A — 지역별로 순차 출시한 개인화 추천 기능.** A지역 1월, B지역 4월, C지역 7월 출시. 결과는 고객당 주간 주문 수, 추천 학습으로 효과가 점점 커진다.

| 지역 | 3월 효과 | 4월 효과 | 3→4월 변화 |
|---|---:|---:|---:|
| A: 이미 출시 | +2 | +10 | +8 |
| B: 4월 출시 | 0 | +3 | +3 |

B의 출시 효과를 A와 비교한 2×2 DID는 **3 − 8 = −5**. 모든 효과가 양수인데, 이미 효과가 커지고 있는 A를 통제군으로 쓰면서 음수가 된다. 이것은 TWFE를 구성하는 **오염된 비교 하나**의 예다. 전체 TWFE 계수의 부호는 다른 비교와 가중치에 달려 있다.

**예시 B — 주별로 시행 시점이 다른 개인화 광고 동의 규제.** 시행 직후 전환율이 크게 떨어졌다가 광고주가 문맥 광고로 적응하며 회복한다. 후기 시행 주의 "직후 하락"을 조기 시행 주의 "회복기"와 비교하면 서로 다른 노출 기간의 효과가 섞인다. 선제 대응(무예상 위반)과 주 경계를 넘는 광고(spillover)도 같이 논의할 수 있다.

### 8.3 토론 질문

1. **마케팅 성과의 평균은 누구의 평균인가?** 고객당·매장당·매출 가중 효과 중 무엇을 estimand로 삼아야 하는가?
2. **새 추정법에서도 부호가 같으면 결론이 유지됐다고 할 수 있는가?** 효과 크기가 절반이 되면(BJS의 MPC 사례) 경영 판단은 바뀌는가?
3. **Fauver 논쟁에서**, 비교 가능성이 낮은 never-treated 국가를 추가하는 것과 적은 not-yet-treated로 버티는 것 중 무엇이 더 설득력 있는가?
4. **Hull(경제학)과 Proserpio(경영·마케팅)의 결과가 다른 이유는?** 처치효과 이질성, 불균형 패널, never-treated 부재, 공개 복제자료의 선택 중 무엇부터 점검하겠는가?
5. **추정법 교체에 쓸 노력과 평행추세·도입 메커니즘 검증에 쓸 노력을 어떻게 배분할 것인가?** 실적이 나쁜 지역부터 출시하는 회사 관행은 어느 쪽 문제인가?

### 8.4 마지막 슬라이드 후보: Staggered DID를 쓸 때 보고할 것

1. **처치와 시점**: 최초 시행·공지·실제 노출 중 무엇인가? 흡수적인가? 선행·잔존효과는?
2. **추정대상**: \(ATT(g,t)\), 사건시간 효과, 전체 ATT 중 무엇이며 어떤 가중치인가?
3. **비교군**: never-treated인가 not-yet-treated인가? horizon마다 비교군이 얼마나 남는가?
4. **식별 가정**: 무조건부·조건부 평행추세 중 무엇이며 왜 이 맥락에서 타당한가? spillover·동시 사건은?
5. **표본 구성**: 코호트별 시점·크기, 이탈, 사건시간별 기여 코호트, 공통 창 결과.
6. **공변량**: 측정 시점·선정 이유를 밝혔는가? 처치 후 변수를 통제하지 않았는가?
7. **사전계수**: 오염을 피했고 사전·사후 기준기간이 일관적인가? 비유의를 평행추세의 증명으로 읽지 않았는가?
8. **추론**: 클러스터 수, 특히 처치 클러스터 수와 보완책.
9. **민감도**: HonestDiD 등으로 평행추세 위반 허용 범위와 breakdown value.
10. **재현성**: 패키지 버전·옵션. 대안 비교 시 같은 표본·대상·가중치.

연결 문장 후보:

> "BLW(2022)는 staggered TWFE가 잘못된 비교를 섞을 수 있음을 보였다. 2026년의 과제는 비교를 고치는 데서 그치지 않고, 무엇을 평균하는지, 사전계수가 무엇을 측정하는지, 불확실성을 어떻게 계산하는지까지 공개하는 것이다."

### 8.5 실습 시 주의: 같은 방법, 다른 기본값

- **R `did` 2.5.1 (2026-07)**: 기본 비교군 never-treated, 기준기간 `varying`.
- **Stata `csdid` 2.0 이상**: 기본 비교군 **not-yet-treated**, 기준기간 **universal**로 변경. 1.8x 계열은 never-treated·varying. [변경기록](https://psantanna.com/csdid/news.html)
- 같은 CS를 돌려도 R과 Stata 결과가 다를 수 있으므로 옵션을 명시해 고정한다.
- Wing 등의 R `stackdid`와 Triplett의 Stata `stackdid`는 이름만 같은 별개 구현이다.

주요 패키지 버전(확인 시점 기준): R `did` 2.5.1, `fixest` 0.14.2, `didimputation` 0.5.1, `did2s` 1.2.1, `HonestDiD` 0.2.8, `etwfe` 0.6.2, `DIDmultiplegtDYN` 2.4.0; Python `pyfixest` 0.70.0, `differences` 0.3.0, `csdid` 0.4.5.

---

## 9. 검증 범위와 주의

- **직접 교차검증한 것**: Proserpio(2026)의 arXiv 버전 이력(v1 2026-11-07, v2 2026-11-10)과 초록 수치(355개 사양·40편, 부호 반전 25.1%/18.0%, 유의한 반전 10.2%/7.2%, 상관 0.61/0.70, SE 비율 1.61/1.30; v1·v2 동일), Chiu 등의 *APSR* 120(1) 서지와 49편 표본, 금서 논문의 *Marketing Science* 44(4) 서지와 CS·SA 사용.
  - 검색 요약 중에는 Proserpio 수치를 24.6%/16.1%로 표시한 것이 있었으나 출처를 확인할 수 없어 arXiv 원문 수치를 사용했다.
- **Codex 조사 결과에 의존한 것**: 나머지 서지·수치·패키지 버전. 각 항목에 원문 링크를 달았으니, 슬라이드에 넣을 수치는 링크를 한 번 열어 확인하는 것이 좋다. 특히 Hull·Proserpio는 수정 중인 working paper라 수치가 바뀔 수 있다.
- **미확인으로 남은 것**: Google Scholar 인용 수, Fauver 등 반론의 확장 표본 계수, Wang & Jv의 BLW 직접 반론 여부, 몇몇 마케팅 논문의 TWFE 수치 비교, 일부 Stata 명령의 배포 버전.
- Hull(2026)은 [Continuous DID 최신 논의](20261111_Continuous_DID_최신논의.md) 1.1절에도 정리돼 있으며 수치가 일치한다.
