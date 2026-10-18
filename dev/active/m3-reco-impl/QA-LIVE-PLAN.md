# M3-1 QA LIVE PLAN — 2차 실화면 run 계획 (1차 run에서는 실행하지 않음)

대상: 1차 QA 대상과 같은 tip(`62d3aec2` + QA 문서 커밋만). 도구: **ego-browser(Ego Lite)만** — Playwright·Puppeteer·claude-in-chrome 금지(`~/.claude/rules/verification.md`).
정본: `docs/design/m3/RECO-SPEC.md` r1 + 7a · RECO-AC-08·10·12·13·16 [V] 항목 · E2E-S4(승인 → 초안 반영).

## 0. 준비 (예상 2턴)
1. `cd app && npm run build && npm run preview -- --port 4399` — PNG·kitCss가 아니어도 preview 기준으로 통일(메모리 `png-export-needs-preview`). 리슨 확인 `lsof -iTCP:4399 -sTCP:LISTEN`.
2. **이동은 앱 안 클릭으로만** — 주소창 이동·새로고침 금지(메모리 store가 초기화돼 되돌리기 기록·보드가 사라진다, 메모리 `browser-memory-store-reset`). 시작 URL 1회만 `/catalog`.
3. 폭 전환은 CDP: `page.cdp('Emulation.setDeviceMetricsOverride', { width: 390|1280, height: 900, deviceScaleFactor: 1, mobile: false })`, 끝나면 `clearDeviceMetricsOverride`.
4. 증거: 단계마다 스크린샷 + `document.documentElement.scrollWidth > clientWidth` 값 + 접근성 트리 발췌를 `logs/qa-live-<폭>.txt`에 남긴다.

## 1. 주 흐름 — 1280 먼저, 390 반복 (폭당 예상 5~6턴)

| # | 조작(앱 안) | 확인 | AC |
|---|---|---|---|
| 1 | `/catalog`에서 업종 칩 "의료" · 레일 "콘텐츠 목적" 예약 · 타깃 "가족" 고르기 | 전체 탭 카드 목록 · 네트워크에 `RecoView-*.js` 요청 0 | AC-14(a) 실측 보강 |
| 2 | 히어로 "추천 받기" | h1 "추천" · 포커스가 결과 영역 · 스켈레톤(aria-busy) → 카드 3장 · `RecoView-*.js` 요청 1 · `RecoApply-*`·`recoApplyFlow-*` 요청 0 | AC-08 · 14(a) |
| 3 | 1~3위 카드 읽기 | 순위·총점("NN점")·근거 요약 3개 " · " 연결 · 1위 gen-medical-1(60) · 2위 gen-medical-3(60) · 3위 gen-beauty-3(45) — 단위 테스트 고정값과 같은지 | AC-01·04 · T-REC-01 |
| 4 | 1위 "근거 펼치기" | aria-expanded true · 7항목 · 접근성·성능 "미측정" · 포커스 버튼 유지 · 카드 가로 넘침 0 | AC-04·06·13 |
| 5 | "추천 2개 더 보기" | 카드 5장 · 4위 gen-education-4 · 5위 ref-c · 버튼 사라짐 | RQ-07 A |
| 6 | 1위 "이 추천 적용" → 대화상자 | 바뀌는 선택 목록(행 · 지금 → 새) · 포커스 "취소" · 대화상자 넘침 0 · 이때 `RecoApply`·`recoApplyFlow` 요청 1 | AC-10 · 13 · 14(a) |
| 7 | "취소" | 대화상자 닫힘 · 포커스 "이 추천 적용" 복귀 · 트레이 필 개수 불변 | AC-09·10 |
| 8 | 다시 "이 추천 적용" → "적용" (키보드만: Tab·Enter) | "적용됨" + status "…추천을 적용했습니다." 1회 · 포커스 "되돌리기" · 트레이 필 +1 | AC-10·12·13 |
| 9 | 트레이 "비교 보드 열기" → `/compare` | 초안 패널이 그 레퍼런스 선택(10행)을 보임 | AC-10 · E2E-S4 |
| 10 | 앱 안 "뒤로"(브라우저 뒤로 버튼 = history, 새로고침 아님) → `/catalog?tab=rec` | 1위 카드에 "적용됨"·"되돌리기" 그대로(세션 기록) | SPEC 4.3 · REPORT 8절 |
| 11 | "되돌리기" (키보드만) | status "…되돌렸습니다." 1회 · 포커스 "이 추천 적용" · 다시 `/compare` → 초안이 적용 전 선택 · 열 구성 적용 전과 같음 | AC-10·13 |

## 2. 빈·실패·경계 상태 (폭 1280 1회 + 390 스크린샷만, 예상 3~4턴)

| # | 조작 | 확인 | AC |
|---|---|---|---|
| E1 | 업종·목적 모두 해제(타깃만) 뒤 추천 탭 | "업종이나 목적을 고르면…" · "업종 고르기" → 업종 칩 포커스 · "목적 고르기" → (390이면 레일 열림) "콘텐츠 목적" 첫 체크박스 포커스 | AC-08 |
| E2 | 업종 "리테일"만 | 결과 0 → 근거 부족 문구(SPEC 2.3-3) | AC-01 |
| E3 | 업종 "피트니스"만 | 결과 1 → "조건에 맞는 추천이 1개뿐입니다." · 더 보기 버튼 없음 | RQ-07 |
| E4 | 화면 청크 실패 | DevTools 차단(CDP `Network.setBlockedURLs` `*RecoView-*`) 후 앱 안 "추천 받기" → alert "추천을 불러오지 못했습니다." + "다시 시도" → 차단 해제 → 다시 시도 → 카드 | AC-12 · 3.4 |
| E5 | 적용 청크 실패 | `*RecoApply-*` 차단 후 "이 추천 적용" → alert "추천을 적용하지 못했습니다." · "적용됨" 0 · 트레이 불변 | AC-16 |
| E6 | 열 6 꽉 참 | 카드 6개를 비교 추가 → 미포함 추천 카드의 적용 버튼 aria-disabled + 한도 문구 | AC-11 |
| E7 | 적용 뒤 다른 카드 "비교 추가" | 되돌리기 aria-disabled + "적용 뒤 보드가 바뀌어 되돌릴 수 없습니다." | AC-11 |
| E8 | 결과가 바뀌는 필터(업종 → 뷰티) / 바뀌지 않는 필터(레이아웃) | status "추천이 N개로 바뀌었습니다." 1회 / 알림 0 | AC-12 |

- 저장 실패(savePicks reject)·revision 충돌은 메모리 저장소라 실화면에서 만들 수 없다 → 단위 테스트(`CatalogPageReco.test`) 증거로 갈음, 2차 REPORT에 그 사실을 적는다.

## 3. 판정 기준 · 예상 턴
- FAIL: 가로 넘침 1px 이상 · 키보드만으로 적용·되돌리기 불가 · 적용 전 트레이·보드 변화 · "적용됨"이 저장 전 표시 · status 중복/누락 · 되돌리기 뒤 `/compare` 초안이 적용 전과 다름.
- PASS with notes: 시각 차이(목업 대비)·문안(Hemingway 임시)·SPEC 대응표 차이.
- 예상 총 턴: 준비 2 + 주 흐름 1280 6 + 390 6 + 상태 4 + REPORT 2 = **약 20턴**(추정 — Ego Lite 호출 1회에 여러 단계를 묶는 기준, 실패 재현이 생기면 +5).
