**판정: PASS with issues** — P1 0 · P2 0 · P3 5. 검증 4종 통과(test 472/472), 번들 전 라우트 예산 안. 5폭 레이아웃·필터 9종·URL 복원·초기화(Q8)·분리형 개수·정렬·보기(`tab`)·카드·필·2.4.11 모두 통과. 이전 대비 결함 D-QA01~03 **해소**. 결함은 모두 포커스·키보드 세부(P3). K-1은 **현행 유지 가능(혼란 작음)** 으로 판정.

# QA-V2-2 보고서 — 디자인 v2 전환(V2-1 토큰 + V2-2 셸·카탈로그 r2·카드·필) 독립 검증

- 브리프: `docs/06-handoff/QA-V2-2_QA_BRIEF.md` · 판단 기준: ADR-003(px 대조 없음), `docs/design/v2/SPEC.md` 개정 r2 3·4.1·4.2·4.5·6.2
- 대상: `main` `14da219`(= V2-2b 병합 `f93237a` + 브리프). 워크트리 `qa-v2-2`, 브랜치 `k002bill2/qa-v2-2`
- 실행: 2026-09-26 KST, macOS. ego-browser(Ego Lite) TaskSpace 6. 뷰포트는 CDP `Emulation.setDeviceMetricsOverride`, 캡처는 `page.screenshot`(**CDP 타임아웃 없이 전부 성공**)
- 서버: `vite preview --host 127.0.0.1 --port 4337 --strictPort`(PID 72577) → 종료 확인(12절)
- 측정 스크립트 공통 함수: `logs/browser-helpers.js`(포커스 요소·링 계산 스타일·`overflow` 조상 잘림·필 겹침 면적·문서 넘침·대비 합성 계산)
- **스크린리더**: VoiceOver 청취는 하지 않았다. Chrome 접근성 트리(CDP `Accessibility.getFullAXTree`)로 이름·설명·상태를 확인했다(L1 트리, 낭독은 L3).

## 1. 결함 목록

