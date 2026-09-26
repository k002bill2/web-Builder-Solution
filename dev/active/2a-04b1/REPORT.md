# 2A-04b1 REPORT — 번들 용량 확보 · 테스트 플레이크 · 조정 저장소 · 필드 단위 이어받기 · 보드 P-S25

- 브리프 `docs/06-handoff/2A-04b1_DEVELOPER_BRIEF.md` · SPEC `docs/design/2a-04/SPEC.md` r5 · 기준 `3623e9b` · 작성 2026-09-26
- 근거 수준: 번들·테스트 수치 = L1(실측 로그 `logs/`) · P-AC-11 원인 추정 = L3

## 0. 요약
| 항목 | 결과 |
|---|---|
| 검증 4종 | typecheck 0 · lint 0 · build 0(예산 통과, 앱 코드 최종본 `final-build.txt` — 이후 변경은 테스트 파일뿐) · test **642/642** |
| 전체 5회 연속 | **달성(3차)** — `final-run1~5` 642/642 ×5. 1차(`final-attempt1-*`) 3/5, 2차(`final-attempt2-*`) 4/5는 P-AC-11 등 실패 → 원인(1.3) 수정 뒤 3차 |
| 번들 | `/compare` 첫 화면 99.16 → **99.49**(여유 0.51) · 진입 직후 123.32 → **124.45**(여유 0.55). 멈춤 기준(0.3) 위, 예산 변경 없음 |
| 범위 | 플레이크 3곳, getAdjustmentRange·saveAdjustments, effectiveProfile·carryOverAdjustments, 보드 재확정 이어받기, P-S25 패널, P-AC-37 보드 확정 계측, 버전 요약의 지운 조정 한 줄 |
| Codex | review 1회 — P2 1건, 반영함(`0a94c68`) |

## 1. 테스트 플레이크 (테스트 코드만, `6d7e627`)

### 1.1 원인과 수정
| 테스트 | 원인(증거) | 수정 |
|---|---|---|
| `CatalogPage.test.tsx` V2-AC-17r2 | 옵션 30여 개를 차례로 누른다. 병렬 부하에서 기본 5초를 넘긴다(`before-load4x-*`: 4회 모두 5.1초 타임아웃). **타임아웃 뒤에도 본문이 계속 돌면서 남은 클릭이 다음 테스트의 DOM을 건드린다.** | 이 테스트에만 timeout 20초 |
| `CatalogPage.test.tsx` D-V22-02 (Enter·클릭) | 부하 로그에서 받은 쿼리가 `?industry=cafe-fnb&device=desktop`였다. 이 테스트는 `device`를 건드리지 않으므로, 위 V2-AC-17r2가 남긴 클릭에 오염된 것이다. 초기화 직후 같은 틱에 URL을 읽는 약점도 있다. | URL 단언을 `waitFor`(5초)로 바꿈. 단언 값은 그대로 |
| `CatalogPage.test.tsx` Q8 "초기화는 레일 필터만…" | `expectCardCount(0)`는 **불러오기 전에도 참**이다. 그래서 빈 결과 문장 `getByText`가 로딩 중에 실행된다. | 빈 결과 문장을 `findByText`(5초)로 먼저 기다린 뒤 0개를 단언한다(더 엄격해짐). 초기화 뒤 1개 대기도 5초 |
| `CompareBoardLineage.test.tsx` P-AC-11 (도우미 `boardSeesV2`를 P-AC-40과 공유) | 브리프 진단("findBy 대기 초과")은 **실측으로 반증**됐다 — 10초를 기다려도 실패했다(1.3). 실제 원인은 이전 보드 화면이 아직 내려가지 않은 채 돌아간 것이다. | ① 도우미 대기 10초·테스트 timeout 40초 ② **보드 h1이 사라질 때까지 기다린 뒤** 다른 버전을 넣고 돌아간다(1.3). 새 테스트 `CompareBoardCarryOver`의 같은 패턴 2곳에도 적용 |

- 단언 삭제·`skip`·전역 `testTimeout` 변경은 없다. 고친 줄은 7절에 있다.
- 추가 관찰(브리프 목록 밖, 수정 안 함): 주변 부하가 클 때(load avg 120~246, 다른 프로세스) 아래 테스트가 5초 타임아웃·1초 findBy로 가끔 실패한다.
  - `keyboardA11y`(비교 필 포커스·모션 radiogroup)
  - `ProfilePage` P-AC-01, `routeScroll`, `CompareBoardResponsive` 아코디언
  - `CompareBoardV2` V2-AC-33, `trayBoard`, `ReferenceDetailPage` 7번째 추가
  - 정상 실행에서는 통과한다.

### 1.2 전/후 (같은 부하 안 A/B)
주변 부하가 크게 흔들려서, 수정 전 원본을 임시 사본(`Orig*.test.tsx`, 실행 뒤 삭제)으로 두고 **같은 실행 안에서** 비교했다.

| 실행 (전체 3개 동시 × 2회) | 원본 CatalogPage 3곳 | 수정 CatalogPage 3곳 | 원본 P-AC-11 | 수정 P-AC-11 |
|---|---|---|---|---|
| `flake-ab1-*`·`flake-ab2-*` (6회) | **6/6 실패**(V2-AC-17r2 6, D-V22-02 5) | 0 실패 | 1 실패 | 2 실패(5초 대기 당시) |
| `flake-dp*` (수정본만, 9회, load avg 246) | — | 0 실패 | — | 0 실패 |

- 정상 5회: 수정 전 `before-run1~5` 599/599 ×5, 수정 직후 `after-flake-run1~5` 599/599 ×5.

### 1.3 P-AC-11 — 대기 부족이 아니라 "보드 화면이 아직 내려가지 않은 채 돌아감"
- 실패 순간 DOM(`logs/pac11-failure-dom.txt`)에서 돌아온 보드는 **"확정 전" · "프로필 확정 (v1)"**이었다. 10초를 기다려도 바뀌지 않았다(`final-attempt2-run3` 10.6초).
- 확정 뒤에 새로 마운트된 보드라면 이 상태가 나올 수 없다. 저장소 `board.confirmed`는 늘 유지되고, `insertOtherVersion`은 계열을 찾았다.
- 가설: `renderApp`의 `RouterProbe`는 위치를 **렌더 중에** 기록한다. 부하에서 `/profile` 이동 전환이 끝나기 전에 테스트가 `/compare`로 돌아가면, 확정 전 상태를 가진 **이전 보드 인스턴스**가 그대로 남는다.
- 확인과 수정(테스트 코드만): 경로 대기 뒤 보드 h1이 사라질 때까지 기다린다.
  - 전: 부하 3×3에서 P-AC-11이 1회 이상 실패(`flake-ab1-1`·`ab1-2` 5초판, `lin3-2`)
  - 후: 부하 3×3 = 9회 모두 642/642(`flake-unmount-fix*`), 순차 5회 642/642(`final-run1~5`)
- 원본 앱 코드(`3623e9b`)에서도 같은 단언이 실패했다(`flake-ab1-1`·`ab1-2`의 5초판, 보드 준비 완료 상태). 따라서 b1 앱 변경이 만든 것은 아니다.
- 관찰(수정 안 함, 앱 쪽 가능성): 실제 앱에서도 `/profile` 이동 전환이 끝나기 전에 보드로 돌아가면 낡은 보드가 남을 수 있는지는 확인하지 않았다 → Q4.

