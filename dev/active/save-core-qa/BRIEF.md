# SAVE-CORE 독립 QA — 구현물 8da53e0 회수
책임QA / Orca Claude Code. 새worktree save-core-qa. 쓰기 dev/active/save-core-qa/만. 제품app/·코어save-core-harness/·계약/예산변경 및merge/push/새의존성금지. 사용자 승인 하네스 구현검증 포함 독립QA. Designer생략 UI없는검증.

입력 dev/active/save-core-harness/{BRIEF,README,MINIMAL-CONTRACT,REPORT,core,test,rawlogs}. 자기검증23test/5files,tsc/lint0. H4PARTIAL; 실제IDB없고memoryPersistence사용. 'IDB재읽기receipt'란실제브라우저IDB가아님. 제품동작해결주장금지.
1.npm ci(app,lock0) 후 하네스동일명령 fresh2회/tsc/lint exit와Errors줄확인,예상23total 유지. TDD commit순서/RED로그/빠진단언·mutations검토. report주장과scope appdiff0확인.
2. H1~H5 실제core code에서반례찾기(딱범위). QA1~4/CX1 staleproof·receipt같은세대·dirtypublish·discard메모리commit과inflight. 특히읽기검증과다른writerwrite사이 TOCTOU, concurrentconfirm/save 큐, Blobbinding읽기/clone, fail후partialtx, sameid다른Blob, replacedepoch를검사. 새반례테스트는자기QA폴더에만추가(원본코어readonly). 테스트유리하게고치지말고정확결과보고. 제품mock경계와모델내버그구분.
3. 실제IDB 미검증보완 가능성을우선15턴안확인: 기존vite+browser/Ego도구로 전용loopback origin4367(비었는지확인)에서 자기폴더browser probe, core읽기전용import/제품idbPersistence 어댑터로 IndexedDB tx oncomplete·reload후doc/Blob재읽기·abortdoc/image같이rollback을실행. 새패키지/제품수정0. 실제WebLocks실행가능하면전용origin2탭잠금취득·해제·stale; 불가시BLOCKED원인정확표기. 사용자5480/originDB 절대무접촉. 브라우저테스트DB prefix save-core-qa-만생성,끝삭제. 실서비스연결0. 단순IDBprobe만돌면core제품통합증명아님. 어댑터미결합/모델대체범위보고. 15턴내브라우저부트불가시면책되지않고H4remainPARTIAL보고,남은QA진행.
4.Codex 리뷰는구현물대상1회필요시(문서루프아님),≤1; 자신의반례단언→원문검토순서구별. 결과불일치근거로보고. 새로운수정자동0.
5.REPORT: independent자동검증,H1~5,반례,realIDB실행/미실행,memoryfake/locks/React제품미연결 각별도. rawexitmanifest/logs tracked+자기증거커밋. 서버/taskSpace정리·port0. 최대40턴50분,30부터추가실험0/마감. 서브에이전트불필요. 문제발견시끝없이fix시키지말고BLOCKED보고. 책임Jarvis회수후다음범위결정.