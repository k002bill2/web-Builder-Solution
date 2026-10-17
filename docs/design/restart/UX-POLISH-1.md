# UX-POLISH-1 — 편집기 알림·390 상태 줄·폐기 대화상자 포커스 정리 명세 (B-RS-10~13)

- 상태: **r0 초안 — 코드 근거만(실화면 관찰 전).** 실화면 보강은 r1에서 7절에 덧붙인다. 구현 승인 아님 · 앱 코드 0.
- base origin/main `494a7c6f` · 작성 Designer(Orca Claude Code) · 회수 Jarvis · BRIEF `dev/active/rs8-ux-polish-spec/BRIEF.md`.
- 정본: INTEGRATE-6 r2 8.4(접근성) · LV-2(폐기 시간 초과) · UX-5 UX5-AC-01·06 · E-AC-33(편집 알림 1개). 이 문서는 정본을 **수정하지 않는다** — 문장 정정이 필요하면 6절 "정본 정정 제안"에 올린다.
- 표기: **[L1]** 코드·문서 직접 확인 · **[L2]** 실화면 관측 · **[L3]** 추정.

## 0. 요약 (★ = 권고)

| 항목 | 문제 | ★ 결정안 | 대안 | 예산 |
|---|---|---|---|---|
| B-RS-10 | stale + 폐기 시간 초과 때 글자 있는 alert 2개(상태 줄 · 대화상자) | ★ **고치지 않음(수용)** + 원칙 문장 정정 — showModal 중 바깥 alert는 inert라 낭독 대상이 1개. "alert 1곳" = **편집기 셸 1곳 + 열린 모달 대화상자 안 1곳** | 대화상자 열 때 셸 alert 글자 비우기 | 0 |
| B-RS-11 | 편집기 `role=status` 2개(편집 알림 + `PngSave.tsx:76`) | ★ **PngSave 성공 문장을 편집 알림으로 올림**(`onAnnounce`) · PngSave `role=status` 제거 | 수용 + E-AC-33 예외 명시 | 진입 +0.01~0.03 [L3] |
| B-RS-12 | 390(탭 배치)에서 상태 줄·"버리고 새로고침"이 스크롤에 따라 화면 밖 | ★ **탭 배치 툴바 `sticky top-0`**(h1·저장 상태 줄 고정) | reason 진입 때 상태 줄 1회 `scrollIntoView` | 진입 +0.00~0.01 [L3] |
| B-RS-13 | 폐기 대화상자 Tab 2회째 `activeElement` = BODY | ★ **고치지 않음(표준 동작 · 수용)** + UX5-AC-06 문장 정정 | 수동 Tab 순환(keydown 가로채기) | 0(조작 뒤 청크) |

## 1. live region 원칙 (이 문서의 해석 — 정본과 대조)

정본 문장 [L1]:
- INTEGRATE-6 8.4: "alert = `SaveStatus` 1곳, status = 편집 알림 1곳(UX5-AC-01)."
- INTEGRATE-6 LV-2: "시간 초과면 **대화상자 안 alert** '버리지 못했습니다 — 변경은 그대로 있습니다' · 포커스 '취소' 유지".
- UX5-AC-01: "alert는 `SaveStatus` 1곳, status는 편집 알림 1곳이다(E-AC-33 유지)."
- 기존 대화상자 관례: `RestartDialog.tsx:4` "결과 알림은 대화상자 안 `role=alert` 한 자리(showModal 중 바깥은 inert)" · `CandidatesSection.tsx:45` 같은 취지.

→ 8.4와 LV-2가 이미 "셸 alert 1곳 + 대화상자 안 alert"를 함께 규정한다. 충돌이 아니라 **범위가 다른 두 문장**이다. 이 문서는 다음으로 읽는다(P-1~P-3):

- **P-1 (셸)**: 편집기 셸(대화상자 밖) 안 `role=status` = 편집 알림 1개 · `role=alert` = `SaveStatus` 1개. 셸 안 다른 부품은 알림을 `onAnnounce`로 올린다.
- **P-2 (모달)**: `showModal()`로 열린 대화상자는 바깥이 inert(접근성 트리에서 빠짐)라 **대화상자 안 결과 alert 1개**를 따로 둔다. 셸 alert와 동시에 DOM에 있어도 낭독 대상은 대화상자 쪽 1개다.
- **P-3 (예외 목록)**: 셸 안에서 P-1을 벗어나는 현재 자리 — `PngSave.tsx:76` status(B-RS-11) · `PngSave.tsx:80` alert(실패 문장) · `ImageSlotPanel.tsx:43` status(sr-only) · `ExportRetryAlert.tsx:13` alert · `ExportAfter.tsx:89,107` status · `ExportAfter.tsx:122` alert [L1 grep]. 이 문서는 BACKLOG 범위(B-RS-11 = `PngSave.tsx:76`)만 결정하고, 나머지는 **8절 후속 후보**로만 기록한다.

