import { sampleDoc } from "../../../engine/testing/sampleDoc";
import { drawDoc, withUnknownCta, without } from "../../../render/testing/drawKit";
import { STATIC_MENU_SCRIPT, buildStaticHtml } from "./staticMarkup";

/** 실제 렌더 문서 본문(PageDocument + 킷)을 그린 사이트 루트 마크업 — 렌더 문서 serializeSite가 보내는 것과 같은 모양 */
const siteMarkup = () => drawDoc(without(sampleDoc(), "cta-band")).querySelector("[data-site-root]")!.outerHTML;
const CSS = "[data-site-root]{color:var(--site-ink)}[data-kit]{display:block}";
const build = (over: Partial<Parameters<typeof buildStaticHtml>[0]> = {}) =>
  buildStaticHtml({ markup: siteMarkup(), css: CSS, title: "모던 카페", description: "스페셜티 커피", ...over });
const parse = (html: string) => new DOMParser().parseFromString(html, "text/html");

describe("정적 HTML 문서 조립 (M2A-3b G2·G3 · K-AC-06·08)", () => {
  it("U4 모션: 사이트 루트에만 data-motion-play 1개 · 섹션 data-motion = 렌더 문서 값 그대로 · 스크립트 = STATIC_MENU_SCRIPT 1개(바이트 동일)", () => {
    const rendered = new DOMParser().parseFromString(siteMarkup(), "text/html");
    const expected = [...rendered.querySelectorAll("[data-kit]")].map((el) => [el.id, el.getAttribute("data-motion")]);
    expect(expected.some(([, m]) => m !== null)).toBe(true);
    expect(rendered.querySelectorAll("[data-motion-play]")).toHaveLength(0);
    const doc = parse(build());
    expect([...doc.querySelectorAll("[data-motion-play]")]).toEqual([doc.querySelector("[data-site-root]")]);
    expect([...doc.querySelectorAll("[data-kit]")].map((el) => [el.id, el.getAttribute("data-motion")])).toEqual(expected);
    expect([...doc.querySelectorAll("script")].map((el) => el.textContent)).toEqual([STATIC_MENU_SCRIPT]);
  });

  it("U4 모션: 마크업 안쪽에 들어온 data-motion-play는 지운다 — 재생 스위치는 생성기가 사이트 루트에만 붙인다", () => {
    const dirty = siteMarkup().replace("<header", '<header data-motion-play=""').replace("<main", '<main data-motion-play=""');
    expect(dirty.split("data-motion-play").length).toBe(3);
    const doc = parse(build({ markup: dirty }));
    expect(doc.querySelectorAll("[data-motion-play]")).toHaveLength(1);
    expect(doc.querySelector("[data-site-root]")!.hasAttribute("data-motion-play")).toBe(true);
  });

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
      .replace("</header>", '<script>alert(1)</script><img src="data:image/png;base64,AA" onerror="x()" alt=""></header>');
    const doc = parse(build({ markup: dirty }));
    expect([...doc.querySelectorAll("script")].map((s) => s.textContent)).toEqual([STATIC_MENU_SCRIPT]);
    expect(doc.querySelectorAll("details[open]")).toHaveLength(0);
    expect(doc.querySelectorAll("details").length).toBeGreaterThan(0);
    const attrs = [...doc.querySelectorAll("*")].flatMap((el) => [...el.attributes].map((a) => a.name));
    expect(attrs.filter((a) => a.startsWith("on"))).toEqual([]);
    // M2B-4b 이관: 모션 선택자 data-motion·data-motion-play 추가(SPEC C-2 · 1.3 — motion.css가 쓴다)
    expect(attrs.filter((a) => a.startsWith("data-")).filter((a) => !["data-kit", "data-layout", "data-tone", "data-always", "data-site-root", "data-motion", "data-motion-play"].includes(a))).toEqual([]);
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
    const withFallback = drawDoc(withUnknownCta()).querySelector("[data-site-root]")!.outerHTML; // M2B-2c 이관: 폴백 예시 = cta-band 자리 no-such-variant
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

describe("정적 HTML 글꼴 고지 (M2B-4a MF-AC-G4)", () => {
  it("notice → <head> 주석 1개(그대로 · charset 뒤 · style 앞) · 없으면 주석 0", () => {
    const notice = "Fonts: Pretendard\nSIL OPEN FONT LICENSE Version 1.1";
    const page = new DOMParser().parseFromString(build({ notice }), "text/html");
    const nodes = [...page.head.childNodes];
    const comment = nodes.filter((n) => n.nodeType === Node.COMMENT_NODE);
    expect(comment.map((n) => n.textContent)).toEqual([notice]);
    const index = (pick: (n: ChildNode) => boolean) => nodes.findIndex(pick);
    expect(index((n) => n === comment[0])).toBeGreaterThan(index((n) => (n as Element).getAttribute?.("charset") === "utf-8"));
    expect(index((n) => n === comment[0])).toBeLessThan(index((n) => n.nodeName === "STYLE"));
    const plain = new DOMParser().parseFromString(build(), "text/html");
    expect([...plain.head.childNodes].filter((n) => n.nodeType === Node.COMMENT_NODE)).toEqual([]);
  });

  it("이미지 src = data:image/(webp|jpeg|png);base64,만 (SPEC m2c 5.2 · IMG-AC-23) — blob:·http(s)·svg data: = 실패 · srcset 0", () => {
    const site = (img: string) => `<div data-site-root=""><img alt="" ${img}></div>`;
    const parts = { css: "", title: "t", description: "d" };
    for (const type of ["webp", "jpeg", "png"]) expect(buildStaticHtml({ ...parts, markup: site(`src="data:image/${type};base64,AAAA"`) })).toContain(`src="data:image/${type};base64,AAAA"`);
    for (const bad of ['src="https://example.com/a.webp"', 'src="data:image/svg+xml;base64,AAAA"', 'src="data:image/gif;base64,AAAA"', 'src="/a.png"', 'src="data:image/webp;base64,AAAA" srcset="data:image/webp;base64,AAAA 2x"'])
      expect(() => buildStaticHtml({ ...parts, markup: site(bad) }), bad).toThrow("정적 HTML 이미지");
  });

  it("M4-a Q17 B 참조 직렬화: img src = image:<id> → images[id](부모 Blob에서 만든 src)로 바꾼 뒤 같은 규칙 검사 · 모르는 id·빈 id = 실패", () => {
    const site = (img: string) => `<div data-site-root=""><img alt="" ${img}></div>`;
    const parts = { css: "", title: "t", description: "d" };
    const images = { "id-1": "data:image/webp;base64,QUJD", "id-2": "data:image/png;base64,REVG" };
    const html = buildStaticHtml({ ...parts, images, markup: `<div data-site-root=""><img alt="" src="image:id-1"><img alt="" src="image:id-2"><img alt="" src="image:id-1"></div>` });
    expect([...parse(html).querySelectorAll("img")].map((img) => img.getAttribute("src"))).toEqual([images["id-1"], images["id-2"], images["id-1"]]);
    expect(html).not.toContain("image:");
    for (const bad of ['src="image:id-3"', 'src="image:"']) expect(() => buildStaticHtml({ ...parts, images, markup: site(bad) }), bad).toThrow("정적 HTML 이미지");
    // images 없이 참조가 오면(부모가 표를 안 줌) 실패
    expect(() => buildStaticHtml({ ...parts, markup: site('src="image:id-1"') })).toThrow("정적 HTML 이미지");
  });
});

describe("M4-a 금지 패턴 확장 (SPEC 4.1 zip 열 · 4.2 F-11~F-15)", () => {
  const parts = { css: CSS, title: "모던 카페", description: "스페셜티 커피" };
  const inject = (extra: string) => siteMarkup().replace("</header>", `${extra}</header>`);
  const firstSectionId = () => parse(build()).querySelector("[data-kit][id]")!.id;

  it("zip 대상: img src = assets/images/img-NN.(webp|jpg|png)만 · data: img 0 · srcset 0", () => {
    const site = (img: string) => `<div data-site-root=""><img alt="" ${img}></div>`;
    for (const name of ["img-01.webp", "img-02.jpg", "img-100.png"]) expect(buildStaticHtml({ ...parts, target: "zip", markup: site(`src="assets/images/${name}"`) })).toContain(`src="assets/images/${name}"`);
    for (const bad of ['src="data:image/webp;base64,AAAA"', 'src="assets/images/a.webp"', 'src="assets/images/img-1.webp"', 'src="../assets/images/img-01.webp"', 'src="assets/images/img-01.gif"', 'src="assets/images/img-01.webp" srcset="assets/images/img-01.webp 2x"'])
      expect(() => buildStaticHtml({ ...parts, target: "zip", markup: site(bad) }), bad).toThrow("정적 HTML 이미지");
    // 단일 HTML은 assets 경로를 받지 않는다
    expect(() => buildStaticHtml({ ...parts, markup: site('src="assets/images/img-01.webp"') })).toThrow("정적 HTML 이미지");
  });

  it("zip 대상: CSS url() = data: 또는 assets/fonts/<계열>-<굵기>.woff2만 · @import 0 · 단일 HTML은 data:만", () => {
    const font = '@font-face{font-family:"Kit Sans KR";src:url(assets/fonts/KitSansKR-400.woff2) format("woff2")}';
    expect(buildStaticHtml({ ...parts, target: "zip", markup: siteMarkup(), css: CSS + font })).toContain("url(assets/fonts/KitSansKR-400.woff2)");
    for (const bad of ["url(assets/fonts/../x.woff2)", "url(/assets/fonts/KitSansKR-400.woff2)", "url(assets/fonts/Kit-Sans-400.woff2)", "url(https://x.test/a.woff2)"])
      expect(() => buildStaticHtml({ ...parts, target: "zip", markup: siteMarkup(), css: `.a{src:${bad}}` }), bad).toThrow(/외부 요청/);
    expect(() => buildStaticHtml({ ...parts, markup: siteMarkup(), css: CSS + font })).toThrow(/외부 요청/);
  });

  it("F-11·EXP-AC-11: a[href]는 # 같은 문서 앵커만 — http·mailto·tel·javascript·data·상대 경로 = 실패", () => {
    for (const href of ["https://x.test", "http://x.test", "mailto:a@b.c", "tel:010", "javascript:alert(1)", "data:text/html,x", "page.html", "/a"])
      expect(() => build({ markup: inject(`<a href="${href}">x</a>`) }), href).toThrow("정적 HTML 링크");
  });

  it("F-12·EXP-AC-12: # 앵커 대상 id가 문서에 없으면 실패 · 있으면 통과 · 빈 # = 실패", () => {
    expect(() => build({ markup: inject(`<a href="#${firstSectionId()}">x</a>`) })).not.toThrow();
    for (const href of ["#s-x", "#"]) expect(() => build({ markup: inject(`<a href="${href}">x</a>`) }), href).toThrow("정적 HTML 링크");
  });

  it("F-13: action·formaction·poster · img 밖 src · style url()의 data: 아닌 값 = 실패", () => {
    for (const bad of ['<form action="https://x.test"></form>', '<button formaction="/x">x</button>', '<video poster="a.png"></video>', '<audio src="a.mp3"></audio>', '<div style="background:url(a.png)"></div>'])
      expect(() => build({ markup: inject(bad) }), bad).toThrow("정적 HTML 외부 출처");
    expect(() => build({ markup: inject('<div style="background:url(data:image/png;base64,AA)"></div>') })).not.toThrow();
  });

  it("F-13 우회(Codex R2): a 밖 href·xlink:href의 # 아닌 값 · 본문 link·base·meta · 본문 style의 @import·url() · style 속성 URL( 대소문자·CSS 이스케이프·image-set = 실패", () => {
    for (const bad of [
      '<svg><image href="https://x.test/a.png"></image></svg>',
      '<svg><image xlink:href="https://x.test/a.png"></image></svg>',
      '<link rel="stylesheet" href="https://x.test/a.css">',
      '<base href="https://x.test/">',
      '<meta http-equiv="refresh" content="0;url=https://x.test">',
      '<style>@import "https://x.test/a.css";</style>',
      "<style>.a{background:url(https://x.test/a.png)}</style>",
      '<div style="background:URL(https://x.test/a.png)"></div>',
      '<div style="background:u\\72l(https://x.test/a.png)"></div>',
      '<div style="background-image:image-set(\'https://x.test/a.png\' 1x)"></div>',
    ])
      expect(() => build({ markup: inject(bad) }), bad).toThrow("정적 HTML 외부 출처");
    // 같은 문서 조각 참조(svg use)는 외부 요청이 아니다
    expect(() => build({ markup: inject('<svg><use href="#x"></use></svg>') })).not.toThrow();
  });

  it("F-14·EXP-AC-13: 생성기 고정 부분(주석·CSS·class·data-* 이름)의 브랜드 문자열 = 실패 · 사용자 글자의 'Design Studio'는 통과", () => {
    const legacy = ["a", "p", "f", "s"].join("");
    expect(() => build({ markup: inject("<p>Design Studio 상호</p>"), title: "Design Studio", description: "design studio" })).not.toThrow();
    expect(() => build({ notice: "made by Design Studio" })).toThrow("정적 HTML 브랜드");
    expect(() => build({ css: `${CSS}.x{--${legacy}-a:1}` })).toThrow("정적 HTML 브랜드");
    expect(() => build({ markup: inject(`<p class="${legacy.toUpperCase()}-x">x</p>`) })).toThrow("정적 HTML 브랜드");
  });

  it("F-14 data: 본문 제외(Ego Lite R2): 인라인 글꼴 base64에 우연히 든 글자는 브랜드가 아니다 · data: 밖 CSS의 브랜드는 그대로 실패", () => {
    const legacy = ["a", "p", "f", "s"].join("");
    const face = (payload: string) => `@font-face{font-family:"Kit Sans KR";src:url(data:font/woff2;base64,AAAA${payload}BBBB) format("woff2")}`;
    expect(() => build({ css: CSS + face(legacy.toUpperCase()) })).not.toThrow();
    expect(() => build({ css: `${CSS}${face("")}.${legacy}-x{color:red}` })).toThrow("정적 HTML 브랜드");
  });
});


describe("FIX1 AppSec·QA (M-1·M-2·L-1·L-2)", () => {
  const inject = (extra: string) => siteMarkup().replace("</header>", `${extra}</header>`);
  /** 결과에 남으면 안 되는 것 — 고정 스크립트 밖 script · on* · 외부 출처 · javascript: · template · SMIL */
  const expectInert = (html: string) => {
    expect(html.split("<script").length - 1).toBe(1);
    for (const bad of ["onerror", "evil.example", "javascript:", "<template", "shadowrootmode", "<animate", "<set", "<SET", "attributename"]) expect(html, bad).not.toContain(bad);
  };

  it("M-1 template(declarative shadow DOM)·M-2 SVG animate·set·animateMotion·animateTransform = 제거(대소문자 무관) — 퍼즈 M06·M07·M12·M13·M41·M42·M43", () => {
    const fuzz = {
      M06: '<svg><a><animate attributeName="href" values="javascript:alert(1)"></animate><text>x</text></a></svg>',
      M07: '<svg><a><set attributeName="href" to="javascript:alert(1)"></set><text>x</text></a></svg>',
      M12: '<div><template shadowrootmode="open"><img src="https://evil.example/x" onerror="alert(1)"><script>alert(2)</script></template></div>',
      M13: '<div><template shadowrootmode="open"><a href="https://evil.example/phish">x</a><style>@import url(https://evil.example/c.css)</style></template></div>',
      M41: '<svg><image><set attributeName="href" to="https://evil.example/x"></set></image></svg>',
      M42: '<svg><image><animate attributeName="xlink:href" values="https://evil.example/x"></animate></image></svg>',
      M43: '<div><template shadowrootmode="open"><div><template shadowrootmode="open"><script>alert(3)</script></template></div></template></div>',
      motion: '<svg><a><animateMotion attributeName="href" values="javascript:alert(1)"></animateMotion><animateTransform attributeName="href" values="javascript:alert(1)"></animateTransform></a></svg>',
      upper: '<svg><image><SET attributeName="href" to="https://evil.example/x"></SET><ANIMATE attributeName="href" values="https://evil.example/x"></ANIMATE></image></svg>',
    };
    for (const [name, extra] of Object.entries(fuzz)) {
      let html = "";
      expect(() => (html = build({ markup: inject(extra) })), name).not.toThrow();
      expectInert(html);
    }
  });

  it("L-2 F-14 제외 = CSS의 url(data:font/…;base64,<base64>)만 — 주석 경계(Codex)·문자열 안 url(data:)·notice·zip 글꼴 경로(QA M2a)·data 글꼴 두 개 사이(QA M2c)의 브랜드 = 실패", () => {
    const legacy = ["a", "p", "f", "s"].join("");
    const Legacy = legacy[0]!.toUpperCase() + legacy.slice(1);
    const face = (src: string) => `@font-face{font-family:"Kit Sans KR";src:url(${src}) format("woff2")}`;
    const font = (payload: string) => face(`data:font/woff2;base64,AAAA${payload}BBBB`);
    // 실제 인라인 글꼴(따옴표 유무·zip 대상)의 base64 안 글자는 그대로 통과
    expect(() => build({ css: CSS + font(legacy.toUpperCase()) + face(`"data:font/woff2;base64,${Legacy}+/=="`) })).not.toThrow();
    expect(() => buildStaticHtml({ markup: siteMarkup(), title: "t", description: "d", target: "zip", css: CSS + font(legacy) })).not.toThrow();
    // Codex 주석 경계 입력 — 이스케이프 아닌 출현 수 검사(L-1)가 먼저 막을 수도 있다: 어느 쪽이든 실패
    expect(() => build({ css: `${CSS}/* url(data: */ .${legacy}-banner{color:red} /* ) */` })).toThrow(/정적 HTML (브랜드|CSS에 외부 요청)/);
    for (const css of [
      `${CSS}/* url("data: */ .${legacy}-banner{color:red} /* ") */`,
      `${CSS}.q{content:"url(data:${legacy})"}`,
      `${CSS}${font("CCCC")}.${legacy}-x{color:red}${font("DDDD")}`,
    ])
      expect(() => build({ css }), css).toThrow("정적 HTML 브랜드");
    expect(() => build({ notice: "Generated by url(data:Design Studio)" })).toThrow("정적 HTML 브랜드");
    expect(() => buildStaticHtml({ markup: siteMarkup(), title: "t", description: "d", target: "zip", css: CSS + face(`assets/fonts/${Legacy}-400.woff2`) })).toThrow("정적 HTML 브랜드");
  });

  it("L-1 url( 출현 수 = 엄격 매치 수 — 따옴표 섞인 url()(본문 style·style 요소·킷 CSS)·킷 CSS 이스케이프(@\\69mport·u\\72l()·image-set = 실패 · Tailwind 이스케이프 선택자·content 글자·data: url은 통과", () => {
    for (const bad of [
      `<div style="background:url(&quot;https://evil.example/a'b&quot;)"></div>`,
      `<div style="background:url('https://evil.example/a)b')"></div>`,
      `<style>.q{background:url("https://evil.example/a'b")}</style>`,
    ])
      expect(() => build({ markup: inject(bad) }), bad).toThrow("정적 HTML 외부 출처");
    for (const bad of [
      `.x{background:url("https://evil.example/a'b")}`,
      `.x{background:url('https://evil.example/a)b')}`,
      '@\\69mport "https://evil.example/c.css";',
      ".x{background:u\\72l(https://evil.example/x)}",
      '.x{background-image:image-set("https://evil.example/x.png" 1x)}',
    ])
      for (const target of ["html", "zip"] as const) expect(() => build({ target, css: CSS + bad }), `${target} ${bad}`).toThrow(/외부 요청/);
    const tailwind = '.md\\:grid{display:grid}.q::before{content:"\\201C"}.bg-\\[repeating-linear-gradient\\(45deg\\,red\\)\\]{color:red}.\\31 0{color:red}';
    const ok = `${CSS}${tailwind}.a{background:url("data:image/png;base64,AA")}.b{background:url('data:image/png;base64,AA')}.c{background:url( data:image/png;base64,AA )}`;
    expect(() => build({ css: ok })).not.toThrow();
    expect(() => build({ markup: inject(`<div style="background:url('data:image/png;base64,AA')"></div>`) })).not.toThrow();
  });

  it("보안 감사 F-06: 문자열 URL을 받는 CSS 함수(image()·src()·cross-fade()·element()) = 실패 — 본문 style·style 요소·킷 CSS(이스케이프 포함)", () => {
    const funcs = ['image("https://evil.example/a.png")', 'src("https://evil.example/a.png")', 'cross-fade("https://evil.example/a.png", red)', "-moz-element(#x)", 'IMAGE("https://evil.example/a.png")'];
    for (const fn of funcs) {
      for (const bad of [`<div style="background-image:${fn.replace(/"/g, "&quot;")}"></div>`, `<style>.q{background-image:${fn}}</style>`])
        expect(() => build({ markup: inject(bad) }), bad).toThrow("정적 HTML 외부 출처");
      for (const target of ["html", "zip"] as const) expect(() => build({ target, css: `${CSS}.x{background-image:${fn}}` }), `${target} ${fn}`).toThrow(/외부 요청/);
    }
    expect(() => build({ target: "html", css: `${CSS}.x{background-image:\\69mage("https://evil.example/a.png")}` })).toThrow(/외부 요청/);
  });

  it("Codex FIX1: 사이트 루트 자체가 제거 대상(template·script·svg animate 류)이면 실패 — 루트는 querySelectorAll('*') 밖이다", () => {
    for (const root of [
      '<template data-site-root="" shadowrootmode="open"><img src="https://evil.example/x" onerror="alert(1)"><script>alert(2)</script></template>',
      '<script data-site-root="">alert(1)</script>',
      '<TEMPLATE data-site-root=""><p>x</p></TEMPLATE>',
    ])
      expect(() => build({ markup: root }), root).toThrow("사이트 루트가 없는 마크업입니다");
  });
});
