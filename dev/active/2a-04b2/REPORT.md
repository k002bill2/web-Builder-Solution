# 2A-04b2 REPORT — 프로필 조정 컨트롤 · 조정 저장 · 보정값 쓰기 · 이름표 · 2단 배치 · 보드 요약 바 조정 개수

- 브리프 `docs/06-handoff/2A-04b2_DEVELOPER_BRIEF.md` · SPEC `docs/design/2a-04/SPEC.md` r6 · 기준 `c75a2da` · 작성 2026-09-26
- 근거 수준: 번들·테스트·스모크 수치 = L1(실측 로그 `logs/`) · "조정 본문을 자동으로 넣었을 때 126.5KB" = L2(청크 크기 합산, 빌드 안 함)

## 0. 요약
| 항목 | 결과 |
|---|---|
| 검증 4종 | typecheck 0 · lint 0 · build 0(예산 통과) · test **700/700** (`logs/final-{typecheck,lint,build}.txt`) |
| 전체 5회 연속 | **700/700 × 5** (`logs/final-run1~5.txt`, `final-runs-summary.txt`) |
| 번들 | 모든 시나리오 여유 ≥ 0.40KB — 멈춤 기준(0.3) 위, 예산 상수 변경 없음 (3절) |
| 스모크 | 127.0.0.1:5199 ego-browser: 보드 확정 → 프로필 → 촘촘·강화 → 보정값 쓰기 2건 → 조정 저장 v2 → 보드(1024) 요약 바 "조정 4개". 서버 종료 확인 (7절) |
| Codex | `review --wait --scope branch --base c75a2da` 1회 — 8절 |
| 범위 밖으로 넘김 | P-AC-14의 "3안 만들기 `aria-disabled`" 부분 → 2a-04c(3안 버튼이 아직 없어 만들지 않음, 브리프 1-10) |

## 1. 커밋
| 해시 | 내용 |
|---|---|
| `f5a9d84` | 배선: deferred 래퍼·`ProfileRepositoryContext`·`AppProviders`·`renderApp` → `ProfileRepository`(`getAdjustmentRange`·`saveAdjustments` 위임), `ProfileReadRepository` 삭제 |
| `b653f45` | `SegmentedControl` 옵션별 `disabled` + 그룹 설명 캡션(`aria-describedby`), roving 건너뜀 |
| `0ebdb5e` | 전역 조정·조정 저장(P-S10~S13)·보정값 쓰기·적용값 표시·이름표(Q2)·h2·2단 배치(Q5)·계측 |
| `b897f50` | 보드 <1280 요약 바 "조정 N개"(Q7) · 번들 분류 근거 가드 테스트 · 스크립트 주석 |
| `1a8258c` | 최종 검증 로그·스모크 캡처 |
| (이 커밋) | REPORT + Codex 원문 |

## 2. 파일 변경 요약
- 새 파일
  - `features/profile/ProfilePanel.tsx` — 값·팔레트·조정·버전 배치 + 저장 안 된 조정(초안) 상태. 엔진 청크.
  - `features/profile/AdjustmentPanel.tsx` — 4그룹 라디오·P-S13 Callout·저장/취소·실패 알림. 엔진 청크.
  - `features/profile/adjustmentDraft.ts` — 초안 순수 함수(보이는 값·편집·개수·범위 밖·맞추기 값).
  - `domain/elementLibrary.ts` — Q2 요소 이름표(CTA 위치·이미지 비율·모바일 구조·카드 스타일).
  - `domain/effectiveProfile.ts` — `effectiveProfile`·`normalizeAdjustments`·`adjustmentCount`를 `profileAdjustments.ts`에서 옮김(그 파일은 다시 내보냄).
