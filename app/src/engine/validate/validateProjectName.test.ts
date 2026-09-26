import { validateProjectName } from "./validateProjectName";

describe("validateProjectName (SPEC J-S06 · 8.3 renameProject)", () => {
  it("앞뒤 공백을 지운 값을 돌려준다", () => {
    expect(validateProjectName("  카페 홈  ")).toEqual({ ok: true, value: "카페 홈" });
  });

  it("1자 · 40자 경계 통과 (코드 포인트 기준)", () => {
    expect(validateProjectName("a").ok).toBe(true);
    expect(validateProjectName("가".repeat(40)).ok).toBe(true);
    expect(validateProjectName("😀".repeat(40)).ok).toBe(true);
  });

  it.each([
    ["빈 문자열", ""],
    ["공백만", "   \t "],
    ["41자", "가".repeat(41)],
    ["공백 제거 뒤도 41자", ` ${"a".repeat(41)} `],
  ])("%s 거부", (_, name) => {
    const result = validateProjectName(name);
    expect(result).toMatchObject({ ok: false, code: "SCHEMA_INVALID" });
  });

  it.each([null, undefined, 3, {}, ["a"]])("문자열이 아닌 값 %j 거부", (name) => {
    expect(validateProjectName(name)).toMatchObject({ ok: false, code: "SCHEMA_INVALID", issues: [{ path: "$" }] });
  });
});
