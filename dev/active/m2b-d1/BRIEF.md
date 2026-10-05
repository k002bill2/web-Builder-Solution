# M2B-D1 Developer 브리프 — PNG 높이 비결정(D-1) 원인 판정·수정

- 역할 Developer / Orca managed Claude Code / worktree m2b-d1 / base `a121f31`(M2B-6 QA 병합, 조건부 Go).
- 출처: `dev/active/m2b-6-qa/REPORT.md` D-1 — /studio "PNG 내려받기" 3회 중 2회 1280×10492(하단 ≈6,955px 검은 빈 영역, 두 파일 SHA 동일), 1회 1280×3537(정상). 내용 영역은 같음. 증거 `dev/active/m2b-6-qa/exports/site-{1,2,3}.png`, `logs/s4-export.json`.
- QA 추정(L3): `features/studio/png/pngCapture.ts` 101행 `renderAndSerialize(..., (r) => pageBottom(r) > 0, ...)` — 바닥 > 0이면 받아들여, 최종 배치 전(예: iframe 폭 미적용·글꼴/레이아웃 미확정) rects 높이가 쓰일 수 있음. 키 관찰: 높이가 커지고 내용은 같음 → 좁은 폭/이른 배치에서 잰 높이가 1280 캡처에 쓰였을 가능성.

## 순서 (PROGRESS·명시 경로 커밋, RED 전 새 테스트 수 예측 커밋)
1. 원인 판정(코드 변경 전): 높이를 정하는 rects가 어느 시점·어느 폭에서 오는지 코드 경로로 확인하고, 분류 — (a) 그리지 못함 (b) 그렸지만 잘못된 배치/폭에서 측정 (c) 캡처 도구·환경 한계. 가능하면 Chrome headless(포그라운드에 가까운 정상 rAF) 또는 테스트 하네스로 재현 시도, 원시 로그 보존.
2. (a)/(b)면: 재현 단위 테스트 RED(예: 첫 rects가 좁은 폭/이른 배치 값, 이후 최종 rects 도착 → PNG 높이는 최종값이어야) → 최소 수정 GREEN. 판정 조건은 SPEC 정의를 따르되 기존 실패 정책(글꼴 5초·전체 8초 상한, RENDER_TIMEOUT)과 정적 HTML 경로 동작 불변.
3. (c)면: 코드 수정 0, 증거로 환경 한계를 증명하고 REPORT로 닫기(추정으로 닫지 말 것).
4. 마감: 표적·가드·typecheck·lint·build, 전체 vitest 기본 1회 exit0·Errors0, 가능하면 headless로 같은 문서 PNG 5회 높이 동일 확인, Codex review --scope branch --base a121f31 실제 완료(라운드 ≤2), REPORT.

## 제약
- 렌더 문서 JS/CSS·/studio 진입 증가 원칙 0(변화 시 수치 기록, 멈춤선 /studio ≤127.37·렌더 JS ≤89.70). 예산·ADR·가드 완화 금지.
- 4a 폰트·4b 모션·M2B-5 비교 동작 불변. 단언 약화·skip 0.
- package*.json/lock·CLAUDE.md·docs/design·docs/decisions 수정 0, 새 의존성 0. 서브에이전트 0, 4337/4339 loopback·자기 PID cwd 확인 종료·lsof 0, main 5480 무접촉, push/merge/삭제 0, 승인 실패 우회 금지.
- 35턴부터 마감 우선. REPORT(한국어): meta·분류와 근거·RED/GREEN·전후 높이·Codex·한계·책임/환경.
