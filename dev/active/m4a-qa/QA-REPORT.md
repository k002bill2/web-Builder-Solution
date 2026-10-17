# M4-a-4 QA REPORT — 정적 zip 내보내기 릴리스 게이트 1차(정적·회귀·생성물)

**1차 판정: PASS with notes** (정적·회귀·생성물 범위) — 릴리스 최종 판정은 2차 실화면(`LIVE-PLAN.md`) 이후입니다. 근거·노트 = 7절.

- 대상: `k002bill2/m4a-qa` = m4a-impl tip `a834eb88` · main 분기점 `b75483ee`
- 근거 표기: [사실] 실행 출력·코드 직접 확인(L1) · [추정] 코드 읽기 판단(L3) · [미확인] 이번 run에서 확인 못 함
- 범위: 1차 = 정적·회귀·생성물. 실화면 브라우저 흐름은 2차(`LIVE-PLAN.md`)

## 1. fresh 게이트 · 예산 — 통과 [사실]
로그 `logs/{typecheck,lint,test,build}.txt` (이 워크트리 · 2026-10-18 fresh 실행)

| 게이트 | 명령 (`app/`) | 결과 |
|---|---|---|
| typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0 |
| lint | `npx eslint .` | exit 0 |
| test | `npx vitest run` | Test Files 353 passed (353) · Tests 3130 passed (3130) · exit 0 |
| build | `npm run build` | exit 0 · bundle 가드 통과 |

| 예산 | 기대 | QA 실측 | 판정 |
|---|---|---|---|
| `/studio` 해시 정규화 진입 | 128.71 | **128.71** (기준선 128.71 + 0.03, 멈춤 > 128.74) | 통과 |
| 복원 진입 정규화 | 131.69 | **131.69** (멈춤 > 131.72) | 통과 |
| 렌더 문서 JS | 84.29 / 90 | **84.29** / 90 · CSS 8.89 / 30 | 통과 |
| Developer 최종 로그와 대조 | `m4a-impl/logs/build-r2-ego.txt` | `[bundle]` 줄 전부 **동일**(diff 0) | 통과 |

- **다른 라우트 무변화**: main `b75483ee`를 임시 worktree(`/tmp/m4a-qa-main`, 측정 뒤 제거)에서 같은 node_modules로 build해 대조(`logs/main-b75483ee-bundle.txt`).
  - /catalog·/references·/compare(2)·/profile(2)·/projects 7줄: 이 브랜치가 main 대비 raw **0 ~ −0.02KB**(증가 0). 예: /compare 자동 포함 122.67 → 122.65 · /profile 119.94 → 119.93.
  - [추정] −0.01~−0.02는 청크 해시 이름 흔들림(ADR-004 개정 16 근거: 무관 1글자 → −22B)입니다. 다른 라우트 판정은 raw라 정규화 값이 없습니다. 증가가 없으므로 회귀 아님.
  - `/studio` 정규화 main 128.70 → 128.71(+0.01) · 복원 131.68 → 131.69(+0.01) = ADR-004 개정 18 M4-a 몫(+0.10) 안. 기준선 파일 `m2cBaseline.json`은 개정 18 커밋(8aa9a60f)에서 128.71·131.69로 갱신됨 — Developer REPORT 1절의 "기준선 파일 수정 0"은 **M4-a 구현 커밋 범위 한정**으로 읽어야 맞습니다(사실 기록, 결함 아님).
  - 렌더 JS main 84.22 → 84.29(+0.07) = 스파이크 실측과 같음(SPEC 8a Q17 B).

## 2. EXP-AC 판정표 — Developer 판정 재현 (재실행 최소) [사실 + 추정 표기]
근거 방식: ① 1절 fresh 전체 test 353/3130 통과(모든 U 테스트 실행 증거) ② 테스트 이름의 AC 태그 `grep` ③ 4절 변이(테스트가 실제로 그 기능을 지키는지) ④ 3절 생성물 실측. 개별 재실행은 하지 않았습니다.

