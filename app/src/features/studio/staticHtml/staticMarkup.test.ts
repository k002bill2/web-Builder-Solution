import { sampleDoc } from "../../../engine/testing/sampleDoc";
import { drawDoc, without } from "../../../render/testing/drawKit";
import { STATIC_MENU_SCRIPT, buildStaticHtml } from "./staticMarkup";

/** 실제 렌더 문서 본문(PageDocument + 킷)을 그린 사이트 루트 마크업 — 렌더 문서 serializeSite가 보내는 것과 같은 모양 */
const siteMarkup = () => drawDoc(without(sampleDoc(), "cta-band")).querySelector("[data-site-root]")!.outerHTML;
const CSS = "[data-site-root]{color:var(--site-ink)}[data-kit]{display:block}";
const build = (over: Partial<Parameters<typeof buildStaticHtml>[0]> = {}) =>
  buildStaticHtml({ markup: siteMarkup(), css: CSS, title: "모던 카페", description: "스페셜티 커피", ...over });
const parse = (html: string) => new DOMParser().parseFromString(html, "text/html");

describe("정적 HTML 문서 조립 (M2A-3b G2·G3 · K-AC-06·08)", () => {
  it("완전한 문서 1개 — doctype · lang=ko · charset · viewport · title·description = 문서 SEO 메타 · 인라인 style(킷 CSS) · 사이트 루트(--site-* 변수)", () => {
    const html = build();
    expect(html.startsWith("<!doctype html>\n<html lang=\"ko\">")).toBe(true);
    const doc = parse(html);
    expect(doc.querySelector("meta[charset]")!.getAttribute("charset")).toBe("utf-8");
    expect(doc.querySelector('meta[name="viewport"]')!.getAttribute("content")).toBe("width=device-width, initial-scale=1");
    expect(doc.title).toBe("모던 카페");
    expect(doc.querySelector('meta[name="description"]')!.getAttribute("content")).toBe("스페셜티 커피");
    expect(doc.querySelectorAll("style")).toHaveLength(1);
    expect(doc.querySelector("style")!.textContent).toBe(CSS);
    const root = doc.body.firstElementChild!;
    expect(root.hasAttribute("data-site-root")).toBe(true);
    expect(root.getAttribute("style")).toContain("--site-");
    expect(doc.querySelectorAll("header, main, footer").length).toBeGreaterThanOrEqual(3);
  });

  it("사용자 글자는 DOM으로만 — 제목·설명의 <script>·따옴표는 글자로 남고 요소가 되지 않는다(스크립트 = 고정 1개 그대로)", () => {
    const doc = parse(build({ title: '</title><script>alert(1)</script>', description: '"><script>x</script>' }));
    expect([...doc.querySelectorAll("script")].map((s) => s.textContent)).toEqual([STATIC_MENU_SCRIPT]);
    expect(doc.title).toBe("</title><script>alert(1)</script>");
    expect(doc.querySelector('meta[name="description"]')!.getAttribute("content")).toBe('"><script>x</script>');
  });

  it("고정 스크립트(바이트 일치) 외 script 0 · on* 속성 0 · details[open] 0 · 편집기 흔적(data-instance-id·data-slot·data-section·data-cta) 0 — CSS가 쓰는 data-kit·data-layout·data-tone·data-always·data-site-root는 남긴다", () => {
    const dirty = siteMarkup()
      .replace("<details", '<details open ontoggle="x()"')
      .replace("</header>", '<script>alert(1)</script><img src="data:," onerror="x()" alt=""></header>');
    const doc = parse(build({ markup: dirty }));
    expect([...doc.querySelectorAll("script")].map((s) => s.textContent)).toEqual([STATIC_MENU_SCRIPT]);
    expect(doc.querySelectorAll("details[open]")).toHaveLength(0);
    expect(doc.querySelectorAll("details").length).toBeGreaterThan(0);
    const attrs = [...doc.querySelectorAll("*")].flatMap((el) => [...el.attributes].map((a) => a.name));
    expect(attrs.filter((a) => a.startsWith("on"))).toEqual([]);
    expect(attrs.filter((a) => a.startsWith("data-")).filter((a) => !["data-kit", "data-layout", "data-tone", "data-always", "data-site-root"].includes(a))).toEqual([]);
    expect(doc.querySelectorAll("[data-kit]").length).toBeGreaterThan(0);
    // 앵커 대상(id="s-…")·메뉴 시트(popover · popovertarget)는 남는다 — 정적 HTML의 앵커 이동·시트(K-AC-12)
    expect(doc.querySelectorAll('[id^="s-"]').length).toBeGreaterThan(0);
    expect(doc.querySelectorAll("[popover]").length).toBe(1);
    expect(doc.querySelectorAll("[popovertarget]").length).toBe(2);
  });

  it("K-AC-08 문의 폼 — form action 0 · 모든 input·textarea·button이 fieldset[disabled] 안 · 안내 문구 = fieldset aria-describedby 대상 · placeholder 0", () => {
    const doc = parse(build());
    const form = doc.querySelector("form")!;
    expect(form.hasAttribute("action")).toBe(false);
    const fieldset = form.querySelector("fieldset")!;
    expect(fieldset.hasAttribute("disabled")).toBe(true);
    const controls = [...form.querySelectorAll("input, textarea, button")];
    expect(controls.length).toBeGreaterThan(0);
    expect(controls.every((c) => c.closest("fieldset[disabled]") === fieldset)).toBe(true);
    const note = doc.getElementById(fieldset.getAttribute("aria-describedby")!);
    expect(note?.textContent?.length).toBeGreaterThan(0);
    expect(doc.querySelectorAll("[placeholder]")).toHaveLength(0);
  });

  it("폴백 섹션(구조 미리보기)이 있으면 실패 — 7단계가 막지만 생성기도 방어", () => {
    const withFallback = drawDoc(sampleDoc()).querySelector("[data-site-root]")!.outerHTML;
    expect(() => build({ markup: withFallback })).toThrow(/구조 미리보기/);
  });

  it("blob: URL이 남으면 실패 · CSS의 외부 요청(@import · data: 아닌 url())도 실패 — 외부 요청 0", () => {
    expect(() => build({ markup: siteMarkup().replace("</header>", '<img src="blob:null/1" alt=""></header>') })).toThrow(/blob:/);
    expect(() => build({ css: '@import "x.css";' })).toThrow(/외부/);
    expect(() => build({ css: ".a{background:url(https://x.test/a.png)}" })).toThrow(/외부/);
    expect(() => build({ css: ".a{background:url(data:image/png;base64,AA)}" })).not.toThrow();
  });

  it("P2-3 blob: 검사는 URL 속성만 — 본문·대체텍스트·title의 글자 \"blob:\"은 성공 · src·href·srcset·poster·style url(의 blob:은 실패", () => {
    const withText = siteMarkup().replace("</header>", '<p>blob: 글자</p><img src="data:image/png;base64,AA" alt="blob:은 글자" title="BLOB: x"></header>');
    const html = build({ markup: withText });
    expect(html).toContain("<p>blob: 글자</p>");
    expect(html).toContain('alt="blob:은 글자"');
    for (const bad of [
      '<img src="blob:null/1" alt="">',
      '<a href=" BLOB:null/1">x</a>',
      '<img srcset="a.png 1x, blob:null/1 2x" alt="">',
      '<video poster="blob:null/1"></video>',
      '<div style="background:url(&quot;blob:null/1&quot;)"></div>',
      '<div style="background: URL( blob:null/1 )"></div>',
    ])
      expect(() => build({ markup: siteMarkup().replace("</header>", `${bad}</header>`) }), bad).toThrow(/blob:/);
  });

  it("사이트 루트가 없는 마크업은 실패", () => {
    expect(() => build({ markup: "<p>x</p>" })).toThrow(/사이트 루트/);
  });
});

