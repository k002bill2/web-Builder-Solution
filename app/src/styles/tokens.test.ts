// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadDarkBlock, loadTokens, resolveToken } from "../test/cssTokens";

const TOKENS_DIR = fileURLToPath(new URL("./tokens/", import.meta.url));
const light = loadTokens(TOKENS_DIR, "light");
const dark = loadTokens(TOKENS_DIR, "dark");

/** v2 SPEC 2.2(브랜드) · 2.3(의미) 표 — [토큰, 라이트, 다크] (V2-AC-01·02·03) */
const COLOR_VALUES: ReadonlyArray<readonly [string, string, string]> = [
  ["--brand-primary", "#5a5fe8", "#818cf8"],
  ["--brand-primary-hover", "#4f46e5", "#a5b4fc"],
  ["--brand-primary-pressed", "#4338ca", "#c7d2fe"],
  ["--brand-primary-container", "#f2f2fd", "rgba(129, 140, 248, 0.16)"],
  ["--brand-accent", "#2563eb", "#60a5fa"],
  ["--brand-primary-text", "#4147e5", "#949ef9"],
  ["--on-primary", "#ffffff", "#10142e"],
  ["--surface-inverse", "#1a2620", "#e6ebe2"],
  ["--surface-inverse-hover", "#111a15", "#f4f7f2"],
  ["--on-surface-inverse", "#ffffff", "#0f1310"],
  ["--inverse-fill-normal", "rgba(255, 255, 255, 0.12)", "rgba(15, 19, 16, 0.12)"],
  ["--inverse-fill-strong", "rgba(255, 255, 255, 0.16)", "rgba(15, 19, 16, 0.16)"],
  ["--inverse-label-alternative", "rgba(255, 255, 255, 0.72)", "rgba(15, 19, 16, 0.72)"],
  ["--inverse-label-disable", "rgba(255, 255, 255, 0.4)", "rgba(15, 19, 16, 0.4)"],
  ["--label-normal", "#1a2620", "#e6ebe2"],
  ["--label-strong", "#1a2620", "#e6ebe2"],
  ["--label-neutral", "#4c574e", "#acb6a7"],
  ["--label-alternative", "#56615a", "#9fa89b"],
  ["--label-assistive", "rgba(31, 54, 40, 0.28)", "rgba(230, 235, 226, 0.28)"],
  ["--label-disable", "rgba(31, 54, 40, 0.16)", "rgba(230, 235, 226, 0.16)"],
  ["--background-normal", "#ffffff", "#0f1310"],
  ["--background-alternative", "#f0f3ee", "#1f261d"],
  ["--surface-elevated", "#ffffff", "#181d17"],
  ["--surface-sunken", "#f0f3ee", "#1f261d"],
  ["--surface-raised", "#ffffff", "#1d231c"],
  ["--fill-normal", "rgba(31, 54, 40, 0.06)", "rgba(255, 255, 255, 0.06)"],
  ["--fill-strong", "rgba(31, 54, 40, 0.12)", "rgba(255, 255, 255, 0.1)"],
  ["--fill-alternative", "rgba(31, 54, 40, 0.04)", "rgba(255, 255, 255, 0.04)"],
  ["--line-alternative", "rgba(31, 54, 40, 0.08)", "rgba(255, 255, 255, 0.06)"],
  ["--line-neutral", "rgba(31, 54, 40, 0.12)", "rgba(255, 255, 255, 0.1)"],
  ["--line-normal", "rgba(31, 54, 40, 0.2)", "rgba(255, 255, 255, 0.16)"],
  ["--line-strong", "rgba(31, 54, 40, 0.54)", "rgba(255, 255, 255, 0.35)"],
  ["--status-positive", "#32d1af", "#33ddb8"],
  ["--status-positive-bg", "#def7f0", "rgba(51, 221, 184, 0.16)"],
  ["--status-positive-text", "#066b5a", "#33ddb8"],
  ["--status-cautionary", "#fbb424", "#fbc04a"],
  ["--status-cautionary-bg", "#fef3da", "rgba(251, 180, 36, 0.16)"],
  ["--status-cautionary-text", "#825500", "#fbc04a"],
  ["--status-negative", "#ff6b42", "#ff7e59"],
  ["--status-negative-bg", "#ffe7df", "rgba(255, 107, 66, 0.18)"],
  ["--status-negative-text", "#af2e0d", "#ff825e"],
  ["--status-informative", "#3b82f6", "#60a5fa"],
  ["--status-informative-bg", "#f0f7ff", "rgba(96, 165, 250, 0.16)"],
  ["--status-informative-text", "#1b58c8", "#65a8fa"],
];

/** `var()` 별칭 — 두 블록 모두에 같은 참조로 선언돼야 하위 요소의 data-theme 전환이 다시 계산된다 (SPEC 2.1-5) */
const ALIASES: ReadonlyArray<readonly [string, string]> = [
  ["--primary", "var(--brand-primary)"],
  ["--primary-hover", "var(--brand-primary-hover)"],
  ["--primary-pressed", "var(--brand-primary-pressed)"],
  ["--primary-container", "var(--brand-primary-container)"],
  ["--primary-text", "var(--brand-primary-text)"],
  ["--accent-green", "var(--status-positive-text)"],
  ["--accent-green-bg", "var(--status-positive-bg)"],
  ["--accent-orange", "var(--status-cautionary-text)"],
  ["--accent-orange-bg", "var(--status-cautionary-bg)"],
  ["--accent-red", "var(--status-negative-text)"],
  ["--accent-red-bg", "var(--status-negative-bg)"],
  ["--accent-blue", "var(--status-informative-text)"],
  ["--accent-blue-bg", "var(--status-informative-bg)"],
  ["--accent-violet", "var(--primary-text)"],
  ["--accent-violet-bg", "var(--primary-container)"],
];

