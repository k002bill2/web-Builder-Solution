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
