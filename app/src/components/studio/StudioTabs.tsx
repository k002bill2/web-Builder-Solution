import type { ReactNode } from "react";

export type StudioTab = "sections" | "edit" | "gate";

export interface StudioTabItem {
  readonly id: StudioTab;
  readonly label: string;
  readonly panel: ReactNode;
}

/**
 * <1024 탭(DS-2A-05 4.1 · 6.2 · E-AC-14) — `tablist` "편집 도구" + `tab` + `tabpanel`. DS에 Tabs가 없어 studio 청크 안 작은 부품(S-B6).
 * 패널은 모두 그려 두고 `hidden`으로 바꾼다 — 탭을 바꿔도 입력·스크롤이 남는다. `between` = 탭 목록 아래(편집 알림, 6.3).
 */
export function StudioTabs({
  tabs,
  selected,
  onSelect,
  between,
}: {
  readonly tabs: readonly StudioTabItem[];
  readonly selected: StudioTab;
  readonly onSelect: (tab: StudioTab) => void;
  readonly between?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div role="tablist" aria-label="편집 도구" className="flex border-b border-line-normal px-3">
        {tabs.map((tab) => {
          const active = tab.id === selected;
          return (
            <button
              key={tab.id}
              id={`studio-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`studio-panel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(tab.id)}
              className={`ds-label min-h-10 flex-1 border-b-2 px-3 ${active ? "border-primary text-primary" : "border-transparent text-label-neutral"}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {between}
      {tabs.map((tab) => (
        <div key={tab.id} id={`studio-panel-${tab.id}`} role="tabpanel" aria-labelledby={`studio-tab-${tab.id}`} tabIndex={0} hidden={tab.id !== selected} className="px-3 py-2">
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
