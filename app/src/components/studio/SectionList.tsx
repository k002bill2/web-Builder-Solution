import type { SectionInstance } from "../../engine/contracts/pageDoc";
import { sectionName, variantName } from "../../features/studio/selection";

/**
 * 섹션 줄 목록 (DS-2A-05 5.1 · E-AC-05). 줄 = `button`(이름 + 변형 이름표 캡션).
 * 선택 줄: `aria-current="true"` + 굵기 700 + `primary-container` 면 + 왼쪽 막대 `primary`(색 외 단서 2개, B-01). 선택해도 포커스는 옮기지 않는다.
 */
export function SectionList({
  sections,
  selectedId,
  onSelect,
}: {
  readonly sections: readonly SectionInstance[];
  readonly selectedId: string;
  readonly onSelect: (instanceId: string) => void;
}) {
  return (
    <ol className="flex flex-col gap-1">
      {sections.map((s) => {
        const selected = s.instanceId === selectedId;
        return (
          <li key={s.instanceId}>
            <button
              type="button"
              aria-current={selected ? "true" : undefined}
              onClick={() => onSelect(s.instanceId)}
              className={`flex min-h-10 w-full flex-col items-start rounded-md border-l-4 px-3 py-1.5 text-left hover:bg-fill-normal ${
                selected ? "border-primary bg-primary-container font-bold" : "border-transparent"
              }`}
            >
              <span className="ds-label">{sectionName(s)}</span>
              <span className="ds-caption1 font-normal text-label-alternative">{variantName(s)}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
