# M4-a-4 QA REPORT — 정적 zip 내보내기 릴리스 게이트 1차(정적·회귀·생성물)

**잠정 판정: 미정(진행 중) — 항목 1~6 결과가 채워지면 확정합니다.**

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

## 2. EXP-AC 판정표
(진행 중)

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

## 4. 회귀 · 변이
(진행 중)

## 5. 문구
(진행 중)

## 6. LIVE-PLAN
(진행 중)