- 수정
  - `SegmentedControl.tsx` — `disabled`·`description`, 모두 비활성이면 그룹 `aria-disabled`, `flex-wrap`.
  - `PaletteContrast.tsx` — "보정값 쓰기 (역할)" 버튼, 쓴 뒤 "보정값을 썼습니다"(aria-disabled, 포커스 유지), 견본 "조정됨 · 보드 값 #…".
  - `ProfileValues.tsx` — 행을 엔진(`valueRows`)에서 받는다.
  - `profileFields.ts` — 이름표 인자(`labels`), 있으면 이름표 + 키 캡션.
  - `profileDiff.ts` — `valueRows`·`diffVersions`·`summarizeVersions`(적용된 값 + 대비·사이트 목적 행).
  - `profileMessages.ts` — `contrastView(검사 팔레트, …, base, written)`, `saveMessages`.
  - `useProfileDetail.ts` — 진입 때 `getAdjustmentRange`, `save`(저장 중·실패·STALE·멱등 재시도), 계측.
  - `ProfilePage.tsx` — 1280 2단 격자 + 3안 자리(h2 "3안" + 안내 한 줄), 패널은 엔진 컴포넌트.
  - `domain/profile.ts` — `DEFAULT_ADJUSTMENT_RANGE` 상수를 여기로(`adjustmentSchema`는 다시 내보냄).
  - `memoryProfileRepository.ts` — `getAdjustmentRange`가 쓰기 본문을 받지 않음.
  - `DraftSummaryBar.tsx`·`CompareBoardPage.tsx` — `adjustmentCount`(= `board.carryOver.count`).
  - `scripts/check-bundle-size.mjs` — 주석(호출 지점)만. 예산 상수·시나리오 목록 무변경.
- 테스트 수 666 → **700**(+34): `ProfileAdjust.test.tsx` 19 · `SegmentedControl.test.tsx` 6 · `adjustmentDraft.test.ts` 4 · `CompareBoardSummaryAdjust.test.tsx` 3 · `deferredProfileRepository.test.ts` 1 · `WriteBodyLoad.test.tsx` +1.

## 3. 번들 (gzip KB, 첫 화면 / 진입 직후 — `logs/bundle-*.txt`, `final-build.txt`)
| 시나리오 | 기준 `c75a2da` | ① 배선 | ③ 조정 화면(첫 구현) | ③′ 범위 상수·적용값 분리 | **최종**(+Q7) | 여유(최종) |
|---|---|---|---|---|---|---|
| 공통 | 89.02 | 89.05 | 89.06 | 89.06 | **89.06** | — |
| /catalog | 99.02 / 101.40 | 99.05 / 101.43 | 99.36 / 101.74 | 99.35 / 101.73 | **99.36 / 101.74** | 0.64 / 23.26 |
| /references/:id | 96.37 / 98.75 | 96.40 / 98.78 | 96.71 / 99.09 | 96.70 / 99.08 | **96.71 / 99.09** | 3.29 / 25.91 |
| /compare | 99.48 / 124.43 | 99.52 / 124.46 | (빌드 실패 — 스크립트 키 누락) | 99.56 / 124.54 | **99.60 / 124.58** | **0.40 / 0.42** |
| /compare (조정 있음) | 99.48 / 124.43 | 99.52 / 124.46 | 〃 | 99.56 / 124.54 | **99.60 / 124.58** | 0.40 / 0.42 |
| /profile | 99.18 / 118.79 | 99.21 / 118.82 | 99.22 / 124.76 | 99.22 / 124.51 | **99.23 / 124.52** | 0.77 / **0.48** |
| /studio | 89.46 / 91.84 | 89.49 / 91.87 | 89.50 / 91.89 | 89.50 / 91.88 | **89.50 / 91.89** | — |

- **공통 증가 +0.04**: P-B2 배선(deferred 래퍼 메서드 2개 위임) +0.03 · `domain/profile.ts`가 런타임 상수(기본 범위)를 갖게 되며 +0.01.
- **`/compare` +0.12 / +0.15** (브리프 "늘지 않게"는 못 지켰다 — 설계 질문 1):
  - 배선(공통) +0.04 / +0.03 · Q7 인라인 한 줄 +0.04 / +0.04.
  - 나머지 +0.04 / +0.08: 프로필 엔진이 `SegmentedControl`을 쓰게 되자 `rovingFocus`가 새 공유 청크(0.19)로 떨어진 경계 비용(`compareTray` 0.36 → 0.19) + `memoryStudio` 청크의 기본 범위 상수. 청크 설정(manualChunks)은 바꾸지 않았다.
