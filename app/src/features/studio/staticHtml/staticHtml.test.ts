import type { StudioReader } from "../../../data/studioStore";
import type { PageDoc } from "../../../engine/contracts/pageDoc";
import { sampleDoc } from "../../../engine/testing/sampleDoc";
import { sampleTheme } from "../../../engine/testing/sampleTheme";
import type { ParentMessage } from "../../../render/protocol";
import { drawDoc, withUnknownCta, without } from "../../../render/testing/drawKit";
import { createStaticHtmlGenerator, openRenderFrame, type RenderChannel } from "./staticHtml";
import { FONT_FAILED } from "./siteFontEmbed";
import { STATIC_MENU_SCRIPT } from "./staticMarkup";

/** M2A-3b G3 — 정적 HTML 생성기: 잡의 스냅샷 문서를 숨은 렌더 iframe에 그려 직렬화 · 킷 CSS 인라인 · Blob object URL · SHA-256 앞 12자리 */
const PROFILE = sampleTheme().profile;
const DOC: PageDoc = { ...without(sampleDoc(), "cta-band"), profileVersion: PROFILE.version, meta: { title: "모던 카페", description: "스페셜티 커피" } };
const MARKUP = drawDoc(DOC).querySelector("[data-site-root]")!.outerHTML;
const STORE = {
  projects: () => [{ projectId: "project-1", profileId: "profile-1" }],
  versions: (id: string) => (id === "profile-1" ? [PROFILE] : []),
} as unknown as StudioReader;
const FILES: Readonly<Record<string, string>> = {
  "/render.html": '<!doctype html><html><head><script type="module" src="/assets/render.js"></script><link rel="stylesheet" crossorigin href="/assets/render.css"></head><body></body></html>',
  "/assets/render.css":
    '[data-site-root]{color:var(--site-ink)}@font-face{font-family:"Pretendard";font-weight:400;font-display:swap;src:url(/assets/P-400.woff2) format("woff2")}@font-face{font-family:"Pretendard";font-weight:700;font-display:swap;src:url(/assets/P-700.woff2) format("woff2")}',
};
/** M2B-4a — 킷 CSS의 @font-face url → 글꼴 바이트(가짜). 기존 테스트는 이 주입만 더했다(단언 변경 0) */
const fetchBytes = async (url: string) => new TextEncoder().encode(`woff2:${url}`).buffer as ArrayBuffer;
const fetchText = async (url: string) => {
  const text = FILES[url];
  if (text === undefined) throw new Error(`404 ${url}`);
  return text;
};

/** 가짜 렌더 문서 — ready → render 받으면 rects → serialize 받으면 html (reply로 바꿀 수 있다) */
function fakeFrame(reply: (message: ParentMessage, post: (data: unknown) => void) => void = (m, post) => post(m.type === "render" ? { type: "rects", rects: [] } : { type: "html", markup: MARKUP })) {
  const sent: ParentMessage[] = [];
  let closed = 0;
  let receive: (data: unknown) => void = () => {};
  const open = (): RenderChannel => ({
    send: (message) => {
      sent.push(message);
      queueMicrotask(() => reply(message, receive));
    },
    listen: (fn) => {
      receive = fn;
      queueMicrotask(() => fn({ type: "ready" }));
    },
    close: () => void closed++,
  });
  return { open, sent, closed: () => closed };
}
function fakeUrls() {
  const blobs: Blob[] = [];
  const revoked: string[] = [];
  return { blobs, revoked, api: { createObjectURL: (b: Blob) => (blobs.push(b), `blob:test/${blobs.length}`), revokeObjectURL: (u: string) => void revoked.push(u) } };
}
const sha12 = async (blob: Blob) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()))].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 12);
const input = { projectId: "project-1", format: "static-html" as const, doc: DOC };