const normalize = (v: string | undefined) => v?.replace(/\s+/g, " ").replace(/,\s*/g, ", ").toLowerCase();

describe("디자인 토큰 — v2 값 (SPEC 2.2·2.3)", () => {
  it.each(COLOR_VALUES)("%s = 라이트 %s / 다크 %s", (name, lightValue, darkValue) => {
    expect(normalize(resolveToken(light, name))).toBe(lightValue);
    expect(normalize(resolveToken(dark, name))).toBe(darkValue);
  });

  it.each(ALIASES)("%s는 두 테마 블록 모두에서 %s (다크 재선언, V2-AC-02)", (name, ref) => {
    expect(light[name]).toBe(ref);
    expect(loadDarkBlock(TOKENS_DIR)[name]).toBe(ref);
  });

  it("--focus-ring은 2중 링이고 다크 블록에 재선언된다 (SPEC 2.2 · 3.4)", () => {
    const ring = "0 0 0 2px var(--background-normal), 0 0 0 4px var(--brand-accent)";
    expect(normalize(light["--focus-ring"])).toBe(ring);
    expect(normalize(loadDarkBlock(TOKENS_DIR)["--focus-ring"])).toBe(ring);
  });

  it("--primary는 브랜드 토큰(--brand-primary)을 참조한다 (ADR-002)", () => {
    expect(light["--primary"]).toBe("var(--brand-primary)");
    expect(dark["--primary"]).toBe("var(--brand-primary)");
  });

  it("원시 램프·accent 4종·primary-strong/heavy가 없다 (SPEC 2.7 · V2-AC-12)", () => {
    const removed = Object.keys(dark).filter((name) =>
      /^--(common|cool-neutral|blue|green|red|orange|violet|purple|pink|cyan|lime)-\d+$|^--accent-(purple|pink|cyan|lime)(-bg)?$|^--primary-(strong|heavy)$/.test(name),
    );
    expect(removed).toEqual([]);
  });
});

describe("디자인 토큰 — 모양·타이포·간격 (SPEC 2.4·2.5)", () => {
  it.each([
    ["--radius-sm", "8px"],
    ["--radius-md", "12px"],
    ["--radius-lg", "16px"],
    ["--radius-2xl", "28px"],
    ["--duration-fast", "120ms"],
    ["--duration-normal", "180ms"],
    ["--duration-slow", "280ms"],
    ["--ease-standard", "cubic-bezier(0.4, 0, 0.2, 1)"],
    ["--layout-max-width", "1280px"],
    ["--font-size-body1", "16px"],
  ])("%s = %s", (name, value) => {
    expect(resolveToken(light, name)).toBe(value);
  });

  it.each([
    ["--shadow-1", "0 1px 2px rgba(20,40,28,.06), 0 1px 1px rgba(20,40,28,.04)", "0 1px 2px rgba(0,0,0,.4)"],
    ["--shadow-2", "0 4px 14px rgba(20,40,28,.08), 0 1px 3px rgba(20,40,28,.05)", "0 4px 14px rgba(0,0,0,.45)"],
    ["--shadow-3", "0 4px 14px rgba(20,40,28,.08), 0 1px 3px rgba(20,40,28,.05)", "0 4px 14px rgba(0,0,0,.45)"],
    ["--shadow-4", "0 12px 34px rgba(20,40,28,.14), 0 4px 10px rgba(20,40,28,.07)", "0 14px 38px rgba(0,0,0,.55)"],
  ])("%s 라이트·다크 값", (name, lightValue, darkValue) => {
    expect(normalize(light[name])).toBe(normalize(lightValue));
    expect(normalize(loadDarkBlock(TOKENS_DIR)[name])).toBe(normalize(darkValue));
  });

  it("패널 제목 ds-heading1은 굵기 700 (SPEC 2.4 t-h2)", () => {
    const css = readFileSync(fileURLToPath(new URL("./tokens/typography.css", import.meta.url)), "utf8");
    expect(css).toMatch(/\.ds-heading1\s*\{\s*font:\s*var\(--weight-bold\)/);
  });
});

describe("디자인 토큰 — 출처", () => {
  it("토큰 파일마다 v2 번들 경로를 출처 주석으로 남긴다 (SPEC 2.6 · V2-AC-13)", () => {
    for (const file of ["base", "colors", "fonts", "shape", "spacing", "typography"]) {
      const path = fileURLToPath(new URL(`./tokens/${file}.css`, import.meta.url));
      expect(existsSync(path), `${file}.css 없음`).toBe(true);
      expect(readFileSync(path, "utf8")).toMatch(
        /\/\* source: design\/claude-design-handoff-v2\/project\/_ds\/[\w-]+\/_ds_bundle\.css \(:root · \.dark\) \*\//,
      );
    }
  });

  it("토큰 파일 목록은 그대로다 (SPEC 2.1-6)", () => {
    expect(readdirSync(TOKENS_DIR).sort()).toEqual(["base.css", "brand.css", "colors.css", "fonts.css", "shape.css", "spacing.css", "typography.css"]);
  });
});
