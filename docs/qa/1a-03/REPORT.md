**판정: PASS with issues** — P1 0건 · P2 3건(모두 대비 A-10/WCAG 1.4.3) · P3 2건. 기능 흐름 D1~D8 통과, 반응형 AC-21 통과, 키보드·접근 이름·알림 통과, 자동 검증 4종 통과(test는 1회차 타임아웃 2건 → 재실행 305/305).

# QA-1A-03 보고서 — 비교 보드 `/compare` 독립 검증

- 브리프: `docs/06-handoff/QA-1A-03_QA_BRIEF.md` · 판단 기준: ADR-003(px 대조 없음), 설계서 `docs/design/1a-03/SPEC.md` 4·5·6·9절
- 대상: `k002bill2/qa-1a-03 @ c0908d8` = M1-UI-03b 보완 최종 `bb93af5` + main 문서 병합. `app/`·`design/` 변경 없음
- 실행: 2026-09-26 KST, macOS. ego-browser(Ego Lite) TaskSpace 78. 뷰포트는 CDP `Emulation.setDeviceMetricsOverride`(정확 폭), 캡처는 CDP `Page.captureScreenshot`
- 서버: `vite preview --host 127.0.0.1 --port 4337 --strictPort` (PID 62190)
- 결함 수: P1 0 / P2 3 / P3 2 (합계 5)

## 1. 결함 목록

| ID | 심각도 | 요약 | 재현 절차 | 기대 | 실제 | 캡처·증거 |
|---|---|---|---|---|---|---|
| D-QA01 | P2 | 하단 요약 바 **"초안 보기"** 글자 대비 1.39:1 | 1) 카탈로그에서 3개 담기 → `/compare` 2) 폭 768 또는 390 3) 하단 요약 바의 "초안 보기" | 13px/600 본문 글자 4.5:1 이상 (활성 버튼이라 예외 아님) | 글자 `#171719`(`text-label-normal`)가 버튼 면 `#323233`(`bg-fill-normal`을 `--surface-inverse` `#2c2c2c` 위에 합성) 위에 있음 → **1.39:1**. 캡처 픽셀 표본도 `#171719`/`#313232` = 1.39:1로 일치. 어두운 바 위에서 밝은 전경 토큰이 아니라 기본(밝은 면용) 토큰을 씀 | `screens/compare-768-3.png`, `screens/compare-390-3.png` 우하단 · `logs/browser-r4-768.log` "768", `logs/browser-r5-390.log` "bar 390" |
| D-QA02 | P2 | `--label-alternative` 글자가 4.5:1 미만 — **"기본값" 라벨**, 열 머리글 업종, 회수 열의 흐린 셀 | 1) 3개 이상 보드에서 Hero 하나만 선택 2) 초안 패널 항목의 "기본값 · A" | A-10: 흐린 셀·보조 라벨·"기본값" 표시도 4.5:1 이상 | "기본값 · A" 13px/500 `#858588` on `#ffffff` = **3.67:1**. 열 머리글 업종(같은 토큰, `#f7f7f8` 위) = **3.57:1**. 회수 셀은 `ComparisonTable.tsx:75`·`ComparisonAccordion.tsx:49`에서 같은 `text-label-alternative`를 쓰므로 같은 배경에서 ≈3.57:1 (L2 — 픽스처에 회수 레퍼런스가 없어 브라우저 미재현, 토큰 계산값) | `logs/browser-r2-a11y-func.log` "contrast" |
| D-QA03 | P2 | 사용자 대표색 **오류 텍스트** 대비 3.21:1 | 1) 초안 패널 대표색에 `abc` 입력 2) Tab으로 포커스 이동 | 13px/500 오류 문구 4.5:1 이상 | `aria-invalid=true`와 `aria-describedby` 연결은 정상(AC-14 통과). 글자 `#ff4242`(`--status-negative` 계열) on `#f7f7f8` = **3.21:1**. DS `TextField` 공통 오류 스타일일 가능성이 있음 — 다른 화면 영향 범위는 확인 필요 | `logs/browser-r2-a11y-func.log` "AC-14 abc" |
| D-QA04 | P3 | "이 레퍼런스로 전부 선택" 6개가 모두 같은 접근 이름 | 1) 6개 보드 2) `h1`에서 Tab | 버튼만 Tab으로 훑는 사용자도 어느 레퍼런스인지 구분 (A-2의 "표 머리글 읽기에 기대지 않는다" 원칙). 옆의 빼기 버튼은 "<제목> 비교에서 빼기"로 구분됨 | 접근 이름이 6개 모두 "이 레퍼런스로 전부 선택". `th` 안에 있어 표 탐색으로는 문맥을 얻을 수 있음 → P3 | `logs/browser-r2-a11y-func.log` "tab order" |
| D-QA05 | P3 (테스트 안정성) | 부하에서 기존 테스트 2건이 5s 타임아웃 | 1) 시스템 load avg ≈35 상태에서 `npm test -- --run` | 부하와 무관하게 통과 | 1회차 exit 1: `ReferenceDetailPage.test.tsx` "필수 영역을 모두 보여준다"(5964ms), `keyboardA11y.test.tsx` D07 "다음 칩 → 이전 칩 → 트레이 영역"(5569ms) — 단언 실패가 아니라 `Test timed out in 5000ms`. 두 파일 단독 재실행 24/24, 전체 재실행 305/305 통과. 제품 결함 아님 | `logs/test.log`, `logs/test-rerun-2files.log`, `logs/test-rerun-full.log` |