## 2. 번들 용량 확보와 실측

### 2.1 방법 — 브리프 (a) 조건부 동적 import
1. **P-S25 패널**(`features/compare/carryOverPanel.tsx` + 문구 `features/profile/adjustmentText.ts`)은 조건부 청크다. 확정한 프로필의 최신 버전에 조정이 1개 이상일 때만 `useCompareBoard`가 `import()`한다. 진입 직후 자동 로드 목록에는 넣지 않았다.
2. **재확정 이어받기 규칙**(`domain/profileAdjustments.ts` + `profileContrast.ts`)은 메모리 보드 저장소가 **계열 최신에 조정이 있을 때만** `import()`한다. 동기 구간 앞에서 받으므로 원자성은 그대로다. 첫 확정과 조정 없는 재확정은 기다리지 않는다.
3. **조정 저장 본문**(`data/memoryProfileAdjust.ts` = zod 검증·정규화·삽입)은 `saveAdjustments`·`getAdjustmentRange`를 처음 부를 때 받는다.
4. zod는 보드가 이미 쓰는 구성(object·optional·enum·string·regex)만 쓴다. `strictObject`·`array`·`refine`을 쓰면 진입 직후 합계의 zod 공유 청크가 **+0.44KB** 늘었다(실측). 그래서 모르는 키·배열·역할 중복은 직접 검사한다.
5. P-AC-37 계측(`profileEvents`)은 엔진 청크(boardEngine)에 두었다. 첫 화면에는 호출 한 줄만 있다.
6. deferred 프로필 래퍼·컨텍스트는 `ProfileReadRepository` 그대로다(공통 증가 0). 메모리 구현만 `ProfileRepository` 전체를 가진다 → b2에서 넓힌다.
7. 검토했지만 쓰지 않은 것:
   - (b) BUNDLE-01 C8: 보드 페이지 일부를 엔진으로 옮기는 안. 여유가 0.3 위라 불필요했다.
   - (c) P-B7 Callout 공유 청크 정리: 0.42KB 청크 경계 비용인데 청크 설정 변경이 필요해 보류했다.
   - 패널 `import()`를 엔진 청크에 두는 안: 첫 화면 99.40(여유 0.60) / 진입 직후 124.61(여유 0.39)로 측정됐다. 2a-04c 생성 메모리 구현이 `memoryStudio`(진입 직후 목록)에 붙을 예정이라, **진입 직후 여유가 큰 페이지 쪽**을 골랐다.

### 2.2 단계별 실측 (gzip KB, 첫 화면 / 진입 직후)
| 단계 | 공통 | /compare | /profile | /catalog | 로그 |
|---|---|---|---|---|---|
| 기준 `3623e9b` | 88.92 | 99.16 / 123.32 | 98.84 / 117.48 | 98.98 / 101.36 | PROGRESS |
| 3단계 첫 구현(정적 import) | 88.96 | 99.19 / **125.81 초과** | 98.89 / 119.50 | 99.01 / 101.39 | `bundle-step3-repo.txt` |
| 저장소 안 동적 import | 88.93 | 99.17 / 124.59 | 98.87 / 118.99 | 98.99 / 101.37 | (작업 중 측정) |
| + 저장 본문 분리 · zod 기존 구성만 | 88.93 | 99.16 / 123.84 | 98.86 / 118.25 | 98.98 / 101.36 | `bundle-step3-lazy.txt` |
| + P-S25 · 계측 (최종) | **88.96** | **99.49 / 124.45** | **98.95 / 119.22** | **98.95 / 101.33** | `final-build.txt` |

- 3단계 첫 구현의 예산 초과는 커밋 전에 해소했다. 커밋된 어떤 시점에도 build 실패는 없다.

### 2.3 최종 전/후 (모든 라우트)
| 라우트 | 전 (첫 / 진입 직후) | 후 (첫 / 진입 직후) | 여유 (후) |
|---|---|---|---|
| 공통 | 88.92 | 88.96 (+0.04) | — |
| /catalog | 98.98 / 101.36 | 98.95 / 101.33 | 1.05 / 23.67 |
| /references/:id | 96.31 / 98.69 | 96.30 / 98.68 | 3.70 / 26.32 |
| /compare | 99.16 / 123.32 | **99.49 / 124.45** | **0.51 / 0.55** |
| /profile | 98.84 / 117.48 | 98.95 / 119.22 | 1.05 / 5.78 |
| /studio | 89.38 / 91.77 | 89.39 / 91.78 | 10.61 / 33.22 |

- 조건부(자동 로드 아님, 예산 판정 밖) — 번들 스크립트에 새로 출력한다:
  - `/compare` P-S25 패널 +2.52 (패널 0.47 · 규칙 0.62 · 대비 0.73 · 문구 0.70)
  - `/compare` 이어받기 규칙 +1.34
  - `/compare` 조정 저장 본문 +2.88
  - `/profile` 조정 저장 본문 +2.15
- **공통 증가 내역 +0.04**:
  - 앱 코드는 공통에 추가하지 않았다(`main.tsx`·`AppProviders`·deferred 래퍼 무변경).
  - 증가분은 새 청크가 생기면서 엔트리의 preload 의존 목록(청크 파일명)이 늘어난 것이다(L2: 공통 파일 변경 0 + 청크 수 증가와 함께 나타남).
- 아이콘 파일 추가 0 · 예산 상수 무변경.
- `check-bundle-size.mjs`에는 조건부 출력만 더했다(`ROUTE_CONDITIONAL_DYNAMIC`, 누락 키는 실패로 처리).

## 3. 변경 파일
- 새 파일:
  - `domain/profileAdjustments.ts` — effectiveProfile · carryOverAdjustments · normalizeAdjustments · adjustmentCount
  - `domain/adjustmentSchema.ts` — zod 검증 · 기본 범위 · rangeViolations
  - `data/memoryProfileAdjust.ts` — 조정 저장 본문
  - `features/compare/carryOverPanel.tsx`
  - `features/profile/adjustmentText.ts`
- 수정:
  - `data/memoryProfileRepository.ts` — getAdjustmentRange · saveAdjustments · `range` 주입
  - `data/memoryCompareBoardRepository.ts` — 재확정 carry-over · `dropped` 기록 · 필요할 때만 규칙 받기 · Codex P2
  - `data/memoryStudio.ts`, `data/profileRepository.ts` — 주석·타입
  - `components/compare/DraftPanel.tsx` — `carryOver` 슬롯(확정 버튼 위)
  - `features/compare/useCompareBoard.ts` — 패널 조건부 로드 · 계측 호출
  - `features/compare/boardEngine.ts` — reportConfirmed · reportConfirmFailed
  - `pages/CompareBoardPage.tsx`
  - `features/profile/profileDiff.ts` — 요약에 지운 조정 한 줄
  - `pages/ProfilePage.tsx` — `v.dropped` 전달
  - `test/studioFixtures.ts` — `REF_B_INK_FIX`
  - `scripts/check-bundle-size.mjs`
- 테스트:
  - 새 파일: `domain/profileAdjustments.test.ts`(16) · `data/profileAdjust.test.ts`(20) · `pages/CompareBoardCarryOver.test.tsx`(7)
  - 수정: `CatalogPage.test.tsx` · `CompareBoardLineage.test.tsx`(플레이크만)
  - 테스트 수 599 → **642**(+43)

