# M4-a-7 BRIEF — B-M4A-12 읽기 전용 탭 내보내기: 거짓 "다시 시도" 제거 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (자동 진행)
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/m4a-readonly-export` (브랜치 `k002bill2/m4a-readonly-export`, base origin/main `36e825a6`). node_modules 설치 완료.
근거: `docs/06-handoff/BACKLOG.md` B-M4A-12 · `dev/active/m4a-retry-fix/REPORT.md` 결론 3번째 줄(두 번째 탭 INFRA 추정 원인 = 탭 잠금 `features/projects/tabLockHold.ts` → `data/memoryDocBook.ts:288` INFRA) · `dev/active/m4a-retry-fix/QA-REPORT.md` 5절 · 재현 스크립트 `dev/active/m4a-retry-fix/logs/ego-L4.mjs` 대조군.
Designer 생략 사유: 새 화면 0 — 기존 읽기 전용 사유 문구(I6 8.1 stale/readonly 행·`saveStatusText.ts`·`restartText.ts`)를 재사용한다. 새 문구가 필요하면 멈추고 보고.

## 순서
- **E0 진단 + 예산 실측(먼저, 12턴 안)**: 두 번째 탭에서 내보내기가 INFRA가 되는 정확한 경로를 코드로 확정(스냅샷 쓰기 거절? 잡 저장?). 읽기 전용 판정을 이미 아는 곳(`view().reason`·코어 lease)과 내보내기 버튼/결과의 연결점 표. 최소안 설계 → **`/studio` 정규화 증분 추정·실측**.
  - 예산: `/studio` 128.79 · 복원 131.77, **ADR-004 개정 18 M4-a 몫 남은 0.01**. 실측 증분이 +0.01을 넘으면 **감량 1회 → 그래도 넘으면 구현하지 말고 멈추고 수치·최소안 보고**(새 개정은 영환님 상신 대상).
- E1 수정(TDD): 읽기 전용 탭에서는 (a) 내보내기 요청 전 사유 표시(기존 readonly 문구) 또는 (b) INFRA 실패 alert에 "다시 시도" 대신 읽기 전용 사유 — 둘 중 진입 증분이 작은 쪽. 쓰기 탭 동작·거짓 성공 0 유지. RED: 두 번째 탭 내보내기 → "다시 시도" 없음 + 사유 문구 · 쓰기 탭 회귀 0.
- E2 fresh 게이트 · Ego Lite 1회(2탭, preview `--port 4400 --strictPort`, 6턴 한도) · Codex adversarial 1회(`--scope branch --base 36e825a6`, `--help` 금지) · 반영 1회.

## 규칙
- 쓰기 경로: `components/studio/Export*`·`features/studio/exportFlow*`·`features/studio/useExportFlow*`·관련 테스트·기준선 2파일(판정선 안 실측일 때만)·`dev/active/m4a-readonly-export/`. `features/studio/save/**`·`data/**`·`features/projects/**`는 **읽기만**(필요하면 멈추고 보고). 병렬 레인 `m3-reco-impl`(catalog·reco) 경로 접촉 0. 새 의존성·엔진 계약 0. 단언 약화·skip 0.
- 명시 경로 커밋, amend·rebase·push 0. 첫 2턴 BRIEF·PROGRESS 커밋, **E0 끝나면 REPORT 초안 커밋**, 단계마다 커밋. preview 종료·리슨 0. 마감 전 `git status --short` 빈 값. 최대 55턴, 45턴부터 마감.
