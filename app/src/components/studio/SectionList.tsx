import type { ReactNode } from "react";
import type { SectionInstance } from "../../engine/contracts/pageDoc";
import { PAGE_INFO_ID, sectionName, variantName } from "../../features/studio/selection";

const ROW = "flex min-h-10 w-full flex-col items-start rounded-md border-l-4 px-3 py-1.5 text-left hover:bg-fill-normal";
const rowState = (selected: boolean) => (selected ? "border-primary bg-primary-container font-bold" : "border-transparent");

/**
 * 섹션 줄 목록 (DS-2A-05 5.1 · E-AC-05). 맨 위 "페이지 정보" 줄(섹션 아님) + 섹션 줄 = `button`(이름 + 변형 이름표 캡션).
 * 선택 줄: `aria-current="true"` + 굵기 700 + `primary-container` 면 + 왼쪽 막대 `primary`(색 외 단서 2개, B-01). 선택해도 포커스는 옮기지 않는다.
 * 줄 버튼 `data-row-id` = 연산 뒤 포커스 대상(6.4). `selectedExtra` = 선택 줄 옆 부품(<1024 순서 버튼, 5.2).
 */
export function SectionList({
  sections,
  selectedId,
  onSelect,
  selectedExtra,
}: {
  readonly sections: readonly SectionInstance[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
  readonly selectedExtra?: ReactNode;
}) {
  const pageInfo = selectedId === PAGE_INFO_ID;
  return (
    <div className="flex flex-col gap-1">
      <button type="button" aria-current={pageInfo ? "true" : undefined} onClick={() => onSelect(PAGE_INFO_ID)} className={`${ROW} ${rowState(pageInfo)}`}>
        <span className="ds-label">페이지 정보</span>
        <span className="ds-caption1 font-normal text-label-alternative">검색 제목 · 설명</span>
      </button>
      <ol className="flex flex-col gap-1">
        {sections.map((s) => {
          const selected = s.instanceId === selectedId;
          return (
            <li key={s.instanceId}>
              <button
                type="button"
                data-row-id={s.instanceId}
                aria-current={selected ? "true" : undefined}
                onClick={() => onSelect(s.instanceId)}
                className={`${ROW} ${rowState(selected)}`}
              >
                <span className="ds-label">{sectionName(s)}</span>
                <span className="ds-caption1 font-normal text-label-alternative">{variantName(s)}</span>
              </button>
              {selected && selectedExtra && <div className="px-3 py-2">{selectedExtra}</div>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
