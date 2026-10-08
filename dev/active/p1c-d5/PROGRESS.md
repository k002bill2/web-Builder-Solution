# P1C-D5 PROGRESS

- [x] P0: BRIEF·PROGRESS 커밋
- [x] 정본 읽기(SPEC 1.4·3·4 AC-C11·6 D5, D4 JARVIS_FINAL, D2 REPORT)
- [x] TDD 예측 기록 → RED 확인(커밋 안 함) — RED 10 FAIL/2 PASS(예측 일치)
- [x] 구현: 첫 저장 1회 안내(meta.firstSaveNotice, 큐 경유, 강등 0, 지우기 뒤 재안내)
- [x] GREEN + 구현 커밋 — 12/12, 전체 274파일 2402 PASS
- [x] 번들 관문(/compare ≤125 · /studio ≤129.65 · 복원 ≤132.68 · /projects ≤125) + J-S11 청크 위치 실측
- [x] Ego Lite 통합 실측(preview 4337) + shots ≤4 + 정리(deleteDatabase·finish·listTaskSpaces·서버 종료)
- [x] 실측 결과 커밋
- [x] 게이트: typecheck·lint·build·전체 vitest exit 0
- [x] REPORT 커밋

## 설계 (탐색 결과)
- J-S11 [확인 필요] 실측: 확정 성공 결과 문장은 `/compare`가 아니라 `/profile` 화면 "프로필 알림" status(`ProfilePage.tsx:79` announce ← `useCompareBoard.ts:273~275` navigate state). → `/compare` closure 밖.
- 판정·쓰기 = `LocalSync.firstSave()`(조작 뒤 localSync 청크): 지워짐·쓰기 탭 아님 → false · meta `firstSaveNotice` 있으면 false · 없으면 쓰기 큐 `submit("firstSaveNotice", [put])`(도장 = 세대 +1) 후 true(커밋 기다리지 않음 · 실패 → 다음 호출 true).
- 배선: deferredStudio board 로더에 `sync` 전달(로컬일 때만) → memoryCompareBoardRepository 확정 뒤 `firstSave` → ConfirmResult `firstSave?: true` → useCompareBoard navigate state → ProfilePage가 같은 announce 1회에 " · <안내>" 이어 붙임(기준 문장 없는 재확정이면 안내만 같은 영역).
- 번들 위험: deferredStudio는 `/studio`(여유 0.03)·복원(0.02) closure → 런타임 몇 바이트만. ProfilePage는 `/profile` 첫 화면 99.72/100.

## TDD 예측 (RED)
- `firstSaveNotice.test.ts` 10건: LocalSync에 `firstSave` 없음 → 7건 TypeError FAIL · 보드 배선 3건 중 firstSave 기대 2건 FAIL(undefined) · memory 1건 PASS(현 동작 = 없음).
- `FirstSaveNotice.test.tsx` 2건: 첫 건 FAIL(안내 안 붙음) · 둘째 PASS(현 동작).

## 결과 (구현)
- RED 실측: 10 FAIL / 2 PASS(예측과 같음). GREEN 전 셋업 1건 정정: 테스트의 `createProfileVersion(…, 1, "new")` → `0`("새 프로젝트는 expectedLatest 0" 계약 — 단언 변경 0) · 타입 좁히기 1건.
- 번들(build 출력): `/compare` 122.62→**122.72**(≤125) · `/studio` 129.62→**129.63**(≤129.65) · 복원 132.66→**132.66**(≤132.68) · `/projects` **104.47**(≤125) · `/profile` 첫 화면 99.72→**99.87**(/100) · `/profile` 자동 120.00.
- 게이트(fresh): typecheck 0 · lint 0 · build 0 · `npx vitest --run` 274 files / 2402 passed exit 0.

## 결과 (실측·재개)
- 재개 세션: ⓐ 같은 탭 지우기 status 1개 · ⓑ 지운 뒤 첫 확정 안내 포함 · ⓒ 두 번째 확정 안내 0 — 상세 REPORT.md. shots 4장.
- 정리: deleteDatabase success · databases() [] · finish · listTaskSpaces [] · 94187 종료 · 4337 LISTEN 0.
- 게이트(fresh): typecheck 0 · lint 0 · build 0 · vitest 274/2402 exit 0. 코드 수정 0.

# Codex r1 수정 레인 (2026-10-08)
- [x] RED 예측 기록 → 테스트 작성 → RED 확인(커밋 안 함)
- [x] ① [P2] firstSave 2초 시간 초과 뒤 늦은 판정이 안내 키를 기록하지 않게 (`firstSave(live)` — put 제출 직전 확인)
- [x] ② ClearDataDialog 본문 2 문구 교체 + 고정 테스트 기대값 갱신
- [x] GREEN · 번들 관문(/profile ≤100 · /compare ≤125 · /studio ≤129.65 · 복원 ≤132.68 · /projects ≤125)
- [x] 게이트: typecheck·lint·build·전체 vitest exit 0
- [x] REPORT "Codex r1 수정" 절 + 커밋

## RED 예측 (Codex r1 수정)
- 새 회귀 테스트 `firstSaveNotice.test.ts` "싱크가 2초 넘게 늦으면 첫 확정 안내 없음 · 키 기록 0 · 다음 확정에 안내 1회": 현 코드는 늦은 firstSave가 키를 put → 키 존재 단언에서 FAIL(1건).
- `ClearDataDialog.test.tsx` 첫 건: 새 문구 getByText 실패로 FAIL(1건). 나머지 기존 테스트 PASS.
- RED 실측: 2 FAIL(새 회귀 — 늦은 판정이 키 put → `get(meta, firstSaveNotice)` undefined 단언 실패 · 대화상자 문구) / 나머지 PASS — 예측과 같음.
- GREEN: 대상 3파일 18/18 · 전체 274 files / 2403 passed.