| ID | 심각도 | 요약 | 재현 절차 | 기대 | 실제 | 증거 |
|---|---|---|---|---|---|---|
| D-V22-01 | P3 | **주 메뉴 링크 포커스 표시가 잘린다**(v2 2중 링 아님) | 1) `/catalog` 1280 2) Tab 3회(건너뛰기 2 → 로고) 후 Tab → "카탈로그"·"보관함"… | V2-AC-40: 포커스 링이 2중 링이고 어느 면에서든 ≥ 3:1로 보임 | 로고·주 메뉴 링크에 focus-visible 스타일이 없어 UA 기본 `outline: auto 1px rgb(0,95,204)`만 그려진다. 주 메뉴 `nav`가 모든 폭에서 `overflow-x-auto`(`AppHeader.tsx` nav 클래스, `md:`에서도 해제 안 됨)라 링크 높이 24px 밖의 outline이 잘린다 — 1280: 위·아래 4px 잘림 → **좌우 1px 세로선만 남음**, 390: 위 4px 잘림. 포커스 위치는 알아볼 수 있어 2.4.7 완전 미달은 아니지만 DS 링과 불일치하고 식별성이 약하다 | `screens/focus-1280-nav.png`("보관함") · `logs/browser-r1-1280-tab.log` 3~7 · `logs/browser-r3-layout-390tab.log` 3~7 · `logs/browser-r2-1280-contrast-ring.log` "ring nav" |
| D-V22-02 | P3 | **"초기화 · N"을 키보드로 누르면 포커스가 사라진다** | 1) `/catalog?industry=cafe-fnb&…`(레일 선택 1개 이상) 1280 2) "필터 초기화" 버튼에 포커스 → Enter | 초기화 뒤에도 포커스가 레일 안(예: 레일 머리·첫 그룹)에 남음(2.4.3) | 초기화는 정상(업종·정렬 유지, "초기화" + `disabled` + 설명 "선택 0개")이지만, 누른 버튼이 즉시 `disabled`가 되어 `document.activeElement` = **BODY**. 스크린리더 사용자는 현재 위치를 잃는다 | `logs/browser-r5-filters-pill.log` "키보드 초기화" · `logs/browser-r4-filters-ax.log` "초기화 후"(클릭도 같음) |
| D-V22-03 | P3 | **390 업종 칩 줄: Tab으로 포커스한 칩이 오른쪽에서 잘린다** | 1) `/catalog` 390 2) "뷰티 1" 칩에서 Tab → "의료 1" 3) 700ms 대기 후 측정 | 포커스한 칩과 링이 칩 스크롤 영역 안에 완전히 보임 | "의료 1" 칩 rect 326~392, 칩 스크롤 영역 오른쪽 끝 378 → **칩 14px + 링이 잘린 채 멈춤**(`scroll-behavior: auto`라 애니메이션 중간값 아님). "전문서비스 1"도 링 6px 잘림. 칩이 일부 보여 2.4.11(AA, 완전히 가림 아님)은 통과, 사용성 저하 | `screens/focus-390-chip.png`(오른쪽 끝) · `logs/browser-r7-390-chip-nav-pill.log` "chip+wait" |
| D-V22-04 | P3 | **개수 설명이 접근성 트리에서 "N 개"(띄어 씀)로 계산된다** | 1) `/catalog?concept=minimal` 2) AX 트리 조회 | SPEC 4.2: 설명 "N개", 초기화 설명 "선택 N개" | Chrome 설명 = `"1 개"`, `"0 개"`, 초기화 `"선택 1 개"`. 숨긴 설명 노드 안의 숫자와 "개"가 별도 텍스트 노드라 Chrome이 공백을 넣는 것으로 보임(L2). jsdom 테스트는 "1개"로 통과. 낭독 영향("한 개" vs "일 개")은 **VoiceOver 청취로 확인 필요** | `logs/browser-r4-filters-ax.log` "AX tree" |
| D-V22-05 | P3 | **펼친 필 목록이 토글보다 DOM 앞에 있어 Tab으로 들어갈 수 없다** | 1) 카드 3개 비교 추가 2) 필 "비교 보드 3 / 6"에 포커스 → Enter(펼침) 3) Tab | 펼친 내용이 토글 다음에 오거나(공개 패턴), 적어도 펼친 뒤 앞으로 이동으로 목록에 도달 | Tab: 토글 → "비교 보드 열기" → 문서 끝(BODY). 목록 빼기 버튼 3개는 **Shift+Tab**으로만 도달. 보이는 순서(목록이 필 위)와 DOM은 일치하므로 2.4.3 위반은 아니나, 펼친 직후 "다음"으로 목록을 찾는 키보드·스크린리더 사용자는 목록을 못 찾는다. 빼기 후 포커스(D07)·Esc 복귀는 정상 | `logs/browser-r6b-compare.log` "필 펼친 상태 Tab/Shift+Tab" · `logs/browser-r5-filters-pill.log` "목록 첫 버튼 포커스" |

## 2. 기본 게이트 (V2-AC-38·39) — **통과**

| 명령 | 결과 | 로그 |
|---|---|---|
| `npm ci` | exit 0 | `logs/npm-ci.log` |
| `npm run typecheck` | exit 0 | `logs/typecheck.log` |
| `npm run lint` | exit 0 | `logs/lint.log` |
| `npm test -- --run` | **472 passed / 41 files**, exit 0 | `logs/test.log` |
| `npm run build` | exit 0, 예산 검사 통과 | `logs/build.log` |

번들(gzip, 첫 화면 / 진입 직후, 예산 100 / 125KB) — V2-2b REPORT 최종값과 **동일**:

