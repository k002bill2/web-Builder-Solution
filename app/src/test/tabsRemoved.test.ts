// @vitest-environment node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/** V2-3 · SPEC B-4: 카탈로그(V2-2)와 상세(V2-3)에서 탭이 빠져 `Tabs` 사용처가 0이 되면 컴포넌트를 지운다. */
const SRC = fileURLToPath(new URL("../", import.meta.url));

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

const product = listFiles(SRC).filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f));
const hits = (pattern: RegExp) =>
  product.filter((file) => pattern.test(readFileSync(file, "utf8"))).map((file) => relative(SRC, file));

/** 편집기 탭(EDITOR-A2-SHELL S5) — 이 파일만 허용 */
const STUDIO_TABS = "components/studio/StudioTabs.tsx";

describe("Tabs 삭제 가드 (V2-3 · B-4)", () => {
  it("components/ds/Tabs.tsx와 상세 탭 모듈이 없다", () => {
    expect(existsSync(join(SRC, "components/ds/Tabs.tsx"))).toBe(false);
    expect(existsSync(join(SRC, "features/detail/detailTabs.ts"))).toBe(false);
  });

  it("제품 코드에 Tabs import·tablist 역할이 0건이다(편집기 <1024 탭 부품 1개만 예외)", () => {
    expect(hits(/from\s+["'][^"']*\/Tabs["']/)).toEqual([]);
    // DS-2A-05 SPEC 6.2 · S-B6: 편집기 <1024 탭은 DS가 아니라 studio 청크 안 작은 부품 — 카탈로그·상세에는 여전히 0건
    expect(hits(/role=["']tab(list|panel)?["']/)).toEqual([STUDIO_TABS]);
    expect(existsSync(join(SRC, STUDIO_TABS))).toBe(true);
  });
});
