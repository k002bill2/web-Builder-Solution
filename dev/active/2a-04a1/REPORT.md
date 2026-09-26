# 2A-04a1 REPORT — 프로필 데이터 계층 · 버전 계보 · 원자적 확정

- 브리프 `docs/06-handoff/2A-04a1_DEVELOPER_BRIEF.md` · SPEC r3 6.1~6.3 · 분기점 `44f12ea` · 로컬 커밋만(push·원격 없음)
- 결론: 범위 1~5 구현, P-AC-10(저장소)·11·40·41·42·35·36 충족. 번들은 예산 안(`/compare` 첫 화면 여유 1.47KB) — 대안(싱글턴·C8) 불필요. 설계 질문 4건.

## 1. 변경 파일 (app/src, 18개 · +770 −92)
| 구분 | 파일 |
|---|---|
| 새 타입 | `domain/profile.ts` (SPEC 6.2 그대로: `ProfileVersion`·`ProfileSeries`·`ProfileSummary`·`ProfileHead`·`ProfileAdjustments`·`AdjustmentRange`·`CarryOver*`·`ProfileErrorCode`) |
| 새 저장소 | `data/studioStore.ts`(공유 저장 모듈, 팩토리) · `data/profileRepository.ts`(인터페이스 + `ProfileError`) · `data/memoryProfileRepository.ts` |
| 보드 계약 | `domain/compareBoard.ts`(`ConfirmedRef.latestVersion·latest·confirmedBase`, `STALE_PROFILE`, `draftStatusOf(board, unchanged)`) · `data/compareBoardRepository.ts`(`expectedLatest` 필수, `profileHead`, `StoredProfile` → `ProfileVersion`) · `data/deferredCompareBoardRepository.ts`(인자 전달) · `data/memoryCompareBoardRepository.ts`(store·계보 채우기·원자 확정·commit 주입·멱등) |
| 보드 화면 | `features/compare/useCompareBoard.ts`(확정 인자, 라벨 한 경로) · `draftLabels.ts`(`nextVersion` 우선) · `boardMessages.ts`(STALE_PROFILE → 계열 최신 반영 + P-S12 문장, 엔진 청크) |
| 테스트 | 새 `data/profileLineage.test.ts`(13) · `pages/CompareBoardLineage.test.tsx`(4) · `features/compare/draftLabels.test.ts`(2) · `domain/compareBoard.test.ts`(+1) · 기존 3파일 수정(4절) |

## 2. 새 타입·메서드
- `createStudioStore()` → `versions`·`profileIds`·`commitOf`·`baseReferenceIdOf`·`transact(work)`. 쓰기는 `transact` 안에서만(`insert`는 최신+1 번호만 받음, `remember`는 계열별 마지막 보드 확정 키). work가 던지면 쓰기 전부 폐기 = 커밋 전 롤백. 레코드 `deepFreeze`.
- `ProfileRepository`: `listProfiles`·`getProfile`·`getAdjustmentRange`·`saveAdjustments(profileId, expectedLatest, adjustments)`·`revertTo(profileId, version, expectedLatest)`. 메모리 구현 반환 타입은 `ProfileReadRepository = Pick<…, "listProfiles"|"getProfile"|"revertTo">` — **범위·조정 저장은 타입에만 두고 구현에서 제외**(사유: 미구현 오류를 던지는 메서드는 호출 시점까지 결함을 숨긴다. 타입에서 빠지면 2a-04a2 화면이 실수로 부르면 typecheck가 막는다. `saveAdjustments`의 `expectedLatest` 필수는 전체 인터페이스 타입으로 증명).
- 보드: `confirmProfile(revision, expectedLatest)`·`createProfileVersion(profileId, revision, expectedLatest)`. 판정 순서 = (createProfileVersion만) 프로필 소유 `SCHEMA_INVALID` → **멱등 키** → `STALE_BOARD` → `STALE_PROFILE`(`profileHead` 동봉) → 기존 선택·라이브러리 검사. ①②③은 `await` 없는 한 구간, `fail({phase:"commit"})`은 ② 삽입 뒤 ③ 앞.
- 멱등 키 = (보드 id, 호출자가 본 revision, `expectedLatest`) — 메서드 이름은 넣지 않는다(첫 확정 응답 실패 뒤 화면은 여전히 `confirmProfile`을 부르지만 저장소 보드는 이미 확정됨).
- 보드가 밖으로 내보내는 모든 보드(`getBoard`·`addReference`·`removeReference`·`savePicks`·`STALE_BOARD` 동봉)에 계보 필드를 **읽을 때** 채운다(`view()`), 보드 레코드에는 저장하지 않음.
- 재확정 `adjustments`는 `{}`(이어받기 `carryOverAdjustments`는 2a-04b — 지금은 조정을 만드는 쓰기가 없어 결과 동일), `basedOn`은 이어받기가 생길 때 채운다.