| 라우트 | 실측 | 여유(첫 화면) |
|---|---|---|
| 공통 JS | 89.52 (`index` 86.19 + `jsx-runtime` 3.33) | — |
| `/catalog` | 98.91 / 101.30 | 1.09 |
| `/references/:id` | 96.04 / 98.42 | 3.96 |
| `/compare` | **99.24** / 121.66 | **0.76** |
| 자리표시 | 89.98 / 92.36 | 10.02 |
| CSS(예산 밖) | 8.30 | — |

## 3. 토큰·대비 (V2-1, V2-AC-04·40, Q4) — **통과**, D-QA01~03 **해소**

계산: computed color → 캔버스 sRGB, 불투명 조상까지 배경 알파 합성, 조상 opacity 곱, WCAG 상대 휘도(1a-03과 같은 방법).

| 대상 | 전경 | 배경 | 비율 | 기준 | 판정 |
|---|---|---|---|---|---|
| 주 메뉴 비활성 링크 / 활성 | `#56615a` / `#1a2620` | `#fff` | 6.46 / 15.65 | 4.5 | 통과 |
| h1 부제·카드 캡션·점수 줄·정렬 옆 캡션 | `#56615a` | `#fff` | 6.46 | 4.5 | 통과 |
| 레일 legend | `#4c574e` | `#fff` | 7.55 | 4.5 | 통과 |
| 레일·업종 칩 개수(미선택) | `#56615a` | `#fff` | 6.46 | 4.5 | 통과 |
| 선택된 업종 칩 개수 | `#fff` | `#5a5fe8` | 4.96 | 4.5 | 통과 |
| 카드 라이선스 배지 internal | `#066b5a` | `#def7f0` | 5.73 | 4.5 | 통과 |
| 필 "비교 보드" / "/ 6"(`inverse-label-alternative`) | `#fff` / `#bfc2c1` | `#1a2620` | 15.65 / 8.73 | 4.5 | 통과 |
| **Q4** 체크박스 테두리 · 검색 입력 테두리 | `#86928b` | `#fff` | **3.22** | 3 | 통과 |
| 초기화(비활성) | `#dbdfdd` | `#fff` | 1.35 | 예외 | 1.4.3 비활성 예외 |
| **D-QA01** 요약 바 "초안 보기"(768·390) | `#fff` | `#35403b` | **10.76**(이전 1.39) | 4.5 | **해소** |
| **D-QA02** "기본값" 라벨 / 열 머리글 업종 | `#56615a` | `#fff` / `#f0f3ee` | **6.46 / 5.77**(이전 3.67 / ≈3.57) | 4.5 | **해소** |
| **D-QA03** 대표색 오류 문구(`abc`) | `#af2e0d` | `#f0f3ee` | **5.83**(이전 3.21) | 4.5 | **해소** |
| 비교 보드 열 문자 배지(역상) | `#fff` | `#1a2620` | 15.65 | 4.5 | 통과 |
| 상세 알림 영역(`role=status`) 글자색 | `#56615a` | `#fff` | 6.46 | 4.5 | 통과 |

**포커스 링(V2-AC-40)** — 토큰 `--focus-ring: 0 0 0 2px #fff, 0 0 0 4px #2563eb` 확인. 계산 스타일로 2중 링 적용 확인: primary 버튼("새 프로젝트"), 체크박스(보이는 상자 `peer-focus-visible`), 업종 칩·정렬·모션 radio, 카드 제목 링크·아이콘 버튼, 역상 필 토글·"비교 보드 열기", 요약 바 "초안 보기"(390). 캡처: `screens/focus-1280-primary.png`·`focus-1280-checkbox.png`·`focus-1280-pill.png`·`focus-390-summarybar.png`. 링 색 `#2563eb` vs 흰 간격 5.16(SPEC 3.4). **예외: 로고·주 메뉴 링크 = UA outline + 잘림 → D-V22-01.** 검색 입력은 wrapper `focus-within` 링(측정 시점이 `transition` 시작점이라 투명값이 찍힘 — 클래스로 확인, 캡처는 없음 L2).

## 4. 셸 (V2-AC-15·16) — **통과**

