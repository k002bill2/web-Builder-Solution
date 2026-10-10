# FIELD-UNDO-SPEC — REPORT

- 레인: Designer · base `18e5e12` · 브랜치 `k002bill2/field-undo-spec` · 로컬 커밋만(push·merge 0) · 코드 수정 0
- 산출물: `docs/design/field-undo/SPEC.md` r0 · `docs/design/field-undo/MQ.md`(MQ-F0~F4) · 이 폴더 `PROGRESS.md`·`REPORT.md`

## 1. 결론

1. **B-ER-08 결정(MQ-F0 ★A)**: 참조 집합은 기록 스택을 그대로 따른다. 필드 글자가 기록이 되면 삭제 전 문서가 Ctrl+Z로 닿으므로, "삭제 → 필드 입력"은 이미지를 놓지 않는다. 놓으면 되돌린 섹션 이미지가 비어 ER-AC-U1 위반 + 되살릴 수 없는 손실(`StudioLayout.tsx:307-308`).
2. **바꿀 단언 2건**(SPEC 6절에 지금 문장/바꿀 문장/사유): `StudioLayoutImages.test.tsx:111,125-128` · `UndoKeys.test.tsx:99,104-107`. 무효화 단언은 진짜 끊김(다시 실행 잘림 · 상한 50 · 충돌 "최신")으로 옮겨 유지 — 약화 아님.
3. **묶음 경계**: 600ms 멈춤 · blur · 키 변경(재마운트 포함) · 다른 기록 직전 · 미리보기 열기 · 충돌 해결 전 · 언마운트. blur에만 기대지 않음. 내용 동일이면 기록 0.
4. **열린 묶음 동안 참조 집합 = base + reachable(base)** — 600ms 사이 이미지 유실 구간 제거.
5. **IME**: 조합 중 입력 뒤엔 타이머로 닫지 않음(`nativeEvent.isComposing`) — 브라우저별 이벤트 순서는 L3 추정, FU-QB-3로 실측.
6. **탭**: 기록은 탭 로컬 · 읽기 전용 탭도 기록·실행 취소 동작(저장만 0).
7. **예산**: 진입엔 묶음 ref·호출 1줄·라벨 전달만, 타이머·IME·push는 조작 뒤 청크(`docEngine`). 추정 +0.10~0.25(L3), 멈춤 = 증가 > 0.27 → MQ-F4.

## 2. 근거 (L1 — 직접 확인)

- 필드 = 스택 밖: `EditFields.tsx:44,63` → `snaps.edit`(`StudioLayout.tsx:361`). 이미지 패널도 스택 밖: `ImageSlotField.tsx:115,212`(ER 3.5 `:144` "넣음" 미이행 → MQ-F3).
- 사슬 동일성 비교: `opAfter.ts:53` · `useSectionOps.ts:93` · `undoStack.ts:55-59`. `docRef`는 effect 갱신(`useSectionOps.ts:74-77`) — 필드 기록은 같은 틱 갱신 필요(SPEC 4.2 · R3).
- 단축키 리스너는 첫 `run` 뒤에만 붙음(`useSectionOps.ts:126`) — 입력만 한 세션 대응 필요(FU-AC-6).
- 미리보기 거절 = `useSnapshots.tsx:62-68` false → 기록 0(B-ER-05 `opAfter.ts:40`과 같은 규칙).
- 탭 잠금: `infra.ts:26` READ_ONLY_TAB · P1C-SPEC `:74,82,87-88`.

## 3. 목업·기존 SPEC과 다르게 한 것 (ADR-003 한 줄씩)

- 2a-05 5.6 `:281` "blur에 한 번" → ER 3.5 600ms 추가를 따르고, 여기에 "키 변경·다른 기록 직전·언마운트" 닫힘을 더했다 — 재마운트·390 탭 전환은 blur를 보장하지 않음(기능 우선).
- ER 6절 `:233` "단언 약화 금지" — 문장은 바꾸되 무효화 단언을 끊김 경우로 이동해 보존(6절 표).
- 태그: 브리프 "[U]/[E]" 대신 ER 문체 [U]/[G]/[B] 사용.

## 4. 수치 메모

- 진입 예산: 브리프·`dev/active/fix-ber11/REPORT.md:25` = `/studio` 129.28/129.65(여유 0.37). ADR-004 개정 13(`docs/decisions/ADR-004-performance-budgets.md:226-227`)은 ENTRY-SLIM 직후 129.09를 기록 — 이후 레인이 올린 최신 실측 129.28을 썼다. 빌드 실측은 이 레인에서 하지 않음(코드 0) → 구현 레인이 확인.
- 과거 실측/추정 비: ER-4 +0.68 vs +0.02~0.08 · ER-9 +0.33 vs +0.06~0.12 → R1.

## 5. 서브에이전트

- Explore(읽기 전용) 1개 — 기존 SPEC·BACKLOG·QA·예산 기록: 완료. 반영: 2a-05 `:281` blur 전용 문장 · ER 8절 멈춤 규칙 `:271` · BACKLOG에 IME·탭·미리보기 항목 없음 · 예산 수치 불일치(129.09 vs 129.28) · MQ 문체.
- 코드 경로 조사는 메인이 직접(파일 쓰기도 메인만).

## 6. 검증

- 코드 0이라 typecheck·lint·test·build 대상 없음(실행 안 함). 인용 행은 `sed -n`으로 표본 확인(ER `:271` · 2a-05 `:326`·`:195` · fix-ber11 REPORT `:25` · 코드 인용은 직접 읽은 행).
- Codex 리뷰: 실행 안 함 — 산출물이 문서뿐이고 브리프가 요구하지 않음. 필요하면 구현 레인 전 `adversarial-review`로 SPEC 4.4 규칙 도전 권장.

## 7. 남은 것 · 필요한 것

- **결정 필요(영환님·Jarvis)**: MQ-F0~F4 회신 — 권장 "F0 A · F1 A · F2 A · F3 A · F4 A"(전부 예산 증액·엔진 계약·저장 스키마 변경 0). F4 B만 예산 증액.
- 구현 레인(Developer): SPEC 8.1 파일 · FU-AC-1~16 · FU-QB-1~3. FU-QB-3(실제 한글 IME)은 Ego가 IME를 못 내면 영환님 수동 1회.
- BACKLOG 갱신(Jarvis): B-ER-08 "SPEC 결정 완료 → Developer" · MQ-F3 B 선택 시 이미지 패널 기록 새 항목.

## 커밋

- `f1d2b10` PROGRESS · `5291fbf` SPEC r0 · `0a997f7` MQ · (이 커밋) REPORT