## 3. AC별 테스트
| AC | 테스트 (파일 › 이름) |
|---|---|
| P-AC-10(저장소) | `profileLineage` › "v1(ref-a)·v2(ref-c) 뒤 v1로 되돌리면 v3(origin revert, basedOn 1) = v1 내용, v1·v2는 그대로·동결" · "계열 조회·목록…" · "없는 프로필·버전 되돌리기는 NOT_FOUND, 새 버전 0" |
| P-AC-11 | `profileLineage` › "프로필 쪽 v2 뒤 보드가 돌려주는 모든 보드에 latestVersion·latest·confirmedBase, 재확정 결과 v3" · `CompareBoardLineage` › "프로필 쪽에서 v2를 만든 뒤 보드에서 선택을 바꾸면 '새 버전으로 확정 (v3)', 확정 결과도 v3" · `compareBoard.test` › "P-AC-11: 계열 최신…" · `draftLabels.test` 2건 |
| P-AC-40 | `profileLineage` › "보드가 v2를 본 뒤 다른 쓰기가 v3을 만들면 … STALE_PROFILE(최신 동봉), 새 버전 0 → … v4" · "판정 순서: … STALE_BOARD가 먼저 …" · "되돌리기도 expectedLatest가 다르면 STALE_PROFILE(최신 계열 동봉)" · `CompareBoardLineage` › "보드가 (v3)을 보인 뒤 다른 탭이 v3을 만들면 확정 0건 + '(v4)' + 안내, 선택 유지·이동 없음 → 다시 확정하면 v4" |
| P-AC-41 | `profileLineage` › "같은 expectedLatest로 보드 확정 + 되돌리기를 동시에(응답 지연) → 정확히 1개 성공·1개 STALE_PROFILE, 번호 연속" (도착 순서 2가지) · "네 쓰기 모두 expectedLatest가 필수 인자다" (`@ts-expect-error` 4개 — 인자가 선택이 되면 typecheck 실패). 되돌리기 거부 시 "보기 상태 유지 + P-S12 문장"은 화면 AC라 2a-04a2 |
| P-AC-42 | `profileLineage` › ① commit 실패 롤백(첫 확정·재확정 모두, id·번호 건너뜀 0) · ② 응답 실패 뒤 같은 키 재시도 = 같은 결과·새 버전 0 · ③ 다른 revision/expectedLatest → STALE_BOARD/STALE_PROFILE · `CompareBoardLineage` › ①·② 화면 흐름(오류 알림 → 다시 확정 → `/profile/profile-1`) |
| P-AC-35 | 5절 표 |
| P-AC-36 | typecheck 0 · lint 0 · test 49 files **545 passed**(기준 46 / 525, **+3 파일 / +20 테스트**) · build 0 (`logs/verify-*.txt`) |

