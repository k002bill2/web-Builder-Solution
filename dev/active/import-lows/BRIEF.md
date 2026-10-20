# IMPORT-LOWS BRIEF — 가져오기 Low 3건 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (자동 진행 — BACKLOG B-SEC-01·02·03)
base origin/main `2531ebf8`. 근거 `dev/active/sec-readproject/REPORT.md` L-2·L-3·L-4 · 퍼즈 `dev/active/sec-readproject/patches/zz*.txt`.

## 할 일 (TDD, 항목마다 커밋)
1. B-SEC-02: 가져오기 이미지 `localId` = UUID v4만(아니면 기존 실패 코드 재사용, 새 문구 0).
2. B-SEC-03: 저장 이미지 레코드 `Blob.type` 허용 3종 검사 — 손상 레코드 1건이 내보내기 전체를 실패시키지 않게(그 이미지만 잃은 이미지 처리, 기존 lostImage 경로 재사용).
3. B-SEC-01: 문서 밖 레코드(project·series·DocRecord 봉투·스냅샷 머리) 모르는 키 — 저장 전 허용 키 정규화. **저장 스키마·엔진 계약이 바뀌어야 하면 이 항목은 멈추고 보고.**
4. Security 퍼즈 67건 재실행(임시, 되돌림) — 판정 변화 표. fresh typecheck·lint·test·build · 예산 진입 증분 0(넘으면 감량 1회 뒤 멈춤). Codex adversarial 1회(`--help` 금지)·반영 1회.
## 규칙
- 쓰기: `features/projectFile/**`·해당 내보내기 이미지 읽기 경로·관련 테스트·`dev/active/import-lows/`. 렌더·킷·엔진 0, 새 의존성 0, 단언 약화·skip 0. **git push·pull·fetch 등 원격 명령 일절 금지.** 첫 2턴 BRIEF·PROGRESS 커밋, REPORT 초안 10턴 안. 마감 전 `git status --short` 빈 값. 최대 55턴, 45턴부터 마감.
