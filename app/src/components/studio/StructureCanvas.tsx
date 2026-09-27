import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import type { PageDoc, SectionInstance } from "../../engine/contracts/pageDoc";
import { getSectionDefinition } from "../../engine/sections/registry";
import { sectionName, variantName } from "../../features/studio/selection";

/** 5.7 캡션 — 늘 보인다 */
export const CANVAS_CAPTION = "구조 미리보기 — 섹션 구성과 실제 문구입니다. 실제 페이지는 생성기 연결 후(M2) 만들어집니다.";

/** 글자 슬롯 값(빈 값·이미지 제외) — 스키마 순서 */
function slotTexts(section: SectionInstance): readonly { readonly key: string; readonly text: string }[] {
  const def = getSectionDefinition(section.type, section.variant);
  return (def?.slots ?? []).flatMap((entry) => {
    const value = section.slots[entry.key];
    return entry.kind !== "image" && typeof value === "string" && value.trim() !== "" ? [{ key: entry.key, text: value }] : [];
  });
}

/** 섹션 블록 = 와이어프레임 막대 + 실제 슬롯 글자(5.7). 제목 요소를 쓰지 않는다 — 편집기 제목 구조(6.1)와 섞이지 않게 */
function SectionBlock({ section, selected }: { readonly section: SectionInstance; readonly selected: boolean }) {
  const texts = slotTexts(section);
  return (
    <div
      data-instance-id={section.instanceId}
      className={`relative flex cursor-pointer flex-col gap-1.5 border-2 px-4 py-3 ${selected ? "border-primary" : "border-transparent"} ${section.tone === "alt" ? "bg-fill-normal" : "bg-background-normal"}`}
    >
      {/* 선택 라벨 칩(5.7 · B-12) — 12px 700, primary 면 위 on-primary 글자 */}
      {selected && (
        <span className="self-start rounded-sm bg-primary px-2 py-0.5 text-caption1 font-bold text-on-primary">
          {sectionName(section)} · {variantName(section)}
        </span>
      )}
      <span aria-hidden="true" className="h-1.5 w-12 rounded-full bg-fill-strong" />
      {texts.map(({ key, text }, i) => (
        <p key={key} className={i === 0 ? "ds-body1-strong text-label-normal" : "ds-body3 text-label-neutral"}>
          {text}
        </p>
      ))}
      {texts.length === 0 && <p className="ds-caption1 text-label-alternative">{sectionName(section)}</p>}
    </div>
  );
}

/**
 * 가운데 "구조 미리보기"(DS-2A-05 3.1 · 5.7 · E-AC-16). `section aria-labelledby` h2(6.2).
 * `scrollable`(≥1024) = 열마다 따로 스크롤 → 스크롤 영역에 `tabIndex=0`(키보드 스크롤, axe scrollable-region-focusable, 4.1).
 * 섹션 블록은 Tab 정지가 아니다(5.1) — 포인터 누름만 선택으로 받는다(키보드는 목록·Select·탭이 같은 기능). 선택이 바뀌면 보이게 즉시 스크롤, 포커스는 옮기지 않는다.
 */
export function StructureCanvas({
  doc,
  selectedId,
  onSelect,
  scrollable,
  head,
}: {
  readonly doc: PageDoc;
  readonly selectedId: string;
  readonly onSelect: (instanceId: string) => void;
  readonly scrollable: boolean;
  readonly head?: ReactNode;
}) {
  const blocks = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // 애니메이션 없이 즉시(behavior 기본 auto) — prefers-reduced-motion과 무관하게 움직임 0. jsdom에는 scrollIntoView가 없다
    blocks.current?.querySelector(`[data-instance-id="${CSS.escape(selectedId)}"]`)?.scrollIntoView?.({ block: "nearest" });
  }, [selectedId]);
  const pick = (event: MouseEvent<HTMLDivElement>) => {
    const id = (event.target as Element).closest("[data-instance-id]")?.getAttribute("data-instance-id");
    if (id) onSelect(id);
  };
  return (
    <section
      aria-labelledby="studio-canvas-heading"
      tabIndex={scrollable ? 0 : undefined}
      className={`flex min-w-0 flex-col gap-2 bg-fill-alternative p-3 ${scrollable ? "min-h-0 overflow-y-auto" : ""}`}
    >
      <h2 id="studio-canvas-heading" className="ds-heading2">
        구조 미리보기
      </h2>
      <p className="ds-caption1 text-label-alternative">{CANVAS_CAPTION}</p>
      {head}
      <div ref={blocks} onClick={pick} className="flex flex-col overflow-hidden rounded-md border border-line-normal">
        {doc.sections.map((section) => (
          <SectionBlock key={section.instanceId} section={section} selected={section.instanceId === selectedId} />
        ))}
      </div>
    </section>
  );
}
