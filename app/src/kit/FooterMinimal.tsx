import type { ReactNode } from "react";
import { FooterLinks } from "./FooterBizExtended";
import { slotText, splitItems } from "./text";
import type { KitSectionProps } from "./types";

/**
 * 미니멀 footer 공통 (SPEC-BOUND B-10·B-11) — 밝은 띠(bg 면 = 본문 base 면 `.kit-body`, 톤 속성 없음 + 위 구분선 muted) · 한 줄 래퍼 = 앞 글자(저작권 또는 사업자정보) → 하단 링크.
 * 루트·id는 내용이 비어도 남는다(CTA 폴백 대상, 0.10). md 이상 한 줄(앞 글자 왼쪽 · 링크 오른쪽, 넘치면 줄바꿈) · md 미만 DOM 순서대로 세로.
 */
function FooterLine({ section, root, lead }: Pick<KitSectionProps, "section" | "root"> & { readonly lead: ReactNode }) {
  return (
    <footer {...root} data-surface="bg" className="kit-body kit-footer-min">
      <div className="kit-footer-inner kit-footer-line">
        {lead}
        <FooterLinks items={splitItems(slotText(section, "links"))} />
      </div>
    </footer>
  );
}

/** footer/minimal (B-10) — 저작권(muted, C-5) → 링크(ink). 사업자정보 없음 → 확정 때 minimal-biz로 바뀐다(R-12) */
export function FooterMinimal({ section, root }: KitSectionProps) {
  const copyright = slotText(section, "copyright");
  return (
    <FooterLine
      section={section}
      root={root}
      lead={
        copyright && (
          <p data-slot="copyright" className="kit-footer-copy">
            {copyright}
          </p>
        )
      }
    />
  );
}
