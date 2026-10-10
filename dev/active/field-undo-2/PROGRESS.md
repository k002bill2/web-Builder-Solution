# FIELD-UNDO-2 PROGRESS — 이미지 패널 편집 실행 취소 (B-ER-08 2/2 · FU-AC-13 · MQ-F3 A)

- 브랜치 `k002bill2/field-undo-2` · base `09c2623` · 브리프 `BRIEF.md`
- 서브에이전트 분할: 불필요(브리프)

## 체크리스트

- [x] P0 PROGRESS 커밋 `096a32d`
- [x] `npm ci`(lock 변경 0) · 기준 예산 실측 — `/studio` 129.56 · 복원 132.59 · `/profile` 99.90/120.00 · docEngine +3.79 · ImageSlotPanel +4.71
- [x] RED(신규 15건 실패 확인) — FU-AC-13 갈래: 고르기 · 지우기 · 끄기/켜기 · 장식 · 대체텍스트 묶음 · 변환 거절 0 · 미리보기 거절 0 · 묶음 열린 채 이미지 조작 = 앞 묶음 닫힘 후 1건
- [x] GREEN 구현 + 커밋
- [x] 게이트 4종(typecheck · lint · test · build) + 예산 실측 — lint 0 · build 0(typecheck 포함) · vitest 300 files · 2702 tests(`/studio` 진입 증가 0 · 복원 ≤132.60 · `/profile` 0)
- [x] Codex `review --scope branch --base 09c2623` — r1 P2 1 반영 `f4b95da` · r2 지적 0
- [x] Ego Lite(4357) — 1280 Portfolio 이미지 고르기 → Ctrl+Z → 다시 실행 · 대체텍스트 Ctrl+Z PASS · 캡처 2장(122,864B · 129,006B) · 정리 완료
- [x] BACKLOG B-ER-08 행 결과 표기
- [x] REPORT.md — 영환님 결정 1건(진입 +11B gzip) 0절

## 설계 메모

- 진입 0 원칙: 이미지 패널(조작 뒤 lazy 청크)이 기존 `field()` 경로를 그대로 쓴다. "클릭 1회 = 즉시 1건"은 `field`의 4번째 인자(조합 플래그 자리)에 클릭 표시를 실어 청크(`fieldTyped`)가 바로 닫는다 — 진입 런타임 바이트 0(타입만 넓힘).

## 기록

- RED: `ImageUndo.test.tsx`(새 8) · `useSectionOps.field.test.tsx` +4(2 RED · 2 회귀 가드) · `StudioLayoutImages.test.tsx` 지우기 it 규칙 이동 + 무효화 it 1 — 15 실패 확인.
- GREEN 중 발견: 바꾸기(A→B) 때 패널이 넣기 전 정리에서 지금 문서(= 새 기록의 시작 문서)를 참조 집합에 안 넣어 A가 놓임 → `held = [doc, ...snapshots]`.
- 예산(GREEN 직후): `/studio` 129.54(−0.02) · 복원 132.58(−0.01) · `/profile` 99.89/119.99(−0.01 — 진입 청크 해시·gzip 잡음) · docEngine +3.83 · ImageSlotPanel +4.86.
- Codex r1 반영 뒤 원시 `/studio` 129.57 · 복원 132.60(진입 소스 동일 — 해시 잡음). 해시 정규화: base 128.28 → HEAD 128.29 = StudioLayout +11B(name ≈8 · `return false` ≈3). 대안 실측: 끌어올림 +2 · 패널 selection import = 새 청크 371B · false 제거 = 기존 SnapshotImages 2건 깨짐.
- fresh 게이트(HEAD f4b95da): typecheck 0 · lint 0 · build 0 · vitest 300 files / 2703 · src/test 11 / 78.
