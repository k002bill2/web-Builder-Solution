// @vitest-environment node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 킷 가드 (M2A-2a K3 · m2a 0.1·0.11 · K-AC-01·07 · Opus B-1-8) — app/src/kit 의 제품 파일(테스트 제외)이
 * ① 값 import = react · 킷 내부(.ts·.tsx·.css)만(앱 DS·엔진 연산·게이트·zod·domain 0 — `import type`은 번들에 남지 않아 허용)
 * ② React 상태·효과·이벤트 핸들러 prop 0 ③ 모션 CSS 0 ④ 뷰포트 높이 단위 0 ⑤ hex·px 0 ⑥ 앱 DS 토큰 참조 0.
 */
const SRC = fileURLToPath(new URL("../", import.meta.url));
const KIT = join(SRC, "kit");
const list = (dir: string): string[] => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? list(join(dir, n)) : [join(dir, n)]));
const kitFiles = () => (existsSync(KIT) ? list(KIT).filter((f) => /\.(ts|tsx|css)$/.test(f) && !/\.test\.tsx?$/.test(f)) : []);

const SPECIFIER = /(?:\b(?:import|export)\s+(?!type\b)[^"';]*?\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|@import\s+)["']([^"']+)["']/g;
export function importViolations(file: string, text: string): string[] {
  return [...text.matchAll(SPECIFIER)].flatMap(([, spec]) => {
    if (spec === "react" || spec === "react/jsx-runtime") return [];
    if (spec!.startsWith(".") && resolve(dirname(file), spec!).startsWith(KIT + "/")) return [];
    return [`${relative(SRC, file)} → ${spec}`];
  });
}

/** 줄 단위 금지 패턴 — 주석 줄(//, *, /*)은 설명 글이라 제외 */
const RULES: readonly { readonly name: string; readonly pattern: RegExp }[] = [
  { name: "React 상태·효과", pattern: /\b(useState|useReducer|useEffect|useLayoutEffect|useRef|useCallback)\b/ },
  { name: "이벤트 핸들러 prop", pattern: /\bon[A-Z]\w*\s*=/ },
  { name: "모션 CSS", pattern: /\b(transition|animation|animate-|scroll-behavior|scroll-smooth)/ },
  { name: "뷰포트 높이 단위", pattern: /\d(vh|dvh|svh|lvh)\b|\b(h|min-h|max-h)-(screen|dvh|svh|lvh)\b/ },
  { name: "hex", pattern: /#[0-9a-f]{3,8}\b/i },
  { name: "px", pattern: /\d(\.\d+)?px\b/ },
  { name: "앱 DS 토큰", pattern: /--(label|fill|background|line|status|accent|primary|on-primary|surface|inverse|space|font-size|radius)-|\bds-[a-z]/ },
  { name: "앱 테마 색 유틸리티", pattern: /\b(bg|text|border|outline|ring|decoration|divide|fill|stroke|from|via|to|shadow|caret|accent)-(primary|on-primary|label|fill|background|line|status|surface|inverse|accent|on-color|white|black)\b/ },
  { name: "앱 테마 글자 크기", pattern: /\btext-(display|title|heading|body|label|caption)\d?(?![\w-])/ },
  { name: "앱 간격·radius 단계(--spacing·--radius-*)", pattern: /(^|[\s"'`])-?(p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|inset|top|left|right|bottom|w|h|min-w|min-h|max-w|space-x|space-y)-\d|\brounded-(xs|sm|md|lg|xl|2xl|3xl)\b/ },
];
/** 모션 CSS 예외 = kit/motion.css 하나만(MF-AC-G1 · SPEC C-7) — 그 파일의 계약은 kit/motion.test.ts(U2·U3)가 검사한다 */
const MOTION_FILE = join(KIT, "motion.css");
export function lineViolations(file: string, text: string): string[] {
  const rules = file === MOTION_FILE ? RULES.filter((r) => r.name !== "모션 CSS") : RULES;
  return text.split("\n").flatMap((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return [];
    return rules.filter((r) => r.pattern.test(line)).map((r) => `${relative(SRC, file)}:${i + 1} [${r.name}] ${line.trim()}`);
  });
}

describe("킷 가드 (K-AC-01 · K-AC-07)", () => {
  it("app/src/kit 이 있고 레지스트리·3변형 파일이 있다", () => {
    const names = kitFiles().map((f) => relative(KIT, f));
    expect(names).toEqual(expect.arrayContaining(["registry.ts", "kit.css"]));
  });

  it("값 import = react · 킷 내부만", () => {
    expect(kitFiles().flatMap((f) => importViolations(f, readFileSync(f, "utf8")))).toEqual([]);
  });

  it("상태·효과·핸들러 · 모션 · vh · hex · px · 앱 DS 토큰 0", () => {
    expect(kitFiles().flatMap((f) => lineViolations(f, readFileSync(f, "utf8")))).toEqual([]);
  });

  it("탐지기 자체 검사 — 금지 import·패턴을 잡고 import type·주석은 통과", () => {
    const f = join(KIT, "X.tsx");
    expect(importViolations(f, 'import { z } from "zod";\nimport type { PageDoc } from "../engine/contracts/pageDoc";\nimport { a } from "./a";\nimport { B } from "../components/ds/Button";')).toEqual([
      "kit/X.tsx → zod",
      "kit/X.tsx → ../components/ds/Button",
    ]);
    const bad = [
      "const [a] = useState(0);",
      "<a onClick={go} />",
      'className="transition-colors"',
      "height: 100vh;",
      'className="min-h-screen"',
      "color: #fff;",
      "width: 12px;",
      'className="text-label-normal"',
      'className="bg-primary"',
      'className="text-caption2"',
      'className="p-4"',
      'className="rounded-md"',
      "color: var(--fill-normal);",
    ];
    for (const line of bad) expect(lineViolations(f, line)).toHaveLength(1);
    expect(lineViolations(f, '// useState 금지 — 설명\nclassName="bg-(--site-primary) p-(--site-s4) text-(length:--site-t1)"')).toEqual([]);
  });

  it("G1: 모션 CSS 예외는 kit/motion.css 경로 하나만 — 다른 킷 파일(motion.css 이름 흉내 포함)의 animation·transition은 계속 위반", () => {
    const line = "animation: kit-fade var(--site-motion-dur-enter) var(--site-motion-ease-out) 1 backwards;";
    expect(lineViolations(join(KIT, "motion.css"), line)).toEqual([]);
    expect(lineViolations(join(KIT, "motion.css"), "color: #fff;")).toHaveLength(1);
    for (const other of ["kit.css", "fonts.css", "sub/motion.css", "motion.css.ts", "HeroText.tsx"]) expect(lineViolations(join(KIT, other), line), other).toHaveLength(1);
    expect(kitFiles().map((f) => relative(KIT, f))).toContain("motion.css");
  });

  it("렌더 CSS가 킷을 Tailwind 스캔 범위에 넣는다(src/render + src/kit만)", () => {
    const css = readFileSync(join(SRC, "render/render.css"), "utf8");
    expect(css).toMatch(/@source "\.\.\/kit\/?";/);
    expect(css).toMatch(/@import "\.\.\/kit\/kit\.css";/);
  });
});
