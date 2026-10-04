import { FooterBizExtended } from "./FooterBizExtended";
import { Media } from "./Media";
import { slotImage } from "./text";
import type { KitSectionProps } from "./types";

/**
 * footer/biz-extended-map (SPEC-BOUND B-9) — K1-7 + 지도 칸. 지도 = 이미지 슬롯 하나(로컬 이미지 img lazy · 없으면 토큰 그라디언트 aria-hidden) — 외부 지도 요청 0.
 * 위치 정본 = 사업자정보 글자. lg 7 : 5 · md 6 : 6 · md 미만 1단(사업자정보 → 링크 → 지도). 지도 꺼짐 = biz-extended와 같은 배치.
 */
export function FooterBizExtendedMap(props: KitSectionProps) {
  const image = slotImage(props.section, "map");
  const map = image && (
    <figure className="kit-footer-map">
      <Media image={image} images={props.images} ratio={[4, 3]} className="kit-footer-map-img" />
    </figure>
  );
  return <FooterBizExtended {...props} map={map} />;
}
