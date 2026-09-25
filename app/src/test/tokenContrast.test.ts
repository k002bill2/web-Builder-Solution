// @vitest-environment node
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "../domain/contrast";
import { composite, loadTokens, resolveToken } from "./cssTokens";

/**
 * 토큰 쌍 대비 (A11Y-01 9.1 방법 · v2 SPEC 3.1 배경 집합 · V2-AC-04~06·08·40).
 * 배경은 토큰 값에서 합성해 만든다 — 토큰이 바뀌면 배경 집합도 따라 바뀐다.
 */
const TOKENS_DIR = fileURLToPath(new URL("../styles/tokens/", import.meta.url));
const THEMES = ["light", "dark"] as const;
type Theme = (typeof THEMES)[number];

const TEXT = 4.5;
const UI = 3;

function colorOf(theme: Theme) {
  const tokens = loadTokens(TOKENS_DIR, theme);
  return (name: string): string => {
    const value = resolveToken(tokens, name);
    if (value === undefined) throw new Error(`${theme} 테마에 ${name}이 없습니다`);
    return value;
  };
}

/** SPEC 3.1 — 글자 토큰이 놓일 수 있는 모든 면(불투명 hex) */
function requiredSurfaces(theme: Theme): Record<string, string> {
  const color = colorOf(theme);
  const bases = ["--background-normal", "--background-alternative", "--surface-elevated", "--surface-sunken", "--surface-raised"];
  const out: Record<string, string> = {};
  for (const base of bases) {
    const solid = composite(color(base), "#ffffff");
    out[base] = solid;
    for (const fill of ["--fill-normal", "--fill-strong"]) out[`${fill} / ${base}`] = composite(color(fill), solid);
  }
  // 상태 면·primary-container는 카드 위에 놓인다 (다크는 rgba라 합성)
  const card = out["--surface-elevated"]!;
  for (const tint of ["--status-positive-bg", "--status-cautionary-bg", "--status-negative-bg", "--status-informative-bg", "--primary-container"]) {
    out[`${tint} / --surface-elevated`] = composite(color(tint), card);
  }
  return out;
}

/** SPEC 3.3 — 역상 면(플로팅 필·요약 바·열 문자 배지·건너뛰기 링크) */
function inverseSurfaces(theme: Theme): Record<string, string> {
  const color = colorOf(theme);
  const base = composite(color("--surface-inverse"), "#ffffff");
  return {
    "--surface-inverse": base,
    "--surface-inverse-hover": composite(color("--surface-inverse-hover"), "#ffffff"),
    "--inverse-fill-normal / --surface-inverse": composite(color("--inverse-fill-normal"), base),
    "--inverse-fill-strong / --surface-inverse": composite(color("--inverse-fill-strong"), base),
  };
}

function worstRatio(theme: Theme, fg: string, surfaces: Record<string, string>) {
  const color = colorOf(theme)(fg);
  return Math.min(...Object.values(surfaces).map((bg) => contrastRatio(composite(color, bg), bg)));
}

const SURFACE_TEXT = [
  "--label-normal",
  "--label-neutral",
  "--label-alternative",
  "--status-positive-text",
  "--status-cautionary-text",
  "--status-negative-text",
  "--status-informative-text",
  "--primary-text",
];
const INVERSE_TEXT = ["--on-surface-inverse", "--inverse-label-alternative"];

describe.each(THEMES)("토큰 대비 — %s", (theme) => {
  it.each(SURFACE_TEXT)("%s: 필수 배경 집합 전부에서 ≥ 4.5 (V2-AC-04)", (fg) => {
    expect(worstRatio(theme, fg, requiredSurfaces(theme))).toBeGreaterThanOrEqual(TEXT);
  });

  it.each(INVERSE_TEXT)("%s: 역상 면 전부에서 ≥ 4.5 (V2-AC-04)", (fg) => {
    expect(worstRatio(theme, fg, inverseSurfaces(theme))).toBeGreaterThanOrEqual(TEXT);
  });

  it.each(["--primary", "--primary-hover", "--primary-pressed"])("--on-primary: %s 위 ≥ 4.5 (V2-AC-06)", (bg) => {
    const color = colorOf(theme);
    expect(contrastRatio(color("--on-primary"), color(bg))).toBeGreaterThanOrEqual(TEXT);
  });

  it("모든 필수 배경에서 normal > neutral > alternative (V2-AC-05)", () => {
    const color = colorOf(theme);
    for (const [name, bg] of Object.entries(requiredSurfaces(theme))) {
      const [normal, neutral, alternative] = ["--label-normal", "--label-neutral", "--label-alternative"].map((t) =>
        contrastRatio(composite(color(t), bg), bg),
      ) as [number, number, number];
      expect(normal, name).toBeGreaterThan(neutral);
      expect(neutral, name).toBeGreaterThan(alternative);
    }
  });

  it.each([
    ["neutral", "--label-neutral", "--fill-strong"],
    ["blue", "--accent-blue", "--accent-blue-bg"],
    ["green", "--accent-green", "--accent-green-bg"],
    ["red", "--accent-red", "--accent-red-bg"],
    ["orange", "--accent-orange", "--accent-orange-bg"],
    ["violet", "--accent-violet", "--accent-violet-bg"],
  ])("Tag %s 톤 글자 ≥ 4.5 (V2-AC-08)", (_tone, fg, tint) => {
    const color = colorOf(theme);
    const card = composite(color("--surface-elevated"), "#ffffff");
    const bg = composite(color(tint), card);
    expect(contrastRatio(composite(color(fg), bg), bg)).toBeGreaterThanOrEqual(TEXT);
  });

  it("포커스 링은 2중 링이고 링 색이 자기 간격 색 위에서 ≥ 3 (V2-AC-40)", () => {
    const tokens = loadTokens(TOKENS_DIR, theme);
    const ring = tokens["--focus-ring"] ?? "";
    const layers = [...ring.matchAll(/0 0 0 (\d+)px var\((--[\w-]+)\)/g)].map(([, px, name]) => ({ px: Number(px), name: name! }));
    expect(layers).toHaveLength(2);
    const [gap, outer] = layers as [(typeof layers)[0], (typeof layers)[0]];
    expect(outer.px).toBeGreaterThan(gap.px);
    const color = colorOf(theme);
    expect(contrastRatio(color(outer.name), composite(color(gap.name), "#ffffff"))).toBeGreaterThanOrEqual(UI);
  });
});
