# RS8-3 BRIEF — 편집기 알림·390 상태 줄·폐기 대화상자 포커스 정리 명세 (B-RS-10~13) (Designer, 명세만)

책임 역할: Designer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (직전 보고 3번 — Designer 판단 필요)
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs8-ux-polish-spec`. 쓰기 경로: `docs/design/restart/UX-POLISH-1.md`(신설) · `dev/active/rs8-ux-polish-spec/`만. 앱 코드 수정 0(관찰용 임시 변경도 금지 — 실화면 관찰만).

## 대상 (BACKLOG 원문 — `docs/06-handoff/BACKLOG.md` B-RS-10~13)
- B-RS-10: 폐기 시간 초과 상태에서 글자 있는 alert 2개(상태 줄 stale alert + 대화상자 timeout alert)
- B-RS-11: 편집기 `role=status` 2개 — "편집 알림"(셸) + `PngSave.tsx:76`
- B-RS-12: 390에서 상태 줄·stale "버리고 새로고침"이 내부 스크롤 위치에 따라 화면 밖(sticky 아님)
- B-RS-13: 폐기 대화상자(390) Tab 2회째 `activeElement` = BODY(네이티브 `showModal` 순환 추정)

## 할 일
1. **현상 확인(실화면)**: build + preview `--port 4391 --strictPort`. 각 항목 재현 · 스크린샷(`dev/active/rs8-ux-polish-spec/shots/`) · 접근성 트리(role·live region) 관측. B-RS-13은 Chrome 네이티브 `<dialog>.showModal()` 포커스 순환이 문서 밖(브라우저 UI)으로 나가는 **표준 동작인지** 판정(근거: HTML 사양 dialog focus 관련 문장 인용 — 외부 웹 조사 필요 시 사양 원문 1~2회만, 출처 URL 기록).
2. **명세 `UX-POLISH-1.md`**: 항목별 — 문제 · 사용자 영향(스크린리더·키보드·390) · 결정안(★1 + 대안 1) · 상태표 · 수용 기준(UXP-AC-NN, 단위/실화면 구분) · 구현 위치 힌트(파일) · 예산 영향 추정(`/studio` 정규화 128.66/129.13 · 여유 0.47 — 진입에 들어가는지). live region 원칙(편집기 안 status 1개 · alert 1개)을 정본(INTEGRATE-6 r2 8.4 · UX-5)과 대조해 충돌 없게.
3. "고치지 않음(표준 동작·수용)" 판정도 정당한 결론이다 — 근거와 함께.
- 산출물: `UX-POLISH-1.md` · `dev/active/rs8-ux-polish-spec/{PROGRESS,REPORT}.md`(결정 요약 · 사용자 결정 필요 질문 번호 목록 · 사실/추정/미확인).
- 정리: IDB 삭제·`finish({keep:[]})`·서버 종료. 5480 무접촉.
- 서브에이전트 분할: 불필요. 최대 45턴, 35턴부터 마감.

## 공통
- base origin/main `494a7c6f`. 병렬 레인 3개(`rs8-roadmap-status` · `rs8-row-reason` · `rs8-ux-polish-spec`) — 다른 레인 쓰기 경로 접촉 0.
- 명시 경로 커밋, amend·rebase·push·merge·원격 쓰기 0. 첫 3턴 BRIEF·PROGRESS 커밋. REPORT 초안은 마감 10턴 전 커밋. 사실/추정/미확인 구분.
- preview를 띄우면 마지막 커밋 직전 종료 → `lsof -nP -iTCP:<포트> -sTCP:LISTEN` 출력 0을 REPORT에 기록.
- **마감 전 `git status --short`가 node_modules 외 빈 값**(로그도 커밋하거나 지운다).
