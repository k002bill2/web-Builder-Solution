# SEC-FIX-1 BRIEF — 가져오기 이미지 폭탄(M-1) · 프로필 범위 비대칭(L-1) 수정 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (자동 진행 — Security Medium 머지 전 수정이 ★)
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/import-hardening` (base origin/main `5c98507c`). node_modules 설치 완료.
근거: `dev/active/sec-readproject/REPORT.md` 2절 M-1·L-1 · 패치 초안 `dev/active/sec-readproject/patches/{checkImages-header-before-decode.diff,profileShape-family-range.diff}` · 퍼즈 `patches/zzSecBomb.test.ts.txt`·`zzSecFuzz.test.tsx.txt` · 로그 `logs/`.

## 할 일 (TDD — 퍼즈 입력을 먼저 RED, 항목마다 커밋)
1. **M-1**: `checkImages.ts` 디코드 전에 변형본마다 실제 바이트 헤더(`readImageHeader(format, bytes)`)로 (사다리 폭, 높이)를 확인 → 불일치·과대면 거절(기존 가져오기 실패 코드 체계 재사용, 새 문구 0 — 필요하면 멈추고 보고). REPORT가 말한 "픽스처 개정 필요"는 테스트 픽스처를 실제 헤더와 맞추는 것 — 기존 단언 약화 금지(이전/이후 표). 폭탄 RED: 선언 치수는 작고 실제 헤더는 거대한 WebP/PNG → 디코드 호출 0 · 거절.
2. **L-1**: `profileShape.ts`에 렌더(`render/protocol.ts` `isKitTokens`)와 같은 범위(굵기 100~900·scale 1~2·sectionGap 0~512·family `/^[\w -]+$/` + `siteFonts` `Object.hasOwn`) + **Codex가 찾은 `spacing_tokens.grid` 보강**(`parseFloat` 유한·>0이면 1~64) · 경계값 0.5·1·64·65 회귀 테스트. 가져오기 PASS인데 렌더 DROPPED가 되는 조합 0.
3. 예산: 가져오기 코드는 `/projects` 가져오기 조작 뒤 청크로 예상 — `/projects` 첫 화면·진입 · `/studio` 128.80 · 복원 131.78 · `/catalog` 100.77 증분 실측. 진입 증분이 생기면 감량 1회 → 그래도 있으면 멈추고 보고.
4. fresh typecheck·lint·test·build · Codex adversarial 1회(`--scope branch --base 5c98507c`, `--help` 금지) · 반영 1회. 브라우저 불필요.
- 범위 밖(BACKLOG 등록은 Jarvis): L-2(모르는 필드 저장) · L-3(localId 형식) · L-4(Blob.type) · CSP 구현.

## 규칙
- 쓰기 경로: `features/projects/import/**`(또는 실제 `checkImages`·`checkFile`·`profileShape` 위치)·관련 테스트·픽스처·`dev/active/import-hardening/`. 렌더·내보내기·저장 코어 0. 새 의존성·엔진 계약 0. 단언 약화·skip 0.
- 명시 경로 커밋, push 0. 첫 2턴 BRIEF·PROGRESS 커밋, REPORT 초안 10턴 안. 마감 전 `git status --short` 빈 값. 최대 50턴, 40턴부터 마감.
