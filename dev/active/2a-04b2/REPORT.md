# 2A-04b2 REPORT — 프로필 조정 컨트롤 · 조정 저장 · 보정값 쓰기 · 이름표 · 2단 배치 · 보드 요약 바 조정 개수

- 브리프 `docs/06-handoff/2A-04b2_DEVELOPER_BRIEF.md` · SPEC `docs/design/2a-04/SPEC.md` r6 · 기준 `c75a2da` · 작성 2026-09-26
- 근거 수준: 번들·테스트·스모크 수치 = L1(실측 로그 `logs/`) · "조정 본문을 자동으로 넣었을 때 126.5KB" = L2(청크 크기 합산, 빌드 안 함)

## 0. 요약
| 항목 | 결과 |
|---|---|
| 검증 4종 | typecheck 0 · lint 0 · build 0(예산 통과) · test **701/701** (`logs/final-{typecheck,lint,build}.txt`, Codex P2 반영 뒤 재실행) |
| 전체 5회 연속 | **701/701 × 5** (`logs/final-run1~5.txt`, `final-runs-summary.txt`) |
| 번들 | 모든 시나리오 여유 ≥ 0.40KB(최종 = Codex P2 반영 뒤 `final-build.txt`) — 멈춤 기준(0.3) 위, 예산 상수 변경 없음 (3절) |
| 스모크 | 127.0.0.1:5199 ego-browser: 보드 확정 → 프로필 → 촘촘·강화 → 보정값 쓰기 2건 → 조정 저장 v2 → 보드(1024) 요약 바 "조정 4개". 서버 종료 확인 (7절) |
| Codex | `review --wait --scope branch --base c75a2da` 1회 — P2 1건, 반영함(8절) |
| 범위 밖으로 넘김 | P-AC-14의 "3안 만들기 `aria-disabled`" 부분 → 2a-04c(3안 버튼이 아직 없어 만들지 않음, 브리프 1-10) |

## 1. 커밋
| 해시 | 내용 |
|---|---|
| `f5a9d84` | 배선: deferred 래퍼·`ProfileRepositoryContext`·`AppProviders`·`renderApp` → `ProfileRepository`(`getAdjustmentRange`·`saveAdjustments` 위임), `ProfileReadRepository` 삭제 |
| `b653f45` | `SegmentedControl` 옵션별 `disabled` + 그룹 설명 캡션(`aria-describedby`), roving 건너뜀 |
| `0ebdb5e` | 전역 조정·조정 저장(P-S10~S13)·보정값 쓰기·적용값 표시·이름표(Q2)·h2·2단 배치(Q5)·계측 |
| `b897f50` | 보드 <1280 요약 바 "조정 N개"(Q7) · 번들 분류 근거 가드 테스트 · 스크립트 주석 |
| `1a8258c` | 최종 검증 로그·스모크 캡처 |
| `59aa677` | REPORT(Codex 전) |
| (이 커밋) | Codex P2 반영(충돌 판정 = 초안 기준) + 테스트 + 최종 재검증 로그 + REPORT 갱신 |

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
- 테스트 수 666 → **701**(+35): `profileMessages.test.ts` 1(Codex P2) · `ProfileAdjust.test.tsx` 19 · `SegmentedControl.test.tsx` 6 · `adjustmentDraft.test.ts` 4 · `CompareBoardSummaryAdjust.test.tsx` 3 · `deferredProfileRepository.test.ts` 1 · `WriteBodyLoad.test.tsx` +1.