- **`SegmentedControl` 공유 청크 0.75 → 1.02(+0.27)** — P-B7대로 `/catalog`·`/references/:id` 첫 화면 +0.31. `/catalog` 여유 0.64.
- **`/profile` 진입 직후 +5.7**: 엔진 청크 1.52 → 5.62(조정 패널·초안·팔레트 이동·이름표·문구) + `SegmentedControl`·`rovingFocus`·`effectiveProfile` 청크.
  - 첫 구현은 124.76이었다. 여기에 쓰기 본문(`memoryProfileAdjust` 1.74)을 자동으로 넣으면 **약 126.5 > 125**(L2)라, 브리프 안의 "자동 분류" 경로를 그대로 따를 수 없었다.
  - 해결: 기본 범위 상수를 `domain/profile.ts`로 옮겨 `getAdjustmentRange`가 쓰기 본문을 받지 않게 했다(→ 본문은 조작 뒤 그대로) + 엔진이 이어받기 규칙 없이 `effectiveProfile`만 받게 분리(`profileAdjustments` 청크 병합으로 생긴 `/compare` 스크립트 키 누락도 이것으로 해소). 124.76 → 124.51.
- **번들 스크립트 분류**: `/profile`은 진입 때 `getAdjustmentRange`를 **자동 호출한다**. 다만 본문 청크를 받지 않으므로 `memoryProfileAdjust`는 `afterAction`(조정 저장·다시 시도·되돌리기 onClick) 그대로 두고 주석에 호출 지점을 적었다. 근거는 가드 테스트 `WriteBodyLoad.test.tsx` "2a-04b2 번들 분류 근거"(진입 때 본문 요청 0 → 저장 클릭 뒤 1회)가 고정한다 — Red-Green 확인(`logs/red-8-range-guard.txt`).
- **Q-F3-2 되돌리기 청크 분리 판단**: 나누지 않는다. `/profile`에서 쓰기 본문은 여전히 조작 뒤이고(진입 직후 합계 0), 되돌리기와 조정 저장이 같은 화면의 조작이라 나누면 로더 경계만 는다. 조작 뒤 크기 +1.74KB.
- 아이콘 파일 추가 0 · 새 의존성 0 · 예산 상수 무변경.

## 4. RED 로그 (`logs/`)
| 단계 | 파일 | 실패 내용 |
|---|---|---|
| 1 배선 | `red-1-wiring.txt` | `repo.getAdjustmentRange is not a function` + TS2739(`ProfileReadRepository`에 두 메서드 없음) |
| 2 SegmentedControl | `red-2-segmented.txt` | 5/6 실패 — `aria-disabled` 없음, 비활성 건너뛰지 않음, 설명 캡션 없음 |
| 3 조정 화면 | `red-3-adjust.txt` | 19/19 실패(라디오 그룹·h2 "전역 조정" 없음 등) |
| 3 초안 함수 | `red-3b-draft.txt` | 모듈 없음 |
| 6 Q7 | `red-6-q7.txt` | 2 실패(요약 바에 "조정 2개" 없음), 조정 0 케이스 1 통과(원래 없음) |
| 8 분류 가드 | `red-8-range-guard.txt` | 구현을 되돌리면 `expected "vi.fn()" to not be called … called 1 times` → 복원 후 통과 |

