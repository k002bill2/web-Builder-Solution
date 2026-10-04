import type { ReactNode } from "react";
import type { KitLinks } from "./types";

/** 메뉴 목록 — 본문 섹션 제목과 같은 항목만 앵커, 나머지 글자(0.10 · MQ-2). data-slot = 사각형 보고(보이는 벌만 — RenderApp measure) */
export function MenuList({ items, links, slot = "nav", className = "kit-menu" }: { readonly items: readonly string[]; readonly links: KitLinks; readonly slot?: string; readonly className?: string }) {
  return (
    <ul data-slot={slot} className={className} role="list">
      {items.map((item, i) => {
        const href = links.headings.get(item);
        return <li key={`${i}-${item}`}>{href ? <a href={href}>{item}</a> : <span>{item}</span>}</li>;
      })}
    </ul>
  );
}

/** "메뉴" 버튼 — 시트(`popover`)를 연다. React 상태 0 */
export const MenuButton = ({ sheet }: { readonly sheet: string }) => (
  <button type="button" popoverTarget={sheet} className="kit-menu-button">
    메뉴
  </button>
);

/** 메뉴 시트 — 네이티브 `popover`(Esc·바깥 닫힘) · 맨 위 "닫기" · 시트 안 앵커는 r4.12 고정 스크립트가 닫는다 */
export const Sheet = ({ id, children }: { readonly id: string; readonly children: ReactNode }) => (
  <div id={id} popover="auto" className="kit-sheet">
    <button type="button" popoverTarget={id} popoverTargetAction="hide" className="kit-menu-button kit-close">
      닫기
    </button>
    {children}
  </div>
);
