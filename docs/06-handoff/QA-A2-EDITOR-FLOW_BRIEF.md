# QA-A2-EDITOR-FLOW — a2 편집기(틀·필드·저장) 병합 후 흐름 독립 검증 (main `4363f5e`)

## 책임/목표
- 책임 QA / 실행 Orca + Claude Code. 보고 Jarvis. 작업 공간 `qa-a2-editor-flow`(브랜치 `k002bill2/qa-a2-editor-flow`, HEAD = main `4363f5e`). 포트 **4341**.
- 목적: a2 편집기(A2-S S1~S7 + A2-F 부품)가 실제 브라우저에서 동작하는지 **코드 수정 없이** 판정(PASS / PARTIAL / FAIL). Jarvis 게이트(typecheck·lint·vitest 1,352/1,352 ×3·build 0)와 구현자 테스트를 대체하지 않는 독립 검증. 특히 jsdom이 증명하지 못한 항목([Q])이 핵심.

## 기준 (브리프와 SPEC이 다르면 **SPEC이 이긴다** — 결함으로 올리기 전에 SPEC 절을 인용)
- `docs/design/2a-05/SPEC.md` r4.3: 4절(배치·DOM 순서) · E-S03~E-S10 · E-AC-03·04·05·06·07·08·09·10(화면분)·12·13·14·15·16·33.
- 구현 기록: `dev/active/editor-a2-shell/REPORT.md` **R1-3(AC 표)·R1-6(SPEC 차이 결정)·R1-9(남은 위험)**, `dev/active/editor-a2-fields/REPORT.md`.
- **범위 밖(결함 아님):** 품질 게이트·내보내기·스냅샷 내용(a4) · 테마 바꾸기·섹션 추가/삭제/순서·이미지 슬롯 편집(a3) · 새로고침 시 문서 소실(메모리 저장소, SPEC E-S10) · 캔버스 색 = 앱 토큰(a3) · R1-6에 적힌 의도된 차이(zoom, 네이티브 라디오·select, title 접미사 없음).

## 방법 (턴 절약)
1. `cd app && npm ci`(필요 시) → `npx vite --host 127.0.0.1 --port 4341 --strictPort` 백그라운드, PID 기록.
2. **선례 `docs/qa/a2-data-flow/flow.mjs`를 복사·수정**해 `docs/qa/a2-editor-flow/flow.mjs` 한 개로 전 흐름 실행(같은 도구, 새 의존성 금지). 문서 있는 편집기까지는 보드 → 프로필 → 3안 → 편집 시작 흐름이 필요(선례 G1·G2 재사용). 단계마다 JSON 줄 + 스크린샷. 실패해도 다음 단계 진행.
3. 폭: **1920 · 1280 · 1024 · 768 · 390** (5폭 — 배치가 폭마다 다름). 긴 흐름은 1280에서 한 번, 나머지 폭은 같은 탭에서 `setViewportSize`로 바꿔 관찰(문서 유지 확인 겸).

## 흐름과 단언
- E1 편집 시작 → `/studio/:id`: 집중 모드(주 메뉴 없음·banner 1·h1 1·`document.title` "<이름> 편집") · h1 포커스 · 편집 알림 1회(`role=status` 1개).
- E2 배치(5폭): ≥1280 3단 · 1024 2단(`select` + 접힌 목록) · 768·390 탭 3개(섹션·편집·검사) → 패널 → 캔버스. **모든 폭에서 가로 넘침 0**(`document.documentElement.scrollWidth <= clientWidth`) · DOM 순서 = 보이는 순서(Tab 순서 샘플 확인).
- E3 섹션 선택: 목록 클릭·캔버스 클릭·1024 select 각각 → `aria-current`·편집 h2·캔버스 라벨 칩 동기, 폭을 바꿔도 선택 유지.
- E4 탭(768·390): ←/→·Home/End 자동 활성, 탭 바꿔도 선택·입력 값 유지.
- E5 미리보기 폭 3종 전환: **1초 안** 반영(시각 기록) · 문서·선택 유지 · 축소 캡션 보임 · 실제 축소 모양 캡처.
- E6 필드: 제목 입력 → 글자 수 표시 · 권장 초과 시 캔버스 경고 문장 + 필드 `aria-describedby` 연결 · 상한 초과 차단.
- E7 자동 저장: 입력 멈춤 → 약 2초 뒤 "저장 중…" → "이 탭에 저장됨" · 알림 영역 글자는 단계 바뀔 때만(상대 시각은 영역 밖).
- E8 "프로젝트로 돌아가기"를 입력 직후(2초 전) 누름 → 막지 않고 이동 → 다시 편집 시작해 **값이 저장돼 있는지**(Codex r1 수정 확인).
- E9 진입 체감: 편집 틀 lazy로 LoadingState가 두 단계로 보이는지 · 깜빡임 길이 관찰(기록만).
- E10 키보드만으로 E3·E4·E6 가능 · 포커스가 사라지지 않음 · 콘솔 error 0 · 페이지 오류 0.
- 충돌(STALE_DOC)은 브라우저로 만들기 어려우면 "재현 불가 — 단위 테스트 근거"로 기록(억지 주입 금지).
- 결함: 재현 절차·기대·실제·캡처·SPEC 근거·심각도(P1~P3). 코드는 고치지 않는다.

## 산출물 (`docs/qa/a2-editor-flow/`, 필요 시 `git add -f`)
- `REPORT.md`(판정·단계×폭 표·결함·한계), `flow.jsonl`, `flow.mjs`, `shots/<폭>/*.png`.

## 금지·운영
- 앱 코드·테스트·`design/`·`docs/design/` 수정 금지. 새 의존성 금지. 외부 사이트 접속 금지.
- **서브에이전트 금지**(rate limit 이력).
- `--max-turns` 40 · **28턴부터 REPORT 우선**(부분 결과라도 커밋). 로컬 커밋 `git commit -- <경로>`. push·병합·삭제 금지.
- 끝나면 자기 vite PID만 종료, `lsof -nP -iTCP:4341 -sTCP:LISTEN` 빈 출력을 REPORT에 기록.
