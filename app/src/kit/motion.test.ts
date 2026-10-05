// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * 사이트 모션 CSS 계약 (M2B-4b · SPEC-MOTION-FONT 1.2·1.3 · MF-AC-U2·U3) — kit/motion.css 원문을 정적으로 검사한다.
 * 모든 규칙 = `@media screen and (prefers-reduced-motion: no-preference)` 블록 1개 안 · 재생 조건 `[data-site-root][data-motion-play] … [data-kit][data-motion`.
 */
const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
const MEDIA = "@media screen and (prefers-reduced-motion: no-preference) {";
const source = () => read("./motion.css").replace(/\/\*[\s\S]*?\*\//g, "");

/** 중괄호 짝으로 media 블록 본문과 바깥 나머지를 나눈다 */
function splitMedia(css: string): { readonly inside: string; readonly outside: string } {
  const start = css.indexOf(MEDIA);
  if (start < 0) return { inside: "", outside: css };
  let depth = 0;
  for (let i = start + MEDIA.length - 1; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return { inside: css.slice(start + MEDIA.length, i), outside: css.slice(0, start) + css.slice(i + 1) };
  }
  return { inside: "", outside: css };
}

/** 선언 블록이 있는 가장 안쪽 규칙(선택자 → 본문) */
const rules = (css: string) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selector: selector!.trim(), body: body!.trim() }));
const declValues = (css: string, prop: string) => [...css.matchAll(new RegExp(`(?:^|[;{\\s])${prop}\\s*:\\s*([^;}]+)`, "g"))].map((m) => m[1]!.trim());

describe("사이트 모션 CSS (MF-AC-U2·U3)", () => {
  it("U2: 모든 내용이 감소 설정 옵트인 media 블록 1개 안 · 애니메이션·전환 규칙마다 재생 조건(사이트 루트 data-motion-play → 섹션 data-motion)", () => {
    const { inside, outside } = splitMedia(source());
    expect(outside.trim()).toBe("");
    expect(inside.split(MEDIA)).toHaveLength(1);
    // keyframes 단계(from·to·%)와 토큰 규칙(사이트 루트 자신)을 뺀 모든 규칙 = 재생 조건 아래 섹션 안쪽
    const applied = rules(inside)
      .map((r) => ({ ...r, selector: r.selector.replace(/^.*(@keyframes|@starting-style|@layer)[^{]*$/s, "").trim() }))
      .filter((r) => r.selector && !/^(from|to|\d+%)$/.test(r.selector) && r.selector !== "[data-site-root][data-motion-play]");
    expect(applied.length).toBeGreaterThan(5);
    expect(applied.filter((r) => /\banimation\b/.test(r.body)).length).toBeGreaterThan(5);
    for (const r of applied) {
      for (const one of r.selector.split(/,(?![^(]*\))/)) expect(one.trim(), r.selector).toMatch(/^\[data-site-root\]\[data-motion-play\] .*\[data-kit\]\[data-motion(="L[12]")?\]/);
    }
  });

  it("U2: 반복 1 · infinite 0 · 스크롤 연동 0 · 전환 = opacity·transform(+시트 overlay·display allow-discrete) · keyframes = opacity·transform · translateX 0", () => {
    const css = source();
    expect(css).not.toMatch(/infinite|animation-timeline|scroll\(|view\(|translateX|translate3d|translate\(/);
    const animations = declValues(css, "animation");
    expect(animations.length).toBeGreaterThanOrEqual(5);
    for (const value of animations) expect(value, value).toMatch(/^kit-[a-z]+ var\(--site-motion-dur-[a-z]+\) var\(--site-motion-ease-out\) 1 backwards$/);
    expect(declValues(css, "animation-iteration-count")).toEqual([]);
    for (const value of declValues(css, "transition")) {
      for (const part of value.split(/,(?![^(]*\))/).map((p) => p.trim())) {
        expect(part, part).toMatch(/^(opacity|transform) var\(--site-motion-dur-sheet\) var\(--site-motion-ease-std\)$|^(overlay|display) var\(--site-motion-dur-sheet\) allow-discrete$/);
      }
    }
    const frames = [...css.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g)];
    expect(frames.map((m) => m[1])).toEqual(expect.arrayContaining(["kit-fade", "kit-rise", "kit-zoom", "kit-grow"]));
    for (const [, , body] of frames) {
      for (const r of rules(body!)) for (const decl of r.body.split(";").filter((d) => d.trim())) expect(decl.split(":")[0]!.trim()).toMatch(/^(opacity|transform)$/);
    }
    for (const name of declValues(css, "animation").map((v) => v.split(" ")[0])) expect(frames.map((m) => m[1])).toContain(name);
  });

  it("U3: 토큰 9개 = SPEC 1.2 값 · 3 × stagger + dur-zoom ≤ 1초 · 각 dur ≤ 720ms · 이동 거리 rem", () => {
    const css = source();
    const token = (name: string) => declValues(css, `--site-motion-${name}`);
    expect(Object.fromEntries(["dur-sheet", "dur-enter", "dur-zoom", "stagger", "ease-out", "ease-std", "rise", "drop", "zoom"].map((n) => [n, token(n)]))).toEqual({
      "dur-sheet": ["200ms"],
      "dur-enter": ["420ms"],
      "dur-zoom": ["720ms"],
      stagger: ["80ms"],
      "ease-out": ["cubic-bezier(0.2, 0, 0, 1)"],
      "ease-std": ["cubic-bezier(0.4, 0, 0.2, 1)"],
      rise: ["0.75rem"],
      drop: ["-0.5rem"],
      zoom: ["1.04"],
    });
    const ms = (name: string) => Number.parseFloat(token(name)[0]!);
    expect(3 * ms("stagger") + ms("dur-zoom")).toBeLessThanOrEqual(1000);
    for (const d of ["dur-sheet", "dur-enter", "dur-zoom"]) expect(ms(d)).toBeLessThanOrEqual(720);
    // 지연은 stagger 배수만(상한 2단 = 3번째 이후 공유) · 숫자 ms 직접 쓰기 0(토큰만)
    for (const value of declValues(css, "animation-delay")) expect(value).toMatch(/^(var\(--site-motion-stagger\)|calc\(2 \* var\(--site-motion-stagger\)\))$/);
    expect(css.replace(/--site-motion-[\w-]+\s*:[^;]+;/g, "")).not.toMatch(/\d(ms|s)\b/);
  });

  it("렌더 CSS가 kit.css 뒤에 motion.css를 싣는다(같은 렌더 CSS → 정적 HTML·PNG)", () => {
    const render = read("../render/render.css");
    const kit = render.indexOf('@import "../kit/kit.css";');
    const motion = render.indexOf('@import "../kit/motion.css";');
    expect(kit).toBeGreaterThan(-1);
    expect(motion).toBeGreaterThan(kit);
  });
});
