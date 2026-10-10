# BACKLOG-TRIAGE Developer 브리프 — 열린 백로그 실상태 판정 (코드 수정 0)

- 역할 Developer / 실행 환경 Orca managed Claude Code / worktree `backlog-triage` / base `main` `46b85af`.
- 목적: `docs/06-handoff/BACKLOG.md`에서 닫힘(✅·취소선) 표기가 없는 항목이 **현재 main 코드에서 실제로 열려 있는지** 근거로 판정하고, 다음 수정 레인 구성의 입력을 만든다.
- 배경: Jarvis 사전 확인에서 표기와 코드가 어긋난 사례 2건 — B-ER-04(`StudioLayout.tsx:239` 주석에 B-ER-04 처리), B-DET-02(`DetailSidebar.tsx:144` `line-clamp-2` + `ReferenceDetailPage.test.tsx:424` 단언). 즉 BACKLOG 표기가 낡았을 수 있다.
- main 상태(Jarvis 실측 2026-10-10): typecheck·lint·vitest 296파일/2650 통과·build exit 0.

## 대상 항목
D-QA01 · B-DET-02 · B-DOC-01 · B-M2B-01 · B-M2B-02 · B-M2B-03 · B-M2B-04 · B-M2B-05 · B-M2B-09 · B-M2C-01 · B-M2C-09(②③) · B-ER-01 · B-ER-02 · B-ER-04 · B-ER-05 · B-ER-06 · B-ER-07 · B-ER-08 · B-ER-09(<1280 스냅샷 이동) · B-ER-11(390 실화면) · B-M3P-03 · B-M3P-04

## 작업
1. P0: `dev/active/backlog-triage/PROGRESS.md` 생성(항목 체크리스트).
2. 항목마다 근거 수집: 관련 코드 위치(파일:행), 해당 테스트 유무, `git log --oneline -S`/`--grep`로 처리 커밋 탐색. 실브라우저 재현은 하지 않는다(정적·테스트 근거만).
3. 판정 4종: `닫힘(근거 커밋/테스트)` · `열림-코드 수정만(Developer 단독 가능)` · `열림-결정 필요(Designer/SPEC · 예산 · 엔진 계약 · 백엔드 · 영환님 승인 중 무엇)` · `열림-실화면 QA 재검만`.
4. `열림-코드 수정만` 항목은 예상 수정 파일·예상 테스트·`/studio` 진입 예산 영향(진입 closure 변경 여부) 추정을 한 줄로.
5. `docs/06-handoff/BACKLOG.md`의 닫힘 확인 항목만 기존 표기 관례(`✅ … 닫힘(커밋)`)로 갱신. 열린 항목 문구는 바꾸지 않는다.
6. 결과 `dev/active/backlog-triage/REPORT.md`: 항목별 판정 표 + 다음 수정 레인 제안(쓰기 경로가 겹치지 않게 묶음, 묶음별 예상 파일).
7. 로컬 커밋 2개 이내(`docs(backlog-triage): …`).

## 금지·경계
- `app/` 소스·테스트·lock·`CLAUDE.md`·`design/` 수정 0. 새 의존성 0. push/merge/브랜치 삭제 0. amend·rebase 금지.
- 서브에이전트 분할: 권장(읽기 전용 조사 2~3개 — 편집기(B-ER-*) / 킷·렌더(B-M2B-*·B-M2C-*) / 기타). 동시 4개 이하, 파일 쓰기는 메인만.
- 판정 근거 없는 "닫힘" 금지 — 확실하지 않으면 `열림(확인 불가: 사유)`.
- 턴: P0 3턴 전 · 조사 20턴 전 마감 · REPORT 26턴 전. 한국어.
