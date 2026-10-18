# M4-b 문안 확정본 (Hemingway 초안 → Jarvis 대조·영환님 "1" 결정 반영, 2026-10-18)

출처: Hemingway 산출 `~/.hermes/profiles/jarvis/cache/scratch/m4b-copy.md`. 결정: 버튼은 현행 두 버튼과 같은 "… 내보내기" 접미사 · LICENSES 2절 킷 소스 문장 승인([법무 확인] 표식 제거) · 4절 NOTICE·소스 공개 의무 문장은 zip에서 제외(BACKLOG 릴리스 게이트).
**글자 그대로 옮긴다. 자리표시자 {size}{images}{fonts}{files}{transitiveLicenseTable}만 실제 값으로 치환.**

## export.format.reactZip (버튼)
```text
React 프로젝트(zip) 내보내기
```

## export.note.reactZip (성공 결과 줄)
```text
zip 1개 · {size} (이미지 {images}장 · 글꼴 {fonts}개)
```
- {size} = 현행 exportFlow의 소수점 한 자리 MB 표시 재사용 · {images} = 동봉 이미지 파일 수 · {fonts} = 동봉 woff2 수(OFL.txt 제외). 잃은 이미지는 현행 lostImageText를 따로 이어 붙인다.

## export.note.reactZipNext (다음 할 일)
```text
압축을 푼 폴더에서 npm ci → npm run dev 순서로 실행하세요. Node.js 버전 조건은 ^20.19.0 || >=22.12.0입니다.
```

## README.md (전문)
~~~markdown
# 사이트 프로젝트

사이트 소스와 이미지·글꼴, 실행·빌드 설정이 들어 있는 프로젝트입니다.

## 실행 환경

Node.js와 npm이 필요합니다. Node.js 버전 조건은 다음과 같습니다.

```text
^20.19.0 || >=22.12.0
```

Node.js 20 계열은 20.19.0 이상을 사용하세요. 또는 22.12.0 이상을 사용하세요.
설치 중 버전 경고가 나오면 Node.js 버전을 확인하세요. 설치가 끝나더라도 위 조건에 맞는 버전을 사용하세요.

## 실행 방법

1. zip 파일의 압축을 푸세요.
2. 터미널에서 압축을 푼 폴더로 이동하세요. package.json이 있는 폴더입니다.
3. 다음 명령으로 의존성을 설치하세요. package-lock.json에 고정된 의존성을 설치합니다.

```sh
npm ci
```

4. 다음 명령으로 개발 서버를 시작하세요.

```sh
npm run dev
```

5. 터미널에 표시된 주소를 브라우저에서 여세요.

node_modules는 이 묶음에 들어 있지 않습니다. npm ci를 실행할 때 패키지 레지스트리에서 받습니다.

## 빌드와 확인

의존성을 설치한 뒤 다음 명령으로 배포용 파일을 만드세요.

```sh
npm run build
```

타입 검사에 통과하면 사이트를 빌드합니다.
빌드한 사이트를 로컬에서 확인하려면 다음 명령을 실행하세요.

```sh
npm run preview
```

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
~~~

## LICENSES.md 1절 머리
```markdown
# LICENSES

이 묶음에는 사이트 소스, 실행·빌드 설정, 안내 문서와 동봉 자산을 포함해 총 {files}개 파일이 들어 있습니다.

node_modules는 이 묶음에 들어 있지 않습니다. 의존성 패키지는 npm ci를 실행할 때 패키지 레지스트리에서 받습니다.
```
- {files} = 실제 zip entry 전체 수(README·LICENSES·OFL.txt 포함, 디렉터리 제외).

## LICENSES.md 2절 사이트 코드(킷 소스)
```markdown
## 사이트 코드 — 킷 소스

src/kit/*, src/PageDocument.tsx, src/main.tsx, src/images.ts, src/types/* 및 실행·빌드 설정 파일은 생성 도구의 산출물입니다.

생성 도구는 이 코드·스타일에 대한 권리를 주장하지 않으며, 제약 없이 사용·수정할 수 있습니다.

이 사용 조건은 위에 안내한 생성 도구 산출물에 관한 것입니다. npm 패키지와 동봉 글꼴·이미지의 이용 조건은 각 절에서 확인하세요.
```

## LICENSES.md 4절 하위 의존성
```markdown
## 하위 의존성

하위 의존성의 버전은 package-lock.json에 고정되어 있습니다. 아래 표는 이 lock에 맞춰 확인한 하위 패키지의 라이선스 종류별 개수입니다.

{transitiveLicenseTable}

lightningcss와 플랫폼별 바인딩 패키지(lightningcss-<platform>)의 라이선스는 MPL-2.0입니다. 이 패키지들은 Tailwind 빌드 도구의 하위 devDependency이며, 빌드한 사이트 번들에는 포함되지 않습니다.

출처: https://github.com/parcel-bundler/lightningcss

이 zip에는 node_modules가 들어 있지 않습니다. 의존성 패키지는 설치할 때 패키지 레지스트리에서 받습니다.
```
- {transitiveLicenseTable} = 고정 lock 기준 `| 라이선스 | 하위 패키지 수 |` Markdown 표(직접 의존성 9개·루트 제외), 생성기 상수 + RZ-AC-17 대조. 3·5·6·7절은 현행 구현 유지.
