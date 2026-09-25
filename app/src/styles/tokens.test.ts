// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadTokens, resolveToken } from "../test/cssTokens";

const TOKENS_DIR = fileURLToPath(new URL("./tokens/", import.meta.url));

describe("디자인 토큰", () => {
  it("라이트 테마의 --primary는 #3366ff로 해석된다", () => {
    expect(resolveToken(loadTokens(TOKENS_DIR, "light"), "--primary")).toBe("#3366ff");
  });

  it("다크 테마의 --primary는 #5b84ff로 해석된다", () => {
    expect(resolveToken(loadTokens(TOKENS_DIR, "dark"), "--primary")).toBe("#5b84ff");
  });

  it("--radius-lg는 16px이다", () => {
    expect(resolveToken(loadTokens(TOKENS_DIR, "light"), "--radius-lg")).toBe("16px");
  });

  it("--font-size-body1은 16px이다", () => {
    expect(resolveToken(loadTokens(TOKENS_DIR, "light"), "--font-size-body1")).toBe("16px");
  });

  it("--primary는 브랜드 토큰(--brand-primary)을 참조한다 (ADR-002)", () => {
    expect(loadTokens(TOKENS_DIR, "light")["--primary"]).toBe("var(--brand-primary)");
    expect(loadTokens(TOKENS_DIR, "dark")["--primary"]).toBe("var(--brand-primary)");
  });

  it("토큰 복사본마다 원본 번들 경로를 출처 주석으로 남긴다", () => {
    for (const file of ["base", "colors", "fonts", "shape", "spacing", "typography"]) {
      const path = fileURLToPath(new URL(`./tokens/${file}.css`, import.meta.url));
      expect(existsSync(path), `${file}.css 없음`).toBe(true);
      expect(readFileSync(path, "utf8")).toMatch(
        new RegExp(`source: design/claude-design-handoff/project/_ds/[\\w-]+/tokens/${file}\\.css`),
      );
    }
  });
});
