/**
 * 정적 HTML 문서 조립 (M2A-3b G2·G3 · m2a 0.11·K2 · K-AC-06·08) — 렌더 문서가 돌려준 사이트 루트 마크업 + 킷 CSS → 완전한 문서 1개.
 * 사용자 글자는 DOM으로만 넣는다(title·meta content = 속성/글자 대입, 마크업 = 불활성 문서의 innerHTML — 문자열 이어 붙이기 0).
 * 결과 규칙: 고정 스크립트(STATIC_MENU_SCRIPT) 외 script 0 · on* 0 · details[open] 0 · 편집기 흔적(CSS가 안 쓰는 data-*) 0 · 폴백 섹션 = 실패 · blob: = 실패 · img src = data:image/(webp|jpeg|png);base64,만(srcset 0) · CSS 외부 요청 = 실패.
 * zip 대상(M4-a SPEC 4.1 zip 열): img src = `assets/images/img-NN.ext`만 · CSS url() = data: 또는 `assets/fonts/*.woff2`.
 * 두 대상 공통(SPEC 4.2): F-11 링크 = 같은 문서 앵커만 · F-12 앵커 대상 존재 · F-13 그 밖 URL 속성 외부 출처 0 · F-14 고정 부분 브랜드 0 · F-15 head 외부 요소 0.
 */
import { brand } from "../../../brand/brand.config";

/**
 * 생성기 고정 인라인 스크립트 (2a-05 SPEC r4.12 · K-AC-12) — 메뉴 시트(`[popover]`) 안 같은 문서 앵커를 누르면 그 시트를 닫는다.
 * 캔버스는 렌더 문서(RenderApp click)가 같은 일을 한다. 사용자 글자·URL·문서 값 0(문서마다 바이트 동일) · 앵커 이동은 막지 않는다 · hidePopover 없으면 아무것도 안 함.
 */
export const STATIC_MENU_SCRIPT =
  'document.addEventListener("click",function(e){var t=e.target,a=t&&t.closest?t.closest(\'a[href^="#"]\'):null,p=a?a.closest("[popover]"):null;if(p&&typeof p.hidePopover=="function")p.hidePopover()});';

/** 킷·렌더 CSS가 선택자로 쓰는 data-* (kit.css · render.css) — 나머지 data-*는 편집기 흔적이라 지운다 */
const KEPT_DATA = new Set(["data-site-root", "data-kit", "data-layout", "data-tone", "data-always", "data-motion", "data-motion-play"]);

export interface StaticHtmlParts {
  readonly markup: string;
  readonly css: string;
  readonly title: string;
  readonly description: string;
  /** 글꼴 라이선스 고지(M2B-4a G4 — 계열별 고정 문자열) → `<head>` 주석 1개 */
  readonly notice?: string;
  /** 참조 직렬화(M4-a Q17 B) — 이미지 id → 결과 src. 렌더 문서가 준 `img src="image:<id>"`를 이것으로 바꾼다(없는 id = 실패) */
  readonly images?: Readonly<Record<string, string>>;
  /** 결과 형식 — html = 파일 1개(data: 인라인) · zip = assets 상대 경로(M4-a) */
  readonly target?: "html" | "zip";
}

