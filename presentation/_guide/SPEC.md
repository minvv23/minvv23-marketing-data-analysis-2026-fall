# 발표 준비 독해가이드 공통 규격 (조각 작성자용)

대상 독자: 발표자 본인 한 명. OLS와 2×2 DID의 기본 개념만 아는 상태에서 11/18 발표를 준비한다. 이 가이드는 발표 슬라이드(`../20261118-presentation.html`, 27장)와 대본(`../_src/20261118/notes.md`)을 이해하고 질문에 답할 수 있게 만드는 것이 목적이다. 슬라이드와 대본에 있는 내용을 "왜 그렇게 되는지"까지 풀어 주고, 슬라이드에 짧게만 나온 것은 충분히 길게 설명한다. 분량을 아끼지 않는다.

## 1. 산출물

- 각자 맡은 조각 하나를 `parts/` 아래에 HTML 조각으로 쓴다. `<!doctype>`, `<html>`, `<head>`, `<style>`, `<script>` 없이 본문 요소만 쓴다.
- 조각 최상위는 `<section class="part" id="pN">` 하나이고 첫 요소가 `<h2>`다. 소절은 `<section class="sub" id="pN-이름"><h3>…</h3> … </section>`, 그 아래는 `<h4>`.
- id는 아래 4절 목록의 것을 그대로 쓴다 (다른 조각이 이 id로 링크한다). 목록에 없는 소절을 더 만들어도 되지만 id는 `pN-` 접두사를 붙인다.

## 2. 마크업 어휘 (조립 스크립트와 CSS가 이것만 처리한다)

| 용도 | 마크업 |
|---|---|
| 본문 | `<p>`, `<ul>`, `<ol>`, `<strong>`, `<em>` |
| 핵심 정리 | `<aside class="note key" data-label="핵심">…</aside>` |
| 헷갈리기 쉬운 점 | `<aside class="note warn" data-label="헷갈리기 쉬운 점">…</aside>` |
| 손계산 따라가기 | `<aside class="note calc" data-label="손계산">…</aside>` |
| 발표에서 말할 문장 | `<aside class="note say" data-label="발표에서는">…</aside>` (이 상자 안만 발표체 "~습니다") |
| 수치의 출처 구분 | `<aside class="note src" data-label="수치의 출처">…</aside>` |
| 표 | `<div class="tbl"><table><thead>…</thead><tbody>…</tbody></table></div>` |
| 접는 질문과 답 | `<details class="qa"><summary>질문 문장</summary><div class="ans">답 (여러 문단 가능)</div></details>` |
| 인라인 수식 | `<tex>\delta = \sum_i w_i \tau_i</tex>` |
| 별행 수식 | `<tex class="d">Y_{it} = \alpha_i + \lambda_t + \delta D_{it} + \varepsilon_{it}</tex>` |
| 원문 그림 | `<figure class="fig"><img data-fig="fig9.png" alt="설명"><figcaption>…</figcaption></figure>` |
| 덱의 장으로 가는 링크 | `<a class="deck" data-s="8" data-b="0">덱 8장</a>` (data-s는 1부터 센 장 번호, data-b는 단계 번호) |
| 계산기 자리 | `<div class="widget" data-w="이름"></div>` (이름은 4절에 지정된 것만) |
| 가이드 안 다른 절 | `<a href="#p1-bacon">…</a>` |

- 수식 안에는 `<`, `>`를 쓰지 않는다 (`\lt`, `\gt`). `&`는 그대로 써도 된다. KaTeX가 렌더하므로 KaTeX가 지원하는 명령만 쓴다. `\text{}` 안의 한글은 피하고, 한글 설명은 수식 밖에 쓴다.
- 쓸 수 있는 원문 그림(`../_src/20261118/img/`): fig5.png, fig8i.png, fig8ii.png, fig9.png, fig10i.png, fig11.png, fig12i.png, fig13i.png, fig13ii.png. Read 도구로 직접 열어 무엇이 그려져 있는지 확인하고 설명한다. 원문은 CC BY.
- 볼드는 핵심 구절에만. 목록 여러 항목 중 하나에만 볼드를 주지 않는다.

## 3. 문체와 정확성

