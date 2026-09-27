# EDITOR-A1-BETA — PROGRESS

브리프: `docs/06-handoff/EDITOR-A1-BETA_BRIEF.md` · 설계: `docs/design/2a-05/SPEC.md` r3 · 브랜치 `k002bill2/editor-a1-beta` (기준 `567e3ea` = main `5562dc2` + 브리프)

## 수신 (2026-09-27)
- 0단계 번들 실측 게이트가 최우선. 공통 변경(S-B1①②·S-B2·S-B3) + 상쇄 1·2순위를 **같은 커밋**, S-B11 전 시나리오 실측, 공통 전후 따로.
- S-B9: 대체안 1부터 실측 → 라디오 첫 화면안은 여유 ≥0.3일 때만. 대체안 1을 써야 하면(J-S10·J-AC-05 문구 개정) 중지·보고.
- 판정: 모든 라우트 첫 화면 ≤100 · 진입 직후 ≤125 · 여유 ≥0.3. 하나라도 어기면 예산·분류 변경 없이 실측·REPORT 커밋 후 중지.
- 금지: Q-17~24 계약 결정, engine 코드 변경, 새 의존성·아이콘, `design/`·`docs/design/` 수정, push·병합·삭제.

## 재개 수신 RESUME-1 (2026-09-27, HEAD `477b5c5`)
- 브리프 `docs/06-handoff/EDITOR-A1-BETA_RESUME-1.md` · 원 브리프 · 이전 REPORT 읽음. 0단계는 Jarvis 재판정 통과(`logs/resume-base-build.txt`, `/compare` 여유 1.61).
- 구속 조건: `/catalog` 첫 화면 99.63(여유 **0.37**) · `/profile` 진입 직후 124.62(여유 **0.38**). 공통·`memoryStudio` 변경마다 build 확인, 여유 0.3 미만이면 실측·REPORT 커밋 후 중지.
- S-B9 = SPEC 원안(`fieldset` + 네이티브 라디오, 보드 첫 화면). 대체안 1 쓰지 않음.
- `startDoc`: 엔진 `createDocFromCandidate`가 세 번째 인자 `DocStart`(Q-17 미승인 계약)를 요구 → startDoc 본문은 Q-17에 걸림. "편집 시작"은 `/studio/:projectId` 이동까지만 연결하고 startDoc 은 BLOCKED 로 보고.

### 재개 체크리스트
- [ ] R0 재개 수신 기록·커밋
- [ ] R1 store 프로젝트 레코드 + 보드 확정 대상 `current|new` · 트랜잭션 ④ · 멱등 키(12.2) · `defaultProjectName`
- [ ] R2 `ConfirmedRef` projectId·projectName · S-B9 라디오(J-S09·J-S10·J-S11) — 실측
- [ ] R3 `/projects` 메모리 저장소(list·get·rename) 실제 구현 · `/studio/:projectId` 셸 실데이터
- [ ] R4 프로필 "프로젝트: <이름>" 링크 · "편집 시작" → `/studio/:projectId`
- [ ] R5 12.4 깨질 테스트 8건(의미 보존) · `ProfileList.tsx`·`useProfileList.ts` 정리
- [ ] R6 QA D3 헤더 Tab 순서(390 DOM 순서 = 보이는 순서)
- [ ] R7 4게이트(vitest 전체 · typecheck · lint · build) + 번들 전후 표
- [ ] R8 127.0.0.1:4337 실제 클릭 · 1280/768/390 캡처 · 390 Tab 순서
- [ ] R9 Codex 검증 · REPORT · 로컬 커밋

## 체크포인트
- [x] 브리프·SPEC 2.1~2.5·8.3·10·11.1·12·13.1·a1-α REPORT 읽기
- [x] 기준 재실측 (병합본 `567e3ea`) — `logs/baseline-build.txt`
- [x] 0단계 (a): 공통 변경 + 상쇄 1·2순위 + S-B10 같은 커밋 `6c5f0bc`, S-B11 전 시나리오 실측 — 공통 +0.20, `/compare` 첫 화면 99.85(여유 **0.15**)
- [x] 0단계 (b): S-B9 — 미실측. (a)에서 중지 조건 충족, 대체안 1은 그 자체가 중지 조건이라 결과를 바꾸지 못함(REPORT 3절)
- [x] 0단계 판정 · REPORT 커밋 — **불합격 → 중지**
- [ ] 1단계: store·라우트·GNB·프로필 링크·편집 시작·12.4 테스트 — BLOCKED: 0단계 여유 게이트 불합격(`/compare` 0.15), 결정 필요(REPORT 6절)
- [ ] 4게이트 전체 vitest · 127.0.0.1:4337 클릭 · 5폭 캡처 · Codex 검증 — BLOCKED: 같은 이유(측정 상태 커밋은 병합 대상 아님). typecheck·lint·build는 exit 0, 12.4 대상 테스트 8건 실패(예상된 것)

## 0단계 실측 (커밋 `6c5f0bc`, 첫 화면 / 진입 직후)
| 시나리오 | 값 | 여유 |
|---|---|---|
| 공통 | 89.33 (+0.20) | — |
| /catalog | 99.63 / 102.02 | 0.37 / 22.98 |
| /compare · (조정 있음) | 99.85 / 120.83 | **0.15** / 4.17 |
| /profile | 99.37 / 124.57 | 0.63 / 0.43 |
| /projects · /studio/:projectId | 93.64 / 106.18 · 90.71 / 103.43 | 자리 구현 |

## 기준 실측 (병합본 567e3ea, gzip KB, 첫 화면 / 진입 직후)
| 시나리오 | 첫 화면 | 진입 직후 | 여유 (100 / 125) |
|---|---|---|---|
| 공통 | 89.13 | — | — |
| /catalog | 99.43 | 101.82 | 0.57 / 23.18 |
| /references/:id | 96.78 | 99.17 | 3.22 / 25.83 |
| /compare · (조정 있음) | 99.66 | 120.57 | **0.34** / 4.43 |
| /profile | 99.54 | 124.67 | 0.46 / **0.33** |
| /studio (자리표시) | 89.57 | 91.96 | — |