## 2. 반응형 — AC-21 정식 판정: **통과**

| 뷰포트 | 보드 | 결과 | 캡처 |
|---|---|---|---|
| 1280 × 800 | 6개 | 표 컨테이너만 가로 스크롤(`clientWidth 618` < `scrollWidth 1280`, `overflow-x:auto`, `tabIndex=0`, `aria-label "비교 표 (가로로 스크롤)"`). `scrollLeft 300` 뒤 행 머리글 `left` 132 → 132(`position: sticky`). 초안 패널 `sticky` — 창을 587px 내려도 패널 top 20, 확정 버튼 화면 안. 문서 `scrollWidth 1265` ≤ 1280(스크롤바 15px), 화면 밖 요소는 시각 숨김 알림 영역 1개뿐. 말줄임된 셀·초안 값 0 | `screens/compare-1280-6.png` |
| 768 × 1024 | 3개 | 표 유지(`table` 존재), 표 컨테이너 `scrollWidth 704` / `clientWidth 695`. 하단 요약 바 `sticky`, 바닥 1024 = 뷰포트 바닥, 문구 "초안 3/10 · 초안 보기 · 프로필 확정". "초안 보기" → 포커스 `H2 "프로필 초안"`, 뷰포트 안(top 499). 문서 넘침 0(753 ≤ 768), 화면 밖 요소 0, 말줄임 0 | `screens/compare-768-3.png` |
| 390 × 844 | 3개 | 표 없음(`table` 0), 아코디언 12개 `h3 > button[aria-expanded][aria-controls]`, 처음엔 **Hero 구성만 `expanded=true`**, 접힌 머리글에 "선택 안 함"/"A 선택됨"/"비교 정보". 펼친 영역 `role=region` + `aria-labelledby`(A-11). 요약 바 있음. 문서 넘침 0(375 ≤ 390). 열 칩 목록은 SPEC 5.3대로 자체 가로 스크롤 컨테이너 안(문서 넘침 아님). **정보 손실 0**: 12행 × 3열 값 36개를 768 표에서 모아 390 전체 펼침 값과 대조 — 전부 존재(대조 스크립트의 "접근성·성능" 불일치 1건은 행 이름을 "·"로 자른 스크립트 오류이며 값 3개 모두 펼침에 있음) | `screens/compare-390-3.png`, `screens/compare-390-3-expanded.png` |

측정 로그: `logs/browser-r1-1280.log` "layout", `logs/browser-r4-768.log` "768", `logs/browser-r5-390.log`.

## 3. 대비 실측 (A-10, WCAG 2.2 AA)

계산 방법: computed `color`를 캔버스로 sRGB 변환, 불투명 조상까지 배경 알파 합성, 조상 `opacity` 곱을 반영한 뒤 WCAG 상대 휘도로 계산(`logs/browser-r2-a11y-func.log`·`browser-r4-768.log`·`browser-r1-1280.log`).