| 폭 | 헤더 높이 | 문서 넘침 | 비고 |
|---|---|---|---|
| 1920 · 1280 · 1024 · 768 | 52 | 0 | 브랜드 · 주 메뉴 4 · 새 프로젝트 · 아바타 한 줄 |
| 390 | 89(52 + 메뉴 줄 36) | 0 | 주 메뉴 4개 모두 보임(nav `scrollWidth 358 = clientWidth`), 가로 스크롤 불필요 |

- 카탈로그·상세·`/compare` 헤더 구성 동일(상세·비교 보드도 같은 `AppHeader`, "조직 공유" 없음). `?tab=saved`에서 GNB "보관함" `aria-current=page`.

## 5. 카탈로그 r2 — **통과**

| AC | 결과 | 증거 |
|---|---|---|
| V2-AC-17r2 | **그룹당 1개 표본**(전체 옵션은 개발 [V]가 확인): 업종 칩 + 레일 7개 체크박스 그룹을 사람 속도(350ms 간격)로 선택 → URL `?industry=cafe-fnb&audience=age-20-30&concept=minimal&layout=fullbleed&purpose=booking&license=internal&color=neutral&device=desktop` → **새로고침 복원**(체크 7·칩·"초기화 · 7"). 모션은 별도 실행(r4): `motion=low` 선택 → 새로고침 복원, → 방향키로 `mid`. 레일 한 벌(AX 트리에서 옵션 이름 중복 0). 참고: 한 틱 안에서 합성 클릭 7개를 연달아 보내면 마지막 1개만 URL에 남았다 — 사람 입력으로는 재현되지 않는 측정 부산물로 보고 결함에서 뺐다 | `logs/browser-r5-filters-pill.log` "9종", `logs/browser-r4-filters-ax.log` |
| V2-AC-41 | `audience=age-20-30&concept=minimal,warm`(결과 1개, 대담한 없음)에서 "대담한" = **1** = `audience=age-20-30&concept=bold` 결과 수 1 → 분리형. 현재 결과 기준이었다면 0. 개수 0인 옵션도 비활성이 아님(AX 트리에서 "0 개" 체크박스 `disabled` 없음, 결과 0건 조합에서도 추가 체크 동작) | `browser-r4` "facet" |
| V2-AC-42 | "초기화 · 2"(device + motion) → 누름 → `?industry=cafe-fnb&sort=latest`(업종·정렬 유지), "초기화" + `disabled` + 설명 "선택 0개". 빈 결과 문구 유지. 포커스 유실은 D-V22-02 | `browser-r4`·`r5` |
| V2-AC-19r2 | 768·390: 레일 `display:none`, "필터" 버튼 보임(`aria-expanded=false`, `aria-controls`=레일). Tab 순서 필터 → 업종 칩 → 정렬 → 결과(DOM = 보이는 순서). 칩 줄 `overflow-x:auto`(390 `scrollWidth 692 > clientWidth 306`) — Tab으로 모든 칩 도달(잘림은 D-V22-03). **보충 라운드 펼침**: 768·390에서 "필터" Enter → `aria-expanded=true`, 레일 `display:flex`, 레일 top(768: 283 / 390: 446) ≥ 정렬 bottom(246 / 409), 레일 bottom(1325 / 1488) ≤ 첫 카드 top(1353 / 1516) = 칩 줄 아래·결과 위, 폭 712 / 358, 넘침 0. "미니멀" 선택 → URL `?concept=minimal` 즉시, 버튼 "필터 1", 설명 "선택 1개", 레일 펼친 채 유지. Tab(필터부터): 업종 칩 8 → 정렬 → 필터 초기화 → 레일 체크박스 | `browser-r3` layout·390 tab · `logs/browser-r8-supplement.log` B · `screens/catalog-768-rail-open.png` |
| V2-AC-20 | radiogroup "정렬" 1벌, 점수순에서 → 방향키 → 최신순 선택·포커스 이동, URL `sort=latest` | `browser-r4` "정렬" |
| V2-AC-21 | 탭 없음. `?tab=saved` h1 "보관함" + "저장한 레퍼런스 0개" + GNB 보관함 `aria-current`, `?tab=rec` h1 "추천" + "전체 보기"(`/catalog`) | `browser-r4` 마지막 |
| V2-AC-26r2 | 열 **3·3·2·2·1**(1920·1280·1024·768·390), 카드 폭 311·311·346·348·358, 1920 본문 **1280**(왼쪽 348), 5폭 문서 넘침 0, 제목 `line-clamp: 2` | `browser-r3` layout · `screens/catalog-{1920,1280,768,390}.png` |

