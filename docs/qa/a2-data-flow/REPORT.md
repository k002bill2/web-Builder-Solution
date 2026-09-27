# QA-A2-DATA-FLOW REPORT — a2 데이터 계층 흐름 독립 검증 (main `dd62865`)

- 일시: 2026-09-27 · 실행: Orca + Claude Code(메인 단독, 서브에이전트 없음) · 보고 대상: Jarvis
- 대상: `k002bill2/qa-a2-data-flow` (HEAD `c019205` = main `dd62865` + 브리프 커밋, 앱 코드 동일) · `127.0.0.1:4341`
- 도구: 선례 `docs/qa/a1-beta-flow/flow.mjs`를 복사·수정한 `flow.mjs` 1개(agent-browser CLI, 새 의존성 없음). `node docs/qa/a2-data-flow/flow.mjs <1280|390> docs/qa/a2-data-flow`
- 앱 코드·테스트·`design/`·`docs/design/` 수정 없음.

## 판정: **PARTIAL** — 데이터 계층(startDoc·멱등·DOC_EXISTS·변형 알림 문장·aria-busy)은 두 폭 모두 PASS. 화면 쪽이 그 결과를 쓰지 않는다(결함 3건: P2 1 · P3 2)

| 폭 | 단언 | PASS | FAIL | 관찰(판정 없음) |
|---|---|---|---|---|
| 1280 | 29 | 25 | 4 | 3 |
| 390 | 29 | 25 | 4 | 3 |

(스크립트 단언 기준. 표의 G5 (b) 문구 줄은 코드 정적 대조로 더한 것이라 이 수에 없다. 최종 실행 = G7을 맨 끝으로 옮긴 2차 실행, 결과는 1차와 같음)

FAIL 4건(두 폭 동일): G2 "문서 있음" 상태 · G5 변형 알림 화면 표시 · G3 DOC_EXISTS 알림 화면 표시 · G6 이동 뒤 포커스. 모두 **`/studio/:projectId` 화면이 `getDoc` 결과와 이동 state를 쓰지 않아서** 생긴다(결함 D1~D3). 저장소가 돌려준 값 자체는 SPEC과 맞다.

관찰 방법: 편집 시작 결과는 화면에 그려지지 않으므로 React Router 이동 state(`history.state.usr` = `StudioEntryState`)를 읽어 데이터 계층 결과를 확인했다.

## 단계별 결과 (1280 · 390 동일)

