# FIELD-UNDO-1 RESUME-1 — Codex r1 P2 4건 반영 · Ego FU-QB-1·2 (같은 브랜치 이어서)

- Jarvis 회수 판정: **병합 보류** — Codex r1 P2-3(충돌 "최신" 뒤 같은 칸 입력이 교체 전 base 재사용 → 실행 취소가 다른 탭 변경을 덮음)은 데이터 덮어쓰기 위험이라 병합 전 필수. 근거 `logs/codex-r1.txt` · REPORT 5절.
- 시간 상한 90분. BRIEF.md 공통 제약 그대로(포트 4355 · 단언 약화 0 · amend·rebase 금지 · `set -o pipefail`).

## 예산 규칙 (중요)
- `/studio` 진입은 이미 배분선 **129.55**(여유 0.00). 이번 수정은 **진입 증가 0**이 원칙 — 로직은 조작 뒤 청크(`opAfter.ts`/`docEngine`)에 둔다. 진입 증가가 불가피한 항목은 **구현하지 말고** 필요한 바이트 추정·이유를 REPORT에 쓰고 다음 항목으로(잡음 흡수분 0.10은 배분 금지 — 영환님 예산 결정 사항).

## 순서 (각 항목 RED → GREEN → 커밋 · PROGRESS 갱신)
1. **P2-3 (최우선)** 기록 밖 문서 교체 뒤 묶음 재사용 금지: `docRef.current !== open.after`면 기존 묶음을 닫고 새 묶음 시작(가능하면 판정을 청크 `fieldTyped`/`closeField` 안에서). 충돌 "최신" 해결 직후 같은 칸 입력 → Ctrl+Z가 다른 탭 값을 덮지 않음을 컴포넌트 테스트로 단언.
2. **P2-4** focusout `once` 리스너 누적: 제거 함수를 묶음에 보관해 `closeField`·언마운트에서 해제. 단언: 묶음 N회 뒤 리스너 수 상수.
3. **P2-2** IME 확정 값 = 마지막 조합 값일 때 `composing` 고착: 청크에서 `compositionend` 리스너로 타이머 재개. 단언: 조합 끝(변화 없는 확정) 뒤 600ms 닫힘.
4. **P2-1** 청크 로딩 중 다른 칸 이동 합쳐짐: 진입 0으로 가능하면(예: 키 변경 시 청크 미로드면 키만 보관) 반영, 아니면 REPORT 기록.
5. 게이트 4종 + 예산 실측 → Codex `review --scope branch --base b3f8894` r2(지적 반영은 1회만).
6. **Ego FU-QB-1·2 재시도**: 1차 실패 원인 = `/profile` "3안 만들기" 대기 타임아웃. 검증된 경로 참고: `dev/active/fix-ber11/REPORT.md` 27-28행(카탈로그 → ref-e·ref-c 비교 추가 → 비교 보드 ref-e 전부 선택 → 프로필 확정 v1 → 3안 → B안으로 편집 시작). 셀렉터는 실제 DOM 텍스트를 먼저 덤프해 맞춘다. 경로 준비가 15턴 넘으면 중단·REPORT(Jarvis가 QA에 위임). 캡처는 뷰포트 clip, PNG 바이트 기록. 정리 규칙 BRIEF 그대로.
7. REPORT.md에 "RESUME-1" 절 추가(항목별 결과·예산·Codex r2·Ego 수치·남은 것).
- 턴: ①② 30턴 전 · ③④ 50턴 전 · ⑤ 65턴 전 · ⑥ 85턴 전 마감 · 90턴부터 REPORT만.
