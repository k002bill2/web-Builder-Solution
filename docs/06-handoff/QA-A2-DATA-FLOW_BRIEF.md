# QA-A2-DATA-FLOW — a2 데이터 계층 병합 후 흐름 독립 검증 (main `dd62865`)

## 책임/목표
- 책임 QA / 실행 Orca + Claude Code. 보고 Jarvis. 작업 공간 `qa-a2-data-flow`(브랜치 `k002bill2/qa-a2-data-flow`, HEAD = main `dd62865`). 포트 **4341**.
- 목적: a2 데이터 레인(C0~C5, C6는 revert)이 실제 브라우저에서 동작하는지 **코드 수정 없이** 판정(PASS / PARTIAL / FAIL). Jarvis 게이트(typecheck·lint·vitest 1,272/1,272·build 0)와 구현자 테스트를 대체하지 않는 독립 검증.

## 기준
- `docs/design/2a-05/SPEC.md` r4.3: 8.2(DocStart) · 8.2.1(변형 변경 알림·UNKNOWN_VARIANT 알림 문구) · 12.2~12.4(편집 시작 · `/studio/:projectId`) · E-AC-11·40·41·42.
- 구현 기록: `dev/active/editor-a2-data/REPORT.md`(특히 1·2절 표, 9절 C6 되돌림).
- **범위 밖(결함으로 올리지 않음):** 첫 확정 시 "새 프로젝트 …" 알림(C6 revert, 별건) · 편집기 틀·캔버스·필드(E-S05~, a2 화면 레인) · 390 헤더 3행(D3).

## 방법 (턴 절약)
1. `cd app && npm ci`(필요 시) → `npx vite --host 127.0.0.1 --port 4341 --strictPort` 백그라운드, PID 기록.
2. **선례 스크립트 `docs/qa/a1-beta-flow/flow.mjs`를 복사·수정**해 `docs/qa/a2-data-flow/flow.mjs` 한 개로 전 흐름 실행(같은 도구 사용, 새 의존성 금지). 단계마다 JSON 줄 + 스크린샷. 실패해도 다음 단계 진행.
3. 1280·390 두 폭으로 실행.

## 흐름과 단언
- G1 `/catalog` → 3개 담기 → `/compare` → 선택 → 첫 확정 → `/profile/:id`.
- G2 3안 만들기 → 안 하나 선택 → **"편집 시작"**: 버튼 `aria-busy` 동안 중복 클릭 무시 → `/studio/:projectId` 이동 → 셸이 **문서 있음** 상태(E-S03 "문서 없음" 안내가 **아님**)와 프로젝트 이름을 보임. 실제로 보이는 것을 캡처하고 기록(편집기 틀은 a2 화면 레인 몫).
- G3 프로필로 돌아가 **같은 안으로 다시 "편집 시작"** → 새 문서를 만들지 않고 "이미 편집 중인 문서를 엽니다"(DOC_EXISTS) 흐름 → 같은 `/studio/:projectId`.
- G4 새로고침(`/studio/:projectId` 직접 진입) → 문서 유지 여부(메모리 저장소면 유지 안 될 수 있음 — **관찰만** 기록, SPEC 근거와 함께).
- G5 변형이 바뀌는 안이 있으면 8.2.1 알림 문구가 SPEC과 **글자 그대로** 같은지(없으면 "해당 픽스처 없음"으로 기록).
- G6 키보드만으로 G2(Tab·Enter) 가능 · 포커스가 이동 후 사라지지 않음.
- G7 콘솔 error 0 · 페이지 오류 0.
- 결함: 재현 절차·기대·실제·캡처·심각도(P1~P3). 코드는 고치지 않는다.

## 산출물 (`docs/qa/a2-data-flow/`, 필요 시 `git add -f`)
- `REPORT.md`(판정·단계 표·결함·한계), `flow.jsonl`, `flow.mjs`, `shots/{1280,390}/*.png`.

## 금지·운영
- 앱 코드·테스트·`design/`·`docs/design/` 수정 금지. 새 의존성 금지. 외부 사이트 접속 금지.
- **서브에이전트 금지**(rate limit 이력).
- `--max-turns` 30 · **18턴부터 REPORT 우선**(부분 결과라도 커밋). 로컬 커밋 `git commit -- <경로>`. push·병합·삭제 금지.
- 끝나면 자기 vite PID만 종료, `lsof -nP -iTCP:4341 -sTCP:LISTEN` 빈 출력을 REPORT에 기록.