## 2. B-RS-10 — 폐기 시간 초과 때 alert 2개

**문제** [L1]: stale reason 동안 `SaveStatus.tsx:90` `role=alert`에 사유 문장(`source.text`)이 남아 있다(`alertText` = `state.failure === "error"`일 때 `source.text`). "버리고 새로고침" → 폐기 대화상자(`DiscardDialog.tsx`) → 시간 초과면 대화상자 안 `role=alert`(`DiscardDialog.tsx:61`, `DISCARD_TIMEOUT_TEXT`) 추가. DOM에 글자 있는 alert 2개, 내용 다름.

**사용자 영향**
- 스크린리더: 모달 열린 동안 셸 alert는 inert → 접근성 트리 밖 [L3 · 7절 실측 대상]. 낭독 = 대화상자 alert 1회. 셸 alert 글자는 stale 진입 때 이미 1회 낭독됨(변경 없음 → 재낭독 0).
- 키보드: 영향 0(alert는 포커스 대상 아님 · 포커스 "취소" 유지 — LV-2).
- 시각: 대화상자가 위에 덮여 셸 상태 줄 문장은 배경(가려짐 · backdrop).

**결정안**
- ★ **수용(고치지 않음)** — P-2. 이유: ① 낭독 중복 0(inert), ② 두 문장은 다른 사실(셸 = "왜 저장 못 하나", 대화상자 = "버리기 실패, 변경 남음")이라 하나로 합치면 정보 손실, ③ LV-2가 대화상자 안 alert를 이미 규정. 정본 정정(6절 C-1)으로 "alert 1곳"의 범위를 명시.
- 대안: 대화상자가 열린 동안 셸 alert 글자를 비움 → 닫으면 같은 글자를 다시 채우게 되어 **재낭독**(UX5-AC-01 위반) 위험 · `SaveStatus` 진입 청크 변경(예산 +). 기각 권고.

**상태표**

| 상태 | 셸 alert(`SaveStatus`) | 대화상자 alert | 접근성 트리상 낭독 대상 | 포커스 |
|---|---|---|---|---|
| stale, 대화상자 닫힘 | 사유 문장 | — | 셸 1 | 그대로 |
| stale, 대화상자 열림 · 진행 중 | 사유 문장(inert) | — | 0 | "취소" |
| stale, 시간 초과 | 사유 문장(inert) | `DISCARD_TIMEOUT_TEXT` | 대화상자 1 | "취소" 유지 |
| 시간 초과 뒤 "취소" | 사유 문장 | — (언마운트) | 셸 1(글자 불변 → 재낭독 0) | "버리고 새로고침" |

**수용 기준**
- UXP-AC-01 (단위): 시간 초과 렌더에서 대화상자 안 `role=alert` 1개 · 셸 `SaveStatus` alert 글자 불변(재렌더로 바뀌지 않음). 기존 `DiscardDialog`·`SaveStatus` 테스트 확인으로 충분.
- UXP-AC-02 (실화면): 시간 초과 상태 접근성 트리(CDP `Accessibility.getFullAXTree`)에서 `role=alert` 노드가 대화상자 안 1개만 나타난다(셸 alert는 inert로 제외). 실패 시 ★를 대안으로 재판정.

**구현 위치 힌트**: 코드 변경 0. 정본 문장만(6절 C-1).
**예산**: 0.

## 3. B-RS-11 — 편집기 `role=status` 2개

**문제** [L1]: 편집 알림 `StudioPanels.tsx:35`(`role=status aria-label="편집 알림"`) + `PngSave.tsx:76` `<p role="status">{state.done}</p>`(이름 없는 status, 비어 있어도 상시 DOM). E-AC-33·UX5-AC-01 "status 1곳" 문장과 어긋남.

**사용자 영향**
- 스크린리더: 랜드마크/라이브 영역 목록에 status 2개 — 이름 없는 하나는 무엇의 알림인지 알 수 없음. PNG 성공 문장 낭독 자체는 동작.
- 키보드·390: 영향 없음.

**결정안**
- ★ **편집 알림으로 올림**: `PngSave`에 `onAnnounce?: (text) => void`(SaveStatus와 같은 패턴) → 성공 문장(`done`)을 `setNotice`로. `PngSave.tsx:76` `role=status` 제거. 화면 글자 표시는 편집 알림 줄이 맡는다(390 탭 배치에서는 탭 목록 아래 — 검사 탭에서 누르면 같은 화면 위쪽에 보임 [L3 · 7절]). 실패 alert(`:80`)는 이번 범위 밖(8절).
- 대안: **수용** — PNG status는 버튼 옆 결과 자리라 위치 맥락이 있음. E-AC-33에 "결과 자리 status 허용" 예외 명시 + `aria-label="이미지 저장 알림"`으로 이름만 부여. 예산 +0.00.

