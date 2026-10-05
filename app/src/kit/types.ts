import type { ReactElement } from "react";
import type { SectionInstance, SectionMotion } from "../engine/contracts/pageDoc";

/** 섹션 루트 공통 속성 (m2a 0.12) — id 앵커 · 검사용 type/variant · 사각형 보고(data-instance-id, RenderApp measure) · 킷 표시 */
export interface KitRootProps {
  readonly id: string;
  readonly "data-section": string;
  readonly "data-instance-id": string;
  readonly "data-kit": "";
  /** 실효 모션 레벨(M2B-4b MF-AC-U1 · render/sectionMotion) — L0·첫 화면 밖 = 없음 */
  readonly "data-motion"?: SectionMotion;
}
/** hero 맨 위 면 (SPEC-BOUND D-1 · B-3 표) — header/transparent가 이어 칠할 면. media = 이미지(플레이스홀더 포함)가 맨 위 */
export type HeroTop = "primary" | "bg" | "surface" | "media";
/** 문서에서 정한 링크 대상 (0.10) — CTA 앵커 · 본문 섹션 heading 글자 → 앵커 · 첫 본문 hero의 맨 위 면(D-1) */
export interface KitLinks {
  readonly cta?: string;
  readonly headings: ReadonlyMap<string, string>;
  readonly heroTop?: HeroTop;
}
export interface ImageSize {
  readonly width: number;
  readonly height: number;
}
export interface KitSectionProps {
  readonly section: SectionInstance;
  readonly links: KitLinks;
  /** 로컬 이미지 id → 렌더 문서가 만든 object URL (0.9 · K4) */
  readonly images: Readonly<Record<string, string>>;
  /** 로컬 이미지 id → 방향 적용 뒤 원본 픽셀 크기(SPEC m2c 3절 — masonry 원본 비율만 쓴다) */
  readonly imageSizes?: Readonly<Record<string, ImageSize>>;
  /** 프로필 이미지 비율(`media_ratio`, 없으면 4:5) — img width·height 속성값(about, K1-3 5) */
  readonly mediaRatio: readonly [number, number];
  readonly root: KitRootProps;
}
export type KitSection = (props: KitSectionProps) => ReactElement;
