// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "zod/mini";

/**
 * zod jitless 가드 (#89) — zod는 z.object를 만들 때 JIT 가능 여부를 `new Function("")`으로 시험한다.
 * CSP(script-src 'self')는 try/catch로 삼킨 이 시험도 위반으로 기록하므로, zod를 쓰는 모듈은 스키마를 만들기 전에 jitless를 켠다.
 * 공용 설정 모듈을 두지 않는 까닭: zod는 조작 뒤 청크 3곳에서만 쓰여 공용 모듈이 작은 공유 청크를 새로 만든다(번들 예산).
 */
const SRC = fileURLToPath(new URL("..", import.meta.url));
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [join(dir, entry.name)] : [],
  );
const zodModules = walk(SRC).filter((file) => /from "zod(\/mini)?"/.test(readFileSync(file, "utf8")));

describe("zod jitless", () => {
  it("zod를 쓰는 모듈이 있다(가드가 비어 있지 않다)", () => {
    expect(zodModules.map((file) => relative(SRC, file)).sort()).toEqual(["data/persistence/jobRecord.ts", "domain/adjustmentSchema.ts", "domain/boardInput.ts"]);
  });

  it.each(zodModules.map((file) => [relative(SRC, file), file]))("%s를 불러오면 jitless가 켜진다", async (_name, file) => {
    config({ jitless: false });
    vi.resetModules();
    await import(/* @vite-ignore */ file);
    expect(config().jitless).toBe(true);
  });
});
