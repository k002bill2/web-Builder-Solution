# M2A-3a 재개 지시 (영환님 ★A 2회, 2026-10-03 · Jarvis)

- 기반: 이 브랜치에 main `a061040`을 합쳤다(merge `60c9db9`) — STUDIO-SLIM 안 A(보드·생성 저장소 지연 로드) + ADR-004 개정 3.
- **E0 결론 갱신**: `/studio/:projectId` 진입 직후 **118.44**(124.70 → −6.26, Jarvis main 빌드 실측). 이번 레인의 E0 정지 조건은 아래로 바뀐다.
  - SPEC대로(게이트 목록 **펼친 채** 진입 · `runGate` 진입 직후 자동 · 버튼 사전 차단) 구현한다. 브리프 E0의 "조작 뒤로 옮길 것"(경고 대화상자 · 잡 조회 · 결과 처리 · `requestExport` 호출 경로 — S-B5)은 그대로 조작 뒤 청크.
  - 진입 직후 ≤ 124.70(지금 멈춤선)이면 그대로. **넘으면 ADR-004 개정 3 결정 2를 적용**: `check-bundle-size.mjs`의 `/studio/:projectId` 진입 한도만 **127**(멈춤선 126.70)로 바꾼다 — 그 커밋 메시지에 "ADR-004 개정 3", 바꾸기 전후 실측을 REPORT 2절에. 다른 라우트·첫 화면·렌더 예산은 변경 금지.
  - 127(멈춤선 126.70)도 넘을 것으로 보이면 **멈추고 보고**(예산 추가 상향 금지).
  - `/compare`는 98.84 / 121.71이 새 기준선(±0.03).
- **E-pre (E1 앞 첫 단계, 테스트 전용)**: 공용 도우미 `app/src/features/studio/testing/openStudio.tsx`(65·67행)에 STUDIO-SLIM S5와 같은 기다림을 넣는다 — h1 뒤 `document.title === "<이름> 편집"`까지 `waitFor` 후 `connectRenderFrame()`, 사용하는 테스트 파일의 `afterEach`에서 제목 비움(필요한 곳). 근거: `dev/active/studio-slim/REPORT.md` S5 · `app/src/pages/StudioShell.test.tsx` `open()`. 단언 변경 0. 판정: `openStudio`를 쓰는 파일 묶음 단독 x10 전부 통과(로그).
- **E6에 추가**: STUDIO-SLIM에서 이관된 브라우저 흐름 1회 — 카탈로그 → 비교 → 확정 → 3안 → B안 편집 시작까지 **콘솔 오류 0** · 청크 요청 목록(진입 직후에 보드·생성 구현 청크가 없는지) `logs/e6-flow.txt`.
- 나머지는 `docs/06-handoff/M2A-3A_EXPORT-BASE_BRIEF.md` 그대로(REPORT 절마다 같은 커밋 · gate.sh exit 0 후 커밋 · 서버 PID 종료 등). 기존 `dev/active/m2a-3a/REPORT.md` 2절의 E0 기록은 지우지 말고 "재개(★A)" 하위 절을 덧붙인다.
