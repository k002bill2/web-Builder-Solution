import { sampleDoc } from "../../../engine/testing/sampleDoc";
import type { ParentMessage } from "../../../render/protocol";
import { drawDoc, without } from "../../../render/testing/drawKit";
import { EDITOR_EVENT, type EditorEvent } from "../editorEvents";
import type { RenderChannel } from "../staticHtml/staticHtml";
import { MAX_CANVAS_HEIGHT, PngError, buildCaptureSvg, capturePng, pngFileName, reportFailure, savePng, svgDataUrl, type PngDeps, type PngRequest } from "./pngCapture";

const KIT = { palette: { primary: "#111111", surface: "#eeeeee", ink: "#000000", muted: "#555555", bg: "#ffffff" }, card: { tone: "light", style: "flat" }, type: { family: "system-ui", headingWeight: 700, bodyWeight: 400, scale: 1.2 }, space: { grid: 8, sectionGap: 64, density: "comfortable" }, mediaRatio: "4:5" } as const;
const CSS = '[data-kit-marker="fallback"]{color:red}a>b{x:1}.c::after{content:"<&>"}';
/** 폴백 1개(CTA Band) 포함 사이트 루트 — 렌더 문서 serialize가 보내는 모양 */
const withFallback = () => drawDoc(sampleDoc()).querySelector("[data-site-root]")!.outerHTML;
const noFallback = () => drawDoc(without(sampleDoc(), "cta-band")).querySelector("[data-site-root]")!.outerHTML;
const parseSvg = (svg: string) => new DOMParser().parseFromString(svg, "image/svg+xml");
const REQUEST: PngRequest = { doc: sampleDoc(), kitTokens: KIT, view: "mobile", name: "  강남 카페/리브랜딩:2호점  ", revision: 12 };

/** 숨은 렌더 iframe 흉내 — ready → render → rects(바닥 = bottom) → serialize → html */
function fakeChannel(markup: string, bottom = 2400) {
  const opened: number[] = [];
  const sent: ParentMessage[] = [];
  let closed = 0;
  const open = (widthRem: number): RenderChannel => {
    opened.push(widthRem);
    let receive: (data: unknown) => void = () => undefined;
    return {
      listen: (r) => {
        receive = r;
        queueMicrotask(() => receive({ type: "ready" }));
      },
      send: (message) => {
        sent.push(message);
        if (message.type === "render") queueMicrotask(() => receive({ type: "rects", rects: [["s-header", null, 0, 0, 390, 60], ["s-hero", null, 0, 60, 390, bottom - 60], ["s-hero", "title", 8, 80, 300, 40]] }));
        if (message.type === "serialize") queueMicrotask(() => receive({ type: "html", markup }));
      },
      close: () => void closed++,
    };
  };
  return { open, opened, sent, closed: () => closed };
}
function deps(markup = withFallback(), bottom?: number, over: Partial<PngDeps> = {}) {
  const channel = fakeChannel(markup, bottom);
  const draw = vi.fn<PngDeps["draw"]>(async () => new Blob(["png"], { type: "image/png" }));
  const download = vi.fn<PngDeps["download"]>(() => undefined);
  const fetchText = async (url: string) => (url === "/render.html" ? '<link rel="stylesheet" href="/assets/render.css">' : CSS);
  const d: PngDeps = { open: channel.open, fetchText, draw, download, timeoutMs: 1000, ...over };
  return { d, channel, draw, download };
}
function listen() {
  const events: EditorEvent[] = [];
  const handler = (e: Event) => events.push((e as CustomEvent<EditorEvent>).detail);
  window.addEventListener(EDITOR_EVENT, handler);
  return { events, stop: () => window.removeEventListener(EDITOR_EVENT, handler) };
}