## 3. 번들 (gzip KB, 첫 화면 / 진입 직후 — `logs/bundle-*.txt`, `final-build.txt`)
| 시나리오 | 기준 `c75a2da` | ① 배선 | ③ 조정 화면(첫 구현) | ③′ 범위 상수·적용값 분리 | **최종**(+Q7) | 여유(최종) |
|---|---|---|---|---|---|---|
| 공통 | 89.02 | 89.05 | 89.06 | 89.06 | **89.06** | — |
| /catalog | 99.02 / 101.40 | 99.05 / 101.43 | 99.36 / 101.74 | 99.35 / 101.73 | **99.37 / 101.75** | 0.63 / 23.25 |
| /references/:id | 96.37 / 98.75 | 96.40 / 98.78 | 96.71 / 99.09 | 96.70 / 99.08 | **96.71 / 99.10** | 3.29 / 25.90 |
| /compare | 99.48 / 124.43 | 99.52 / 124.46 | (빌드 실패 — 스크립트 키 누락) | 99.56 / 124.54 | **99.60 / 124.60** | **0.40 / 0.40** |
| /compare (조정 있음) | 99.48 / 124.43 | 99.52 / 124.46 | 〃 | 99.56 / 124.54 | **99.60 / 124.60** | 0.40 / 0.40 |
| /profile | 99.18 / 118.79 | 99.21 / 118.82 | 99.22 / 124.76 | 99.22 / 124.51 | **99.24 / 124.57** | 0.76 / **0.43** |
| /studio | 89.46 / 91.84 | 89.49 / 91.87 | 89.50 / 91.89 | 89.50 / 91.88 | **89.51 / 91.89** | — |

- **공통 증가 +0.04**: P-B2 배선(deferred 래퍼 메서드 2개 위임) +0.03 · `domain/profile.ts`가 런타임 상수(기본 범위)를 갖게 되며 +0.01.
- **`/compare` +0.12 / +0.17** (브리프 "늘지 않게"는 못 지켰다 — 설계 질문 1):
  - 배선(공통) +0.04 / +0.03 · Q7 인라인 한 줄 +0.04 / +0.04.
  - 나머지 +0.04 / +0.10: 프로필 엔진이 `SegmentedControl`을 쓰게 되자 `rovingFocus`가 새 공유 청크(0.19)로 떨어진 경계 비용(`compareTray` 0.36 → 0.19) + `memoryStudio` 청크의 기본 범위 상수. 청크 설정(manualChunks)은 바꾸지 않았다.
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
- `node codex-companion.mjs review --wait --scope branch --base c75a2da` 1회(codex-companion 1.0.6, 코드 커밋 `b897f50` 뒤). 원문 `logs/codex-review.txt`.
- **[P2] 충돌 판정을 초안 기준으로** (`profileMessages.ts` `contrastView`): 한 역할의 보정을 초안에 쓴 뒤 다른 역할의 제안·충돌을 원본 base 팔레트로 계산해, 이미 풀린 충돌이 "보정값 쓰기 없음"으로 남을 수 있다는 지적. **반영함.**
  - 수정: 제안할 역할은 base에서 고르고, 후보·충돌은 "그 역할만 base 값으로 둔 초안 팔레트"에서 다시 계산한다(from = base 값 유지 → 저장소 보정 from 검사와 맞음). 다른 보정이 없으면 결과는 이전과 같다(P-AC-05·06·19 기대값 그대로 통과).
  - RED → GREEN: `logs/red-codex-p2.txt` — `profileMessages.test.ts` "원본(어두운 카드 #444)에서는 ink가 충돌 → 초안에서 primary를 #000000으로 보정하면 ink 제안은 충돌 아님, from = base ink"(수정 전 `expected { …(3) } to be undefined`).
  - 재리뷰는 하지 않았다(브리프 1회). 반영 뒤 검증 4종·5회를 다시 돌렸다(0절).

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
- `/compare` 여유 0.40 / 0.40, `/profile` 진입 직후 여유 0.43. 2a-04c(생성 메모리 구현·3안 카드)는 `/profile` 진입 직후에 붙으면 0.43을 넘기 쉽다 — 생성 본문은 처음 쓸 때 동적 import가 필요하다.
- 값 목록·비교 행에 이름표(Q2)가 들어가 버전 요약 문장에 이름표 텍스트가 나온다. 이름표를 바꾸면 요약이 달라진다(저장값과는 무관).
- STALE 뒤 최신 base 팔레트가 바뀌었으면, 초안에 남긴 보정의 `from`이 새 base와 달라 저장이 `SCHEMA_INVALID`("저장하지 못했습니다")로 끝난다. 사용자는 "조정 취소" 후 다시 써야 한다(이 경우만의 전용 문장은 없음).
- 조정 저장 성공 뒤 범위 재조회가 실패하면 이전 범위를 쓴다(저장은 끝났으므로 오류로 보지 않음).
- 보정 두 개 조합의 새 대비 미달(10.0.2 Q3)은 그대로다.

