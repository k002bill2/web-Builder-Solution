import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { getSectionDefinition } from "../../engine/sections/registry";
import type { PreviewView } from "../../features/detail/previewView";
import { slotIssue, type SlotIssue } from "../../features/studio/canvasIssues";
import { FRAME_REM, previewScale, scaleCaption } from "../../features/studio/previewFrame";
import { sectionName, variantName } from "../../features/studio/selection";
import { readRenderMessage, type FrameRect, type KitTokenInput, type ParentMessage } from "../../render/protocol";

/** 5.7 캡션 — 늘 보인다 */
export const CANVAS_CAPTION = "구조 미리보기 — 섹션 구성과 실제 문구입니다. 실제 페이지는 생성기 연결 후(M2) 만들어집니다.";
/** 렌더 문서(별도 빌드 엔트리 render.html — ADR-004 개정 2). 같은 출처 경로지만 sandbox="allow-scripts"라 불투명 출처로 뜬다 */
export const RENDER_DOC_SRC = "/render.html";
export const RENDER_FRAME_TITLE = "구조 미리보기 화면";

interface CanvasIssue extends SlotIssue {
  readonly instanceId: string;
  readonly slotKey: string;
}

/** 문서 전체의 글자 수 문제(편집 중 표시, 5.7) — 문장은 부모 문서에 늘 있다(필드 aria-describedby 대상, E-AC-49) */
function docIssues(doc: PageDoc): readonly CanvasIssue[] {
  return doc.sections.flatMap((section) =>
    (getSectionDefinition(section.type, section.variant)?.slots ?? []).flatMap((entry) => {
      const issue = slotIssue(section, entry);
      return issue ? [{ ...issue, instanceId: section.instanceId, slotKey: entry.key }] : [];
    }),
  );
}

const ISSUE_RING = { warn: "outline-status-cautionary-text text-status-cautionary-text", block: "outline-status-negative-text text-status-negative-text" } as const;
/**
 * 렌더 문서 좌표(CSS px) → 오버레이 위치. 오버레이 층은 iframe과 원점은 같지만 축소(zoom) 층 밖에 있다 — 칩·배지·문장 글자가 원래 크기로 읽히게(r4.10 축소 보기).
 * 그래서 사각형에 축소 비율을 곱하고, 바깥 여백(grow)은 곱하지 않는다.
 */
const place = (r: FrameRect, scale: number, grow = 0) => ({
  left: `${r[2] * scale - grow}px`,
  top: `${r[3] * scale - grow}px`,
  width: `${r[4] * scale + grow * 2}px`,
  height: `${r[5] * scale + grow * 2}px`,
});

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

/**
 * 렌더 문서 다리 (M2A-1 R4 · 프로토콜 render/protocol.ts). iframe에서 온 메시지만 받는다(`event.source` + 모양 검사).
 * ready 뒤 문서·킷 토큰 입력이 바뀔 때마다 render를 통째로 보내고(섹션 ≤ 11), 그 사이 사각형은 비운다 — 다시 그리는 중에는 오버레이를 그리지 않는다(5.7 r4.8).
 */
