// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = fileURLToPath(new URL("../", import.meta.url));
const SELF = fileURLToPath(import.meta.url);
const BRAND_CSS = join(SRC, "styles/tokens/brand.css");
const TOKENS_DIR = join(SRC, "styles/tokens");
/** 출처 주석의 번들 경로 표기만 예외로 허용한다. */
const SOURCE_PATH_MARKER = "design/claude-design-handoff/";
const FORBIDDEN = /apfs|농업정책/i;

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

const sourceFiles = listFiles(SRC).filter((f) => /\.(ts|tsx|css)$/.test(f) && f !== SELF);

describe("브랜드 격리 (ADR-002)", () => {
  it("src에 apfs/APFS/농업정책 문자열이 없다 (출처 경로 주석 제외)", () => {
    const hits = sourceFiles.flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .map((line, i) => ({ line, at: `${relative(SRC, file)}:${i + 1}` }))
        .filter(({ line }) => FORBIDDEN.test(line) && !line.includes(SOURCE_PATH_MARKER))
        .map(({ at, line }) => `${at}  ${line.trim()}`),
    );
    expect(hits).toEqual([]);
  });

  it("--brand-* 정의는 brand.css에만 존재한다", () => {
    const definers = sourceFiles.filter((file) => /--brand-[\w-]+\s*:/.test(readFileSync(file, "utf8")));
    expect(definers.map((f) => relative(SRC, f))).toEqual(["styles/tokens/brand.css"]);
    expect(definers).toEqual([BRAND_CSS]);
  });

  it("--brand-* 참조는 토큰 계층(styles/tokens) 밖에 없다", () => {
    const outside = sourceFiles
      .filter((file) => !file.startsWith(TOKENS_DIR))
      .filter((file) => /--brand-|\bbrand-(primary|accent|gradient)/.test(readFileSync(file, "utf8")))
      .map((f) => relative(SRC, f));
    expect(outside).toEqual([]);
  });

  it("brand.config.ts가 제품명과 로고 컴포넌트를 제공한다", async () => {
    const { brand } = await import("../brand/brand.config");
    expect(brand.name).toBe("Design Studio");
    expect(typeof brand.Logo).toBe("function");
  });
});
