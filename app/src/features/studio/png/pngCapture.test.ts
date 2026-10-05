import { render } from "@testing-library/react";
import { createElement } from "react";
import { sampleDoc } from "../../../engine/testing/sampleDoc";
import { PageDocument } from "../../../render/PageDocument";
import type { ParentMessage } from "../../../render/protocol";
import { drawDoc, withUnknownCta, without } from "../../../render/testing/drawKit";
import { EDITOR_EVENT, type EditorEvent } from "../editorEvents";
import type { RenderChannel } from "../staticHtml/staticHtml";
import { MAX_CANVAS_HEIGHT, PngError, buildCaptureSvg, capturePng, pngFileName, reportFailure, savePng, svgDataUrl, type PngDeps, type PngRequest } from "./pngCapture";

const KIT = { palette: { primary: "#111111", surface: "#eeeeee", ink: "#000000", muted: "#555555", bg: "#ffffff" }, card: { tone: "light", style: "flat" }, type: { family: "system-ui", headingWeight: 700, bodyWeight: 400, scale: 1.2 }, space: { grid: 8, sectionGap: 64, density: "comfortable" }, mediaRatio: "4:5" } as const;
const CSS = '[data-kit-marker="fallback"]{color:red}a>b{x:1}.c::after{content:"<&>"}';
/** 폴백 1개(CTA Band 자리 — M2B-2c 이관: no-such-variant) 포함 사이트 루트 — 렌더 문서 serialize가 보내는 모양 */
const withFallback = () => drawDoc(withUnknownCta()).querySelector("[data-site-root]")!.outerHTML;
const noFallback = () => drawDoc(without(sampleDoc(), "cta-band")).querySelector("[data-site-root]")!.outerHTML;
const parseSvg = (svg: string) => new DOMParser().parseFromString(svg, "image/svg+xml");
const REQUEST: PngRequest = { doc: sampleDoc(), kitTokens: KIT, view: "mobile", name: "  강남 카페/리브랜딩:2호점  ", revision: 12 };