## 11. 설계 질문
1. **`/compare` 증가 +0.12 / +0.17**(3절 내역): 브리프 "늘지 않게"를 못 지켰다. 여유 0.40 / 0.40으로 멈춤선(0.3) 위다. 이대로 받을지, `rovingFocus` 공유 청크 경계(약 +0.04)를 청크 설정으로 없앨지 결정 필요.
2. **기존 P-AC-06 단언 변경**(6절, SPEC 9절 표 밖): Q6으로 muted 버튼이 생겨 단언을 ink로 좁혔다. 승인 필요.
3. **P-S13 예문 '보통'**: SPEC 2.2 P-S13 문장을 "'여유'로 맞추기"(허용 값 라벨)로 고칠지.
4. **범위 조회와 쓰기 본문 분리**(3절): 브리프는 "진입 때 자동 호출하면 본문 청크를 자동으로 분류"였다. 자동으로 넣으면 126.5KB로 초과라, 범위 조회가 본문을 받지 않게 바꿔 본문은 조작 뒤로 남겼다. 이 방식을 SPEC P-B9·7절에 적을지.
5. **대비·사이트 목적만 바꾼 버전의 요약**: 적용값에 없는 두 조정을 비교·요약 행("대비"·"사이트 목적")으로 더했다. 비교 표에도 두 줄이 는다. SPEC 3.5에 반영할지.
6. **`summarizeVersion`(기존, base 기준)**: 화면은 이제 `summarizeVersions`(적용값)를 쓰고, 기존 함수는 `profileDiff.test.ts`만 쓴다. 지울지(테스트도 옮겨야 함) 유지할지.

## 12. FIX-2A04b2 — 번들 멈춤 조건으로 중단 (F1 코드 미커밋 · F2·F3 미착수)
- 브리프 `docs/06-handoff/FIX-2A04b2_DEVELOPER_BRIEF.md` 2절: "어느 시나리오든 여유 < 0.3이면 멈추고 근거 커밋(예산 변경 없이)". F1 헬퍼만으로 **`/compare` 진입 직후 여유 0.24 · `/profile` 진입 직후 여유 0.25**가 되어 멈췄다. 예산 상수는 건드리지 않았다.
- 근거 수준: 번들 수치 = L1(빌드 실측 `logs/fix-f1-bundle-*.txt`) · WebKit·preload 래퍼 문장 관련 = L2(추정, 실측 없음)

### 12.1 커밋
| 해시 | 내용 |
|---|---|
| (이 커밋) | REPORT 12절 + F1 패치·RED/GREEN 로그·번들 전/후 로그. **`app/src` 변경 0** (패치는 되돌림) |

### 12.2 F1에서 한 것 (패치로만 보존: `logs/fix-f1-helper.patch`, `git apply --check` 통과)
- `app/src/data/chunkRetry.ts` `retryableImport(chunk, load, importUrl?)`:
  - 첫 시도는 정적 `import()` 그대로(manifest 키·분류 유지). 받은 모듈(Promise)은 기억해 다시 받지 않는다.
  - 실패하면 오류 문장에서 `location.origin + BASE_URL + "assets/" + <청크> + "-"` 뒤의 `[\w-]+.js`만 읽어 **URL을 여기서 다시 조립**하고, 다음 호출은 `?retry=N`(매번 증가)으로 받는다. 다른 출처·`/src`·`/api`·다른 청크·경로 끼워 넣기·userinfo 속이기는 거부 → 원래 오류를 그대로 던지고 다음에도 정적 `import()`.
