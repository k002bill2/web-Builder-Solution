import { describe, expect, it } from "vitest";
import { brand } from "../../../brand/brand.config";
import { licensesMarkdown } from "./licenses";

/** M4-a SPEC 3절 · EXP-AC-10 — LICENSES.md 구조(문안은 Hemingway 후속 — 자리표시 문장) */
const INPUT = { family: "Kit Sans KR", fonts: ["assets/fonts/KitSansKR-400.woff2", "assets/fonts/KitSansKR-700.woff2"], images: ["assets/images/img-01.webp", "assets/images/img-02.jpg"], lost: 0 };
const headings = (md: string) => md.split("\n").filter((line) => /^#{1,2} /.test(line));

describe("LICENSES.md (EXP-AC-10)", () => {
  it("5개 절 고정 순서: 머리 → 글꼴 → 이미지(사용자 업로드) → 그래픽(자체 생성) → 코드·스타일", () => {
    const md = licensesMarkdown(INPUT);
    expect(headings(md)).toEqual(["# LICENSES", "## 글꼴 — Kit Sans KR", "## 이미지 — 사용자 업로드", "## 그래픽 — 자체 생성", "## 코드·스타일"]);
  });

  it("머리 = 묶음 파일 수 · 글꼴 절 = 파일 경로 · 저작권 문장 · SIL Open Font License 1.1 · Reserved Font Name · 라이선스 전문 · assets/fonts/OFL.txt 안내", () => {
    const md = licensesMarkdown(INPUT);
    // index.html + LICENSES.md + 글꼴 2 + OFL.txt + 이미지 2 = 7
    expect(md).toContain("파일 7개");
    for (const text of [...INPUT.fonts, "Modified Version of Noto Sans KR", "SIL Open Font License 1.1", "Reserved Font Name", "SIL OPEN FONT LICENSE Version 1.1", "assets/fonts/OFL.txt"]) expect(md).toContain(text);
  });

  it("이미지 절 = 파일 목록 그대로 · 0장이면 '올린 이미지 없음' 1줄 · 잃은 이미지는 그래픽 절에 개수 1줄", () => {
    const md = licensesMarkdown(INPUT);
    for (const name of INPUT.images) expect(md).toContain(`- ${name}`);
    const none = licensesMarkdown({ ...INPUT, images: [], lost: 2 });
    expect(none).toContain("올린 이미지 없음");
    expect(none).toContain("2장");
    expect(licensesMarkdown({ ...INPUT, lost: 0 })).not.toMatch(/잃은|다시 골라야/);
  });

  it("글꼴 없음(허용 밖 계열) = 글꼴 절 '동봉한 글꼴 없음' · OFL.txt 안내 0", () => {
    const md = licensesMarkdown({ ...INPUT, family: undefined, fonts: [] });
    expect(headings(md)[1]).toBe("## 글꼴");
    expect(md).toContain("동봉한 글꼴 없음");
    expect(md).not.toContain("OFL.txt");
  });

  it("결정적 · 사용자 글자 0 · 제품 브랜드 0(Q8·Q10)", () => {
    expect(licensesMarkdown(INPUT)).toBe(licensesMarkdown({ ...INPUT }));
    const legacy = ["a", "p", "f", "s"].join("");
    expect(licensesMarkdown(INPUT).toLowerCase()).not.toContain(brand.name.toLowerCase());
    expect(licensesMarkdown(INPUT).toLowerCase()).not.toContain(legacy);
  });
});
