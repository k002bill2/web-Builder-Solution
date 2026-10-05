// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/** 토큰 사용 규칙 가드 (A11Y-01 9.2 · v2 SPEC 6.2 V2-AC-09~12·14). 제품 `.tsx`만 본다. */
const SRC = fileURLToPath(new URL("../", import.meta.url));

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

const productTsx = listFiles(SRC).filter((f) => f.endsWith(".tsx") && !/\.test\.tsx$/.test(f));
const lines = productTsx.flatMap((file) =>
  readFileSync(file, "utf8")
    .split("\n")
    .map((text, i) => ({ text, at: `${relative(SRC, file)}:${i + 1}` })),
);
const hitsOf = (pattern: RegExp, allow: (text: string) => boolean = () => false) =>
  lines.filter(({ text }) => pattern.test(text) && !allow(text)).map(({ at, text }) => `${at}  ${text.trim()}`);

describe("토큰 사용 가드", () => {
  it("label-assistive를 글자에 쓰지 않는다 (V2-AC-09 · A11Y-AC-05)", () => {
    expect(hitsOf(/label-assistive/)).toEqual([]);
  });

  it("접미사 없는 text-status-*는 아이콘 줄에만 (V2-AC-10 · A11Y-AC-11)", () => {
    // `\b`는 `-` 앞에서도 성립해 `-text`까지 잡으므로 부정 전방탐색을 쓴다 (A11Y-01 9.2-2)
    const unsuffixed = /text-status-(positive|cautionary|negative|informative)(?![\w-])/;
    expect(hitsOf(unsuffixed, (text) => /<Icon\b|\bicon:/.test(text))).toEqual([]);
  });

  it("원시 색 유틸리티를 쓰지 않는다 (V2-AC-12)", () => {
    const raw = /\b(?:bg|text|border|fill|stroke|ring|outline)-(?:common|cool-neutral|blue|green|red|orange|violet|purple|pink|cyan|lime)-\d+\b/;
    expect(hitsOf(raw)).toEqual([]);
  });

  it("font-extrabold·font-black(800+)을 쓰지 않는다 — 자체 호스팅 폰트는 400~700 (V2-AC-14 · SPEC 2.4)", () => {
    expect(hitsOf(/\bfont-(extrabold|black)\b/)).toEqual([]);
  });

  it("Button secondary(역상 변형)는 역상 면(bg-surface-inverse)을 가진 컴포넌트에서만 (V2-AC-11)", () => {
    const misuse = productTsx
      .filter((file) => /variant="secondary"/.test(readFileSync(file, "utf8")))
      .filter((file) => !/\bbg-surface-inverse\b/.test(readFileSync(file, "utf8")))
      .map((file) => relative(SRC, file));
    expect(misuse).toEqual([]);
  });

  it("역상 면 컴포넌트는 opacity로 흐리게 하지 않는다 — inverse-* 토큰 (A11Y-01 4.2-3)", () => {
    const inverse = productTsx.filter((file) => /\bbg-surface-inverse\b/.test(readFileSync(file, "utf8")));
    const hits = inverse.flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .flatMap((text, i) => (/\bopacity-\d+/.test(text) ? [`${relative(SRC, file)}:${i + 1}  ${text.trim()}`] : [])),
    );
    expect(hits).toEqual([]);
  });

  it("아이콘·폰트 파일을 추가하지 않는다 (V2-AC-14 · SPEC B-3·B-6)", () => {
    expect(readdirSync(join(SRC, "assets/icons")).length).toBe(13);
    // 앱 UI 폰트 = assets/fonts 4개 그대로 · 사이트 글꼴(M2B-4a SPEC-MOTION-FONT 2.1 — Noto 2종 서브셋 400·700)은 assets/site-fonts의 정확한 4파일만
    const woff2 = listFiles(SRC).filter((f) => f.endsWith(".woff2"));
    expect(woff2.filter((f) => !f.includes("assets/site-fonts/")).length).toBe(4);
    expect(woff2.filter((f) => f.includes("assets/site-fonts/")).map((f) => f.slice(f.indexOf("site-fonts/"))).sort()).toEqual([
      "site-fonts/kit-sans-kr/KitSansKR-400.woff2",
      "site-fonts/kit-sans-kr/KitSansKR-700.woff2",
      "site-fonts/kit-serif-kr/KitSerifKR-400.woff2",
      "site-fonts/kit-serif-kr/KitSerifKR-700.woff2",
    ]);
  });
});
