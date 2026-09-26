# V2-4 REPORT — 비교 보드 `/compare` v2 (2a-03)

- 브리프 `docs/06-handoff/V2-4_DEVELOPER_BRIEF.md` · 설계 `docs/design/v2/SPEC.md` 4.4 · 브랜치 `k002bill2/v2-4-compare` · 분기점 `c64532e` · 로컬 커밋만(push·원격 없음)
- 체크포인트·수치 원본: `PROGRESS.md`, `logs/*.txt`, `screens/*.png`

## 0. 승인 필요 1건 — 6.3 밖 테스트 변경 (D-QA04)
- V2-AC-35가 요구하는 D-QA04 이름(`이 레퍼런스로 전부 선택: <열 문자> <제목>`)을 넣으면 기존 테스트의 **정확 일치 이름 쿼리 8줄(7건 실패)** 이 깨진다. SPEC 6.3은 `ComparisonTable.test`·`CompareBoardPage.test`가 "깨지지 않아야 한다"고 했고 `CompareBoardResponsive.test`는 표에 없다 → **6.3 목록 누락**으로 판단(설계가 요구한 이름 변경이지 표시 방식 변경이 설계를 어긴 것이 아님). 멈추지 않고 **단독 커밋 `e9f9df6`** 로 분리했다. 이 커밋만 되돌리면 D-QA04 이전 상태로 돌아간다.
- 고친 줄(이름 쿼리만, 단언 의미 유지):
  - `ComparisonTable.test.tsx` 84·101(roving 진입점) · 123(→ 정확 이름 `…: B 프리미엄 헤어살롱`) · **132**(`queryByRole(...).not.toBeInTheDocument()` — 정확 문자열 그대로 두면 이름이 바뀐 뒤 **조용히 통과**해 AC-15 단언이 무의미해진다 → `/^이 레퍼런스로 전부 선택/`)
  - `CompareBoardPage.test.tsx` 62(AC-02 `/^이 레퍼런스로 프로필 만들기/`) · 119(AC-07) · 131(P-5)
  - `CompareBoardResponsive.test.tsx` 77
- 상태 태그 톤 단언 줄: 기존 테스트에 없음(바뀐 줄 0). 그 밖의 기존 테스트 변경 0.

## 1. AC별 결과

| AC | 결과 | 근거(테스트 이름·실측) |
|---|---|---|
| V2-AC-32 (1a-03 AC-01~26 회귀) | 통과 | 기존 `ComparisonTable.test`·`DraftPanel.test`·`CompareBoardPage.test`·`CompareBoardResponsive.test`·`DraftSummaryBar.test`·`keyboardA11y.test` 전부 통과(이름 쿼리 8줄만 0절에 적은 대로 변경). 520 passed |
| V2-AC-33 모드 토글·조직 공유 없음, 12행 | 통과(특성화) | `pages/CompareBoardV2.test.tsx` "모드 토글('템플릿 / 스타일 조합')·조직 공유가 없고 비교 항목은 12행" — 기준선에서도 통과 |
| V2-AC-34 선택 셀 | 통과 | `compareBoardV2.test` "고른 셀 = primary-container 면 + 채운 체크 원(주 색) + '선택됨'…", "안 고른 셀 = 빈 원 + '이 요소 선택', 셀 면 없음" · `pages/CompareBoardV2.test` "<768 아코디언: 고른 셀(li) 전체가 primary-container 면이고 안 고른 셀은 아니다" + 기존 "PickButton — 접근 이름·선택 표시 (A-2 · A-3)" |
| V2-AC-35 열 머리글 | 통과 | "역상 문자 배지 + 대표색 견본(장식) + 라이선스 Tag + 빼기(×)"(특성화), "'전부 선택'은 ghost(assistive) sm", "D-QA04: '전부 선택' 접근 이름은 보이는 문구로 시작…", "D-QA04 1열 변형", 기존 "전체 제목은 title 속성에…"(S-18). 배지 대비 실측 15.65 |
| V2-AC-36 초안 패널·요약 바 | 통과 | "회색 면이 없고 넓은 화면에서 왼쪽 line-neutral 선", "항목 앞 출처 색 점(aria-hidden)…", "'초안 비우기'는 ghost(assistive)", 기존 `DraftSummaryBar.test` "'초안 보기'는 역상 쌍(secondary)…". "초안 보기" 실측 10.78(768·1024·390) |
| V2-AC-37 D-QA02·03 | 통과 | 실측: "기본값 · A" 6.46 · 열 업종 6.46 · 대표색 오류 문구 6.52 (계산 기준 6.45~6.52와 일치) |
| V2-AC-38 번들 | 통과 | 2절 |
| V2-AC-39 검증 4종 | 통과 | typecheck 0 · lint 0 · test 520 passed(46 files) · build 0 — 최종 fresh 실행 `logs/final.txt` |
| 상태 태그 톤(4.4) | 통과(특성화) | "상태 태그 톤: … (neutral · positive · cautionary 별칭)" 3건 — V2-1에서 Tag green·orange가 이미 status 별칭 |

