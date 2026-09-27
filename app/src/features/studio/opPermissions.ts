/**
 * 가능 여부 + 이유 문장(8.2 `can*` · 5.2~5.5 표) — 버튼의 `aria-disabled`·이유는 렌더 때 필요해 편집 틀 청크(진입 직후)에 둔다.
 * 연산 자체(sectionOps)는 docOps가 누를 때 동적 import한다. 화면 부품은 engine을 직접 부르지 않고 이 파일을 거친다.
 */
export { canAdd, canMove, canRemove, canSwapVariant, type Permission } from "../../engine/ops/rules";