describe("PNG 캡처 문서 (m2a 3.3 · 2a-05 r4.8 — PNG 경로는 폴백 허용)", () => {
  it("폴백 섹션이 있어도 실패하지 않는다 · 표식(data-kit-marker)·data-fallback 그대로 — 정적 HTML 생성기의 '폴백 = 실패'와 분리", () => {
    const svg = buildCaptureSvg({ markup: withFallback(), css: CSS, width: 1280, height: 3000 });
    const doc = parseSvg(svg);
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.querySelectorAll('[data-kit-marker="fallback"]')).toHaveLength(1);
    expect(doc.querySelector('[data-kit-marker="fallback"]')!.textContent).toBe("구조 미리보기");
    expect(doc.querySelectorAll('[data-fallback="true"]')).toHaveLength(1);
  });

  it("SVG = 원래 폭 × 전체 길이 · foreignObject 안 XHTML(사이트 루트 1개 + 킷 CSS 인라인) · script·iframe·on* 0 · details[open] 0", () => {
    const dirty = noFallback().replace("<details", '<details open ontoggle="x()"').replace("</header>", "<script>alert(1)</script><iframe></iframe></header>");
    const svg = buildCaptureSvg({ markup: dirty, css: CSS, width: 390, height: 2400 });
    const doc = parseSvg(svg);
    expect(doc.querySelector("parsererror")).toBeNull();
    const root = doc.documentElement;
    expect([root.getAttribute("width"), root.getAttribute("height")]).toEqual(["390", "2400"]);
    const fo = root.querySelector("foreignObject")!;
    expect([fo.getAttribute("width"), fo.getAttribute("height")]).toEqual(["390", "2400"]);
    expect(fo.firstElementChild!.namespaceURI).toBe("http://www.w3.org/1999/xhtml");
    expect(doc.getElementsByTagName("style")[0]!.textContent).toBe(CSS);
    expect(doc.querySelectorAll("[data-site-root]")).toHaveLength(1);
    expect(doc.getElementsByTagName("script")).toHaveLength(0);
    expect(doc.getElementsByTagName("iframe")).toHaveLength(0);
    expect(doc.querySelectorAll("details[open]")).toHaveLength(0);
    const attrs = [...doc.querySelectorAll("*")].flatMap((el) => [...el.attributes].map((a) => a.name));
    expect(attrs.filter((a) => a.startsWith("on"))).toEqual([]);
  });

  it("사이트 루트가 없는 마크업은 실패", () => {
    expect(() => buildCaptureSvg({ markup: "<p>x</p>", css: CSS, width: 390, height: 100 })).toThrow(PngError);
  });

  it("그리는 URL = data:image/svg+xml (blob: URL은 Chrome·Edge·Safari 모두 캔버스 오염 — REPORT 4절)", () => {
    const url = svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg"><text>가 #&</text></svg>');
    expect(url.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    expect(decodeURIComponent(url.slice(url.indexOf(",") + 1))).toBe('<svg xmlns="http://www.w3.org/2000/svg"><text>가 #&</text></svg>');
  });
});

describe("파일 이름 (K-AC-32 PNG판)", () => {
  it("{이름}_{폭}_r{revision}.png · 폴백 있으면 _구조포함 · ??? → page · con → page-con · 40자 · 서로게이트 쌍", () => {
    expect(pngFileName("  강남 카페/리브랜딩:2호점  ", 1280, 12, 0)).toBe("강남-카페-리브랜딩-2호점_1280_r12.png");
    expect(pngFileName("  강남 카페/리브랜딩:2호점  ", 1280, 12, 2)).toBe("강남-카페-리브랜딩-2호점_1280_r12_구조포함.png");
    expect(pngFileName("???", 390, 3, 0)).toBe("page_390_r3.png");
    expect(pngFileName("con", 768, 1, 0)).toBe("page-con_768_r1.png");
    expect(pngFileName("가".repeat(41), 390, 1, 0)).toBe(`${"가".repeat(40)}_390_r1.png`);
    expect(pngFileName(`${"가".repeat(39)}😀😀`, 390, 1, 0)).toBe(`${"가".repeat(39)}😀_390_r1.png`);
  });
});