- 테스트 수: **503 → 520 (+17)** · 파일 44 → 46. 새 파일 `components/compare/compareBoardV2.test.tsx`(15), `pages/CompareBoardV2.test.tsx`(2).
- RED: 첫 RED 13건 중 9 실패 / 4 특성화 통과(`logs/red.txt`), D-QA04 1건 실패(`logs/red-dqa04.txt`), 아코디언 고른 셀 1건 실패(`logs/red-accordion.txt`). 특성화 5건은 억지 RED를 만들지 않았다(V2-3 선례).

## 2. 번들 (gzip KB, 첫 화면 / 진입 직후)

| | 기준선 `c64532e` | 최종 | 차이 |
|---|---|---|---|
| 공통 | 88.66 (index 85.33) | 88.66~88.67 (index 85.33~85.34) | **코드 0** — 아래 정규화 비교 |
| `/compare` | 98.38 / 120.80 | **98.51 / 120.97** | +0.13 / +0.17 (여유 1.49 / 4.03) |
| `/catalog` | 98.49 / 100.87 | 98.50 / 100.88 | 공통 해시 흔들림만 |
| `/references/:id` | 95.82 / 98.20 | 95.83 / 98.21 | 공통 해시 흔들림만 |
| 자리표시 | 89.12 / 91.50 | 89.12 / 91.51 | 공통 해시 흔들림만 |

- 청크: `CompareBoardPage` 8.96 → 9.07(+0.11: 빈 원 span, 셀 면 조건, 색 점 span + 래퍼 div, aria-label 템플릿) · `boardEngine` 5.55 → 5.59(+0.04: 출처 색 계산).
- **공통 청크 정규화 비교**: 기준선을 임시 worktree에서 다시 빌드해 `index-*.js`를 비교 — raw 268,822 = 268,822 바이트, 파일명 해시를 고정 문자열로 바꾸면 **완전히 같다**(gzip 84,910 = 84,910). 85.33 ↔ 85.34는 index 안 지연 청크 해시 문자열의 gzip 차이.
- 상쇄 내역: 공통 청크 증가 0이라 상쇄 대상 없음. `/compare` 청크 안에서는 삭제분(thead 면 클래스, 굵은 테두리 `border-(length:--border-thick)` 조합, `check` 아이콘 참조, 초안 목록 `gap-2`, `rounded-lg bg-background-alternative p-5`)이 증가분을 일부 상쇄했고, 순증 +0.11은 여유 1.62 안이다. 예산 변경 없음. 엔진 청크로 옮긴 것: 출처 색 계산(`draftView`의 `dot`).
- 번들 규칙 준수: 공통 DS(`Button`·`Tag`·`Icon`·`AppHeader`) 무변경 · 새 아이콘 파일 0 · 파일화 아이콘 5개(`bookmark`·`bookmark-fill`·`search`·`arrow-right`·`chevron-left`) `/compare` 미사용 · 엔진 청크 새 import 0(`draftView` 수정은 기존 import 안).
- **원 표시에 쓴 것**: 채운 체크 원 = 기존 `circle-check` 아이콘(이미 `/compare` "저장됨"에서 쓰던 파일화 아이콘 — 새 요청 없음), 빈 원 = CSS(`size-4 rounded-full border-(length:--border-thick) border-line-strong`). 선택 버튼의 `check` 아이콘 참조는 빠졌다(`check`는 `/compare`에서 더 이상 요청되지 않음).

## 3. 브라우저 실측·대비 재측정 (`logs/browser.txt`, `screens/`)
- ego-browser, `vite preview` 127.0.0.1:4318, 13:05 KST 종료(`lsof` exit 1). 카탈로그에서 5개를 담아 5열 보드로 측정.
- 1280·1024·768·390: 문서 가로 넘침 0. 5열은 표 영역 안에서만 가로 스크롤(390은 아코디언). 1280은 표 + 오른쪽 초안 패널(왼쪽 선 1px `line-neutral`), <1280은 패널이 아래로(위 선), 요약 바 역상 면 `rgb(26,38,32)` 하단 고정.
- 행 roving: Tab 진입 = 선택된 버튼 → ←/→·End → 다음 Tab = 다음 행. 포커스 링 2중 링(흰 2px + 4px).
- 가로 스크롤 200px에서 행 머리글 고정·흰 불투명 면.
- 390 아코디언 고른 셀 `li` 면은 실측 당시 muted `rgb(240,243,238)`(버튼만 primary-container)였다 → Codex 뒤 수정 커밋에서 `li` 전체 `bg-primary-container`로 바꿨고 테스트로 확인. 브라우저 재캡처는 하지 않았다(클래스 1개 교체, 대비는 표 셀과 같은 조합 14.08).
- 대비: 열 문자 배지 15.65 · 요약 바 "초안 보기" 10.78(D-QA01) · "기본값 · A" 6.46 · 열 업종 6.46(D-QA02) · 대표색 오류 문구 6.52(D-QA03) · 출처 글자 6.45 · "선택됨" 14.08 · 채운 원 4.46 · 빈 원 경계 3.23 (비텍스트 3:1 이상).

