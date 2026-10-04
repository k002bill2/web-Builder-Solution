# M2A-CLOSE2 PROGRESS — 오버레이 문제 목록 · 빈 필수 칸 표시 (SPEC r4.13)

## 수신 기록
- 2026-10-04 수신. 브리프 `docs/06-handoff/M2A-CLOSE2_OVERLAY_BRIEF.md` 전체 · `docs/design/2a-05/SPEC.md` r4.13 행(정본) · `dev/active/m2a-close-design/REPORT.md` 2~4·6절 읽음.
- 시작 커밋 `5b6d396` · 브랜치 `k002bill2/m2a-close2` · worktree `orca/workspaces/web-builder-solution/m2a-close2`.
- 서브에이전트 금지 · 포트 4337만 · 로컬 커밋만(`git commit -- <경로>`) · push·병합·삭제 없음 · 55턴부터 REPORT 마감 우선.
- 번들: `/studio` 진입 ≤127.70(시작 127.24 실측 `logs/o0-base-build.txt`) · 렌더 JS ≤89.70 · 그 밖 ±0.03. 예산 상수 변경 금지.
- 금지: 엔진 계약·`ExportJob`·`ExportGenerator` 타입 변경 · `allow-same-origin` · r4.12 고정 스크립트 바이트 변경 · 단언 약화·skip · 새 의존성·아이콘 · `design/`·`docs/design/`·`docs/decisions/` 수정.
- 게이트: `dev/active/m2a-close2/gate.sh`(close-dev 판 복사 · ROOT만 바꿈). exit 0 뒤에만 커밋. 전체 vitest 3회는 Jarvis.

## 단계
- [x] 수신 · PROGRESS · REPORT 골격(1~9절) · gate.sh
- [x] O0 번들 선행 실측(최소 시제품) — 127.29(+0.05) 통과
- [x] O1 문제 목록
- [x] O2 배지 번호 · 위치
- [ ] O3 빈 필수 칸 섹션 표시
- [ ] O4 게이트 행 대표 문장 차단 우선 · "바뀐 점 N개"
- [ ] O5 4337 브라우저 판정 1280 · 390 캡처
- [ ] O6 Codex review 1회 · REPORT 마감 · 서버 0

## 서브에이전트
- 사용 0 (브리프 금지)