## 4. AC별 테스트
| AC | 테스트 (파일 › 이름 요약) |
|---|---|
| P-AC-13(저장소) | profileAdjust › "기본 범위 1벌…NOT_FOUND" · "좁은 range 주입 → RANGE_VIOLATION · 새 버전 0, 범위 안은 저장" |
| P-AC-17(저장소) | profileAdjust › "expectedLatest가 최신과 다르면 STALE_PROFILE(최신 계열 동봉) · 새 버전 0" |
| P-AC-20 | profileAdjust › "조정 있는 v2 뒤 팔레트를 바꿔 재확정 → … 보정은 빠짐(dropped 기록)". "이어받은 값이 범위 밖이면 P-S13" 표시는 b2(프로필 화면)에서 한다. 저장소는 범위를 검사하지 않고 저장한다(SPEC 6.1-3) |
| P-AC-38 | profileAdjust › "v2 = 밀도 촘촘 + 모션 덮어쓰기 → … 96 → 72" · CarryOver › "P-AC-38: … 목록 → 재확정 v3 = 목록대로 저장, 버전 요약에 지운 조정 한 줄" |
| P-AC-39 ① | profileAdjustments › carryOverAdjustments 겹침 판정 표(모션 같음/바뀜 · 밀도·대비·목적 · 보정 a · 보정 b · 목표 수준 · 기준 = confirmedBase · 전 종류) + profileAdjust "저장값 = carryOverAdjustments(…)" + CarryOver P-AC-38(패널 "이어짐" = 저장 adjustments) |
| P-AC-39 ② | profileAdjust ①② 테스트 · CarryOver "겹치지 않는 필드(Hero)만 바꾸면 '지워지는 조정 0개'" |
| P-AC-39 ③ | profileAdjustments "보정 (b) … C-3 7.3 → 2.8" · profileAdjust ③ · CarryOver ③ — 확정 뒤 프로필 화면(a2 대비 표시)에서 "한 값으로 둘 다 맞출 수 없습니다" 확인 |
| P-AC-39 ④⑤ | CarryOver "조정 0개면 캡션·목록 없음". ⑤는 모든 패널 단언이 글자다(색 단서 없음) |
| P-AC-39 ⑥ | profileAdjust "되돌리기 뒤 재확정: v1 → v2 → v3 → v4 → v5 …" — `saveAdjustments`·`revertTo`·보드 재확정 실제 순서 |
| P-S12(보드 P-S25 다시 계산) | CarryOver "패널이 보인 뒤 다른 곳에서 조정 버전이 생기면 확정 0건 + 안내, 최신 조정으로 개수를 다시 계산" |
| P-AC-41(조정 저장) | profileAdjust "같은 expectedLatest로 조정 저장 2개를 동시에 → 1 성공 · 1 STALE_PROFILE" |
| P-AC-37 | CarryOver "첫 확정 = board v1, 재확정 = board-reconfirm v3" · "확정 실패는 profile_save_failed(reason) 1회" |
| P-AC-33·34 (P-S25 부분) | 캡션이 확정 버튼 앞(DOM 순서, CarryOver P-AC-38) · 글자로만 알림 · v2 토큰 클래스만 사용(`noHardcodedStyle` 통과) |
| P-AC-35 | 2절 · `final-build.txt` |
| P-AC-36 | 0절 · `final-*.txt` |
| Codex P2 회귀 | profileAdjust "규칙을 받지 않은 채 동기 구간에서 조정이 보이면 STALE_PROFILE(최신 동봉)" |

## 5. RED 로그
- `logs/red-1-profileAdjustments.txt` — 모듈 없음(파일 실패)
- `logs/red-2-profileAdjust.txt` — 19 실패(`getAdjustmentRange`/`saveAdjustments is not a function`)
- `logs/red-3-carryOverPanel.txt` — 6 실패(④는 패널이 없어서 통과하는 회귀 가드)
- `logs/red-4-codex-p2.txt` — 일반 Error ≠ CompareBoardError

## 6. 브라우저 스모크 (127.0.0.1:5199, ego-browser)
- 흐름: 카탈로그에서 A·B 비교 추가 → 보드 → Hero A → "프로필 확정 (v1)" → `/profile/profile-1` "v1 · 현재" → GNB로 보드 복귀("v1 확정됨") → Hero B → "새 버전으로 확정 (v2)" → "v2 · 현재"
  - 버전 줄: "v2 현재 보드 재확정 …" / "v1 보드 확정 첫 버전"
- `studio:profile` 이벤트: `[{profile_saved, 1, board}, {profile_saved, 2, board-reconfirm}]`
- **조정 0개 경로**: 조건부 모듈(`carryOverPanel`·`profileAdjustments`·`memoryProfileAdjust`) 요청 0건(performance resource 목록). 따라서 P-S25 캡션도 없다.
- 조정이 있는 버전은 화면에서 만들 수 없다(조정 UI는 b2). 그래서 브리프 3.2대로 조정이 있는 경로는 단위·화면 테스트(4절)로 대신했다.
- 스크린샷은 CDP 타임아웃으로 남기지 못했다(동작 확인과는 무관).
- 서버 종료 확인: `lsof -iTCP:5199 -sTCP:LISTEN` 결과 없음.

## 7. 고친 기존 테스트 줄 (SPEC 9절 표 밖 — 플레이크 지시에 따른 대기만)
- `pages/CatalogPage.test.tsx`
  - `expectCardCount`에 선택 timeout을 더하고 `SLOW` 상수를 추가
  - Q8 테스트 3줄(빈 결과 findBy → 0개 단언 → 1개 대기 SLOW)
  - D-V22-02 URL 단언을 `waitFor`로
  - V2-AC-17r2 끝에 `}, 20_000)`
- `pages/CompareBoardLineage.test.tsx`
  - `SLOW`·`LONG_FLOW` 상수 추가
  - `boardSeesV2` 대기 3곳 + 보드 h1이 사라질 때까지 대기 1줄
  - P-AC-11 pathname 대기
  - P-AC-11·40 끝에 `}, LONG_FLOW)`
- 그 밖의 기존 테스트는 수정하지 않았다(DraftPanel·CompareBoardPage 기존 단언 모두 그대로 통과).
- 커밋 `1e60ad2`는 AC-07 1건이 깨진 채 커밋됐다. 테스트는 고치지 않았고, 저장소 쪽을 고쳐(`b82986c`, 이어받을 조정이 있을 때만 import를 기다림) 복구했다.

## 8. Codex 결과
- `review --wait --scope branch --base 3623e9b`(1회, 원문 `logs/codex-review.txt`)
- **[P2]** 조정 저장이 끼어들면 `confirmInto` 가드가 일반 Error를 던진다 → `UNKNOWN` 처리되어 STALE_PROFILE 복구 경로를 타지 못한다.
  - 반영(`0a94c68`): 최신 동봉 `STALE_PROFILE`로 바꿨다.
  - RED → GREEN 회귀 테스트를 추가했다.
  - 보통 흐름은 expectedLatest 판정이 먼저 거른다. 이 경로는 호출자가 아직 없던 번호를 기대했을 때만 생긴다.
- 반영 뒤 재리뷰는 하지 않았다(브리프 1회).

