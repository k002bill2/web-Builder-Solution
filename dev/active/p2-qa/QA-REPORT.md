# P2-QA 마감 QA 보고 — 영속 트랙(P1a~P2) · 실화면 (읽기 전용)

- base `8360d35` · 브랜치 `k002bill2/p2-qa` · 커밋 952eec1(P0) → a29af4a(①) → 1b181b7(②) → 이 보고
- 환경: `npm run build` exit 0 → `vite preview --port 4337 --strictPort` · Ego Lite TaskSpace 33 · 창 normal 1877×1050 · 이미지 = 스크립트 생성 단색 PNG 800×400(`$TMPDIR/p2qa/img/solid.png`)
- 앱 코드·테스트·docs 수정 0. Codex·서브에이전트 미사용.

## 출시 판정 의견
**차단 결함 없음 — 영속 트랙 출시 가능 의견.** P1·P2 결함 0. P3 1건(요약 파일 크기 표기). 미확정 1건(손상 파일 IM-2/IM-4 — 이번 회차 미실행, L3 회차 IM-2 실측 통과 이력 있음).

## 항목별 결과

| # | 항목 | 판정 | 핵심 증거 |
|---|---|---|---|
| 1 | 실 UI 왕복(AC-P01 E) | **PASS** | 아래 1절 |
| 2 | AC-P04 다른 탭 차단 + 삭제 차단 회귀 | **PASS** | 아래 2절 · L3 7.3 ④ 미확정 해소 |
| 3 | "파일을 확인하는 중…" 소요·정체 | **PASS(정체 재현 안 됨)** | 780ms · 782ms(B 쓰기 탭 열린 상태) · 264ms |
| 4 | 요약 "파일 크기" vs IM-13 | **형식 일치 · 값 오해 소지(P3)** | 13,115B → "파일 1MB" |
| 5a | 내보내기 Esc 포커스 | **PASS** | 열기 포커스 BUTTON "파일 만들기" → Esc → 닫힘 · 포커스 BUTTON "모던 카페 브랜드 프로젝트 파일로 내보내기"(data-export-for=project-1) |
| 5b | 새로고침 뒤 편집기 열림(AC-P05) | **부분 PASS** | 가져온 project-1을 새 탭 B 첫 로드(IDB 읽기)로 열어 9섹션 표시 · 가져온 뒤 goto 이동으로 편집기 열림. project-2 편집기 열기는 미실행 |
| 5c | 손상 파일 IM-2/IM-4 | **미확정** | 34턴 마감 규칙으로 미실행 |

### 1. 실 UI 왕복
1. 준비(앱 안 클릭): 카탈로그 "모던 카페 브랜드 비교 추가" → 비교 보드 프로필 만들기 → "프로필 확정 (v1)" → "3안 만들기 (v1)" → "A안 선택" → "A안으로 편집 시작" → `/studio/project-1` → 이미지 편집 input에 단색 PNG → "지금 상태 저장"(수동 · 14:49).
2. 내보내기 전 IDB: `images` 1건 `project-1/4ef200c8-288d-4354-93ed-5e5b28f85d00` = 800×400 · webp · bytes 2066 · 변형본 640:image/webp/930 · 800:image/webp/1136 · `docs/project-1` 9섹션 · `snapshot-1:manual` · gen 10 (`dump-before.json`).
3. `/projects` "파일로 내보내기" → "파일 만들기" → **실제 내려받기**(`waitForEvent("download")`+`saveAs`) `모던-카페-브랜드-프로젝트_project_20261008.json` 13,115B · status `'모던 카페 브랜드 프로젝트' 프로젝트 파일을 내려받았습니다` · 파일 = format design-studio-project · formatVersion 1 · schemaVersion 1 · images 1 · snapshots 1.
4. "이 브라우저 데이터 지우기" → "모두 지우기"(FX-1 백업 안내 문장 표시) → 줄 0.
5. "프로젝트 파일 가져오기" → 그 파일: 526ms "파일을 확인하는 중…" → 780ms 요약(편집 문서 있음 · 스냅샷 1개 · 이미지 1개 · 파일 1MB · 2026-10-08 내보냄) · 포커스 BUTTON "가져오기" (`shots/1-summary.png`).
6. 가져오기 → 새로고침 뒤 "프로젝트 알림" `'모던 카페 브랜드 프로젝트' 프로젝트를 가져왔습니다` **1개** · 포커스 A "편집기 열기"(project-1 줄) · sessionStorage `{}`.
7. 가져온 뒤 IDB: 이미지 키 `project-1/4ef200c8-…`(localId 동일) · 800×400 · webp · bytes 2066 · 640:930 · 800:1136 — **형식·치수·localId 동일(바이트 수까지 같음)** · docs 9섹션 · snapshot-1:manual · gen 1 (`dump-after-import.json`).
8. 편집기: 섹션 9 · 스냅샷 패널 "수동 · 14:49 · 프로필 v1 · A안" · Hero 파랑 단색 이미지 표시 (`shots/1-editor.png`).

