import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import type { PageDoc, SectionInstance } from "../../engine/contracts/pageDoc";
import { getSectionDefinition } from "../../engine/sections/registry";
import type { PreviewView } from "../../features/detail/previewView";
import { slotIssue, type SlotIssue } from "../../features/studio/canvasIssues";
import { FRAME_REM, previewScale, scaleCaption } from "../../features/studio/previewFrame";
import { sectionName, variantName } from "../../features/studio/selection";
import { slotPlaceholder } from "../../features/studio/slotPlaceholder";

/** 5.7 캡션 — 늘 보인다 */
export const CANVAS_CAPTION = "구조 미리보기 — 섹션 구성과 실제 문구입니다. 실제 페이지는 생성기 연결 후(M2) 만들어집니다.";

/** 글자 슬롯 값(이미지 제외) + 글자 수 문제 — 스키마 순서. 빈 값은 자리표시(E-S21 "제목을 입력하세요") */
interface SlotText {
  readonly key: string;
  readonly text: string;
  readonly empty: boolean;
  readonly issue?: SlotIssue;
}

function slotTexts(section: SectionInstance): readonly SlotText[] {
  const def = getSectionDefinition(section.type, section.variant);
  return (def?.slots ?? []).flatMap((entry): SlotText[] => {
    const value = section.slots[entry.key];
    if (entry.kind === "image") return [];
    if (typeof value !== "string" || value.trim() === "") return [{ key: entry.key, text: slotPlaceholder(entry.label), empty: true }];
    const issue = slotIssue(section, entry);
    return [{ key: entry.key, text: value, empty: false, ...(issue && { issue }) }];
  });
}

const ISSUE_RING = { warn: "outline-status-cautionary-text text-status-cautionary-text", block: "outline-status-negative-text text-status-negative-text" } as const;

/**
 * 문제 요소(5.7 · B-03): 2중 테두리(안쪽 흰 간격 `background-normal` + 바깥 상태 글자 토큰) + 배지 글자 "경고 1"/"차단 1" + 아래 문장(id = 필드 describedby).
 * 흰 간격 덕에 테두리는 늘 흰 면과 맞닿는다 — 대비가 사용자 색과 무관.
 */
function IssueText({ text, issue, strong }: { readonly text: string; readonly issue: SlotIssue; readonly strong: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <div className={`relative rounded-sm border-2 border-background-normal outline-2 ${ISSUE_RING[issue.level]}`}>
        <p className={strong ? "ds-body1-strong text-label-normal" : "ds-body3 text-label-neutral"}>{text}</p>
        <span className="absolute -top-2.5 right-1 rounded-sm bg-background-normal px-1 text-caption2 font-bold">{issue.level === "block" ? "차단 1" : "경고 1"}</span>
      </div>
      <p id={issue.id} className={`text-caption1 ${ISSUE_RING[issue.level]}`}>
        {issue.text}
      </p>
    </div>
  );
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
        <span className="self-start rounded-sm bg-primary px-2 py-0.5 text-caption2 font-bold text-on-primary">
          {sectionName(section)} · {variantName(section)}
        </span>
      )}
      <span aria-hidden="true" className="h-1.5 w-12 rounded-full bg-fill-strong" />
      {texts.map(({ key, text, empty, issue }, i) =>
        empty ? (
          <p key={key} className="ds-body3 text-label-alternative">
            {text}
          </p>
        ) : issue ? (
          <IssueText key={key} text={text} issue={issue} strong={i === 0} />
        ) : (
          <p key={key} className={i === 0 ? "ds-body1-strong text-label-normal" : "ds-body3 text-label-neutral"}>
            {text}
          </p>
        ),
      )}
      {texts.length === 0 && <p className="ds-caption1 text-label-alternative">{sectionName(section)}</p>}
    </div>
  );
}

/**
 * 가운데 "구조 미리보기"(DS-2A-05 3.1 · 5.7 · E-AC-16). `section aria-labelledby` h2(6.2).
 * `scrollable`(≥1024) = 열마다 따로 스크롤 → 스크롤 영역에 `tabIndex=0`(키보드 스크롤, axe scrollable-region-focusable, 4.1).
 * 섹션 블록은 Tab 정지가 아니다(5.1) — 포인터 누름만 선택으로 받는다(키보드는 목록·Select·탭이 같은 기능). 선택이 바뀌면 보이게 즉시 스크롤, 포커스는 옮기지 않는다.
 */
/** 캔버스 안쪽 폭(px) — ResizeObserver가 없으면(jsdom) 0 = 측정 전 */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

const remPx = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

export function StructureCanvas({
  doc,
  selectedId,
  onSelect,
  view,
  scrollable,
  head,
}: {
  readonly doc: PageDoc;
  readonly selectedId: string;
  readonly onSelect: (instanceId: string) => void;
  readonly view: PreviewView;
  readonly scrollable: boolean;
  readonly head?: ReactNode;
}) {
  const blocks = useRef<HTMLDivElement>(null);
  const [area, available] = useWidth();
  const frameRem = FRAME_REM[view];
  const scale = previewScale(frameRem === undefined ? undefined : frameRem * remPx(), available);
  const caption = scaleCaption(scale);
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
      {caption && <p className="ds-caption1 text-label-alternative">{caption}</p>}
      {/* 넓은 프레임은 축소 보기 — `zoom`은 차지하는 폭까지 줄여 가로 스크롤이 생기지 않는다(transform: scale은 원래 폭을 남긴다, REPORT 차이) */}
      <div ref={area} className="min-w-0">
        <div
          ref={blocks}
          onClick={pick}
          style={{ width: frameRem === undefined ? undefined : `${frameRem}rem`, zoom: scale < 1 ? scale : undefined }}
          className="mx-auto flex max-w-none flex-col overflow-hidden rounded-md border border-line-normal"
        >
          {doc.sections.map((section) => (
            <SectionBlock key={section.instanceId} section={section} selected={section.instanceId === selectedId} />
          ))}
        </div>
      </div>
    </section>
  );
}
