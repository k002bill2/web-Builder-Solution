# V2-3 REPORT — 상세 `/references/:id` v2 (2a-02)

**결론: 합격 기준 V2-AC-27·28·29·30·31·38·39 충족. 검증 4종 통과(499 tests). Codex 1회 결함 0건.** 로컬 커밋만, push·원격 없음.

- 브랜치 `k002bill2/v2-3-detail` · 분기점 `8981da3` · 구현 커밋 `d0912c4` · 체크포인트 `PROGRESS.md`
- 근거 로그: `logs/red.txt`(RED) · `logs/final-build.txt`(최종 빌드·번들) · `logs/browser-r1.txt`(브라우저) · `logs/codex-review.txt` · `screens/*.png` 5장

## 1. AC별 결과

| AC | 결과 | 테스트 (파일 › 이름) |
|---|---|---|
| V2-AC-27 탭 없음·섹션/토큰 항상 보임 | 통과 | `ReferenceDetailPage.test` › "탭이 없고, 섹션 구성·토큰 요약이 정보 패널에 항상 보인다" · "미리보기 폭을 모바일로 바꿔도 섹션 구성·토큰 요약은 그대로 보인다" · "DOM 순서 = 보이는 순서…" · `tabsRemoved.test` 2건 |
| V2-AC-28 radiogroup·`view`·`tab=mobile` | 통과 | `ReferenceDetailPage.test` › "미리보기 폭 (V2-AC-28)" 9건(it.each 4 포함) · `keyboardA11y.test` › "상세 미리보기 폭 radiogroup (A02 · V2-AC-28)" · `previewView.test` 4건 |
| V2-AC-29 유사 3그룹(≤6)·점수 이력·이름 2줄 | 통과 | "아래 영역: 유사 레퍼런스 3그룹(각 ≤ 6)과 점수 이력이 탭 없이 보인다" · 기존 "유사 레퍼런스 긴 이름 (B-DET-02)" 무수정 통과 |
| V2-AC-30 점수 색·D-QA06 | 통과 | "점수 3칸(접근성·성능·모션) — status-*-text 굵기 700" · "비교 추가 성공: '비교 보드에 담았습니다'…형제 링크 '보드 열기'…" · "'보드 열기'를 누르면 비교 보드로 간다" · 7번째 거부 테스트에 가득 참 링크·포커스 단언 추가 |
| V2-AC-31 태그 비대화형 | 통과 | "콘셉트·목적 태그는 버튼이 아니다 — 비대화형 Tag" |
| SPEC 4.3 "비교 중" outline+check | 통과(**기준선부터 GREEN** — V2-1이 이미 outline) | "'비교 중'도 outline을 유지하고 check 아이콘 + 글자 '비교 중'으로 구분한다" — 회귀 가드 |
| V2-AC-38 번들 | 통과 — 아래 3절 | `npm run build`(check-bundle-size) |
| V2-AC-39 검증 4종 | 통과 | typecheck 0 · lint 0 · test 43 files **499 passed** · build 0 |

RED (`logs/red.txt`): RED 대상 4파일을 실행한 41건(무수정 기존 테스트 포함) 중 22 failed / 19 passed. `previewView.test.ts` 4건은 모듈이 없어 파일 단위로 실패했다(22에 미포함). 19 passed 중 새 테스트는 'outline 유지' 1건뿐이다(기준선 GREEN). 태그 테스트는 태그 자체가 아니라 정보 패널 region이 없어 실패했다(태그는 기준선에서도 `span`).

## 2. 깨진 기존 테스트 · 테스트 수
- 고친 기존 테스트는 **모두 SPEC 6.3 행 안**:
  - `ReferenceDetailPage.test`: 필수 영역 테스트의 `tablist`/`tabpanel` 단언 삭제, "탭 전환·URL tab" / "탭 복원" / "모르는 탭 값" 3건 → 미리보기 폭 테스트로 교체, 유사 이동 테스트의 `?tab=mobile`·`tab "섹션 구성"` → `?view=mobile`·`radio "데스크톱"`
  - `keyboardA11y.test`: "상세 탭 tablist (A02)" → "상세 미리보기 폭 radiogroup (A02 · V2-AC-28)"
- 6.3 밖 테스트 수정 **0**(`routeScroll`·`trayBoard`·`AppHeader`·`RouteErrorBoundary`·`CatalogPage` 무수정 통과).
- `Tabs.tsx`는 전용 테스트 파일이 없었다 — 지운 "그 테스트"는 위 tablist 케이스들이다. `rovingFocus.test`는 `SegmentedControl`이 쓰므로 유지.
- 테스트 수: 41 files · 478 → **43 files · 499 (+21)**. 새 파일 `features/detail/previewView.test.ts`·`test/tabsRemoved.test.ts`.

## 3. 번들 (gzip KB, 첫 화면 / 진입 직후, 예산 100 / 125)

| | 전 (`8981da3`) | 후 | 차이 |
|---|---|---|---|
| 공통 JS | 89.58 (`index` 86.26) | **89.58** (`index` 86.25) | 0 |
| `/references/:id` | 96.10 / 98.49 | **96.74 / 99.13** | +0.64 |
| `/catalog` | 99.07 / 101.45 | **99.41 / 101.80** | +0.34 |
| `/compare` | 99.30 / 121.73 | **99.30 / 121.73** | 0 |
| 자리표시 | 90.04 / 92.42 | 90.04 / 92.42 | 0 |
| CSS(참고, Vite 표기) | 8.38 | 8.40 | +0.02 |

