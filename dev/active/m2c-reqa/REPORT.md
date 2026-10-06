# M2C-REQA REPORT — M2c 백로그 정리 재검 QA (T-5 · T-6 · 기준선 6장)

## meta
- 역할 QA(구현자와 분리) / Orca managed Claude Code / worktree m2c-reqa / base `25687fd` · 2026-10-06
- 서브에이전트 0 · 앱/테스트/docs/design/lock/scripts·다른 레인 폴더 수정 0 · 쓰기는 `dev/active/m2c-reqa/`만 · push/merge/삭제 0 · 결함은 고치지 않음
- 서버: dev 4337(PID 64800, cwd = 이 worktree `app`)·정적 4339(PID 65524, python http.server, cwd = 이 폴더) 모두 127.0.0.1 → PID·cwd 확인 후 종료 → **4337/4339 리슨 0**. main 5480(PID 82062)은 리슨 확인만, 무접촉
- Ego Lite: 시작 전 `listTaskSpaces()` = `[]` → space 80("m2c-reqa qa")/p1만 사용. 끝에 `finish({keep:[]})` → `{"spaceId":80,"closedSpace":true,"keptManagedLabels":[],"closedManagedLabels":["p1"],"preservedUnmanagedCount":0}` · **`listTaskSpaces()` = `[]`** (`logs/ego-finish.txt`)
- 앱 이동은 앱 안 클릭만, **새로고침 0**(앱 첫 진입 `/` goto 1회). 폭 변경 = CDP `Emulation.setDeviceMetricsOverride`
- 턴: 약 55턴에서 새 측정 중단(60턴 규칙) → 창 닫기 → vitest → REPORT
- 판정 등급: PASS / 결함 / 환경 한계 / 미검증. N/A를 PASS로 쓰지 않음. **Safari·Firefox·실기기 미검증**

## 0. 결론 — **조건부 Go** (의견)
| 범위 | 판정 |
|---|---|
| 1 기준선 30×3 갱신·분류·결정성 | **PASS** |
| 2 비활성 폼 3폭 육안·체크박스 | **PASS** (체크박스 흐림 = 결함 아님, 근거 2절) |
| 3 T-5 QB-10 새 경로 | **부분 PASS + 결함 1** — 필드·캔버스·F2 캡션 PASS / **PNG 4/4 실패(E-1)** / 정적 HTML 개수 문구 **미검증**(게이트 차단) |
| 4 T-2·P3 실화면 | **PASS** (관찰 O-2·O-3) |
| 5 T-6 ① 1안씩 Tab | **PASS**(라디오) · "다시 그리기" **미검증**(시간 초과 유발 불가) |
| 5 T-6 ② ⑩ 내보내기 동일성 | **미검증**(PNG 실패·정적 HTML 게이트 차단) |
| 6 vitest·build | **PASS** 227파일 2048/2048 · build EXIT 0 |

조건: **E-1(PNG 실패) 원인 확정** — 이미지 잃기 전(정상 이미지 상태)에서 같은 문서 PNG가 성공하는지 대조 실측 후, 잃은 이미지 상태에서만 실패면 P1로 올려 수정, 환경(Ego Lite) 문제면 해소. 그 전까지 QB-10의 PNG 절반과 ⑩은 열린 상태다. P0 결함 0.

## 1. 기준선 30×3 (범위 1)
### 방법
- `dev/active/m2c-5b-qa/{s1-render30.mjs,s2-measure.mjs,s3-art-rects.mjs,pclassify.mjs,pdiff.mjs,shots.sh}` 사본. **원본 변경 0**. 사본 변경 = s1·s2·s3의 `DIR`과 `taskSpace(80)`만(ego-browser env 미전달)
- 이 레인 추가: `s3-form-rects.mjs`(정적 사본에서 `.kit-notice` ∪ `fieldset.kit-fieldset` rect + 계산 스타일) · `pclassify-form.mjs`(차이를 폼 자리 안/밖으로, 높이 바뀐 경우 자리 아래 행은 Δh 맞춰 비교) · `pshift-below.mjs`(자리 아래 차이가 순수 세로 이동인지)