describe("고정 인라인 스크립트 — 메뉴 시트 안 앵커 → 시트 닫기 (2a-05 SPEC r4.12 · K-AC-12)", () => {
  const scripts = (html: string) => [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];

  it("문서마다 바이트 동일 — 결과 HTML에 `<script>{생성기 상수}</script>` 정확히 1개 · 속성 0(src·type·on* 없음) · 외부 요청 0", () => {
    const a = build();
    const b = build({ title: "다른 가게", description: "다른 설명", markup: drawDoc(without(without(sampleDoc(), "cta-band"), "about")).querySelector("[data-site-root]")!.outerHTML });
    expect(a).not.toBe(b);
    for (const html of [a, b]) {
      const found = scripts(html);
      expect(found).toHaveLength(1);
      expect(found[0]![0]).toBe(`<script>${STATIC_MENU_SCRIPT}</script>`);
    }
    expect(STATIC_MENU_SCRIPT).not.toMatch(/fetch|XMLHttpRequest|import|src=|https?:|location|innerHTML|eval/);
  });

  it("사용자 글자(제목·설명·슬롯 마크업)에 </script>·<script>가 있어도 스크립트는 1개 그대로 · 사용자 글자가 스크립트에 들어가지 않는다", () => {
    const evil = "</script><script>alert(1)</script>";
    const markup = siteMarkup().replace("</h1>", `${evil.replace(/</g, "&lt;")}</h1>`);
    const html = build({ title: evil, description: evil, markup });
    // 문자열 검색은 속성값 안의 글자 "<script>"도 잡으므로 파서로 센다(속성값·제목은 글자일 뿐 요소가 아니다)
    expect([...parse(html).querySelectorAll("script")].map((el) => el.textContent)).toEqual([STATIC_MENU_SCRIPT]);
    expect(html.split(`<script>${STATIC_MENU_SCRIPT}</script>`)).toHaveLength(2);
  });

  it("동작 — [popover] 안 a[href^=\"#\"] 누름 → 그 시트 hidePopover() · 시트 밖 앵커·외부 링크 → 아무것도 안 함 · hidePopover 없으면 아무것도 안 함(오류 0)", () => {
    const page = document.implementation.createHTMLDocument("");
    page.body.innerHTML =
      '<div popover id="sheet"><a href="#s-contact-1" id="in">문의</a><a href="https://x.test" id="ext">밖</a></div><a href="#s-hero-1" id="out">처음</a><div popover id="bare"><a href="#s-a" id="bare-a"><span id="deep">글</span></a></div>';
    const hide = vi.fn();
    Object.defineProperty(page.getElementById("sheet")!, "hidePopover", { value: hide });
    Object.defineProperty(page.getElementById("bare")!, "hidePopover", { value: undefined }); // 기능 감지 — 없는 브라우저
    new Function("document", STATIC_MENU_SCRIPT)(page);
    const click = (id: string) => page.getElementById(id)!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(click("out")).toBe(true);
    expect(click("ext")).toBe(true);
    expect(hide).not.toHaveBeenCalled();
    expect(click("in")).toBe(true); // 기본 동작(앵커 이동)을 막지 않는다
    expect(hide).toHaveBeenCalledTimes(1);
    expect(() => click("deep")).not.toThrow();
  });
});