| 대상 | 전경 | 배경 | 비율 | 기준 | 판정 |
|---|---|---|---|---|---|
| "초안 보기" 버튼 글자 (768·390) | `#171719` | `#323233` | **1.39** | 4.5 | **미달 → D-QA01** |
| 요약 바 텍스트 "초안 3/10" | `#ffffff` | `#2c2c2c` | 13.97 | 4.5 | 통과 |
| 요약 바 "프로필 확정" | `#ffffff` | `#3366ff` | 4.68 | 4.5 | 통과 |
| "기본값 · A" 라벨 (`--label-alternative`) | `#858588` | `#ffffff` | **3.67** | 4.5 | **미달 → D-QA02** |
| 열 머리글 업종 (`--label-alternative`) | `#828285` | `#f7f7f8` | **3.57** | 4.5 | **미달 → D-QA02** |
| 회수 열 흐린 셀 (같은 토큰) | ≈`#828285` | 표 배경 | ≈3.57 (L2) | 4.5 | **미달 → D-QA02** (브라우저 미재현) |
| 대표색 오류 텍스트 | `#ff4242` | `#f7f7f8` | **3.21** | 4.5 | **미달 → D-QA03** |
| "선택됨" 버튼 글자 | `#000000` | `#eaf2fe` | 18.63 | 4.5 | 통과 |
| "선택됨" 테두리 | `#3366ff` | `#ffffff` | 4.68 | 3 (UI) | 통과 |
| "이 요소 선택" 버튼 글자 | `#171719` | `#ffffff` | 17.90 | 4.5 | 통과 |
| "이 요소 선택" 테두리 | `#e0e0e2` | `#ffffff` | 1.32 | — | 관찰만. 버튼은 글자로 식별되어 1.4.11 필수 대상이 아니라고 판단(L2) |
| 비활성 "레퍼런스 추가" (6/6, 보완 5) | `#ccccce` | `#e8e8ea` | 1.31 | 예외 | WCAG 1.4.3 비활성 UI 예외. 확정 버튼 비활성과 같은 스타일로 보임(보완 5 확인) |
| 비활성 "프로필 확정 (v1)" | `#c6c6c9` | `#e1e1e4` | 1.31 | 예외 | 1.4.3 비활성 예외 |

## 4. 접근성·키보드

| 항목 | 결과 | 증거 |
|---|---|---|
| AC-19 / A-5 | 통과. Hero 행 진입 시 A(tabIndex 0, 나머지 −1) → `→` B → `→` C → `←` B → `End` F → `Home` A → `↓`·`↑` A 그대로 → `→→` C → `Space` C `aria-pressed=true` → `Tab` 다음 행(메뉴 구조) → `Shift+Tab` 선택된 C로 복귀. 행 10개가 각 Tab 1회 | `browser-r2` "AC-19", "tab order" |
| A-2 접근 이름 | 통과. AX 트리 이름 "Hero 구성: A 동네 치과 클리닉의 요소 선택" ~ F까지 6개, `pressed` 속성 노출. 대표색 `textbox "대표색"`, 폰트 `combobox "폰트"` | `browser-r2` "AX hero names", "AX color input" |
| A-4 알림 (`role=status` "선택 알림") | 통과(DOM MutationObserver 기준). 선택 "Hero 구성: C 선택" · 해제 "Hero 구성 선택 해제" · 열 빼기 "D를 빼서 카드 선택 해제"/"F를 뺐습니다" · 전부 선택 "기존 선택 1개를 B로 바꿨습니다" · 되돌리기 "되돌렸습니다" · 비우기 "선택 1개를 비웠습니다" · 경고 "대표색 #C9A96E 적용 · 경고 1개 추가". 교체 문구는 단위 테스트 AC-05와 앞 라운드 관찰(교체 뒤 A 선택 상태) 외에 observer 기록이 남지 않았다(observer 재설치로 초기화). **실제 스크린리더 청취는 하지 않았다** | `browser-r4` "A-4", `browser-r2` "announcements" |
| A-6 열 빼기 포커스 | 통과. 가운데 D 빼기 → 다음 열 E의 빼기, 마지막 F 빼기 → 이전 열 E, E 빼기 → 이전 열 C | `browser-r4` "A-6" |
| A-7 | 통과. 트레이 "비교 보드 열기"로 SPA 진입 직후 `document.title` "비교 보드 · Design Studio", `activeElement` = `H1`(`tabindex=-1`). 새로고침 뒤 제목 동일 | `browser-r1` "A-7" |
| A-8 | 통과. 확정 버튼 `aria-disabled=true` + `aria-describedby` → "Hero를 하나 고르면 확정할 수 있습니다" / v1 뒤 "확정한 뒤 바뀐 내용이 없습니다". 누르면(Enter) 이유가 알림 영역에 다시 나옴 | `browser-r1` "S-06", `browser-r6` "E2" |
| A-9 | 부분 확인. 정상 흐름 동안 `role=alert` 0개, 경고 Callout은 `role` 없음. 저장 실패·확정 실패 alert는 메모리 저장소로 트리거할 수 없어 **브라우저 미재현 · 단위 테스트 대체**(`CompareBoardPage.test.tsx` S-12·S-14) | `browser-r2` "calloutRoles" |
| A-1 | 통과. `caption` "레퍼런스 6개, 비교 항목 12개", `th[scope=col]` 6, `th[scope=row]` 12 | `browser-r1` "layout" |
| 바로가기 | Tab 순서에 "본문으로 건너뛰기" 있음 | `browser-r2` "tab order" |