### 결과
| 항목 | 결과 | 증거 |
|---|---|---|
| 실렌더 30/30 | PASS — 폴백 0·표식 0·에러 0 · 음성 대조 검출 true | `logs/s1-run.txt` · `logs/s1-render30.json` |
| 높이·넘침 | 90칸 가로 넘침 0 · 글꼴 2면 · 실행 중 애니메이션 0. m2c-5b 대비 높이 변화 2칸: contact--booking 390 **1044→1070**, contact--form 390 **881→926** (나머지 88칸 같음) | `logs/s2-heights.json` · `logs/s2-run.txt` |
| 새 기준선 | 90장 `baseline/` 2.5MB | `baseline/` |
| 결정성 | `baseline/` 대 `run2/` **diffPx 0 / 90** | `logs/determinism.txt` |
| m2c-5b 대비 | 차이 **6/90장 = contact--form·contact--booking × 1280·768·390**. 나머지 84장 diffPx 0 | `logs/vs-m2c5b.txt` |

### 분류표 (m2c-5b `baseline/` 대 새 `baseline/`)
| 파일 | 폼 자리(안내 ∪ fieldset) | 자리 안 차이 | 자리 밖 차이 | 밖 차이의 정체 |
|---|---|---|---|---|
| contact--booking-1280 | x568-1184 y157-732 | 25,427 | 5,674 (y801-867, footer 띠) | 아래 내용 **26px 세로 이동** — 이동 보정 시 0 |
| contact--booking-768 | x32-736 y258-833 | 26,963 | 4,650 (y902-968) | 26px 이동 — 보정 시 0 |
| contact--booking-390 | x16-374 y232-919 | 36,014 | 3,922 (y947-1042) | 46px 이동(마지막 링크 줄 14행만 45px — 반올림) — 보정 시 0 |
| contact--form-1280 | x568-1184 y157-681 | 21,076 | 5,674 (y750-816) | 26px 이동 — 보정 시 0 |
| contact--form-768 | x32-736 y258-782 | 22,488 | 4,650 (y851-917) | 26px 이동 — 보정 시 0 |
| contact--form-390 | x16-374 y232-775 | 31,085 | 1,297 (y822-863) | 46/45px 이동 — 보정 시 0 |
- 근거: `logs/classify-form.txt` · `logs/shift-below.txt` · `logs/shift-390-detail.txt`. 자리보다 **위·옆 차이 0**(밖 bbox가 모두 자리 아래에서 시작).
- 이동 원인 = 안내 상자에 생긴 안쪽 여백·경계(`.kit-notice` padding s3/s4 + stroke-1, `13d341a`) — 의도된 변경의 부수 효과. 390에서 안내 글이 좁아져 2줄이 되며 이동량 46px.
- 계산 스타일(`logs/form-rects.json`·`logs/s3-form-rects.txt`): 입력칸·textarea·버튼 `dashed 1px` · 버튼 배경 투명·글자 ink · 안내 `solid 1px` · 모든 요소 opacity 1 · fieldset `:disabled` true · 안내는 fieldset 밖(`aria-describedby` 대상)
- **결함 후보 0.** 관찰 O-1: booking 390 문서 높이는 +26뿐인데 내용 이동은 +46 — m2c-5b 쪽 문서 끝에 20px 빈 줄이 있었고 그만큼 흡수(시각 차이는 이동 보정 시 0이라 결함 아님)

