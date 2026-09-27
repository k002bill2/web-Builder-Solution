/** 조작 뒤 청크(S-B5) — docOps가 연산을 누를 때만 동적 import한다. 변이 연산 + R-05 보정만 둔다 */
export { addSection, moveSection, removeSection, swapVariant } from "../../engine/ops/sectionOps";
export { normalizeDoc } from "../../engine/ops/normalize";
/** 변형 교체 캡션(variantChoices)도 이 청크에서 받는다 — diff가 연산 청크에 묶여 공유 청크 이름이 늘지 않는다(memoryDocBook preload 목록 · /projects 진입) */
export { diffSlots } from "../../engine/ops/diff";