describe("정적 HTML 생성기 (G3)", () => {
  it("ready → render{잡 문서, 킷 토큰} → rects 뒤 serialize → html → 문서 1개 · Blob text/html;charset=utf-8 · 해시 = 결과 바이트 SHA-256 앞 12자리 · iframe 닫음", async () => {
    const frame = fakeFrame();
    const urls = fakeUrls();
    const made = await createStaticHtmlGenerator(STORE, { open: frame.open, fetchText, fetchBytes, urls: urls.api })(input);
    expect(frame.sent.map((m) => m.type)).toEqual(["render", "serialize"]);
    const render = frame.sent[0] as Extract<ParentMessage, { type: "render" }>;
    expect(render.doc).toBe(DOC);
    expect(render.kitTokens?.palette.primary).toBeTruthy();
    expect(frame.closed()).toBe(1);
    expect(made.downloadRef).toBe("blob:test/1");
    const blob = urls.blobs[0]!;
    expect(blob.type).toBe("text/html;charset=utf-8");
    expect(made.resultHash).toMatch(/^[0-9a-f]{12}$/);
    expect(made.resultHash).toBe(await sha12(blob));
    const html = await blob.text();
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("<title>모던 카페</title>");
    expect(html).toContain("[data-site-root]{color:var(--site-ink)}");
    // 2a-05 r4.12 — 스크립트는 생성기 고정 인라인 1개뿐(src 0) · link 0
    expect(html).not.toMatch(/<link|<script\s+[^>]*src/);
    expect([...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[0])).toEqual([`<script>${STATIC_MENU_SCRIPT}</script>`]);
  });

  it("같은 문서 두 번 → 같은 해시(결정적) · 같은 프로젝트 재생성이면 이전 object URL 해제 · release(projectId) = 편집기 이탈 해제", async () => {
    const urls = fakeUrls();
    const generate = createStaticHtmlGenerator(STORE, { open: fakeFrame().open, fetchText, fetchBytes, urls: urls.api });
    const first = await generate(input);
    const second = await generate(input);
    expect(second.resultHash).toBe(first.resultHash);
    expect(urls.revoked).toEqual([first.downloadRef]);
    generate.release("project-1");
    expect(urls.revoked).toEqual([first.downloadRef, second.downloadRef]);
  });

  it("P2-1 새 revision 결과 → 같은 프로젝트의 이전 URL 해제 정확히 1회 · 새 revision 생성이 실패하면 이전 URL 유지", async () => {
    const urls = fakeUrls();
    let fail = false;
    const frame = fakeFrame((m, post) => (fail ? undefined : post(m.type === "render" ? { type: "rects", rects: [] } : { type: "html", markup: MARKUP })));
    const generate = createStaticHtmlGenerator(STORE, { open: frame.open, fetchText, fetchBytes, urls: urls.api, timeoutMs: 30 });
    const first = await generate(input);
    expect(urls.revoked).toEqual([]);
    fail = true;
    await expect(generate({ ...input, doc: { ...DOC, revision: DOC.revision + 1 } })).rejects.toMatchObject({ code: "JOB_TIMEOUT" });
    expect(urls.revoked).toEqual([]);
    fail = false;
    const next = await generate({ ...input, doc: { ...DOC, revision: DOC.revision + 1 } });
    expect(urls.revoked).toEqual([first.downloadRef]);
    expect(next.downloadRef).not.toBe(first.downloadRef);
  });

  it("렌더 문서가 답하지 않으면 JOB_TIMEOUT(재시도 가능) · iframe 닫음", async () => {
    const frame = fakeFrame(() => {});
    const failed = createStaticHtmlGenerator(STORE, { open: frame.open, fetchText, fetchBytes, urls: fakeUrls().api, timeoutMs: 30 })(input);
    await expect(failed).rejects.toMatchObject({ code: "JOB_TIMEOUT" });
    expect(frame.closed()).toBe(1);
  });

  it.each([
    ["렌더 오류 INVALID_DOC", (m: ParentMessage, post: (d: unknown) => void) => post(m.type === "render" ? { type: "error", code: "INVALID_DOC" } : {})],
    // P2-b — PNG 경로만 NO_KIT_TOKENS를 넘긴다. 정적 HTML은 그대로 실패(킷 없이 그린 폴백 문서를 내보내지 않는다)
    ["렌더 오류 NO_KIT_TOKENS", (m: ParentMessage, post: (d: unknown) => void) => post(m.type === "render" ? { type: "error", code: "NO_KIT_TOKENS" } : { type: "html", markup: MARKUP })],
    ["폴백이 섞인 마크업", (m: ParentMessage, post: (d: unknown) => void) => post(m.type === "render" ? { type: "rects", rects: [] } : { type: "html", markup: drawDoc(withUnknownCta()).querySelector("[data-site-root]")!.outerHTML })], // M2B-2c 이관: 폴백 예시 = cta-band 자리 no-such-variant
  ])("%s → INFRA로 기록될 실패(JOB_TIMEOUT 아님) · iframe 닫음", async (_name, reply) => {
    const frame = fakeFrame(reply);
    const failed = createStaticHtmlGenerator(STORE, { open: frame.open, fetchText, fetchBytes, urls: fakeUrls().api })(input);
    await expect(failed).rejects.toThrow();
    await expect(failed).rejects.not.toMatchObject({ code: "JOB_TIMEOUT" });
    expect(frame.closed()).toBe(1);
  });

  it("render.html에 스타일시트가 없으면(킷 CSS 0) 실패 · 킷 토큰을 만들 수 없는 문서(프로필 버전 없음)도 실패 — 렌더 문서를 열지 않는다", async () => {
    const frame = fakeFrame();
    const noCss = createStaticHtmlGenerator(STORE, { open: frame.open, fetchText: async () => "<html><head></head></html>", fetchBytes, urls: fakeUrls().api });
    await expect(noCss(input)).rejects.toThrow(/스타일시트/);
    const noTokens = createStaticHtmlGenerator(STORE, { open: frame.open, fetchText, fetchBytes, urls: fakeUrls().api });
    await expect(noTokens({ ...input, doc: { ...DOC, profileVersion: 99 } })).rejects.toThrow(/킷 토큰/);
    expect(frame.sent).toEqual([]);
  });
});