- 공통 청크는 늘지 않았다. `/compare` 여유 0.70 그대로.
- `/catalog` +0.34: 카탈로그 코드는 무수정이다. 상세가 `SegmentedControl`을 import하자 빌드가 이 모듈을 `CatalogPage` 청크(6.96 → 6.66)에서 카탈로그·상세 공유 청크 `useThrowToBoundary`(0.16 → 0.80)로 옮겼다. 파일이 나뉘어 gzip 압축 효율이 떨어진 몫이다. 상쇄하지 않았다. 상쇄하려면 카탈로그를 고치거나(금지), 상세에 radiogroup을 복제해야 한다(DS 일관성 위반). **`/catalog` 여유 0.93 → 0.59KB.**
- `Tabs.tsx` 삭제분은 상세 청크에서만 줄었다(상세 청크 4.42 → 4.40, 새 코드와 상쇄).

## 4. 브라우저 실측 (ego-browser, `vite preview` 127.0.0.1:4317, 종료 후 `lsof` exit 1)
- 4폭(1280·1024·768·390) × 4 URL(`""`·`?view=tablet`·`?view=mobile`·`?tab=mobile`) = 16조합. **가로 넘침 0**.
- 1280·1024는 2단(정보 패널 380px), 768·390은 한 열.
- **h1이 모든 조합에서 첫 화면 안에 들었다.** 390×844 기준 desktop 444 · mobile 560.
- 키보드: 방향키·Home으로 폭을 선택하고 URL `view`를 갱신한다. 포커스 링은 `:focus-visible` 2중 링.
- D-QA06: 알림 "비교 보드에 담았습니다" + 링크 "보드 열기"(`/compare`). 포커스는 버튼에 남고 outline 클래스를 유지한다.
- 캡처: `screens/detail-1280.png`·`detail-1024-tablet.png`·`detail-768.png`·`detail-390-mobile.png`·`detail-1280-compare-added.png`

## 5. 목업과 다르게 한 곳
- **C-07**: 미리보기 폭 전환, 모바일 구조 설명, 아래 전폭 영역(유사 3그룹·점수 이력)을 추가했다.
- **C-11**: 태그를 FilterChip 대신 비대화형 `Tag`로 표시했다.
- **C-12**: 점수를 800 대신 700(`ds-title2`)으로 썼다.
- 새 사유
  - 목업의 "반응형" 칩은 데이터 필드가 없어 넣지 않았다. 대신 기존 "모션 낮음" 태그를 유지했다.
  - 뒤로 링크는 목업의 ghost 버튼이 아니라 기존 nav "브레드크럼" 링크를 그대로 쓴다(기존 테스트 계약).
  - 토큰 한 줄에 "섹션 간격 96px · 페이드 200ms"를 넣었다. SPEC 4.3의 "간격·모션 값을 한 줄에 합친다"를 따른 것이다.
  - 견본 아래에 hex 목록 줄을 추가했다(SPEC).
  - 폭 라벨은 영문 대신 한국어(데스크톱·태블릿·모바일, SPEC)다.
  - 미리보기 무대는 16:9(lg 4:3)이고, 태블릿·모바일은 그 안에 3:4·9:16 프레임으로 넣었다.

## 6. 남은 위험
- `/catalog` 첫 화면 여유가 **0.59KB**다. 다음 카탈로그 작업은 증가분을 먼저 상쇄해야 한다.
- 미리보기는 폭별 **자체 와이어프레임**이다. 실제 반응형 렌더가 아니다(권리 경계 PRD 원칙 4).
- 모바일 미리보기는 390에서 109×193으로 작다. h1 첫 화면 조건을 우선했다.
- 옛 `?tab=mobile` URL은 해석만 한다. 사용자가 폭을 바꾸기 전까지 주소창에 그대로 남는다.
- `view=mobile`이면 h2 "모바일 구조"가 DOM에서 h1보다 앞선다. SPEC이 정한 순서(미리보기 → 정보 패널) 때문이다. 제목 탐색 순서가 어색하지만 AC 위반은 아니다. Codex 이후라 코드는 고치지 않고 기록만 남긴다.
- 브라우저로 확인하지 못하고 [V]로만 확인한 것이 두 가지다.
  - 가득 참(6/6)의 "보드 열기": 픽스처가 6개라 7번째 추가를 브라우저에서 재현할 수 없다.
  - 빈 알림 영역이 `display:none`이 아닌지: jsdom은 CSS를 적용하지 않아 클래스만 확인했다.
- 스크린리더 청취는 하지 않았다. 알림 영역은 이름·구조 단언과 DOM 실측으로만 확인했다.

## 7. Codex
- `review --wait --scope branch --base 8981da3` 1회(`d0912c4` 기준): **"조치가 필요한 결함을 확인하지 못했습니다."**
- Codex 안에서 Vitest는 샌드박스 쓰기 권한 문제로 실행되지 못했다. tsc는 통과했다. 테스트는 로컬 fresh 실행(499 passed)으로 대신했다.
- 반영할 지적이 없었다.