## 4. RED 로그 · 고친 기존 테스트 줄
- RED ① `logs/red-1-labels.txt` — 2 failed (`{kind:'confirmed',version:1}` ≠ `nextVersion 3`, "(v2)" ≠ "(v3)")
- RED ② `logs/red-2-repository.txt` — 12 failed / 1 passed(타입 전용, 증거는 typecheck)
- RED ③ Red-Green `logs/red-3-page-revert.txt` — 보드 화면 4파일(`useCompareBoard`·`boardMessages`·`draftLabels`·`compareBoard`)만 `44f12ea`로 되돌리면 화면 테스트 4 failed, 복원하면 4 passed. (화면 쪽 계약은 번들 첫 실측을 위해 테스트보다 먼저 넣었으므로 Red-Green으로 대신 증명)
- 고친 기존 줄 (모두 SPEC 9절 목록 안):
  - `data/memoryCompareBoardRepository.test.ts` 107·108·116·127·134·140·141·146·163·172(확정 인자 `expectedLatest` 추가) · 118·139·148·149·164(`.profile` → `.base`) · 133(`confirmed` 정확 `toEqual`에 `latestVersion`·`latest`·`confirmedBase` 추가, 133 → 133~136)
  - `features/compare/picksSaver.test.ts` 33(인자) · **34**(`.profile` → `.base`) — 34행은 SPEC 9절 "picksSaver.test.ts 33행" 줄 번호 밖이지만 같은 표의 "초안 = 저장값 단언 → `base`" 범주로 판단
  - `pages/CompareBoardPage.test.tsx` 126·184·199·200·279(`.profile` → `.base`, 9절 AC-24 행) · 339 `toHaveBeenCalledWith(saved.revision, 0)` · 385 `toHaveBeenCalledWith("profile-1", expect.any(Number), 1)`
  - 깨지지 않아야 할 것 확인: `CompareBoardPage.test.tsx` `/profile/profile-1` 단언 · `compareBoard.test.ts` 기존 `draftStatusOf` 단언 · `DraftPanel`·`DraftSummaryBar`·`CompareBoardResponsive`·`compareBoardV2` 무수정 통과 · `test/renderApp.tsx` 무변경(보드 옵션 `store`가 없으면 내부 생성)

## 5. 번들 (gzip KB, 첫 화면 / 진입 직후, `scripts/check-bundle-size.mjs`)
| 라우트 | 기준 `44f12ea` | 첫 실측(공통 계약만) | 최종 | 여유(최종) |
|---|---|---|---|---|
| 공통 | 88.66 | 88.69 | 88.69 (+0.03) | — |
| `/catalog` | 98.50 / 100.88 | 98.51 / 100.90 | 98.53 / 100.92 | 1.47 / 24.08 |
| 상세 `/references/:id` | 95.83 / 98.21 | 95.85 / 98.23 | 95.86 / 98.25 | 4.14 / 26.75 |
| `/compare` | 98.50 / 120.97 | 98.52 / 121.14 | 98.53 / 121.74 | **1.47 / 3.26** |
| `/profile`(자리표시) | 89.12 / 91.51 | 89.15 / 91.53 | 89.15 / 91.54 | 10.85 / 33.46 |

- 로그: `logs/baseline-build.txt` · `logs/probe1-common-contract.txt` · `logs/probe2-memory-store.txt` · `logs/verify-build.txt`
- 공통 증가 0.03KB = `CompareBoardError.profileHead` 필드·래퍼 인자 2개·`draftStatusOf` 분기. `/compare` 진입 직후 +0.77 = 보드 메모리 구현 청크(store·멱등·계보) + 엔진 청크 STALE_PROFILE 문구. 프로필 메모리 구현은 앱에서 아직 import하지 않아 번들 0. 아이콘 추가 0, 새 의존성 0, 예산 무변경.
- SPEC P-B2 추정(공통 +0.3~0.5)보다 작은 이유: a1은 `AppProviders` prop·`ProfileRepositoryContext`·프로필 deferred 래퍼를 넣지 않았다(소비자 없음) → **a2에서 재측정 필요**.

## 6. 브라우저 스모크 (127.0.0.1:5299, ego-browser)
카탈로그에서 모던 카페·헤어살롱 비교 추가 → `/compare` Hero A 선택 → "저장됨" → "프로필 확정 (v1)" → `/profile/profile-1`(자리표시 "이 화면은 다음 단계에서 구현됩니다" 그대로) → 뒤로 → "v1 확정됨" → Hero B → "v1 이후 변경됨" + "새 버전으로 확정 (v2)" 활성 → 확정 → `/profile/profile-1` → 뒤로 → "v2 확정됨", 버튼 "새 버전으로 확정 (v3)" `aria-disabled`. 캡처 `smoke-compare-v2.png`. 서버 종료 후 `lsof -iTCP:5299 -sTCP:LISTEN` 결과 없음.

