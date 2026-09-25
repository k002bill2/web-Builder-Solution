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