## 9. 설계 질문
1. **Q1 조정 저장의 멱등**: 브리프는 "멱등 규칙은 a1과 같게"라고 했다. a1에서 멱등 키는 보드 확정에만 있고 `revertTo`에는 없으므로, `saveAdjustments`도 키 없이 구현했다.
   - 결과: 커밋 뒤 응답이 실패한 상태에서 같은 인자로 다시 저장하면 `STALE_PROFILE`이 된다. b2 화면은 이것을 "다른 곳에서 v2가 만들어졌습니다"로 보이게 된다(사실과 다름).
   - A: 지금 유지하고, b2 화면이 STALE 동봉 계열의 최신 조정 = 내 조정이면 "저장됨"으로 처리한다.
   - B: 멱등 키 (profileId, expectedLatest, 정규화한 조정)을 **별도 기록**으로 둔다. 보드 `commits` 슬롯을 재사용하면 A-Q4가 깨진다.
2. **Q2 판정 순서**(SPEC 미정): 모양 SCHEMA_INVALID → NOT_FOUND → STALE_PROFILE → RANGE_VIOLATION → 보정 `from` ≠ 최신 base 값 SCHEMA_INVALID → 바뀐 조정 없음 SCHEMA_INVALID. 보정 `from` 검사는 SPEC에 없어서 추가했다(틀린 from이 저장되면 이어받기 (a)가 잘못 지운다). 확인 요청.
3. **Q3 보정 (b) 판정 단위**: 보정마다 따로 새 base에 적용해 "보정 없이 통과하던 검사가 미달"인지 본다.
   - 두 보정의 조합(예: primary와 ink를 함께 어둡게 해서 C-3이 새로 미달)은 보지 않는다.
   - 조합까지 보려면 어느 보정을 지울지 규칙이 필요하다.
4. **Q4 P-AC-11(1.3)**: 테스트는 "보드 화면이 내려간 뒤 돌아가기"로 해결했다. 실제 앱에서 이동 전환 중에 보드로 돌아가면 낡은 보드가 남는지(앱 쪽 같은 현상) 확인을 별도 과제로 할지 결정이 필요하다.
5. **Q5 P-S25 숨김 조건**: SPEC 6.1-3 "이어받을 조정이 0개면 캡션을 숨긴다"와 P-S25 "최신 버전에 조정이 1개 이상일 때만"이 다르게 읽힐 수 있다. 이어짐 + 지워짐 = 0일 때만 숨겼다. 이어짐 0 · 지워짐 1이면 캡션을 보인다(지워지는 조정을 알려야 하므로).
6. **Q6 P-AC-37 실패 이벤트**: SPEC 6.5 r5 "이후 버전 생성 쓰기 실패 = profile_save_failed"를 보드 확정에도 적용했다(reason = 오류 코드 | UNKNOWN). 확인 요청.
7. **Q7 패널 위치**: P-S25는 초안 패널(DraftPanel)의 확정 버튼 위에만 있다. <1280 하단 요약 바(DraftSummaryBar)의 확정 버튼 옆에는 없다. 요약 바에도 개수를 둘지 결정이 필요하다.

## 10. 남은 위험 · b2 인계
- 5회 연속은 3차에서 달성했다. 주변 부하가 클 때 대상 밖 테스트가 5초 타임아웃으로 가끔 실패한다(1.1 추가 관찰) — 이번 과제에서는 고치지 않았다.
- `/compare` 여유 0.51 / 0.55KB.
  - 2a-04c 생성 메모리 구현을 `memoryStudio`에 정적으로 붙이면 진입 직후 여유를 넘을 수 있다. 같은 방식(조정 메서드처럼 처음 쓸 때 동적 import)을 권한다.
- b2가 할 일:
  - deferred 프로필 래퍼·`ProfileRepositoryContext`·`AppProviders`를 `ProfileRepository`로 넓힌다. 메서드 2개 위임이 공통 청크에 들어가므로 실측이 필요하다.
  - 화면 조정 컨트롤, P-S13(이어받은 값이 범위 밖), `effectiveProfile`로 값 목록 전환("조정됨 · 보드 값 L2"), "보정값 쓰기", 이름표(Q2), h2(Q5)
- 패널 입력 `nextBase`는 보드 초안(`draft.profile`)이고, 저장소는 `withBusinessInfoFooter`를 적용한 base다. 이어받기 규칙은 footer를 읽지 않으므로 결과가 같다(P-AC-38 화면 테스트가 패널 = 저장값을 확인).

## 11. 커밋
`6d7e627` 플레이크 · `1e60ad2` 저장소·순수 함수 · `b82986c` 확정 타이밍 복구 · `cdd86c5` P-S25·계측·요약 · `0a94c68` Codex P2 · `abb325a` REPORT 1차 · (이 커밋: P-AC-11 원인 수정 + REPORT 갱신)

## 12. FIX (BUNDLE-03 · Q1)
- 브리프 `docs/06-handoff/FIX-2A04b1_DEVELOPER_BRIEF.md` · 기준 `940c19f` · 작성 2026-09-26
- 근거 수준: 번들 수치 = L1(`logs/fix-*`) · (b)(c) 효과 = L1 실측(측정용 배선, 커밋 안 함)

### 12.0 요약
| 항목 | 결과 |
|---|---|
| BUNDLE-03 | **멈춤(브리프 3.3)**. 규칙대로 고친 스크립트는 `/compare (조정 있음)` 126.97KB > 125로 **RED 확인**. 캡션만 자동으로 받게 분할하고 (a)(b)(c)를 모두 실측했지만, 가장 작은 조합이 **125.20KB**(> 125)였다. 여유 0.3(≤ 124.70)은 물론 예산 125도 못 맞춘다. 예산은 바꾸지 않았다. 번들 코드(스크립트·패널 분할)는 **커밋하지 않았다** — 스크립트를 넣으면 `npm run build`가 실패한다(빌드 깨진 채 커밋 금지). 패치는 `logs/`에 있다 |
| Q1 멱등 키 | 완료(`200e92d` + Codex P2 반영 `7038c3c`). I-1~I-3 + A-Q4 가드 |
| 검증 4종 | typecheck 0 · lint 0 · build 0(**기존 스크립트** 기준) · test **646/646** (`logs/fix-{typecheck,lint,build,test}.txt`) |
| 전체 5회 연속 | **646/646 × 5** (`logs/fix-run1~5.txt`) |
| Codex | review 1회 — P2 1건, 반영함(12.8) |

### 12.1 분류 결과와 근거(호출 지점)
| import | 분류 | 호출 지점 |
|---|---|---|
| `features/compare/carryOverPanel.tsx` | **자동(조건부)** | `useCompareBoard.ts:131-137` useEffect. 확정한 프로필의 최신에 조정이 있으면 진입 직후 조작 없이 실행된다 |
| `domain/profileAdjustments.ts`(재확정 이어받기 규칙) | 조작 뒤 | `memoryCompareBoardRepository.ts:54` `loadCarryOver` ← `prepareCarryOver`(:66) ← `confirmProfile`·`createProfileVersion`(:194·:198) ← `useCompareBoard.confirm()`(:245, 확정 버튼). 확정 실패 뒤 재시도도 "다시 시도" 버튼 `onClick`이다(`boardMessages.ts:47`) |
| `data/memoryProfileAdjust.ts`(조정 저장 본문) | 조작 뒤 | `memoryProfileRepository.ts` `loadAdjust` ← `getAdjustmentRange`·`saveAdjustments`. **앱 코드 호출자 0**(테스트만). b2에서 `/profile` 진입 때 `getAdjustmentRange`를 자동으로 부르게 되면 **자동으로 재분류**해야 한다(12.9) |
| 픽스처·`boardEngine`·`memoryStudio`·`referenceComparisons`·`profileEngine` | 자동 | 기존과 같다(main 로더·보드 load effect·프로필 화면 로더) |

