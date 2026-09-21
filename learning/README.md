# 개인 학습자료

서비스 주소: https://minvv23-marketing-data-analysis.vercel.app/learning/

13주, PDF 28편의 심층요약·개념 퀴즈, 주차 안내와 보충문서를 제공한다. 사이트 루트는 발표자료 목록이며 학습 웹은 `/learning/`에서 별도로 접근한다. 발표용 슬라이드는 [presentation](../presentation/README.md)에 있다.

## 읽는 방법

- 주차별 세로 목차에서 심층요약, 개념 퀴즈, PDF를 연다.
- 제목과 본문을 함께 검색할 수 있다.
- 퀴즈의 예상 답안은 개별 또는 전체 펼치기로 확인한다.
- `가 −` / `가 +`로 목록·본문·수식·표의 크기를 3단계로 조절한다.
- 읽음 표시, 글자 크기, 밝은/어두운 화면 설정은 브라우저에 저장한다.
- 좁은 화면에서는 위쪽의 문서 목차를 펼쳐 이동한다. 긴 수식과 표는 해당 영역 안에서 가로로 스크롤한다.

## 자료를 수정할 때

작업용 원본은 프로젝트 최상위의 `literatures/`다. `web`에서 실행한다.

```sh
npm run sync:learning
npm run build
npm run check
```

`sync:learning`이 원본 Markdown/PDF를 이 폴더의 `materials/`로 복사한다. 이 사본을 Git에 포함하므로 Vercel은 외부 폴더 없이 빌드한다. 저장소만 복제한 작업자는 `materials/`를 수정하고 `npm run build`로 반영할 수 있다. 원본도 사용하는 작업환경으로 돌아올 때에는 변경사항을 원본에 반영한 뒤 동기화해야 한다.

빌드가 수식 구문 오류를 검사하며, `npm run check`가 PDF·내부 링크, 문서 70개, PDF별 퀴즈 10문항을 확인한다. 검사는 설명의 학술적 정확성을 대신하지 않는다.

## 로컬 열기와 파일 역할

- `index.html` 또는 빌드 결과 `../dist/learning/index.html`을 더블클릭해 열 수 있다.
- `materials/`는 원문과 Markdown을 담는다. 이동할 때 이 폴더도 함께 옮겨야 PDF 링크가 유지된다.
- `assets/content.js`는 수식까지 미리 변환한 전체 문서와 검색용 본문이다.
- `scripts/build.mjs`는 Markdown 처리 전에 수식을 분리하여 역슬래시·표 기호 손상을 방지한다.
- [KaTeX](https://katex.org/docs/api)는 HTML과 MathML을 함께 제공한다. 관련 CSS·수식 글꼴은 `assets/katex`에 있다.
- 한글·영문 본문은 `assets/fonts`의 로컬 Pretendard 가변 글꼴을 사용한다. 각 라이선스를 함께 포함한다.
- `verification/`에는 브라우저 점검 스크립트와 과거 화면 개편 기록이 있다. 과거 경로·스크린샷은 당시 버전의 기록이다.

발표자료와 별개로, 이 학습 웹은 로컬 문서·글꼴을 사용하여 인터넷 없이도 읽을 수 있다. GitHub/Vercel 배포는 [통합 README](../README.md)를 참고한다.

by TaeYoung Kang