### 2. AC-P04 다른 탭 차단 (시각 UTC)
- 05:53:00 탭 B(`task.newPage()` → `/studio/project-1`)에서 대표 이미지 스위치를 꺼 실제 편집 → "이 브라우저에 저장됨 · 방금"(쓰기 탭).
- A `Page.bringToFront` → IDB 전: docs 1 · images 1 · gen 2 · meta generation 2.
- 05:53:05 가져오기 요약 782ms(정체 없음) → 05:53:09 "가져오기" → alert **1개** `다른 탭에서 편집 중이라 가져오지 못했습니다 — 그 탭을 닫은 뒤 다시 시도하세요`(IM-9) · 포커스 BUTTON "가져오기" (`shots/2-im9.png`) → IDB 후: docs 1 · images 1 · gen 2 · meta 2 — **불변**.
- 삭제 회귀: "프로젝트 지우기" → alert `다른 탭에서 편집 중이라 지우지 못했습니다 — 그 탭을 닫은 뒤 다시 시도하세요` · IDB 불변(gen 2).
- 05:53:16 B 닫기 → A 재시도: 요약 264ms → status IM-15 1개 · 포커스 A "모던 카페 브랜드 프로젝트 편집기 열기" · IDB docs 2 · images 2(`project-2/4ef200c8-…` — localId 유지 · 키 새 프로젝트) · gen 3.
- 함께 본 것: A에 status "다른 탭에서 저장한 변경이 있습니다 — 새로고침하면 보입니다"가 B 편집 이후 표시(정상 동작으로 판단).
- L3 7.3의 "확인 중 정체·IM-9 없이 성공" 현상은 이번 조건(B 실제 편집 = 잠금 보유, 클릭마다 시각 기록)에서 **재현 안 됨**. [추정] L3 회차는 B가 편집기를 열기만 하고 편집하지 않아 잠금이 없었으므로(P1C C2 — 첫 편집 때 잠금) IM-9 없는 성공이 정상이었을 가능성.

### 3. 확인 단계 소요
| 시점 | 파일 선택 → 요약 |
|---|---|
| ① 지운 직후 | 780ms (526ms에 "확인하는 중…") |
| ② B 쓰기 탭 열림 · A 전면 | 782ms |
| ② B 닫은 뒤 | 264ms |
15초 정체 0회 · 탭 visibilityState = visible · alert 0.

### 4. 요약 "파일 크기" 표기
- 실측: 13,115B 파일 → `파일 1MB`.
- SPEC IM-13: `파일 {N}MB` — 정수 MB 형식만 정하고 반올림 규칙은 정하지 않음 → **형식은 일치**.
- 구현: `Math.ceil(file.size / MB)` (`app/src/components/projects/ImportProjectFileDialog.tsx:23`) — 1바이트~1MB가 모두 "1MB".
- 판단: SPEC 위반은 아니나 13KB를 1MB로 보여 사용자가 실제 크기를 오해할 수 있음 → **P3**(아래 D1).

## 결함 목록
| ID | 심각도 | 내용 | 재현 | 제안 |
|---|---|---|---|---|
| D1 | P3 | 가져오기 요약이 1MB 미만 파일을 "파일 1MB"로 표시(올림) | 프로젝트 1개(이미지 1)를 내보내 13,115B 파일 → 가져오기 → 요약 목록 4번째 항목 | SPEC IM-13에 1MB 미만 표기(예: "1MB 미만" 또는 KB) 규칙 추가 — Jarvis/Designer 결정 사항 |

P1·P2 결함 0.

## 관찰(결함 아님)
- 지운 직후 `indexedDB.databases()` = `design-studio` v1 존재 · 저장소 영역 status "불러오는 중…". 이 회차에는 내 덤프가 지운 뒤 DB를 열지 않았으므로 앱이 다시 연 것으로 보임 [추정]. 가져오기는 v2·저장소 7개로 정상 진행.
- SPEC I-S07의 `data-project-row`는 구현에 없음 — `ProjectsPage.tsx:162` 주석대로 `data-rename-for`로 줄을 찾음(설계 편차, 기능 영향 없음 — 포커스 정상).
- ego-browser `page.screenshot`은 `captureBeyondViewport` 옵션을 받지 않음(오류) → `clip`만 사용, 4장.

## 정리
- `indexedDB.deleteDatabase("design-studio")` = `success` · `indexedDB.databases()` = `[]`.
- `task.finish({ keep: [] })` 완료 → `listTaskSpaces()` = `[{id:33, name:"p2-qa 마감 QA", ownership:"user", recentTabTitles:["프로젝트 · Design Studio"]}]` — finish 뒤 공간 33이 user 소유로 남음(탭 1개). 사용자 소유로 바뀐 공간이라 추가 조작 안 함 → **영환님이 탭을 닫아 주셔야 함**.
- preview 종료 · 4337 LISTEN 0줄. main 5480 무접촉(LISTEN 확인만).
- 저장소 밖 임시 파일: `$TMPDIR/p2qa/`(내려받은 json·PNG) · `$TMPDIR/p2qa-scripts/`.

## 턴 기한 준수
| 기한 | 실제 | 사유 |
|---|---|---|
| P0 3턴 전 | 2턴 | — |
| ① 커밋 18턴 전 | 약 30턴 — 미달 | 프로젝트 준비 클릭 경로(details 요약·버튼 이름) 탐색 + screenshot 옵션 오류 재시도 |
| ② 커밋 28턴 전 | 약 33턴 — 미달 | ① 지연 이월 |
| QA-REPORT 38턴 전 | 약 36턴 | 5c(손상 파일)를 마감 규칙으로 생략 |
