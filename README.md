# 마케팅자료분석론 웹

2026년 가을학기 윤태중 교수 수업의 발표자료와 개인 학습자료를 한 저장소·Vercel 프로젝트로 관리한다.

| 구분 | 서비스 주소 | 소스 | 설명 |
|---|---|---|---|
| 발표자료 목록 | https://minvv23-marketing-data-analysis.vercel.app/ | `scripts/build.mjs`에서 생성 | 기본 진입 화면. 학습자료를 자동으로 열지 않는다. |
| 발표자료 | https://minvv23-marketing-data-analysis.vercel.app/presentation/ | [presentation](presentation/README.md) | 수업 중 발표할 슬라이드와 발표 보조자료 |
| 학습자료 | https://minvv23-marketing-data-analysis.vercel.app/learning/ | [learning](learning/README.md) | 13주 PDF별 심층요약, 개념 퀴즈, 원문 |

기존 `/20260909-presentation.html` 주소도 그대로 작동한다. 하위 경로를 나눈 것은 탐색 구조이며 비공개 접근 제어는 아니다.

## 폴더 구성

```text
web/                        # 기존 presentation 저장소의 Git 이력과 Vercel 연결 유지
├── presentation/           # 발표 HTML, 발표 보조자료, 전용 README
├── learning/               # 학습 웹, 전용 README
│   ├── materials/          # 배포·빌드용 Markdown/PDF 사본 (Git 관리)
│   ├── assets/             # 미리 렌더한 문서, 로컬 수식·본문 글꼴
│   └── scripts/build.mjs   # Markdown과 수식 변환
├── scripts/                # 자료 동기화, 통합 빌드, 링크·문항 검증
├── dist/                   # 자동 생성되는 Vercel 배포 결과 (Git 제외)
├── package.json
└── vercel.json
```

## 로컬 작업

Node.js 20 이상이 필요하다. 이 `web` 폴더에서 실행한다.

```sh
npm ci
npm run build
npm run check
```

`dist/index.html`은 발표자료 목록, `dist/learning/index.html`은 학습자료다. 더블클릭해서 열 수 있으며, HTTP 확인은 `python -m http.server 8765 --directory dist` 후 `http://localhost:8765/learning/`로 한다.

작업용 원본 `../literatures`를 고쳤다면 먼저 동기화한다.

```sh
npm run sync:learning
npm run build
npm run check
```

동기화는 원본을 수정하지 않고 `learning/materials`로 복사한다. GitHub에서 이 저장소만 복제한 경우에도 포함된 `learning/materials`만으로 빌드할 수 있다. 이 경우 `sync:learning`은 실행할 필요가 없다. 원본 폴더가 있는 작업환경에서는 원본을 먼저 수정하고 동기화하여 두 사본이 달라지지 않게 한다.

## GitHub / Vercel

- GitHub: https://github.com/minvv23/minvv23-marketing-data-analysis-2026-fall
- Vercel 프로젝트: `minvv23-marketing-data-analysis-2026-fall`
- Git 저장소 루트는 로컬 `web` 폴더 자체다. Vercel Root Directory는 기본값 `.`을 사용한다. 다시 `web`을 지정하면 안 된다.
- 설치: `npm ci`, 빌드·검증: `npm run build && npm run check`, 출력: `dist`.
- `main` 브랜치 push가 기존 GitHub 연결을 통해 프로덕션 배포를 시작한다.
- `.vercel`은 기존 프로젝트 연결을 로컬에 유지하며 Git에는 넣지 않는다.
- README와 검증 스크립트는 저장소에서 관리하고, 배포 결과는 `dist`에 필요한 웹 파일만 담는다.

제작: TaeYoung Kang
