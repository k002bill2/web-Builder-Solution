# RESTART-SPEC Designer 브리프 — B-ER-01 프로필 화면 "새로 시작"(EQ-2 A) UI

- 산출물: `docs/design/restart/SPEC.md` · `docs/design/restart/MQ.md` · `dev/active/restart-spec/{PROGRESS,REPORT}.md`. 구현은 이 SPEC 확정 뒤 별도 Developer 레인.
- 배경: `docs/design/editor-rest/SPEC.md:98,158` — 다른 안으로 바꾸는 길 = 프로필 화면 "새로 시작"(EQ-2 A `restart`), 저장소는 있음, UI 미구현. `SnapshotDialog.tsx:8` 사유 라벨 `restart` 존재. 관련: `docs/design/2a-05/SPEC.md`(EQ-2 원문), `docs/design/editor-rest/MQ.md`, ADR-007(로컬 영속 — 스냅샷 보존 규칙 P1d).
- 설계 범위: 프로필 화면에서 기존 편집 문서가 있는 프로젝트를 다른 3안으로 다시 시작하는 흐름 — 진입점 위치, 기존 문서 처리("새로 시작 전" 자동 스냅샷 여부·보존 20개 규칙과의 관계), 확인 대화상자 문구, 되돌리기 경로, 대비 미통과 문서를 통과 버전으로 옮기는 경우(BACKLOG 원문), 다른 탭 쓰기 잠금 중 동작.
- 먼저 확인: 저장소 API(`restart` 경로)가 실제로 무엇을 하는지 코드로 확인하고 SPEC이 그 계약 안에서 가능한지 판정. 계약 변경이 필요하면 MQ로.

## 공통 (3개 Designer 레인 병렬 — RESTART-SPEC · FIELD-UNDO-SPEC · GEN-MARK-SPEC)
- 역할 Designer / Orca managed Claude Code / base main `18e5e12`(origin 반영 완료). **코드 0** — 산출물은 이 레인 디렉터리의 `SPEC.md`·`MQ.md`와 `dev/active/<레인>/PROGRESS.md`·`REPORT.md`뿐. `app/`·BACKLOG·다른 SPEC·CLAUDE.md·design/ 수정 0(다른 레인과 쓰기 경로 분리).
- 원칙: ADR-003(기능·사용자 흐름 → 사용성(실데이터·상태·접근성·반응형·성능) → DS 일관성 → 목업, px는 기준 아님) · ADR-002 브랜드 · 기존 SPEC 문체·번호 체계(수용 기준 ID·[U]/[E] 표기)를 따른다.
- SPEC 필수 절: 목적·범위/제외 · 사용자 흐름(정상·빈·오류·경고·진행 중 상태) · 화면 구조·정보 위계(1280·1024·390) · 문구 원문(한국어) · 접근성(포커스 이동·라이브 영역·키보드) · 수용 기준 표(ID·조건·검증 수단) · 구현 영향 추정(예상 파일·`/studio` 진입 예산 영향 — 현재 129.28/멈춤 129.65, `/profile` 99.87/100 — 진입 closure를 건드리면 조작 뒤 청크 설계 제시) · 위험.
- MQ.md: 영환님·Jarvis 결정이 필요한 질문만, 질문마다 선택지 2~4개 + ★권장안 + 근거 한 줄. 엔진 계약·저장 스키마·예산 증액이 필요한 선택지는 그 사실을 명시.
- 근거는 코드·기존 SPEC 행 인용(파일:행). 추정은 추정으로 표시. 서브에이전트 분할: 권장(읽기 전용 조사 — 관련 코드 경로 / 기존 SPEC·QA 기록 — 2개 이하), 파일 쓰기는 메인만.
- 첫 3턴 안 PROGRESS 커밋 · SPEC 초안 커밋 → MQ 커밋 → REPORT 커밋(로컬 커밋만, push/merge 0, amend·rebase 금지). 시간 상한 60분 · 30턴부터 다듬기 금지·REPORT만.
