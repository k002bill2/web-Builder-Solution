/**
 * React zip 사용자 문구 자리 상수 (REACTZIP-SPEC 7a — [문안 미정] 키는 Hemingway가 쓰고 Jarvis가 반영한다).
 * 지금 값은 자리 표시용이다. 테스트는 키 존재·자리만 단언한다. 키 이름 = SPEC `export.*` 관례.
 * 진입(ExportButtons)은 버튼 글자 모듈(reactZipLabel)만 import한다 — 이 파일은 조작 뒤 청크(exportFlow·생성기)에서만 쓴다.
 */

// export.format.reactZip — 진입 청크 분리 때문에 reactZipLabel.ts에 둔다(같은 자리 상수 모음의 일부)
export { REACT_ZIP_FORMAT_LABEL } from "./reactZipLabel";

const MB = 1024 * 1024;
// TODO(copy): export.note.reactZip — 크기·이미지 수·글꼴 수
export const reactZipNote = (bytes: number, images: number, fonts: number) => `React 프로젝트 zip 1개 · ${(bytes / MB).toFixed(1)}MB (이미지 ${images}장 · 글꼴 ${fonts}개)`;
// TODO(copy): export.note.reactZipNext — 압축 해제 → npm ci → npm run dev, Node 버전 조건
export const REACT_ZIP_NEXT = "압축을 풀고 npm ci → npm run dev 로 실행합니다 (Node 20.19 이상 또는 22.12 이상)";

/** zip 안 README.md (RZQ-04 A — 실행 방법·Node 조건·서브셋 글꼴 고지) */
// TODO(copy): README 본문
export const README_MD = `# 사이트 프로젝트

이 묶음은 디자인 도구가 만든 React 프로젝트입니다. node_modules는 들어 있지 않고 설치할 때 받습니다.

## 실행

1. Node.js 20.19 이상 또는 22.12 이상을 준비합니다.
2. \`npm ci\` 로 package-lock.json 그대로 설치합니다.
3. \`npm run dev\` 로 개발 서버를 엽니다. \`npm run build\` 는 dist/ 에 정적 파일을 만듭니다.

## 글꼴

src/assets/fonts/ 의 글꼴은 이 페이지에 쓰인 글자만 담은 서브셋입니다. 문구를 고치면 서브셋에 없는 글자는 대체 글꼴로 보일 수 있습니다.
`;

/** LICENSES.md 머리(SPEC 6절 1) — files = zip 안 파일 수 */
// TODO(copy): LICENSES 머리
export const licensesHead = (files: number) =>
  `# LICENSES\n\n이 묶음에는 파일 ${files}개가 들어 있습니다. node_modules는 들어 있지 않으며, 설치할 때 npm 레지스트리에서 받습니다.\n`;
/** LICENSES.md 사이트 코드 절(SPEC 6절 2 — M4-a Q9 A와 같은 결정) */
// TODO(copy): 킷 소스 절
export const LICENSES_SITE_CODE = `## 사이트 코드

src/kit/*, src/PageDocument.tsx, src/main.tsx, src/images.ts, src/types/*, 설정 파일은 디자인 도구가 만든 산출물입니다. 제약 없이 사용·수정할 수 있습니다.
`;
