import { slotText, splitItems } from "./text";
import type { KitSectionProps } from "./types";

/**
 * footer/biz-extended (M2A-2a K7 · m2a K1-7) — 섹션 톤과 무관하게 `ink` 면 · 모든 글자 `bg`(C-2 뒤집기, 반투명·muted 글자 0).
 * 사업자정보 = `address`(줄바꿈 존중) · 하단 링크 = 글자 항목(VS-1 대상 슬롯 없음, MQ-2) · 저작권 + 구분선(저작권이 없으면 둘 다 0).
 */
export function FooterBizExtended({ section, root }: KitSectionProps) {
  const info = slotText(section, "businessInfo");
  const links = splitItems(slotText(section, "links"));
  const copyright = slotText(section, "copyright");
  return (
    <footer {...root} data-surface="ink" className="kit-footer">
      <div className="kit-footer-inner">
        <div className="kit-footer-top">
          {info && (
            <address data-slot="businessInfo" className="kit-footer-info">
              {info}
            </address>
          )}
          {links.length > 0 && (
            <ul data-slot="links" role="list" className="kit-footer-links">
              {links.map((item, i) => (
                <li key={`${i}-${item}`}>{item}</li>
              ))}
            </ul>
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
