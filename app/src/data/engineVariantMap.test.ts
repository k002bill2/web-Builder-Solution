// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { SECTION_LIBRARY } from "../domain/sectionLibrary";
import { getSectionDefinition, isSectionType } from "../engine/sections/registry";
import { ENGINE_VARIANT_MAP, mapVariant } from "./engineVariantMap";

const BOUND = ["header", "hero", "footer"] as const;
const SRC = fileURLToPath(new URL("../", import.meta.url));
const listFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => (statSync(join(dir, name)).isDirectory() ? listFiles(join(dir, name)) : [join(dir, name)]));

describe("변형 매핑 표 가드 (SPEC 8.2.1 · VARIANT-MAP)", () => {
  it("bound 행(header·hero·footer) = SECTION_LIBRARY 키 집합 · 모두 그대로", () => {
    const bound = Object.keys(ENGINE_VARIANT_MAP).filter((k) => BOUND.some((t) => k.startsWith(`${t}/`)));
    const library = BOUND.flatMap((t) => Object.keys(SECTION_LIBRARY.sections[t]).map((v) => `${t}/${v}`));
    expect([...bound].sort()).toEqual([...library].sort());
    for (const key of bound) expect(ENGINE_VARIANT_MAP[key]![0]).toBe(key.split("/")[1]);
  });

  it("모든 목적지 ⊂ 엔진 레지스트리 · 유형은 바꾸지 않는다", () => {
    for (const [key, [to]] of Object.entries(ENGINE_VARIANT_MAP)) {
      const type = key.split("/")[0]!;
      expect(isSectionType(type), key).toBe(true);
      expect(getSectionDefinition(type as never, to), `${key} → ${to}`).toBeDefined();
    }
  });

  it("VARIANT-MAP 1~42행(고유 43쌍) 대표 쌍 — 쌍 키(services/grid-3 ≠ portfolio/grid-3) · 표 밖 = undefined", () => {
    expect(mapVariant("services", "grid-3")).toBe("cards-3");
    expect(mapVariant("portfolio", "grid-3")).toBe("grid-3");
    expect(mapVariant("services", "grid-2")).toBe("cards-2");
    expect(mapVariant("services", "masonry")).toBe("cards-masonry");
    expect(mapVariant("portfolio", "masonry")).toBe("masonry");
    expect(mapVariant("portfolio", "grid-2")).toBe("grid-3");
    expect(mapVariant("contact", "order-form")).toBe("form");
    expect(mapVariant("contact", "booking")).toBe("booking");
    expect(mapVariant("footer", "minimal-biz")).toBe("minimal-biz");
    expect(mapVariant("about", "gallery")).toBeUndefined();
    expect(mapVariant("gallery" as never, "grid")).toBeUndefined();
    expect(Object.keys(ENGINE_VARIANT_MAP)).toHaveLength(43);
  });

  it("표 리터럴을 가진 비테스트 파일은 engineVariantMap.ts 1개", () => {
    const holders = listFiles(SRC)
      .filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f))
      .filter((f) => /["']about\/team-grid-3["']|["']services\/schedule-table["']/.test(readFileSync(f, "utf8")))
      .map((f) => relative(SRC, f));
    expect(holders).toEqual(["data/engineVariantMap.ts"]);
  });
});
