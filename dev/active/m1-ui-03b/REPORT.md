# M1-UI-03b REPORT — 비교 보드 화면 `/compare`

브랜치 `k002bill2/m1-ui-03b` (03a가 합쳐진 main에서 분기, 로컬 커밋만 · push·원격 없음) · 2026-09-26

## 결론
- 단계 1~6은 완료했습니다. 단계 7은 판단만 기록하고 코드는 유지했습니다.
- 검증 4종이 모두 통과했습니다.
  - typecheck · lint · **test 305/305**(기존 236 + 신규 69, 35 파일) · build(exit 0).
- 번들: `/compare` 첫 화면 정적 합계는 **99.93KB / 100KB**입니다. 여유가 0.07KB뿐입니다(아래 "번들").
- Codex R1 지적 P1 1건 · P2 2건을 모두 반영했습니다(5297948).
  - 세 수정에는 회귀 테스트를 따로 쓰지 않았습니다. RED도 확인하지 않았습니다(90턴 한도).
  - R2는 돌리지 않았습니다. **R2와 회귀 테스트가 남은 작업입니다.**
- 기존 테스트 2건은 의도적으로 바꿨습니다(아래 "SPEC·기존과 다르게 한 부분").

## 단계 1~7
| # | 항목 | 상태 | 주요 파일 |
|---|---|---|---|
| 1 | DS `Callout` + 아이콘 5종 | 완료 | `components/ds/Callout.tsx`, `assets/icons/{check,circle-check,warning,circle-info,chevron-down}.svg` (복사만) |
| 2 | `PickButton`·`ColumnHeader`·`ComparisonTable` + 가로 전용 roving | 완료 | `components/compare/*`, `components/ds/rovingFocus.ts#rovingRowTargetIndex`, `features/compare/boardView.ts` |
| 3 | `DraftPanel`·`DraftItem`·`CustomStyleFields`, 폰트 3종 활성, D1·D2 | 완료 | `components/compare/*`, `domain/fonts.ts`, `domain/comparisonCells.ts#fontCell`, `features/compare/draftView.ts` |
| 4 | `CompareBoardPage`(lazy) S-01~S-17, 확정 흐름, A-7 | 완료 | `pages/CompareBoardPage.tsx`, `features/compare/useCompareBoard.ts`, `boardEngine.ts`, `boardMessages.ts` |
| 5 | 반응형 ≥1280 / 768~1279 / <768 | 완료 | `features/compare/useViewport.ts`, `ComparisonAccordion.tsx`, `DraftSummaryBar.tsx` |
| 6 | 진입 경로 | 완료 | 트레이 "비교 보드 열기" → `/compare` 이동은 이미 구현돼 있어 테스트만 추가했습니다. "레퍼런스 추가"는 `/catalog`로만 갑니다. 저장한 레퍼런스가 있으면 `?tab=saved`로 갑니다. |
| 7 | `addToTray`·`removeFromTray` | **유지(판단)** | 이제 규칙 테스트에서만 씁니다. 지우려면 기존 테스트 4건을 함께 지워야 해서 "기존 236개 모두 통과" 지시와 충돌합니다. 다음 정리 작업(1a-04)에서 테스트와 함께 제거하기를 제안합니다. |

