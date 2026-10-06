/**
 * 썸네일 CSS의 `@media` 해소 (M3P SPEC 3절 반응형 함정 · M3P-AC-G6) — `<img>`로 그린 SVG 안 미디어 쿼리는 1280 문서 폭이 아니라
 * 이미지 자체 뷰포트(카드 ≈247px) 기준으로 평가될 수 있다. 빌드에서 고정 폭 기준으로 미리 풀어 맞는 블록은 펼치고 안 맞는 블록은 지운다.
 * 모르는 조건은 throw(빌드 실패) — 조용히 남기거나 지우지 않는다. prefers-reduced-motion:no-preference = 거짓(모션 최종 상태, pngCapture와 같은 결과).
 */
const REM_PX = 16;
const px = (value: string, unit: string) => Number(value) * (unit === "rem" || unit === "em" ? REM_PX : 1);
const compare = (width: number, op: string, limit: number) => (op === ">=" ? width >= limit : op === ">" ? width > limit : op === "<=" ? width <= limit : width < limit);
/** `a < b` 꼴을 width 기준으로 뒤집는다(`48rem <= width` = `width >= 48rem`) */
const FLIP: Readonly<Record<string, string>> = { "<=": ">=", "<": ">", ">=": "<=", ">": "<" };

function condition(raw: string, width: number): boolean {
  const c = raw.trim().replace(/^\(+|\)+$/g, "").replace(/\s+/g, "");
  if (c === "screen" || c === "all") return true;
  if (c === "print" || c === "prefers-reduced-motion:no-preference") return false;
  let m = /^width(>=|>|<=|<)([\d.]+)(px|rem|em)$/.exec(c);
  if (m) return compare(width, m[1]!, px(m[2]!, m[3]!));
  m = /^([\d.]+)(px|rem|em)(<=|<)width(<=|<)([\d.]+)(px|rem|em)$/.exec(c);
  if (m) return compare(width, FLIP[m[3]!]!, px(m[1]!, m[2]!)) && compare(width, m[4]!, px(m[5]!, m[6]!));
  m = /^(min|max)-width:([\d.]+)(px|rem|em)$/.exec(c);
  if (m) return compare(width, m[1] === "min" ? ">=" : "<=", px(m[2]!, m[3]!));
  throw new Error(`썸네일 CSS: 해소할 수 없는 @media 조건 "${raw.trim()}"`);
}

const matches = (prelude: string, width: number) => prelude.split(",").some((query) => query.split(/\band\b/).every((part) => condition(part, width)));

/** 여는 중괄호 다음 위치에서 짝 닫는 중괄호 다음 위치 */
function blockEnd(css: string, from: number): number {
  let depth = 1;
  let i = from;
  while (depth > 0) {
    if (i >= css.length) throw new Error("썸네일 CSS: @media 블록이 닫히지 않았습니다");
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}") depth -= 1;
    i += 1;
  }
  return i;
}

export function resolveMedia(css: string, width: number): string {
  const parts: string[] = [];
  let i = 0;
  for (let at = css.indexOf("@media", i); at >= 0; at = css.indexOf("@media", i)) {
    parts.push(css.slice(i, at));
    const open = css.indexOf("{", at);
    const end = blockEnd(css, open + 1);
    if (matches(css.slice(at + "@media".length, open), width)) parts.push(resolveMedia(css.slice(open + 1, end - 1), width));
    i = end;
  }
  parts.push(css.slice(i));
  return parts.join("");
}
