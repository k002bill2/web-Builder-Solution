# ER-3b 재개 결정 (Jarvis, 2026-10-06 — 영환님 위임 "계속 추천대로 진행해줘", 승인 경계 밖 아님)

## 결정 1 — 번들: (a) 진입 감량 후 재측정 ★
- 예산·기준선·검사기 변경 0(ADR-004 개정 5 판정선 128.43 그대로). (b) 예산 조정은 선택하지 않음.
- 순서: ① `SnapshotPreview`의 `ds/Callout`(→Icon 공통 청크 재분할) 제거 — Icon 없는 자체 마크업(기존 kit/ds 토큰·클래스 재사용, 새 아이콘 0) ② 되돌리기·참조 집합 계산 등 클릭 뒤에만 쓰는 로직을 조작 뒤 청크로 ③ 정적 훅 `useSnapshots.tsx` 첫 화면 몫 최소화.
- 목표: `/studio` 진입 ≤128.04(ER-3b 몫 ≤0.35). **128.04~128.43**이면 계속하되 REPORT 첫 줄에 몫 기록(ER-4 여유 축소 경고). **128.43 초과가 감량 3회 시도 후에도 남으면 멈춤**(예산 상향은 영환님 결정).

## 결정 2 — 가드 `src/data/memoryExport.test.ts:235` 대체 ★
- 근거: ER SPEC r1 ER-AC-S1·S9("지금 상태 저장" = 화면이 `createSnapshot` 호출)는 확정된 요구이고, 이 가드("components·features·pages 비테스트 코드에 createSnapshot 0")는 E-AC-30·43("내보내기 전 스냅샷은 `requestExport`만 만든다")의 대리 측정이다. SPEC 6절이 이 충돌을 목록에 넣지 못한 누락.
- 대체(약화 아님 — 같은 취지를 더 직접 잰다):
  1. 정적 가드: `createSnapshot` 호출은 **스냅샷 화면 파일 허용 목록**(`useSnapshots.tsx`·`SnapshotDialog.tsx` 등 이 레인 신규 파일 명시)에서만 0 초과 허용, 그 밖 components·features·pages(특히 export·png·staticHtml 흐름 파일)는 0 그대로.
  2. 동작 가드 추가: 내보내기 흐름 1회 = 스냅샷 정확히 1개(`kind` 자동·내보내기 전, `requestExport` 경유) · 화면 "지금 상태 저장"은 내보내기 스냅샷 수를 바꾸지 않음.
- 기존 단언 문장·E-AC 번호 주석 유지, 바꾼 이유를 테스트 주석 한 줄 + REPORT에 기록.

## 결정 3 — Codex r1 지적 4건 전부 수정(TDD)
- P1 복원 요청 중 "편집으로 돌아가기"·입력 → 늦은 복원 결과가 덮어씀: 복원 요청 중 돌아가기·편집 잠금(상태 알림) ★ — 단순·예측 가능.
- P2 `edit()` 직후 `flushed()`/`adopt()`가 effect 전 phase를 봄 → 스케줄러 상태를 동기 참조.
- P2 미리보기 `kitTokens`는 스냅샷 `profileVersion` 기준.
- (P1 번들 = 결정 1)

## 결정 4 — 미작성 테스트 보완
- ER-AC-S6 화면: "A → 스냅샷 → 이미지 교체 → 복원 = A 유지".
- ER-AC-S10: 복원 → 편집 → 저장 → 내보내기 요청 revision 연속(실메모리 저장소 통합 1건).
- SPEC 차이("스냅샷" 버튼 모든 폭 툴바)는 ER-4 "더보기" 도입 때 이동 — REPORT·B-ER 기록 유지.
