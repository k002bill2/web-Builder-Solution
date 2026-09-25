// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = fileURLToPath(new URL("../", import.meta.url));
/** 검사 대상: 화면·컴포넌트 디렉터리 전체(테스트 포함). fixtures(데이터)는 대상 밖. */
const SCANNED_DIRS = ["components", "pages"].map((d) => join(SRC, d));

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

const scanned = SCANNED_DIRS.flatMap(listFiles).filter((f) => /\.(ts|tsx|css)$/.test(f));

describe("스타일 하드코딩 금지", () => {
  it("검사할 화면·컴포넌트 파일이 있다", () => {
    expect(scanned.length).toBeGreaterThan(0);
  });

  it("src/components·src/pages에 hex·px 하드코딩이 0건이다", () => {
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
