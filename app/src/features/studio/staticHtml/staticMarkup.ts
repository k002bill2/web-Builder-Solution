/**
 * 정적 HTML 문서 조립 (M2A-3b G2·G3 · m2a 0.11·K2 · K-AC-06·08) — 렌더 문서가 돌려준 사이트 루트 마크업 + 킷 CSS → 완전한 문서 1개.
 * 사용자 글자는 DOM으로만 넣는다(title·meta content = 속성/글자 대입, 마크업 = 불활성 문서의 innerHTML — 문자열 이어 붙이기 0).
 * 결과 규칙: 고정 스크립트(STATIC_MENU_SCRIPT) 외 script 0 · on* 0 · details[open] 0 · 편집기 흔적(CSS가 안 쓰는 data-*) 0 · 폴백 섹션 = 실패 · blob: = 실패 · img src = data:image/(webp|jpeg|png);base64,만(srcset 0) · CSS 외부 요청 = 실패.
 */

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
}

function assertNoExternalCss(css: string) {
  const urls = [...css.matchAll(/url\(\s*(['"]?)([^'")]*)\1\s*\)/g)].map((m) => m[2]!.trim());
  if (/@import/i.test(css) || urls.some((u) => !u.startsWith("data:"))) throw new Error("정적 HTML CSS에 외부 요청이 있습니다");
}

/** 편집기 흔적·실행 코드 제거 — 불활성 문서 안에서만 다룬다 */
function clean(site: Element) {
  for (const el of site.querySelectorAll("script, iframe, object, embed")) el.remove();
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
function hasBlobUrl(site: Element): boolean {
  return [site, ...site.querySelectorAll("*")].some(
    (el) =>
      URL_ATTRS.some((name) => BLOB_IN_LIST.test(el.getAttribute(name)?.trim() ?? "")) ||
      BLOB_IN_CSS.test(el.getAttribute("style") ?? "") ||
      (el.localName === "style" && BLOB_IN_CSS.test(el.textContent ?? "")),
  );
}

export function buildStaticHtml({ markup, css, title, description, notice }: StaticHtmlParts): string {
  assertNoExternalCss(css);
  const page = document.implementation.createHTMLDocument("");
  page.documentElement.setAttribute("lang", "ko");
  page.body.innerHTML = markup;
  const site = page.body.firstElementChild;
  if (!site?.hasAttribute("data-site-root") || page.body.childElementCount !== 1) throw new Error("사이트 루트가 없는 마크업입니다");
  // 폴백(구조 미리보기)은 표식을 지우기 전에 판정 — 8.3.2 7단계가 막지만 생성기도 방어
  if (site.querySelector("[data-fallback], [data-kit-marker]")) throw new Error("구조 미리보기 섹션이 있어 정적 HTML을 만들지 않습니다");
  clean(site);
  // 모션 재생 스위치(M2B-4b · SPEC 1.3 · MF-AC-U4) — 정적 HTML만, 사이트 루트에만. 안쪽에 들어온 것은 지운다
  for (const el of site.querySelectorAll("[data-motion-play]")) el.removeAttribute("data-motion-play");
  site.setAttribute("data-motion-play", "");
  if (hasBlobUrl(site)) throw new Error("정적 HTML에 blob: URL이 남았습니다");
  // 이미지 = 단일 파일 data:만(SPEC m2c 5.2) · srcset 0(후보가 모두 data:로 들어가 크기만 는다 — zip은 M4)
  if ([...site.querySelectorAll("img")].some((img) => !DATA_IMAGE.test(img.getAttribute("src") ?? "") || img.hasAttribute("srcset"))) throw new Error("정적 HTML 이미지는 data: 단일 파일만 허용합니다");

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
  return `<!doctype html>\n${page.documentElement.outerHTML}`;
}