| AC | Developer | QA 근거 | QA 판정 |
|---|---|---|---|
| 01 버튼 2개·순서·React 0 | 통과 | `ExportFlow.test.tsx` "형식 버튼" 순서 단언 · 소스 `ExportButtons.tsx` 대조(5b) | 통과 |
| 02 흐름(검사→차단→경고→저장→1회) | 부분 | 태그 테스트 0건. `ExportFlow.test.tsx` zip 완료 테스트가 `requestExport("project-1","static-zip",3)` 1회만 단언 · E-AC-28~30 차단·경고·저장 먼저 시나리오는 `static-html`로만 돎 | **부분 — 사유 확인**. [추정] 흐름 코드가 형식 무관(`format !== "react-zip"` 분기 1곳)이라 위험은 낮음 |
| 03 zip 바이트(서명·stored·CRC·EOCD·시각) | 통과 | `storeZip.test.ts`(CP1 24건) · `staticHtml.test.ts` · 3절 `unzip -t`·`zipinfo -v` 실측 · M1b 6 FAIL | 통과 |
| 04 결정성 | 통과 | 태그 테스트 · 3절 같은 입력 2회 해시 동일 · M1b FAIL | 통과 |
| 05 허용표·순서·디렉터리 0·ASCII | 통과 | `staticZip.test.ts` · 3절 entry 순서·디렉터리 0 실측 | 통과 |
| 06 고유 id·번호·확장자 | 통과 | `staticZip.test.ts` · 3절 같은 id 2슬롯 → 파일 1 실측 | 통과 |
| 07 data:image 0·고아 0 | 통과 | `staticZip.test.ts` · 3절 scan(`data:` img 0 in zip) | 통과 |
| 08 참조 직렬화 markup < 1MB | 통과 | 태그는 17 테스트에 함께("markup은 이미지 크기와 무관 < 1MB") · M1a 3 FAIL | 통과 |
| 09 글꼴 상대 경로·wOF2·≤2 | 통과 | `staticHtml`·`staticZip` 테스트 · 3절 실제 Pretendard `file` = WOFF2 | 통과 |
| 10 LICENSES.md | 통과 | `licenses.test.ts` · 3절 내용 실측(5절 순서·OFL 전문·목록 = entry·사용자 글자 0) | 통과 |
| 11 F-11 링크 | 통과 | `staticMarkup.test.ts` 태그 | 통과 |
| 12 F-12 앵커 대상 | 통과 | `staticMarkup.test.ts` 태그 | 통과 |
| 13 F-14 브랜드 | 통과 | `staticMarkup.test.ts` · M2b FAIL · **M2a·M2c 생존(G1·G2)** | **통과 with notes** — 제외 범위 테스트 공백(4c) |
| 14 ZIP_MAX → refused·키·alert 1 | 부분 | `exportFlow.test.ts` 단언 = `kind: "retryable"` + 사유 문구 · M3·M3b FAIL | **부분 — 사유 확인**(Developer 편차 3: `memoryDocBook runJob`이 모든 생성기 실패를 retryable로 기록). 문구 일치 · 상한 동작 확인 · 재시도 버튼이 보이는 점만 SPEC과 다름 |
| 15 `<stem>_r<rev>.zip` | 통과 | `exportFileName.test.ts` · 3절 한글 이름 NFC | 통과 |
| 16 3MB 안내 "다음 단계" 0 | 통과 | `exportFlow.test.ts` · 5b 소스 0건 | 통과 |
| 17 단일 HTML 참조 경로·20MB 성공 | 통과 | `staticHtml.test.ts` · M1a FAIL · 기존 정적 HTML 단언 삭제 0(4a) | 통과 |
| 18 링크 게이트 줄 | 이월 | 소스·테스트 0건 · 게이트 테스트 diff 0(4a) | 해당 없음 — M4-a-2b 이월(Q1 A) |
| 19 예산 진입 증분 0 | 해소 | 1절 build `[bundle]` 실측 | 통과 |

### 바뀐 기존 단언 — 이전/이후 (약화 여부)
- Developer REPORT 2절 표 5행을 4a의 `git diff` 삭제 9줄과 1:1 대조 → 전부 **문구 교체(+ import 1줄)**이고 단언 수·강도 감소 0, skip 0. 이후 쪽은 오히려 `static-zip` 요청 형식 단언·React 버튼 0 단언이 늘었습니다. 판정: **약화 아님**.
- 예외 1건: `ExportFlow.test.tsx`의 새 단언이 조사 오류 문장을 고정(5a) — 약화는 아니지만 수정 시 함께 바꿔야 함.

