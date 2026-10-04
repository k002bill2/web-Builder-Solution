import { MenuButton, MenuList, Sheet } from "./headerParts";
import { slotText, splitItems } from "./text";
import type { KitSectionProps } from "./types";

/**
 * header/sticky-two-tier (SPEC-BOUND B-2) — 보조 줄(utility, md 이상) 위 · 바(브랜드 · lg 이상 인라인 메뉴 · lg 미만 "메뉴" 버튼) · 시트(주 메뉴 → md 미만 구분선 + 보조 목록).
 * 보조 목록은 랜드마크 아님(div 안 ul, MQ-B2) · 주 메뉴·보조 목록 모두 폭마다 한 벌만 보인다(kit.css). nav 빈 값이면 보조 줄이 모든 폭에서 보인다(data-always).
 * 앵커 여백 확대 = kit.css 문서 수준 `:has()` 1줄(D-3 · MQ-B5).
 */
export function HeaderStickyTwoTier({ section, links, root }: KitSectionProps) {
  const brand = slotText(section, "brand");
  const items = splitItems(slotText(section, "nav"));
  const utility = splitItems(slotText(section, "utility"));
  const sheet = `m-${section.instanceId}`;
  const menu = items.length > 0;
  const aux = utility.length > 0 && <MenuList items={utility} links={links} slot="utility" className="kit-menu kit-utility" />;
  return (
    <header {...root} className="kit-header kit-header--two-tier">
      {aux && (
        <div className="kit-tier" {...(!menu && { "data-always": "" })}>
          {aux}
        </div>
      )}
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
        {menu && <MenuButton sheet={sheet} />}
      </div>
      {menu && (
        <Sheet id={sheet}>
          <nav aria-label="주 메뉴" className="kit-nav-sheet">
            <MenuList items={items} links={links} />
          </nav>
          {aux && (
            <>
              <hr className="kit-sheet-rule" />
              {aux}
            </>
          )}
        </Sheet>
      )}
    </header>
  );
}
