# QA-A1-BETA-FLOW REPORT — a1-β 사용자 흐름 독립 검증 (main `6e6d8d5`)

- 일시: 2026-09-27 · 실행: Orca + Claude Code(메인 단독, 서브에이전트 없음) · 보고 대상: Jarvis
- 대상: `k002bill2/qa-a1-beta-flow` (HEAD `dfa082d` = main `6e6d8d5` + 브리프 커밋, 앱 코드 동일) · `127.0.0.1:4341`
- 앱 코드·테스트·`design/`·`docs/design/` 수정 없음.

## 판정: **PASS** (SPEC 2a-05 기준) — 결함 0건, 브리프·SPEC 불일치 2건(판단 요청)

| 폭 | 단언 | PASS | FAIL | FAIL 내역 |
|---|---|---|---|---|
| 1280 | 31 | 29 | 2 | F2 첫 확정 알림 · F5 "프로젝트로 돌아가기" |
| 390 | 31 | 29 | 2 | 같음 |

FAIL 2건은 모두 **브리프 단언이 SPEC 범위보다 넓어서** 생긴 것이다. SPEC 원문과 코드 주석을 대조해 결함으로 올리지 않았다(아래 "불일치" 절). SPEC 기준 단언은 두 폭 모두 전부 PASS.

## 단계별 결과 (1280 · 390 동일)

| 단계 | 단언 | 1280 | 390 | 증거(flow.jsonl 요약) |
|---|---|---|---|---|
| F1 | `/catalog` 렌더 · "비교 추가" ≥3 | PASS | PASS | 6개 |
| F1 | 레퍼런스 3개 담기 | PASS | PASS | 동네 치과 클리닉 · 부티크 법률사무소 · 모던 카페 브랜드 |
| F1 | "비교 보드 열기" → `/compare` | PASS | PASS | `f1-compare.png` |
| F2 | 요소 선택(Hero 포함) | PASS | PASS | Hero A · 메뉴 B · CTA B |
| F2 | J-S09 첫 확정 캡션 | PASS | PASS | "새 프로젝트 '동네 치과 클리닉 프로젝트'를 만듭니다 · 이름은 프로젝트 목록에서 바꿀 수 있습니다" |
| F2 | "확정할 곳" 라디오 없음 | PASS | PASS | radios `[]` |
| F2 | 확정 → `/profile/:id` | PASS | PASS | "프로필 확정 (v1)" → `/profile/profile-1` |
| F2 | 새 프로젝트 알림(브리프 "J-S11") | FAIL* | FAIL* | 알림 없음 — 불일치 ① |
| F3 | 프로필 머리 "프로젝트: <이름>" 링크 | PASS | PASS | "프로젝트: 동네 치과 클리닉 프로젝트" → `/projects` |
| F3 | `/projects` 목록에 존재 | PASS | PASS | `f3-projects.png` |
| F3 | 뒤로 → 프로필 | PASS | PASS | `/profile/profile-1` |
| F4 | GNB "비교 보드"로 복귀 · 선택 변경 | PASS | PASS | Hero → B |
| F4 | 라디오 2개 · "<이름> 새 버전" 기본 · "새 프로젝트" | PASS | PASS | `[동네 치과 클리닉 프로젝트 새 버전 ✓, 새 프로젝트]` |
| F4 | 키보드: ArrowDown → 2번 선택·포커스 · Shift+Tab/Tab → 선택 라디오로 복귀 · ArrowUp → 1번 | PASS | PASS | focusIdx 1/1/0, checked 일치 |
| F4 | 확정 버튼 이름이 대상에 맞게 바뀜 | PASS | PASS | "새 버전으로 확정 (v2)" ↔ "새 프로젝트로 확정"(390은 패널·요약 바 둘 다) |
| F4 | "새 프로젝트로 확정" → 새 프로필 + 알림 | PASS | PASS | `/profile/profile-2` · "새 프로젝트 '부티크 법률사무소 프로젝트'를 만들었습니다"(J-S11·J-AC-06) |
| F4 | 프로젝트 2개 | PASS | PASS | 부티크 법률사무소 프로젝트 · 동네 치과 클리닉 프로젝트 |
| F5 | 3안 만들기 → 카드 3개 | PASS | PASS | A·B·C안 |
| F5 | 안 선택 → "편집 시작" 활성 | PASS | PASS | "B안으로 편집 시작" |
| F5 | `/studio/:projectId` 이동 | PASS | PASS | `/studio/project-2` |
| F5 | 셸 h1 = 프로젝트 이름(실데이터) | PASS | PASS | "부티크 법률사무소 프로젝트" |
| F5 | E-S03 문서 없음 | PASS | PASS | "아직 편집할 페이지가 없습니다 — …" + "프로필에서 3안 고르기" |
| F5 | "프로젝트로 돌아가기" → `/projects` | FAIL* | FAIL* | 화면에 없음 — 불일치 ② |
| F5 | (대체) "프로필에서 3안 고르기" → 프로필 | PASS | PASS | `/profile/profile-2` |
| F6 | GNB "새 프로젝트"(→`/compare?new=1`) · "프로젝트"(→`/projects`, 프로필에서 `aria-current=page`) | PASS | PASS | SPEC 2a-05 88행 GNB 규칙 일치 |
| F6 | 헤더 Tab 순서 = 보이는 순서 | PASS | PASS | 로고 → 카탈로그 → 보관함 → 비교 보드 → 프로젝트 → 새 프로젝트 (390: 3행, 행 내 좌→우) |
| F6 | 헤더 높이(참고) | 52 | 131 | D3 결정대로 390 3행 수용 — 결함 아님 |
| F6 | GNB "새 프로젝트" 클릭 → `/compare?new=1` | PASS | PASS | |
| F7 | 콘솔 error 0 | PASS | PASS | 수집 동작 확인용 표식 `console.warn` 1건만 수집됨(sentinelCaptured=true) |
| F7 | 페이지 오류 0 | PASS | PASS | `[]` |

