import type { HtmlMessage } from "./protocol";

/**
 * serialize 답(html{markup}) 모양 검사 (M2A-3b G2) — protocol.ts와 같은 규칙이지만 따로 둔다: 내보내기 생성기(조작 뒤 청크)만 쓰므로
 * protocol.ts(편집기 진입 청크)에 두면 `/studio` 진입에 실린다(REPORT 7절).
 */
/** html 마크업 상한(글자 수) — 섹션 ≤ 11 · 이미지 ≤ 64(data URL)를 넉넉히 덮는다 */
export const HTML_MAX = 8_000_000;

export function readHtmlMessage(data: unknown): HtmlMessage | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const { type, markup } = data as { readonly type?: unknown; readonly markup?: unknown };
  return type === "html" && typeof markup === "string" && markup.length > 0 && markup.length <= HTML_MAX ? { type: "html", markup } : undefined;
}