## 5. 기능 흐름 (브라우저 실제 조작)

| 항목 | 결과 | 증거 |
|---|---|---|
| D1 카탈로그 담기 → 트레이 → `/compare` | 통과. 6개 담기 → "비교 보드 열기" → `/compare`, 열 A~F가 트레이 순서 | `browser-r1` |
| D2 선택·교체·해제, 전부 선택 + 되돌리기, 비우기 + 되돌리기 | 통과. Hero A 상태에서 B "전부 선택" → 10행 모두 B, 안내 "기존 선택 1개를 B로 바꿨습니다 · 되돌리기" → 되돌리기 → Hero A만 복원. "초안 비우기" → 선택 0, 포커스 "되돌리기" → Enter → 1개 복원(S-17) | `browser-r2` "after pick-all B", "S-17" |
| D3 대표색·폰트 | 통과. `abc` → `aria-invalid=true` + 오류 문구(대비는 D-QA03). `#C9A96E` → Callout "대비 부족 · 흰 글자 대비가 2.2:1로 기준 4.5:1보다 낮습니다 · 보정값 #927136 (대비 4.5:1) · 보정값 쓰기", 확정 가능 유지 → "보정값 쓰기" → 필드 `#927136`, 경고 사라짐. 폰트 Select: 선택 안 함·Pretendard·Noto Sans KR·Noto Serif KR 모두 활성, Noto Serif KR 선택 → 초안 폰트 출처 "사용자" | `browser-r2` "AC-12", "fonts" |
| D4 확정 → v1 → E2 → v2 | 통과. "프로필 확정 (v1)" → `/profile/profile-1`. GNB로 복귀 → "v1 확정됨", 버튼 "새 버전으로 확정 (v2)" `aria-disabled` + 이유 "확정한 뒤 바뀐 내용이 없습니다", Enter 해도 이동 없음(**E2 차단**). Hero→C → "v1 이후 변경됨", 버튼 활성. A로 되돌리면 다시 "v1 확정됨"(보완 3 설계대로). C로 바꿔 v2 확정 → `/profile/profile-1` → 복귀 "v2 확정됨", 버튼 "(v3)" 비활성 | `browser-r6` |
| D5 0개·1개·6개 | 통과. 6개: 부제 "6 / 6개 · 가득 참", "레퍼런스 추가" `aria-disabled=true`(disabled 속성 없음) → Enter 시 이동 없이 알림 "비교 보드에는 최대 6개까지 담을 수 있습니다…"(AC-16). 1개: 열 머리글 1, 선택 버튼 0, Callout "비교할 레퍼런스가 1개입니다", "이 레퍼런스로 프로필 만들기"(S-04). 0개: 표 없음, "비교할 레퍼런스가 없습니다" + "카탈로그에서 고르기"(S-03) | `browser-r1` "S-06", `browser-r6` "S-04", "after reload" |
| D6 새로고침 | 선택·열이 초기화되어 빈 보드(S-03)가 됨. 메모리 저장소라 **현재 설계상 한계**(결함 아님) | `browser-r6` "after reload" |
| D7 콘솔·네트워크 | 통과. `console.error`·`error`·`unhandledrejection` 0(R1~R6). resource 27건 중 외부 도메인 0, 4xx 0(새로고침 뒤도 0) | `browser-r6` "network", 각 로그 "errs" |
| D8 카탈로그 회귀 (D07) | 통과. 2번째 칩 빼기 → 다음 칩, 마지막 칩 빼기 → 이전 칩, 마지막 하나 빼기 → `SECTION "비교 트레이"`. 6개 담기 동작 유지 | `browser-r1` "D07" |

## 6. 자동 검증 (`logs/`)

