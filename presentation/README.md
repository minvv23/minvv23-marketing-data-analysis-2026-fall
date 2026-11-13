# 발표자료

수업 중 발표하는 슬라이드와 발표자용 보조자료다. PDF별 심층요약·복습용 개념 퀴즈는 [학습자료](../learning/README.md)에서 관리한다.

| 날짜 | 슬라이드 | 발표 보조자료 |
|---|---|---|
| 2026-09-09 | [RCT 발표](20260909-presentation.html) | [발표보조자료.md](발표보조자료.md) |
| 2026-11-18 | [Staggered DID 발표](20261118-presentation.html) | [후속 논의와 발제 자료](20261113_Staggered_DID_후속논의와_발제자료.md) |

- 기본 주소: https://minvv23-marketing-data-analysis.vercel.app/
- 슬라이드: https://minvv23-marketing-data-analysis.vercel.app/presentation/20260909-presentation.html
- 기존 링크: https://minvv23-marketing-data-analysis.vercel.app/20260909-presentation.html

20260909 슬라이드 파일의 내용과 조작법은 통합 과정에서 변경하지 않았다. 이 슬라이드는 기존처럼 Pretendard와 KaTeX를 CDN에서 가져오므로 인터넷 연결이 필요하다. 학습 웹의 글꼴은 별도로 로컬 파일을 사용한다.

새 슬라이드는 이 폴더에 `YYYYMMDD-presentation.html` 형태로 추가하고 상위 `web`에서 `npm run build`를 실행한다. 날짜 순 발표 목록과 기존 형식의 루트 URL이 자동 생성된다. 배포 절차는 [통합 README](../README.md)를 따른다.

## 20261118 슬라이드 (Baker, Larcker & Wang 2022)

만든 방향, 참고 자료, 코드 구조, 검증 내용은 [작업기록](20261118_Staggered_DID_슬라이드_작업기록.md)에 있다.

20장, 78단계. 1600×900 고정 무대를 화면에 맞춰 확대하므로 해상도와 윈도우 배율이 달라도 배치가 같다. 글꼴과 KaTeX 스타일은 `../learning/assets`의 로컬 파일을 쓰고, 파일만 따로 옮겨 열면 CDN으로 대신 불러온다. 수식은 빌드할 때 미리 렌더하므로 KaTeX 스크립트는 필요 없다.

**조작.** → Space PageDown Enter는 한 단계 진행, ← PageUp은 한 단계 뒤로. Shift와 화살표는 장 단위 이동, Home과 End는 처음과 끝, F는 전체 화면. 마우스 휠도 넘어간다. 클릭으로는 넘어가지 않으므로 화면의 버튼(분해 장의 U 단위 수)을 눌러도 장이 바뀌지 않는다. 주소 끝의 `#s8b6`은 8번째 장 6단계라는 뜻이다. 밑줄 친 용어에 마우스를 올리면 설명이 뜬다.

**원본과 빌드.** `20261118-presentation.html`은 생성물이다. 직접 고치지 말고 `_src/20261118/`을 고친 뒤 `web` 폴더에서 다시 만든다.

```sh
node presentation/_tools/build-20261118.mjs
```

| 파일 | 내용 |
|---|---|
| `_src/20261118/slides-*.html` | 장별 문구. `<tex>`는 빌드 때 KaTeX로 렌더된다 |
| `_src/20261118/viz-*.js` | 장별 도식. 요소를 한 번 만들고 단계마다 목표값만 정하면 트윈이 이어서 움직인다 |
| `_src/20261118/stats.js` | TWFE, Goodman-Bacon 분해, 사건연구, CS식 2×2, stacked 계산 |
| `_src/20261118/simcore.js` | 원문 3절 시뮬레이션의 균형패널 단순화 (모의자료 500개, 시드 고정) |
| `_src/20261118/engine.js`, `deck.css` | 넘김, 단계, 트윈, 레이아웃 |
| `_src/20261118/img/` | 원문 Fig. 5, 8, 9, 10, 12를 잘라 낸 그림 (원문은 CC BY) |

**화면 수치의 출처.** 재분석 장(BLL, FHLT)의 수치와 그림은 원문 Table 2, 3과 Fig. 8-12 그대로다. 작은 예제(E와 L, U와 k와 l, stacked 가중치)는 심층요약의 교육용 수치다. 시뮬레이션 장은 원문 설정(50개 주, 1980-2015년, 코호트 17/18/15개 주, 효과 크기)을 균형패널로 단순화해 브라우저에서 다시 계산하므로 원문 그림과 수치가 조금 다르다. 화면에도 그렇게 적었다. 제1종 오류 장의 21%(증가 속도 표준편차 3%)는 원문 Fig. 4와 같다. 마지막 확장 장의 재분석 수치는 [후속 논의 문서](20261113_Staggered_DID_후속논의와_발제자료.md)에 출처가 있다.

**점검.**

```sh
node presentation/_tools/test-stats-20261118.cjs      # 계산 코어를 심층요약의 손계산 값과 대조
node presentation/_tools/check-sim-20261118.cjs       # 시뮬레이션이 내는 수치 출력 (문구 대조용)
python3 presentation/_tools/shot-20261118.py OUT_DIR  # 장 × 단계 전수 캡처, 넘침과 글자 겹침, 콘솔 오류 검사
```

`shot-20261118.py`는 WSL의 `google-chrome`과 파이썬 `websocket-client`, Pillow를 쓴다. 장마다 단계별 캡처를 모은 `sheet_NN.jpg`도 만든다.
