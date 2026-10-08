# P1C-D5 REPORT — 첫 저장 1회 안내 + P1c 통합 실측(같은 탭 지우기)

## 요약
- 구현 커밋 `0003fe7`: 보드 확정 성공 결과 status 문장 뒤에 SPEC 1.4 안내를 이어 붙임(새 라이브 영역 0). 1회 판정 = IDB `meta.firstSaveNotice`(쓰기 큐 경유 → 세대 +1 불변식 유지).
- Ego Lite 통합 실측: 같은 탭 지우기 성공 · 지운 뒤 첫 확정에 안내 1회 · 두 번째 확정에 안내 0 — 모두 status `textContent`로 확인(L1).
- 게이트(fresh, 이 재개 세션): typecheck 0 · lint 0 · build 0 · `npx vitest --run` 274 files / 2402 passed exit 0.

## 설계
- 판정·쓰기 `LocalSync.firstSave()`(조작 뒤 localSync 청크): 지워짐·쓰기 탭 아님 → false · meta 있으면 false · 없으면 `submit("firstSaveNotice", [put])` 후 true(커밋 대기 없음 · 실패하면 다음 확정에 다시 true).
- 배선: deferredStudio board 로더에 `sync` 전달(로컬일 때만) → memoryCompareBoardRepository 확정 뒤 `firstSave` → `ConfirmResult.firstSave?: true` → `useCompareBoard` navigate state → `ProfilePage`가 같은 announce 1회에 " · <안내>" 이어 붙임(기준 문장 없는 재확정이면 안내만 같은 영역). memory 강등이면 sync 없음 → 추가 0.
- J-S11 [확인 필요] 결론: 확정 성공 결과 문장은 `/compare`가 아니라 `/profile` "프로필 알림" status(`app/src/pages/ProfilePage.tsx` announce ← `app/src/features/compare/useCompareBoard.ts` navigate state). → `/compare` 자동 closure 밖.

## TDD
- `firstSaveNotice.test.ts` 10건 · `FirstSaveNotice.test.tsx` 2건. 예측 RED 10 FAIL / 2 PASS → 실측 같음. GREEN 전 셋업 정정 1건(`createProfileVersion(…, 1, "new")` → `0`, "새 프로젝트는 expectedLatest 0" 계약 — 단언 변경 0) · 타입 좁히기 1건.

## 번들 (build 출력, KB gzip)
| 관문 | 전 | 후 | 한도 |
|---|---|---|---|
| `/compare` | 122.62 | 122.72 | ≤125 |
| `/studio` | 129.62 | 129.63 | ≤129.65 |
| 복원 | 132.66 | 132.66 | ≤132.68 |
| `/projects` | — | 104.47 | ≤125 |
| `/profile` 첫 화면 | 99.72 | 99.87 | /100 |

## Ego Lite 증거 (preview 4337 · TaskSpace 27 · 앱 안 클릭 이동만)
1. 캡처 1 `shots/1-profile-first-confirm.png`·캡처 2 `shots/2-projects-cleared-same-tab.png` — 첫 세션에서 촬영. 안내 status는 `sr-only`라 화면에 보이지 않음 → 재개 세션에서 textContent로 증거 보강.
2. ⓐ 같은 탭 `/projects` "이 브라우저 데이터 지우기" → 대화상자 "모두 지우기" → 대화상자 닫힘, `role=alert` 0(거짓 "다른 탭 편집 중" 0), status `저장소 알림: "이 브라우저 데이터를 지웠습니다"` **1개**.
3. ⓑ 지운 뒤(새로고침 이동으로 보드 비워짐 → 카탈로그에서 모던 카페 브랜드·로컬 베이커리 다시 담음) A 전부 선택 → "프로필 확정 (v1)" → `/profile/profile-1` status `프로필 알림`:
   `새 프로젝트 '모던 카페 브랜드 프로젝트'를 만들었습니다 · 이 브라우저에 저장했습니다 — 공용 PC라면 다 쓴 뒤 '프로젝트' 화면의 '이 브라우저 데이터 지우기'로 지우세요` (AC-C11 · 지운 뒤 재안내). 캡처 3 `shots/3-profile-first-save-after-clear.png`.