- 본문은 격식 평서체 "~다". 친절하게 쓰되 구어로 내려앉지 않는다. 개념어와 방법론 동작에는 학술 어휘를 쓴다 (가정했다, 완화한다, 사용한다, 추정한다).
- 사용자 매뉴얼 `[For Coding Agent] Hunnae Knowledge Warehouse/AI식-한국어-표현.md` §0 체크리스트와 §6-12 ⑦ 검색어를 지킨다. 특히 em대시와 en대시 0개(하이픈만), 가운뎃점 나열 금지(쉼표), 본문 화살표 금지(문장으로), "A가 아니라 B" 습관적 대구 금지, 제목에 콜론 금지, 일상 사물 비유(무게, 몫, 그릇) 금지, 구어 동사(쏠리다, 꼽다, 매기다, 거치다, 드러나다, 치우치다, 곱해, 훑다, 뽑다, 골라, 빼고, 살짝) 금지. 범위는 물결표 대신 하이픈.
- 용어는 처음 나오는 자리에서 풀고 영어를 괄호로 병기한다. 이후에는 같은 용어로 고정한다. 덱의 용어를 따른다: 시차 도입(staggered adoption), 이중차분법(DID), 처치집단, 비교집단(comparison group), 평행추세 가정(parallel trends assumption), 반사실적 결과(counterfactual outcome), 평균처치효과(ATT), 코호트(cohort), 아직 미처치(not-yet-treated), 미처치(never-treated), 마지막 처치(last-treated), 이미 처치된 단위, 상대시점(relative time), 사건연구(event study), 기준기간(reference period), 구간 묶음(binning), 사전추세(pre-trend), 예고효과(anticipation), 군집강건 표준오차(cluster-robust standard error), 사건창(event window).
- 약어(TWFE, BLL, FHLT, CS, SA, CATT, IPW, VWATT, VWCT, ΔATT, ROA, Tobin's Q, Compustat)는 각 조각에서 처음 나올 때 다시 풀어 쓴다. 조각마다 단독으로 읽혀야 한다.
- 인용은 내용을 먼저 쓰고 출처를 문장 끝 괄호에 둔다 ("…이다 (원문 3.1절)").
- 수치는 모두 출처가 있어야 한다. 출처는 네 종류로 구분해 표시한다: 원문(표, 그림, 절 번호), 심층요약의 교육용 가상 수치, 덱이 브라우저에서 다시 계산한 값(균형패널 단순화), 후속논의 문서의 논문 이후 연구. 슬라이드 README의 "화면 수치의 출처" 문단을 따른다. 확인할 수 없는 수치는 쓰지 않는다.
- 손계산은 직접 다시 계산해 확인한다. `node`로 `../_src/20261118/stats.js`를 불러 쓸 수 있다 (`const ST = require('…/stats.js')` 또는 파일을 읽어 `new Function`으로 실행. 파일 끝의 export 방식을 확인할 것).
- 원문 PDF는 Read 도구의 `pages`로 읽는다 (한 번에 20쪽까지). 경로: `literatures/Week 10 (2026-11-18)/How much should we trust staggered difference-in-differences estimates (2022).pdf` (과목 폴더 기준).
- 같은 내용을 소절마다 똑같은 틀(왜, 무엇, 숫자, 주의)로 찍어내지 않는다. 내용에 맞춰 순서와 상자를 바꾼다.

## 4. 조각과 id 목록

| 파일 | 최상위 id | 제목(예시) | 소절 id |
|---|---|---|---|
| parts/1-basics.html | p1 | 기초에서 핵심 직관까지 | p1-setting, p1-po, p1-did, p1-twfe, p1-fwl, p1-bad, p1-toy, p1-negw, p1-bacon, p1-weights, p1-when |
| parts/2-sim.html | p2 | 시뮬레이션과 사건연구 | p2-why, p2-design, p2-six, p2-diag, p2-type2, p2-type1, p2-es, p2-fig5, p2-sa |
| parts/3-alt.html | p3 | 대안 추정량, 재분석, 권고 | p3-idea, p3-cs, p3-sa, p3-stacked, p3-compare, p3-bll, p3-fhlt, p3-rec, p3-after |
| parts/4-deck.html | p4 | 장별 발표 가이드 | p4-s1 … p4-s27 (장마다 하나) |
| parts/5-qa.html | p5 | 예상 질문, 수업 자료와의 연결, 용어집 | p5-qa-core, p5-qa-hard, p5-qa-prof, p5-links, p5-glossary |

계산기(조립자가 구현, 조각에는 자리만 둔다):
- `toy-el` (p1-toy): E, L 두 집단, 세 시점. E의 2기, 3기 효과와 L의 3기 효과를 사용자가 바꾸면 비교 ①, ②의 DID, TWFE 계수(=1·τE2 − ½·τE3 + ½·τL3), 칸 평균 효과를 보여 준다. 기본값은 덱과 같은 2, 10, 2.
- `bacon-ukl` (p1-bacon): U(미처치), k(2기 도입), l(4기 도입), 다섯 시점. U의 단위 수(0, 1, 2, 4, 10)와 효과 형태(덱의 증가형 1, 3, 5, 7 / 일정형 k=4, l=2)를 바꾸면 네 2×2의 가중치, DID, TWFE 계수, 참 평균효과를 보여 준다. `ST.bacon`을 그대로 사용한다.
- `sim` (p2-six): Sim 1-6을 고르면 잡음 없는 코호트 평균 자료에서 TWFE 계수, 참 ATT(기업평균, 관측치평균), 2×2 분해 표를 보여 준다. `ST.SIMS`, `ST.bacon` 사용.

## 5. 끝나면

조각 파일을 저장한 뒤 매뉴얼 ⑦의 검색어로 조각의 텍스트를 점검하고 걸린 것을 고친다. 보고는 짧게: 쓴 소절, 대략 글자 수, 확인하지 못해 뺀 수치나 남은 의문, 조립자가 알아야 할 점.
