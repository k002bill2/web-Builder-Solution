# M4-a-2 BRIEF R2 — 예산 해제 뒤 마감 (Ego Lite · Codex · REPORT) (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (영환님 "1" — ADR-004 개정 18)
대상: 이 워크트리 tip `8aa9a60f` = 구현 `47f6c77e` + origin/main `b75483ee` 병합 + **개정 18 커밋**(Jarvis: ADR-004 개정 18 · 기준선 128.71·131.69 · `bundleBudget.test.mjs` 23/23).

## 결정
- 개정 18: M4-a 몫 +0.10(상한 129.13·132.11 불변). 이번 +0.01은 기준선에 반영됨. **앱 코드를 더 바꿔 진입이 128.71·131.69를 넘으면 그 실측으로 같은 커밋에서 기준선 갱신(누적 +0.10 이하)**, 넘으면 멈춤.

## 할 일 (PROGRESS BLOCKED 3건만)
1. fresh typecheck·lint·test·build(병합 뒤 — `PngSave.test.tsx` 자동 병합 있었음, 전부 통과 확인).
2. **Ego Lite 1회**: build + preview `--port 4395 --strictPort`. 이미지 2장·글꼴 있는 문서 → 정적 사이트(zip) 내려받기 → `unzip -l`·`unzip -t` · 압축 푼 폴더를 `file://`로 열어 이미지·글꼴 로드(`document.fonts.check`, `naturalWidth`) · HTML 1개 내려받기 1회(이미지 포함 열람) · 1280·390 버튼 배치 · 내려받기 차단 보조 문장 · EXP-AC-R1~R5 판정 표. 끝나면 서버 종료 → `lsof -nP -iTCP:4395 -sTCP:LISTEN` 0 기록 · IDB 삭제·`finish({keep:[]})`.
3. **Codex review 1회**(`--scope branch --base d8e548e5`) — zip-slip·금지 패턴 우회·참조 직렬화 누락 이미지·거짓 성공 관점. 지적 반영 1회까지(TDD).
4. REPORT 갱신(1절 예산 표에 개정 18 반영 행 · EXP-AC-02·14 부분 사유 · R1~R5 · Codex) · PROGRESS 갱신.

## 규칙
- **매 항목 끝날 때 PROGRESS·REPORT 커밋**(중단 대비). 명시 경로 커밋, amend·rebase·push 0. 마감 전 `git status --short` node_modules 외 빈 값.
- 쓰기 경로 R1과 같음. 최대 50턴, 40턴부터 마감.