| 명령 | 결과 |
|---|---|
| `npm ci` | exit 0, 0 vulnerabilities (`npm-ci.log`) |
| `npm run typecheck` | exit 0 (`typecheck.log`) |
| `npm run lint` | exit 0 (`lint.log`) |
| `npm test -- --run` | 1회차 **exit 1** — 2 failed / 303 passed, 둘 다 5s 타임아웃(load avg ≈35) (`test.log`) → 두 파일 단독 24/24 (`test-rerun-2files.log`) → 전체 재실행 **35 files · 305 passed, exit 0** (`test-rerun-full.log`). D-QA05 |
| `npm run build` | exit 0. `/compare` 첫 화면 **99.98KB / 100KB** · 진입 직후 자동 로드 포함 **120.64KB / 125KB**. `/catalog` 97.98 / 100.36, 자리표시 89.40 / 91.79 (`build.log`) — Developer 보완 절 수치와 일치 |

## 7. 알려진 항목 대조 (결함 수 제외)

| 항목 | 이번 관찰 | 분류 |
|---|---|---|
| SPEC 5.1 넘침 그림자 미구현 | 1280·6개: 표 보이는 폭 620px이 C열(513~705px) 가운데를 잘라 머리글 "모던 카페 브…"와 버튼이 잘려 보임 → **가로 스크롤을 알아챌 수 있음**. 스크롤 컨테이너에 그림자·배경 그라데이션 없음(`box-shadow none`, `::after` 없음). 768·3개는 넘침이 9px(704/695)뿐이라 가릴 내용이 사실상 없음. macOS 오버레이 스크롤바는 신호로 치지 않음 | 알려짐 — 사용성 영향 낮음 |
| 스크롤 컨테이너 3열 이상 포커스 | 1280·6, 768·3 모두 `tabIndex=0` | 알려짐(의도) |
| 표·아코디언 `matchMedia` 단일 렌더 | 768 ↔ 390 전환 시 `table` 유무가 바뀜, 선택 버튼 중복 없음 | 알려짐(의도) |
| 보완 5: 가득 찬 "레퍼런스 추가" 비활성 스타일 | 확정 비활성과 같은 `rgba(55,56,60,0.16)` 글자 | 알려짐 — 반영 확인 |
| 보완 3 / ADR-005 E2: 변경 없는 재확정 차단 | D4 참조 | 알려짐 — 반영 확인 |
| ADR-005 D1-갱신: 폰트 3종 활성 | D3 참조 | 알려짐 — 반영 확인 |
| ADR-005 E3: `addToTray`·`removeFromTray` 삭제 | 테스트 305(보완 절 수치와 일치) | 알려짐 |

## 8. 주의·가정
1. **스크린리더 미청취**: A-4·A-9는 DOM 관찰(MutationObserver, AX 트리)로만 확인했다. VoiceOver 실제 읽기 순서·중복 읽기는 미확인.
2. **회수(S-08) 미재현**: 픽스처 6개가 모두 `internal`/`licensed`라 브라우저에서 회수 열을 만들 수 없다. D-QA02의 흐린 셀 비율은 같은 토큰의 실측값으로 추정(L2).
3. **aria-disabled 버튼 조작**: ego-browser `click`/`focus`가 `aria-disabled` 요소를 "disabled"로 보고 거부해, DOM `focus()` 뒤 실제 키 입력(Enter)으로 눌렀다.
4. **1280 가로 스크롤 중 A열 가림**: 표를 오른쪽으로 스크롤하면 고정 행 머리글 아래로 A열 버튼이 들어가 도구 클릭이 막혔다(`<th> intercepts pointer events`). sticky 열의 정상 동작으로 보고 결함으로 세지 않았다. 버튼을 `scrollIntoView` 한 뒤 조작했다.
5. **관찰(결함 아님)**: 1280·6개에서 표 영역은 약 2.5열만 한 번에 보인다(패널 폭 고정). SPEC 5.1 허용 범위.
6. 턴 예산 안에서 측정을 마쳤다. 미측정: 교체 알림 문구("A → C")의 브라우저 기록(단위 테스트 AC-05로 대체), 실패 alert 트리거.

## 9. 서버 종료 확인
`kill 62190` 뒤 `lsof -nP -iTCP:4337 -sTCP:LISTEN` → 출력 없음, exit 1 (2026-09-26 02:07:47 KST). ego-browser TaskSpace 78은 뷰포트 override 해제 후 `finish({ keep: [] })`로 닫음.

## 10. 커밋
`docs/qa/1a-03/`만 로컬 커밋, push·원격 없음. 해시는 최종 응답과 `git log -1 -- docs/qa/1a-03/REPORT.md`로 확인(파일이 자기 커밋 해시를 담을 수 없음). `*.log`는 `git add -f`.