| 단계 | 단언 | 1280 | 390 | 증거(`flow.jsonl` 요약) |
|---|---|---|---|---|
| G1 | `/catalog` 렌더 · "비교 추가" ≥3 | PASS | PASS | 6개 |
| G1 | 레퍼런스 3개 담기 → "비교 보드 열기" → `/compare` | PASS | PASS | 동네 치과 클리닉 · 부티크 법률사무소 · 모던 카페 브랜드 |
| G1 | 요소 선택 · 첫 확정 캡션 · 라디오 없음 · 확정 버튼 활성 | PASS | PASS | "새 프로젝트 '동네 치과 클리닉 프로젝트'를 만듭니다 · …" |
| G1 | 확정 → `/profile/:id` | PASS | PASS | "프로필 확정 (v1)" → `/profile/profile-1` |
| G1 | (범위 밖) 첫 확정 "새 프로젝트 …" 알림 | 관찰 | 관찰 | 없음 — C6 revert, 브리프 범위 밖 |
| G2 | 3안 만들기 → 카드 3개 · B안 선택 → "B안으로 편집 시작" 활성 | PASS | PASS | `g2-profile-candidates.png` |
| G2 | 누르면 진행 중 `aria-busy="true"` | PASS | PASS | 첫 클릭 뒤 `aria-busy="true"`, 관찰된 값 `["true"]` |
| G2 | 빠른 연속 클릭 3회(서로 다른 task) → 이동 1회 | PASS | PASS | `pushState` 1회 |
| G2 | `/studio/:projectId` 이동 · h1 = 프로젝트 이름 | PASS | PASS | `/studio/project-1` · "동네 치과 클리닉 프로젝트" |
| G2 | 셸이 "문서 있음" 상태(E-S03 아님) | **FAIL** | **FAIL** | E-S03 "아직 편집할 페이지가 없습니다 — …" 표시 — **D1** · `g2-studio.png` |
| G2 | (관찰) 이동 state = `startDoc` 성공 결과 | 관찰 | 관찰 | `changes` 5쌍 + `editNotice`(아래 G5) |
| G5 | 8.2.1 (a) 알림 문형이 SPEC과 글자 그대로 같음 | PASS | PASS | "구조안의 섹션 5개를 편집기 변형으로 바꿔 열었습니다 — About 2단 소개 → 이야기 + 이미지 · Services 2열 → 카드 3개 · About 팀 카드 3열 → 이야기 + 이미지 · Services 공지 목록 → 목록형 · Contact 지도 + 폼 → 문의 폼" |
| G5 | 알림의 쌍 수 = `changes` 수 = 본문 N | PASS | PASS | 5 = 5 = 5 · 이름표 표기(변형 키 아님, E-AC-20) |
| G5 | 8.2.1 (b) `UNKNOWN_VARIANT`·`BAD_VALUE` 알림 문구 = SPEC (정적 대조, 브라우저 재현 불가) | PASS | PASS | `startDocWrite.ts:50` "이 안에는 편집기가 아직 열 수 없는 섹션이 있습니다(<유형 이름표> · <변형 키>) — 다른 안을 고르세요" · `:67` "이 안으로 편집 문서를 만들 수 없습니다 — 다른 안을 고르세요" = SPEC 532행 글자 그대로 |
| G5 | 알림이 이동 뒤 화면에 1회 보임 | **FAIL** | **FAIL** | 화면·`role=status/alert`에 없음 — **D2** |
| G3 | 셸 "프로필에서 3안 고르기" → 프로필(3안·선택 유지) | PASS | PASS | `/profile/profile-1` · "B안으로 편집 시작" |
| G3 | 같은 안(B)으로 다시 편집 시작 → 같은 `/studio/project-1` · 새 문서 없음 | PASS | PASS | **멱등 재생**(성공 결과 그대로 — `changes` 5쌍 동일). DOC_EXISTS 아님 — 아래 "브리프·SPEC 불일치" ① |
| G3 | 다른 안(C)으로 편집 시작 → DOC_EXISTS → 같은 `/studio/project-1` | PASS | PASS | state `editNotice` = "이미 편집 중인 문서를 엽니다 (B안 · 프로필 v1)" — 새 문서 없이 기존(B안) 문서 |
| G3 | "이미 편집 중인 문서를 엽니다"가 화면에 보임 | **FAIL** | **FAIL** | 화면에 없음, E-S03 표시 — **D2** · `g3-studio-doc-exists.png` |
| G6 | Tab으로 "C안 선택" 도달 · Enter로 선택 | PASS | PASS | Tab 5회 → "C안으로 편집 시작" |
| G6 | Tab으로 "편집 시작" 도달 · Enter → `/studio/:projectId` | PASS | PASS | Tab 2회 |
| G6 | 이동 뒤 포커스가 사라지지 않음 | **FAIL** | **FAIL** | 이동 뒤 `document.activeElement` = `BODY` — **D3**. 다음 Tab은 "프로필에서 3안 고르기"로 감 |
| G4 | (관찰) 새로고침(`/studio/project-1` 직접 진입) | 관찰 | 관찰 | E-S02 "프로젝트를 찾을 수 없습니다 · 새로고침하면 프로젝트와 편집 내용이 사라집니다(서버 연결 전)" — 문서 유지 안 됨 |
| G4 | 새로고침 뒤 페이지 오류 0 | PASS | PASS | `[]` · `g4-studio-reload.png` |
| G7 | 콘솔 error 0(G1~G6 + G4 재진입 전체, 맨 끝 수집) | PASS | PASS | 메시지 4건 중 error 0 · 수집 표식(`qaA2-sentinel`) 잡힘 |
| G7 | 페이지 오류 0 | PASS | PASS | `[]` |

G4 근거: SPEC 3.2 E-S02 "없는 id · 새로고침 · 직접 진입" · 8.3 `persistence: "memory"`. 메모리 저장소라 새로고침하면 프로젝트·문서가 사라지는 것은 SPEC이 예정한 동작(결함 아님).

## 결함

