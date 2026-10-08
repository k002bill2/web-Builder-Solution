# P1C-SPEC REPORT (Designer · 2026-10-08)

## 결과
- `docs/design/persistence/P1C-SPEC.md` — A안 기준 **확정**. ① 화면 상태표 ①~⑧(1.2 어긋난 문구 W1~W9 파일:행 · 1.3~1.9) ② 번들 배치(3절 — 모든 항목 `/studio` 진입 몫 0, W2·W4는 감소, `/projects`·조작 뒤 청크 배치) ③ QA AC-C01~C15(탭 2개 · 먼저 편집한 탭 쓰기 C14 · 지우기 후 `databases()` C05 · 사용량 단위·반올림 C07 · 대화상자 포커스 C08 · aria-live C09 · persist C15) ④ 6절 Developer 레인 분할 D1~D5.
- `docs/design/persistence/P1C-MQ.md` — MQ-C1~C5 각 항목에 "결정: A(Jarvis 위임 채택 2026-10-08)" 기록.
- 결정 결과: 예산 재상신 0 · 엔진 계약 변경 0 · 새 의존성 0 · 백엔드 0.

## 근거·검증
- 어긋난 문구 8건 위치 재확인(이번 재개 실행): `grep -rnE "서버 연결 전|이 탭에 저장돼|이 탭의 편집기 안에서만|이 탭에 보관한|이 탭에 저장됨" app/src --include='*.ts*' | grep -v .test.` → ProjectsPage:27 · ProfilePage:22 · StudioEmptyStates:17 · StudioPanels:146 · ExportAfter:64 · ImageSlotPanel:44 · imageStore:55 · saveStatusText:34 — SPEC 1.2 표와 일치 [L1].
- 앱 코드·테스트·lock·CLAUDE.md·`docs/decisions` 수정 0. Codex·서브에이전트·push/merge/삭제 0.

## 목업·브리프와 다르게 한 부분 (한 줄 사유)
- 사용량을 SaveStatus가 아닌 `/projects` 저장소 영역에 둠 — `/studio` 진입 여유 0.03KB(MQ-C5 A).
- 잠금 = "먼저 편집한 탭" — 진입 몫 0(MQ-C2 A). ADR-007 3절 문구 개정 기록은 Jarvis 몫(이 레인 `docs/decisions` 수정 금지).

## 생략
- **Ego Lite 위치 확인 생략**: 브리프상 선택 항목이고, 바꿀 문구 위치는 grep [L1]으로 파일:행까지 확정됨. 직전 실행이 사용량 한도(429)로 중단돼 재개 실행의 턴·시간을 문서 확정에 썼음. 실측은 구현 레인 AC(Ego Lite build + preview)에서 수행.

## 남은 것 (다른 레인 몫)
- Jarvis: ADR-007 3절 "먼저 연 탭" → "먼저 편집한 탭" 개정 기록 · 2a-05 SPEC 153·157·322·559·866행, 2a-04 J-S02·P-S02 문구 갱신(SPEC 1.2 아래 목록).
- 구현 확인 필요 표기 [확인 필요]: W6 강등 시 편집기 이탈 보관 여부 · J-S11 결과 UI 청크 위치 · `navigator.locks` 미지원 처리 · 1.8 실패 사유 필드명 · SW 없음.