- 적용: `writeBodyLoader`(`loadBoardConfirm`·`loadProfileWrites`) · `carryOverLoader` · `memoryBoardConfirm`의 `loadCarryOver`(재확정 이어받기 규칙 `profileAdjustments`, 조작 뒤 청크 안이라 추가 비용 0). 자동 로더(`boardEngine`·`profileEngine`·`memoryStudio`·픽스처)는 싸지 않음 — 실패하면 경계로 가는 기존 동작.
- 테스트: `chunkRetry.test.ts` 12건(성공 뒤 재요청 0 · 실패 → `?retry=1` 성공 · `?retry=2` 증가 · Firefox 문장 · 거부 6종 · URL 없는 오류 · 겹친 호출) + `chunkRetryWiring.test.ts` 1건(조작 뒤 로더 4개가 싸여 있고 청크 이름 = 모듈 파일 이름).
  - RED: `logs/fix-f1-red.txt`(헬퍼 없음 · 배선 `[]`) → GREEN: `logs/fix-f1-green.txt`(13/13). 압축판도 typecheck 0 · lint 0.

### 12.3 번들 (gzip KB, 진입 직후 자동 로드 포함 / 예산 125)
| 시나리오 | 전 (`fix-f1-bundle-before.txt`) | F1 v1 (첫 구현, 로그 없음·콘솔 실측) | F1 v2 압축 (`fix-f1-bundle-after.txt`) | v2 여유 |
|---|---|---|---|---|
| `/compare` · `/compare (조정 있음)` | 124.60 | 124.79 (+0.19) | 124.76 (+0.16) | **0.24** |
| `/profile` | 124.57 | 124.77 (+0.20) | 124.75 (+0.18) | **0.25** |
| 첫 화면(모든 라우트) | 변화 ±0.01 | ±0.01 | ±0.01 | ≥ 0.40 |
- 헬퍼는 공유 청크 `profileDraft`(`memoryStudio`·`boardEngine`이 정적 import, 두 라우트 모두 진입 직후)로 들어간다. 진입 직후 경로 어디에 두어도 비용은 같다.
- 지연 로드로 뺄 수 없다: 헬퍼는 실패 **시점**에 이미 받아져 있어야 한다. 재시도 때 받게 하면 오프라인 중 누른 "다시 시도"에서 헬퍼 청크 자체가 실패 캐시에 걸린다.
- 압축(오류 분석을 `split` 한 줄로, 상태 3개) 뒤에도 +0.16 — 거부 규칙(출처·경로·청크 이름)을 빼지 않는 한 0.1 이하는 어렵다고 판단(L2).

### 12.4 하지 않은 것 (멈춤으로 미실시)
- F1 화면 테스트 2건(`WriteBodyLoad`·`CompareBoardCarryOver`에서 정적 import가 **계속** 실패하는 브라우저 흉내 → "다시 시도" → 성공)
- 127.0.0.1:4337 브라우저 확인(차단 → 해제 → 다시 시도 · `?retry=1` 요청 200) — preview 서버는 띄우지 않았다
- F2(없는 `?v=` 안내 해제) · F3(좁은 폭 버전 비교 `dl`) — 둘 다 `/profile` 진입 직후 여유를 F1과 나눠 쓰므로(F2 `ProfilePage`, F3 `profileEngine`) 결정 전에 쓰지 않았다. 비용 미측정
- 검증 4종 + 전체 5회 · Codex 리뷰 — 커밋할 코드가 없어 미실시