## 6. 카드·필 (V2-AC-22~25) — **통과**

- V2-AC-22·23: 카드 보더 없음·썸네일 muted, 캡션 2줄 + "접근성 98 · 성능 95 · 09.20 측정", 대표색 점 3개. 아이콘 버튼 **32×32**(5폭), 이름 "<제목> 저장"(`aria-pressed`)·"<제목> 비교 추가" → "<제목> 비교 중, 비교에서 빼기". `screens/catalog-1280.png`.
- V2-AC-24: 펼침 버튼 "비교 보드 3 / 6"(`aria-expanded` true/false), 목록 3항목 "<제목> 비교에서 제거", **가운데 제거 → 포커스 다음 항목**, Esc → 닫힘 + 토글로 복귀. "/ 6" 8.73:1. 7번째 한도 알림은 픽스처가 6개라 **브라우저 미재현**([V]만).
- **V2-AC-25(2.4.11)**: 1280×800 전체 Tab 61단계, 390×700 맨 위 시작 40단계, 390×700 3개 담긴 상태 17단계 — **필 겹침 면적 0**(마지막 카드 버튼 bottom 604 < 필 top 636, `scroll-padding-bottom 96px`). (r3의 "중간 클릭 시작" 실행은 실제로 첫 카드에서 시작돼 증거에서 제외.)
  - **보충 라운드 — 버튼이 필 아래에 깔린 상태에서 Tab**: "로컬 베이커리 저장"을 스크롤로 필 영역 안에 둠(Tab 전 겹침 1024px² 확인, 390: 버튼 top 644 / 필 top 636, 1280: 744 / 736) → 제목 링크 `focus({preventScroll})`(scrollY 불변 확인) → Tab → 브라우저가 스크롤해 저장 버튼 top 286(390) / 368(1280), **겹침 0**, 다음 비교 버튼도 0. `logs/browser-r8-supplement.log` A · `screens/focus-390-under-pill.png`.

## 7. 키보드·스크린리더

- 카탈로그 전체 Tab 순서(1280): 건너뛰기 2 → 로고 → 주 메뉴 4 → 새 프로젝트 → 검색 → 추천 받기 → 업종 칩 8 → 정렬(roving 1) → 레일 체크박스 → 모션(roving 1) → 색상·디바이스 → 카드 × 6(제목·저장·비교) → 필 토글 → 비교 보드 열기. 초기화는 비활성이라 건너뜀(정상).
- radiogroup 방향키: 정렬·모션 모두 → 로 선택·포커스 이동.
- AX 트리: 체크박스 이름 = 옵션명, 설명 "N 개"(D-V22-04), 업종 칩 `pressed` + 설명, "필터 초기화" 설명 "선택 1 개", 필 `button "비교 보드 0 / 6" expanded=false` + `button "비교 보드 열기"`, `region "비교 트레이"`·`region "레퍼런스 목록"`, 카드 버튼 이름 위와 같음.

## 8. 회귀 — 상세·비교 보드 (레이아웃 차이는 결함 아님) — **통과**

