# QA-PROFILE-VISUAL-ALIGN — REPORT

- 판정: **PARTIAL** — 키보드 순서·디스클로저·칩 접근 이름은 통과. "보정값 쓰기" 알림 누락(D1)과 문서 제목 미갱신(D2)이 결함.
- 대상: worktree `profile-visual-align` HEAD `2f86f64`(구현 `8b9476c`), preview `127.0.0.1:4345`
- 도구: ego-browser(Ego Lite) + CDP(`Emulation.setDeviceMetricsOverride`, `Accessibility.getFullAXTree`). Playwright 미사용.
- 흐름: /catalog → 동네 치과 클리닉·부티크 법률사무소·모던 카페 브랜드 비교 추가 → "비교 보드 열기" → A 전부 선택 + 팔레트 C → "프로필 확정 (v1)" → `/profile/profile-1` → "3안 만들기 (v1)" → "B안 선택".
  - `page.goto('/compare')` 같은 새로고침 이동은 메모리 상태를 잃어 빈 비교 보드가 뜸. 앱 안 링크로만 이동함(메모리 저장소 설계상 예상 동작, 결함 아님).

## 항목별 결과
- [x] 1. build + preview — `npm run build` exit 0(번들 예산 안: /profile 첫 화면 99.54KB/100KB). preview PID 19004(npx 부모 18968).
- [x] 2. 1280×900 Tab 순서 전체 — **PASS**. 25개 정지. 건너뛰기 링크 → 헤더 → "비교 보드에서 선택 바꾸기" → 왼쪽 패널(값 전체 보기 → 팔레트 값 보기 → 대비 상세 → 보정값 쓰기 → 전역 조정 라디오 4그룹 → 조정 저장) → 3안(카드별 이 안 선택·상세 A→B→C) → B안으로 편집 시작 → 3안 비교 표 보기. 기대 순서와 같음. 모든 정지점에서 포커스 스타일(outline/box-shadow) 있음, 뷰포트 안. 증거 `tab-1280.txt`, 보정 후 `tab-1280-after-fix.txt`.
  - "버전" 영역은 조작 요소가 없어(v1 · 첫 버전, "비교할 이전 버전이 없습니다") Tab 정지가 없음. 기대 목록의 "버전"은 현재 상태에서 해당 없음.
- [x] 3. 디스클로저 — **PASS**. 값 전체 보기·팔레트 값 보기·대비 상세·B안 카드 "상세" 4종 모두 Enter/Space로 열고 닫힘. 네이티브 `<details>/<summary>`라 `aria-expanded` 속성은 없고, 접근성 트리의 `expanded`가 true↔false로 바뀜(DisclosureTriangle). 포커스는 summary에 유지. 증거 `keyboard-flow.txt`.
- [x] 4. 보정값 쓰기 키보드 흐름 — **FAIL(D1)**. Enter로 실행됨. 확인 단계 없이 즉시 적용. 포커스는 같은 버튼에 유지(`aria-disabled=true`, 이름이 "보정값을 썼습니다 (보조 글자 muted)"로 바뀜). `role=status` "프로필 알림"은 이전 문구 "B안을 선택했습니다" 그대로이고 `role=alert`도 없음. 이후 "조정 취소" 버튼이 Tab 순서(조정 저장 뒤)에 생김.
- [x] 5. 팔레트 칩 5개 — **PASS**. `<ul aria-label="역할 스와치">` 안 li 5개, 색 칸은 `aria-hidden`, 보이는 캡션 primary·surface·ink·muted·bg가 접근성 트리에 텍스트로 노출. 색 단독 전달 아님. 1280·390 모두 캡션 잘림 없음.
- [x] 6. 390×844 Tab 앞 15개 — **PASS(경미 D3)**. 한 열 흐름(헤더 → h1 링크 → 패널 디스클로저 → 보정값 → 라디오)과 같음. 단 헤더 1행 "새 프로젝트"가 2행 메뉴 뒤에 옴. 증거 `tab-390.txt`.