### 12.5 남은 위험 (패치를 적용할 경우)
- WebKit(Safari) 오류 문장 "Importing a module script failed."에는 URL이 없다 → 이 수정이 적용되지 않고 지금처럼 계속 실패한다. Firefox 문장 형식은 단위 테스트로만 확인(실측 없음).
- 실패한 것이 청크의 **정적 의존 청크**(예: `carryOverPanel` 밑의 `profileAdjustments`)면 최상위만 새 URL로 받아도 의존 청크 URL이 그대로라 복구되지 않는다.
- 실제 Chromium에서 Vite preload 래퍼를 거친 오류 문장에 URL이 남는지는 빌드 코드 확인(래퍼가 원래 오류를 다시 던짐)과 단위 테스트 흉내뿐 — 브라우저 실측 전이다.

### 12.6 설계 질문 (하나를 골라 주세요)
1. **(a) F1에 한해 여유 0.24 / 0.25 허용** — 멈춤선(0.3)만 F1에 예외. 이후 F2·F3가 `/profile` 여유를 더 줄인다(0.25에서 시작).
2. **(b) 다른 진입 직후 코드를 조작 뒤로 옮겨 상쇄** — 별도 과제(범위 확장이라 이번에 하지 않음).
3. **(c) F1 보류, F2·F3 먼저** — 둘의 비용을 재고 남은 여유로 F1을 다시 판단.

### 12.7 결정 뒤 재개 절차
1. `git apply dev/active/2a-04b2/logs/fix-f1-helper.patch`
2. 화면 테스트 2건 RED(헬퍼 없이 계속 실패) → GREEN
3. `vite preview --host 127.0.0.1 --port 4337`에서 확정·P-S25(·되돌리기) 차단 → 해제 → 다시 시도, `?retry=1` 200 로그·캡처 → 서버 종료(`lsof`)
4. F2·F3(결정에 따라) → 검증 4종 + 5회 → Codex `review --wait --scope branch --base fd323a6`

## 13. FIX-2A04b2 재개 (영환님 A — F1 보류, F2·F3만) — F2 완료 · F3 번들 멈춤 조건으로 중단
- 브리프 0절: F1(청크 재시도)은 보류(FIX-CHUNK-RETRY로 분리), `logs/fix-f1-helper.patch`는 적용하지 않음. 이번 범위 F2 + F3. 12절은 그대로 둠.
- 결과: **F2 커밋 완료**(여유 0.41). **F3는 구현·테스트 GREEN까지 했으나 `/profile` 진입 직후 여유 0.14 < 0.3이라 브리프 2절대로 멈춤** — 코드는 패치로만 보존하고 되돌림(`app/src`의 F3 변경 0). 예산 상수 변경 없음.
- 근거 수준: 번들·테스트·브라우저 수치 = L1(`logs/fix-f2-*`, `fix-f3-*`, `fix-final-*`) · "F3 dl 부분의 비용 ≈ +0.22" = L1 두 빌드의 차(전체 F3 124.86 − 클래스만 124.64) · WebKit·Firefox 동작 = 미확인

### 13.1 커밋
| 해시 | 내용 |
|---|---|
| `d10ca46` | fix: 유효한 버전으로 이동하면 없는 `?v=` 알림 문장을 거둔다 (D-2A4-04 · F2) — 코드 + RED/GREEN·번들·브라우저 전 로그 |
| (이 커밋) | REPORT 13절 + F3 패치·RED/GREEN·번들 로그 + 검증 4종·5회 로그 + 스모크 캡처·F2 브라우저 후 로그 |

