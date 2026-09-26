// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { INFERRED_REASONS, REASONS } from "./reasons";

const SPEC = readFileSync(fileURLToPath(new URL("../../../../docs/design/2a-05/SPEC.md", import.meta.url)), "utf8");

describe("이유 문장 = SPEC 5.2·5.4·E-S12 문구 그대로", () => {
  const quoted = Object.entries(REASONS).filter(([key]) => !(INFERRED_REASONS as readonly string[]).includes(key));

  it.each(quoted)("%s", (_, sentence) => {
    expect(SPEC).toContain(`"${sentence}"`);
  });

  it("유추 문장은 SPEC에 없다(REPORT에 유추로 표시)", () => {
    for (const key of INFERRED_REASONS) expect(SPEC).not.toContain(`"${REASONS[key]}"`);
  });
});
