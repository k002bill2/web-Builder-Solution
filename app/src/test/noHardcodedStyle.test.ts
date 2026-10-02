// @vitest-environment node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = fileURLToPath(new URL("../", import.meta.url));
/** 검사 대상: 화면·컴포넌트 디렉터리 전체(테스트 포함). fixtures(데이터)는 대상 밖. */
const SCANNED_DIRS = ["components", "pages", "render"].map((d) => join(SRC, d));
/**
 * src/styles/의 컴포넌트용 CSS(예: versionDiff.css)도 검사한다 (DS-2A-04 N-Q4 A). 새 CSS 파일은 자동으로 대상이 된다.
 * 명시 제외 — 값의 정본이거나 전역 기반이라 원래 값을 담는 파일(src/styles 기준 경로, 끝이 `/`면 폴더 전체):
 *  - `tokens/` 토큰 원본(colors·typography·spacing·shape·fonts·brand·base.css — 원본 복사본·전역 기반 포함)
 *  - `theme.css` 토큰 → Tailwind 테마 연결(전역 기반)
 * styles/의 테스트 파일(.ts·.tsx)은 대상 밖(견본 값을 검사하는 테스트).
 */
const STYLES = join(SRC, "styles");
const STYLE_EXCLUDED = ["tokens/", "theme.css"];
const isExcludedStyle = (file: string) => {
  const path = relative(STYLES, file);
  return STYLE_EXCLUDED.some((entry) => (entry.endsWith("/") ? path.startsWith(entry) : path === entry));
};

const RULES: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  { name: "hex 색상", pattern: /#[0-9a-f]{3,8}\b/i },
  { name: "text-[..px]", pattern: /\btext-\[[^\]]*px[^\]]*\]/ },
  { name: "임의값 px 유틸리티", pattern: /[\w-]+-\[[^\]]*\d+px[^\]]*\]/ },
  { name: "인라인 style px", pattern: /:\s*["'`]?\d+(\.\d+)?px/ },
];

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

const componentStyles = listFiles(STYLES).filter((f) => f.endsWith(".css") && !isExcludedStyle(f));
const scanned = [...SCANNED_DIRS.flatMap(listFiles).filter((f) => /\.(ts|tsx|css)$/.test(f)), ...componentStyles];

describe("스타일 하드코딩 금지", () => {
  it("검사할 화면·컴포넌트 파일이 있다", () => {
    expect(scanned.length).toBeGreaterThan(0);
  });

  it("src/styles의 컴포넌트용 CSS가 대상이고, 제외 목록 항목은 실제로 있다(낡은 목록 방지)", () => {
    expect(componentStyles.map((f) => relative(STYLES, f))).toContain("versionDiff.css");
    for (const entry of STYLE_EXCLUDED) expect(existsSync(join(STYLES, entry))).toBe(true);
    expect(componentStyles.some((f) => relative(STYLES, f).startsWith("tokens/") || relative(STYLES, f) === "theme.css")).toBe(false);
  });

  it("src/components·src/pages·src/render·src/styles 컴포넌트 CSS에 hex·px 하드코딩이 0건이다", () => {
    const hits = scanned.flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, i) =>
          RULES.filter((r) => r.pattern.test(line)).map(
            (r) => `${relative(SRC, file)}:${i + 1} [${r.name}] ${line.trim()}`,
          ),
        ),
    );
    expect(hits).toEqual([]);
  });
});
