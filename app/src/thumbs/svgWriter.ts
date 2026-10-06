/**
 * 썸네일 SVG writer (M3P SPEC 3절 A 직렬화 계약 · M3P-AC-U8·G6) — SSR 마크업을 HTML DOM으로 파싱 → XMLSerializer(중첩 svg 네임스페이스 보존,
 * pngCapture buildCaptureSvg와 같은 원리) → `<svg viewBox="0 0 1280 960"><foreignObject>`. 1280 폭 렌더의 첫 화면 4:3 영역만 보인다.
 * CSS = 렌더 문서 CSS − 주석 − @font-face(글꼴 = 시스템 대체, 외부 요청 0) − @media(1280 기준 해소) + 모션 정지. DOM 전역(document·XMLSerializer)이 필요하다
 * — vitest jsdom · 빌드 스크립트는 jsdom 창을 전역에 둔다.
 */
import { resolveMedia } from "./mediaQueries";

export const THUMB_WIDTH = 1280;
export const THUMB_HEIGHT = 960;
const MOTION_STOP = "[data-site-root] *, [data-site-root] *::before, [data-site-root] *::after { animation: none !important; transition: none !important; }";

export function thumbnailCss(renderCss: string): string {
  const plain = renderCss.replace(/\/\*[\s\S]*?\*\//g, "").replace(/@font-face\s*\{[^}]*\}/g, "");
  return `${resolveMedia(plain, THUMB_WIDTH)}\n${MOTION_STOP}`;
}

export function thumbnailSvg(markup: string, css: string): string {
  const page = document.implementation.createHTMLDocument("");
  page.body.innerHTML = markup;
  const site = page.body.firstElementChild;
  if (!site?.hasAttribute("data-site-root") || page.body.childElementCount !== 1) throw new Error("썸네일: 사이트 루트가 없는 마크업입니다");
  for (const el of site.querySelectorAll("script, iframe, object, embed")) el.remove();
  for (const el of [site, ...site.querySelectorAll("*")]) {
    for (const { name } of [...el.attributes]) if (name.startsWith("on")) el.removeAttribute(name);
  }
  for (const el of site.querySelectorAll("details[open]")) el.removeAttribute("open");
  for (const el of [site, ...site.querySelectorAll("[data-motion-play]")]) el.removeAttribute("data-motion-play");
  const style = page.createElement("style");
  style.textContent = css;
  page.head.replaceChildren(style);
  page.documentElement.setAttribute("style", `width:${THUMB_WIDTH}px`);
  page.body.setAttribute("style", "margin:0");
  const xhtml = new XMLSerializer().serializeToString(page.documentElement);
  const size = `width="${THUMB_WIDTH}" height="${THUMB_HEIGHT}"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" ${size} viewBox="0 0 ${THUMB_WIDTH} ${THUMB_HEIGHT}"><foreignObject x="0" y="0" ${size}>${xhtml}</foreignObject></svg>`;
}
