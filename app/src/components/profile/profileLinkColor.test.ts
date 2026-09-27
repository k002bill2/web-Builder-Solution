// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * PROFILE-V2-COMPACT 3 — 프로필 영역 링크·글자는 주 색 글자 토큰(`text-primary-text`, 대비 4.6 보장)만.
 * 접미사 없는 `text-primary`(면 색 — 흰 배경 글자 대비 미보장)를 프로필 화면 소스에서 금지한다. hover 변형(`text-primary-hover`)은 허용.
 */
const SRC = fileURLToPath(new URL("../../", import.meta.url));
const tsxIn = (dir: string) => readdirSync(join(SRC, dir)).filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx")).map((f) => join(SRC, dir, f));
const FILES = [join(SRC, "pages/ProfilePage.tsx"), ...tsxIn("components/profile"), ...tsxIn("features/profile")];

describe("프로필 영역 링크 색 가드", () => {
  it("접미사 없는 text-primary를 쓰지 않는다 (text-primary-text만)", () => {
    const hits = FILES.flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .map((text, i) => ({ text, at: `${relative(SRC, file)}:${i + 1}` }))
        .filter(({ text }) => /(^|[\s"'`:])text-primary(?![-\w])/.test(text))
        .map(({ at }) => at),
    );
    expect(FILES.length).toBeGreaterThan(8);
    expect(hits).toEqual([]);
  });
});