describe("정적 HTML 글꼴 (M2B-4a SPEC 2.4 · MF-AC-U7·G4·B9)", () => {
  it("킷 CSS의 @font-face(url) 제거 → 쓰는 면만 data: 인라인 · 고지 주석(OFL 전문) · 렌더 문서에도 같은 바이트(측정 글꼴 = 결과 글꼴)", async () => {
    const frame = fakeFrame();
    const urls = fakeUrls();
    await createStaticHtmlGenerator(STORE, { open: frame.open, fetchText, fetchBytes, urls: urls.api })(input);
    const render = frame.sent[0] as Extract<ParentMessage, { type: "render" }>;
    expect(render.fonts?.map((f) => [f.family, f.weight, new TextDecoder().decode(f.data)])).toEqual([
      ["Pretendard", 700, "woff2:/assets/P-700.woff2"],
      ["Pretendard", 400, "woff2:/assets/P-400.woff2"],
    ]);
    const html = await urls.blobs[0]!.text();
    expect(html.match(/url\(data:font\/woff2;base64,/g)).toHaveLength(2);
    expect(html).not.toMatch(/\/assets\/P-|local\(/);
    const page = new DOMParser().parseFromString(html, "text/html");
    const comments = [...page.head.childNodes].filter((n) => n.nodeType === Node.COMMENT_NODE);
    expect(comments).toHaveLength(1);
    expect(comments[0]!.textContent).toContain("Copyright (c) 2021, Kil Hyung-jin");
    expect(comments[0]!.textContent).toContain("SIL OPEN FONT LICENSE Version 1.1");
  });

  it("글꼴 받기 실패·상한 넘김 → JOB_TIMEOUT(재시도 가능) · 문구 '글꼴을 불러오지 못했습니다' · 렌더 문서 열지 않음 · 결과 파일(object URL) 0", async () => {
    const frame = fakeFrame();
    const urls = fakeUrls();
    const failed = createStaticHtmlGenerator(STORE, { open: frame.open, fetchText, fetchBytes: () => new Promise<ArrayBuffer>(() => undefined), urls: urls.api, fontTimeoutMs: 30 })(input);
    await expect(failed).rejects.toMatchObject({ code: "JOB_TIMEOUT", message: expect.stringContaining(FONT_FAILED) });
    expect(frame.sent).toEqual([]);
    expect(urls.blobs).toEqual([]);
  });
});

describe("숨은 렌더 iframe (openRenderFrame)", () => {
  it("sandbox = allow-scripts 그대로(allow-same-origin 0) · /render.html · 화면 밖 · 접근성 트리 밖 · 그 iframe에서 온 메시지만 · close = 제거", () => {
    const channel = openRenderFrame();
    const frame = document.querySelector<HTMLIFrameElement>("iframe[data-export-frame]")!;
    expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
    expect(frame.getAttribute("src")).toBe("/render.html");
    expect(frame.getAttribute("aria-hidden")).toBe("true");
    expect(frame.tabIndex).toBe(-1);
    const got: unknown[] = [];
    channel.listen((data) => got.push(data));
    window.dispatchEvent(new MessageEvent("message", { data: { type: "ready" }, source: window }));
    window.dispatchEvent(new MessageEvent("message", { data: { type: "ready" }, source: frame.contentWindow }));
    expect(got).toEqual([{ type: "ready" }]);
    channel.close();
    expect(document.querySelector("iframe[data-export-frame]")).toBeNull();
    window.dispatchEvent(new MessageEvent("message", { data: { type: "ready" }, source: frame.contentWindow }));
    expect(got).toHaveLength(1);
  });
});
