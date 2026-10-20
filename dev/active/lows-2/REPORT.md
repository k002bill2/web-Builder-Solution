# LOWS-2 REPORT (초안)

base `02b0a5c1` · 브랜치 `k002bill2/lows-2` · push 0

## BACKLOG 원문 정리

| ID | 출처 | 원문 요지 | 이번 범위 |
|----|------|-----------|-----------|
| B-M4B-06 | M4-b-2 QA 2차 R4 P3 | 내보내기 "다시 시도" 성공 뒤 포커스가 BODY(공용 경로 — 정적 형식 포함) | 결과 '내려받기' 링크로 포커스 · 문구 변경 0 |
| B-SEC-07 | IMPORT-LOWS QA 4항·3항 | 결합 테스트 부재(Blob.type 손상 1 + 정상 1 → 결과 줄 lostImageText 1회) · 실 IndexedDB 확인 미실시 · 복원 진입 131.76(여유 0.02) | 결합 테스트 + 변이 FAIL. 실 IndexedDB·브라우저 확인은 브리프상 범위 밖(브라우저 불필요) |

## 1. B-M4B-06

- RED: `ExportFlow.test.tsx` "B-M4B-06" describe — static-html·static-zip 각각 실패(JOB_TIMEOUT) → 다시 시도(포커스) → 완료 시 `document.activeElement` = `<body>` 로 2건 FAIL 확인.
- GREEN: `ExportAfter.tsx` `DownloadLink` 마운트 effect — 포커스가 BODY/없음일 때만 링크로 이동. 처음 성공은 누른 형식 버튼 유지(대조 테스트 1건).
- 위치: 조작 뒤 청크(ExportAfter)만 변경 — 편집기 진입 청크 0.
- 범위 메모: `done`인데 download가 없는 경우는 링크가 없어 포커스 이동 대상 없음(기존 동작 유지).
- 예산(build 후 `check-bundle-size`): `/studio` 해시 정규화 128.76 (멈춤 > 128.79) · 복원 진입 131.76 (멈춤 > 131.78) — 증분 0.

## 2. B-SEC-07

(진행 중)

## 검증

(마감 시 기록)