function useRenderFrame({
  doc,
  kitTokens,
  images,
  selectedId,
  width,
  onSelect,
}: {
  readonly doc: PageDoc;
  readonly kitTokens?: KitTokenInput;
  readonly images?: Readonly<Record<string, Blob>>;
  readonly selectedId: string;
  readonly width: number;
  readonly onSelect: (instanceId: string) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  // 사각형은 잰 문서와 함께 둔다 — 화면 문서와 다르면(다시 그리는 중) 오버레이를 그리지 않는다(5.7 r4.8)
  const [measured, setMeasured] = useState<{ readonly doc: PageDoc; readonly rects: readonly FrameRect[] }>();
  const sentDoc = useRef<PageDoc>(undefined);
  const select = useRef(onSelect);
  useEffect(() => {
    select.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (!frame.current || event.source !== frame.current.contentWindow) return;
      const message = readRenderMessage(event.data);
      if (!message) return;
      if (message.type === "ready") setReady(true);
      else if (message.type === "rects") setMeasured(sentDoc.current && { doc: sentDoc.current, rects: message.rects });
      else if (message.type === "click") select.current(message.instanceId);
      // NO_KIT_TOKENS = 폴백은 그렸다(사각형 보고 계속) — INVALID_DOC만 사각형을 지운다
      else if (message.code === "INVALID_DOC") setMeasured(undefined);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  const send = (message: ParentMessage) => frame.current?.contentWindow?.postMessage(message, "*");
  useEffect(() => {
    if (!ready) return;
    sentDoc.current = doc;
    // 로컬 이미지는 Blob 자체(불투명 출처 렌더 문서는 부모 blob: URL을 못 연다 — K4)
    send({ type: "render", doc, ...(kitTokens && { kitTokens }), ...(images && { images }) });
  }, [ready, doc, kitTokens, images]);
  useEffect(() => {
    if (ready && width > 0) send({ type: "viewport", width });
  }, [ready, width]);
  useEffect(() => {
    if (ready) send({ type: "select", instanceId: selectedId });
  }, [ready, selectedId]);
  const rects = measured?.doc === doc ? measured.rects : undefined;
  return { frame, rects };
}

/**
 * 부모 오버레이(SPEC 5.7 r4.8) — 선택 테두리·라벨 칩 · 문제 2중 테두리(안쪽 흰 간격 + 바깥 상태 글자 토큰)·배지 · 문제 문장.
 * 테두리는 `aria-hidden` · 포인터 통과, 배지만 누름 → 그 필드 포커스(onIssue). 사각형이 없으면 테두리·칩·배지는 그리지 않고 문장만 남긴다(aria-describedby 대상).
 */
function Overlay({
  rects,
  scale,
  doc,
  selectedId,
  issues,
  onIssue,
}: {
  readonly rects: readonly FrameRect[] | undefined;
  readonly scale: number;
  readonly doc: PageDoc;
  readonly selectedId: string;
  readonly issues: readonly CanvasIssue[];
  readonly onIssue: (issue: CanvasIssue) => void;
}) {
  const selectedBox = useRef<HTMLDivElement>(null);
  const rectOf = (instanceId: string, slotKey: string | null) => rects?.find((r) => r[0] === instanceId && r[1] === slotKey);
  const selected = doc.sections.find((s) => s.instanceId === selectedId);
  const selectedRect = selected && rectOf(selected.instanceId, null);
  useEffect(() => {
    // 애니메이션 없이 즉시 — jsdom에는 scrollIntoView가 없다
    selectedBox.current?.scrollIntoView?.({ block: "nearest" });
  }, [selectedId, selectedRect]);
  return (
    <div data-canvas-overlay className="pointer-events-none absolute inset-0">
      {selected && selectedRect && (
        <div ref={selectedBox} className="absolute" style={place(selectedRect, scale)}>
          <div aria-hidden="true" className="absolute inset-0 border-2 border-primary" />
          {/* 선택 라벨 칩(5.7 · B-12) — 12px 700, primary 면 위 on-primary 글자 */}
          <span className="absolute top-0 left-0 rounded-sm bg-primary px-2 py-0.5 text-caption2 font-bold text-on-primary">
            {sectionName(selected)} · {variantName(selected)}
          </span>
        </div>
      )}
      {issues.map((issue) => {
        const r = rectOf(issue.instanceId, issue.slotKey);
        return (
          <div key={issue.id} className={r ? "absolute" : "sr-only"} style={r && place(r, scale, 4)}>
            {r && <div aria-hidden="true" className={`absolute inset-0 rounded-sm border-2 border-background-normal outline-2 ${ISSUE_RING[issue.level]}`} />}
            {r && (
              <span
                data-issue-badge
                onClick={() => onIssue(issue)}
                className={`pointer-events-auto absolute -top-2.5 right-1 cursor-pointer rounded-sm bg-background-normal px-1 text-caption2 font-bold ${ISSUE_RING[issue.level]}`}
              >
                {issue.level === "block" ? "차단 1" : "경고 1"}
              </span>
            )}
            <p id={issue.id} className={`absolute top-full left-0 mt-1 rounded-sm bg-background-normal px-1 text-caption1 ${ISSUE_RING[issue.level]}`}>
              {issue.text}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 가운데 "구조 미리보기"(DS-2A-05 3.1 · 5.7 · E-AC-16). `section aria-labelledby` h2(6.2).
 * 문서는 렌더 문서(iframe, `sandbox="allow-scripts"`)가 그리고, 이 컴포넌트는 호스트(프레임 · 다리 · 오버레이)만 맡는다(M2A-1 · SPEC 5.7 r4.8).
 * 미리보기 폭 = iframe 폭(렌더 문서의 미디어 쿼리가 실제 뷰포트로 동작) — 데스크톱 1280 · 태블릿 768 · 모바일 390(r4.10). 넓은 프레임은 `zoom`으로 축소 보기(가로 스크롤 0).
 * `scrollable`(≥1024) = 열마다 따로 스크롤 → 스크롤 영역에 `tabIndex=0`(4.1). 섹션 선택은 렌더 문서 click 메시지로 받는다(5.1 — 포인터만).
 */
export function StructureCanvas({
  doc,
  selectedId,
  onSelect,
  onIssue,
  view,
  scrollable,
  head,
  kitTokens,
  images,
}: {
  readonly doc: PageDoc;
  readonly selectedId: string;
  readonly onSelect: (instanceId: string) => void;
  /** 문제 배지 누름 → 그 섹션 선택 + 필드 포커스(5.7) — 문장 id = 필드 aria-describedby 맨 앞 */
  readonly onIssue?: (instanceId: string, issueId: string) => void;
  readonly view: PreviewView;
  readonly scrollable: boolean;
  readonly head?: ReactNode;
  /** 문서 프로필 버전 킷 토큰 입력(docKitTokens, 팔레트 포함) — 없으면 렌더 문서가 킷 대신 error, 폴백은 중립 토큰 */
  readonly kitTokens?: KitTokenInput;
  /** 로컬 이미지 id → Blob(이미지 보관소 — 아직 호출처 없음, 2a-05 5.9 보관소가 생기면 넘긴다) */
  readonly images?: Readonly<Record<string, Blob>>;
}) {
  const [area, available] = useWidth();
  const frameRem = FRAME_REM[view];
  const framePx = frameRem * remPx();
  const scale = previewScale(framePx, available);
  const caption = scaleCaption(scale);
  const { frame, rects } = useRenderFrame({ doc, kitTokens, images, selectedId, width: framePx, onSelect });
  // 프레임 높이 = 섹션 사각형 맨 아래(렌더 문서 자체 스크롤 없음). 다시 그리는 동안은 마지막 높이 유지
  const [height, setHeight] = useState<number>();
  const bottom = rects?.filter((r) => r[1] === null).reduce((max, r) => Math.max(max, r[3] + r[5]), 0);
  if (bottom !== undefined && bottom > 0 && bottom !== height) setHeight(bottom);
  const issues = docIssues(doc);
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
      <div ref={area} className="min-w-0">
        {/* 축소 층(zoom) = 프레임 + iframe만. 오버레이는 그 밖 같은 원점(relative 감싸개)에서 사각형 × 비율로 맞춘다 */}
        <div className="relative mx-auto w-fit max-w-none">
          <div
            style={{ width: `${frameRem}rem`, zoom: scale < 1 ? scale : undefined }}
            className="max-w-none overflow-hidden rounded-md bg-background-normal outline outline-line-normal"
          >
            <iframe
              ref={frame}
              src={RENDER_DOC_SRC}
              sandbox="allow-scripts"
              title={RENDER_FRAME_TITLE}
              style={{ height: height === undefined ? undefined : `${height}px` }}
              className="block min-h-40 w-full border-0"
            />
          </div>
          <Overlay rects={rects} scale={scale} doc={doc} selectedId={selectedId} issues={issues} onIssue={(issue) => onIssue?.(issue.instanceId, issue.id)} />
        </div>
      </div>
    </section>
  );
}
