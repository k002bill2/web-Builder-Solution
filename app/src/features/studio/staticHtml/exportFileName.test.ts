import { exportFileStem, reactZipFileName, staticHtmlFileName, staticZipFileName } from "./exportFileName";

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

  it("EXP-AC-15 zip판 = <정리된 이름>_r<revision>.zip (같은 정리 규칙)", () => {
    expect(staticZipFileName("  강남 카페/리브랜딩:2호점  ", 12)).toBe("강남-카페-리브랜딩-2호점_r12.zip");
    expect(staticZipFileName("con", 1)).toBe("page-con_r1.zip");
  });

  it("RZ-AC-19 React zip판 = <정리된 이름>_r<revision>_react.zip (RZQ-03 A — 같은 정리 규칙 · 정적 zip과 이름이 겹치지 않는다)", () => {
    expect(reactZipFileName("  강남 카페/리브랜딩:2호점  ", 12)).toBe("강남-카페-리브랜딩-2호점_r12_react.zip");
    expect(reactZipFileName("con", 1)).toBe("page-con_r1_react.zip");
    expect(reactZipFileName("", 3)).toBe("page_r3_react.zip");
    expect(reactZipFileName("가게", 2)).not.toBe(staticZipFileName("가게", 2));
  });
});
