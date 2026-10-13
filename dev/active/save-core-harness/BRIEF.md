# 저장 코어 검증 하네스 — 구현/실행 계획 (사용자1 승인)
책임 Developer / Orca Claude Code. worktree /Users/younghwankang/orca/workspaces/web-builder-solution/save-core-harness. base5b7d026(앱93f8111). 승인: 격리하네스 안 저장코어 구현·검증. 제품app/·main·예산·ADR·기존계약파일변경/새의존성/실서비스DB접속/merge/push 금지. 작업후 QA가별도독립검증. Designer 생략: UI없는코어하네스, UX초안이미존재.

## 목적
문서/모델리뷰루프를끝내고 실제실패를 RED→GREEN으로재현하는 작은코어1개. CONTRACT-5는 참고일뿐완성명세아님. 부정확API전체를그대로구현하지말고 test로최소계약확정. 모든코드/테스트/하네스config/report는 dev/active/save-core-harness/ 아래만. 제품repository 실제 변경0.

## 입력/실제경계
- dev/active/rs5-review/REPORT.md 및 logs/qa-independent.md (P1 QA1~4 CX1, P2QA5~9)
- docs/design/restart/CONTRACT-5.md 및 기존rs4-measure/harness/rs4P3.harness.test.ts (실제이미지/IDB테스트)
- 추가읽기전용 /Users/younghwankang/orca/workspaces/web-builder-solution/rs5-spike/dev/active/rs5-spike/REPORT.md, /Users/younghwankang/orca/workspaces/web-builder-solution/rs5-ux/docs/design/restart/UX-5.md
- 제품idbPersistence/writeQueue/localSync/imageOps/DocBook/scheduler 읽기전용. 실제IndexedDB테스트는 기존fake-indexeddb등 설치된도구사용. mock이무조건성공을반환하면증명아님. 외부서비스없음.

## 최소수용기준(5개 vertical checkpoint)
H1. 저장A진행중편집B→POP/cleanup→A완료: B doc/Blob보존, newer=true/미저장상태, 영구confirmed=B금지. 실제transaction完了앞뒤를deferred gate로제어. publish전dirty편집도포함(코어동기snapshot provider또는불변draft즉시등록등단순안하나). 늦은callback generation식별.
H2. 디바운스전B편집→confirm: 최신B문서+이미지IDB커밋또는명시적실패(확정단정0). confirm시작전/진행중mark모두확인. memoryfallback/unsupported는persistentconfirmed0. 실제committedreceipt(정확문서hash·이미지id·세대)반환으로I2모순대신검증.
H3. 새이미지→writer lock거절/submit전실패→이탈→재시도: 동결된binding보존,IDB images 레코드·리로드후Blob내용일치. quota/transactionabort도모두doc+image함께실패후함께성공. 삭제API차용0·빈snapshotid보존. 부족이미지면제출0. 가짜성공메모리맵만검증금지.
H4. 탭A확인→탭B실제저장(세대증가)→A wrote:false confirm: 오래된증명으로거짓confirmed0. 실제IDB초기화·읽기·transactioncommit을사용, writer권한검사는작은adapter로명시mock범위기록. actualWebLocks/browser멀티탭은실행안했으면NOT VERIFIED. hydration같음과freshproof구별.
H5. replace/discard와inflight: dirty미publish도충돌인식, 옛완료가최신초안덮어쓰기0·폐기초안부활0. 최소안으로inflight시discard거절/동작disable, memorycommit후확인안된것은 '초안삭제'만으로폐기성공금지(명시blocked→보존). 저장된상태로복귀가능하면근거증명; 구현복잡시반드시안전거절. start retry와confirm분리: confirm이startDoc호출0, R-E5재시도문서교체는명시intent요청, 예상revision/epoch충돌0. 임대StrictMode멱등은간단regression.
각checkpoint 1.RED단언/예상delta(먼저PROGRESS)→실제실패rawlog→2.최소코어구현→GREENrawlog→3.기존하네스전부pass/로컬pathspec커밋. REDonlytip0,amend/rebase0. H1~H5 test총수는최초예상범위제시후 실제추가수와대조. fakeIndexedDB하네스결과와제품경계미검증을명확구분.

## 실행/산출물
npm ci(app,lockdiff0) 후 기존vitest/TS도구를실행경로로사용, harness독립config을자기폴더에작성(제품config변경0). 예: app/node_modules/.bin/vitest run --config <하네스config> (worker가정확command확정하여README에남김). 필요existingdeps만,설치추가금지. 엄격타입/신규코드lint는기존도구와읽기전용config로검증. 하네스fullsuite2회(단일seed deterministic, unhandled errors exit검사), 타입검사. 제품baselinefullsuite1회(종료전60턴이전에가능하면,불가미실행표기). 실제앱회귀PASS를하네스통과로대체금지.
README실행command,MINIMAL-CONTRACT.md(실제구현에서검증된API/불변식·거절동작·기존API통합gap), REPORT(H1~H5별PASS/PARTIAL/BLOCKED,REDchronology,exact총수,rawlogs,제품미연결,브라우저/예산미측정),PROGRESS. 저장된테스트데이터는fakeIDB/전용dbname로만,사용자실제IDB접속0.
Codex같은문서재리뷰0. correctness리뷰는뒤독립QA, 발견새결함을무제한기능으로늘리지말고H범위결함만닫음. max80턴75분. 55턴부터새범위금지/실행·로그/보고마감,70턴부터REPORT우선. 서브에이전트불필요(하나의코어상태/직렬TDD가공유경로). 중단시체크포인트보고. 마지막appdiff0/lock0/기준선변경0/gitstatus·pathspeccommit증거제시. 예산측정/제품적용승인별도.