## 브리프·SPEC 불일치 (결함 아님 — 판단 요청)

① **첫 확정(J-S09) 뒤 "새 프로젝트 … 만들었습니다" 알림 없음** — 두 폭 재현.
- 브리프 F2는 첫 확정에 "새 프로젝트 알림(J-S11)"을 기대.
- SPEC 2.5: J-S11 = "**새 프로젝트로 확정** 성공"(라디오 "새 프로젝트" 선택 시). 첫 확정 기준 J-AC-04는 캡션·`project_created(board-first)`만 요구하고 알림을 요구하지 않는다.
- 코드: `app/src/features/compare/useCompareBoard.ts:267` `toNew = toNewProject && confirmed !== undefined` → 첫 확정은 `projectCreated` state를 넘기지 않음(의도된 구현).
- 판단: SPEC대로. 다만 첫 확정도 실제로 프로젝트를 만드므로(`f3-projects.png`) 스크린 리더 사용자는 프로젝트가 생긴 사실을 확정 뒤 듣지 못한다(캡션은 확정 전에만 보임). 알림을 첫 확정에도 줄지는 **Designer 결정 사항**(P3 제안).

② **E-S03 화면에 "프로젝트로 돌아가기" 없음** — 두 폭 재현. 재현: F5 끝 `/studio/project-2`.
- 브리프 F5·`EDITOR-A1-BETA_RESUME-2.md:21`은 "프로젝트로 돌아가기" 동작을 기대.
- SPEC 2.3·E-S05~: "프로젝트로 돌아가기"는 **편집기 툴바** 항목. E-S03 행(SPEC 150)은 h1 + 안내 + "프로필에서 3안 고르기"만 정의. `app/src/pages/StudioPage.tsx:11` 주석 "편집기 틀(E-S05~)은 2a-05a2".
- 판단: a1-β 범위 밖(a2 몫). 참고로 `/studio`는 집중 모드라 GNB가 없어, E-S03에서 나가는 길은 "프로필에서 3안 고르기" 하나다(`f5-studio.png`).

## 관찰 (결함 아님, 기록만)

- "B안으로 편집 시작" 직후 E-S03이 "프로필에서 3안을 만들고 하나를 고르세요"라고 안내 — 방금 한 행동을 다시 하라는 문구로 읽힌다. 문서 생성(`startDoc`)은 a2 몫(`CandidatesSection.tsx:30`)이라 a1-β 과도기 상태. a2 완료 시 사라질 흐름.
- 390 보드: 확정 버튼이 초안 패널과 하단 요약 바에 동시에 보이고, 라디오 변경 시 두 이름이 함께 바뀜(`shots/390/f4-board-target-new.png`) — SPEC 5.2·A-8 "같은 문구"와 일치.

## 결함

없음(P1~P3 0건).

## 도구 · 방법

- 로컬 Playwright: 미설치(`app/node_modules`에 `playwright` 없음, lockfile엔 `@vitest/browser-playwright` peer 항목만) → 브리프 2순위 **agent-browser CLI**(`/opt/homebrew/bin/agent-browser`, 새 의존성 0). 사용자 전역 규칙(Playwright 설치 금지)과도 일치.
- 스크립트 1개(`flow.mjs`, 사본 동봉)로 전 흐름 실행: `node dev/active/qa-a1-beta-flow/flow.mjs <1280|390> docs/qa/a1-beta-flow`. 폭은 `set viewport <w> 900`, 세션은 폭별 분리(`qa41-1280`·`qa41-390`).
- 이동은 첫 `open /catalog` 외에 전부 앱 안 클릭·`history.back`(메모리 store 유지). 클릭은 페이지 안 `element.click()`(보이는 요소를 접근 이름으로 찾음), 키보드 단언만 실제 키 입력(`press ArrowDown/Shift+Tab/Tab/ArrowUp`).
- 첫 실행(1280)에서 스크립트 버그 2개(알림 영역을 `aria-label`로 읽음 · 헤더 Tab 수집이 프로필 `<header>`까지 포함)를 고친 뒤 두 폭을 새로 실행했다. `flow.jsonl`은 그 두 번째 실행 결과(62줄)다.

## 한계

- 클릭은 합성 `click()` — 포인터 좌표 가림(겹침)·hover는 검증하지 않음. 키보드 단언은 라디오·헤더 Tab 순서만.
- 스크린 리더 실제 낭독은 확인하지 않음 — `role=status` 텍스트 존재로 판정.
- 화면 캡처는 뷰포트만(전체 페이지 아님). 시각 비교(목업 대조)는 범위 밖.
- `/compare?new=1`로 시작하는 J-AC-05 기본값("새 프로젝트")은 이동만 확인하고 라디오 기본값은 단언하지 않음.

## 산출물

- `docs/qa/a1-beta-flow/REPORT.md`(이 파일) · `flow.jsonl`(62줄) · `flow.mjs`(스크립트 사본) · `shots/{1280,390}/*.png`(각 13장).

## 서버 정리

- vite: `npx vite --host 127.0.0.1 --port 4341 --strictPort` — npm exec PID 67684 · vite node PID 67720(자기 것만) 종료.
- `lsof -nP -iTCP:4341 -sTCP:LISTEN` → 빈 출력(2026-09-27 16:04). agent-browser 세션도 모두 닫힘(`session list` → No active sessions).