- 고친 스크립트(`logs/fix-bundle-script.patch`)의 구조:
  - 분류 규칙을 주석으로 적었다. 확인하지 못한 import는 자동으로 분류한다.
  - 판정 대상은 상수 `SCENARIOS` 하나다. 각 항목 = `name`·`page`·`auto`·`afterAction`.
  - `/compare (조정 있음)` = 기본 `/compare`의 `auto` + `carryOverPanel.tsx`.
  - `page`·`auto`·`afterAction` 키 중 manifest에 없는 것이 있으면 실패한다(기존 가드 유지).
  - 조작 뒤 import는 진입 직후 합계에 없는 파일 크기만 출력한다.

### 12.2 RED 로그
- `logs/fix-red-bundle.txt` — 고친 스크립트를 `940c19f` 빌드에 실행(exit 1): `/compare (조정 있음)` 진입 직후 **126.97KB > 125KB**. 나머지 시나리오는 통과.
- `logs/fix-red-q1.txt` — Q1 테스트 추가 직후 3 실패.
  - I-1: `STALE_PROFILE: expectedLatest 1 ≠ 2`
  - I-3: 커밋 단계 주입 없음
  - A-Q4: `store.adjustCommitOf is not a function`
  - I-2는 수정 전에도 통과한다. "다른 조정 → STALE"·"모르는 키 → SCHEMA_INVALID"가 멱등 키 때문에 바뀌지 않게 지키는 회귀 가드다.

### 12.3 패널 분할 구조 (시험 구현, 커밋 안 함 — `logs/fix-bundle-spike-caption.patch`)
- 자동 청크 `carryOverPanel`에는 캡션만 남겼다. `carryOverAdjustments` 결과 개수로 "이어지는 조정 N개 · 지워지는 조정 M개"를 보인다.
- 목록 문구(`adjustmentText`)는 뺐다. 계획은 `details` 펼칠 때 `import()`하는 것이었다.
- 이어받기 판정 자체에 대비 계산이 필요하다: 보정 (b) "새 대비 실패" = `checkProfileContrast`(C-3·C-4·C-5). 그래서 캡션 청크에 남는다.
  - 대비 부분 실측: `profileContrast` 청크 0.73KB. 그중 판정에 필요한 `checkProfileContrast`만 떼면 S2 합본 청크 1.06KB 안에 들어간다.
- 목표치에 못 미쳐서 펼침 import·로딩/실패 문구·화면 테스트(B-3)는 만들지 않았다. 멈춤 조건(3.3)에 따른 것이다.

### 12.4 단계별 실측 (gzip KB, `/compare` 첫 화면 / 진입 직후, `logs/fix-spikes-bundle.txt`)
| 단계 | /compare | /compare (조정 있음) | 판정(≤125 · 여유 0.3 = ≤124.70) |
|---|---|---|---|
| 기준 `940c19f` (RED) | 99.49 / 124.45 | 99.49 / **126.97** | 실패 |
| S1 패널 분할(캡션만 자동, 규칙·대비는 기존 모듈 전체) | 99.47 / 124.43 | 99.47 / **126.10** | 실패 |
| S2 = S1 + (a) 판정에 필요한 부분만 한 모듈(`carryOverAdjustments`·`checkProfileContrast`만. `proposeCorrections`·`effectiveProfile`·`normalize` 제외) | 99.44 / 124.41 | 99.44 / **125.47** | 실패 |
| S3 = S2 + (b) Callout 공유 청크 제거 **상한**(ProfilePage에 복제본 → 청크 경계 비용 0) | 99.17 / 124.14 | 99.17 / **125.20** | 실패 |
| S4 = S2 + (c) BUNDLE-01 C8(DraftPanel·DraftSummaryBar·ComparisonTable·ComparisonAccordion을 엔진 청크로) | **94.98** / 124.51 | 94.98 / **125.57** | 실패 |
| Q1 커밋 뒤(번들 코드는 기준 그대로) | 99.49 / 124.50 | (126.97 + 0.05 추정) | 기존 스크립트 통과 |

- (c) C8은 첫 화면만 −4.5KB 줄인다. 진입 직후는 **+0.10**이다. `docs/perf/bundle-01/REPORT.md:156` "진입 직후 합계는 거의 그대로"가 실측으로 확인됐다. 이 시나리오에는 효과가 없다.
- (a)+(b)+(c) 전부 = S3 125.20 + C8 +0.10 ≈ **125.30**(추정, 따로 빌드하지 않음 — C8은 진입 직후를 늘린다).
- 가장 작은 조합은 (a)+(b) 상한 = **125.20**이다. 125까지 −0.20, 여유 0.3까지 −0.50이 모자란다. (b)는 복제로 잰 상한이라 실제 청크 설정 변경으로는 이보다 줄지 않는다.
- 그래서 B-1(수정 후 통과)·B-2(시나리오 여유 ≥ 0.3)·B-3(펼침 테스트)는 **미달**이다. 브리프 3.3에 따라 멈췄다.
- 모든 라우트 전/후 (Codex P2 반영 뒤 최종, `logs/fix-build.txt`):

| 라우트 | 전 `940c19f` (첫 / 진입 직후) | 후 | 여유 (후) |
|---|---|---|---|
| /catalog | 98.95 / 101.33 | 98.94 / 101.32 | 1.06 / 23.68 |
| /references/:id | 96.30 / 98.68 | 96.29 / 98.68 | 3.71 / 26.32 |
| /compare | 99.49 / 124.45 | 99.49 / **124.50** | **0.51** / 0.50 |
| /profile | 98.95 / 119.22 | 98.94 / 119.26 | 1.06 / 5.74 |
| /studio | 89.39 / 91.78 | 89.39 / 91.78 | 10.61 / 33.22 |
- Q1이 진입 직후에 더한 것은 +0.05다(`studioStore` 슬롯 + 프로필 `call`의 commit 게이트). 키 계산·비교는 조작 뒤 청크(`memoryProfileAdjust`, /compare +2.88 → +2.98)에 있다. 첫 화면 `/compare` 여유 0.51은 줄지 않았다.

### 12.5 B-/I- 테스트 이름 (`app/src/data/profileAdjust.test.ts` › "Q1 조정 저장 멱등 — 키 = (profileId, expectedLatest, 정규화한 조정) 별도 기록 (6.3 r3 계약)")
- I-1 "커밋 뒤 응답 실패 → 같은 인자로 다시 저장하면 STALE 없이 같은 버전, 새 버전 0 (정규화가 같으면 같은 키)"
- I-2 "같은 expectedLatest라도 다른 조정이면 멱등 결과가 아니라 기존 판정 STALE_PROFILE(최신 동봉) · 모르는 키를 붙인 재시도는 SCHEMA_INVALID" — Codex P2 반영 때 `{ density: "compact", extra: undefined }` 단언 1줄 추가(RED `logs/fix-red-codex-p2.txt`)
- I-3 "커밋 단계 실패 → 버전·멱등 기록 모두 롤백, 주입을 끄고 같은 인자로 다시 저장하면 성공(번호 건너뜀 0)"
- A-Q4 "보드 확정 commits 슬롯을 쓰지 않는다(A-Q4) — 조정 저장 뒤에도 보드 확정의 같은 키 재시도는 커밋된 결과"
- B-1~B-3: 없음. 멈춤 때문이며, B-1은 RED 로그만 있다.