describe("캡처 흐름 (m2a 3.3 캡처 규칙)", () => {
  it("숨은 iframe 폭 = 지금 미리보기 폭(축소 비율 무시) · 높이 = 렌더 문서 사각형 바닥 · 그리기 = data: URL · 파일 이름 = 폭·revision·_구조포함 · iframe 닫음 · requestExport 경로 0", async () => {
    const { d, channel, draw, download } = deps(withFallback(), 2400);
    const made = await capturePng(REQUEST, d);
    expect(channel.opened).toEqual([24.375]);
    const render = channel.sent.find((m) => m.type === "render") as Extract<ParentMessage, { type: "render" }>;
    expect(render.doc).toBe(REQUEST.doc);
    expect(render.kitTokens).toBe(KIT);
    expect(channel.closed()).toBe(1);
    const [url, w, h] = draw.mock.calls[0]!;
    expect(url.startsWith("data:image/svg+xml")).toBe(true);
    expect([w, h]).toEqual([390, 2400]);
    expect(made).toMatchObject({ fileName: "강남-카페-리브랜딩-2호점_390_r12_구조포함.png", fallbackCount: 1 });
    expect(download).not.toHaveBeenCalled();
  });

  it("높이가 상한을 넘으면 CANVAS_TOO_TALL 실패(그리지 않음)", async () => {
    const { d, draw } = deps(noFallback(), MAX_CANVAS_HEIGHT + 1);
    await expect(capturePng({ ...REQUEST, view: "desktop" }, d)).rejects.toMatchObject({ code: "CANVAS_TOO_TALL" });
    expect(draw).not.toHaveBeenCalled();
  });

  it("렌더 문서가 답하지 않으면 RENDER_TIMEOUT · iframe 닫음", async () => {
    let closed = 0;
    const silent = (): RenderChannel => ({ listen: () => undefined, send: () => undefined, close: () => void closed++ });
    const { d } = deps(noFallback(), 1000, { open: silent, timeoutMs: 20 });
    await expect(capturePng(REQUEST, d)).rejects.toMatchObject({ code: "RENDER_TIMEOUT" });
    expect(closed).toBe(1);
  });
});

describe("내려받기 · 계측 (K-AC-34 · 3.3 계측 — 코드·개수·열거값만)", () => {
  it("성공 → 부모 <a download>로 내려받기 · 문장 'PNG를 내려받았습니다 · {파일 이름}' · png_requested(view) · png_succeeded(view, fallback_count) — 이름·파일 이름·슬롯 글자 0", async () => {
    const { d, download } = deps(withFallback(), 2400);
    const { events, stop } = listen();
    const text = await savePng(REQUEST, d);
    stop();
    expect(text).toBe("PNG를 내려받았습니다 · 강남-카페-리브랜딩-2호점_390_r12_구조포함.png");
    expect(download).toHaveBeenCalledTimes(1);
    expect(download.mock.calls[0]![1]).toBe("강남-카페-리브랜딩-2호점_390_r12_구조포함.png");
    expect(events).toEqual([
      { name: "png_requested", view: "mobile" },
      { name: "png_succeeded", view: "mobile", fallback_count: 1 },
    ]);
    const values = JSON.stringify(events);
    for (const secret of ["강남", "카페", "리브랜딩", ".png", ...Object.values(REQUEST.doc.sections[1]!.slots).filter((v): v is string => typeof v === "string")]) expect(values).not.toContain(secret);
  });

  it("실패 → png_failed(reason = 오류 코드) · 알 수 없는 오류 = INFRA · 사용자 글자 0", () => {
    const { events, stop } = listen();
    reportFailure(new PngError("CANVAS_TOO_TALL", "강남 카페 너무 김"));
    reportFailure(new Error("강남 카페"));
    stop();
    expect(events).toEqual([
      { name: "png_failed", reason: "CANVAS_TOO_TALL" },
      { name: "png_failed", reason: "INFRA" },
    ]);
  });

  it("기본 내려받기 = 부모 문서 <a download> 클릭 뒤 제거 · object URL 해제", async () => {
    vi.useFakeTimers();
    const created = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test/png");
    const revoked = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const clicks: { href: string; download: string }[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicks.push({ href: this.getAttribute("href")!, download: this.download });
    });
    const { downloadBlob } = await import("./pngCapture");
    downloadBlob(new Blob(["png"]), "a_390_r1.png");
    expect(clicks).toEqual([{ href: "blob:test/png", download: "a_390_r1.png" }]);
    expect(document.querySelectorAll("a[download]")).toHaveLength(0);
    vi.runAllTimers();
    expect(revoked).toHaveBeenCalledWith("blob:test/png");
    created.mockRestore();
    revoked.mockRestore();
    click.mockRestore();
    vi.useRealTimers();
  });
});
