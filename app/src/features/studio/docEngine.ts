/** 조작 뒤 청크(S-B5) — docOps가 연산을 누를 때만 동적 import한다. 변이 연산 + R-05 보정 + 연산 어댑터 본문(runDocOp)만 둔다 */
export { addSection, moveSection, removeSection, swapVariant } from "../../engine/ops/sectionOps";
export { normalizeDoc } from "../../engine/ops/normalize";
/** 변형 교체 캡션(variantChoices)도 이 청크에서 받는다 — diff가 연산 청크에 묶여 공유 청크 이름이 늘지 않는다(memoryDocBook preload 목록 · /projects 진입) */
export { diffSlots } from "../../engine/ops/diff";
/** 편집 알림 문장(6.3) — 연산이 끝난 뒤에만 쓴다(M2A-3a Codex P2 수정의 진입 증가 상쇄 · S-B5) */
export { addedNotice, movedNotice, removedNotice, restoredNotice, swappedNotice, swapRevertedNotice } from "./opNotice";
/** 연산 1회 + R-05 보정(연산 어댑터 본문) — 연산을 누를 때만 쓴다(/studio 진입 예산, M2C-3S) */
export { runDocOp } from "./docOpRun";
