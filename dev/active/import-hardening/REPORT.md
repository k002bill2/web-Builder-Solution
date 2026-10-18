# SEC-FIX-1 REPORT — 가져오기 이미지 폭탄(M-1) · 프로필 범위 비대칭(L-1)

base `5c98507c` · 브랜치 `k002bill2/import-hardening` · 2026-10-18 · Developer(Claude Code, Opus 5.5). push 0.
표기: [사실]=코드·실행 확인 · [추정] · [미확인].

## 결론 (초안 — 작업 중)
- M-1: 진행 중
- L-1: 진행 중

## 1. M-1 — 디코드 전 실제 헤더 확인 [사실]
- `checkImages.ts` `ruledVariants`: base64 디코드 직후 · Blob/디코드(`createImageBitmap`) 전에 변형본마다 `headerFits` = `readImageHeader(format, bytes)`(업로드 V5와 같은 파서) 치수 = (사다리 폭, `variantHeight`). 불일치·헤더 없음 = `undefined` → **IM-6(기존 코드, 새 문구 0)**.
- RED(`logs/m1-red.txt`, 6 failed): 선언 640×480 + 실제 헤더 16384² PNG·WebP(VP8X)·JPEG(SOF0) → 이전 코드 디코드 1회 / 헤더 641×480·640×481(디코더는 선언 치수) → 이전 코드 **가져오기 통과** / 서명만(IHDR 없음) → 디코드 1회 / 3단 중 마지막만 폭탄 → 이전 코드 통과.
- GREEN(`logs/m1-green.txt`): 위 6건 IM-6 · `calls.decoded = 0`.
- 업로드 경로와 다른 점: 업로드 V5는 헤더로 한도만 보고, 가져오기는 **사다리와 정확히 같음**을 요구(선언 치수 → 사다리가 정해져 있으므로 더 엄격).

## 2. L-1 — 가져오기 범위 = 렌더 범위 [사실]
- `profileShape.ts`: `familyOk`(문자열 1~64자 · `/^[\w -]+$/`) · 굵기 100~900 · scale 1~2 · sectionGap 0~512 · `gridOk` = `parseFloat` 유한·>0이면 1~64(아니면 `docKitTokens`가 8로 바꾸므로 받음). 렌더 `isKitTokens`의 리터럴 복제(렌더 값 import 0 — 청크 규칙).
- `kit/siteFonts.ts`: `aliasOf`·`siteFaces`가 `Object.hasOwn(ALIAS, family)`. **쓰기 경로 예외 1건** — BRIEF 항목 2가 직접 지명한 대상. 정상 계열 3종은 동작 변화 0(테스트 "허용 3종은 그대로 별칭").
- RED(`logs/l1-red.txt`, 17 failed) → GREEN(`logs/l1-green.txt`, 34 passed). `profileShape.range.test.ts`는 각 입력을 **checkFile과 `readParentMessage({type:"render", kitTokens: docKitTokens(...)})` 양쪽**에 넣어 결과가 같음을 본다 → 가져오기 PASS·렌더 DROPPED 조합 0(표 29행 + 시드).
- 부작용 [사실]: `recordsHold`는 파일 내보내기(`readProject.ts:119`)·재매김(`rekey.ts:49`)도 쓴다 → 범위 밖 값을 이미 가진 기존 프로젝트는 파일 내보내기가 EX-6(unreadable)로 바뀐다. 그런 프로젝트는 이미 렌더 DROPPED라(캔버스·미리보기·정적 내보내기 불가) 결과는 일관 [사실, parity 표]. 열기(checkState)는 바꾸지 않았다(범위 밖).

## 3. 테스트 이전/이후 (단언 약화 0)
| 테스트 | 이전 | 이후 | 이유 |
|---|---|---|---|
| 픽스처 `fakeImageBytes` | 서명 16B + `WxH` 글자(헤더 없음) | 실제 헤더 40B(PNG IHDR·JPEG SOF0·WebP VP8X) + `WxH` · `header` 인자로 헤더 치수 따로 | M-1 뒤 실제 헤더를 읽어야 함. 기존 단언 변경 0으로 먼저 커밋(b3bd90c8, 206 passed) |
| `fakeDeps` 디코더 | `.slice(16)` | `.slice(HEADER_BYTES)` | 헤더 길이 |
| 디코드 치수 ≠ 사다리(`checkImages.test`) | 바이트 499×300·500×301(헤더 개념 없음) · `closed === decoded` | 헤더 = 500×300, 디코더 글자 = 499×300·500×301 · **`decoded === 1` 추가** · 두 번째도 `[1,1]` | M-1 뒤 그대로 두면 헤더 단계에서 먼저 거절돼 `0 === 0`으로 공허 통과 → 디코드 경로를 계속 보게 강화 |
| 추가 | — | 픽스처 헤더 = readImageHeader 치수(3형식) · M-1 6건 · L-1 34건 | — |

## 4. 예산
| 라우트 | base | 이후 | 증분 |
|---|---|---|---|
| /projects 첫 화면 | | | |
| /projects 진입 | | | |
| /studio 진입 (128.80) | | | |
| 복원 (131.78) | | | |
| /catalog (100.77) | | | |

## 5. 게이트
(작성 예정)

## 6. Codex adversarial
(작성 예정)

## 7. 커밋
- `220b05a9` BRIEF · PROGRESS
