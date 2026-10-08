# P1C-D1 Developer 브리프 — 로컬 영속과 어긋난 문구 교체 (W2~W7)

- 역할 Developer / Orca managed Claude Code / worktree p1c-d1 / base `a0bbede`. `app/node_modules` lock 그대로 `npm ci` 완료. **병렬 레인 P1C-D4(지우기·탭 알림)가 동시에 돈다 — 쓰기 파일 겹침 0: 이 레인은 W2~W7 파일과 그 테스트만**(`StudioEmptyStates`·`StudioPanels`·`ExportAfter`·`ImageSlotPanel`·`imageStore`·`ProfilePage` + 각 테스트, 필요 시 `StudioLayout.test`·`ExportFlow.test`). `data/persistence/**`·`components/projects/**`·`ProjectsPage` 손대지 말 것.
- 정본: `docs/design/persistence/P1C-SPEC.md` **1.2 표 W2~W7(새 문구 그대로) · 옛 문구 고정 테스트 목록 · 4절 AC-C12·C13 · 6절 D1 행**. W1은 D3에서 완료, W8·W9는 변경 0.
- W6 [확인 필요]: memory(강등) 모드에서 편집기 이탈 시 이미지 보관 여부를 코드로 확인 — 이탈도 잃으면 SPEC 대안 문구("편집기를 나가거나 새로고침하면")를 쓰고 근거 REPORT.

## 범위 (1건)
- W2~W7 문구를 SPEC 새 문구로 교체 + 옛 문구 고정 테스트 갱신(문구 기대값만 바꾸고 단언 강도 동일). 분기 추가 0(SPEC "분기 0").

## 검증
- TDD: 테스트 기대값을 먼저 새 문구로 바꿔 RED 확인(커밋 금지) → 교체 → GREEN. 단언 약화·skip 0, **amend·rebase 금지**.
- 번들 관문: W2·W4는 `/studio` 진입 감소 예상 · W7은 **저장 데이터 복원 진입** 실측(132.68 이내) · `/profile` 증가 0 · `/studio` 129.65 이내. 넘으면 멈추고 보고.
- Ego Lite 생략 가능(문구는 테스트·grep 증거) — 쓰면 build+`vite preview --port 4339`, 창 minimized면 normal, `captureBeyondViewport:false`+clip ≤2장, 끝나면 `deleteDatabase("design-studio")` → `finish({keep:[]})` · 자기 공간만 닫기(병렬 D4 공간 무접촉) · 서버 종료. 
- 마감: `grep -rnE "서버 연결 전|이 탭에 저장돼|이 탭의 편집기 안에서만|이 탭에 보관한" app/src --include='*.ts*'` 결과 0(테스트 포함 — 남으면 사유) · typecheck·lint·build exit 0 · 전체 vitest 1회 exit 0 · REPORT. **Codex는 Jarvis 몫.**

## 금지·운영
- 엔진·PageDoc 계약·docs/**·lock·CLAUDE.md 수정 0, 새 의존성 0, D4·D5 범위 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지. main 5480 무접촉.
- **첫 3턴 안에 BRIEF P0 커밋.** 턴 관리: 구현 커밋 18턴 전, 24턴부터 마감, REPORT 28턴 전 커밋. 한국어.