## AC별 테스트 매핑 (테스트 이름에 AC ID)
| AC | 테스트 |
|---|---|
| AC-01·02·03 | `CompareBoardPage.test.tsx` "AC-01/02/03(화면)" · `ComparisonTable.test.tsx` "AC-03" |
| AC-04·05·06 | `CompareBoardPage.test.tsx` AC-04·05·06(A-8 재알림 포함) · `DraftPanel.test.tsx` "AC-04(화면)"·"AC-06(화면)" |
| AC-07 | `CompareBoardPage.test.tsx` "AC-07"(전부 선택 → 확정된 section_plan = A sectionPlan) · P-5 되돌리기 |
| AC-08 | `CompareBoardPage.test.tsx` "AC-08"(알림 · 열 문자 유지 · 포커스 A-6 · **빼기 뒤 다음 선택도 저장**) |
| AC-09 | `CompareBoardPage.test.tsx`·`DraftPanel.test.tsx` "AC-09" |
| AC-10 | 03a `profileDraft.test.ts` "AC-10"(순수 함수) |
| AC-11 | `CompareBoardPage.test.tsx` "AC-11(화면)"(Callout + 확정 L2) · `DraftPanel.test.tsx` |
| AC-12·AC-24 | `CompareBoardPage.test.tsx` "AC-12·AC-24"(수치·보정값·확정된 color_tokens = derivePalette) · "AC-12 보정값 쓰기" |
| AC-13 | `CompareBoardPage.test.tsx`·`DraftPanel.test.tsx` "AC-13(화면)" |
| AC-14 | `CompareBoardPage.test.tsx`·`DraftPanel.test.tsx` "AC-14" |
| AC-15 | `CompareBoardPage.test.tsx` "AC-15" · `ComparisonTable.test.tsx` "AC-15(화면)" |
| AC-16 | `CompareBoardPage.test.tsx` "AC-16" |
| AC-17 | `CompareBoardPage.test.tsx` "AC-17"(응답 지연 중 연타 → 1회, 확정 중 선택 aria-disabled S-13) |
| AC-18 | `CompareBoardPage.test.tsx` "AC-18" · `DraftPanel.test.tsx` "S-17" |
| AC-19 | `ComparisonTable.test.tsx` "AC-19" + ↑/↓ 무시·Home/End·행 복귀 |
| AC-20 | `CompareBoardPage.test.tsx` "AC-20" |
| AC-22 | `CompareBoardPage.test.tsx` "AC-22" |
| AC-23 | `CompareBoardPage.test.tsx` "AC-23"(저장 응답 지연 → 확정 차단·이유 → 저장 뒤 B revision으로 호출) |
| AC-25 | `CompareBoardPage.test.tsx` "AC-25·S-15·S-16"(`createProfileVersion` 스파이, v1 불변) |
| AC-26 | `CompareBoardPage.test.tsx` "AC-26"(셀 표시·버튼 없음·library_version) |
| AC-21 | QA 몫([Q]). 이번에는 아래 브라우저 확인만 했습니다. |
| 그 외 | S-02, S-08(1.3 한 번만), S-12, S-14(STALE), D1 화면, 반응형 7건(`CompareBoardResponsive.test.tsx`), 진입 경로 |

## RED/GREEN 요약 (상세: PROGRESS.md)
- 1: Callout import 실패 → 4 passed
- 2: roving 2 failed · 표 import 실패 → 10 passed
- 3: 폰트·D1·기본 폰트 4 failed · 패널 import 실패 → 130 passed
- 4: 화면 29 failed / 1 passed → 30 passed
- 5: 반응형 6 failed / 1 passed → 7 passed
- 중간 실패와 원인은 PROGRESS에 적었습니다(쿼리 중복·픽스처 모션·getBoard 호출 횟수 등).
- **Codex R1 수정 3건은 RED 확인 없이 반영했습니다.**

## 검증 4종 · 번들
```
cd app && npm run typecheck && npm run lint && npm test -- --run && npm run build
Test Files 35 passed (35) · Tests 305 passed (305) · build exit 0
[bundle] 공통 JS (gzip, 참고): 88.97KB
[bundle] /catalog 첫 화면 합계: 97.98KB / 예산 100KB (진입 직후 자동 로드 포함 참고: 100.36KB)
[bundle] /references/:id 첫 화면 합계: 95.64KB / 예산 100KB (진입 직후 자동 로드 포함 참고: 98.02KB)
[bundle] /compare 첫 화면 합계: 99.93KB / 예산 100KB (진입 직후 자동 로드 포함 참고: 120.51KB)
[bundle] /profile · /studio (자리표시) 첫 화면 합계: 89.40KB / 예산 100KB
```
- **기준선과 비교**
  - `/catalog`: 96.67 → 97.98KB (+1.31)
  - `/references/:id`: 94.82 → 95.64KB (+0.82)
  - 공통 청크: 88.46 → 88.97KB (+0.51)
- **증가 원인**
  - 트레이 컨텍스트 확장이 공통 청크를 키웠습니다.
  - `Tag`·`Select`·`catalogFilters`를 `/compare`도 쓰게 되면서 Rolldown이 이들을 공유 청크로 나눴습니다. 청크를 나눈 만큼 오버헤드가 붙었습니다.
- **첫 빌드는 `/compare` 114.04KB로 실패**했습니다. 조치는 두 가지입니다.
  1. 새 아이콘 5종이 data URI로 인라인되어 `Icon`의 eager glob을 타고 공통 청크에 들어갔습니다(+1.6KB, 모든 라우트). `vite.config.ts`에서 **이 5종만** 인라인하지 않도록 했습니다(`assetsInlineLimit` 함수형). 브라우저에서 마스크 URL(`/assets/check-*.svg`)이 렌더되는 것을 확인했습니다.
  2. 도메인 엔진(선택 규칙·초안·대비·zod·자동 저장기·알림 문구)을 `boardEngine.ts`로 묶었습니다. 이 엔진을 데이터 조회와 **함께 동적 로드**합니다. 같은 모듈을 메모리 저장소 청크도 정적으로 쓰므로, 어차피 데이터와 함께 내려오는 코드입니다. 화면은 도착 전까지 S-01(로딩)을 보여 줍니다.
