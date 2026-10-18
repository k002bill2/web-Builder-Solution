/**
 * 적용 대상 선택 행 · 짧은 이름 — `domain/compareBoard` PICKABLE_ROW_IDS·rowDef와 같은 값(recoRows.test가 깊은 동일로 고정).
 * 추천 청크가 compareBoard 값을 import하면 번들러가 그 모듈을 공통 청크(index)에서 떼어 모든 라우트 첫 화면이 +0.30 늘어난다(M3-1 실측) — 타입만 import한다.
 */
import type { PickableRowId } from "../../domain/compareBoard";

export const RECO_ROWS: readonly (readonly [PickableRowId, string])[] = Object.freeze([
  ["hero", "Hero"],
  ["menu", "메뉴"],
  ["cta", "CTA"],
  ["palette", "팔레트"],
  ["font", "폰트"],
  ["card", "카드"],
  ["imageRatio", "이미지 비율"],
  ["motion", "모션"],
  ["mobile", "모바일"],
  ["footer", "Footer"],
]);
export const RECO_ROW_IDS: readonly PickableRowId[] = Object.freeze(RECO_ROWS.map(([id]) => id));
export const rowShortLabel = (id: PickableRowId): string => RECO_ROWS.find(([row]) => row === id)?.[1] ?? id;