## 2. 비활성 폼 3폭 육안 (범위 2 · K-AC-37)
| 폭 | 판정 | 증거 |
|---|---|---|
| 1280 | PASS — 안내 실선 상자 · 입력칸·textarea·"문의하기" 점선 · 버튼 면 없음 · 글자 흐림 0 | `shots/form-contact--form-1280.png` · `form-contact--booking-1280.png` |
| 768 | PASS — 같음 | `shots/form-contact--form-768.png` · `form-contact--booking-768.png` |
| 390 | PASS — 같음, 안내 2줄 · 가로 넘침 0 | `shots/form-contact--form-390.png` · `form-contact--booking-390.png` |
- 6칸 모두 `[data-site-root]` 안 opacity≠1 요소 0 · filter 요소 0 (`logs/form-visual.json`)
- **동의 체크박스 흐림 판정 = 결함 아님.** 화면에서 체크박스는 브라우저 기본 disabled 모양(옅은 회색 면)으로 그려지지만 ① 계산 스타일 opacity 1·조상 opacity 전부 1·filter 0 — 앱이 흐리게 만든 것이 아님 ② m2a SPEC r3 K1-6 3-2: "체크박스는 **브라우저 기본 그대로**" — 흐림 금지(회색·불투명도 0)는 앱 스타일에 대한 규칙이고 체크박스는 명시적으로 브라우저 기본에 맡김 ③ m2a SPEC 736행 관찰: "비활성 체크박스는 브라우저 기본으로 흐리게 그려진다 — 비활성 요소는 WCAG 1.4.11 예외라 실패 아님" ④ 동의 문구(label) 글자색 = ink(rgb 26,26,26), 흐림 0

## 3. T-5 QB-10 새 경로 (범위 3)
흐름(앱 안 클릭만): `/catalog` → 헤어살롱·카페 비교 추가 → 비교 보드 "B 모던 카페 전부 선택" → 프로필 확정 v1 → 3안 만들기 → A안 선택 → "A안으로 편집 시작" → `/studio/project-1` → Hero 이미지(f11) + About 이미지(f12, 대체텍스트 "세로 패턴 그래픽") **2장** → 툴바 "프로젝트로 돌아가기"(`a[href=/projects]`) → `/projects` "모던 카페 브랜드 프로젝트 편집기 열기" → `/studio/project-1`

| 확인 | 판정 | 실측 | 증거 |
|---|---|---|---|
| 같은 프로젝트 복귀 | PASS | `/projects` → 같은 `/studio/project-1`, 문서(섹션·글) 유지 | `logs/t5-flow-b.txt` · `shots/t5-projects.png` |
| 필드 문구 | PASS | Hero·About 이미지 편집 모두 "이미지를 다시 골라 주세요" + "이미지 고르기" | `logs/t5-flow-c.txt`·`t5-flow-e.txt` · `shots/t5-field-Hero.png`·`t5-field-About.png` |
| 캔버스 자체 그래픽 | PASS(육안) | Hero 원 패턴·About 사선 그래픽 — 사용자 이미지 0 | `shots/t5-after-return-canvas.png` (떠나기 전 `t5-before-leave.png`) |
| F2 캡션 N장 | PASS | "시안 (F2) — … 다시 골라야 하는 이미지 **2장**은 자체 그래픽으로 보입니다." | `logs/t5-flow-b.txt` |
| PNG 개수 문구 | **결함 E-1** | "PNG 내려받기" 4회 모두 1초 안 `role=alert` "PNG를 만들지 못했습니다 — 다시 눌러 주세요" · 앱 이벤트 `png_failed reason=INFRA` · 콘솔 오류 0 | `logs/t5-flow-d.txt`·`t5-flow-e.txt`·`t5-png-reason.txt` · `shots/t5-png-notice.png` |
| 정적 HTML 개수 문구 | **미검증** | "정적 HTML 내보내기" `aria-disabled=true` — 차단 4건(대비 AA C-5 muted/bg 3.8:1 · 대체텍스트 Hero · SEO 메타 2). 게이트를 풀려면 프로필 보정·페이지 정보 편집이 필요해 턴 안에 못 함 | `logs/t5-flow-c.txt` |
- 스냅샷 복원 경로는 미구현이라 제외(BRIEF)