## 4. 목업과 다르게 한 곳 (ADR-003)
- **C-08** 모드 SegTabs 두지 않음 · **C-09** 12행·조직 공유 숨김·선택 표시는 `button[aria-pressed]` · **C-10** 열 문자 배지 역상 면 + 견본 별도, 전부 선택·빼기 유지
- 새 사유 1: 셀 전체 클릭 대신 셀 안 선택 버튼 유지(A-2 접근 이름·A-5 roving) — 고른 셀은 td 면 + 버튼 면이 함께 primary-container
- 새 사유 2: 초안 값 1줄 말줄임 대신 줄바꿈(D-9·S-18), 목업의 lint 상자 대신 기존 경고 Callout
- 새 사유 3: 출처 색 점은 레퍼런스 출처(pick·"기본값 · A")만. 사용자·기본값(fallback)·Hero 전(pending)은 점 없이 빈 자리(정렬 유지) — 목업의 "사용자" 점(사용자 색)은 폰트만 바꾼 경우 뜻이 없어 넣지 않음
- 새 사유 4: 초안 출처 글자 `text-primary` → `text-primary-text`(Q2 주 색 글자 토큰, 흰 면 4.96 → 6.45, 다크 대비 보장)
- 새 사유 5: 되돌리기 상자·빈 안내를 `bg-surface-elevated` → `bg-fill-normal`(흰 패널 위에서 상자가 사라지므로)
- "초안 비우기" ghost 크기: 목업 sm → 기존 md 유지(패널 하단 버튼 높이 일관, 터치 타깃)

## 5. 남은 위험
- 가로 스크롤 시 고정 행 머리글 오른쪽 경계선이 없다(흰 면끼리 맞닿음). `border-collapse` 표에서 sticky 셀 테두리는 스크롤과 함께 움직이지 않아 선을 넣으려면 그림자·가상 요소가 필요 — 범위 밖으로 두고 기록(`screens/compare-1280-scrolled-focus.png`).
- 출처 색 점은 레퍼런스 대표색 그대로라 흰색에 가까운 대표색은 점이 거의 안 보인다(장식, 출처는 글자로 있음).
- `/compare` 첫 화면 여유 1.49KB — 이후 단계(2a-04~)가 이 청크를 건드리면 다시 실측 필요.
- D-QA04 테스트 변경은 0절 승인 대상.

## 6. Codex 리뷰 (1회, `review --wait --scope branch --base c64532e`)
- 결과: **"변경된 UI와 출처 색 계산에서 확인 가능한 결함은 없습니다."** 지적 0건 → 반영할 것 없음.
- Codex는 TypeScript 타입 검사를 통과로 확인했고, 테스트 실행은 Codex 샌드박스가 읽기 전용이라(Vite 임시 파일 쓰기 불가) 확인하지 못했다고 적었다. 테스트는 로컬 fresh 실행으로 보강(`logs/final.txt`).
- **Codex 1회 이후 들어간 수정 1건**: 아코디언(<768) 고른 셀 `li` 면을 `bg-primary-container`로(조건 클래스 1개 + 테스트 1건). 브리프가 리뷰 1회라 Codex를 다시 돌리지 않았다. 최종 520 passed.

## 7. 커밋
- `10ea873` feat(compare): V2-4 비교 보드 v2 — 흰 표 면·선택 셀 원 표시·초안 패널 색 점·ghost 버튼
- `e9f9df6` feat(compare): D-QA04 전부 선택 접근 이름 (단독)
- `bd85e0f` docs(v2-4): 브라우저 실측·대비 재측정 로그·캡처
- `ffaad7d` docs(v2-4): REPORT — AC 판정·번들 전/후·브라우저 실측·Codex 결과
- (이 커밋) fix(compare): <768 아코디언 고른 셀 전체 primary-container + REPORT 갱신

## 결정 (Jarvis 기록, 2026-09-26 KST)
- D-QA04 테스트 8줄 변경(`e9f9df6`): **영환님 승인("1")**. 설계 위반이 아니라 SPEC 6.3 표 누락으로 판정 — SPEC 6.3에 예외 행 추가.
- Jarvis 독립 재검증: 검증 4종 exit 0, 520 passed, `/compare` 98.51 / 120.97KB. Codex 독립 리뷰(`--base c64532e`, `cad5a81` 포함) 결함 없음 — `/tmp/wbs_codex_v24_j1.txt`.

