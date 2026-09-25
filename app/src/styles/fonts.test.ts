// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const FONTS_CSS = fileURLToPath(new URL("./tokens/fonts.css", import.meta.url));
const REQUIRED_WEIGHTS = ["400", "500", "600", "700"];

interface FontFace {
  readonly family: string;
  readonly weight: string;
  readonly urls: readonly string[];
}

function parseFontFaces(css: string): FontFace[] {
  return [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map(([, body = ""]) => ({
    family: /font-family:\s*["']?([^"';]+)["']?/.exec(body)?.[1]?.trim() ?? "",
    weight: /font-weight:\s*(\d+)/.exec(body)?.[1] ?? "",
    urls: [...body.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((m) => m[1] ?? ""),
  }));
}

const css = readFileSync(FONTS_CSS, "utf8");
/** 선언만 본다 (주석 속 설명 문구 제외). 원격 URL 검사는 주석까지 포함한 원문으로 한다. */
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, "");
const faces = parseFontFaces(declarations);

describe("폰트 자체 호스팅 (fonts.css)", () => {
  it("원격 URL(http·https)을 참조하지 않는다", () => {
    expect(css.match(/https?:\/\//g) ?? []).toEqual([]);
  });

  it("Pretendard 400·500·600·700 웨이트 @font-face가 모두 있다", () => {
    const weights = faces.filter((f) => f.family === "Pretendard").map((f) => f.weight);
    expect([...weights].sort()).toEqual(REQUIRED_WEIGHTS);
  });

  it("@font-face가 참조하는 파일은 저장소에 실제로 존재하는 woff2다", () => {
    const urls = faces.flatMap((f) => f.urls);
    expect(urls.length).toBeGreaterThanOrEqual(REQUIRED_WEIGHTS.length);
    for (const url of urls) {
      expect(url).toMatch(/\.woff2$/);
      expect(existsSync(resolve(dirname(FONTS_CSS), url)), `${url} 없음`).toBe(true);
    }
  });

  it("로컬 설치 폰트(local())로 번들 파일 누락을 가리지 않는다", () => {
    expect(declarations).not.toMatch(/local\(/);
  });

  it("--font-sans의 첫 글꼴은 자체 호스팅한 Pretendard다", () => {
    const stack = /--font-sans:\s*([^;]+);/.exec(declarations)?.[1] ?? "";
    expect(stack.split(",")[0]?.trim()).toBe('"Pretendard"');
  });
});