## 결함
### D1 (P2) 보정값 쓰기 결과가 알림 영역으로 전달되지 않음
- 재현: 1280, /profile/profile-1(3안 생성·B안 선택) → Tab 12번 "보정값 쓰기" → Enter.
- 기대: 적용 결과("보정값을 썼습니다 · 조정을 저장하면 새 버전에 적용") 가 `role=status`로 안내됨. 브리프는 확인 단계도 예상함.
- 실제: 알림 영역은 "B안을 선택했습니다" 그대로. 확인 단계 없음. 버튼 이름 변경과 비라이브 문구("쓴 보정값은 조정을 저장하면 새 버전에 적용됩니다")에만 의존. 포커스 중인 버튼 이름 변경은 스크린리더가 읽지 않을 수 있음.
- 참고: 되돌리기 수단으로 "조정 취소"가 생기므로 확인 단계 부재 자체는 설계 의도일 수 있음 → 확인 단계 여부는 Jarvis 판단 필요, 알림 누락은 결함.

### D2 (P2) /profile 문서 제목이 "비교 보드 · Design Studio"로 남음
- 재현: 비교 보드에서 "프로필 확정 (v1)" → `/profile/profile-1` 이동 → `document.title` 확인.
- 기대: 프로필 화면 제목(예: "디자인 프로필 · Design Studio"). h1은 "디자인 프로필".
- 실제: 이동 직후와 3안 생성·선택 뒤 모두 "비교 보드 · Design Studio". 화면 이동 알림·탭 제목이 틀림(WCAG 2.4.2). 이번 변경에서 생긴 것인지는 main 비교 안 함(미검증).

### D3 (P3) 390에서 헤더 Tab 순서가 보이는 순서와 어긋남
- 재현: 390×844, 문서 처음부터 Tab.
- 기대: 1행(로고 → 새 프로젝트) → 2행 메뉴, 또는 보이는 위→아래 순서.
- 실제: 로고(y=10) → 메뉴 4개(y=52) → 새 프로젝트(y=10, x=211). DOM 순서를 유지한 채 CSS로 줄바꿈된 결과로 보임. 공통 헤더라 이 브랜치 범위 밖일 수 있음.

### D4 (P3) 보정 후 배너 문구가 갱신되지 않음
- 실제: 보정값 쓰기 뒤 요약은 "통과 4 · 미달 0"인데 배너는 "보조 글자(muted) 대비가 배경에서 3.8:1로 기준 4.5:1보다 낮습니다…"를 계속 보여줌. 저장 전 상태라 의도일 수 있으나 요약과 모순되어 보임.

## 미검증
- 포커스 링의 실제 시각 대비: computed style(outline/box-shadow 존재)로만 판정. 정지점별 스크린샷 대조는 안 함.
- 스크린리더 실청취(VoiceOver 등) 안 함 — 알림은 DOM/AX 트리로만 판정.
- 전역 조정 라디오 그룹의 방향키 이동, "조정 저장 (v2)"·"조정 취소" 실행, 편집 시작 이후 흐름.
- D2가 main(`5562dc2`)에도 있는지 비교 안 함.

## 증거 파일
- `tab-1280.txt` · `tab-1280-after-fix.txt` · `tab-390.txt` · `keyboard-flow.txt` (이 폴더)

## 종료
- 자기 프로세스만 종료: `kill 19004 18968` (vite preview, npx 부모).
- `lsof -nP -iTCP:4345 -sTCP:LISTEN` → 출력 없음, exit 1 (LISTEN 없음).
- ego-browser TaskSpace 16 `finish({ keep: [] })`, 뷰포트 오버라이드 해제.
- 코드 수정 없음. 쓰기는 `docs/qa/profile-visual-align/`만. push·병합·삭제 안 함.
