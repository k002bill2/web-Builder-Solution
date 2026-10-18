/**
 * 내보내기 생성기 공통 조각 — `/render.html` 킷 CSS 읽기 · 기본 fetch · 결과 해시. 정적 HTML·PNG(staticHtml 경유)와 React zip 생성기가 함께 쓴다.
 * 따로 둔 이유: React zip 청크가 staticHtml.ts를 import하면 정적 HTML 생성기 청크가 딸려 온다(REACTZIP-SPEC RZQ-02 A).
 */
import { DEV_SERVER_UNSUPPORTED } from "./devServer";

export const RENDER_DOC_SRC = "/render.html";

/** `/render.html`의 스타일시트 텍스트 — 빌드 산출물 기준(dev 서버는 CSS를 JS로 넣어 링크가 없다 → 실패) */
export async function kitCss(fetchText: (url: string) => Promise<string>): Promise<string> {
  const page = new DOMParser().parseFromString(await fetchText(RENDER_DOC_SRC), "text/html");
  const hrefs = [...page.querySelectorAll('link[rel="stylesheet"]')].map((link) => link.getAttribute("href") ?? "").filter(Boolean);
  if (hrefs.length === 0) throw new Error(import.meta.env.DEV ? DEV_SERVER_UNSUPPORTED : "render.html에 스타일시트가 없습니다");
  return (await Promise.all(hrefs.map(fetchText))).join("\n");
}

/** 결과 바이트 SHA-256 앞 12자리 */
export const hex12 = async (bytes: Uint8Array<ArrayBuffer>) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 12);

export const defaultFetchText = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} ${response.status}`);
  return response.text();
};
