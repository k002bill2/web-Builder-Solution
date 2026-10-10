# FIELD-UNDO-SPEC Designer 브리프 — B-ER-08 필드 편집 묶음(ER-AC-U3 · MQ-R5 ★A) 실행 취소 사양

- 산출물: `docs/design/field-undo/SPEC.md` · `docs/design/field-undo/MQ.md` · `dev/active/field-undo-spec/{PROGRESS,REPORT}.md`. 구현은 이 SPEC 확정 뒤 별도 Developer 레인.
- 배경: `docs/design/editor-rest/SPEC.md:138`(3.5 실행 취소 경계)·`:201` ER-AC-U3(연속 입력 10자 + 600ms 멈춤 = 기록 1건 · blur = 1건) 미이행. 충돌: 필드 기록이 삭제 전 문서까지 닿으면 `app/src/components/studio/StudioLayoutImages.test.tsx:111` "삭제 → 필드 입력 → 되돌리기 무효화 → 이미지 빠짐" 단언과 충돌(BACKLOG B-ER-08). 관련 코드: `features/studio/useSectionOps.ts`·`opAfter.ts`(B-ER-05 거절=실패)·실행 취소 스택·더보기 실행 취소/다시 실행(ER-9).
- 설계 범위: 필드 입력이 실행 취소 스택에 어떻게 들어가는지(묶음 경계·섹션 연산과의 순서·이미지 삭제/교체 뒤 무효화 규칙·스냅샷 미리보기 중 거절·IME 조합 중 처리·탭 간 잠금) — 위 테스트 단언과 일관된 규칙 하나를 정하고, 그 단언을 바꿔야 하면 바꿀 문장과 사유를 명시.
- 구현 영향: 진입 예산 여유 0.37KB — 필드 기록 로직을 조작 뒤 청크(첫 입력 시)로 두는 설계안 포함.

## 공통 (3개 Designer 레인 병렬 — RESTART-SPEC · FIELD-UNDO-SPEC · GEN-MARK-SPEC)
- 역할 Designer / Orca managed Claude Code / base main `18e5e12`(origin 반영 완료). **코드 0** — 산출물은 이 레인 디렉터리의 `SPEC.md`·`MQ.md`와 `dev/active/<레인>/PROGRESS.md`·`REPORT.md`뿐. `app/`·BACKLOG·다른 SPEC·CLAUDE.md·design/ 수정 0(다른 레인과 쓰기 경로 분리).
- 원칙: ADR-003(기능·사용자 흐름 → 사용성(실데이터·상태·접근성·반응형·성능) → DS 일관성 → 목업, px는 기준 아님) · ADR-002 브랜드 · 기존 SPEC 문체·번호 체계(수용 기준 ID·[U]/[E] 표기)를 따른다.
- SPEC 필수 절: 목적·범위/제외 · 사용자 흐름(정상·빈·오류·경고·진행 중 상태) · 화면 구조·정보 위계(1280·1024·390) · 문구 원문(한국어) · 접근성(포커스 이동·라이브 영역·키보드) · 수용 기준 표(ID·조건·검증 수단) · 구현 영향 추정(예상 파일·`/studio` 진입 예산 영향 — 현재 129.28/멈춤 129.65, `/profile` 99.87/100 — 진입 closure를 건드리면 조작 뒤 청크 설계 제시) · 위험.
- MQ.md: 영환님·Jarvis 결정이 필요한 질문만, 질문마다 선택지 2~4개 + ★권장안 + 근거 한 줄. 엔진 계약·저장 스키마·예산 증액이 필요한 선택지는 그 사실을 명시.
- 근거는 코드·기존 SPEC 행 인용(파일:행). 추정은 추정으로 표시. 서브에이전트 분할: 권장(읽기 전용 조사 — 관련 코드 경로 / 기존 SPEC·QA 기록 — 2개 이하), 파일 쓰기는 메인만.
- 첫 3턴 안 PROGRESS 커밋 · SPEC 초안 커밋 → MQ 커밋 → REPORT 커밋(로컬 커밋만, push/merge 0, amend·rebase 금지). 시간 상한 60분 · 30턴부터 다듬기 금지·REPORT만.