## 4. T-2·P3 실화면 (범위 4 · 1280, `logs/t2-flow.txt`)
| 단계 | 판정 | 실측 | 증거 |
|---|---|---|---|
| 넣기 | PASS | f11 → "1500 × 1000 · WebP 28KB" · status "이미지를 넣었습니다 대체텍스트를 적어 주세요" | 로그 PICK1 |
| 대체텍스트·장식 | PASS | 입력 "가로 패턴 그래픽" → 장식 체크 시 입력 `aria-disabled=true` | `shots/t2-1280-before-replace.png` |
| 바꾸기 | **PASS** | f12 → "1000 × 1500 · WebP 30KB" · 대체텍스트 **빈칸** · 장식 **해제** · status "이미지를 바꿨습니다 대체텍스트를 다시 적어 주세요" | `shots/t2-1280-after-replace.png` |
| 지우기(키보드 Enter) | **PASS** | 대체텍스트 빈칸 · status "이미지를 지웠습니다" · 포커스 = BUTTON "이미지 고르기" · 메타 없음 | `shots/t2-1280-after-clear.png` |
| 폭 1280→768→390→1280 펼침 | **PASS** | 세 번 모두 `details.open=true`. 768·390은 탭 배치 기본 탭 "섹션"이라 패널이 안 보이고, "편집" 탭을 누르면 펼친 채 보임 | `shots/t2-width-{768,390,1280}.png` · `t2-768-edit-tab-open.png` |
| 도움말 문구 | PASS | "끄면 이미지 자리 없이 섹션 배경만 보이고 대체텍스트 검사에서 빠집니다"(B-M2C-05) · "이미지에 담긴 내용을 한 문장으로…" · "고른 이미지는 이 탭의 편집기 안에서만 보관됩니다 — 편집기를 나가거나 새로고침하면 다시 골라야 합니다" | 로그 HELP |

## 5. T-6 (범위 5 · `logs/t6-tab-order.txt`)
### ① 비교 대화상자 Tab 순서 실측
| 폭(모드) | Tab 순서(열 때 포커스부터) | 판정 |
|---|---|---|
| 1280(3열) | 폭 라디오 "데스크톱" → 닫기 → 영역 "3안 미리보기 영역" → A·B·C안 선택 → (브라우저 UI) → 폭 라디오 | PASS(M2B-6 실측과 같음) |
| 1024(1안씩) | 폭 라디오 → **"보는 안" 라디오 A안(선택)** → 닫기 → 영역 → A안 선택 → (브라우저 UI) → 폭 라디오 | **PASS** — SPEC-COMPARE3 r3 4 순서와 일치 |
| 768·390(1안씩) | 1024와 같음 · 가로 넘침 0 | PASS |
- 라디오 그룹 모두 로빙(선택 항목만 tabIndex 0). Shift+Tab 역순 일치. iframe 진입 0. 닫기(Esc) → 포커스 "3안 실제 화면으로 비교" 복귀(3폭)
- **"다시 그리기" 위치 = 미검증(환경 한계)**: 모든 열이 제때 그려져 버튼이 생기지 않음(`redrawButtons 0`). 시간 초과를 앱 안 조작으로 만들 수 없음 — DOM 순서(L1)만 유효
- `shots/t6-dialog-{1024,768,390}.png`

### ② ⑩ 내보내기 동일성 — **미검증**
- 캔버스 vs 정적 HTML vs PNG 비교 불가: PNG는 E-1로 실패, 정적 HTML은 게이트 차단(3절). 7변형 변형별 실측 0
- 간접 근거만: 기준선 30변형 정적 사본 = 제품 serialize + `buildStaticHtml` 경로로 렌더 문서와 같은 마크업(30/30 실렌더). 이것은 "정적 HTML = 렌더 문서"의 일부 근거일 뿐 PNG 동일성은 아님 → PASS로 올리지 않음