## 5. P-AC별 테스트 이름
- `app/src/pages/ProfileAdjust.test.tsx`
  - **P-AC-12**: "h2 '전역 조정' 아래 밀도·대비·모션·사이트 목적 radiogroup, 보이는 글자가 값, 그룹당 Tab 정지 1" · "방향키·Home/End로 이동하며 고른다"
  - **P-AC-13**(화면): "모션 L3 옵션 없음 + 캡션 …" · "좁은 range 주입 → 범위 밖 옵션 aria-disabled + 그룹 설명 '촘촘: 이 테마에서 쓸 수 없음', roving에서 건너뜀" · "이어받은 값이 범위 밖 → 그 그룹에 Callout(cautionary = warning 톤) + '맞추기' → …"(저장소 RANGE_VIOLATION은 b1 `profileAdjust.test.ts` P-AC-13(저장소) 그대로)
  - **P-AC-14**(3안 버튼 부분 제외): "바꾸면 '저장하지 않은 조정 N개' + '조정 저장 (v2)' 활성, 취소하면 원래 값 · 캡션 없음 · 포커스는 저장 버튼"
  - **P-AC-15** · **37**: "밀도 촘촘 + 모션 덮어쓰기 저장 → v2(origin adjust) · 간격 96 → 72 · 캡션 '조정됨 · 보드 값 …' · 알림 'v2로 저장했습니다' · profile_saved 1회"
  - **P-AC-16** · **37**: "저장 중 연타해도 요청 1회(aria-busy '저장 중…')" · "요청 실패 → role=alert … · profile_save_failed 1회 → '다시 시도' → v2" · "응답 실패(커밋 뒤) → 같은 인자 재시도는 멱등 결과 'v2로 저장했습니다', 버전 +1만, STALE 문장 0"
  - **P-AC-17**: "화면이 v1을 본 뒤 다른 탭이 v2를 만들면 저장 거부 → 최신 반영('조정 저장 (v3)') + 조정 유지 + 문장 → 다시 저장하면 v3"
  - **P-AC-18**: "ref-a muted '보정값 쓰기' → … 저장하면 적용된 팔레트 = 보정값, C-5 '통과'" · "ref-b(어두운 카드): ink는 충돌이라 버튼 없음(P-S15) · muted만 '보정값 쓰기'"
  - **P-AC-19**: "ref-a: 강화를 고르면 목표 7.0:1, primary·muted 제안 = 강화 열, 보정값 쓰기 + 저장 → 두 검사 통과" · "ref-e: 강화면 ink 제안 = 강화 열"
  - **P-AC-20**(화면): "v2 조정(촘촘) 뒤 보드에서 Hero를 바꿔 재확정 → v3에 촘촘 이어짐, 좁은 범위면 P-S13 Callout"(+ 버전 요약 = 적용된 값 차이)
  - **P-AC-08 유지**: "?v=1 → 4그룹 aria-disabled, 이유 '이전 버전은 바꿀 수 없습니다'(그룹 설명), 눌러도 바뀌지 않음, 보정값 쓰기도 aria-disabled"(기존 `ProfilePage.test.tsx` P-AC-08도 그대로 통과)
  - **Q2**: "CTA 위치·카드 스타일·이미지 비율·모바일 구조 = 요소 라이브러리 이름표, 키는 캡션"
  - **Q5 · P-AC-32(DOM·클래스) · 33**: "1280 2단(프로필 패널 + 3안 자리) · 1024 패널 안 2열 · DOM 순서 = 값 → 팔레트 → 조정 → 버전 → 3안, disabled 속성 0"
- `app/src/components/ds/SegmentedControl.test.tsx`(P-AC-13·33): 6건 — aria-disabled·클릭 무시 / 방향키·Home/End 건너뜀 / 설명 캡션 describedby / 선택값 비활성 → 첫 활성 옵션이 Tab 정지 / 모두 비활성 → 그룹 aria-disabled / 확장 없으면 지금과 같음
- `app/src/features/profile/adjustmentDraft.test.ts`: 4건(기본값 = 키 삭제, 개수 단위, 보정 교체, 맞추기 값)
- **Q7** `app/src/pages/CompareBoardSummaryAdjust.test.tsx`: "1024px·390px: 확정 프로필에 조정 2개 → 요약 바 '조정 2개'" · "조정 0개면 요약 바에 조정 글자 없음"
- 배선 `app/src/data/deferredProfileRepository.test.ts` · 분류 가드 `app/src/pages/WriteBodyLoad.test.tsx` "2a-04b2 번들 분류 근거 — …"
- **P-AC-34**: 기존 가드(`noHardcodedStyle`·`tokenUsage` 등) 통과. 새 UI는 v2 토큰만 쓰고, 프로필 색은 `aria-hidden` 견본에만 칠한다(기존 P-AC-33·34 테스트 통과). 상태 글자: "저장하지 않은 조정 N개"·"조정됨"·"이 테마에서 쓸 수 없음"·"보정값을 썼습니다".
- **P-AC-35·36**: 3절 · 0절.