## 3. 생성물 검증 (Node) — 통과 [사실]
방법: 단위 테스트 픽스처(`staticHtml.test.ts`의 DOC·STORE·FILES·가짜 렌더 채널)를 복제한 임시 테스트 `app/src/features/studio/staticHtml/qaArtifact.test.ts`(커밋 안 함 · 실행 뒤 삭제)로 실제 생성기 `createStaticHtmlGenerator`를 돌려 `/tmp/m4a-qa-out/`에 파일로 썼습니다. 픽스처 대비 바꾼 입력 2가지:
- 글꼴 바이트 = 실제 `app/src/assets/fonts/Pretendard-{Regular,Bold}.subset.woff2`(픽스처는 가짜 `wOF2:` 문자열)
- 이미지 3장 = 실제 PNG(python zlib) · JPEG(`sips`) · WebP(`cwebp`) 16×16, 같은 id를 2슬롯이 씀(A 2회 · B · C)
- 파일 이름 = `staticZipFileName("모던 카페 홈페이지", 3)` · `staticHtmlFileName(…)`

| 검사 | 명령 | 결과 |
|---|---|---|
| 한글 파일 이름 | `staticZipFileName` → 디스크 | `모던-카페-홈페이지_r3.zip` · `.html` — NFC `True`(python `unicodedata.is_normalized`) |
| 무결성 | `unzip -t <zip>` | 8 entry 전부 OK · "No errors detected" · exit 0 |
| 구조 | `zipinfo` · `zipinfo -v` | 8 entry 전부 `1.0 fat · stor`(stored) · version needed 1.0 · extended local header no · 암호화 0 · 디렉터리 entry 0 · 시각 `2026-09-26 09:00`(= 픽스처 DOC.updatedAt, Q6) · 558,158 B 무압축 |
| entry 순서 | `zipinfo` | index.html → LICENSES.md → assets/fonts/OFL.txt → Pretendard-400 → Pretendard-700 → img-01.png → img-02.jpg → img-03.webp (SPEC 2.4 · 글꼴 폴더 이름순에서 `O` < `P`) |
| 해제 | `ditto -xk` (보관 유틸리티 엔진) · `unzip -d` | 둘 다 exit 0 · `diff -r` 동일 · 권한 `-rw-r--r--` (외부 속성 0이어도 읽기 가능) |
| 구성 | — | 이미지 3장 입력 → **8파일**. 브리프의 "7파일"은 이미지 2장 기준(index · LICENSES · OFL · 글꼴 2 · 이미지 2 = 7, Developer R2 실측과 같은 공식) — 공식 일치 |
| 바이트 | `cmp` | 해제한 이미지 3장·글꼴 400 = 입력 원본과 바이트 동일 · `file`: PNG/JPEG/WebP(VP8)/WOFF2 v1.20250 |
| 고유 id | — | 같은 id 2슬롯 → 파일 1개(img-01) · 번호 = markup 첫 등장 순 · 확장자 = Blob type |
| LICENSES.md | 내용 확인 | 5절 순서(머리 · 글꼴 — Pretendard · 이미지 — 사용자 업로드 · 그래픽 — 자체 생성 · 코드·스타일) · "파일 8개" = 실제 entry 수 · 글꼴 경로 2 · 이미지 경로 3 = entry 목록 · OFL 전문 포함(`OFL.txt` 본문이 LICENSES 안에 그대로 — True) · 사용자 글자(모던·카페·스페셜티·홈페이지) 0 · 브랜드("Design Studio"·금지 4글자) 0 |
| OFL.txt | 내용 확인 | Pretendard 저작권 + Reserved Font Name 문장 → OFL 1.1 전문(PREAMBLE · PERMISSION & CONDITIONS · TERMINATION · DISCLAIMER 전부 있음) 4,434 B |
| 결정성 | 같은 입력 2회 | zip 해시 `5e745212e62e` 2회 동일 · HTML 해시 `ab19b57ee40d` 2회 동일 (EXP-AC-04) |
| index.html 외부 요청 | `scan.py`(python html.parser — URL 속성·style url()·@import·link·script·base·meta 집계) | URL 속성 = `#s-…` 앵커 3 + `assets/images/img-0N` 3 · CSS url() = `assets/fonts/Pretendard-{400,700}.woff2` 2 · link 0 · script 1(고정 메뉴) · base 0 · meta 3(charset·viewport·description, refresh 0) · `@import` 0 · `blob:` 0 · `image:` 마커 0 · 문자열 `http(s)://` **0** |
| 단일 HTML 외부 요청 | 같은 스캔 | img src = data:image/{png,jpeg,webp} · CSS url() = data:font/woff2 · 외부 요청 후보 **0** · 문자열 `http(s)://` 2건은 **둘 다 `<head>` OFL 주석 안**(github.com/orioncactus · scripts.sil.org — 요청 생성 안 함) |
| F-14 실바이트 재현 | — | 단일 HTML의 Pretendard base64 안에 금지 4글자(`aPfS`, 위치 429,576 — `url(data:font/woff2;…` 안)가 실제로 들어 있고 생성은 **성공**. Developer R2의 "실제 글꼴이면 매번 실패" 원인과 09c4309d 수정을 실제 글꼴 바이트로 재확인 |

