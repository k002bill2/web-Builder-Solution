# M2C-5b QA 브리프 — M2c 조건부 Go 조건 해소(기준선 · 좁은 폭 패널 · F2 캡션)

- 역할 QA(구현자와 분리) / Orca managed Claude Code / worktree m2c-5b-qa / base `2e90e8f`(M2C-5 QA 병합). `app/node_modules` lock 그대로 `npm ci` 완료.
- 출처: `dev/active/m2c-5-qa/REPORT.md` 1·3·6·7절 — 조건부 Go 조건. 새 실행만, 결함은 고치지 않고 재현·심각도·증거. QB-10(새로고침 도달 불가)은 사양 결정 B-M2C-03으로 분리 — 이 레인 범위 밖.

## 범위 (순서 = 우선순위 · 각 단계 PROGRESS 갱신·명시 경로 커밋)
1. **시각 회귀 기준선 30×3 재생성(조건 1)**: `dev/active/m2b-6-qa/{s1-render30.mjs,shots.sh,pdiff.mjs}` 사본을 `dev/active/m2c-5b-qa/`로 옮겨 DIR 경로만 바꿔 실행(원본 수정 금지) → `baseline/` 30변형×1280·768·390 + 같은 문서 2회 픽셀 차이 0(결정성) → m2b-6 기준선과 비교해 `.kit-gradient`→`kit-art` SVG 자리 = 의도된 변경, 그 밖 = 결함 후보로 분류한 표. sandbox iframe fullPage 금지, CDP 캡처 2회 실패 시 Chrome headless `--screenshot`, CSS 원문. 기준선 사용법을 REPORT에.
2. **M2C-3 이관 768·390 패널 판정(조건 2)**: Ego Lite 앱 안 클릭으로 768·390에서 이미지 편집 펼침 → 파일 선택(`dev/active/m2c-5-qa/fixtures/gen-fixtures.mjs`로 재생성) → 실패 문구 → 대체텍스트/장식 → **이미지 지우기 실제 실행**(1280 포함) → 캔버스 반영. 이전 레인 캡처 `shots/m2c3-panel-{768,390}.png`(상자 0) 원인 판정: 좁은 폭 배치에서 패널에 도달 가능한지·조작 가능한지.
3. **F2 캡션 육안(조건 3 일부)**: 캔버스 캡션 "시안 (F2) — …"가 화면에 보이는지(새로고침 없이). 30변형 전수 실렌더·폴백 0도 1단계 결과로 F2 표 갱신.
4. 회귀: 전체 vitest 기본 1회 exit0(부하 타임아웃 시 단독 후 전체 1회), build 번들 표.

## 제약
- 앱 코드·테스트·docs·design·package*.json/lock·CLAUDE.md·scripts·`dev/active/` 다른 레인 폴더 수정 0. 쓰기는 `dev/active/m2c-5b-qa/`만. 바이너리 대용량(내보낸 PNG·fixture)은 `.gitignore`, 기준선 PNG는 커밋(용량 기록). 새 의존성 0. BRIEF P0 명시 커밋.
- **Ego Lite(영환님 지시):** 화면을 실제로 보고 판정·캡처 `dev/active/m2c-5b-qa/shots/`. 끝나면 이 레인이 연 Ego Lite 창·탭 모두 `finish({keep:[]})`로 닫고 `listTaskSpaces()`=[] 재확인 기록. 앱 안 클릭만, 새로고침 금지.
- Safari·Firefox 미검증 표기. N/A를 PASS로 쓰지 않음.
- 서브에이전트 0, 4337/4339 loopback·자기 PID cwd 확인 종료·리슨 0, main 5480 무접촉, push/merge/삭제 0, 승인 실패 우회 금지.
- **턴 관리:** 기준선이 가장 무겁다 — 1단계에서 30턴을 넘기면 2단계로 넘어가고 남은 변형은 목록으로 남김. 60턴 도달 시 새 측정 중단 → 창 닫기 → vitest → REPORT. REPORT(한국어): meta·조건별 판정·기준선 표·결함·**M2c Go/조건부 Go/No-Go**·책임/환경.