### 12.6 Q1 구현 (`200e92d`)
- `studioStore.ts`: `adjustCommits` 슬롯 · `adjustCommitOf` · `rememberAdjust`. 보드 `commits`와 따로 두며, 같은 트랜잭션 draft에 쓰므로 롤백 시 함께 버려진다.
- `memoryProfileAdjust.ts`:
  - 멱등 키 = `[profileId, expectedLatest, JSON(normalizeAdjustments(검증한 값))]`
  - 판정 순서: **모양 → 멱등 키** → NOT_FOUND → STALE_PROFILE → 범위 → 보정 from → 변경 없음. 키가 같으면 기록된 버전을 그대로 돌려준다(새 버전 0).
  - 브리프 3.4는 "멱등 키 → 모양"이었다. 첫 구현(`200e92d`)은 그 순서였고, Codex P2(12.8)에 따라 모양을 앞으로 옮겼다(12.10 Q-F2).
  - 삽입 뒤 `rememberAdjust` → `commitGate()` 순서다.
- `memoryProfileRepository.ts`: `ProfileCall.phase`에 `"commit"`을 추가했다. `call`이 보드 구현과 같은 `commitGate`를 넘긴다.

### 12.7 고친 기존 줄
- 기존 테스트: 없음(Q1 describe 추가만).
- 기존 앱 줄:
  - `memoryProfileRepository.ts` 머리 주석의 "멱등 키는 두지 않는다"를 바꿨다.
  - `ProfileCall.phase` 타입, `call` 시그니처, `work()` 호출, `saveAdjustments` 호출 1줄을 고쳤다.
  - `memoryProfileAdjust.ts` 판정 순서 주석을 고쳤다.
  - `studioStore.ts` 머리 주석·`IdempotentCommit` 주석·초기 state를 고쳤다.

### 12.8 Codex 결과
- `review --wait --scope branch --base 940c19f` 1회 (원문 `logs/fix-codex-review.txt`) 
- **[P2]** 멱등 재생이 모양 검사보다 앞이었다. 그래서 `{ density: "compact", extra: undefined }`처럼 정규화 뒤 같은 키가 되는 잘못된 재시도가 SCHEMA_INVALID 대신 이전 결과를 받았다(`memoryProfileAdjust.ts:50-52`).
  - 반영(`7038c3c`): `parseAdjustments`를 먼저 하고, 검증한 값으로 키를 만든다. 모르는 키 우회 함수(`idempotencyKey`)는 없앴다.
  - RED(`logs/fix-red-codex-p2.txt`, I-2 1 실패) → GREEN. 그 뒤 검증 4종·5회 연속을 다시 실행했다(0절 수치는 반영 뒤).
- 반영 뒤 재리뷰는 하지 않았다(브리프 1회).

### 12.9 남은 위험
- **`/compare (조정 있음)` 진입 직후 ≈ 127.0KB 초과가 그대로 남아 있다.** 기존 스크립트는 이 경로를 판정하지 않는다. 결정 전까지 현재 번들 검사는 이 초과를 숨긴다(Q-F1).
- b2 인계: `/profile`이 진입 때 `getAdjustmentRange`를 자동으로 부르게 되면, `memoryProfileAdjust`를 **자동**으로 옮겨 `/profile` 시나리오에 넣는다. 현재 +2.25KB → 119.26 + 2.25 = 약 121.5로 예산 안(L3 추정).
- `/compare` 기본 진입 직후 여유가 0.55 → 0.50으로 줄었다(Q1). 2a-04c 생성 메모리 구현도 같은 방식(처음 쓸 때 동적 import)이어야 한다.

### 12.10 설계 질문
1. **Q-F1 BUNDLE-03 해소 방향** (멈춤 근거 12.4). 선택지:
   - A: 조정 있음 시나리오만 예산을 따로 정한다(ADR-004 개정, 영환님 결정). 캡션 분할 S2 기준 125.47이다.
   - B: 캡션을 없애고, 패널 전체를 "조정 목록 보기" 같은 조작 뒤 로드로 바꾼다. P-S25 "보이는 캡션"을 SPEC에서 개정해야 한다.
   - C: 진입 직후 기본 합계 자체를 줄인다. 브리프 (a)(b)(c) 밖이다. 예: `memoryProfileRepository`의 `revertTo` 본문·`memoryCompareBoardRepository`의 확정 본문을 조작 뒤 청크로 옮긴다. 효과는 미실측이다.
   - 스크립트 패치(`logs/fix-bundle-script.patch`)는 결정과 함께 넣는다. 먼저 넣으면 build가 실패한다.
2. **Q-F2 판정 순서 "모양 → 멱등 키"** (브리프 3.4는 "멱등 키 → 모양"): 정규화가 모르는 키를 버리므로, 키를 먼저 보면 틀린 입력이 이전 결과를 받는다(Codex P2). 같은 인자의 정상 재시도는 늘 모양을 통과하므로 I-1 결과는 같다. 보드 확정은 인자에 페이로드가 없어 이 문제가 없다. 이 순서로 확정할지 확인 요청.
3. **Q-F3 멱등 기록 범위**: 보드와 같이 계열마다 **마지막 조정 저장 1건**만 기억한다. 그 뒤 같은 계열에 다른 조정 저장이 커밋되면, 앞 요청의 재시도는 STALE_PROFILE이 된다(보드 확정과 같은 범위, A-Q4 유지).

### 12.11 커밋
- `200e92d` Q1 멱등 키
- `7038c3c` Codex P2 — 모양 검사 뒤 멱등 재생
- (이 커밋) REPORT 12절 + `logs/fix-*`(RED·스파이크 실측·패치·검증·5회·Codex)

## 13. FIX2 (P-S25 펼침 로드)
- 브리프 `docs/06-handoff/FIX2-2A04b1_DEVELOPER_BRIEF.md` · 기준 `0042113` (SPEC r6 `9f1311b`) · 작성 2026-09-26
- 근거 수준: 번들 수치 = L1(`logs/fix2-*`) · A 변형 하한 = L3 추정(따로 빌드하지 않음)

### 13.0 요약
| 항목 | 결과 |
|---|---|
| 판정 | **멈춤(브리프 2-4)**. 기능·테스트는 GREEN(P-AC-38·39 ①~⑦)인데, `/compare` 진입 직후가 **125.08KB**(> 125)다. 여유 0.3(≤ 124.70)은 물론 예산 125도 못 맞춘다. 스타일·로그를 모두 뺀 최소 틀도 **124.98KB**(여유 0.02)라 여유 0.3은 이 구조로 불가능하다. 예산 상수는 바꾸지 않았다 |
| 코드 | **커밋하지 않았다**. 고친 스크립트로 `npm run build`가 실패한다(빌드 깨진 채 커밋 금지). 옛 스크립트로도 기본 `/compare` 진입 직후가 125.08이라 실패한다(L2 — 옛 스크립트를 돌린 값이 아니라 `/compare` 합계식이 같아서 계산한 값). 구현 전체는 `logs/fix2-impl.patch`(기준 `0042113`에 `git apply --check` 통과) |
| 핵심 발견 | 자동 조건부 import가 0개가 되어 `/compare (조정 있음)` = `/compare`가 됐다. r6 전제(조정 있음 시나리오 초과 해소)는 맞았다. 하지만 **초과가 기본 `/compare`로 옮겨갔다**. 캡션 틀(개수 캡션·details·로딩/실패 문구·다시 시도)은 진입 직후 집합에 있어야 하므로, 조정이 없는 진입도 약 0.5KB를 부담한다 |
| 검증(패치 상태, 1회) | typecheck 0 · lint 0 · test **659/659** (`logs/fix2-{typecheck,lint,test}.txt`. `fix2-typecheck.txt`는 lint 수정(테스트 헬퍼 1줄) 전 실행 — 최종 패치 트리의 typecheck 통과 근거는 `fix2-codex-review.txt`와 `fix2-build.txt`의 tsc 단계) · build = 번들 검사 실패(`logs/fix2-build.txt`) |
| 미실행 | 전체 5회 연속·브라우저 스모크 — 코드를 커밋하지 않아서다. 스모크는 앱에 조정 UI(b2)가 없어서 조정 있는 프로필을 화면으로 만들 수도 없다(6절과 같음) |
| Codex | working-tree 리뷰 1회(13.8) |