- 한계 [미확인]: 픽스처의 킷 CSS는 단위 테스트용 짧은 문자열입니다. 실제 build `render.css`(Tailwind 라이선스 주석 `https://tailwindcss.com` 포함 — Developer R2 관찰)는 2차 실화면에서 봅니다. 렌더 문서도 가짜 채널이라 실제 iframe 직렬화 결과가 아닙니다.

## 4. 회귀 · 변이 — 통과 with notes (테스트 공백 2건) [사실]
### 4a. 기존 흐름 무변화 — `git diff b75483ee..HEAD` 대조
| 영역 | 테스트 파일 | 이전 → 이후 | 판정 |
|---|---|---|---|
| 게이트 8줄 | `GatePanel.test.tsx` · `engine/gate/runGate.test.ts` | diff 0 | 무변화 |
| 편집기 저장 흐름 | 편집기·저장 테스트 | diff 0 (소스 변경도 `editorEvents.ts` 이벤트 형식 유니온에 `static-zip` 추가뿐) | 무변화 |
| PNG 내보내기 | `PngSave.test.tsx` | 1줄 — 버튼 이름 `정적 HTML 내보내기` → `HTML 파일 1개 내보내기` | 이름만 바뀜(약화 아님) |
| 단일 HTML(Q5 참조 직렬화) | `staticHtml.test.ts` +137/−0 · `staticMarkup.test.ts` +85/−0 | 기존 단언 삭제 0 · 참조 경로 단언 추가 | 무변화 + 보강 |
| 버튼·문구 | `ExportFlow` · `ExportChunkFailure` · `ExportResultNotes` · `exportFlow.test.ts` | 테스트 삭제 줄 9줄 = 문구 교체 8줄 + `exportFileName.test.ts` import 확장 1줄(React zip → 정적 사이트(zip) · "zip 내보내기는 다음 단계" → "이미지를 파일로 나눠 담습니다") · 단언 개수 감소 0 | 약화 아님 |
- 테스트 전체 diff: 14파일 +647/−9 — 삭제 9줄 = 위 문구 교체 8줄 + import 1줄. fresh 전체 test 353/3130 통과(1절).

### 4b. 변이 — 로그 `logs/mutations.txt` (매번 `git checkout` 원복 · 원복 뒤 `git status` = 로그 파일만)
| # | 변이 | 결과 | 판정 |
|---|---|---|---|
| M1a | 단일 HTML 참조 Blob 합침 제거 | 3 FAIL | 잡힘 |
| M1b | zip 이미지 entry(부모 Blob) 제거 | 6 FAIL | 잡힘 |
| M2a | F-14 제외 = `data:` 조건 없이 모든 `url()` | 146 통과 | **생존 — 공백 G1** |
| M2b | F-14 제외 = 고정 부분 전체 비움 | 2 FAIL | 잡힘 |
| M2c | F-14 제외 = `data:` 뒤 탐욕 매치(`.*`) | 146 통과 | **생존 — 공백 G2** |
| M3 | ZIP_MAX 검사 제거 | 1 FAIL | 잡힘 |
| M3b | ZIP_MAX 경계 완화(`> ZIP_MAX + 2MB`, 실효 66MB) | 1 FAIL (115 중) | 잡힘 |
- 브리프 변이 3종(참조 Blob 합침 / F-14 제외 범위 확대 / ZIP_MAX) 모두 대표 변이는 FAIL. 다만 F-14 확대 3변형 중 2개가 생존.
- [추정] M3b가 잡힌 것은 테스트 입력이 65MB(상한 +1MB)라서입니다. +1MB 미만 완화(예: `>=` ↔ `>`)는 잡지 못합니다 — 경계 테스트(정확히 64MB / 64MB+1B)가 없음. 64MB 버퍼 테스트가 느려 굳이 넣을 가치는 낮아 **기록만** 합니다.