- **투명성**: 사용자가 `/compare` 진입 직후 실제로 받는 합계는 **120.51KB**입니다. 스크립트 참고 출력에 엔진·저장소·비교 픽스처를 더했습니다. 예산 판정 기준(정적 합계)은 바꾸지 않았고 예산 값도 올리지 않았습니다.
- 아코디언을 lazy로 두면 Rolldown이 `jsx-runtime`을 별도 청크로 떼어 공통 청크가 +0.5KB(모든 라우트) 늘었습니다. 그래서 정적 import로 두었습니다.

## 반응형 스크린샷 (ego-browser · `vite preview --host 127.0.0.1` · 확인 후 서버 종료, LISTEN 0 확인)
- `dev/active/m1-ui-03b/screens/1280-6cols.png`: 6열
  - 표만 가로로 스크롤되고, 행 머리글은 `sticky`입니다.
  - 초안 패널이 보이고 `sticky`입니다.
  - 문서 가로 넘침 0, 제목 "비교 보드 · Design Studio"
- `screens/768-3cols.png`: 표 + 하단 요약 바, 넘침 0
- `screens/390-3cols.png`: 아코디언(표 없음), 처음에는 "Hero 구성 · A 선택됨"만 펼쳐져 있습니다. 요약 바가 있고 넘침 0입니다.
- 진입은 카탈로그에서 6개를 추가한 뒤 트레이 → `/compare`로 했습니다. 이후 3개를 빼고 768·390을 확인했습니다.

## Codex 결과 (`review --scope branch --base main`)
- **R1**: P1 1건 · P2 2건을 모두 반영했습니다(5297948).
  1. [P1] 확정 실패 안내의 "다시 시도"가 실패 당시 상태로 확정 가능 여부를 검사했습니다. 이제 최신 핸들러(ref)로 현재 saver 상태를 다시 검사합니다.
  2. [P2] 카탈로그 추가·빼기 직후 진입하면, 진행 중인 트레이 요청보다 먼저 보드를 조회했습니다. 이제 컨텍스트 `whenIdle()` 뒤에 조회합니다.
  3. [P2] 저장 중 열을 빼면, 앞 저장이 STALE로 서버 선택에 맞춘 결과를 옛 로컬 선택으로 덮었습니다. 이제 대기 뒤 saver 상태가 STALE이면 서버 선택을 기준으로 뺍니다.
- R2는 실행하지 않았습니다(턴 한도). 다음 작업자가 `review --scope branch --base main`으로 R2를 돌리고, 위 3건의 회귀 테스트를 추가하기를 권합니다.

## SPEC·기존과 다르게 한 부분 (사유)
- **트레이 컨텍스트 최소 확장**: `repository`·`loaded`·`sync`·`takeReleasedNotices`·`whenIdle`
  - 메모리 `getBoard()`는 자동 해제 안내를 한 번만 줍니다. 트레이의 진입 조회가 먼저 받으면 AC-15 안내가 사라지므로 컨텍스트가 보관합니다.
  - 화면의 저장 결과를 트레이에도 반영합니다.
- **S-08 결정**: 카탈로그에서 뺀 열의 해제 안내는 **돌아왔을 때 한 번** 보여 줍니다(SPEC 1.3 그대로). 문구는 `removeReference`의 서버 응답에서 가져옵니다. 트레이의 선택 값은 최신이 아닐 수 있기 때문입니다.
- **열 빼기**: 앞 저장이 끝난 뒤 빼고, 그 응답의 revision으로 자동 저장기를 다시 만듭니다. 그러지 않으면 다음 선택이 STALE로 조용히 버려집니다.
- **D1**(`comparisonCells#fontCell`): 허용 목록 밖 폰트는 `binding:null` + `unavailableReason:"license"`로 처리합니다. 라벨에 "· 라이선스 확인 중"을 붙입니다.
  - AC-26과 같은 경로라 선택·전부 선택·저장·확정이 모두 같은 판정을 씁니다.
  - 타입 `unavailableReason`에 `"license"`를 추가했습니다.
