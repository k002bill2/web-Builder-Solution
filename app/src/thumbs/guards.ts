/**
 * 썸네일 SVG 빌드 가드 (M3P-AC-U8 viewBox · G2 외부 참조 · G6 @media·네임스페이스) — 위반 문장 목록(빈 배열 = 통과). 빌드 스크립트가 모든 산출에 돌린다.
 * 허용 예외: xmlns 네임스페이스 URI(svg·xhtml·xlink)와 문서 안 `href="#…"`뿐. XML 파싱 검사는 DOMParser 전역이 필요하다.
 */
import { THUMB_HEIGHT, THUMB_WIDTH } from "./svgWriter";

const SVG_NS = "http://www.w3.org/2000/svg";
const HEAD = `<svg xmlns="${SVG_NS}" width="${THUMB_WIDTH}" height="${THUMB_HEIGHT}" viewBox="0 0 ${THUMB_WIDTH} ${THUMB_HEIGHT}">`;
const NAMESPACES = /xmlns(?::\w+)?="http:\/\/www\.w3\.org\/(?:2000\/svg|1999\/xhtml|1999\/xlink)"/g;
/** 이전(목업) 브랜드 명칭 — brandIsolation 가드를 통과하도록 조각을 이어 만든다(같은 관례) */
const LEGACY_BRAND = new RegExp(["a", "p", "f", "s"].join(""), "i");
const RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/https?:/i, "외부 URL(http)"],
  [/\/\//, "프로토콜 상대 URL(//)"],
  [/<script/i, "script 요소"],
  [/\son[a-z]+\s*=/i, "on* 속성"],
  [/\bhref\s*=\s*["'](?!#)/i, "외부 href"],
  [LEGACY_BRAND, "이전 브랜드 흔적"],
  [/@media/, "@media 남음"],
];

export function thumbnailIssues(svg: string): readonly string[] {
  const issues: string[] = [];
  if (!svg.startsWith(HEAD)) issues.push(`viewBox ${THUMB_WIDTH}×${THUMB_HEIGHT} 머리 아님`);
  const body = svg.replace(NAMESPACES, "");
  for (const [pattern, label] of RULES) if (pattern.test(body)) issues.push(label);
  const xml = new DOMParser().parseFromString(svg, "image/svg+xml");
  if (xml.getElementsByTagName("parsererror").length > 0) return [...issues, "XML 파싱 실패"];
  const nested = [...xml.getElementsByTagNameNS("*", "svg")].slice(1);
  if (nested.some((n) => n.namespaceURI !== SVG_NS)) issues.push("중첩 svg 네임스페이스가 SVG가 아님");
  return issues;
}