### 4c. 테스트 공백 — 수정 제안(패치 · 커밋 안 함 · QA가 임시로 넣어 원본 통과 / 변이 실패 확인)
- **G1 (M2a 생존)**: zip 대상은 `assets/fonts/<계열>-<굵기>.woff2`가 외부 요청 검사를 통과하므로, F-14 제외를 모든 `url()`로 넓혀도 그 경로 안 브랜드 글자를 못 잡습니다. [추정] 지금 글꼴 계열은 고정(Pretendard)이라 실사용 위험은 낮음.
- **G2 (M2c 생존)**: 기존 테스트는 브랜드가 마지막 `)` 뒤에 있어 탐욕 매치가 삼키지 못합니다. data: 글꼴 2개 사이의 고정 CSS 브랜드를 숨기는 회귀를 못 잡습니다. [추정] 실제 킷 CSS는 400·700 두 @font-face를 연달아 쓰므로 G2가 G1보다 현실적.
- 검증(두 run에 나눠 확인): QA-M2c = 원본 통과 · M2c FAIL(첫 run — 같은 run의 QA-M2a는 `parts` 미정의로 작성 오류) · QA-M2a = 원본 25/25 · M2a FAIL(재시도 run) · 아래 합친 패치를 원본에 그대로 넣은 1회 실행 26/26 통과 — 합친 패치로 변이 재실행은 하지 않음(`logs/mutations.txt` "QA 보강"·"4c 합친 패치" 절).
```diff
--- a/app/src/features/studio/staticHtml/staticMarkup.test.ts  (파일 끝에 추가)
+describe("F-14 data: 제외 범위 (QA G1·G2)", () => {
+  const legacy = ["a", "p", "f", "s"].join("");
+  const face = `@font-face{font-family:"Kit Sans KR";src:url(data:font/woff2;base64,AAAABBBB) format("woff2")}`;
+  it("data: 글꼴 두 개 사이 CSS의 브랜드 = 실패 (탐욕 매치 금지)", () => {
+    expect(() => build({ css: `${CSS}${face}.${legacy}-x{color:red}${face}` })).toThrow("정적 HTML 브랜드");
+  });
+  it("zip 글꼴 상대 경로 url()의 브랜드 = 실패 (data: 아닌 url()은 제외 안 함)", () => {
+    expect(() => build({ target: "zip", markup: siteMarkup(), css: `${CSS}@font-face{font-family:"K";src:url(assets/fonts/${legacy}-400.woff2) format("woff2")}` })).toThrow("정적 HTML 브랜드");
+  });
+});
```

## 5. 문구 — 조사 오류 1건 확인 · 키 미구현 1건 [사실]
### 5a. 성공 문장 조사
- [사실] `app/src/components/studio/ExportAfter.tsx:113` = `` `${NAME[result.format]}을 만들었습니다 · …` `` — 형식 이름 뒤 고정 조사 `을`. `NAME["static-zip"] = "정적 사이트(zip)"` → 화면 **"정적 사이트(zip)을 만들었습니다"**. 조사는 괄호 앞 말("사이트", 받침 없음)에 맞춰 **"를"**이 맞습니다. `static-html`("정적 HTML을" — 에이치티엠엘, 받침 ㄹ)은 맞음.
- [사실] 테스트 `ExportFlow.test.tsx`가 틀린 문장 `"정적 사이트(zip)을 만들었습니다 · …"`를 **그대로 고정**하고 있어, 문구를 고치면 이 단언도 함께 바꿔야 합니다. Developer REPORT 8절·9절 4번에 이미 관찰로 기록(문안 후속) — QA 재현 일치.
- 수정 제안(커밋 안 함): 저장소에 이미 받침 판정 도우미(`objectOf` — `features/studio/opNotice.ts` 등)가 있으나 괄호 처리 규칙이 달라, 형식별 목적어를 표로 두는 편이 단순합니다.
```diff
--- a/app/src/components/studio/ExportAfter.tsx
-const NAME: Readonly<Record<ExportFormat, string>> = { "react-zip": "zip", "static-html": "정적 HTML", "static-zip": "정적 사이트(zip)" };
+const NAME: Readonly<Record<ExportFormat, string>> = { "react-zip": "zip", "static-html": "정적 HTML", "static-zip": "정적 사이트(zip)" };
+/** 성공 제목의 목적어 — 조사는 괄호 앞 말에 맞춘다("사이트(zip)를") */
+const MADE: Readonly<Record<ExportFormat, string>> = { "react-zip": "zip을", "static-html": "정적 HTML을", "static-zip": "정적 사이트(zip)를" };
@@ :113
-          title={`${NAME[result.format]}을 만들었습니다 · 내보내기 전 상태는 스냅샷 '${result.snapshotName}'에 있습니다`}
+          title={`${MADE[result.format]} 만들었습니다 · 내보내기 전 상태는 스냅샷 '${result.snapshotName}'에 있습니다`}
--- a/app/src/components/studio/ExportFlow.test.tsx
-    const done = await within(gateRegion()).findByText("정적 사이트(zip)을 만들었습니다 · …
+    const done = await within(gateRegion()).findByText("정적 사이트(zip)를 만들었습니다 · …
```
- 판정: 결함(경미 · 문구) — 릴리스 차단 아님, 수정 권고.

