import { exportFileStem, staticHtmlFileName } from "./exportFileName";

/** K-AC-32 파일 이름 규칙(m2a 3.3) — HTML판은 폭 표기 없음 `<이름>_r<revision>.html` (REPORT 8절) */
describe("내보내기 파일 이름 (K-AC-32 · HTML판)", () => {
  it.each([
    ["  강남 카페/리브랜딩:2호점  ", "강남-카페-리브랜딩-2호점"],
    ["???", "page"],
    ["con", "page-con"],
    ["LPT9", "page-LPT9"],
    ["..카페..", "카페"],
    ["a  b\tc", "a-b-c"],
    ["카́페", "카́페".normalize("NFC")],
  ])("%j → %j", (name, stem) => {
    expect(exportFileStem(name)).toBe(stem);
  });

  it("41자 이상 → 40자(코드 포인트) · 서로게이트 쌍을 자르지 않는다", () => {
    expect([...exportFileStem("가".repeat(45))]).toHaveLength(40);
    const emoji = exportFileStem(`${"가".repeat(39)}😀😀`);
    expect([...emoji]).toHaveLength(40);
    expect(emoji.endsWith("😀")).toBe(true);
    expect(emoji).not.toMatch(/[\uD800-\uDBFF]$/);
  });

  it("HTML판 = <정리된 이름>_r<revision>.html", () => {
    expect(staticHtmlFileName("  강남 카페/리브랜딩:2호점  ", 12)).toBe("강남-카페-리브랜딩-2호점_r12.html");
  });
});