- **`profileDraft#itemOf`**: Hero가 있는데 기준 레퍼런스에도 값이 없는 행이 "Hero를 먼저 고르세요"로 보였습니다. 폰트 행은 이제 "Pretendard 700 / 400"을 보여 줍니다. 확정 값과 같은 기본값입니다. 다른 행은 "없음"을 보여 줍니다.
- **D2**: Footer 항목 안내는 셀의 `hasBusinessInfo === false`와 라이브러리의 `businessInfoVariant`로 판정합니다. R-12 경고의 `fixes`로 판정하지 않습니다. C 대체안이 있어도 확정 시 자동 교체되기 때문입니다.
- **반응형**: 표와 아코디언을 CSS로 숨기지 않고 `matchMedia`로 하나만 렌더합니다. 둘 다 렌더하면 선택 버튼이 두 벌 생겨 Tab·보조기기에 중복으로 잡힙니다.
- **스크롤 컨테이너**: 3열 이상이면 포커스를 받습니다(SPEC 5.1은 5열 이상). 768~1279에서는 3열부터 스크롤되기 때문입니다.
- **미구현**: 오른쪽 끝 넘침 그림자(SPEC 5.1)는 구현하지 않았습니다. 가로 스크롤 여부는 머리글 잘림과 `aria-label`로 알 수 있습니다. QA 확인 대상입니다.
- **aria-disabled 스타일**: "레퍼런스 추가"(6개 가득 참)는 `aria-disabled`인데도 시각적으로 비활성처럼 보이지 않습니다. 확정 버튼에는 비활성 스타일을 적용했습니다. QA 확인 대상입니다.
- **v1 확정 후 선택 변경 없이 다시 확정**: 막지 않습니다. 새 규칙을 만들지 않기 위해서이며, 그러면 같은 내용의 v2가 생깁니다. 아래 질문 2에 적었습니다.
- **기존 테스트 변경 2건(의도)**
  1. `boardInput.test.ts`의 폰트 테스트를 "3종 모두 활성"으로 바꿨습니다(ADR-005 D1-갱신, 브리프 지시).
  2. `CatalogPage.test.tsx`의 자리표시 each에서 `/compare`를 `/profile/profile-1`로 바꿨습니다. `/compare`가 실제 화면이 됐기 때문이며, 테스트 개수는 그대로입니다.
- **라우트 추가**: `/profile/:profileId` 자리표시(확정 뒤 이동 대상).
- **`LoadingState`**에 `label` prop을 추가했습니다("비교 보드를 불러오는 중…").

## QA에 넘길 것
- AC-21 뷰포트 캡처를 정식으로 판정해 주세요(1280 6개 / 768 3개 / 390 3개). 참고 캡처는 `screens/`에 있습니다.
- 대비(A-10) 실측 대상:
  - 흐린 셀(회수)
  - "기본값" 라벨(`--label-alternative`)
  - 요약 바 텍스트
- 스크린리더로 확인할 것:
  - 알림 영역(`role=status` "선택 알림")이 선택·빼기·비우기를 읽는지
  - 확정 실패 안내만 `alert`로 읽는지
- 넘침 그림자 부재와 "레퍼런스 추가" `aria-disabled` 시각 표시를 확인해 주세요.

## 질문
1. **번들 기준**: 데이터 청크와 함께 내려오는 도메인 엔진(로직)도 ADR-005 D3처럼 예산 밖으로 볼까요?
   - 현재 정적 합계는 99.93KB로 여유가 0.07KB입니다. 실제 진입 합계는 120.51KB입니다.
   - 다음 변경이 조금만 늘어도 빌드가 실패합니다. `/compare` 전용 예산, 또는 D3 확장 결정이 필요합니다.
2. v1을 확정한 뒤 선택을 바꾸지 않고 다시 확정하면 같은 내용의 v2가 생깁니다. 막아야 하나요? 막는 것은 새 규칙이라 적용하지 않았습니다.
3. `addToTray`·`removeFromTray`를 테스트와 함께 지워도 될까요? 지우면 테스트 수가 줄어듭니다.

## 커밋
```
5297948 fix: Codex R1 — 확정 재시도는 최신 상태로 검사, 트레이 변경 완료 뒤 보드 조회, 열 빼기 전 STALE 동기화 선택 보존
ec9c07f feat: 비교 보드 반응형 — 768~1279 하단 요약 바, 768 미만 항목 아코디언, 뷰포트별 단일 트리 (M1-UI-03b 5)
1774465 feat: 비교 보드 화면 /compare — 상태 S-01~S-17·자동 저장·확정 흐름, 보드 엔진 지연 로드로 번들 예산 유지 (M1-UI-03b 4·6)
4338c21 feat: 초안 패널·사용자 스타일 입력, 폰트 3종 활성·목록 밖 폰트 선택 불가(D1)·Footer 미리 알림(D2) (M1-UI-03b 3)
56561c9 feat: 비교 표·열 머리글·선택 버튼, 가로 전용 roving (M1-UI-03b 2)
57e2b03 feat: DS Callout + 아이콘 5종 복사 (M1-UI-03b 1)
```
(REPORT 커밋은 위 목록 다음입니다.)

