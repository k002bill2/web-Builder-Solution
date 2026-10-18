/**
 * React zip 사용자 문구 (REACTZIP-SPEC 7a — 확정 문안 dev/active/m4b-impl/COPY.md, 글자 그대로). 키 이름 = SPEC `export.*` 관례.
 * reactZipCopy.test가 COPY.md 원문과 대조한다.
 * 모듈 경계 = 청크 경계: 버튼 글자(reactZipLabel — 진입) · 결과 줄(reactZipNotes — exportFlow) · 나머지(이 파일 — 생성기 청크).
 * 생성기 청크가 exportFlow 청크의 모듈을 import하면 exportFlow에 namespace 헬퍼가 생겨 공통 청크가 는다(E1 실측 +0.05).
 */

// export.format.reactZip — 진입 청크 분리 때문에 reactZipLabel.ts에 둔다(같은 문구 모음의 일부)
export { REACT_ZIP_FORMAT_LABEL } from "./reactZipLabel";

// export.note.reactZip · export.note.reactZipNext — exportFlow 청크 전용이라 reactZipNotes.ts에 둔다(같은 문구 모음의 일부)
export { REACT_ZIP_NEXT, reactZipNote } from "./reactZipNotes";

/** zip 안 README.md (RZQ-04 A — 실행 방법·Node 조건·서브셋 글꼴 고지) */
export const README_MD = `# 사이트 프로젝트

사이트 소스와 이미지·글꼴, 실행·빌드 설정이 들어 있는 프로젝트입니다.

## 실행 환경

Node.js와 npm이 필요합니다. Node.js 버전 조건은 다음과 같습니다.

\`\`\`text
^20.19.0 || >=22.12.0
\`\`\`

Node.js 20 계열은 20.19.0 이상을 사용하세요. 또는 22.12.0 이상을 사용하세요.
설치 중 버전 경고가 나오면 Node.js 버전을 확인하세요. 설치가 끝나더라도 위 조건에 맞는 버전을 사용하세요.

## 실행 방법

1. zip 파일의 압축을 푸세요.
2. 터미널에서 압축을 푼 폴더로 이동하세요. package.json이 있는 폴더입니다.
3. 다음 명령으로 의존성을 설치하세요. package-lock.json에 고정된 의존성을 설치합니다.

\`\`\`sh
npm ci
\`\`\`

4. 다음 명령으로 개발 서버를 시작하세요.

\`\`\`sh
npm run dev
\`\`\`

5. 터미널에 표시된 주소를 브라우저에서 여세요.

node_modules는 이 묶음에 들어 있지 않습니다. npm ci를 실행할 때 패키지 레지스트리에서 받습니다.

## 빌드와 확인

의존성을 설치한 뒤 다음 명령으로 배포용 파일을 만드세요.

\`\`\`sh
npm run build
\`\`\`

타입 검사에 통과하면 사이트를 빌드합니다.
빌드한 사이트를 로컬에서 확인하려면 다음 명령을 실행하세요.

\`\`\`sh
npm run preview
\`\`\`

터미널에 표시된 주소를 브라우저에서 여세요.

## 주요 파일

- src/site.json: 사이트 문서·디자인 값·이미지 정보입니다.
- src/kit/: 사이트를 구성하는 킷 소스입니다.
- src/assets/images/: 동봉한 이미지입니다. 이미지가 없으면 이 경로의 파일도 없습니다.
- src/assets/fonts/: 동봉한 글꼴과 글꼴 라이선스 전문입니다.
- LICENSES.md: 코드·의존성·글꼴·이미지의 권리와 이용 조건 안내입니다.

## 서브셋 글꼴 안내

동봉한 글꼴은 일부 글자만 포함한 서브셋 파일입니다.
내보낸 뒤 문구를 바꾸면, 동봉 글꼴에 없는 글자는 대체 글꼴로 보일 수 있습니다.
글꼴의 저작권·수정본·예약 글꼴 이름 고지는 LICENSES.md에서 확인하세요. 글꼴 라이선스 전문은 src/assets/fonts/OFL.txt에 있습니다.
`;

/** LICENSES.md 1절 머리(SPEC 6절 1) — files = zip entry 전체 수(README·LICENSES·OFL.txt 포함, 디렉터리 제외) */
export const licensesHead = (files: number) => `# LICENSES

이 묶음에는 사이트 소스, 실행·빌드 설정, 안내 문서와 동봉 자산을 포함해 총 ${files}개 파일이 들어 있습니다.

node_modules는 이 묶음에 들어 있지 않습니다. 의존성 패키지는 npm ci를 실행할 때 패키지 레지스트리에서 받습니다.
`;
/** LICENSES.md 2절 사이트 코드 — 킷 소스(SPEC 6절 2 — M4-a Q9 A와 같은 결정) */
export const LICENSES_SITE_CODE = `## 사이트 코드 — 킷 소스

src/kit/*, src/PageDocument.tsx, src/main.tsx, src/images.ts, src/types/* 및 실행·빌드 설정 파일은 생성 도구의 산출물입니다.

생성 도구는 이 코드·스타일에 대한 권리를 주장하지 않으며, 제약 없이 사용·수정할 수 있습니다.

이 사용 조건은 위에 안내한 생성 도구 산출물에 관한 것입니다. npm 패키지와 동봉 글꼴·이미지의 이용 조건은 각 절에서 확인하세요.
`;
/** LICENSES.md 4절 하위 의존성 — table = 라이선스 종류별 하위 패키지 수 Markdown 표(licenses.ts) */
export const licensesTransitive = (table: string) => `## 하위 의존성

하위 의존성의 버전은 package-lock.json에 고정되어 있습니다. 아래 표는 이 lock에 맞춰 확인한 하위 패키지의 라이선스 종류별 개수입니다.

${table}

lightningcss와 플랫폼별 바인딩 패키지(lightningcss-<platform>)의 라이선스는 MPL-2.0입니다. 이 패키지들은 Tailwind 빌드 도구의 하위 devDependency이며, 빌드한 사이트 번들에는 포함되지 않습니다.

출처: https://github.com/parcel-bundler/lightningcss

이 zip에는 node_modules가 들어 있지 않습니다. 의존성 패키지는 설치할 때 패키지 레지스트리에서 받습니다.
`;

// export.fail.pattern — 생성기 단언 실패(허용표·킷 원문·site.json 검증). M4-a EXPORT-SPEC 6.1 확정 문안 재사용
export const REACT_ZIP_FAIL_PATTERN = "내보낼 수 없는 내용이 있어 멈췄습니다 — 문제가 계속되면 알려 주세요";
