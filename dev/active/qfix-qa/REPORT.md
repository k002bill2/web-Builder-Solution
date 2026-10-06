# QFIX-QA REPORT (Jarvis 마감 — QA 56/55 턴 한도)

- 레인 qfix-qa · base `f73708f` · QA(코드 0) · Ego Lite space 4(창 normal) · preview 4339 · Safari·Firefox 미검증.
- 중단 뒤 Jarvis 정리: preview PID 51265(cwd 확인) 종료 · 4339 리슨 0 · space 4 CPU 스로틀 해제 시도 후 `finish({keep:[]})` · `listTaskSpaces()`=[] · 내보낸 파일 사본 `~/.hermes/profiles/jarvis/cache/scratch/qfix-qa-exports/`.

## 판정
| 항목 | 판정 | 증거 |
|---|---|---|
| 1-a QB-R2 개수 문구(이탈·복귀) | **PASS** | `logs/qbr2.md` — 정적 HTML·PNG 결과 줄 "이미지 2장을 다시 골라야 해 자체 그래픽으로 넣었습니다" = `exportImages.ts lostImageText` 일치 · shots r2-01~03 · exports r2-* |
| 1-b QB-R5 스냅샷 복원 경로 | **PASS** | `logs/qbr5.md` — 복원 뒤 잃은 이미지 표시 · 결과 줄 lost=2 일치 · shots r5-01 · exports r5-* |
| 2 B-ER-07 변환 중 미리보기 차단 | **미검증(시도 무효)** | `logs/ber07-r6-12mp.json`: CPU 스로틀 6 + `noise-12mp.jpg`(10,497,067B) → 앱이 **TOO_LARGE "10MB까지 쓸 수 있습니다"로 거절**(messages.ts:6) — 변환이 시작되지 않아 재현 조건 미성립. 다음 시도는 10MB 미만·고화소(예: 6000×4000 저엔트로피 JPEG ≤9MB) + 스로틀 ≥6 |
| 3 B-M2C-09 ② 768·390 PNG↔정적 HTML | **미검증** | 턴 한도 |

- 결함 0. 관찰: 이미지 넣은 직후 PNG 버튼 잠시 `aria-disabled`(렌더 갱신 대기, `Page.bringToFront` 뒤 3초 후 활성 — 재현 1회, 결함 아님).

## 닫힘 의견
- **B-M2C-09 ①(개수 문구) 닫음.** ② 768·390 대조 · ③ 캔버스 픽셀 대조(환경 한계)는 남김.
- **B-ER-07 닫지 않음** — 단위 테스트(`SnapshotImages`·useSnapshots 편집 경계)가 보증, 실브라우저 재현은 위 조건으로 재시도.
