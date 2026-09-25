import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

type Theme = "light" | "dark";
type Declarations = Readonly<Record<string, string>>;

const DARK_SELECTOR = '[data-theme="dark"]';

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function declarationsIn(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const [, name, value] = match;
    if (name && value) out[name] = value.trim();
  }
  return out;
}

function blocksFor(css: string, selector: string): string[] {
  const blocks: string[] = [];
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "g");
  for (const match of css.matchAll(re)) {
    if (match[1]) blocks.push(match[1]);
  }
  return blocks;
}

/** 토큰 디렉터리의 모든 CSS에서 테마별 커스텀 프로퍼티 선언을 모은다 (dark = light 위에 덮어쓰기). */
export function loadTokens(dir: string, theme: Theme): Declarations {
  const files = readdirSync(dir).filter((f) => f.endsWith(".css"));
  const css = files.map((f) => stripComments(readFileSync(join(dir, f), "utf8"))).join("\n");
  const light = Object.assign({}, ...blocksFor(css, ":root").map(declarationsIn)) as Record<string, string>;
  if (theme === "light") return light;
  const dark = Object.assign({}, ...blocksFor(css, DARK_SELECTOR).map(declarationsIn)) as Record<string, string>;
  return { ...light, ...dark };
}

/** `var(--x)` 체인을 따라가 최종 값을 돌려준다. 순환이면 예외. */
export function resolveToken(tokens: Declarations, name: string): string | undefined {
  const seen = new Set<string>();
  let current = tokens[name];
  while (current !== undefined) {
    const ref = /^var\((--[\w-]+)\)$/.exec(current);
    if (!ref?.[1]) return current;
    if (seen.has(ref[1])) throw new Error(`순환 참조: ${[...seen, ref[1]].join(" → ")}`);
    seen.add(ref[1]);
    current = tokens[ref[1]];
  }
  return undefined;
}

/** 다크 블록(`[data-theme="dark"]`)에 직접 선언된 것만 — 라이트 값이 섞이지 않아 재선언 여부를 확인할 수 있다 (V2-AC-02). */
export function loadDarkBlock(dir: string): Declarations {
  const files = readdirSync(dir).filter((f) => f.endsWith(".css"));
  const css = files.map((f) => stripComments(readFileSync(join(dir, f), "utf8"))).join("\n");
  return Object.assign({}, ...blocksFor(css, DARK_SELECTOR).map(declarationsIn)) as Record<string, string>;
}

export type Rgba = readonly [number, number, number, number];

/** `#rgb`·`#rrggbb`·`rgb()`·`rgba()`만 읽는다. 그 밖의 값이면 예외 — 대비 테스트가 조용히 건너뛰지 않게. */
export function parseColor(value: string): Rgba {
  const v = value.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(v)?.[1];
  if (hex) {
    const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
    const channel = (i: number) => parseInt(full.slice(i, i + 2), 16);
    return [channel(0), channel(2), channel(4), 1];
  }
  const fn = /^rgba?\(([^)]*)\)$/.exec(v)?.[1];
  if (fn) {
    const [r, g, b, a = "1"] = fn.split(",").map((p) => p.trim());
    return [Number(r), Number(g), Number(b), Number(a)];
  }
  throw new Error(`색으로 읽을 수 없는 값: ${value}`);
}

/** 알파 색을 불투명 배경 위에 8비트 sRGB로 합성한 hex (A11Y-01 contrast_calc.py `over`와 같은 반올림). */
export function composite(fg: string, bg: string): string {
  const [r, g, b, a] = parseColor(fg);
  const [R, G, B, bgAlpha] = parseColor(bg);
  if (bgAlpha !== 1) throw new Error(`배경은 불투명해야 합니다: ${bg}`);
  const mix = (x: number, y: number) => Math.round(a * x + (1 - a) * y);
  return `#${[mix(r, R), mix(g, G), mix(b, B)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}