**상태표**

| PNG 상태 | ★ 편집 알림 | ★ PngSave 영역 | 대안 PngSave status |
|---|---|---|---|
| 대기 | 직전 알림 | 버튼 "PNG 내려받기" | 빈 status |
| 진행 | 그대로 | "PNG 만드는 중…" aria-busy | 빈 status |
| 성공 | 성공 문장 1회 | 버튼 원상 | 성공 문장 |
| 실패 | 그대로 | 실패 alert(현행) | 그대로 |

**수용 기준**
- UXP-AC-03 (단위): 편집기 렌더(3 배치 각각)에서 `getAllByRole("status")` 중 편집기 셸 안 = 1개(`ImageSlotPanel` sr-only status는 8절 결정 전까지 계수 제외 — 또는 함께 결정).
- UXP-AC-04 (단위): PNG 성공 → 편집 알림 글자 = 성공 문장 · PngSave 안 `role=status` 0.
- UXP-AC-05 (실화면): preview에서 PNG 성공 뒤 접근성 트리 status 노드 = "편집 알림" 1개 + 글자 일치.

**구현 위치 힌트**: `app/src/components/studio/PngSave.tsx:40-53,76-78` · `StudioLayout.tsx:387`(`onAnnounce={setNotice}` 전달) · 테스트 `PngSave.test.tsx`(있으면) · 성공 문장 생성 = 캡처 청크(`features/studio/png/pngCapture`) 무변경.
**예산**: `PngSave`는 `StudioLayout` 청크(진입 closure — INTEGRATE-6 9.1) → prop 1개 + 호출 1줄. 추정 +0.01~0.03(정규화 기준선 128.66 · 허용 0.03 · 상한 129.13 — 여유 0.47 안) [L3, 미측정].

## 4. B-RS-12 — 390 상태 줄이 화면 밖

**문제** [L1]: `<1024`는 탭 배치(`StudioLayout.tsx` `mode === "tabs"`) — 루트 `flex flex-col`(높이 고정 없음) → **문서 스크롤**. 저장 상태 줄은 툴바 `subline`(`StudioToolbar.tsx:42` `basis-full`) 안, 툴바 `header`는 sticky 아님(`StudioToolbar.tsx:28`). 캔버스(탭 아래 `StructureCanvas scrollable={false}`)까지 내리면 상태 줄·"버리고 새로고침"이 위로 사라짐(QA 실측 y −410/−482 · BACKLOG). 가로 넘침 0.

**사용자 영향**
- 시각(390): stale·실패를 놓침 — 편집을 계속해도 저장 안 됨을 모른 채 진행. 해결 버튼까지 위로 스크롤 필요.
- 스크린리더: alert 1회 낭독은 됨(위치 무관). 영향 작음.
- 키보드: 버튼은 Tab 순서상 앞쪽 — 도달 가능(스크롤 이동 발생).

**결정안**
- ★ **탭 배치 툴바 sticky**: 탭 배치에서만 `header`에 `sticky top-0 z-10`(배경 `bg-background-normal` 이미 있음). h1·뒤로·저장 상태 줄·reason 버튼이 늘 화면 안. 비용: 390 세로 고정 점유 = 툴바 높이(1줄 + subline 1줄, 추정 약 5.5rem [L3 · 7절 실측]).
- 대안: **reason 진입 때 1회 `scrollIntoView({block:"nearest"})`** — 고정 점유 0, 그러나 진입 뒤 다시 내려가면 또 사라짐 · 입력 중 화면 밀기(NoticeRegion 원칙 "문장만 있는 알림은 밀지 않음"과 충돌 소지).
- 주의: sticky 툴바가 편집 알림(탭 목록 아래, 비 sticky)을 고정하지는 않는다 — 범위 밖.

**상태표**

| 스크롤 위치(390) | 현행 | ★ |
|---|---|---|
| 맨 위 | 상태 줄 보임 | 같음 |
| 편집 탭 중간 | 상태 줄 화면 밖 | 툴바 고정 보임 |
| 캔버스 영역 | 화면 밖(y −410) | 툴바 고정 보임 |
| 대화상자 열림 | 최상위 층 | 같음 |

