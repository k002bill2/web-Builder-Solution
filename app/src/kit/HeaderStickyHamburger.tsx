import { MenuButton, MenuList, Sheet } from "./headerParts";
import { slotText, splitItems } from "./text";
import type { KitSectionProps } from "./types";

/**
 * header/sticky-hamburger (SPEC-BOUND B-1) — 고정 바(브랜드 · "메뉴" 버튼, 모든 폭) + 메뉴 한 벌 = 시트(`popover`). 바 안 nav 0 → 닫힌 상태 navigation 0.
 * 시트 판 = lg 오른쪽 위 4/12 · md 6/12 · md 미만 전체 폭(kit.css `kit-header--burger` — K1-1의 lg 숨김을 덮어씀, D-2). CTA 슬롯 없음.
 */
export function HeaderStickyHamburger({ section, links, root }: KitSectionProps) {
  const brand = slotText(section, "brand");
  const items = splitItems(slotText(section, "nav"));
  const sheet = `m-${section.instanceId}`;
  const menu = items.length > 0;
  return (
    <header {...root} className="kit-header kit-header--burger">
      <div className="kit-bar">
        {brand && (
          <p data-slot="brand" className="kit-brand">
            {brand}
          </p>
        )}
        {menu && <MenuButton sheet={sheet} />}
      </div>
      {menu && (
        <Sheet id={sheet}>
          <nav aria-label="주 메뉴" className="kit-nav-sheet">
            <MenuList items={items} links={links} />
          </nav>
        </Sheet>
      )}
    </header>
  );
}
