# QFIX REPORT (Jarvis 마감 — Developer 66/65 턴 한도)

- 레인 qfix · base `f73708f` · 커밋 `416e59c`(P0) · `241aafb`(B-TEST-01) · `0415e74`(B-ER-10·11·03). 근거·TDD 기록은 PROGRESS.md.
- 중단 뒤 Jarvis 정리: preview PID 71087(cwd 확인) 종료 · 4337 리슨 0 · Ego Lite space 5 `finish({keep:[]})` · `listTaskSpaces()`=[].

| 항목 | 판정 | 근거 |
|---|---|---|
| B-TEST-01 CMP-AC-U1 | 안정화 | 원인: 첫 생성 계산 청크 콜드 로드 중 "만드는 중…"만 보고 tick 소진 → 조회 3회 미달. 시작 알림 대기(`requested()`)로 교체. 단언·순서·timeout 변경 0. 부하(load 30→96) 5회: 전 5/5 실패 → 후 5/5 통과 |
| B-TEST-01 J-S07 | 안정화 | 포커스 복귀 passive effect 대기 — 같은 단언을 `waitFor`로. 제품 정상 |
| B-ER-10 스냅샷 Esc/닫기 포커스 | 수정 | 네이티브 `dialog.close()` 먼저 → `onClose()`. RED 3(BODY) → GREEN. Ego Lite 1280 `shots/ber10-esc-1280.png`: "스냅샷" 버튼 포커스 링(Jarvis 육안 확인) |
| B-ER-11 390 알림 보이기 | 수정(실화면 미확인) | "되돌리기" 있는 알림이 바뀌면 `scrollIntoView({block:"nearest"})`, 포커스 이동 0. 단위 RED→GREEN. Ego Lite 390 캡처 없음(턴 한도) |
| B-ER-03 프로필 문구 | 수정 | "편집 시작을 누르면 고른 안으로 편집기를 엽니다. 이미 편집 중인 문서가 있으면 그 문서를 엽니다." `shots/ber03-profile-1280.png`(Jarvis 육안 확인) |

- 번들: `/studio` 128.59 → **128.62**(+0.03, 판정선 128.70) · `/profile` −0.02(문구) · 그 밖 ±0.02.
- 전체 vitest: full-1·full-2 239/2128 PASS · full-3 미완(턴 한도) → Jarvis 검증 ×3으로 대체.
- Codex r1(`logs/codex-r1.txt`, base f73708f): **지적 0**.
- 관찰(차단 아님): 섹션 연산은 같은 커밋에서 부모 effect의 `focus()`가 알림 스크롤 뒤 실행돼 포커스 쪽으로 다시 스크롤할 수 있음.
