import { MenuButton, MenuList, Sheet } from "./headerParts";
import { slotText, splitItems } from "./text";
import type { KitSectionProps } from "./types";

/** CTA — 대상 없으면 링크 아닌 버튼 모양 글자(0.10) */
function Cta({ text, href, place, always }: { readonly text: string; readonly href?: string; readonly place: "bar" | "sheet"; readonly always?: boolean }) {
  const props = { "data-cta": place, "data-slot": "cta", ...(always && { "data-always": "" }), className: `kit-cta kit-cta--${place}` };
  return href ? (
    <a href={href} {...props}>
      {text}
    </a>
  ) : (
    <span {...props}>{text}</span>
  );
}

/**
 * header/sticky-right-cta (M2A-2a K5 · m2a K1-1) — 상단 고정 바(브랜드 · 메뉴 · CTA) + lg 미만 메뉴 시트(`popover`, 네이티브 — React 상태 0).
 * 메뉴 두 벌(바 · 시트) 중 폭마다 한 벌만 보인다(kit.css) → `navigation` 랜드마크 ≤ 1. CTA는 md 미만에서 시트 맨 아래로 옮긴다.
 * 고정 문구: "메뉴" · "닫기" · nav 이름 "주 메뉴". header/transparent가 면 클래스·data-surface만 바꿔 같은 마크업을 쓴다(CTA 슬롯 없음 → CTA 0).
 */
export function HeaderStickyRightCta({
  section,
  links,
  root,
  className = "kit-header",
  surface,
}: KitSectionProps & { readonly className?: string; readonly surface?: string }) {
  const brand = slotText(section, "brand");
  const items = splitItems(slotText(section, "nav"));
  const cta = slotText(section, "cta");
  const sheet = `m-${section.instanceId}`;
  const menu = items.length > 0;
  return (
    <header {...root} {...(surface && { "data-surface": surface })} className={className}>
      <div className="kit-bar">
        {brand && (
          <p data-slot="brand" className="kit-brand">
            {brand}
          </p>
        )}
        {menu && (
          <nav aria-label="주 메뉴" className="kit-nav-bar">
            <MenuList items={items} links={links} />
          </nav>
        )}
        {cta && <Cta text={cta} href={links.cta} place="bar" always={!menu} />}
        {menu && <MenuButton sheet={sheet} />}
      </div>
      {menu && (
        <Sheet id={sheet}>
          <nav aria-label="주 메뉴" className="kit-nav-sheet">
            <MenuList items={items} links={links} />
          </nav>
          {cta && <Cta text={cta} href={links.cta} place="sheet" />}
        </Sheet>
      )}
    </header>
  );
}