**수용 기준**
- UXP-AC-06 (실화면): 390×844에서 문서를 끝까지 스크롤해도 저장 상태 줄 `getBoundingClientRect().top ≥ 0` · stale일 때 "버리고 새로고침" 화면 안 · 가로 넘침 0 유지.
- UXP-AC-07 (실화면): 1024·1280 배치 무변화(분할·3단은 이미 `h-dvh` 고정 툴바).
- UXP-AC-08 (단위, 선택): 탭 배치 툴바 class에 sticky 토큰 존재(가드 성격 · 하드코딩 금지 테스트 통과).

**구현 위치 힌트**: `StudioToolbar.tsx:28`(prop `sticky?` 또는 탭 배치 전달) · `StudioLayout.tsx` 탭 배치 `<StudioToolbar … subline>`.
**예산**: class 문자열 + prop 1개 → 추정 +0.00~0.01 [L3].

## 5. B-RS-13 — 폐기 대화상자 Tab 2회째 BODY

**문제** [L1/L2(QA)]: `DiscardDialog` = 네이티브 `dialog.showModal()` · 열 때 포커스 "취소"(`:22-23`). 포커스 가능 요소 2개(취소 · 버리기). Tab 1 = "버리기", Tab 2 = 문서 밖(브라우저 UI)으로 → `document.activeElement` = `BODY`. UX5-AC-06 "Tab은 대화상자 안에서 순환(`showModal`)" 문장과 어긋나 보임.

**표준 판정** — 7절(사양 인용)에서 확정. 코드 근거상 추정: Chrome 등은 모달 대화상자에서 Tab이 마지막 요소 뒤 **브라우저 UI(주소창 등)** 로 나갔다가 다음 Tab에 문서(=대화상자, 바깥은 inert)로 돌아온다. 문서 안 바깥 요소로는 가지 않는다 [L3].

**사용자 영향**
- 키보드: Tab 한 번 더(또는 Shift+Tab) 누르면 대화상자로 복귀. 바깥 편집기 요소 조작 불가(inert) — 위험 0.
- 스크린리더: 브라우저 UI로 나가는 것은 플랫폼 공통 동작.
- 390(모바일): 물리 키보드 드묾 — 영향 미미.

**결정안**
- ★ **수용(고치지 않음)** + UX5-AC-06 정정(6절 C-2): "Tab은 대화상자 밖 **문서 요소**로 가지 않는다(바깥 inert). 브라우저 UI 경유는 플랫폼 동작으로 허용." 이유: 플랫폼 표준 · 모든 대화상자(10곳 이상 `showModal`)에 공통 → 하나만 고치면 불일치 · 수동 트랩은 브라우저 UI 접근을 막아 오히려 반패턴.
- 대안: **수동 순환** — dialog `keydown` Tab에서 처음/끝 감싸기. 대화상자 전부에 공통 훅 필요(범위 확대) · 조작 뒤 청크라 진입 예산 0.

**수용 기준**
- UXP-AC-09 (실화면): 대화상자 열린 동안 Tab 반복(≥4회) 중 `activeElement`는 대화상자 안 요소 또는 `BODY`(브라우저 UI 경유)뿐 — 대화상자 밖 문서 요소 0. Shift+Tab 동일.
- UXP-AC-10 (실화면): Esc = 취소 · 닫힘 뒤 포커스 "버리고 새로고침"(UX5-AC-06 나머지 유지).

**구현 위치 힌트**: 코드 0. 정본 문장만.
**예산**: 0.

## 6. 정본 정정 제안 (Jarvis 반영 판단 — 이 문서는 수정하지 않음)

- C-1 (INTEGRATE-6 8.4 · UX5-AC-01): "alert는 `SaveStatus` 1곳" → "편집기 셸 안 alert는 `SaveStatus` 1곳 · `showModal` 대화상자는 대화상자 안 결과 alert 1곳(바깥 inert — LV-2 승계)".
- C-2 (UX5-AC-06): "Tab은 대화상자 안에서 순환(`showModal`)" → "Tab·Shift+Tab은 대화상자 밖 문서 요소로 가지 않는다(바깥 inert). 브라우저 UI 경유는 플랫폼 동작(HTML 사양 — 7절)".
- C-3 (E-AC-33 · B-RS-11 ★ 채택 시): "편집기 셸 안 status = 편집 알림 1개 · 부품 결과 문장은 `onAnnounce`로".

## 7. 실화면 관찰 (r1에서 채움)

(실화면 · 접근성 트리 · 사양 인용 — 관찰 후 보강)

## 8. 후속 후보 (이번 범위 밖 · 기록만)

- P-3 목록의 셸 안 추가 live region(`PngSave` 실패 alert · `ImageSlotPanel` sr-only status · `ExportRetryAlert` · `ExportAfter` status/alert) — "셸 alert/status 1곳" 원칙을 엄격 적용할지 결정 필요(사용자 결정 Q 후보).

## 변경 이력
- r0 (2026-10-18) — 코드 근거 초안.
