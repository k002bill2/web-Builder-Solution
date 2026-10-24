# SAMPLE-BUNDLE CONTINUE-1 — 샘플 묶음 버튼 연결 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-25
같은 worktree·브랜치 `k002bill2/sample-bundle` · HEAD `3a88622b`. 1차 결과: `REPORT.md`(항목 1 완료 · 조립부 `features/studio/sample/sampleZip.ts` 완료 · 버튼 미연결).
쓰기 경로 = `app/` + `dev/active/sample-bundle/`만. `npm ci` 다시 하지 말 것(이미 설치됨). 기존 커밋 되돌리지 말 것.

## Jarvis 결정 (★) — 묻지 말고 이대로
- 1차 REPORT "남은 일" 1안대로 `ExportFormat`에 `"sample-zip"`을 추가해 **기존 requestExport 경로를 그대로 탄다**(게이트·폴백 차단·실패·재시도·포커스·읽기 전용 탭 refused 공용).
- 묶음 내용 = 기존 정적 HTML 1개 생성기 결과 + `capturePng` 결과(현재 미리보기 폭) + `sampleJson` 2개 + README → `sampleZip`. PNG 캡처가 실패하면 묶음 전체 실패(부분 묶음 만들지 않음).
- 버튼 라벨 "디자인 샘플 내려받기", 위치 = PNG 블록 바로 아래, 형식 버튼 3개보다 위(MQ-SMP-03 A 최종 순서: PNG → 샘플 묶음 → HTML 1개 → 정적 zip → React zip).
- 결과 줄 문구(ExportAfter NAME 등)는 "디자인 샘플 묶음(zip)". 생성 본문(직렬화·zip·캡처 합류)은 **조작 뒤 청크** — 진입 청크 정적 import 금지.

## 항목 (우선순위 순, 각 끝에 커밋)
1. 배선: `ExportFormat` 확장 지점 전부(1차 REPORT 남은 일 1 목록 — projectRepository·memoryDocBook isFormat·슬롯·editorEvents·ExportAfter·exportFlow FILE_NAME) + 버튼. 타입체크로 누락 지점 확인.
2. 테스트: SMP-AC-A01(버튼 1회 클릭 → 다운로드 1회 · zip 엔트리 5개 이름) · 최종 순서 단언(PNG 영역 → 샘플 묶음 → 형식 3개) · 게이트 차단 시 샘플 묶음 버튼도 차단 1개 · 기존 ExportFlow 계열 회귀 GREEN.
3. 번들 재측정: `npm run build` → `logs/bundle-2.txt`. `/studio` 정규화·복원 증분 기록. ≤ +0.05 통과(스크립트가 판정선으로 실패해도 증분 ≤ +0.05면 수치만 기록·계속). 초과면 감량 1회 후 재측정, 그래도 초과면 원인 청크 기록하고 마감.

## 마감
- 게이트(`app/`, 각 `; echo EXIT=$?`): typecheck · lint · `npx vitest run --maxWorkers=2` · build → `logs/gates-2.txt`.
- REPORT.md에 "CONTINUE-1" 절 추가(결론 · 번들 표 · AC 표 갱신 · 변경 파일). PROGRESS 체크 갱신. `git status --short` 빈 값.

## 규칙
- git 원격 명령 금지 · amend·rebase 금지 · 서브에이전트 금지. 실행 상한 약 15분. 최대 80턴.