### 13.1 구조 (패치 기준 — 자동/펼침 경계와 호출 지점)
- **진입 직후 자동**
  - 개수 N: `boardScreen.ts` `carryOverCount`. 키 수 + 보정 항목 수를 인라인으로 센다(6.1-3 단위). 판정 함수·대비 계산은 import하지 않는다.
  - 틀 `features/compare/CarryOverCaption.tsx`(엔진 청크, `boardEngine.CarryOverCaption`): 캡션 "이 프로필에 조정 N개가 있습니다", `details` "이어받기 확인", 로딩·실패 문구, "다시 시도".
  - 표시 조건은 이전과 같다: 엔진 로드·N > 0·`confirmedBase`·`latest`·초안 ready(`useCompareBoard`).
- **조작 뒤(펼침)**
  - 호출 지점: `carryOverLoader.ts` `loadCarryOverPanel`(`import("./carryOverPanel")`) ← `CarryOverCaption` `load` ← `details onToggle`(open일 때)·"다시 시도" `onClick`.
  - 받은 청크는 상태에 두고 다시 받지 않는다. 실패하면 다시 요청할 수 있다.
  - `carryOverPanel.tsx`에는 `carryOverAdjustments`로 만든 "이어지는 조정 N개 · 지워지는 조정 M개"와 줄 목록만 남겼다.
- **확정 뒤 알림**
  - `ConfirmResult.droppedCount?`: 저장한 버전 레코드의 `dropped.length`, 1 이상일 때만. 멱등 재생 경로도 레코드에서 읽는다.
  - `useCompareBoard.confirm`이 `navigate(…, { state: { droppedCount } })`로 넘긴다.
  - `ProfilePage`가 모양을 확인한 뒤(`droppedCountOf`) "프로필 알림"에 "조정 M개를 지웠습니다"를 낸다.
- 포커스·펼침: 네이티브 `details/summary`가 펼침 상태를 알린다(명시 `aria-expanded`는 넣지 않았다 — summary의 암묵 상태와 중복). "다시 시도"를 누르면 포커스를 summary로 옮긴 뒤 다시 받는다(버튼이 사라져도 body로 빠지지 않음).
- 번들 스크립트: `logs/fix-bundle-script.patch`의 12절 규칙(분류 주석·`SCENARIOS`·누락 키 가드)을 적용했다. `carryOverPanel.tsx`는 **조작 뒤**(`COMPARE_AFTER_ACTION`)로 옮기고 호출 지점을 주석에 적었다. `/compare (조정 있음)`은 계속 출력·판정한다(auto = `/compare`와 같음).

### 13.2 RED 로그 (`logs/fix2-red.txt`)
- 테스트를 먼저 쓰고 실행: 16 실패.
  - 화면 8: 캡션 "이 프로필에 조정 N개가 있습니다" 없음(P-AC-38·39 ②③·P-S12·⑦ 4건).
  - 단위 7: `carryOverCount is not a function`.
  - 저장소 1: 응답 단계 실패 주입 방식 오류(`fail`에는 response 단계가 없다) → `delay` reject로 고쳐 다시 RED: `expected { profileId, version: 3 } to deeply equal { …, droppedCount: 1 }`.
- RED 때 이미 통과한 새·옮긴 테스트: P-AC-39 ④⑤(조정 0개)·⑦ M = 0("지웠습니다" 없음). 수정 전에도 성립하는 회귀 가드다(12.2 I-2와 같은 성격).
- GREEN: `logs/fix2-green.txt` 대상 3파일 44/44.
- 과정 중 함정 1건: `beforeEach(() => panelLoads.mockReset())`가 mock을 반환해 vitest가 정리 훅으로 호출했다(실패 주입 테스트에서만 드러남). 블록 본문으로 고쳤다.

### 13.3 번들 실측 (gzip KB, `/compare` 첫 화면 / 진입 직후 — `/compare (조정 있음)`도 같은 값)
| 단계 | 첫 화면 | 진입 직후 | 판정(≤125 · 여유 0.3 = ≤124.70) |
|---|---|---|---|
| 기준 `0042113` (12.4 최종) | 99.49 | 124.50 | 통과(옛 스크립트) |
| A: 로드 상태를 훅이 가짐, 틀은 엔진 청크 | 99.67 | **125.01** | 실패 |
| B: 로드 상태·로더를 틀(엔진 청크)이 가짐 = **패치** | **99.43** | **125.08** | 실패 |
| B 기반 하한: 틀에서 스타일 클래스·래퍼·Button·오류 로그 제거(시험, 커밋 안 함) | 99.43 | **124.98** | 125 통과 · 여유 0.02 |
| A 기반 하한 (L3 추정) | — | ≈ 124.9 | 여유 < 0.3 |

- 청크별 차이(`logs/fix2-chunks-A.txt`·`fix2-chunks-B.txt`):
  - B: `boardEngine` 5.19 → 5.79(+0.60 = 틀·로드 상태·로더·mapDeps) · `CompareBoardPage` 9.28 → 9.22 · `memoryStudio` +0.03(`resultOf`) · `ProfilePage` +0.12(알림).
  - A: `boardEngine` +0.29 · `CompareBoardPage` +0.18.
- 교훈: 로더(동적 import + preload 목록)를 엔진 청크로 옮기면 진입 직후가 +0.07 늘었다(A → B). 첫 화면은 −0.24 줄었다. 다음 구현에서 진입 직후가 기준이면 로더는 페이지 청크에 둔다.
- 모든 라우트 (B = 패치, `logs/fix2-build.txt`):

| 라우트 | 전 `0042113` (첫 / 진입 직후) | 후 B | 여유 (후) |
|---|---|---|---|
| /catalog | 98.94 / 101.32 | 98.96 / 101.34 | 1.04 / 23.66 |
| /references/:id | 96.29 / 98.68 | 96.31 / 98.69 | 3.69 / 26.31 |
| /compare | 99.49 / 124.50 | 99.43 / **125.08** | 0.57 / **−0.08** |
| /compare (조정 있음) | (126.97, 12.2 RED) | 99.43 / **125.08** | 0.57 / **−0.08** |
| /profile | 98.94 / 119.26 | 99.07 / 119.42 | 0.93 / 5.58 |
| /studio | 89.39 / 91.78 | 89.40 / 91.78 | 10.60 / 33.22 |