### D1 [P2] 문서가 있는데 `/studio/:projectId`가 E-S03 "문서 없음" 안내를 보인다
- 재현: `/catalog` → 3개 담기 → 비교 보드 → 첫 확정 → 프로필 "3안 만들기" → "B안 선택" → "B안으로 편집 시작".
- 기대: 문서가 생겼으므로 E-S03(SPEC 3.2 "편집 문서 없음(프로젝트는 있고 3안 미선택)")이 아니어야 한다. 브리프 G2 단언.
- 실제: "아직 편집할 페이지가 없습니다 — 프로필에서 3안을 만들고 하나를 고르세요" + "프로필에서 3안 고르기". 방금 3안을 고르고 편집을 시작한 사용자에게 반대로 안내한다. 같은 안·다른 안으로 다시 들어가도 같다.
- 원인(코드 확인, 수정 안 함): `app/src/pages/StudioPage.tsx:22`가 `hasDoc: doc !== undefined`를 계산하지만 `:34`는 `hasDoc`와 관계없이 늘 `<StudioNoDoc …/>`를 그린다. 이 파일의 마지막 변경은 a1-β(`6c5f0bc`)이고 a2 데이터 레인(C5)은 건드리지 않았다.
- 저장소 배선은 정상(정적 확인): `StudioPage`의 `useProjectRepository()`(`features/projects/useProjectRepository.ts`)는 편집 시작과 같은 `useProjectLoader()`(`data/ProfileRepositoryContext.tsx:39`, 컨텍스트의 `projects` 로더 1개)를 쓴다 — 같은 store라 문서는 보인다(DOC_EXISTS가 B안 문서를 돌려준 것이 증거). 빠진 것은 `:34`의 분기 하나다.
- 구현 REPORT(`dev/active/editor-a2-data/REPORT.md` 8절)는 QA 이관 항목을 "`/studio/:projectId` 문서 있음 분기"로 적었다 — 그 분기가 있다고 전제한 이관이라 레인 사이 빈틈으로 본다.
- 캡처: `shots/{1280,390}/g2-studio.png` · `g3-studio-same-candidate.png`
- 비고: 문서 있음 화면(E-S05 편집기 틀)은 a2 화면 레인 몫이다. 다만 그 전까지 **문서가 있는데 "없다"고 말하는 문구**는 데이터 레인 병합으로 새로 생긴 사용자 흐름이라 P2로 올린다. a2 화면 레인이 `hasDoc` 분기를 넣을 때 함께 닫히는지 확인이 필요하다.

### D2 [P3] 편집 알림(8.2.1 (a) 변형 변경 · 8.3.1 DOC_EXISTS)이 이동 state에만 있고 화면에 안 보인다
- 재현: D1과 같음(변형 알림) · 이어서 프로필로 돌아가 C안 선택 → 편집 시작(DOC_EXISTS).
- 기대: 이동 뒤 1회 "구조안의 섹션 5개를 …" / "이미 편집 중인 문서를 엽니다 …"(SPEC 8.2.1 (a) · 8.3.1 화면 처리 · E-AC-40 "그 화면은 이동 + '이미 편집 중인 문서를 엽니다'").
- 실제: 문장은 `history.state.usr.editNotice`에 정확히 실려 오지만(`flow.jsonl` G2·G3 `usr`) `StudioPage`가 `location.state`를 읽지 않아 화면·`role=status`에 없다(`grep editNotice app/src` → 소비처 0).
- 비고: SPEC 8.2.1 (a)는 "이동 뒤 편집기 첫 표시 때"(6.3 편집 알림 영역), 8.3.1 화면 처리 표는 DOC_EXISTS = "이동 + 편집 알림"이라 E-S05 편집기(a2 화면 레인)에 묶인다. 데이터 계층 산출은 PASS. P3.
- 문구 대조: DOC_EXISTS 알림 = SPEC 8.3.1 표 예시 "이미 편집 중인 문서를 엽니다 (B안 · 프로필 v3)"와 같은 형식(`(<안>안 · 프로필 v<버전>)` 꼬리 포함) — 실제 "이미 편집 중인 문서를 엽니다 (B안 · 프로필 v1)".

### D3 [P3] 편집 시작으로 `/studio/:projectId`에 오면 포커스가 `body`로 떨어진다
- 재현: 프로필에서 Tab으로 "C안 선택" → Enter → Tab으로 "C안으로 편집 시작" → Enter.
- 기대: 이동 뒤 포커스가 새 화면의 의미 있는 위치(h1·본문 등)로 간다(브리프 G6 "포커스가 이동 후 사라지지 않음").
- 실제: `document.activeElement` = `BODY`(누른 버튼이 사라짐). 다음 Tab은 "프로필에서 3안 고르기"로 이어져 조작은 가능하다.
- 비고: 라우트 전환 포커스는 앱 전반의 미해결 항목(보드 화면 외 미확인)과 같은 계열로 보인다 — 다른 라우트와의 비교는 이번 범위에서 재지 않았다. P3.

