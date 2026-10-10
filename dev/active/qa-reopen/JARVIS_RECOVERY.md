# QA-REOPEN — Jarvis 회수 메모 (2026-10-10)

RESUME-1 실행이 REPORT 갱신 전에 종료(래퍼 exit 1, B-ER-07 측정 직후). 아래 판정은 커밋·미커밋 증거(logs·shots)를 Jarvis가 읽어 정리한 것이며, QA REPORT.md 본문(1차)은 그대로 둔다.

| 항목 | 판정 | 근거 |
|---|---|---|
| D-QA01 | PASS(재현 0) → 닫힘 | 1차 REPORT · `shots/dqa01-*` · `logs/dqa01.json` |
| B-ER-11 | **FAIL(재현 3/3)** | PROGRESS RESUME-1: 390 테마 적용 직후 "되돌리기" y=-246 · 원인 추정 `StructureCanvas.tsx:138` 선택 상자 `scrollIntoView`가 `StudioPanels.tsx:30` 알림 줄 `scrollIntoView` 뒤에 실행돼 덮어씀 · `shots/ber11-390-applied.png`(Jarvis 육안: 알림 줄 없음, 구조 목록으로 스크롤됨). `logs/ber11.txt`는 빈 파일 — 수치는 PROGRESS 기록뿐 |
| B-M2C-09 ② | PASS | `logs/m2c09-html.txt`: 768 높이 차 0·차이 픽셀 1.59% · 390 높이 차 1px·2.65% · `shots/m2c09-*-side.png` |
| B-ER-07 | PASS(1회, 근거 한정) | `logs/ber07-r20.txt`: 35MP 4.88MB JPEG(10MB 미만) · 고르기 +66ms "준비하고 있습니다" → 미리보기 +3042ms 진입 시 "스냅샷을 보는 동안 준비된 이미지는 넣지 않았습니다 · 다시 골라 주세요" · 복귀 뒤 유지. 한계: 로그 RATE 표기 6(파일명 r20과 불일치 — 실제 스로틀 수치 확인 불가), 같은 fixture라 이미지 불변 여부는 치수로만 판단. `ber07-r6.txt`는 변환이 먼저 끝나 경합 미발생(무효) |
| B-M2B-09 | N/A(미측정) | 시간 종료. Safari·Firefox 환경 없음 |

- 정리: `logs/cleanup-r1.txt` — override·스로틀 해제 · IDB 삭제 · finish closedSpace · 4345 리슨 0. Ego 공간 3("qa-reopen 4345 r1", ownership user) 목록 잔존.