### 5b. EXPORT-SPEC 문구 키 ↔ 화면 문자열 대조 (`grep -rF` · 테스트 파일 제외)
| SPEC 위치 · 키 | SPEC 문장 | 화면 문자열 위치 | 판정 |
|---|---|---|---|
| 1.2 버튼 1 | 정적 사이트(zip) 내보내기 | `ExportButtons.tsx` | 일치 |
| 1.2 버튼 2 | HTML 파일 1개 내보내기 | `ExportButtons.tsx` | 일치 |
| 2.5 `export.note.htmlLarge` | 메일 첨부에는 클 수 있습니다 — 정적 사이트(zip)는 이미지를 파일로 나눠 담습니다 | `exportFlow.ts` · 옛 "다음 단계에서 지원" 소스 0건 | 일치 |
| 2.5 결과 줄 | zip 1개 · {n}MB (이미지 {k}장 · 글꼴 {f}개) | `exportFlow.ts` | 일치 |
| 6.1 `export.fail.tooLarge` | 묶음이 {n}MB로 상한 64MB를 넘어 만들지 않았습니다 — 큰 이미지를 줄여 주세요 | `zip/staticZip.ts` `tooLargeText` | 문장 일치 · 자리는 refused 아님(EXP-AC-14 부분 — 2절) |
| 6.1 `export.hint.blocked` | 내려받기가 시작되지 않으면 브라우저의 다운로드 권한을 확인하세요 | `ExportAfter.tsx` (성공 Callout, 두 형식) | 일치 |
| 6.1 `export.fail.pattern` | 내보낼 수 없는 내용이 있어 멈췄습니다 — 문제가 계속되면 알려 주세요 | **소스 0건** | **미구현 — 편차 미기록** |
| 5.2 `gate.row.links` · `gate.links.*` 4개 | 링크 · … | 소스 0건 | 해당 없음 — EXP-AC-18 이월(M4-a-2b, Developer REPORT 4절) |
| (SPEC 밖) 생성기 없음 안내 | 정적 사이트(zip)는 생성기 연결 후 내보낼 수 있습니다 | `ExportAfter.tsx` | 조사 맞음(는) |
- `export.fail.pattern` [추정 — 코드 읽기]: F-11~F-15 단언은 `shown` 표식 없는 `Error`라 `exportFlow`의 일반 재시도 실패 문구("내보내지 못했습니다 · 다시 시도")로 보입니다. 사용자에게 거짓 성공은 아니고 alert 자리도 같지만, SPEC 6.1 문장이 아니며 Developer REPORT 3절 편차 목록에 없습니다. 판정: 문구 편차(경미) — 문안 후속(Hemingway)과 함께 처리 권고. 실화면 문구는 2차 run에서 확인.

## 6. LIVE-PLAN — 작성 완료 [사실]
- `dev/active/m4a-qa/LIVE-PLAN.md`: 브라우저 설치 실측(Ego Lite·Chrome·Edge·Safari 있음 · **Firefox 없음** · Archive Utility 있음) · 매트릭스 L1~L10 실행 순서·예상 턴(≈ 26) · 자동(ego-browser)/수동(Safari) 구분 · Firefox·Windows 탐색기 BLOCKED.

## 7. 최종 판정 (1차) — PASS with notes
### 7a. FAIL 조건 대조
| 조건 | 판정 | 근거 |
|---|---|---|
| 거짓 성공 | 해당 없음 | 3절 실제 파일 무결성·구성·바이트 일치 · 4b 변이 대표 3종 FAIL(성공을 꾸며내는 경로를 테스트가 잡음) · 용량 초과·금지 패턴은 실패로 끝남(성공 표시 0) |
| 회귀 | 해당 없음 | 4a 게이트·편집기 저장 테스트 diff 0 · PNG·단일 HTML 단언 삭제 0 · 3절 F-14 실바이트 재현(09c4309d 수정이 실제 글꼴에서 성공) · fresh test 3130/3130 |
| 예산 초과 | 해당 없음 | 1절 `/studio` 128.71 · 복원 131.69 · 렌더 JS 84.29/90 · 다른 라우트 증가 0 |

