# RS8-UX-FIX BRIEF — B-RS-11 PNG 성공 문장 → 편집 알림 · B-RS-12 390 탭 배치 툴바 sticky (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (영환님 "3번은 1" · "추천안 자동 적용")
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs8-ux-fix` (브랜치 `k002bill2/rs8-ux-fix`, base origin/main `ead47dcd`). `app/node_modules` 설치 완료.
Designer 생략 사유: 명세 `docs/design/restart/UX-POLISH-1.md` r0 채택(★안 확정) — 이 레인은 그대로 구현.

## 범위 (UX-POLISH-1 3절·4절 ★안만)
1. **B-RS-11**: `PngSave`에 `onAnnounce?: (text: string) => void`(SaveStatus와 같은 패턴) → 성공 문장을 편집 알림(`setNotice`)으로. `PngSave.tsx:76` `role=status` 제거. 실패 alert(`:80`)·`ImageSlotPanel`·`ExportAfter` 등 P-3 나머지는 **범위 밖**. 수용: UXP-AC-03·04(단위).
2. **B-RS-12**: 탭 배치에서만 툴바 `header`에 sticky top 고정(`sticky top-0 z-10` 또는 DS 토큰 — 하드코딩 금지 테스트 통과). 분할·3단 배치 무변화. 수용: UXP-AC-06·07(실화면) · UXP-AC-08(단위, 선택).
3. **정본 반영**: 머지 대상에 `docs/design/restart/UX-5.md` UX5-AC-01 또는 E-AC-33 문장에 C-3("편집기 셸 안 status = 편집 알림 1개 · 부품 결과 문장은 `onAnnounce`로") 1줄 반영(UX-POLISH-1 6절 C-3). 다른 문서 수정 0.

## 규칙
- TDD(RED 로그 `dev/active/rs8-ux-fix/logs/`) · 기존 단언 약화·skip 0 — PngSave status를 단언하던 기존 테스트는 이전/이후 표.
- 예산(ADR-004 개정 17): `/studio` 정규화 128.66 / 129.13 · 복원 131.64 / 132.11 · raw 129.96 / 130.5. 명세 추정 +0.01~0.04. **`/studio`·복원 증분 ≤ +0.05**, 넘으면 감량 1회 → 멈춤. 기준선은 실측 상향 시 같은 커밋에서.
- Ego Lite(짧게): build + preview `--port 4394 --strictPort` — 390×844 끝까지 스크롤 후 상태 줄 `getBoundingClientRect().top ≥ 0` · 1280 배치 무변화 · PNG 저장 뒤 status 노드 1개(편집 알림). 마지막 커밋 직전 서버 종료 → `lsof -nP -iTCP:4394 -sTCP:LISTEN` 0을 REPORT에 기록. IDB 삭제·`finish({keep:[]})`.
- fresh typecheck·lint·test(base 349/3049 또는 현 main 수)·build. Codex review 1회(`--scope branch --base ead47dcd`).
- 쓰기 경로: `components/studio/**`·`features/studio/**`(편집 알림 배선만)·`docs/design/restart/UX-5.md`·기준선 2파일·`dev/active/rs8-ux-fix/`. `features/projects/**`·`features/studio/save/**`·`features/studio/zip/**` 접촉 0(병렬 레인).
- 명시 경로 커밋, amend·rebase·push·merge·원격 쓰기 0. 첫 3턴 BRIEF·PROGRESS 커밋. **REPORT 초안 20턴 안에 커밋.** 마감 전 `git status --short` node_modules 외 빈 값. 서브에이전트 불필요. 최대 55턴, 42턴부터 마감.