## 보완(FIX-R1)
브리프: `FIX-R1_BRIEF.md`(2026-09-26, 결정 Q1~Q3 = 위 질문 1~3). Codex 재리뷰는 브리프대로 하지 않았습니다(Jarvis 수행).

### 항목별 결과
| # | 항목 | 결과 | 커밋 |
|---|---|---|---|
| 1 | Codex R1 수정 3건 회귀 테스트 (`CompareBoardPage.test.tsx` "Codex R1 회귀") | 완료 | `66b0516` |
| 2 | 번들: 진입 직후 자동 로드 포함 합계 ≤ 125KB를 실패 조건으로 + ADR-004 표에 개정 행 | 완료 | `b0c0de4` |
| 3 | v1 확정 후 바뀐 내용 없는 재확정 차단 (S-15·S-16) | 완료 | `d830863` |
| 4 | `addToTray`·`removeFromTray`와 전용 테스트 삭제 | 완료 | `b0e6d70` |
| 5 | 가득 찬 "레퍼런스 추가" 비활성 표시 | 완료 | `454c9d5` |

### RED 출력 (수정을 한 줄씩 되돌려 확인 → `git checkout`으로 원복 → GREEN)
1. P1 재시도 `latestConfirm` → `void confirm()`: `AssertionError: expected "confirmProfile" to be called 1 times, but got 2 times`
2. P2 `whenIdle().then(getBoard)` → `getBoard()`: `TestingLibraryElementError: Unable to find role="table" and name "레퍼런스 4개, 비교 항목 12개"`
3. P2 STALE 기준 → 항상 옛 로컬 선택: `expect(element).toHaveAttribute("aria-pressed", "true")` 실패 (서버 선택 Hero=C가 사라짐)
4. 번들 한도 120 임시: `[bundle] 예산 검사 실패 — /compare: 진입 직후 자동 로드 포함 120.51KB > 120KB` · exit 1 (125 원복 → exit 0)
5. (+α) 재확정 차단 테스트 2건(구현 전): `toHaveAttribute("aria-disabled", "true")` 실패 · `toHaveAccessibleDescription()` 실패
6. (+α) 추가 버튼 비활성 스타일(구현 전): `AssertionError: expected [] to deeply equal [ …(3) ]`

### 번들 (최종 빌드, gzip)
| 라우트 | 첫 화면 합계 / 100KB | 진입 직후 자동 로드 포함 / 125KB |
|---|---|---|
| `/catalog` | 97.98 | 100.36 |
| `/references/:id` | 95.64 | 98.02 |
| `/compare` | **99.98** | **120.64** |
| 자리표시 | 89.40 | 91.79 |
- `/compare` 첫 화면 여유가 **0.02KB**입니다(항목 3의 훅 판정 +0.04, 항목 5의 클래스 +0.01). 다음 변경은 첫 화면에서 무언가를 빼야 들어갑니다.

### 테스트 수 변화
305 → 308(+3, 항목 1) → 310(+2, 항목 3) → 304(−6, 항목 4 삭제) → **305**(+1, 항목 5). 파일 35개 그대로.

### 설계 메모·범위
- 항목 3: `ConfirmedRef`에 확정 시점 `picks`·`custom` 스냅샷을 **선택 필드로 추가**했습니다(API 계약 추가 — 백엔드 결정 시 `board.confirmed`에 같은 값이 필요). 스냅샷이 없으면 revision 비교로 대신합니다. 판정(`unchangedSinceConfirm`, `sameIntent` 깊은 비교)은 엔진 청크에 두고 버튼 표시·`confirm()` 둘 다 같은 판정을 씁니다. B→A로 되돌려 같아지면 태그도 "v1 확정됨"으로 돌아갑니다.
- 항목 3의 기존 테스트 변경 1건(의도): `memoryCompareBoardRepository.test.ts` AC-25의 `confirmed` 기대값에 스냅샷 추가.
- 항목 3은 화면 게이트만입니다. 메모리 저장소(서버 역할)는 같은 내용의 새 버전 요청을 거부하지 않습니다 — 서버 측 거부가 필요하면 별건.
- 항목 2: ADR-004 결정 표에 "2026-09-26 개정" 행 1줄을 더했습니다.
- 검증: `npm run typecheck && npm run lint && npm test -- --run && npm run build` 모두 통과(305 passed, build exit 0).
- 브라우저 확인 없음(브리프: 불필요).
