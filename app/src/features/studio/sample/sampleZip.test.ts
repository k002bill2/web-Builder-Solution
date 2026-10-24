import { SAMPLE_ENTRY_NAMES, SAMPLE_README, sampleZip, sampleZipEntries, sampleZipFileName } from "./sampleZip";

const parts = { png: new Uint8Array([137, 80, 78, 71]), html: new TextEncoder().encode("<!doctype html>"), tokensJson: "{}\n", sectionsJson: "{}\n" };

describe("디자인 샘플 묶음 zip (SMP-AC-A01 조립부)", () => {
  it("엔트리 5개 — PNG·HTML·design-tokens.json·sections.json·README.txt", () => {
    expect(sampleZipEntries(parts).map((e) => e.name)).toEqual(["design.png", "design.html", "design-tokens.json", "sections.json", "README.txt"]);
    expect(SAMPLE_ENTRY_NAMES).toHaveLength(5);
  });

  it("README는 실제 파일 목록을 적는다(Example 아님)", () => {
    SAMPLE_ENTRY_NAMES.filter((n) => n !== "README.txt").forEach((n) => expect(SAMPLE_README).toContain(n));
    expect(SAMPLE_README).not.toMatch(/example/i);
  });

  it("zip Blob 1개 · 파일명 {이름}_r{rev}_sample.zip", () => {
    expect(sampleZip(parts, new Date(2026, 9, 25))).toBeInstanceOf(Blob);
    expect(sampleZipFileName("모던 카페", 3)).toBe("모던-카페_r3_sample.zip");
  });
});