## 브리프·SPEC 불일치 (결함 아님 — Jarvis 확인)
1. **G3 "같은 안으로 다시 편집 시작 → DOC_EXISTS"**: SPEC 8.3.1 판정 2는 멱등 키(`projectId`·`mode`·`profileVersion`·`candidateId`)가 마지막 성공과 같으면 **이전 결과 그대로(성공 재생, 쓰기 0)** 를 돌려준다. 그래서 같은 B안 재시작은 DOC_EXISTS가 아니라 멱등 재생이었고(`changes` 5쌍 동일, 이동 1회), 이는 SPEC과 코드(`memoryDocBook.ts:75-77`)대로다. "새 문서를 만들지 않고 같은 `/studio/:projectId`" 부분은 충족. DOC_EXISTS 흐름은 **다른 안(C)** 으로 확인했다(PASS).
   - 파생 관찰: 멱등 재생도 SPEC 8.2.1 (a)대로 변형 알림을 다시 싣는다("재생도 성공이므로 이동 뒤 1회"). 화면이 붙으면 같은 안을 여러 번 열 때마다 알림이 반복될 수 있다 — SPEC이 "재생은 첫 응답을 잃었을 때만"을 전제하므로 a2 화면 레인이 재확인할 지점.
2. **G2 "중복 클릭 무시"**: 사람의 연속 클릭(클릭마다 다른 task)은 무시된다(이동 1회, PASS). 1차 실행에서 **같은 task 안에서 `el.click()` 3번**(React 반영 전)을 보냈을 때는 이동이 3번 일어났다 — 스크립트가 만든 비현실적 입력이라 결함으로 올리지 않았다. 이때도 뒤의 두 번은 같은 인자라 멱등 재생이므로 문서는 늘지 않는다(데이터 계층 방어). 최종 `flow.mjs`는 현실 입력(작업 사이 `setTimeout 0`)으로 잰다.

## 참고 관찰 (범위 밖 · 기록만)
- EQ-2 "C안으로 새로 시작"(`restart`) 진입점이 프로필에 없다 — 문서가 있어도 버튼은 "C안으로 편집 시작"(늘 `create`)이고 결과는 DOC_EXISTS(8.3.1 표가 안내하는 "새로 시작" 경로 없음). `restart`는 저장소에만 있다(E-AC-42 단위 테스트). a2 레인 범위인지 Jarvis 판단 필요.
- 프로필 편집 시작 아래 캡션 "편집기는 다음 단계(2a-05)에서 연결됩니다. 지금은 고른 안만 저장되고, 편집 시작을 누르면 편집기 자리표시 화면으로 이동합니다."(`generationText.ts:13`)는 이제 문서를 만드는 동작과 어긋난다. a2 화면 레인 문구 정리 대상.
- G1 첫 확정 알림 없음 — C6 revert(브리프 범위 밖).

## 한계
- 편집 시작 결과는 이동 state로 확인했다. 저장소 내부(문서 수·revision·스냅샷)는 브라우저에서 직접 볼 수 없어 "새 문서 없음"은 DOC_EXISTS가 **기존 B안 문서**를 동봉한 것(알림 문장의 "B안 · 프로필 v1")과 멱등 재생 결과 동일성으로 간접 판정했다. E-AC-11·40~42의 경쟁·재시도·`restart`는 브라우저에 진입점이 없어(`restart` UI 없음, `delay`·`fail` 주입 없음) 이번 흐름으로 재지 않았다 — 구현자 단위 테스트(REPORT 2절)가 근거.
- 8.2.1 (b) `UNKNOWN_VARIANT`는 현재 픽스처로 발생 0(SPEC 명시)이라 화면 흐름으로 재현 불가.
- 390은 뷰포트 폭만 바꿨다(`set viewport 390 900`). 터치 입력은 재지 않았다.

## 산출물
- `flow.mjs`(선례 복사·수정) · `flow.jsonl`(1280 29줄 + 390 29줄 + 관찰 줄 포함 64줄) · `shots/{1280,390}/*.png`(각 9장)

## 종료 확인
- 1차: 자기 vite `npm exec vite` PID 66386(자식 node 66431이 4341 LISTEN) → `kill 66386` 뒤 `lsof` 빈 출력
- 2차(G7 위치 조정 후 재실행): 자기 vite PID 81161 → `kill 81161` 뒤
- `lsof -nP -iTCP:4341 -sTCP:LISTEN` → **빈 출력**(exit 1)