### 13.4 테스트 이름 (패치 안)
- `app/src/pages/CompareBoardCarryOver.test.tsx`: 로더 모듈 `vi.mock`(기본 = 실제 import, 호출 수·지연·실패 주입)
  - "P-AC-39 ⑦ 펼침 로드 (r6) — 진입 직후 자동은 개수 캡션만, 판정·목록은 '이어받기 확인'을 펼칠 때"
    - ①②③ "펼치기 전 패널 청크 요청 0(보드 조작 뒤에도) · 캡션 N = 펼친 뒤 이어짐 + 지워짐 · '확인하는 중' → 목록 · 접었다 다시 펼쳐도 요청 1회" (보정 포함 N = 3 = 2 + 1)
    - ④ "청크 요청 실패 → '불러오지 못했습니다' + '다시 시도' → 성공하면 목록, 포커스는 '이어받기 확인'에 남는다"
    - ⑤ "실패 중에도 확정할 수 있다 — 저장은 저장소가 같은 함수로 계산, 프로필 알림 '조정 1개를 지웠습니다'"
    - ⑥ "펼치지 않고 확정한 저장값 = 펼치고 확정한 저장값 (둘 다 '조정 1개를 지웠습니다'), 펼치지 않은 쪽은 청크 요청 0"
    - ⑦ "지운 조정이 0개(M = 0)면 확정 뒤 '지웠습니다' 알림 없음" (M>0은 ⑤⑥·P-AC-38)
- `app/src/features/compare/boardScreen.test.ts` "carryOverCount — P-S25 캡션 N (6.1-3 개수 단위: 조정 키 1 · 보정 항목 1)": `adjustmentCount`와 표 비교 6행(보정 2개 행 포함) + 보정 2개 = 2 · 최신 없음 = 0
- `app/src/data/profileAdjust.test.ts` "P-AC-39 ⑦(저장소, r6): 확정 결과의 droppedCount = 지운 조정 수(M>0만) — 커밋 뒤 응답 실패의 같은 인자 재시도(멱등 재생)도 같은 수"

### 13.5 고친 기존 단언 (약화 없음 — 검사 시점을 펼친 뒤로 옮김)
- 헬퍼
  - `caption()`: 옛 "이어지는 조정…" → 새 캡션 "이 프로필에 조정…". 옛 문구는 `counts()`로 옮겼다.
  - `rows()`: "조정 목록" details → "이어받기 확인" details.
- P-AC-38
  - "이어지는 조정 2개 · 지워지는 조정 0개"·"1개 · 1개"·목록 `toEqual`은 그대로 두고 펼친 뒤 검사한다.
  - 캡션 "조정 2개" 단언을 더했다.
  - **DOM 순서 단언의 대상이 새 캡션으로 바뀌었다**(확정 버튼 앞).
  - 확정 뒤 "프로필 알림" "조정 1개를 지웠습니다"를 더했다.
- P-AC-39 ②③: 목록·개수 단언은 같고 펼친 뒤 검사. 캡션 N(3·1) 단언을 더했다.
- P-AC-39 ④⑤: 캡션·`counts`·"조정 목록" 없음을 유지하고, "이어받기 확인" 없음과 청크 요청 0을 더했다.
- P-S12: 펼친 뒤 검사. STALE 뒤 목록 개수·줄은 같고, 캡션 "조정 2개" 갱신 단언을 더했다.
- 저장소 `toEqual({ profileId, version })`는 M = 0이라 그대로 통과한다(`droppedCount`는 M>0일 때만).

### 13.6 5회 결과 · 스모크
- 5회 연속: 실행하지 않았다(코드 미커밋). 패치 상태 1회 659/659(`logs/fix2-test.txt`).
- 스모크: 실행하지 않았다. 패치를 다시 적용할 때 조정 있는 프로필이 필요하면 `main.tsx`에 개발 전용 임시 노출(커밋 안 함)이 필요하다 — 조정 UI는 b2다.

### 13.7 남은 위험
- 브라우저는 실패한 동적 import를 모듈 맵에 캐시할 수 있다. 실제 네트워크 실패 뒤 "다시 시도"가 계속 실패할 수 있다. 로더 mock 테스트로는 보지 못한다.
- `ProfilePage`의 알림은 history state로 온다. 뒤로 가기로 같은 항목에 돌아오면 다시 알릴 수 있다(`location.key` 기준).
- 틀의 로드 상태는 틀 컴포넌트에 있다. 초안이 ready가 아니게 되어 틀이 내려가면 상태가 사라지고, 다시 펼칠 때 한 번 더 요청한다.

### 13.8 Codex 결과
- `review --wait --scope working-tree` 1회 (원문 `logs/fix2-codex-review.txt`).
- scope가 브리프(`--scope branch --base 0042113`)와 다른 이유: 코드를 커밋하지 않았다. branch scope는 이 문서·로그만 보고 구현을 보지 못한다. 그래서 커밋 전 작업 트리(= `fix2-impl.patch`)를 리뷰했다.
- 결과: **조치가 필요한 결함 0건**. Codex 쪽 typecheck는 통과했다. 테스트는 Codex 샌드박스가 읽기 전용이라 Vite 임시 설정 파일을 쓰지 못해 돌지 않았다(로컬 659/659는 13.0).

### 13.9 설계 질문
1. **Q-F2-1 `/compare` 진입 직후를 여유 0.3 안에 넣는 방향** (13.3 수치). 선택지:
   - A: ADR-004 예외 — `/compare` 진입 직후 한도를 올린다. 패치(B) 125.08에 여유 0.3을 두려면 **≥ 125.38**이 필요하다(예: 125.5 → 여유 0.42).
   - B: 기본 진입 직후 축소(12.10 C안) — **≥ 0.38KB**(B → 124.70)를 줄여야 한다. 하한 틀(124.98)을 쓰면 ≥ 0.28. 후보: `memoryProfileRepository` `revertTo` 본문·`memoryCompareBoardRepository` 확정 본문을 조작 뒤 청크로. 미실측.
   - C: 틀을 자동 조건부 청크로 분리(조정 있을 때만 받음) — 기본 `/compare`는 ≈ 124.5로 돌아가지만 `/compare (조정 있음)`은 틀 + 청크 경계 비용으로 ≈ 125.1 이상(L3 추정)이라 그 시나리오가 다시 초과한다.
   - D: 캡션도 조작 뒤로(12.10 B안, P-S25에서 자동 캡션 제거) — 진입 직후 ≈ 기준 124.50 + 요약 버튼 정도(L3). "보이는 캡션" SPEC 개정이 필요하다.
   - 패치(`logs/fix2-impl.patch`)는 A·B에서는 그대로, C·D에서는 틀 부분만 바꿔 쓸 수 있다. 테스트는 로더 mock 구조라 C·D에도 재사용된다.
2. **Q-F2-2 명시 `aria-expanded`**: 네이티브 `details/summary`의 암묵 펼침 상태만 쓴다(13.1). SPEC "aria-expanded 유지"를 이 뜻으로 읽었다 — summary에 명시 속성이 필요하면 알려 달라.

### 13.10 커밋
- 코드 커밋 없음(13.0 멈춤). 작업 트리는 `0042113`으로 되돌렸다.
- (이 커밋) REPORT 13절 + `logs/fix2-*`(RED·GREEN·build·청크 비교 A/B·하한 스파이크·검증·Codex·구현 패치)
