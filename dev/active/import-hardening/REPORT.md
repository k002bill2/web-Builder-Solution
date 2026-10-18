# SEC-FIX-1 REPORT — 가져오기 이미지 폭탄(M-1) · 프로필 범위 비대칭(L-1)

base `5c98507c` · 브랜치 `k002bill2/import-hardening` · 2026-10-18 · Developer(Claude Code, Opus 5.5). push 0.
표기: [사실]=코드·실행 확인 · [추정] · [미확인].

## 결론 (초안 — 작업 중)
- M-1: 진행 중
- L-1: 진행 중

## 1. M-1 — 디코드 전 실제 헤더 확인
- 계획: `checkImages.ts` `ruledVariants`에서 base64 디코드 직후, 디코드(createImageBitmap) 전에 변형본마다 `readImageHeader(format, bytes)` = (사다리 폭, `variantHeight`) 요구. 불일치·null = IM-6(기존 코드, 새 문구 0).
- 픽스처: `fakeImageBytes`를 실제 헤더(PNG IHDR · JPEG SOF0 · WebP VP8X) + 디코더용 글자로 개정. 이전/이후 표는 아래.

## 2. L-1 — 가져오기 범위 = 렌더 범위
- 계획: `profileShape.ts` typography·spacing을 `render/protocol.ts` `isKitTokens`와 같은 범위로(리터럴 복제, 청크 규칙) + `spacing_tokens.grid` = `parseFloat` 유한·>0이면 1~64. `kit/siteFonts.ts` `Object.hasOwn`(BRIEF 항목 2 명시 대상 — 쓰기 경로 예외 1건).

## 3. 테스트 이전/이후
(작성 예정)

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
