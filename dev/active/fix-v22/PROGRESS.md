# FIX-V22 PROGRESS — QA-V2-2 P3 결함 5건(D-V22-01~05)

- 브리프: `docs/06-handoff/FIX-V22_DEVELOPER_BRIEF.md` · 근거: `docs/qa/v2-2/REPORT.md` 1절
- 브랜치 `k002bill2/fix-v22` · 분기점 `d7eeb08` · 로컬 커밋만
- 같은 코드 근거: `git diff --stat 14da219 d7eeb08 -- app` 출력 없음 → QA 실측이 곧 "전" 수치

## 기준선 (`d7eeb08`, fresh)
- test 41 files · **472 passed**
- 번들(gzip KB, 첫 화면 / 진입 직후): 공통 89.52 · `/catalog` 98.91 / 101.30 · `/references/:id` 96.04 / 98.42 · `/compare` 99.24 / 121.66 · 자리표시 89.98 / 92.36

## 사전 실측 (D-V22-03, 390, `vite preview` 127.0.0.1:4338)
- "뷰티" → Tab → "의료 1": 칩 right 392 / 칩 줄 right 363 → 링 포함 −33px(잘림), `scrollLeft 0`(Chrome은 부분 노출 요소에 포커스 스크롤을 하지 않음)
- 칩 줄에 `scroll-padding-inline: 8px`만 주입 → **변화 없음**(CSS만으로 불가)
- `focusin` + `:focus-visible` + `scrollIntoView({block,inline:'nearest'})` + padding 8px 주입 → "의료" 링 여유 +3.85, "전문서비스" +3.88, 역방향 4단계 모두 ≥ 0 → JS 채택

## RED (`logs/red.log`) — 7 failed / 49 passed (3 files)
- D-V22-01 AppHeader 링 클래스·여백 가드 1 · D-V22-02 초기화 포커스(Enter·클릭) 2 · D-V22-03 칩 스크롤 1 · D-V22-04 설명 노드 `['1','개']` 1 · D-V22-05 필 Tab 2(기존 "필 밖으로 나가면 닫는다"를 새 DOM 순서로 재작성)

## 진행
- [x] RED
- [x] GREEN · 4종 — test 478/478, typecheck·lint·build exit 0 · 코드 커밋 `73f37c7`
- [x] 브라우저 1280·390 (+768·1024 헤더 52·넘침 0) — `logs/browser-*.log`, `screens/after-*`
- [x] 번들 — `/catalog` 99.06(여유 0.94), `/compare` 99.30(여유 0.70)
- [x] Codex — 지적 0건
- [x] REPORT — `REPORT.md`

## 2차 (advisor 점검 후)
- 끝 칩 "리테일" 링 −0.21px → 테스트 가드 `pr-2`·`-mr-2` RED 확인 → 칩 줄 끝 여백 8px(음수 여백 상쇄) → 4종 통과(478/478) → 390 재실측 8칩 앞·뒤 최소 0, 리테일 +3.79 (`logs/browser-390-r2.log`)
- 390 D-V22-02(레일 펼침 후 초기화 → H2)·D-V22-04("필터" 버튼 "선택 1개") 보충 실측