## 6. 결함·관찰
| ID | 심각도 | 내용 | 재현 | 증거 |
|---|---|---|---|---|
| E-1 | **P2(원인 미확정, P1 가능)** | 잃은 이미지 2장 상태(편집기 이탈·복귀 뒤)에서 "PNG 내려받기"가 4/4 즉시 실패 — `png_failed reason=INFRA`(PngError 아닌 예외 또는 INFRA). 콘솔 오류 0. **대조(이미지 잃기 전 PNG) 미실측** — 떠나기 전엔 PNG 버튼이 `aria-disabled`(준비 전)였고 턴 상한으로 대조 못 함 → 잃은 이미지 경로 탓인지 Ego Lite 환경 탓인지 미확정 | 3절 흐름 → 복귀 → "PNG 내려받기" | `logs/t5-png-reason.txt` · `t5-flow-d/e.txt` · `shots/t5-png-notice.png` |
| O-1 | 관찰 | booking 390 문서 높이 +26 대 내용 이동 +46(5b 쪽 끝 빈 줄 20px 흡수) | 1절 | `logs/shift-*.txt` |
| O-2 | 관찰(기존 동작) | 탭 배치(768·390)로 바뀌면 선택 탭이 "섹션"으로 — 펼침은 유지되나 편집 위치는 한 번 더 눌러야 보임(M2C-P3 REPORT 49행 "범위 밖 기존 동작") | 4절 | `shots/t2-width-768.png` |
| O-3 | 관찰 | 폭 변경 재마운트 뒤 패널 status 비워짐·포커스 BODY(M2C-P3 REPORT 20행 의도 범위 부작용) | 4절 END 줄 | `logs/t2-flow.txt` |
| O-4 | 관찰 | 편집기 복귀 시 "이미지 편집" 펼침은 닫힌 채 시작(편집기 단위 상태 — 사양상 문제 아님으로 봄) | 3절 | `logs/t5-flow-b.txt` |

## 7. 회귀 게이트 (범위 6)
- `npx vitest run`(기본 1회): **Test Files 227 passed · Tests 2048 passed · EXIT 0** · 33.2s (`logs/vitest.txt`)
- `npm run build` **EXIT 0** (`logs/build.txt`)

| 경로 | 첫 화면 / 예산 | 진입 직후 자동 로드 포함 / 예산 |
|---|---|---|
| /catalog | 99.65 / 100 | 102.03 / 125 |
| /references/:id | 96.99 / 100 | 99.38 / 125 |
| /compare | 98.83 / 100 | 121.69 / 125 |
| /profile | 99.61 / 100 | 119.10 / 125 (3안 있음 121.56) |
| /projects | 94.01 / 100 | 100.29 / 125 |
| /studio/:projectId | 91.75 / 100 | 127.05 / 128 (M2c 기준선 127.36 + 0.03, 멈춤 > 127.39) |
| render.html | JS 84.19 / 90 · CSS 8.85 / 30 | — |
- 조작 뒤 청크(gzip): ImageSlotPanel 4.41(m2c-5b 3.33 → P3 변경분) · ingest 2.65 · exportFlow 3.26 · pngCapture 9.97

## 8. fixture
- `fixtures/gen-fixtures.mjs` = m2c-5b 사본(DIR·space만 변경). 24개 재생성, `MANIFEST.json`이 m2c-5b MANIFEST와 **완전히 같음(24/24)**. 바이너리 `.gitignore`

## 9. 책임·환경
- 실측: 데스크톱 Chrome 계열 Ego Lite 1종 + 기준선은 macOS Google Chrome headless. **Safari·Firefox·모바일 실기기 = 미검증**
- 좁은 폭은 CDP 뷰포트 덮어쓰기(창 크기 아님). 캔버스(교차 출처 sandbox iframe) 반영은 화면 캡처로 판정
- 결함은 고치지 않았다. 다음 레인 권고: E-1 대조 실측(새 프로젝트에서 이미지 없이 PNG → 이미지 넣고 PNG → 이탈·복귀 뒤 PNG) + 정적 HTML 게이트를 연 문서로 QB-10 개수 문구·⑩ 재검