### 7b. 노트 (심각도 순 · 릴리스 차단 아님)
1. EXP-AC-14 부분 — 용량 초과가 SPEC 6.1 refused가 아니라 retryable(재시도 버튼 노출). 문구·상한 동작은 맞음 (2절 · Developer 편차 3).
2. `export.fail.pattern` 문장 미구현 — F-11~F-15 실패는 일반 재시도 문구로 보임 [추정] · Developer 편차 목록에 없음 (5b).
3. 성공 제목 조사 오류 "정적 사이트(zip)을" → "를" — 테스트가 틀린 문장을 고정 · 패치 5a.
4. EXP-AC-02 부분 — 차단·경고·저장 먼저 시나리오를 zip 형식으로 돌린 테스트 없음 (2절).
5. 테스트 공백 G1·G2(F-14 제외 범위 변이 M2a·M2c 생존 · 패치 4c 검증됨) · ZIP_MAX 경계(64MB±1B) 테스트 없음(기록만).

### 7c. 열린 항목 (Jarvis · 2차)
- 09c4309d(F-14 data: 제외 수정) Codex 미검토 — 이번 run은 브리프상 Codex 금지라 QA 범위 밖. 다음 레인 1회 권고(Developer 9절 3번).
- `PngSave.test.tsx:122` 수정이 `rs8-ux-fix`와 같은 파일 — 병합 순서·충돌은 Jarvis 판단(Developer 편차 2).
- 실화면 R1~R5 = QA 미확인(2차) · R3 큰 문서 = Developer BLOCKED → LIVE-PLAN L9 · Firefox 미설치·Windows 탐색기 없음 = BLOCKED.
- [사실] QA 대상은 `a834eb88`. 이후 m4a-impl tip이 `38208e8d`로 진행됨(`38208e8d docs(m4a-impl): FIX1 브리프·PROGRESS 체크리스트;`) — 그 커밋은 이 판정 범위 밖.

### 7d. 마감 상태 [사실]
- preview·http.server: 이번 run 미기동 · `lsof -nP -iTCP:4395 -sTCP:LISTEN` exit 1 · `:4396` exit 1.
- 변이·임시 테스트: 매번 `git checkout` 원복(로그의 `restored:` 줄) · 앱·테스트 커밋 0.
- 임시 worktree `/tmp/m4a-qa-main`: 디렉터리 없음 · `git worktree list`에 미등록(`prune -v` 출력 0).
- `git status --short`: 마감 커밋 뒤 빈 값.


## 8. 2차 실화면 (무인 Chromium 행) — 진행 중
대상 tip `ee09160c`(1차 + FIX1 `41385e10`) · Ego Lite(Chromium) TaskSpace 37 · preview `127.0.0.1:4395` · 출력 `/tmp/m4a-qa-live/` · 스크립트 `logs/live/`

### 8.0 fresh 게이트 — 통과 [사실]
`logs/live-{typecheck,lint,test,build}.txt`: typecheck exit 0 · lint exit 0 · Test Files 353 · **Tests 3134 passed** · build exit 0 · `/studio` 정규화 **128.71** · 복원 **131.69** · 렌더 JS 84.29/90 · CSS 8.89/30.

### 8.1 준비 [사실]
경로 A(모던 카페 A v1 → 보정값 v2 → B안 새로 시작 → SEO 제목·설명) → 차단 0 · Hero 1200×800(→ WebP 8KB) · About 800×800(→ WebP 6KB) 업로드 + 대체텍스트. 이동은 앱 안 클릭만.

| 행 | 결과 | 근거 |
|---|---|---|
| L1 내보내기 UI | **통과 with note** | 아래 |
| L3 해제 | **통과** (Archive Utility 더블클릭 = 미확인) | 아래 |
| L4 로컬 서버 | **통과** | 아래 |
| L6 `file://` | **통과** (Chromium) | 아래 |