const ZIP_FONT = /^assets\/fonts\/[A-Za-z]+-\d{3}\.woff2$/;
const ZIP_IMAGE = /^assets\/images\/img-\d{2,3}\.(webp|jpg|png)$/;
/** CSS url() 값 = 큰따옴표 · 작은따옴표 · 무따옴표(공백·따옴표·괄호 0) 중 하나. 따옴표가 섞이면 매치되지 않는다 → 출현 수 비교가 잡는다(AppSec L-1) */
const CSS_URL = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^'"()\s]*))\s*\)/gi;
/** url() 값 목록 — `url(` 출현 수와 엄격 매치 수가 다르면(읽지 못한 url()이 있으면) null */
function cssUrls(css: string): string[] | null {
  const urls = [...css.matchAll(CSS_URL)].map((m) => (m[1] ?? m[2] ?? m[3] ?? "").trim());
  return urls.length === (css.match(/url\(/gi) ?? []).length ? urls : null;
}
/** CSS 이스케이프 해석(`\69` → i · `\:` → :) — 킷 CSS의 `@\69mport`·`u\72l(`를 브라우저처럼 글자로 본다. Tailwind 이스케이프 선택자·content 글자는 url(·@import가 되지 않는다 */
const CSS_ESCAPE = /\\(?:([0-9a-f]{1,6})[ \t\n\r\f]?|([^\n\r\f0-9a-f]))/gi;
const unescapeCss = (css: string) =>
  css.replace(CSS_ESCAPE, (_, hex: string | undefined, ch: string | undefined) => (hex ? String.fromCodePoint(Math.min(parseInt(hex, 16) || 0xfffd, 0x10ffff)) : (ch ?? "")));

/** 킷 CSS — url()은 data: 또는 (zip) assets/fonts만 · @import·image-set 0 · 읽지 못한 url() 0 (이스케이프 해석 뒤) */
function assertNoExternalCss(css: string, target: "html" | "zip") {
  const plain = unescapeCss(css);
  const urls = cssUrls(plain);
  if (urls === null || /@import|image-set\(/i.test(plain) || urls.some((u) => !u.startsWith("data:") && !(target === "zip" && ZIP_FONT.test(u)))) throw new Error("정적 HTML CSS에 외부 요청이 있습니다");
}

/**
 * 지우는 요소(localName 소문자 비교 — SVG animateMotion 등 대소문자 무관).
 * template = 안쪽이 querySelectorAll 밖이라 검사가 닿지 않고 열람 시 declarative shadow DOM이 된다(AppSec M-1) ·
 * SVG animate·set·animateMotion·animateTransform = URL 속성을 열람 시점에 바꾼다(AppSec M-2)
 */
const REMOVED = new Set(["script", "iframe", "object", "embed", "template", "animate", "set", "animatemotion", "animatetransform"]);

/** 편집기 흔적·실행 코드 제거 — 불활성 문서 안에서만 다룬다 */
function clean(site: Element) {
  for (const el of site.querySelectorAll("*")) if (REMOVED.has(el.localName.toLowerCase())) el.remove();
  for (const el of [site, ...site.querySelectorAll("*")]) {
    for (const { name } of [...el.attributes]) {
      if (name.startsWith("on") || (name.startsWith("data-") && !KEPT_DATA.has(name))) el.removeAttribute(name);
    }
  }
  // 캡처·내보내기 때 details는 닫힘(0.11) — 새로 그린 마크업이라 원래 없지만 생성기도 방어
  for (const el of site.querySelectorAll("details[open]")) el.removeAttribute("open");
}

/** blob: 검사는 URL 자리만 본다(P2-3) — 본문·대체텍스트의 글자 "blob:"은 문서 내용이다 */
const URL_ATTRS = ["src", "href", "srcset", "poster"] as const;
const BLOB_IN_LIST = /(^|[\s,])blob:/i;
const BLOB_IN_CSS = /url\(\s*['"]?\s*blob:/i;
const DATA_IMAGE = /^data:image\/(webp|jpeg|png);base64,/;
const IMAGE_REF = "image:";
/** `image:<id>` → images[id]. 모르는 id는 그대로 둔다 → 아래 이미지 규칙 검사가 실패시킨다 */
function resolveImageRefs(site: Element, images: Readonly<Record<string, string>>) {
  for (const img of site.querySelectorAll("img")) {
    const src = img.getAttribute("src") ?? "";
    const resolved = src.startsWith(IMAGE_REF) && Object.hasOwn(images, src.slice(IMAGE_REF.length)) ? images[src.slice(IMAGE_REF.length)] : undefined;
    if (resolved) img.setAttribute("src", resolved);
  }
}
function hasBlobUrl(site: Element): boolean {
  return [site, ...site.querySelectorAll("*")].some(
    (el) =>
      URL_ATTRS.some((name) => BLOB_IN_LIST.test(el.getAttribute(name)?.trim() ?? "")) ||
      BLOB_IN_CSS.test(el.getAttribute("style") ?? "") ||
      (el.localName === "style" && BLOB_IN_CSS.test(el.textContent ?? "")),
  );
}

/** F-11·F-12 링크 = 같은 문서 앵커만 · 대상 id 존재 */
function assertLinks(site: Element) {
  for (const a of site.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href") ?? "";
    if (!href.startsWith("#") || href.length < 2 || !site.ownerDocument.getElementById(href.slice(1))) throw new Error(`정적 HTML 링크는 같은 문서 앵커만 허용합니다: ${href}`);
  }
}

/** 본문 CSS(style 속성·요소) — url()은 data:만 · @import·image-set·이스케이프(\) 0(이스케이프는 url(·@import를 글자로 숨긴다) */
const CSS_TRICK = /@import|image-set\(|\\/i;
const hasExternalCss = (css: string) => {
  const urls = cssUrls(css);
  return CSS_TRICK.test(css) || urls === null || urls.some((u) => !u.startsWith("data:"));
};

/** F-13 그 밖 URL 자리 — action·formaction·poster·background·ping 0 · src는 img만 · href(xlink 포함)는 # 조각만 · 본문 link·base·meta 0 · 본문 CSS 외부 요청 0 */
function assertNoExternalSources(site: Element) {
  const bad =
    site.querySelector("link, base, meta") !== null ||
    [site, ...site.querySelectorAll("*")].some(
      (el) =>
        ["action", "formaction", "poster", "background", "ping"].some((name) => el.hasAttribute(name)) ||
        (el.localName !== "img" && (el.hasAttribute("src") || el.hasAttribute("srcset"))) ||
        [...el.attributes].some((a) => a.localName === "href" && !a.value.trim().startsWith("#")) ||
        hasExternalCss(el.getAttribute("style") ?? "") ||
        (el.localName === "style" && hasExternalCss(el.textContent ?? "")),
    );
  if (bad) throw new Error("정적 HTML 외부 출처가 있습니다");
}

/** F-14 생성기 고정 부분(주석·CSS·class·data-* 이름)의 브랜드 문자열 — 사용자 글자(본문·alt·title·description)는 보지 않는다 */
const BRAND = new RegExp(`${brand.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|${["a", "p", "f", "s"].join("")}`, "i");
/**
 * CSS의 인라인 글꼴 base64는 글자가 아니다 — 무작위 base64에 4글자가 우연히 들어가 거짓 실패했다(Ego Lite R2).
 * 제외는 CSS 입력의 `url(data:font/…;base64,<base64 글자>)`만(AppSec L-2) — base64 글자에 공백·`*`·`{`가 없어 주석·규칙 경계를 넘지 못한다 · notice·고정 스크립트는 그대로 검사
 */
const CSS_FONT_DATA_URL = /url\(\s*(['"]?)data:font\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]*\1\s*\)/gi;
function assertNoBrand(site: Element, css: string, fixed: readonly string[]) {
  const names = [site, ...site.querySelectorAll("*")].flatMap((el) => [el.getAttribute("class") ?? "", ...[...el.attributes].map((a) => a.name)]);
  if ([css.replace(CSS_FONT_DATA_URL, "url()"), ...fixed, ...names].some((text) => BRAND.test(text))) throw new Error("정적 HTML 브랜드 문자열이 있습니다");
}

export function buildStaticHtml({ markup, css, title, description, notice, images = {}, target = "html" }: StaticHtmlParts): string {
  assertNoExternalCss(css, target);
  const page = document.implementation.createHTMLDocument("");
  page.documentElement.setAttribute("lang", "ko");
  page.body.innerHTML = markup;
  const site = page.body.firstElementChild;
  // 루트 자체가 제거 대상이면 실패 — clean()의 querySelectorAll("*")은 루트를 보지 않는다(Codex FIX1)
  if (!site?.hasAttribute("data-site-root") || page.body.childElementCount !== 1 || REMOVED.has(site.localName.toLowerCase())) throw new Error("사이트 루트가 없는 마크업입니다");
  // 폴백(구조 미리보기)은 표식을 지우기 전에 판정 — 8.3.2 7단계가 막지만 생성기도 방어
  if (site.querySelector("[data-fallback], [data-kit-marker]")) throw new Error("구조 미리보기 섹션이 있어 정적 HTML을 만들지 않습니다");
  clean(site);
  resolveImageRefs(site, images);
  // 모션 재생 스위치(M2B-4b · SPEC 1.3 · MF-AC-U4) — 정적 HTML만, 사이트 루트에만. 안쪽에 들어온 것은 지운다
  for (const el of site.querySelectorAll("[data-motion-play]")) el.removeAttribute("data-motion-play");
  site.setAttribute("data-motion-play", "");
  if (hasBlobUrl(site)) throw new Error("정적 HTML에 blob: URL이 남았습니다");
  // 이미지 = 단일 파일 data:만(SPEC m2c 5.2) · srcset 0(후보가 모두 data:로 들어가 크기만 는다 — zip은 M4)
  const imageSrc = target === "zip" ? ZIP_IMAGE : DATA_IMAGE;
  if ([...site.querySelectorAll("img")].some((img) => !imageSrc.test(img.getAttribute("src") ?? "") || img.hasAttribute("srcset"))) throw new Error("정적 HTML 이미지 규칙 위반 — data: 단일 파일(zip은 assets/images) 아님");
  assertLinks(site);
  assertNoExternalSources(site);
  assertNoBrand(site, css, [notice ?? "", STATIC_MENU_SCRIPT]);

  const head = page.head;
  head.replaceChildren();
  const meta = (attrs: Readonly<Record<string, string>>) => {
    const el = page.createElement("meta");
    for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
    head.append(el);
  };
  meta({ charset: "utf-8" });
  meta({ name: "viewport", content: "width=device-width, initial-scale=1" });
  const titleEl = page.createElement("title");
  titleEl.textContent = title;
  head.append(titleEl);
  meta({ name: "description", content: description });
  if (notice) head.append(page.createComment(notice));
  const style = page.createElement("style");
  style.textContent = css;
  head.append(style);
  const script = page.createElement("script");
  script.textContent = STATIC_MENU_SCRIPT;
  head.append(script);
  // F-15 — head는 위에서 처음부터 만든다(방어 단언)
  if (head.querySelector("base, link, meta[http-equiv]")) throw new Error("정적 HTML head에 외부 요소가 있습니다");
  return `<!doctype html>\n${page.documentElement.outerHTML}`;
}
