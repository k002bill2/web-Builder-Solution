# M2C-REQA QA 브리프 — M2c 백로그 정리 재검(T-5 · T-6 · 기준선 6장)

- 역할 QA(구현자와 분리) / Orca managed Claude Code / worktree m2c-reqa / base `25687fd`(M2C-SPECFIX·P3·TODO 병합). `app/node_modules` lock 그대로 `npm ci` 완료.
- 목적: 정리 레인 결과를 **새 실행**으로 판정. 결함은 고치지 않고 재현·심각도(P0~P3)·증거.
- 입력: `dev/active/m2c-specfix/IMPL-TODO.md` T-5·T-6, `dev/active/{m2c-p3,m2c-todo}/JARVIS_FINAL.md`, 정본 `docs/design/m2c/SPEC.md` r3(2.7·9절 QB-10), `docs/design/m2a/SPEC.md` r3(K1-6 3·K-AC-37·5절 ⑩), `docs/design/m2b/SPEC-COMPARE3.md` r3(2.1·4), `docs/design/m2b/SPEC-BODY.md` r5. 기준선 도구·사용법: `dev/active/m2c-5b-qa/REPORT.md` 2절.

## 범위 (순서 = 우선순위)
1. **기준선 갱신**: m2c-5b-qa 기준선 스크립트 사본(DIR·space만 변경, 원본 수정 0)으로 30×3 재캡처 → m2c-5b `baseline/` 대비 차이가 **contact--form·contact--booking × 3폭(6장)**에만 있고 그 안에서도 `.kit-fieldset:disabled` 자리(입력칸·버튼·안내 상자)에만 있는지 분류. 새 기준선 90장 `dev/active/m2c-reqa/baseline/` + 결정성 2회 0/90. 밖 차이 = 결함 후보.
2. **비활성 폼 판정**: 1280·768·390 육안 — 점선·안내 상자·흐림 0(K-AC-37). **개인정보 동의 체크박스**가 브라우저 기본 disabled 모양으로 흐리게 보이는 것이 SPEC 흐림 금지 대상인지 판정(대상이면 결함 P3, 아니면 근거).
3. **T-5 QB-10 새 경로**: 이미지 2장 → 툴바 "프로젝트" → 같은 프로젝트 편집기 복귀 → 잃은 이미지(필드 "다시 골라 주세요"·자체 그래픽·F2 캡션 N장) → 정적 HTML·PNG 개수 문구. 스냅샷 복원 경로는 미구현이라 제외.
4. **T-2·P3 실화면**: 이미지 넣기 → 대체텍스트 → 바꾸기(빈칸·장식 해제·status "이미지를 바꿨습니다…") → 지우기(빈칸·"이미지를 지웠습니다"·포커스 "이미지 고르기") → 폭 1280→768→390 펼침 유지 → 도움말 문구.
5. **T-6**: ① 비교 대화상자 1안씩 모드 "보는 안" 라디오·"다시 그리기" Tab 위치 실측(SPEC-COMPARE3 r3 4) ② ⑩ 내보내기 동일성 — m2a 7변형 중 가능한 범위(캔버스 vs 정적 HTML vs PNG 같은 모양) 실측, 못 하면 사유.
6. 회귀: 전체 vitest 기본 1회 exit0(부하 실패 시 단독 후 전체 1회), build 번들 표.

## 제약
- 앱 코드·테스트·docs·design·package*.json/lock·CLAUDE.md·scripts·다른 레인 폴더 수정 0. 쓰기는 `dev/active/m2c-reqa/`만(대용량 바이너리 .gitignore, 기준선 PNG 커밋). 새 의존성 0. BRIEF P0 명시 커밋.
- **Ego Lite(영환님 지시):** 화면을 실제로 보고 판정·캡처 `dev/active/m2c-reqa/shots/`. 시작 전 `listTaskSpaces()` 확인. 끝나면 이 레인이 연 Ego Lite 창·탭 모두 `finish({keep:[]})`로 닫고 `listTaskSpaces()`=[] 재확인 기록. 앱 안 클릭만, 새로고침 금지. ego-browser는 env를 넘기지 않으니 space id를 스크립트에 직접 적을 것.
- Safari·Firefox 미검증 표기, N/A를 PASS로 쓰지 않음.
- 서브에이전트 0, 4337/4339 loopback·자기 PID cwd 확인 종료·리슨 0, main 5480 무접촉, push/merge/삭제 0, 승인 실패 우회 금지.
- **턴 관리:** 60턴 도달 시 새 측정 중단 → Ego Lite 창 닫기 → vitest → REPORT. REPORT(한국어): meta·항목별 판정(PASS/결함/환경 한계/미검증 + 증거)·기준선 분류표·결함·**정리 완료 Go/조건부 Go/No-Go**·책임/환경.
