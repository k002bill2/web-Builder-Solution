# M2B-1b hardening 独立QA

- 책임 QA / 실행 Orca Claude Code / 보고 Jarvis. 대상 저장소 /Users/younghwankang/Work/web-builder-solution, 격리 worktree m2b-1b-hardening-qa, 검증 구현 HEAD7ff176c, 코드base c79bb65.
- 목적: Popover CSS 보완·링 판정 개선의 독립 회귀 검증. 앱 코드 수정 금지. 쓰기는 dev/active/m2b-1b-hardening-qa/만(스크립트·로그·캡처·PROGRESS·REPORT). npm ci 필요 시 app에서 설치, package-lock 불변. docs/·design/·CLAUDE.md 불변.
- 입력 docs/06-handoff/M2B-1B_HARDENING_BRIEF.md, dev/active/m2b-1b-hardening/REPORT.md·fb.mjs·fbjudge.mjs·qb.mjs·ringjudge.mjs. 그대로 결과 인용만 하지 말고 새 실행으로 검증한다.
- 신규 발견: 실제 FooterLinks는 항상 li 글자이며 m2a SPEC.md 0.10의122행·K1-7의463행이 전부 글자항목으로 정한다. 기존 브리프의 실제 footer a 생성 요구는 잘못된 전제다. QA는 명세·실제 DOM을 직접 대조하여 링크화 없이 이 항목의 **N/A(설계상 포커스 대상0)** 적정성을 판정한다. 결함/숨겨진 링크가 있으면 구분한다. 실제링PASS라고 바꾸지 말 것. 탐침 a 복제본 결과는 운영 마크업과 구별. 기능 추가0.

## 순서·수용기준
1. PROGRESS·REPORT 골격 및 수신 기록(검증 HEAD/base), app 코드 diff 읽기.
2. typecheck/lint/build·표적 popoverFallback.test.ts 재실행. baseline1738 + 새6=1744. 전체suite1회 exit0/Errors0, 기존 단언약화/skip0 확인.
3. 로컬 loopback4337/4339에서 원본 supported header4×3폭 메뉴 열기·Esc·버튼 focus 복귀·앵커 닫기, 메뉴/시트 실제 visibility 검사. 모의unsupported4×3폭 메뉴 링크 접근·nav중복0·버튼0·넘침0·utility 노출 검사. 실제구형UA 없음이면 한계 유지, 모의를 실제미지원검증으로 말하지 않음. 적어도 원본/모의 변환을 검사하고 새 로그로 재실행.
4. 링 판정 도구를 독립 실행: footer actual a 수0을 직접 확인하고 N/A/결함 판정, header실제focus-visible 및 부모 바깥면 수치>=3 확인. 부정 표본 samecolor·저대비·누락focus의 FAIL 검출 여부. 원본스크립트 재사용 가능하나 코드·단언이 미리 결과를 만들지 않는지 검사. 390 nav빈값utility있음 위줄·DOM/시각순서·넘침 확인·캡처.
5. 번들 렌더JS<=89.70/CSS<=30·studio<=127.70 및 baseline127.40 대비증가<=0.03·다른화면±0.03. script상수/KEPT_DATA변경0.
6. 결과를 독립PASS/FAIL/N/A/미판정·원인·근거·새실행/인용 구분으로 REPORT에. 실제 footer링 요구 전제 수정이 적절한지 명시. 추가Codex0. 40턴 한도30턴부터 REPORT 마감. 서브에이전트0.
7. 끝 자기서버cwd확인후자기PID만종료, lsof4337/4339 LISTEN0. main5480무접촉. git commit -- dev/active/m2b-1b-hardening-qa/ 로 기록. push·merge·삭제0, 2a자동기동0. 실패/승인만료면우회0.
