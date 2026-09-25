// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = fileURLToPath(new URL("../", import.meta.url));
const BRAND_CSS = join(SRC, "styles/tokens/brand.css");
const TOKENS_DIR = join(SRC, "styles/tokens");
/** 출처 주석의 번들 경로 표기만 예외로 허용한다. */
const SOURCE_PATH_MARKER = "design/claude-design-handoff/";
/** 이전(목업) 브랜드 명칭. 이 파일 자체도 grep 수용 기준을 통과하도록 조각을 이어 만든다. */
const LEGACY_BRAND = ["a", "p", "f", "s"].join("");
const LEGACY_INSTITUTION = ["농업", "정책"].join("");
const FORBIDDEN = new RegExp(`${LEGACY_BRAND}|${LEGACY_INSTITUTION}`, "i");

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

const sourceFiles = listFiles(SRC).filter((f) => /\.(ts|tsx|css)$/.test(f));

describe("브랜드 격리 (ADR-002)", () => {
  it("src에 이전 브랜드 명칭이 없다 (출처 경로 주석 제외)", () => {
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
    // 제품 코드만 본다 (테스트 파일은 검사 패턴 자체를 담고 있다)
    const outside = sourceFiles
      .filter((file) => !file.startsWith(TOKENS_DIR) && !/\.test\.tsx?$/.test(file))
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
