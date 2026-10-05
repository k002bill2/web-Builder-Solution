# Jarvis 최종 회수 — M2B-D1 (M2B-6 조건부 Go 조건 D-1)

- base a121f31 / 최종 HEAD fbd8597. worker 51/50 error_max_turns였지만 판정·RED/GREEN·결정성·Codex·REPORT 모두 커밋, 작업 트리 clean·서버 0 → 재실행 없이 회수.
- 분류 (b): PNG settled가 바닥 > 0만 보고 캡처 폭 전(폭 0) 배치 rects를 받아들임. 직접 관측 [0,0]→[0,8314]→[1280,3479]. 수정 = 가장 넓은 섹션 폭 = 캡처 폭(±1px) 또는 바닥 > 16384(CANVAS_TOO_TALL 유지). 정적 HTML·렌더 문서·실패 정책 불변.
- TDD: 예측 3(RED 전 커밋) → RED 2 실패 → GREEN. 1873→1876.
- 결정성(Developer): headless 5/5 · Ego Lite 5/5 1280×3479 동일 SHA. QA 원 수치 10492 자체는 미재현(같은 기전 관측).

## Jarvis 새 실행
- typecheck·lint·build exit0, 기본 npx vitest run 3회 각 216파일 1876/1876 exit0(이번엔 부하 타임아웃 없음).
- 번들: 이번 build 로그 logs/jarvis-final/build.txt. Developer: /studio 진입 127.36(멈춤선 127.37 — 해시 잡음 경계), 렌더 JS 83.03.
- Codex 1라운드 지적 0(Codex 테스트 EPERM 미실행). Jarvis 별도 브라우저 재측정 없음.

## M2B-6 조건 해소 판단
- QA 조건 "D-1 원인 판정 → 실제 결함이면 수정 후 Go" 충족: 원인 (b) 판정·수정·결정성 증거. 앱 안 클릭 /studio E2E로 PNG 반복 재확인은 하지 않음(하네스는 제품 capturePng·openCaptureFrame 사용) — 잔여 확인은 B-M2B-09 재검에 포함.