### 13.2 F2 — 없는 `?v=` 안내 해제 (D-2A4-04 P3)
- 브라우저 재현(수정 전, L1 `logs/fix-f2-browser-before.txt`): **보이는 Callout은 이미 유효 버전 이동 시 사라짐**("v2를 보고 있습니다 · 현재 v3"으로 바뀜). 남은 것은 sr-only "프로필 알림" 문장뿐 — QA가 "Callout"으로 적은 것은 이 알림 문장이거나 이전 버전 Callout으로 보인다(추정).
- 수정: `useProfileDetail.withdraw(text)` — **그 문장이 아직 알림 영역에 있을 때만** 비운다(되돌리기 완료·"조정 N개를 지웠습니다" 같은 뒤의 알림은 보존). `ProfileView`의 없는 버전 effect가 cleanup에서 `withdraw(missing)` — popstate·앱 버튼·링크 모든 경로가 요청 값 변화로 수렴하므로 한 곳에서 처리. a2 N1(같은 문장 재알림, `?v=abc → ?v=0`)은 cleanup 뒤 announce가 key를 올려 그대로 유지(F-7 테스트 통과).
- 테스트(RED → GREEN, `logs/fix-f2-red.txt` → `fix-f2-green.txt` 31/31) — `ProfilePage.test.tsx`:
  - `D-2A4-04 ?v=99 → ?v=2&diff=1 · 뒤로 · 앞으로 · ?v=1 · 최신 → 유효 버전에서는 Callout·알림 문장 모두 없음, 없는 버전으로 돌아가면 다시 알림`
  - `D-2A4-04 ?v=abc → 앱 버튼 '보기 (v1)' → 알림 문장 없음 · 다른 알림(되돌리기 완료)은 지우지 않음`
- 브라우저 확인(수정 후, L1 `logs/fix-f2-browser-after.txt`): `?v=2&diff=1`·앞으로·`?v=1`·"보기 (v1)" 클릭 모두 알림 `""`, 뒤로(`?v=99`)는 재알림.

### 13.3 F3 — 좁은 폭 버전 비교·버전 줄 (A-03~05) — **멈춤**
- 구현(패치 `logs/fix-f3.patch`, `git apply --check` 통과):
  - `VersionDiff`: `useSyncExternalStore` + `matchMedia("(min-width: 48rem)")`로 **한 배치만 그림**(matchMedia 없으면 표). 768↑ 표: `break-keep` + 항목 열·행 머리글·차이 열 `whitespace-nowrap`. <768: `figure`(`aria-labelledby` → `figcaption` = caption과 같은 제목, `tabIndex=-1`, `focusRef`) + `dl`(항목 `dt` → `v1 값` → `v3 값` → "바뀜" `dd`).
  - `VersionList`: 요약 `basis-full md:basis-auto md:flex-1`(A-05).
  - `useViewport`(compare)를 재사용하지 않은 이유: 프로필 쪽에서 import하면 새 공유 청크가 생겨 `/compare`(여유 0.40)에도 붙을 위험 — 실측 청크 구성 동일(`same-chunks`)을 확인한 로컬 훅으로 둠.
  - jsdom(dom-accessibility-api 0.5.16)은 `figcaption`으로 `figure` 이름을 계산하지 않아 `aria-labelledby`를 명시.
- 테스트(패치 안 `ProfileVersionNarrow.test.tsx` 5건, RED `logs/fix-f3-red.txt` 5 실패 → GREEN `fix-f3-green.txt` 36/36): 768 표 클래스·dl 없음 / 390·320 표 없음 · dl 정보 = 768 표 정보 · 제목·항목 1번씩(중복 낭독 없음) / 390 비교 열기 → `figcaption` 포커스 · 닫기 → 같은 버튼 / A-05 클래스.
- 브라우저 전(수정 전, `logs/fix-f3-browser-before.json`, `screens/fix-f3-before-{768,390,320}.png`): 항목 열 768 = 44px · 390 = 32px · 320 = 30px, "레이아웃 방향" 높이 145px(390·320), 390 버전 줄 요약 폭 6px·높이 252px. 가로 넘침 0.
- F3 브라우저 "후" 캡처는 멈춤으로 없음. 스모크 캡처 `screens/fix-smoke-{768,390,320}.png`는 F3 미적용(F2만) 상태 — 수치는 전과 같음.

