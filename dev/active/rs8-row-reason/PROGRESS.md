# RS8-2 PROGRESS — view().reason · /projects stale 행 첫 표시 (B-RS-09)

base `494a7c6f` · 브랜치 `k002bill2/rs8-row-reason`

- [x] 0. BRIEF·PROGRESS 커밋 (`dea3d226`)
- [x] 1. CP1 코어 (`2099fa86` · RED 7/8 → GREEN 8/8): `view().reason` 기록·해제 (saved·discard·rebased·not-persistent) TDD + 소비처 영향 표
- [x] 2. CP2 행 (`087f88bb` · RED 6 → GREEN): bd3163a3 재적용 (`port.mode()` → `view().reason`), 2벌 문구 가드 유지
- [x] 3. 잠금 회귀 가드 (readonly 탭 · 변이 probeCores → request 1·link 1 FAIL, logs/mutation-probe.txt): /projects 행 판정 중 locks.request·gate.enter·port.mode 호출 0 (+변이 FAIL)
- [x] 4. 예산 실측 — /studio 128.66(+0.00) · 복원 131.65(+0.01) · /projects 첫 99.09 · 진입 109.54 (/studio·복원 ≤ +0.05, /projects 첫 ≤ 99.5)
- [x] 5. Ego Lite 2탭 검증 + preview 종료(lsof 0) — logs/ego-two-tab.txt
- [x] 6. fresh typecheck·lint·test·build (349/3049)
- [ ] 7. Codex review 1회 (`--scope branch --base 494a7c6f`)
- [ ] 8. REPORT 커밋 · git status 빈 값
