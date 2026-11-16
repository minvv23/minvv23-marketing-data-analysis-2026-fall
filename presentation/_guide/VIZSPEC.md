# 독해가이드 도식 추가 규격 (도식 작성자용)

사용자 요청: "문서 중간중간 그래프, 도식, 움직이는 이해를 돕는 요소를 넣어 달라." 대상 독자는 OLS와 2×2 DID만 아는 발표자 한 명이다. 도식은 글로 설명하기 어려운 직관을 **움직임과 조작**으로 보여 주는 것이 목적이다. 장식용 그림은 넣지 않는다.

## 1. 맡은 범위와 파일

- 각자 `viz-pN.js` 하나와 `parts/N-*.html` 하나만 수정한다. 다른 조각과 공용 파일(viz-kit.js, widgets.js, guide.css, build.mjs)은 고치지 않는다. 공용 파일 수정이 꼭 필요하면 보고에 적는다.
- `viz-p1.js`에는 조립자가 만든 참고 예제 `did-copy`가 이미 있다. 이 파일을 맡은 작성자는 그 아래에 이어서 쓴다. 다른 작성자도 이 예제를 먼저 읽고 패턴을 따른다.
- 조각에 넣는 자리: `<div class="widget" data-w="이름"></div>`. 바로 앞에 이 도식에서 무엇을 보면 되는지 1-2문장 안내를 쓴다(SPEC.md 3절 문체 규칙을 그대로 지킨다. 대시, 가운뎃점, 화살표, "아니라" 대구, 구어 동사, 콜론 제목 금지). 기존 본문은 필요한 연결 문장 외에는 고치지 않는다.

## 2. 도구 (viz-kit.js, 전역 GV)

- `GV.reg(name, host => {...})`로 등록한다. 초기화는 widgets.js가 화면 근처에 왔을 때 호출한다.
- `GV.stepper(host, {kind, title, w, h, steps:[설명 문장...], init(svg, F) { ...요소를 한 번 만든다...; return (step, anim) => {...단계별 목표값...} }})`: 단계 버튼(처음, 이전, 다음, 자동 재생), 진행 표시, 설명줄을 만든다. 설명 문장은 `steps`에 쓰며 HTML 가능. `F.top`은 svg 위 조작줄(분절 버튼, 슬라이더용, `controls:true`를 주어야 생김), `F.out`은 svg 아래 결과 영역이다.
- 단계가 없는 조작형 도식은 `GV.frame(host, {kind, title, w, h, controls:true, note})`로 틀만 만들고 `GV.seg(F.top, 라벨, [[값, 글자]...], 현재값, onChange)`, `GV.slider(F.top, 라벨, {min,max,step,value,fmt}, onInput)`을 쓴다.
- 그리기: `GV.s(tag, attrs, parent)`(SVG), `GV.h(tag, attrs, parent)`(HTML). attrs의 `text`, `css`(style 문자열), `cls`, `pts`(점 배열 [[x,y]...], polyline/path), `tx`/`ty`/`sc`(transform).
- 움직임: `GV.to(el, {속성: 목표}, {dur, delay})`는 숫자 속성, opacity, pts(같은 길이), tx/ty를 보간한다. `GV.show(el, on, opts)`는 투명도. `GV.count(textEl, 값, 소수자리, {pre, post})`는 숫자 라벨이 세며 바뀐다. **트윈할 속성(stroke-width 등)은 css 문자열에 넣지 말고 속성으로 준다** (style이 속성을 덮어쓴다).
- 축: `GV.lin(d0,d1,r0,r1)` 척도, `GV.yAxis(g, y, ticks, x0, x1, fmt)`, `GV.xTicks(g, x, ticks, yBase, fmt)`. `GV.fmt(x, d)`는 음수를 −로 쓴다.
- 색은 `GV.C('c1')`처럼 CSS 변수로만 쓴다(다크 모드 자동 대응): c1 먼저 도입한 코호트(E, k, 1989), c2 나중 코호트(L, l, 1998), c3 세 번째 코호트(2007) 또는 참값, u 미처치, bad 문제 소지 비교와 음의 가중치와 편향, ink, muted, line, soft, bg. 리터럴 색 금지.
- 계산은 덱 코어를 쓴다: `ST`(stats.js: twfe, bacon, demean, eventDesign, attgt, aggEvent, aggStatic, stacked, stackedEvent, SIMS, effPath, sim7Path, trueATT, NS, SIG, T, Y0), `SIM`(simcore.js, 모의자료 500개와 사건연구, 대안 추정량 분포. 덱이 쓰는 함수 그대로). 덱의 `viz-*.js`에 같은 계산을 화면에 그리는 코드가 있으니 참고한다(`web/presentation/_src/20261118/`). 수치를 손으로 만들지 말고 코어로 계산한다. 원문 표 수치(BLL, FHLT 등)는 3부 조각에 적힌 값과 원문 PDF로 확인한다.

## 3. 디자인 원칙 (사용자 Knowledge Warehouse의 웹 인터랙티브, 웹디자인 지침에서)

- 화면 = f(단계). 요소는 한 번 만들고 단계마다 목표값만 정한다. 같은 대상은 끝까지 같은 색. 관련된 것은 지웠다 새로 띄우지 말고 변형한다.
- 등장 순서: 무대(축, 격자) 다음 데이터 표시, 그다음 값 라벨, 마지막에 주석. 값 라벨이 표시보다 먼저 나오지 않는다. 반사실은 점선 윤곽.
- 0단계도 의미 있는 그림이어야 한다(빈 축만 띄우지 않는다). 단계는 3-7개. 설명 문장은 그 단계에서 새로 생긴 것만 말한다.
- 그라디언트, 그림자, 둥근 카드, 아이콘, 장식 모션, 네이티브 title 툴팁 금지.
- viewBox 폭은 560-680, 글자는 12-15px. 텍스트가 viewBox 밖으로 나가거나 서로 겹치지 않게 한다. 휴대폰에서는 svg가 최소 500px로 가로 스크롤된다.
- 슬라이더와 분절 버튼으로 조작하는 도식은 조작 결과가 즉시 그림에 반영되어야 하고, 값이 바뀌는 라벨은 `GV.count`로 세며 바뀌게 한다.

## 4. 점검

1. `web` 폴더에서 `node presentation/_guide/build.mjs` (조각과 viz 파일을 출력 폴더로 복사).
2. `node presentation/_guide/tools/viz-sheet.mjs <이름> <스크래치패드>/viz 640`로 단계별 접촉 시트를 찍고 Read로 열어 눈으로 확인한다. 보고의 `ERR`(스크립트 오류)와 `OUT`(viewBox 밖 텍스트)은 0이어야 한다. 다크 모드도 한 번: 네 번째 인자 `dark`. 캡처에서는 애니메이션이 즉시 완료된다.
3. 조작형 도식은 시트에 한 장만 나온다. 다른 값 상태도 확인하고 싶으면 init 직후 값을 바꾸는 임시 코드를 쓰지 말고, 기본값을 바꿔 한 번 찍은 뒤 되돌린다.
4. 조각의 안내 문장은 스크래치패드의 `stylecheck.py`로 점검한다(`python3 stylecheck.py parts/N-*.html`).
5. 커밋, 푸시, 배포는 하지 않는다. 다른 작성자가 동시에 build.mjs를 돌려 출력 폴더가 바뀔 수 있으니, 캡처가 이상하면 다시 빌드하고 찍는다.

## 5. 보고

짧게: 만든 도식 이름과 넣은 위치(소절 id), 각 도식이 보여 주는 것 한 줄, 계산 출처, 점검 결과(ERR/OUT), 남은 문제.
