# 학습 인터랙티브

심층요약 본문 중간에 들어가는 조작형 그림이다. 텍스트와 정적 도식만으로 헷갈리기 쉬운 계량경제 개념을, 가정이나 수치를 직접 바꿔 보며 확인하게 한다.

## 구조

- `core.js`: 공통 도구 `window.LI`. 모든 모듈보다 먼저 실행된다.
- `<id>.js`: 인터랙티브 하나. `LI.register('<id>', root => { ... })`로 등록한다. 파일명과 id가 같아야 한다.
- `dev.html`: 개발용 확인 화면. `dev.html?id=<id>` 또는 `&dark=1`로 연다. 빌드에 포함되지 않는다.
- 빌드(`scripts/build.mjs`)는 `core.js`와 모든 모듈을 해시 파일 하나로 묶는다. 앱은 인터랙티브가 있는 문서를 열 때만 이 파일을 불러온다.

## 본문에 넣는 방법

심층요약 Markdown에서 설명할 문단 바로 뒤에 다음 블록을 둔다. 블록 안 문장은 그림 아래 설명으로 표시되며, Markdown 뷰어에서는 이 문장만 보인다.

```markdown
<!-- learning-interactive:iv-types -->
**직접 조작해 보기: 순응 유형이 바뀌면 Wald 추정치는 누구의 효과인가.** 설명 2-4문장.
<!-- /learning-interactive -->
```

id가 `interactives/`에 없으면 빌드가 실패한다.

## LI API 요약

| 함수 | 용도 |
|---|---|
| `LI.stage(root,{width,height,narrowWidth,narrowHeight,label})` | 반응형 SVG. 그릴 때마다 `st.layout()`을 먼저 부르고 `st.narrow`, `st.width`, `st.height`로 배치한다. 좁은 화면(열 폭 560px 미만)에서는 좁은 viewBox로 다시 배치한다. `st.onResize(fn)`로 폭 전환 시 다시 그린다. |
| `LI.controls(root,specs,onChange)` | 슬라이더(`{key,label,min,max,step,value,format}`)와 토글(`{key,label,type:'toggle',value}`), "처음 값으로" 버튼. 반환값의 `state`가 현재 값이다. |
| `LI.readout(root)` | 핵심 수치 표. 반환 함수에 `[[이름, 값, 보충설명, 강조여부]]`를 넘긴다. |
| `LI.legend(root,[[라벨,색,점선,속빈]])`, `LI.note(root,text)` | 범례와 해설 문장 |
| `LI.el(tag,attrs,parent)`, `LI.html(...)` | SVG, HTML 요소 생성. `text` 속성은 textContent |
| `LI.scale([d0,d1],[r0,r1])`, `LI.axis(svg,scale,{side,at,ticks,format,label})`, `LI.polyline(svg,points,attrs)` | 좌표 변환, 축, 선 |
| `LI.rng(seed)`, `LI.normal(rand)` | 시드 고정 난수. 시뮬레이션은 반드시 이것을 쓴다 |
| `LI.fmt(v,digits)`, `LI.pct(v,digits)` | 한국어 숫자 형식 |
| `LI.C` | 색: `blue`, `rust`, `gray`, `pale`, `ink`, `muted`, `line`, `accent`. CSS 변수라서 어두운 화면에서도 맞게 바뀐다 |

## 원칙

- 화면은 컨트롤 값의 함수다. 같은 값이면 언제나 같은 그림이 나온다. 시간 기반 애니메이션, `Math.random()`은 쓰지 않는다.
- 색 역할을 고정한다. 파랑은 처치나 관심 집단, 녹색 계열(rust)은 비교 대상이나 반사실, 회색은 배경 집단이다. 보라 그라디언트, 그림자, 의미 없는 모션은 쓰지 않는다.
- SVG 글자는 넓은 화면 viewBox 기준 13-15, 좁은 화면(360 폭) 기준 14-16을 쓴다. 휴대폰에서 11px 아래로 내려가지 않게 한다.
- 모든 조작은 네이티브 `input` 요소로 하고 라벨을 단다. 브라우저 `title` 툴팁은 쓰지 않는다.
- 문구는 번역투 없는 격식체. em대시, 화살표 금지.