### 13.4 번들 (gzip KB, 진입 직후 자동 로드 포함 / 예산 125 · 첫 화면 / 100)
| 시나리오 | 전 `fix-f23-bundle-before.txt` | F2 후 `fix-f2-bundle-after.txt` | F3 전체 `fix-f3-bundle-after.txt` | 참고: F3 클래스만(768 표·A-05) `fix-f3-subset-bundle.txt` |
|---|---|---|---|---|
| `/profile` 진입 직후 | 124.57 (여유 0.43) | 124.59 (**0.41**) | 124.86 (**0.14 < 0.3 → 멈춤**) | 124.64 (0.36) |
| `/profile` 첫 화면 | 99.24 | 99.27 | 99.55 | 99.32 |
| `/compare`·`(조정 있음)` 진입 직후 | 124.60 | 124.58 | 124.58 | 124.59 |
| `/catalog` 진입 직후 | 101.75 | 101.74 | 101.74 | — |
- F3 비용은 `ProfilePage` 청크(7.13 → 7.41) + CSS(8.68 → 8.71). <768 `dl` 배치(두 번째 마크업 + 훅)가 대부분(≈ +0.22).
- 최종(F3 되돌린 뒤) 빌드 `fix-final-build.txt`: `/profile` 124.59 · `/compare` 124.58 — F2만 반영된 상태로 복귀 확인.

### 13.5 검증 (F2만 있는 최종 상태)
- typecheck 0 · lint 0 · build 0(번들 검사 통과) — `logs/fix-final-{typecheck,lint,build}.txt`
- 전체 테스트 **5회 연속 703/703 통과** — `logs/fix-final-run{1..5}.txt`, 요약 `fix-final-runs-summary.txt`
- 스모크: 127.0.0.1:4337 `vite preview`(F2 빌드로 재시작), ego-browser TaskSpace 25 → `finish({keep: []})`, 서버 종료 후 `lsof -iTCP:4337` 결과 없음.

### 13.6 Codex
- `review --wait --scope branch --base ce36f19` 1회 — 결과는 13.9에 적는다(`logs/fix-codex-review.txt`).

### 13.7 남은 위험
- D-2A4-01·02(F1 청크 재시도) **보류** — 확정·P-S25 "다시 시도"는 네트워크 복구 뒤에도 새로고침 전까지 계속 실패(FIX-CHUNK-RETRY).
- D-2A4-05 / A-03~05(좁은 폭 버전 비교·버전 줄) **미해결** — 13.8 결정 대기.
- F3 패치를 적용할 경우: 비교가 열린 채 768 경계를 넘어 창 크기를 바꾸면 포커스된 caption/figcaption이 언마운트되어 포커스를 잃는다. 스크린리더에서 `figure` + `figcaption` 낭독 확인 전(L2).
- WebKit·Firefox 미확인(F2 포함, Chromium만 실측).

### 13.8 설계 질문 (하나를 골라 주세요)
1. **(a) F3 전체를 여유 0.14로 허용** — 멈춤선 예외. 이후 `/profile` 진입 직후에 붙는 작업 여지는 사실상 0.
2. **(b) 768 표 줄바꿈(A-04) + 버전 줄(A-05)만 먼저** — 실측 여유 0.36(멈춤선 안). <768 `dl`(A-03)은 여유 확보 뒤. 단 <768 표는 `keep-all`·`nowrap`이면 가로 스크롤로 바뀌는지 390·320 실측이 필요.
3. **(c) 다른 진입 직후 코드를 조작 뒤로 옮겨 상쇄** — 12.6(b)와 같은 별도 과제. F1 재개와 함께 여유를 만든다.
4. **(d) `VersionDiff`를 비교를 연 뒤 받는 지연 청크로** — `?diff=` 직접 진입은 자동 로드가 되고, 실패 캐시 문제(D-2A4-01)가 새 경로에 생기며, 번들 스크립트 분류도 바꿔야 한다.

### 13.9 Codex 결과
- (리뷰 완료 뒤 갱신)