/** 숨은 렌더 iframe 흉내 — ready → render → rects(바닥 = bottom) → serialize → html */
function fakeChannel(markup: string, bottom = 2400, renderError?: "NO_KIT_TOKENS" | "INVALID_DOC") {
  const opened: number[] = [];
  const sent: ParentMessage[] = [];
  let closed = 0;
  const open = (widthRem: number): RenderChannel => {
    opened.push(widthRem);
    // 렌더 문서는 그 iframe 폭(rem × 지금 루트 px)으로 배치한다
    const w = widthRem * (Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
    let receive: (data: unknown) => void = () => undefined;
    return {
      listen: (r) => {
        receive = r;
        queueMicrotask(() => receive({ type: "ready" }));
      },
      send: (message) => {
        sent.push(message);
        // 렌더 문서는 레이아웃 전 0 크기 사각형을 먼저 보낼 수 있다(M2A-3c C4 실측) → 그다음 실제 크기
        if (message.type === "render")
          queueMicrotask(() => {
            if (renderError) receive({ type: "error", code: renderError });
            receive({ type: "rects", rects: [["s-header", null, 0, 0, 0, 0], ["s-hero", null, 0, 0, 0, 0]] });
            receive({ type: "rects", rects: [["s-header", null, 0, 0, w, 60], ["s-hero", null, 0, 60, w, bottom - 60], ["s-hero", "title", 8, 80, 300, 40]] });
          });
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
    // M2B-4b 이관: 킷 CSS 원문 + 줄바꿈 + 모션 정지 방어 규칙(SPEC 1.3 · MF-AC-U5) — 정확 일치 유지
    expect(doc.getElementsByTagName("style")[0]!.textContent).toBe(`${CSS}\n[data-site-root] *, [data-site-root] *::before, [data-site-root] *::after { animation: none !important; transition: none !important; }`);
    expect(doc.querySelectorAll("[data-site-root]")).toHaveLength(1);
    expect(doc.getElementsByTagName("script")).toHaveLength(0);
    expect(doc.getElementsByTagName("iframe")).toHaveLength(0);
    expect(doc.querySelectorAll("details[open]")).toHaveLength(0);
    const attrs = [...doc.querySelectorAll("*")].flatMap((el) => [...el.attributes].map((a) => a.name));
    expect(attrs.filter((a) => a.startsWith("on"))).toEqual([]);
  });

  it("U5 모션: 캡처 style 끝 = 모션 정지 방어 규칙 · data-motion-play 0(마크업에 있어도 지움) · data-motion은 남음", () => {
    const markup = drawDoc(sampleDoc()).querySelector("[data-site-root]")!.outerHTML.replace("<div data-site-root", '<div data-motion-play="" data-site-root');
    expect(markup).toContain("data-motion-play");
    const svg = buildCaptureSvg({ markup, css: CSS, width: 1280, height: 3000 });
    const page = new DOMParser().parseFromString(svg, "image/svg+xml");
    const style = page.getElementsByTagName("style")[0]!.textContent!;
    expect(style.startsWith(CSS)).toBe(true);
    expect(style.trimEnd().endsWith("[data-site-root] *, [data-site-root] *::before, [data-site-root] *::after { animation: none !important; transition: none !important; }")).toBe(true);
    expect(svg).not.toContain("data-motion-play");
    expect(svg).toContain('data-motion="L1"');
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

  it("P2-b 킷 토큰 없음(프로필 조회 실패) → 렌더 문서 NO_KIT_TOKENS를 실패로 보지 않고 폴백 rects·직렬화를 기다림 → PNG 성공 · fallback_count = 섹션 수 · 파일 이름 _구조포함", async () => {
    const doc = sampleDoc();
    const markup = render(createElement(PageDocument, { doc, images: {} })).container.querySelector("[data-site-root]")!.outerHTML;
    const channel = fakeChannel(markup, 2400, "NO_KIT_TOKENS");
    const { d, draw } = deps(markup, 2400, { open: channel.open });
    const request: PngRequest = { doc, view: REQUEST.view, name: REQUEST.name, revision: REQUEST.revision };
    const { events, stop } = listen();
    const done = await savePng(request, d);
    stop();
    const sent = channel.sent.find((m) => m.type === "render") as Extract<ParentMessage, { type: "render" }>;
    expect(sent.kitTokens).toBeUndefined();
    expect(channel.sent.map((m) => m.type)).toEqual(["render", "serialize"]);
    expect(draw).toHaveBeenCalledTimes(1);
    expect(done).toBe("PNG를 내려받았습니다 · 강남-카페-리브랜딩-2호점_390_r12_구조포함.png");
    expect(events.find((e) => e.name === "png_succeeded")).toEqual({ name: "png_succeeded", view: "mobile", fallback_count: doc.sections.length });
  });

  it("P2-b PNG도 INVALID_DOC는 그대로 실패(그리지 않음)", async () => {
    const channel = fakeChannel(noFallback(), 2400, "INVALID_DOC");
    const { d, draw } = deps(noFallback(), 2400, { open: channel.open });
    await expect(capturePng(REQUEST, d)).rejects.toThrow(/INVALID_DOC/);
    expect(draw).not.toHaveBeenCalled();
  });

  it("P2-c 루트 글꼴 20px에서 390 프레임 → iframe 폭(rem × 실제 rem px) = SVG·캔버스 폭 · 높이 = iframe 사각형 바닥 · 파일 이름 폭 = 프레임 이름(390)", async () => {
    document.documentElement.style.fontSize = "20px";
    try {
      const { d, channel, draw } = deps(noFallback(), 2400);
      const made = await capturePng(REQUEST, d);
      const iframePx = channel.opened[0]! * 20;
      const [url, w, h] = draw.mock.calls[0]!;
      expect(iframePx).toBe(488); // 24.375rem × 20 = 487.5 → 정수 px(캔버스 폭)로 맞춘 iframe
      expect([w, h]).toEqual([iframePx, 2400]);
      const svg = parseSvg(decodeURIComponent(url.slice(url.indexOf(",") + 1))).documentElement;
      expect([svg.getAttribute("width"), svg.getAttribute("height")]).toEqual([String(iframePx), "2400"]);
      expect(svg.querySelector("foreignObject")!.firstElementChild!.getAttribute("style")).toBe(`width:${iframePx}px`);
      expect(made.fileName).toBe("강남-카페-리브랜딩-2호점_390_r12.png");
    } finally {
      document.documentElement.style.fontSize = "";
    }
  });

  it("높이가 상한을 넘으면 CANVAS_TOO_TALL 실패(그리지 않음)", async () => {
    const { d, draw } = deps(noFallback(), MAX_CANVAS_HEIGHT + 1);
    await expect(capturePng({ ...REQUEST, view: "desktop" }, d)).rejects.toMatchObject({ code: "CANVAS_TOO_TALL" });
    expect(draw).not.toHaveBeenCalled();
  });

  /** 렌더 문서 흉내 — ready 뒤 render를 받으면 주어진 rects 보고를 차례로 보낸다 */
  const reporting = (reports: readonly (readonly (readonly [number, number])[])[]) => (): RenderChannel => {
    let receive: (data: unknown) => void = () => undefined;
    return {
      listen: (r) => {
        receive = r;
        queueMicrotask(() => receive({ type: "ready" }));
      },
      send: (message) => {
        if (message.type === "render") for (const sections of reports) queueMicrotask(() => receive({ type: "rects", rects: sections.map(([w, h], i) => [`s-${i}`, null, 0, i === 0 ? 0 : 60, w, h]) }));
        if (message.type === "serialize") queueMicrotask(() => receive({ type: "html", markup: noFallback() }));
      },
      close: () => undefined,
    };
  };

  it("D-1 iframe 뷰포트가 캡처 폭이 되기 전(좁은 폭) 배치를 보고하면 그 높이를 쓰지 않고 캡처 폭 배치의 rects를 기다린다 — 높이 = 최종 바닥", async () => {
    // 폭 16px 배치 = 바닥 8313(> 0) → 1280 배치 = 3479 (M2B-D1 실측 logs/width-heights*.txt)
    const { d, draw } = deps(noFallback(), 2400, { open: reporting([[[16, 60], [16, 8253]], [[1280, 60], [1280, 3419]]]) });
    await capturePng({ ...REQUEST, view: "desktop" }, d);
    expect(draw.mock.calls[0]!.slice(1)).toEqual([1280, 3479]);
  });

  it("D-1 캡처 폭 배치 rects가 끝내 오지 않으면 RENDER_TIMEOUT(좁은 폭 높이로 그리지 않음)", async () => {
    const { d, draw } = deps(noFallback(), 2400, { open: reporting([[[16, 60], [16, 8253]]]), timeoutMs: 20 });
    await expect(capturePng({ ...REQUEST, view: "desktop" }, d)).rejects.toMatchObject({ code: "RENDER_TIMEOUT" });
    expect(draw).not.toHaveBeenCalled();
  });

  it("D-1 상한 넘는 문서는 세로 스크롤바로 폭이 줄어도(1280 → 1265) 그대로 CANVAS_TOO_TALL(실패 정책 불변)", async () => {
    const { d, draw } = deps(noFallback(), 2400, { open: reporting([[[1265, 60], [1265, MAX_CANVAS_HEIGHT]]]), timeoutMs: 200 });
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

describe("캡처용 렌더 iframe (openCaptureFrame — M2A-3c C4 실측)", () => {
  it("Chrome은 화면 밖·visibility:hidden 교차 출처 iframe을 배치하지 않는다(사각형 0) → 화면 안 · 투명 · 누름 통과 · 높이 = 캔버스 상한(스크롤바로 폭이 줄지 않게) · sandbox allow-scripts 그대로 · 접근성 트리 밖", async () => {
    const { openCaptureFrame } = await import("../staticHtml/staticHtml");
    const channel = openCaptureFrame(24.375);
    const frame = document.querySelector<HTMLIFrameElement>("iframe[data-export-frame]")!;
    expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
    expect(frame.getAttribute("aria-hidden")).toBe("true");
    expect(frame.tabIndex).toBe(-1);
    expect(frame.style.width).toBe("24.375rem");
    expect(frame.style.height).toBe(`${MAX_CANVAS_HEIGHT / 16}rem`);
    expect([frame.style.left, frame.style.top, frame.style.opacity, frame.style.pointerEvents, frame.style.visibility]).toEqual(["0px", "0px", "0", "none", ""]);
    channel.close();
    expect(document.querySelector("iframe[data-export-frame]")).toBeNull();
  });
});

describe("PNG 글꼴 (M2B-4a SPEC 2.4 · MF-AC-U7·B9)", () => {
  const FONT_CSS = 'a{x:1}@font-face{font-family:"Kit Sans KR";font-weight:400;font-display:swap;src:url(/assets/S-400.woff2) format("woff2")}@font-face{font-family:"Kit Sans KR";font-weight:700;font-display:swap;src:url(/assets/S-700.woff2) format("woff2")}';
  const SANS = { ...REQUEST, kitTokens: { ...KIT, type: { ...KIT.type, family: "Noto Sans KR" } } } as PngRequest;
  const fetchText = async (url: string) => (url === "/render.html" ? '<link rel="stylesheet" href="/assets/render.css">' : FONT_CSS);

  it("캡처 SVG <style> = 킷 @font-face(url) 제거 + 쓰는 면 data: 규칙 · url(/assets) 0 · 렌더 문서에도 같은 바이트", async () => {
    const fetchBytes = vi.fn(async (url: string) => new TextEncoder().encode(`wOF2${url}`).buffer as ArrayBuffer);
    const { d, channel, draw } = deps(noFallback(), 2400, { fetchText, fetchBytes });
    await capturePng(SANS, d);
    expect(fetchBytes.mock.calls.map((c) => c[0])).toEqual(["/assets/S-700.woff2", "/assets/S-400.woff2"]);
    const render = channel.sent.find((m) => m.type === "render") as Extract<ParentMessage, { type: "render" }>;
    expect(render.fonts?.map((f) => [f.family, f.weight])).toEqual([["Kit Sans KR", 700], ["Kit Sans KR", 400]]);
    const svg = decodeURIComponent(draw.mock.calls[0]![0].replace("data:image/svg+xml;charset=utf-8,", ""));
    const style = parseSvg(svg).getElementsByTagName("style")[0]!.textContent!;
    expect(style.match(/@font-face/g)).toHaveLength(2);
    expect(style).toMatch(/font-family:\s*"Kit Sans KR"[^}]*url\(data:font\/woff2;base64,/);
    expect(style).not.toMatch(/\/assets\//);
  });

  it("글꼴 받기 실패·5초 넘김 → RENDER_TIMEOUT · 문구 '글꼴을 불러오지 못했습니다' · 그리기·내려받기 0 · 렌더 문서 열지 않음", async () => {
    const { d, channel, draw, download } = deps(noFallback(), 2400, { fetchText, fetchBytes: () => new Promise<ArrayBuffer>(() => undefined), fontTimeoutMs: 20 });
    await expect(savePng(SANS, d)).rejects.toMatchObject({ code: "RENDER_TIMEOUT", message: "글꼴을 불러오지 못했습니다 — 다시 시도하세요" });
    expect(draw).not.toHaveBeenCalled();
    expect(download).not.toHaveBeenCalled();
    expect(channel.opened).toEqual([]);
  });

  it("이미지 포함 문서(D-1 결정성 · IMG-AC-26b) — render{images, loading \"eager\"} · 같은 입력 5회 같은 높이 · fallbackCount에 잃은 이미지 안 더함 · 성공 문장에만 잃은 이미지 문장", async () => {
    const ID = "11111111-1111-4111-8111-111111111111";
    const LOST = "22222222-2222-4222-8222-222222222222";
    const slot = (key: string, id: string, s: PngRequest["doc"]["sections"][number]) => ({ ...s, slots: { ...s.slots, [key]: { ...(s.slots[key] as object), source: id } } });
    const doc = { ...REQUEST.doc, sections: REQUEST.doc.sections.map((s) => (s.type === "hero" ? slot("image", ID, s) : s.type === "about" ? slot("image", LOST, s) : s)) } as PngRequest["doc"];
    const image = { blob: new Blob(["webp"], { type: "image/webp" }), width: 800, height: 600 };
    const heights: number[] = [];
    for (let i = 0; i < 5; i++) {
      const { d, channel, draw } = deps(noFallback(), 2400);
      const made = await capturePng({ ...REQUEST, doc, images: { [ID]: image } }, d);
      const render = channel.sent[0] as Extract<ParentMessage, { type: "render" }>;
      expect(render.loading).toBe("eager");
      expect(render.images).toEqual({ [ID]: image });
      expect(made.fallbackCount).toBe(0);
      expect(made.lost).toBe(1);
      heights.push(draw.mock.calls[0]![2]);
    }
    expect(new Set(heights)).toEqual(new Set([2400]));
    const { d } = deps(noFallback(), 2400);
    expect(await savePng({ ...REQUEST, doc, images: { [ID]: image } }, d)).toMatch(/\.png · 이미지 1장을 다시 골라야 해 자체 그래픽으로 넣었습니다$/);
  });

  it("렌더 문서 decode 실패(error IMAGE_DECODE_FAILED) → PngError IMAGE_DECODE_FAILED '이미지를 그리지 못했습니다' · 그리지 않음", async () => {
    const { d, draw } = deps(noFallback(), 2400, {});
    const failing: PngDeps = {
      ...d,
      open: (rem) => {
        const channel = d.open(rem);
        return { ...channel, listen: (r) => channel.listen((data) => r((data as { type?: string }).type === "rects" ? { type: "error", code: "IMAGE_DECODE_FAILED" } : data)) };
      },
    };
    await expect(capturePng(REQUEST, failing)).rejects.toMatchObject({ name: "PngError", code: "IMAGE_DECODE_FAILED", message: "이미지를 그리지 못했습니다" });
    expect(draw).not.toHaveBeenCalled();
  });
});
