import { readFileSync } from "node:fs";

/**
 * popover 미지원 폴백 구조 가드 [G] (M2B-1b-hardening P1 · m2a SPEC 197 · SPEC-BOUND B-1 6 "미지원 = 버튼 숨김 + 시트 목록 일반 흐름").
 * 폴백이 `:popover-open`을 모르는 엔진의 선택자 목록 통째 무효화(우연)에 기대지 않고 @supports 지원/미지원 블록으로 명시되었는지 본다.
 * 실제 동작(지원 · 모의 미지원)은 브라우저 판정(dev/active/m2b-1b-hardening) 몫.
 */
type Rule = { readonly selector: string; readonly parts: readonly string[]; readonly body: string; readonly at: readonly string[] };

/** 주석 제거 뒤 중괄호 깊이로 스타일 규칙과 조상 at-rule 머리말을 모은다 */
const parse = (css: string): Rule[] => {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: Rule[] = [];
  const stack: { prelude: string; start: number }[] = [];
  let mark = 0;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") {
      stack.push({ prelude: src.slice(mark, i).trim(), start: i + 1 });
      mark = i + 1;
    } else if (ch === "}") {
      const top = stack.pop()!;
      if (!top.prelude.startsWith("@")) {
        const at = stack.map((s) => s.prelude).filter((p) => p.startsWith("@"));
        rules.push({ selector: top.prelude, parts: top.prelude.split(/,(?![^()]*\))/).map((x) => x.trim()), body: src.slice(top.start, i), at });
      }
      mark = i + 1;
    } else if (ch === ";") mark = i + 1;
  }
  return rules;
};

const rules = parse(readFileSync("src/kit/kit.css", "utf8"));
const SUPPORTED = /^@supports\s+selector\(:popover-open\)$/;
const UNSUPPORTED = /^@supports\s+not\s+selector\(:popover-open\)$/;
const supported = (r: Rule) => r.at.some((a) => SUPPORTED.test(a));
const unsupported = (r: Rule) => r.at.some((a) => UNSUPPORTED.test(a));
const lg = (r: Rule) => r.at.some((a) => /@media\s*\(width >= 64rem\)/.test(a));
const display = (r: Rule) => /(?:^|;)\s*display:\s*([a-z-]+)/.exec(r.body)?.[1];

describe("popover 미지원 폴백 — 명시 @supports 계약", () => {
  it("파서 자기 점검: kit.css에서 :popover-open 규칙 · @supports 지원 블록을 찾는다", () => {
    expect(rules.filter((r) => r.selector.includes(":popover-open")).length).toBeGreaterThan(3);
    expect(rules.filter(supported).length).toBeGreaterThan(0);
  });

  it("게이트 밖 선택자 목록에 :popover-open과 일반 선택자가 섞이지 않는다(목록 통째 무효화 의존 0)", () => {
    const mixed = rules.filter((r) => !supported(r) && r.parts.some((p) => p.includes(":popover-open")) && r.parts.some((p) => !p.includes(":popover-open")));
    expect(mixed.map((r) => r.selector)).toEqual([]);
  });

  it(":popover-open 시트를 숨기는(display:none) 규칙은 @supports selector(:popover-open) 안에만", () => {
    const hide = rules.filter((r) => display(r) === "none" && r.parts.some((p) => p.includes(":popover-open")));
    expect(hide.length).toBeGreaterThan(0);
    expect(hide.filter((r) => !supported(r)).map((r) => r.selector)).toEqual([]);
  });

  it("미지원 블록: @supports not selector(:popover-open) 안에 .kit-sheet { display: block } (시트 목록 = 일반 흐름)", () => {
    const fallback = rules.filter(unsupported);
    expect(fallback.some((r) => r.parts.includes(".kit-sheet") && display(r) === "block")).toBe(true);
    // 미지원 블록에서 메뉴 버튼(닫기 포함)을 보이게 하는 규칙 0
    expect(fallback.filter((r) => r.selector.includes("kit-menu-button") && display(r) !== "none")).toEqual([]);
  });

  it("lg 시트 숨김(K1-1)은 게이트 밖 · burger 제외(:not) — 미지원에서도 바 메뉴와 시트 nav 중복 0, burger 메뉴는 남는다", () => {
    const hide = rules.filter((r) => lg(r) && !supported(r) && display(r) === "none" && r.parts.some((p) => /\.kit-sheet$/.test(p)));
    expect(hide.map((r) => r.parts.find((p) => /\.kit-sheet$/.test(p)))).toEqual([".kit-header:not(.kit-header--burger) .kit-sheet"]);
    // 게이트 밖 어디에서도 burger 시트를 숨기지 않는다
    const burgerHidden = rules.filter((r) => !supported(r) && display(r) === "none" && r.parts.some((p) => p === ".kit-sheet" || p.includes("kit-header--burger .kit-sheet")));
    expect(burgerHidden.map((r) => r.selector)).toEqual([]);
  });

  it("메뉴 버튼이 보이는 display는 @supports selector(:popover-open) 안에만 · 게이트 밖 기본 = none", () => {
    const shown = rules.filter((r) => r.parts.some((p) => p.endsWith(".kit-menu-button")) && display(r) !== undefined && display(r) !== "none");
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.filter((r) => !supported(r)).map((r) => r.selector)).toEqual([]);
    expect(rules.some((r) => r.at.length === 1 && r.selector === ".kit-menu-button" && display(r) === "none")).toBe(true);
  });
});
