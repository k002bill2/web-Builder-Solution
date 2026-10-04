import type { ReactNode } from "react";
import { slotText, splitItems } from "./text";
import type { KitSectionProps } from "./types";

/** 하단 링크 — 글자 항목(VS-1 대상 슬롯 없음, MQ-2) · 빈 목록이면 0(0.8). footer 4변형 공용 */
export const FooterLinks = ({ items }: { readonly items: readonly string[] }) =>
  items.length > 0 && (
    <ul data-slot="links" role="list" className="kit-footer-links">
      {items.map((item, i) => (
        <li key={`${i}-${item}`}>{item}</li>
      ))}
    </ul>
  );

/**
 * footer/biz-extended (M2A-2a K7 · m2a K1-7) — 섹션 톤과 무관하게 `ink` 면 · 모든 글자 `bg`(C-2 뒤집기, 반투명·muted 글자 0).
 * 사업자정보 = `address`(줄바꿈 존중) · 하단 링크 = 글자 항목(VS-1 대상 슬롯 없음, MQ-2) · 저작권 + 구분선(저작권이 없으면 둘 다 0).
 * `map`(footer/biz-extended-map) = 위 줄 오른쪽 지도 칸 — 있으면 사업자정보·링크를 글 칸 하나로 묶는다.
 */
export function FooterBizExtended({ section, root, map }: KitSectionProps & { readonly map?: ReactNode }) {
  const info = slotText(section, "businessInfo");
  const links = splitItems(slotText(section, "links"));
  const copyright = slotText(section, "copyright");
  const text = (
    <>
      {info && (
        <address data-slot="businessInfo" className="kit-footer-info">
          {info}
        </address>
      )}
      <FooterLinks items={links} />
    </>
  );
  return (
    <footer {...root} data-surface="ink" className={`kit-footer${map ? " kit-footer--map" : ""}`}>
      <div className="kit-footer-inner">
        <div className="kit-footer-top">
          {map ? (
            <>
              <div className="kit-footer-text">{text}</div>
              {map}
            </>
          ) : (
            text
          )}
        </div>
        {copyright && (
          <>
            <hr data-divider className="kit-footer-divider" />
            <p data-slot="copyright" className="kit-footer-copy">
              {copyright}
            </p>
          </>
        )}
      </div>
    </footer>
  );
}
