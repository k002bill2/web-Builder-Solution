# RS4-MEASURE 마감만 — max-turns 1회 회복
책임 Developer / Orca Claude Code. 이전55턴실행이 max_turns_reached로 종료. 조사·측정·코드반복 금지. 같은 범위 턴상향 재시작이 아니라 남은 마감만.
현재 HEAD254d9c8, 앱 tracked diff0(감독조회), untracked rawlogs10..31·patches·tools/.rawbytes.gen.mjs 있음. REPORT없고 PROGRESS 미갱신. 파일을 읽어 기존 결과를 집계한다.
1. S1/S1r/S2/S3 rawbytes·build로그·패치를 읽어 정확한 route rawbyte baseline/head/delta/판정 표를 작성. 모든 미확인 pending 시나리오는 UNMEASURED/UNAPPROVED, 통과로 쓰지 말것. prototype 최소 스파이크일뿐 제품구현아님. QA 새 지적은 ../rs4-review가 다른worktree라 무접촉, 참고보고는 Jarvis가 처리.
2. source·lock이1a48ce8과 동일인지 git diff 및 untracked앱파일 확인. base 재빌드 1회만 npm run build, rawbytes 생성기동일방법으로 base와 byte동일확인. 차이 원인 못밝히면 복원검증BLOCKED. 테스트반복0, 새스파이크0. 서버있으면 자기cwd확인종료.
3. REPORT·PROGRESS를 작성·갱신. P3 하네스결과 명시: 이미지누락실재, offline옛내용resolve, 빈id실재snapshot삭제케이스. deleteSnapshot(p,"") 안전한confirm으로승인불가. 새 인터페이스/예산상향 필요여부는 측정근거 구분. S3 incomplete/예산초과원문 보존. 숫자추정금지.
4. rawlogs·patches·harness·마감문서 명시pathspec 커밋. generated dotfile는 필요한측정코드로인증되면보존, 불필요하면path기록하고범위내삭제. 앱diff0·gitstatus·최종SHA보고. 합치기/push0. 18턴20분, 10턴부터REPORT마감우선. 서브에이전트불필요. 재턴상한이면실행중단하고증거만보존.