4. ⓒ "비교 보드에서 선택 바꾸기" → Hero B 선택 → "새 버전으로 확정 (v2)" → `/profile/profile-1`(v2 · 현재) status `프로필 알림` = `""`, `body`에 안내 문구 0. 캡처 4 `shots/4-profile-second-confirm-no-notice.png`.
5. 정리: `indexedDB.deleteDatabase("design-studio")` = `success` · 뒤이은 `indexedDB.databases()` = `[]` · `finish({keep:[]})` 완료 · `listTaskSpaces()` = `[]` · preview PID 94187 종료 · 4337 LISTEN 0.

## 목업·계약과 다르게 / 관찰
- 캡처는 sr-only status를 보여 주지 못한다(설계상 시각 노출 없음) — 증거는 textContent 기록이 정본, 캡처는 화면 맥락용.
- 관찰(D4 범위, 수정 안 함): 지우기 성공은 `/projects` 새로고침 이동이라 메모리 비교 보드도 비워진다. 대화상자 문구 "비교 보드와 보관함은 이 탭에만 있어 지우지 않습니다"와 체감이 어긋날 수 있음 → Jarvis 판단 몫.
- 미기록: 지우기 직후(재확정 전) 시점의 `databases()` 값은 따로 찍지 않았다(정리 시점 값만 기록).

## 중단·재개
- 첫 세션: 턴 한도로 1회 중단(구현·게이트·캡처 1·2까지). 재개 세션(2026-10-08): 기존 preview 94187·TaskSpace 27을 이어 써서 ⓐⓑⓒ 실측·정리·게이트·REPORT. 코드 수정 0(실측 결함 없음). Codex는 Jarvis 몫이라 실행 안 함.

## Codex r1 수정 (2026-10-08)
1. **[P2] 시간 초과 뒤 안내 키 소비** (`dev/active/p1c-d5/codex-r1-jarvis.txt`) — 판정이 2초를 넘겨 확정 결과에서 빠져도 남은 작업이 `firstSaveNotice`를 put해 안내가 영구 생략되던 결함.
   - 수정: `LocalSync.firstSave(live?)` — put 제출 직전(모든 await 뒤) `live()`가 false면 키를 쓰지 않고 false. `memoryCompareBoardRepository.noticed`는 2초 타이머가 발화하면 `late = true`로 `live = () => !late` 를 끈다. 변경은 조작 뒤 청크(보드 · localSync)만 — 진입 몫 0.
   - 회귀 테스트(`firstSaveNotice.test.ts`): 싱크를 2초 넘게 묶음(fake setTimeout) → 첫 확정 `firstSave` 없음 → 싱크 풀린 뒤 키 기록 0 → 다음 확정 `firstSave: true` → 그다음 확정 없음. RED(수정 전) = 키 존재로 FAIL 확인.
2. **[Jarvis 결정 — 문구] ClearDataDialog 본문 2** → "비교 보드와 보관함은 따로 저장하지 않아 지운 뒤 함께 비워집니다. 내려받은 파일은 그대로 남습니다." — 지우기 성공 = `/projects` 새로고침 이동으로 메모리 보드·보관함도 비워지는 실제 동작과 일치. 고정 테스트 기대값만 교체(getByText 완전 일치 — 단언 강도 동일).
- 번들(build 출력, KB): `/profile` 첫 화면 99.87(≤100) · `/compare` 자동 122.73(≤125, +0.01) · `/studio` 129.62(≤129.65) · 복원 132.65(≤132.68) · `/projects` 104.47(≤125).
- 게이트(fresh): `npm run typecheck` 0 · `npm run lint` 0 · `npm run build` 0 · `npx vitest --run` 274 files / 2403 passed exit 0.
- 하지 않음: Ego Lite·Codex 재실행(지시), 엔진·계약·docs·lock 수정 0, 새 의존성 0.
