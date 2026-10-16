# RS5 전용 저장 확인 계약 설계 — 사용자 1번 승인

책임 Developer / Orca Claude Code. 전용worktree rs5-contract, base467a691(앱93f8111). 목적: 삭제API차용을 버리고 내용·이미지·진행중저장을 함께 다루는 명시적 기술 계약 산출물1개를 설계. 사용자 최신1은 '계약 설계만 승인; 구현·예산상향별도'이다. source/interface 실제변경/실험코드/예산파일수정/merge/push/새의존성 금지.

## 입력
- docs/design/restart/SPEC-4.md,MQ-4.md (폐기될 초안, 구현명세 아님)
- dev/active/rs4-measure/REPORT.md·rawlogs/04-p3-harness.txt·patches·harness(실측467a691)
- /Users/younghwankang/orca/workspaces/web-builder-solution/rs4-review/dev/active/rs4-review/REPORT.md 및 logs/codex-r1.txt 읽기전용(별도worker파일수정0)
- 실제projectRepository/memoryProjectRepository/localSync/writeQueue/imageOps/useDocSave/useAutosaveScheduler/StudioLayout 및 ADR007·004.

## 핵심 범위
1. CONTRACT-5.md에 하나의 추천 API를 typed pseudocode와 semantics로 정의(실제 .ts수정0). 이름만 confirmDoc 붙이는 flush가 아니라 스케줄러가 아직 commit하지 못한 doc/image와 repository pending을 구분. 탭/프로젝트 owner 하나, generation/token, immutable snapshot/document+image binding, request in-flight, dedupe/order/cancel/dispose/POP lifetime을 명세. 최신draft를 이전save resolve가 지우지 못함을 불변식으로 설정.
2. 성공은 local모드에서 해당 generation의 doc+이미지 IDB tx oncomplete(혹은 구체적으로 안전한 트랜잭션 구성)로 정의. memory fallback에 persistent confirmed를 표시금지. 이미지Blob 참조 수명/복원/등록해제 이후재시도·소유권을 명시. 일부쓰기·quota·readonly/stale/cleared·unsupported·offline·commit전/후·response failure 상태결과를 구분. 최신편집은 동일version보다 savedVersion/pending세대와연결.
3. start 재시도와 current-draft 저장 확인을 분리. R-E5 no-commit을 confirm할때 원치않는 restart 첫commit 금지(명시적사용자 의도/재판정), 문서가 교체되면 UI doc/revision/image base 인계. 빈id스냅샷삭제·위장no-op save·불필요revision증가금지. 겉API뿐 아니라 내부소유상태/최소interface delta표제시.
4. QA Q1/Q2/Q3/Q4/Q5/Q6/Q7/Q8/C1/C2/C3 각각 → 새계약해결/상위UI명세필요/미확인 대조표. 오랜저장A→편집B→POP→Aresolve, getDoc먼저→Acommit, confirm전dirty/offline, 새이미지등록→lock거절→이탈→confirm, unknownorigin, callerunmount, create기억 지속에 대해 구체적인 순서·기대상태로 test plan. 상위UX설계는 이계약회수뒤 Designer가 맡음, 지금 UI일괄재설계금지.
5. 최소변경/운영가능성 우선. 공유 coordinator/API1안과 대안1개만 비교. 새스키마가필요한지 기존레코드로충분한지 근거명시. 저장소interface 변경은 '제안'이지 실행승인아님. unload guard는 보장아닌안전층, 모바일종료/크래시데이터손실잔존. 보안권한·기존탭writer규칙유지.
6. 번들연결: 실제S1r129911/132944, S2/S3초과, pending131163/134196. 새구조증분은미측정으로표기. loaded-on-action vs entry ownership표·후속스파이크 측정방법/시나리오를명시. 본레인측정0·예산자동상향0. 절대130000/134000 및 판정선129900/132940를구별. 수치없는예상KB꾸며내지말것.

## 산출물/검토/마감
쓰기 docs/design/restart/CONTRACT-5.md, dev/active/rs5-contract/{PROGRESS,REPORT,logs}만. 기존SPEC/ADR/CLAUDE/app변경0. PROGRESS3턴내 → code trace → invariant/types/transitions → testplan → review → report 체크포인트. 서브에이전트권장 읽기전용2개(저장큐/이미지원자성, UI generation/lifecycle), 최대4 메인통합.
Codex 기술설계adversarial-review1회만(base467a691), 이전리뷰반복금지/--help부수실행금지. 지적반영1회까지하고 미재검토명시. 새계약선택/위험을숨기지말것. 45턴60분, 35턴부터마감우선. 명시적pathspec커밋+diffcheck. REPORT: 추천계약/변경범위/기존결함매핑/새결정/검증실행vs미실행. 구현착수0; 책임Jarvis회수후승인요청.