- 상세 `/references/ref-a`(카드 제목 링크로 SPA 진입): h1 "모던 카페 브랜드", 섹션 구성·유사 레퍼런스, "비교 추가" → "비교 중, 비교에서 빼기". 문서 넘침 0. "보드 열기" 안내 없음은 1a-03 D-QA06(V2-3 V2-AC-30 예정)이라 이번 결함에서 제외. `logs/browser-r6-detail.log`, `screens/detail-1280.png`.
- `/compare`(필 "비교 보드 열기"로 진입, 3개): 1280·768 표(13행), 390 아코디언, 문서 넘침 0. Hero 셀 선택 → `aria-pressed=true` "선택됨", 알림 "Hero 구성: A 선택". 대표색 `abc` → `aria-invalid` + `aria-describedby`. `logs/browser-r6b-compare.log`, `screens/compare-{1280-error,768,390}.png`.
- 참고: 트레이는 메모리 상태라 전체 새로고침(`goto`) 뒤 비워진다 — 기존 동작, 결함 아님.

## 9. K-1 판정 (알려짐 — 모바일 헤더 포커스 순서) — **현행 유지 가능, 상향 없음**

- 390 실측 Tab: 로고(y 0) → 카탈로그·보관함·비교 보드·프로젝트(y 52, 둘째 줄) → 새 프로젝트(y 10, 첫 줄) → 검색. AX 트리 순서도 같음.
- 모든 단계에서 포커스 요소가 **뷰포트 안**(`inVp: true`), 가려진 요소 0, 주 메뉴는 390에서 가로 스크롤 없이 4개가 다 보여 스크롤로 숨는 링크 없음.
- 위아래로 한 번 오가는 이동 거리는 89px 헤더 안이고, 순서(브랜드 → 탐색 → 작업 버튼)는 데스크톱과 같아 의미·조작이 보존된다(2.4.3 충족, L2). 스크린리더는 DOM 순서로 읽으므로 데스크톱과 같은 구조로 전달된다.
- 판정: **사용 혼란 작음 → P2 상향 불필요, "알려짐" 유지.** 단, 같은 영역의 주 메뉴 링 잘림은 K-1과 별개 결함 **D-V22-01**로 분리했다.

## 10. 남은 위험 판정 (V2-2b R-3·R-4, 결함 아님)

- **R-3**(펼친 목록이 포인터 스크롤 시 카드를 가림): 실측 — 펼친 채 휠 스크롤해도 목록 유지(2개 96px, 3개 136px, 6개 약 256px). 필 영역이 화면 아래 중앙에 한정되고 토글·Esc로 닫혀 **사용성 영향 낮음**.
- **R-4**(측정일 "MM.DD"): 현재 픽스처가 모두 같은 해(2026)라 영향 없음. 연도가 섞이는 실데이터 연결 시 재검토 권장 — **지금 영향 낮음**.

## 11. 판정 근거 요약

| 항목 | 결과 |
|---|---|
| 1 기본 게이트·번들 | 통과 |
| 2 토큰·대비·포커스 링 | 통과(D-QA01~03 해소) · 링 예외 D-V22-01 |
| 3 셸 | 통과 · K-1 유지 |
| 4 카탈로그 r2 | 통과 · D-V22-02·03 |
| 5 카드·필 | 통과 · D-V22-05 |
| 6 키보드·스크린리더 | 통과(트리 기준) · D-V22-04 |
| 7 회귀 | 통과 |

## 12. 서버 종료·변경 범위

- 본 라운드 `kill 72577`, 보충 라운드(PID 96803) `kill 96803` — 두 번 모두 `lsof -nP -iTCP:4337 -sTCP:LISTEN` → **출력 없음(exit 1)**. ego-browser TaskSpace 6·7 `finish({ keep: [] })`. `logs/server-stop.log`.
- 제품 코드 변경 0: 커밋 전 `git status --porcelain` = `?? docs/qa/v2-2/`만. 커밋 뒤 `git diff --stat 14da219 -- app design` **출력 없음**(QA 커밋 여러 개 전체 기준). 로그는 `.gitignore`의 `*.log`에 걸려 1a-03 선례대로 `git add -f`.
