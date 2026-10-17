store zip 실현 가능 · 작성기 gzip 914 B · /studio 진입 증분 0 · 조작 뒤 +1.06KB · HTML_MAX 해소 = B안만(A안 미해소) · ZIP64 불필요

# M4-a-1 REPORT — store zip 자체 작성 · 이미지 분리 실측 스파이크

**결론: store zip 실현 가능 · 작성기 gzip 914 B(단독 minify, 분리 포함 조작 뒤 청크 +1.06KB) · /studio 진입 증분 0(정규화 128.66 → 128.66 · 복원 131.64 → 131.64 · raw 129.96 → 129.96) · 조작 뒤 exportFlow +1.06KB(3.32 → 4.38) · HTML_MAX 해소 = 조건부(부모만 바꾸는 A안은 상한을 올려야 함 → 미해소 / 렌더 참조 직렬화 B안은 해소, 렌더 JS +0.07KB) · ZIP64 불필요(30MB ≪ 4GiB-1)**

근거 수준: S1·S4·S5 = L1(실행 출력) · S2 B안 비용 = L1(빌드), B안 동작 = L2(타입체크·패치 적용 상태 전체 테스트 3041 통과, 브라우저 왕복 미실행) · S3 file:// 글꼴 = L1(Chromium 1회) / Safari·Firefox 미확인.

## 0. 기준선 (사실 — fresh build, base cee15e71 = a520e770 + 문서만)
- `npm run build` exit 0 (17.7s) → `raw/build-baseline.txt`
- /studio 정규화 128.66 · 복원 진입 131.64 · raw 129.96 / 133.00 · exportFlow 조작 뒤 +3.32KB(4개 파일) · 복원 시나리오 +2.31KB
- 렌더 문서 JS 84.22 / 90 (멈춤선 89.7) · CSS 8.89 / 30
- BRIEF 기준선 "복원 131.65"는 이 빌드에서 131.64(`m2cBaseline.json` normEagerKb와 같음) — 0.01 차이는 BRIEF 표기 쪽.

## 1. S1 store zip 작성기 (사실)
- 코드: `patches/s1-s4-zip-writer-split-wire.patch` 안 `app/src/features/studio/zip/storeZip.ts`(87줄).
  로컬 헤더(30B+이름) · 중앙 디렉터리(46B+이름) · EOCD(22B) · CRC-32(256 표) · 버전 2.0 · 플래그 0x0800(UTF-8 bit 11) · method 0(store) · DOS 시각 · 데이터 기술자(bit 3) 0 · extra 0.
  결과 = `Uint8Array[]` 조각(본문 복사 0) → `new Blob(parts, {type:"application/zip"})`.
