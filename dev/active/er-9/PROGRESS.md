# ER-9 PROGRESS — 편집기 "더보기" 메뉴 (B-ER-09 · ADR-004 개정 8 배분 ②)

base `19a97d0` · BRIEF P0 `46c53b4`

## 체크리스트
- [x] BRIEF P0 커밋 (`46c53b4`)
- [x] S0 실측(코드 변경 전)
- [x] TDD RED 7/7 (logs/red.txt, 미커밋)
- [x] 구현 GREEN (`9b1e001`)
- [x] 기준선 커밋 1개 `261eaa4` 128.23 → 128.55
- [x] typecheck · lint · build · 전체 vitest exit 0 (252/2209, `abba563`)
- [x] Ego Lite 1280 키보드만 · 캡처 3 · finish · listTaskSpaces()=[] · 4337 종료
- [x] Codex r1 P2×2 → `f653046` · r2 P2×1 → `abba563` (상한 2)
- [x] REPORT (증가량 표)
- [x] <1280 "스냅샷" 이동 — BLOCKED: 여유 0.11·포커스 경로 위험 → 하지 않음, SPEC 차이 유지(REPORT)

## S0 실측 (코드 변경 0, `logs/build-base.txt`)
- base 빌드 exit 0: `/studio/:projectId` 첫 화면 91.84 · 진입 직후 **128.23** · 기준선 128.23(+0.03 → 판정선 128.26). 상한 128.67 → 쓸 수 있는 여유 **0.44**.
- 다른 라우트(진입): /catalog 102.44 · /references 99.69 · /compare 121.97 · /profile 119.17(3안 121.65) · /projects 100.36 · 렌더 JS 84.19.
- 툴바: `components/studio/StudioToolbar.tsx`(children 슬롯) — 항목은 `StudioLayout.tsx` 3배치(탭 <1024 · 2단 1024~1279 · 3단 ≥1280)에서 `{snaps.button}{gateButton}` 순으로 넣는다.
- 실행 취소 경로: `useSectionOps.step(redo, tell)`(진입 청크) → `loadDocEngine()` → `opAfter.stepHistory`(조작 뒤 docEngine 청크). 키보드 = `opAfter.listenHistory` → `historyKeys.current.step(redo, tell)` = 같은 `ops.step`. 스택 `undoStack.ts` 에 `peek`·`peekRedo`(항목 이름용)가 이미 있음.
- 미리보기 잠금: `SnapshotPreview.lockEditing`이 편집 틀 안 button 전부 `aria-disabled`+클릭·Enter 차단 → 새 "더보기" 트리거도 자동 잠금.
- 배치(예정): 진입 청크 = 트리거 `MoreMenu.tsx`(버튼 + 열림 상태 + lazy) + `useSectionOps`에 이름 조회 `peekStep`(문서와 이어질 때만 이름). 조작 뒤 청크 = `MoreMenuBody.tsx`(role=menu · 키보드 · 이유 문구 · 실행).
- 예상 증가(L3): 진입 +0.06~0.12 → 128.29~128.35(상한 128.67 안).

## TDD 예측
- 새 테스트 `MoreMenu.test.tsx`: 버튼 `aria-haspopup=menu`·`aria-expanded` false→true · role=menu 항목 2개 · 빈 기록 = 두 항목 `aria-disabled` + 이유 "되돌릴 편집이 없습니다" · 삭제 뒤 "실행 취소: Services 삭제" 실행 = 단축키와 같은 결과(행 복원 + 알림 "실행 취소: Services 삭제") · "다시 실행: Services 삭제" · ArrowDown/Up/Home/End 순환 · Esc = 닫힘 + 트리거 포커스.
- 예측 RED: "더보기" 버튼 없음 → getByRole 실패(전 건).
- 툴바 순서 단언: 기존 테스트에 툴바 목록 단언 없음(grep) → 새 테스트에 ≥1280 툴바 순서(스냅샷 → 더보기 → 검사 · 내보내기) 단언 추가.

## 결정·차이
- 구현 실측 128.55(+0.32, 예측 +0.06~0.12보다 큼 — 트리거 lazy·키 처리·peekStep·3배치 배선). 상한 안이라 상쇄 없이 기준선 128.55. Codex 수정 뒤 128.56(허용 안).
- 비활성 이유는 두 항목 모두 SPEC 문구 "되돌릴 편집이 없습니다".
