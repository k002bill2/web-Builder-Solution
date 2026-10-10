# FIELD-UNDO-2 Developer 브리프 — 이미지 패널 편집 실행 취소 (B-ER-08 2/2 · FU-AC-13 · MQ-F3 A)

- 역할 Developer / Orca managed Claude Code / worktree `field-undo-2` / base main `09c2623`.
- 정본: `docs/design/field-undo/SPEC.md` 4.5(이미지 패널 편집)·9.2 FU-AC-13 + `MQ.md` 결정(F3 A). 선행 레인 기록: `dev/active/field-undo-1/REPORT.md`(특히 6절 4 — 묶음 열린 채 이미지 패널 변경 시 사슬 끊김 → 이 레인이 같은 `field()`/`fieldTyped` 경로로 해소), `features/studio/useSectionOps.ts`·`opAfter.ts`.
- 범위: 이미지 켜기·고르기·지우기·끄기·장식 = 클릭형 즉시 기록 1건 · 대체텍스트 = 필드 묶음 규칙 · 변환 거절(TOO_LARGE 등)·미리보기 중 거절 = 기록 0 · 실행 취소/다시 실행 알림 문구는 SPEC 5절 형식 재사용(새 문장 0). 이미지 참조 규칙은 SPEC 4.4(기록이 쥔 이미지는 놓지 않음).
- 현재 `ImageSlotField.tsx:115,212`가 `snaps.edit`를 직접 부름 → 기록 경로로 교체.

## 예산 (엄격)
- `/studio` 진입 현재 **129.56**(판정선 129.65, ADR-004 개정 14 배분 소진). **진입 증가 0** — 로직은 이미지 패널 청크(조작 뒤)·`docEngine` 청크에 둔다. 진입 증가가 불가피하면 그 항목은 구현하지 말고 필요 바이트·사유를 REPORT에(영환님 예산 결정 대기 중). 실측 > 129.57이면 멈춤.
- 복원 진입 ≤132.60 · `/profile` 변화 0.

## 순서
1. P0 PROGRESS 커밋(3턴 전).
2. RED(FU-AC-13 각 갈래 — 고르기·지우기·끄기/켜기·장식·대체텍스트 묶음·변환 거절 0·미리보기 거절 0 · 묶음 열린 채 이미지 조작 = 앞 묶음 닫힘 후 1건) → GREEN → 커밋.
3. 게이트 4종 + 예산 실측 → Codex `codex-companion review --scope branch --base 09c2623` 최대 2라운드(P1·P2 반영 — 진입 증가가 필요한 지적은 기록만).
4. Ego Lite(포트 4357): `dev/active/field-undo-1/qb-flow.mjs` 경로로 편집기 진입 → 1280에서 이미지 고르기 → Ctrl+Z = 이미지 빠짐 → 다시 실행 = 같은 이미지 · 대체텍스트 입력 후 Ctrl+Z = 텍스트만 원복. 뷰포트 clip 캡처 2장(PNG 바이트 기록) · 정리(IDB 삭제·`finish({keep:[]})`·`listTaskSpaces()`·서버 종료·4357 리슨 0). 영환님 창·main 5480 무접촉. 자체 생성 단색 이미지만 사용(외부 이미지 금지).
5. BACKLOG B-ER-08 행 끝에 결과 표기 · REPORT(한국어: FU-AC-13 갈래별 결과·변경 파일·예산·Codex·Ego 수치·남은 것).

## 공통 제약
- 시작 `cd app && npm ci`(lock 변경 0). TDD · RED만 있는 tip 커밋 금지 · 기존 단언 약화 0 · amend·rebase 금지 · `set -o pipefail`.
- 엔진 계약·저장 스키마·lock·CLAUDE.md·design/·ADR 수정 0. 새 의존성 0. push/merge/삭제 0. 승인 실패 우회 금지.
- 서브에이전트 분할: 불필요. 시간 상한 90분 · 턴: 구현 커밋 45턴 전 · Codex 65턴 전 · Ego 80턴 전 마감 · 85턴부터 REPORT만.