## 7. Codex 리뷰
- 1회 실행: `node codex-companion.mjs review --wait --scope branch --base 44f12ea` (`564f850`까지 브랜치 전체 = 코드·테스트·로그·스모크 캡처). 원문 `logs/codex-review.txt`.
- 결과: **지적 0건** — "변경된 프로필 버전 저장, 경합 처리, 확정 트랜잭션의 흐름을 검토했으며 수정이 필요하다고 판단할 만한 결함을 찾지 못했습니다." 반영할 사항 없음.

## 8. 설계 질문
1. **`ProfileSummary.baseReferenceId`의 출처**: `DesignProfileInput`에 기준 레퍼런스가 없다(`source_reference_ids`는 열 문자 순 정렬이라 첫 원소가 기준이 아닐 수 있음). 메모리 구현은 확정 때 초안의 `baseReferenceId`를 **레코드 밖 store 메타**로 두고(되돌리기는 대상 버전 값 복사) 공개 타입은 SPEC 그대로 뒀다. `ProfileVersion`(또는 `DesignProfileInput`)에 필드로 올릴지, HTTP에서 서버가 어떻게 유도할지 결정 필요.
2. **SPEC 6.3 ③ "보드 `confirmed`·revision 갱신"의 revision**: `ConfirmedRef.revision`(확정한 보드 revision)으로 해석했고 보드 자체 revision은 올리지 않았다(현행과 같음). 보드 revision을 올리면 확정 직후 `draftStatusOf`가 "변경됨"이 되어 S-15·기존 단언이 깨진다. 이 해석이 맞는지 확인 필요.
3. **최신 버전으로의 `revertTo`**: SPEC에 금지 규칙이 없어 허용(같은 내용의 새 버전 생성). 화면(P-S07)은 이전 버전에서만 되돌리기를 보인다. 저장소도 거부(`SCHEMA_INVALID`)할지 결정 필요.
4. **멱등 기록과 끼어든 쓰기**: 계열별 "마지막 보드 확정" 키만 기억하고 `revertTo`는 이를 지우지 않는다 → 응답 실패 뒤 다른 탭이 되돌리기를 해도 같은 키 재시도는 커밋된 결과(이전 번호)를 돌려준다(요청 자체는 커밋됐으므로). 화면은 그 결과로 이동하므로 문제는 없어 보이나, "마지막 커밋"을 계열 전체의 마지막 쓰기로 볼지 확인 필요.

## 9. 남은 위험 · a2 인계
- **앱 배선 없음**: `main.tsx`는 보드 메모리 구현만 만들고 store는 그 안에 숨어 있다(기본값 생성). a2가 `/profile/:id` 화면을 붙일 때 main의 deferred 로더에서 store 하나를 만들어 보드·프로필에 함께 넘기고 `ProfileRepositoryContext`·`AppProviders` prop·`renderApp` 주입을 더해야 한다 — 이때 **공통 청크 증가(P-B2 추정 0.3~0.5KB)를 실측**해야 하며 `/compare`·`/catalog` 첫 화면 여유는 1.47KB.
- `/compare` 진입 직후 여유 3.26KB — 2a-04b(P-S25·`carryOverAdjustments`·`checkProfileContrast`, P-B9 추정 +0.4~0.8)도 들어간다.
- 재확정 `adjustments: {}` — 2a-04b가 `carryOverAdjustments`로 교체해야 한다(지금 조정을 만드는 쓰기가 없어 결과 차이 없음).
- 첫 확정인데 `expectedLatest ≠ 0`이면 `STALE_PROFILE`이지만 계열이 없어 `profileHead`가 없다 → 화면은 기존 일반 오류 안내로 떨어진다(정상 흐름에서는 생기지 않음).
- 프로필 목록 순서 = 계열 생성 순(SPEC 미지정).

## 10. 커밋
- `fd85a4f` feat — 공유 저장 모듈·버전 계보·expectedLatest·확정 트랜잭션/멱등
- `9bca6ca` test — 보드 화면 P-AC-11·40·42 + 검증 로그
- `564f850` docs — 브라우저 스모크 캡처
- 이 REPORT·PROGRESS·Codex 로그 커밋(해시는 최종 응답)
