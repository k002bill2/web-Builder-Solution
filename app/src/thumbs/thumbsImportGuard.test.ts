// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/** M3P-AC-G3 정적 가드 — 썸네일 SSR 빌드 도구(src/thumbs)·react-dom/server는 앱·렌더 문서 소스가 import하지 않는다(manifest 검사는 check-bundle-size) */
const SRC = fileURLToPath(new URL("../", import.meta.url));
const list = (dir: string): string[] => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? list(join(dir, n)) : [join(dir, n)]));
const product = list(SRC).filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.startsWith(join(SRC, "thumbs")));

describe("썸네일 빌드 도구 import 가드 (M3P-AC-G3)", () => {
  it("src/thumbs 밖 제품 파일이 thumbs·react-dom/server를 import하지 않는다", () => {
    expect(product.length).toBeGreaterThan(20);
    const bad = product.filter((f) => /from\s*["'][^"']*\/thumbs\/|import\(\s*["'][^"']*\/thumbs\/|["']react-dom\/server["']/.test(readFileSync(f, "utf8")));
    expect(bad.map((f) => relative(SRC, f))).toEqual([]);
  });
});