- ZIP64 판단: 크기·오프셋 ≥ 0xFFFFFFFF 또는 항목 > 65535면 throw. 이미지 보관 한도 30MB + 글꼴 ≤ 0.72MB + HTML → 4GiB-1의 1% 미만 → **ZIP64 불필요**.
- 경로 검사: 앞 `/` · `..` 세그먼트 · `\` · 빈 이름 거절(zip-slip 방지).
- 테스트 6건 통과 (`cd app && npx vitest run src/features/studio/zip` → `Test Files 2 passed · Tests 6 passed`):
  CRC 표준 벡터(`123456789` → 0xCBF43926) · 순수 파서(EOCD→중앙→로컬, CRC 재계산·플래그·method) · 빈 목록 22B ·
  `unzip -t`("No errors detected") · `zipinfo`("4 files", "stor") · `unzip -p` 본문 일치 · `ditto -x -k` 추출(한글 파일명 포함) · 경로 거절.
- 크기: rolldown minify 단독 storeZip **1679 B raw · 914 B gzip** / splitImages(crc32 포함 번들) 826 B · 531 B gzip.
- macOS Archive Utility 호환 주의점(사실+추정):
  - (사실) `ditto -x -k`(macOS 내장 zip 해제)로 한글 이름 포함 추출 성공.
  - (추정) Archive Utility가 문제를 내는 대표 경우는 데이터 기술자(bit 3)+ZIP64 조합 스트리밍 zip — 이 작성기는 둘 다 쓰지 않는다.
  - (주의) 한글 파일명은 NFC로 기록 — Finder는 NFD로 보일 수 있으나 열기엔 지장 없음(미확인). 생성 파일 이름은 ASCII(해시)로 두는 것을 권장.
  - (미확인) Archive Utility GUI 더블클릭은 이 스파이크에서 실행하지 않았다(`ditto`로 근사).

## 2. S2 이미지 분리 (사실 + 분석)
### 현재 경로 (사실 — 코드)
1. 부모 `staticHtml.ts generate()` → `exportImages(doc, readImage)`(id → Blob 1장) → `renderAndSerialize`가 `render{images}` 전송.
2. 렌더 문서 `RenderApp` → `serializeSite(root)` → **`blob:` → data URL(FileReader)** → `html{markup}` postMessage.
3. 부모 `readHtmlMessage`(`render/htmlMessage.ts`) — `markup.length <= HTML_MAX(8,000,000)` 아니면 **버림 → 8초 뒤 JOB_TIMEOUT**(B-M2C-01).
4. `buildStaticHtml`(staticMarkup.ts) — 불활성 문서에서 clean → blob 검사 → `img src`는 `data:image/(webp|jpeg|png);base64,`만 허용 → 문서 1개.

### 측정 (사실 — S5 스크립트)
- 30MB 이미지 문서의 직렬화 마크업 = **41.9M자**(base64 4/3배) → 현 HTML_MAX 8M의 5.2배. 즉 data URL 경로로는 30MB 문서가 지금도 zip도 통과 못 한다.

### 끼우는 자리 — 두 안
| | A안: 부모만 (렌더 0) | B안: 렌더 참조 직렬화 |
|---|---|---|
| 변경 | `buildStaticHtml` 안 `clean`·blob 검사 뒤, data-only 검사 대신 `splitImages(site)`(data URL → `assets/images/<crc8>-<len36>.<ext>` + 파일) · `readHtmlMessage(data, max)` 상한 인자 | `serialize{refs:true}` → 렌더 문서가 `blob:` 대신 `image:<id>`로 직렬화(objectUrls `idOf`) → 부모가 이미 가진 `images[id].blob`을 파일로 |
| HTML_MAX | **미해소** — 전송은 여전히 41.9M자. zip 경로만 상한을 ≥ 42M으로 올려야 한다 | **해소** — 마크업에 이미지 바이트 0(섹션·글자만) |
| 렌더 문서 예산 | JS 84.22 → 84.22 (0) | JS 84.22 → **84.29 (+0.07KB)** / 90 · 멈춤선 89.7 안. CSS 0 (`raw/build-s2b-render-refs.txt`) |
| /studio 진입 | 0 (진입 청크 수정 없음) | 진입 청크(`protocol.ts`) **수정함** · 측정 0.00KB(정규화 128.66 그대로, 0.01 해상도 · 허용 0.03 안) |
| 메모리(30MB) | base64 문자열 ~42M자가 렌더·부모 양쪽 + atob 바이너리 문자열 + 바이트 | Blob 원본 그대로(복사 1회 = zip Blob) |
| 패치 | `patches/s1-s4-zip-writer-split-wire.patch` | `patches/s2b-render-refs-mode.patch` |
- **권고(★B)**: zip은 B안. HTML_MAX를 근본 해소하고 base64 왕복이 없다. 렌더 +0.07KB는 예산 여유 5.4KB 대비 작다. A안은 렌더 무변경이 장점이지만 상한 상향(B-M2C-01 재론)이 필요.
- 단일 HTML 내보내기의 B-M2C-01(8M 초과 → 시간 초과)은 zip과 별개로 남는다(사전 크기 안내 또는 zip 유도 — 결정 필요).
- 해시: 스파이크는 동기 CRC-32 8자리 + 길이(36진) — 같은 바이트는 1파일. 운영은 기존 `hex12`(SHA-256 12자리, 비동기)로 바꿔도 비용 차이 없음(추정).
- `buildStaticHtml` 결과 규칙 "img src = data:만"은 zip 모드에서 "`assets/images/` 상대 경로만"으로 바꿔야 한다(테스트 가드 갱신 필요).

## 3. S3 글꼴 동봉 (사실 + 분석)
- 현재: `loadSiteFonts`가 계열 1개 × 굵기 ≤ 2를 받아 `@font-face … src:url(data:font/woff2;base64,…)` CSS + 렌더 측정용 `bytes`(ArrayBuffer) 반환.
- 분리 경로: 같은 `bytes`를 그대로 `assets/fonts/<File>-<weight>.woff2` 항목으로 → CSS `src:url(assets/fonts/…)`. `assertNoExternalCss`는 zip 모드에서 `assets/` 상대 url 허용으로 바꿔야 한다. 고지는 `<head>` 주석 대신(또는 함께) `assets/fonts/OFL.txt`(4,388 B) 동봉이 OFL 관례.
- 크기(사실 — 파일): Kit Sans KR 400 172,048 B + 700 175,888 B = **347,936 B**(인라인 base64 ≈ 463.9K자) · Kit Serif KR 352,812 + 362,684 = **715,496 B**(≈ 954K자). zip 분리 시 base64 33% 절감.
- `file://` 실화면 확인(사실 — 브라우저 1회, ego-browser Chromium 154): 압축 푼 폴더 구조(`index.html` + `assets/fonts/KitSansKR-400.woff2` + `assets/images/x.png`)를 `file:///…/index.html`로 열어 `document.fonts.load` = 1면 · 상태 `loaded` · `check` true · 이미지 naturalWidth 1. → Chromium에서 **상대 경로 글꼴·이미지 모두 로드**. 처음 세운 "출처 null CORS 차단" 추정은 이 브라우저에서 틀렸다.
- (미확인) Safari·Firefox의 `file://` 상대 경로 글꼴. Firefox는 같은 폴더·하위 폴더 허용 정책으로 알려져 있음(추정). 브라우저별 차이가 걱정이면 글꼴만 인라인 유지가 안전한 대안(크기 +33%).
- 권고: 글꼴도 `assets/fonts/` 분리 + `OFL.txt` 동봉(★, Chromium 확인) — Safari 확인은 M4-a 구현 QA 항목으로.

