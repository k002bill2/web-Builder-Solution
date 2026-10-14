# EXPORT-SYNC-QA — 기존 병합 export 안내 독립 검증

책임 역할 QA / 실행 환경 Orca + Claude Code. base dcce2ec. 쓰기는 dev/active/export-sync-qa/만. 앱 코드 수정·push·merge 금지.
사용자 승인 1→2→3: main push → fix/dev-export-reason 검증/병합 → B-RS-02·03. 실제 조회 결과 영환님 Claude 세션이 이미 ccf7b78을 dcce2ec로 main 병합했으므로 중복 병합하지 않고 이 HEAD를 검증한다. 원격 push 및 read-back은 Jarvis가 완료.

1. npm ci 후 typecheck·lint·전체 vitest·build 실행. 각 명령 exit code·raw log 파일을 보존하고 REPORT에 파일/테스트 수 기록. diff check.
2. codex-companion review --scope branch --base 572fdef로 export 변경 검토 1회. Codex 쓰기 금지. 지적은 고치지 않고 보고.
3. 가능하면 build+preview 포트 4367에서 static HTML 내보내기 성공, dev 포트 4369에서 환경 안내 문장 확인. PNG dev 안내는 별도 미병합 a180cfa 브랜치이므로 없다고 main 회귀로 판정하지 않는다. 검증된 경로 dev/active/field-undo-1/qb-flow.mjs 참고. 15턴 안 UI 경로 미도달이면 BLOCKED 명시하고 게이트 보고로 마감. status/alert DOM 원문 기록.
4. 범위 사용자 흐름 QA도 표본 확인: 필드/이미지 실행 취소, 이탈 저장 유지, 새로 시작→스냅샷 복원 중 시간 안 가능한 항목. 미측정을 PASS로 쓰지 않는다.
5. REPORT(검증·Codex·runtime 각 분리)와 PROGRESS 커밋. 서브에이전트 불필요. 최대40턴, 시간60분. 서버 종료·본인 taskSpace finish·port 리슨0 확인. 다른 창·worktree 무접촉. 계약·예산·기준선 변경0. 문제시 멈춤. 뒤로가기 저장 보장은 B-RS-01 범위 밖 한계로 유지.
