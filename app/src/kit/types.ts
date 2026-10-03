import type { ReactElement } from "react";
import type { SectionInstance } from "../engine/contracts/pageDoc";

/** 섹션 루트 공통 속성 (m2a 0.12) — id 앵커 · 검사용 type/variant · 사각형 보고(data-instance-id, RenderApp measure) · 킷 표시 */
export interface KitRootProps {
  readonly id: string;
  readonly "data-section": string;
  readonly "data-instance-id": string;
  readonly "data-kit": "";
}
/** 문서에서 정한 링크 대상 (0.10) — CTA 앵커 · 본문 섹션 heading 글자 → 앵커 */
export interface KitLinks {
  readonly cta?: string;
  readonly headings: ReadonlyMap<string, string>;
}
export interface KitSectionProps {
  readonly section: SectionInstance;
  readonly links: KitLinks;
  /** 로컬 이미지 id → 렌더 문서가 만든 object URL (0.9 · K4) */
  readonly images: Readonly<Record<string, string>>;
  /** 프로필 이미지 비율(`media_ratio`, 없으면 4:5) — img width·height 속성값(about, K1-3 5) */
  readonly mediaRatio: readonly [number, number];
  readonly root: KitRootProps;
}
export type KitSection = (props: KitSectionProps) => ReactElement;
