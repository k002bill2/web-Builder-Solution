# RS8-2 PROGRESS — view().reason · /projects stale 행 첫 표시 (B-RS-09)

base `494a7c6f` · 브랜치 `k002bill2/rs8-row-reason`

- [ ] 0. BRIEF·PROGRESS 커밋
- [ ] 1. CP1 코어: `view().reason` 기록·해제 (saved·discard·rebased·not-persistent) TDD + 소비처 영향 표
- [ ] 2. CP2 행: bd3163a3 재적용 (`port.mode()` → `view().reason`), 2벌 문구 가드 유지
- [ ] 3. 잠금 회귀 가드: /projects 행 판정 중 locks.request·gate.enter·port.mode 호출 0 (+변이 FAIL)
- [ ] 4. 예산 실측 (/studio·복원 ≤ +0.05, /projects 첫 ≤ 99.5)
- [ ] 5. Ego Lite 2탭 검증 + preview 종료(lsof 0)
- [ ] 6. fresh typecheck·lint·test·build
- [ ] 7. Codex review 1회 (`--scope branch --base 494a7c6f`)
- [ ] 8. REPORT 커밋 · git status 빈 값