## 6. 고친 기존 단언
- `app/src/pages/ProfilePage.test.tsx` P-AC-05·06 ref-b 테스트 마지막 줄 1곳: `queryByRole("button", { name: /보정값 쓰기/ })` 없음 → `/보정값 쓰기 \(본문 글자 ink\)/` 없음.
  - 이유: SPEC 10.0.1 Q6 결정으로 충돌이 아닌 muted에 "보정값 쓰기"가 생겼다. 원래 의도(충돌인 ink에는 버튼 없음)는 유지했다.
  - **SPEC 9절 표 밖**이다(9절 작성 뒤 Q6 결정). 설계 질문 2.
- 그 밖의 기존 테스트 수정 0. (`ProfileAdjust.test.tsx`의 P-AC-20 요약 단언 1줄은 이번 새 파일 안 수정이다.)

## 7. 스모크 (127.0.0.1:5199, ego-browser, TaskSpace 24 — 끝나고 `finish`)
1. 카탈로그에서 모던 카페 브랜드·프리미엄 헤어살롱 비교 추가 → "비교 보드 열기" → Hero A → "프로필 확정 (v1)" → `/profile/profile-1`.
2. 밀도 촘촘 · 대비 강화 → "보정값 쓰기 (대표색 primary)"·"(보조 글자 muted)" → "저장하지 않은 조정 4개" → "조정 저장 (v2)".
3. 결과: 알림 "v2로 저장했습니다", "v2 · 현재", 목표 7.0:1, C-1 7.0·C-2 13.9·C-4 11.6·C-5 7.0 모두 "통과", 간격 "섹션 간격 72" + "조정됨 · 보드 값 96".
4. 폭별(CDP `setDeviceMetricsOverride`): `scrollWidth − innerWidth` = −15(스크롤바 폭, 가로 넘침 0) — 1920·1024·768·390 모두. 격자 열 수: 1920 = 2단·패널 1열 / 1024 = 1단·패널 2열 / 768·390 = 1열.
5. "비교 보드에서 선택 바꾸기"로 보드 복귀(1024) → 요약 바 "초안 1/10 · 조정 4개", 초안 패널 캡션 "이 프로필에 조정 4개가 있습니다".
6. 스크린샷: `smoke/profile-1280.png`(전체 페이지) · `smoke/profile-390.png`(라디오 그룹 줄바꿈·넘침 없음 확인) · `smoke/compare-1024-summary.png`.
7. 서버 종료: `lsof -iTCP:5199 -sTCP:LISTEN` 결과 없음.

## 8. Codex 결과
- `node codex-companion.mjs review --wait --scope branch --base c75a2da` 1회. 원문 `logs/codex-review.txt`. 결과는 아래 8.1(이 REPORT 커밋 뒤 갱신).