- **L1** (Ego 1280·390, zip·HTML) [사실] `shots/L1-*.png`
  - 버튼 순서 zip → HTML → (PNG 별도 구역) · 크기 1280 = 252×40 · 390 = 366×40(검사 탭).
  - 성공 status 1개 · alert 0 · 포커스 = 누른 버튼(4회 모두) · 내려받기 링크 48×32(≥ 24px).
  - **성공 제목 조사(FIX1 F4)**: "정적 사이트(zip)**를** 만들었습니다" — 수정 반영 확인. HTML = "정적 HTML을 만들었습니다".
  - 요약 줄: zip "zip 1개 · 0.6MB (이미지 2장 · 글꼴 2개)" · HTML "HTML 1개 · 0.8MB (이미지 2장 포함)". 생성 1.0~1.6초.
  - 결정성: 같은 문서 재내보내기 결과 해시 동일(zip `54f08f25dc24` · HTML `073383c0fbc4`) · 1280/390 저장 파일 바이트 크기 동일(zip 618,705B · HTML 796,635B).
  - 차단 보조 문장: 1차 시작 시 "SEO 메타 차단 2" 상태에서 두 버튼 aria-disabled + "첫 차단으로 이동" 노출 확인(r01 로그).
  - note: Ego Lite에서 클릭 직후 **자동 내려받기 이벤트는 30초 안에 관측되지 않았고**, 화면의 "내려받기" 링크 클릭으로 저장했습니다. 앱은 이 경우를 위해 "내려받기가 시작되지 않으면…" 문장과 링크를 둡니다. [추정] Ego TaskSpace의 download 이벤트가 비동기 프로그램 클릭을 잡지 않는 도구 한계일 수 있음 — 실제 Chrome 자동 내려받기는 [미확인].

- **L3** (Bash) [사실]
  - 1280·390에서 저장한 zip 2개 `cmp` 동일 · SHA-256 `54f08f25dc24…` = 화면 "결과 해시" 앞 12자와 일치.
  - `unzip -t` "No errors detected" exit 0 · 파일 **7개**(index.html · LICENSES.md · assets/fonts/OFL.txt · Pretendard-400/700.woff2 · assets/images/img-01/02.webp — 이미지 2).
  - `ditto -xk` 해제 폴더 vs `unzip` 해제 폴더 `diff -r` = 0 · `file`: webp 2 = Web/P · woff2 2 = WOFF2.
  - index.html: `<img>` 2개 alt = 입력한 대체텍스트("카페 내부 전경" · "바리스타가 커피를 내리는 모습") · 상대 경로 `assets/images/…` · `<script>` 1개 = 고정 메뉴 스크립트(popover 닫기, SPEC F-07 허용).
  - **Archive Utility 더블클릭 = 미확인**(GUI 실행이라 무인 run에서 결과 확인 불가 — 브리프 지시대로 `ditto -xk` 결과만 사용).

- **L4** (Ego 1280·390 · `python3 -m http.server 4396 --bind 127.0.0.1` · zip 해제 폴더 `/zip/index.html` + 단일 `/single.html`) [사실] `shots/L4-*.png` · 서버 로그 `logs/live/L4-httpserver.log`
  - zip 폴더 1280·390: `<img>` 2개 로드(1200×800 · 800×800) · `document.fonts` Pretendard 400/700 **loaded** · `fonts.check` 400·700 true · 가로 넘침 0.
  - 요청 = `index.html` + `assets/images/img-01·02.webp` + `assets/fonts/Pretendard-400·700.woff2` 전부 200(재방문 304) · **외부 요청 0** · 404 0(favicon 요청도 없음).
  - 단일 `.html` 1280·390: 이미지 2개 `data:image/webp` 로드 · 글꼴 400/700 loaded · `performance` 리소스 0 · 서버 요청 = 문서 1건 · 넘침 0.
  - 두 형태 모두 `<script>` 1개(고정 메뉴). 화면: 헤더·Hero 이미지·카피·About 순서가 편집기 미리보기(`r02`)와 같고 390에서 "메뉴" 버튼으로 접힘.

- **L6** (Ego 1280 · `file:///tmp/m4a-qa-live/site/zip/index.html` · `…/single.html`) [사실] `shots/L6-zip-1280.png`
  - zip 폴더: 상대 경로 이미지 2개 로드(1200×800 · 800×800) · 상대 경로 `@font-face` Pretendard 400/700 **loaded** · `fonts.check` true · 넘침 0.
  - 단일 HTML: data: 이미지 2개 · 글꼴 400/700 loaded · 넘침 0.
  - R1b 관찰: Chromium `file://`에서는 상대 경로 글꼴이 적용됩니다. Safari·Firefox `file://`(Q19 재판정 트리거)는 L7·L8 = 미확인. (`performance` 리소스 항목은 `file://`에서 기록되지 않아 요청 목록은 L4로 갈음)
