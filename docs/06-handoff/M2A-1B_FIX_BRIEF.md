# M2A-1b — 390 폭 캔버스 빈 화면 진단·수정 + M2A-1 마무리 커밋 (Developer)

- 책임 Developer / 실행 Orca + Claude Code · 보고 Jarvis · 포트 4337(127.0.0.1) · `--max-turns` 40 · `--effort` medium · **30턴부터 REPORT 우선**
- 서브에이전트 분할: 불필요 — 429 이력으로 이 프로젝트는 금지 유지
- worktree·브랜치: M2A-1과 같다(`k002bill2/m2a-1`, HEAD `96e400c` + 미커밋 REPORT·로그). 상위 브리프 `docs/06-handoff/M2A-1_RENDER-BASE_BRIEF.md`. 이 작업은 M2A-1의 재실행이 아니다 — 목적은 아래 하나다.

## 배경 (Jarvis 회수 결과)
- 게이트는 통과했다: typecheck·lint 0, 전체 vitest 3회 1447/1447, build `/studio` 91.72/123.88 · 렌더 문서 JS 76.24 / CSS 4.60.
- 그러나 스크린샷 대조에서 회귀가 의심된다.
  - `dev/active/m2a-1/shots/r0-390.png`(시작 커밋): 캔버스에 섹션 9개가 그려진다.
  - `dev/active/m2a-1/shots/r5-390.png`(R5): 캔버스가 **비어 있고** 부모 오버레이(Hero 라벨 칩·경고 테두리·문제 문장)만 보인다.
  - `shots/r5-1280.png`는 정상(섹션·"구조 미리보기" 표식·문구 보임).
  - 재개 실행의 390 재측정(`r5-viewport.mjs`)은 `waitForFunction` 15초 시간 초과(`logs/r5-viewport.txt`). REPORT 85행 `R5_390_NOTE` 자리표시가 남아 있다.
- jsdom 단위 테스트는 iframe 안을 그리지 않으므로 이 문제를 잡지 못한다.

## 범위 (체크포인트마다 PROGRESS 갱신·로컬 커밋)
1. **F0 남은 산출물 커밋**: 지금 미커밋인 `REPORT.md`·`PROGRESS.md`·`logs/{final-full-x3,r5-viewport,r6-codex-review,r6-render-modules}.txt`·`r5-viewport.mjs`를 먼저 커밋한다(내용 수정 없이).
2. **F1 진단(실제 브라우저)**: vite dev 127.0.0.1:4337에서 `/studio/project-1`을 **실제 뷰포트 390·1024·1280**에서 연다(1280에서 "모바일" 폭 전환과 별개로, 창 자체가 좁은 경우). 각 폭에서 다음을 기록한다(`logs/f1-diagnosis.txt`).
   - iframe의 `getBoundingClientRect()`(폭·높이) · 계산된 `zoom`/`transform`/`visibility`/`display`
   - 부모가 받은 `ready`·`rects` 메시지 수와 마지막 rects 범위(최대 y+h)
   - iframe 높이 계산 결과(REPORT 3절 "iframe 높이 = 섹션 사각형 맨 아래")
   - 스크린샷(`shots/f1-<폭>.png`)
   - 판정: (a) 실제로 안 그려짐(회귀) / (b) 그려졌지만 크기·축소·높이 0 등으로 안 보임(회귀) / (c) 화면에는 보이는데 캡처 도구가 교차 출처 iframe을 못 찍음(도구 한계 — 이 경우 사람이 볼 수 있는 증거를 다른 방법으로 남긴다: 예 렌더 문서를 별도 탭으로 직접 열어 같은 메시지를 주입한 캡처, 또는 CDP 대상별 캡처).
3. **F2 수정(a·b일 때)**: 원인을 고정하는 **실패 테스트를 먼저**(RED, 단위로 잡을 수 있으면 단위 — 예: 좁은 폭에서 축소 비율·iframe 높이 계산 함수) → 수정(GREEN). 수정 뒤 F1을 같은 방식으로 다시 돌려 390·1024·1280 모두 섹션이 보이는 스크린샷을 남긴다(R0 스크린샷과 나란히).
4. **F3 REPORT 갱신**: `R5_390_NOTE`·`VITEST_SUMMARY` 자리표시를 실제 내용으로 바꾼다(VITEST: 레인 6회 중 고부하 2회 `StudioShell` 1건 실패 · Jarvis 단독 10/10 · Jarvis 전체 3회 1447/1447). F1 진단 결과·원인·수정·증거 경로를 새 절로 더한다.

## 제외
- 새 기능 · 킷 · 오버레이 문장 위치 변경(Designer 결정 대기) · Codex P2 manifest 병합 수정 · 렌더 문서 예산 대책.

## 규칙
- 매 코드 커밋 게이트: `dev/active/m2a-1/gate.sh`(표적 + `src/test` 가드 + typecheck + lint + build). 번들: `/studio` 첫 ≤ 99.40 · 진입 ≤ 124.70, 그 밖 ±0.03, 렌더 문서 JS ≤ 90 · CSS ≤ 30.
- 단언 약화·skip 금지. 새 의존성 0. `design/`·`docs/design/`·`docs/decisions/` 수정 금지. `navigate(replace)` 금지.
- 로컬 커밋만(`git commit -- <경로>`). push·병합·삭제 금지. 서버는 127.0.0.1:4337, **끝날 때 자기가 띄운 서버 PID를 반드시 종료**(M2A-1은 4337 서버를 남겼다).

## 수용 기준
1. F0 커밋 완료(미커밋 0).
2. F1 판정(a/b/c)과 근거가 `logs/f1-diagnosis.txt`에 있다.
3. a·b면 RED→GREEN 커밋 + 390·1024·1280 섹션이 보이는 스크린샷. c면 사람이 볼 수 있는 대체 증거.
4. REPORT 자리표시 0. 게이트 통과. 4337 서버 종료.