## 9. 구현 중 정한 것 (ADR-003 한 줄 기록)
- **기본값 선택 = 키 삭제**: 여유·기본 AA·보드 모션·정하지 않음을 고르면 그 조정 키를 지운다("조정 = 보드 값과 다른 것"). 개수 N = 보이는 값이 저장값과 다른 키 + 보정 항목. 저장값과 같은 값으로 되돌리면 그 편집은 사라진다.
- **대비 검사·제안은 초안을 따른다**: 강화를 고르면 저장 전에도 목표 7.0으로 검사하고 제안한다(스모크 흐름·P-AC-19). 제안은 보정 전 base 팔레트에서 계산한다(저장소의 보정 `from` 검사와 맞음). 견본·값 목록은 저장된 적용값(3.1).
- **P-S13 Callout 톤**: `Callout`에 `cautionary`가 없어 `warning`(cautionary 면 토큰)을 썼다.
- **P-S13 문구**: SPEC 예문 "'보통'으로 맞추기"의 '보통'은 밀도 옵션에 없다 → 실제 허용 값 라벨("'여유'로 맞추기")로 썼다(설계 질문 3).
- **조정 저장 버튼은 늘 보인다**: 바꾼 조정이 없으면 `aria-disabled` + "바꾼 조정이 없습니다"(저장 뒤 포커스가 사라지지 않게). "조정 취소" 뒤 포커스 → 저장 버튼, "맞추기" 뒤 → 그 그룹 라디오.
- **이름표 원천**: 보드 비교 픽스처 라벨을 참고해 `domain/elementLibrary.ts`에 새로 정했다. 이미지 비율은 "가로형 16:9"처럼 형태를 붙였고, 카드는 px 대신 "모서리 큼/보통"으로 적었다.
- **h2 "전역 조정"**: SPEC 3.1과 같다. v2 목업 원본(`design/`)은 이번에 다시 대조하지 않았다.
- **3안 자리 안내 문구**: "저장한 버전으로 구조안 3개를 만드는 기능은 준비 중입니다"(내부 단계 번호를 화면에 쓰지 않음).
- **`SegmentedControl` `flex-wrap`**: 390에서 목적 4개가 넘치지 않게 모든 사용처에 넣었다. 넘치지 않을 때는 모양이 같다.

## 10. 남은 위험
- `/compare` 여유 0.40 / 0.42, `/profile` 진입 직후 여유 0.48. 2a-04c(생성 메모리 구현·3안 카드)는 `/profile` 진입 직후에 붙으면 0.48을 넘기 쉽다 — 생성 본문은 처음 쓸 때 동적 import가 필요하다.
- 값 목록·비교 행에 이름표(Q2)가 들어가 버전 요약 문장에 이름표 텍스트가 나온다. 이름표를 바꾸면 요약이 달라진다(저장값과는 무관).
- STALE 뒤 최신 base 팔레트가 바뀌었으면, 초안에 남긴 보정의 `from`이 새 base와 달라 저장이 `SCHEMA_INVALID`("저장하지 못했습니다")로 끝난다. 사용자는 "조정 취소" 후 다시 써야 한다(이 경우만의 전용 문장은 없음).
- 조정 저장 성공 뒤 범위 재조회가 실패하면 이전 범위를 쓴다(저장은 끝났으므로 오류로 보지 않음).
- 보정 두 개 조합의 새 대비 미달(10.0.2 Q3)은 그대로다.

## 11. 설계 질문
1. **`/compare` 증가 +0.12 / +0.15**(3절 내역): 브리프 "늘지 않게"를 못 지켰다. 여유 0.40 / 0.42로 멈춤선(0.3) 위다. 이대로 받을지, `rovingFocus` 공유 청크 경계(약 +0.04)를 청크 설정으로 없앨지 결정 필요.
2. **기존 P-AC-06 단언 변경**(6절, SPEC 9절 표 밖): Q6으로 muted 버튼이 생겨 단언을 ink로 좁혔다. 승인 필요.
3. **P-S13 예문 '보통'**: SPEC 2.2 P-S13 문장을 "'여유'로 맞추기"(허용 값 라벨)로 고칠지.
4. **범위 조회와 쓰기 본문 분리**(3절): 브리프는 "진입 때 자동 호출하면 본문 청크를 자동으로 분류"였다. 자동으로 넣으면 126.5KB로 초과라, 범위 조회가 본문을 받지 않게 바꿔 본문은 조작 뒤로 남겼다. 이 방식을 SPEC P-B9·7절에 적을지.
5. **대비·사이트 목적만 바꾼 버전의 요약**: 적용값에 없는 두 조정을 비교·요약 행("대비"·"사이트 목적")으로 더했다. 비교 표에도 두 줄이 는다. SPEC 3.5에 반영할지.
6. **`summarizeVersion`(기존, base 기준)**: 화면은 이제 `summarizeVersions`(적용값)를 쓰고, 기존 함수는 `profileDiff.test.ts`만 쓴다. 지울지(테스트도 옮겨야 함) 유지할지.