## 4. S4 청크 배치 (사실 — `raw/build-s4.txt`)
- 패치: `exportFlow.ts`가 `storeZip`·`zipParts`·`splitImages`를 재수출(조작 뒤 청크 배치) + `readHtmlMessage(data, max)`.
- `npm run build` exit 0 · 가드 전부 통과.
| 항목 | 기준선 | S4 | 증분 |
|---|---|---|---|
| /studio 정규화 | 128.66 | 128.66 | **0** |
| /studio 복원 정규화 | 131.64 | 131.64 | **0** |
| /studio raw | 129.96 | 129.96 | 0 |
| 복원 raw | 133.00 | 132.99 | −0.01(해시 이름 흔들림) |
| exportFlow 조작 뒤 | +3.32KB | +4.38KB | **+1.06KB** |
| exportFlow 조작 뒤(복원 시나리오) | +2.31KB | +3.38KB | +1.07KB |
| exportFlow 청크(Vite gzip) | 1.46 kB | 2.53 kB | +1.07 |
| staticHtml 청크 | 6.14 kB | 6.15 kB | +0.01(상한 인자) |
| 렌더 문서 JS | 84.22 | 84.22 | 0 |
- 다른 라우트(/catalog · /references/:id · /compare · /profile · /projects): raw 값 −0.01 또는 0 — 정규화 판정이 없는 시나리오라 raw만 비교, 전부 해시 이름 흔들림 범위(±0.01). 증분 0.
- 운영 배치 권고: zip 작성기는 생성기(staticHtml) 청크 또는 별도 `retryableImport` zip 청크 — 어느 쪽이든 조작 뒤라 진입 0.

## 5. S5 큰 문서 (사실 — Node 24 근사, `patches/s5-bench.mjs` → `raw/s5-bench.txt`)
| 구성 | 마크업 | zip | base64 디코드 | crc32 | zipParts+Blob | 합 | unzip -t |
|---|---|---|---|---|---|---|---|
| 8장 × 3.75MB | 41.9M자 | 30.39MB | 73ms | 85ms | 89ms | 246ms | OK |
| 64장 × 0.47MB | 41.9M자 | 30.40MB | 78ms | 89ms | 94ms | 261ms | OK |
| 1장 × 30MB | 41.9M자 | 30.39MB | 82ms | 82ms | 85ms | 250ms | OK |
- 메모리(첫 구성, 시작 대비): rss +167MB · arrayBuffers +91MB(원본 30 + 디코드 30 + Blob 복사 30). B안은 디코드 30MB·base64 문자열이 빠진다(추정).
- zip 단계(디코드·crc·zipParts) ≈ 250ms = 사실(Node). 전체 파이프라인이 생성기 상한 8초 안인지는 **미확인** — 재지 않은 구간: 렌더 문서 FileReader data URL 변환(30MB) · 42M자 postMessage · `buildStaticHtml` innerHTML 42M자 파싱(A안). B안은 앞 둘이 빠진다(추정).

## 6. 미확인 · 다음
- Archive Utility GUI 더블클릭 · 브라우저 실화면 zip 내려받기(미실행). 브라우저 1회는 S3 file:// 글꼴 확인에 썼다.
- Safari·Firefox `file://` 상대 경로 글꼴.
- B안 렌더 참조 직렬화의 실제 내보내기 왕복(렌더 문서 ↔ 부모)은 타입체크·기존 테스트까지만.
- 결정 필요: (1) 이미지 분리 A/B(★B) (2) 글꼴 분리(★, Chromium 확인) vs 인라인 유지 (3) 단일 HTML의 B-M2C-01 처리.

## 7. 검증·정리 기록 (사실)
- 패치 적용 상태 전체 테스트: `cd app && npx vitest run` → `Test Files 349 passed · Tests 3041 passed` (`raw/vitest-all-patched.txt`, S1~S4 + S2b 모두 적용)
- B안 타입체크: `npx tsc --noEmit -p tsconfig.json` → 오류 0
- 빌드 3회 모두 exit 0: `raw/build-baseline.txt` · `raw/build-s4.txt` · `raw/build-s2b-render-refs.txt`(S4 패치 위에 B안 추가)
- 복원: `git checkout --` 자기 변경 5개 파일 + `app/src/features/studio/zip` 삭제 → `git diff -- app/` 빈 값 · `git apply --check` 두 패치 모두 통과(재현 가능)
- preview 서버: 띄우지 않음(브라우저 확인은 `file://` 임시 폴더, 삭제함) → lsof 대상 포트 없음
- 서브에이전트: 사용 안 함(S2 경로는 파일 5개라 직접 읽음)
- Codex 검증 r1: `review --scope branch --base a520e770` → "수정이 필요한 결함은 발견하지 못했습니다"(`raw/codex-r1.txt`). 1라운드로 종료.
