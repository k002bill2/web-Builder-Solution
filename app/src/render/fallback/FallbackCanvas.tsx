import type { PageDoc, SectionInstance } from "../../engine/contracts/pageDoc";
import { getSectionDefinition, SECTION_TYPE_INFO } from "../../engine/sections/registry";
import { slotPlaceholder } from "../../features/studio/slotPlaceholder";
import { CANVAS_LOOKS, canvasLayout, canvasVars, groupSlots, type CanvasPalette } from "./canvasLayouts";

/**
 * 렌더 문서 와이어프레임 폴백 (ADR-004 개정 2 결정 3 — 앱 캔버스 StructureCanvas의 섹션 블록 그리기를 옮긴 것, M2A-1).
 * 렌더러가 없는 변형(M2A-1에서는 전부)을 블록·막대 + 실제 슬롯 글자로 그리고 섹션 머리에 "구조 미리보기" 표식(SPEC 5.7 r4.8)을 단다.
 * 선택 테두리·라벨 칩·문제 표시는 그리지 않는다 — 부모 오버레이(5.7 r4.8, 내보내기·PNG에 섞이지 않게). 글자 슬롯은 `data-slot`(사각형 보고 대상).
 */

/** 섹션 머리 표식 글자(SPEC 5.7 r4.8 — 시각 명세는 M2A-0 Designer, 이 레인은 글자·위치 최소안) */
export const FALLBACK_MARK = "구조 미리보기";

/** 슬롯 값 — 스키마 순서. 빈 글자는 자리표시(E-S21 "제목을 입력하세요"), 이미지 = 줄무늬(끈 이미지는 빼고) */
interface SlotView {
  readonly key: string;
  readonly text?: string;
  readonly empty?: boolean;
}

function slotViews(section: SectionInstance): readonly SlotView[] {
  const def = getSectionDefinition(section.type, section.variant);
  return (def?.slots ?? []).flatMap((entry): SlotView[] => {
    const value = section.slots[entry.key];
    if (entry.kind === "image") return typeof value === "object" && !value.enabled ? [] : [{ key: entry.key }];
    if (typeof value !== "string" || value.trim() === "") return [{ key: entry.key, text: slotPlaceholder(entry.label), empty: true }];
    return [{ key: entry.key, text: value }];
  });
}

/** 이미지 슬롯 = 자체 대각 줄무늬(5.7 · PRD 원칙 4 — 외부 이미지 0). 사용자 로컬 이미지도 이 레인은 줄무늬(Blob 전달은 M2A-2) */
const Stripes = ({ className = "" }: { readonly className?: string }) => (
  <span
    data-stripes
    aria-hidden="true"
    className={`block min-h-16 rounded-sm bg-[repeating-linear-gradient(45deg,var(--canvas-muted)_0_0.375rem,var(--canvas-surface)_0.375rem_0.75rem)] ${className}`}
  />
);

/** 글자 1개 — 첫 글자는 굵게(Hero는 크게), 빈 값은 자리표시 */
function SlotLine({ view, strong, big }: { readonly view: SlotView; readonly strong: boolean; readonly big?: boolean }) {
  const className = strong ? (big ? "ds-heading1" : "ds-body1-strong") : "ds-body3";
  return (
    <p data-slot={view.key} className={view.empty ? "ds-body3 text-label-alternative" : className}>
      {view.text}
    </p>
  );
}

/**
 * 섹션 블록 = 변형별 모양(canvasLayouts 표) + 실제 슬롯 글자(5.7). 제목 요소를 쓰지 않는다.
 * 머리(번호 없는 슬롯) · 칸(번호 슬롯 묶음) 순서라 글자 순서 = 스키마 순서.
 */
function SectionBlock({ section }: { readonly section: SectionInstance }) {
  const layout = canvasLayout(section.type, section.variant);
  const look = CANVAS_LOOKS[layout];
  const { head, cells } = groupSlots(slotViews(section));
  const texts = head.filter((v) => v.text !== undefined);
  const media = look.media !== false && head.some((v) => v.text === undefined);
  const face = look.face ?? (section.tone === "alt" ? "bg-(--canvas-surface) text-(--canvas-ink)" : "bg-(--canvas-bg) text-(--canvas-ink)");
  return (
    <div data-instance-id={section.instanceId} data-fallback="true" data-layout={layout} className={`relative flex cursor-pointer flex-col gap-3 px-4 py-3 ${face}`}>
      <span data-fallback-mark className="self-end text-caption2 font-bold">
        {FALLBACK_MARK}
      </span>
      <div className={`flex gap-4 ${look.row ?? "flex-col"}`}>
        {texts.length > 0 && (
          <div className={`flex min-w-0 flex-1 flex-col gap-1.5 ${look.head ?? ""}`}>
            {texts.map((view, i) => (
              <SlotLine key={view.key} view={view} strong={i === 0} big={look.big} />
            ))}
          </div>
        )}
        {media && <Stripes className={layout === "image" ? "min-h-32" : "min-h-24 flex-1"} />}
      </div>
      {layout === "form" && <span aria-hidden="true" className="block h-8 rounded-sm border border-(--canvas-muted) bg-(--canvas-bg)" />}
      {cells.length > 0 && (
        <div className={look.items ?? "flex flex-col gap-2"}>
          {cells.map((cell, n) => (
            <div key={cell[0]!.key} data-cell className="flex flex-col gap-1 rounded-sm border border-(--canvas-muted) p-2">
              {cell.map((view, i) =>
                view.text === undefined ? (
                  <Stripes key={view.key} className={layout === "masonry" && n % 2 === 0 ? "min-h-24" : ""} />
                ) : (
                  <SlotLine key={view.key} view={view} strong={i === 0} />
                ),
              )}
            </div>
          ))}
        </div>
      )}
      {texts.length + cells.length === 0 && <p className="ds-caption1">{SECTION_TYPE_INFO[section.type].name}</p>}
    </div>
  );
}

/** 문서 전체 — 루트에 `--canvas-*` 변수(문서 프로필 버전 팔레트, 없으면 중립 토큰) */
export function FallbackCanvas({ doc, palette }: { readonly doc: PageDoc; readonly palette?: CanvasPalette }) {
  return (
    <div data-fallback-root style={canvasVars(palette)} className="flex flex-col">
      {doc.sections.map((section) => (
        <SectionBlock key={section.instanceId} section={section} />
      ))}
    </div>
  );
}
