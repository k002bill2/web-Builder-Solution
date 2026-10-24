import { describe, expect, it } from "vitest";
import { brand } from "../../../brand/brand.config";
import { licensesMarkdown } from "./licenses";

/** M4-a SPEC 3절 · EXP-AC-10 — LICENSES.md 구조 + 고정 문안(M4-a-5 COPY.md 1절 '이후' — Hemingway, 영환님 승인) */
const COPY = {
  head: (files: number) => `이 묶음에는 샘플 파일(index.html), 권리·이용 조건 안내(LICENSES.md), 동봉 자산을 포함해 총 ${files}개 파일이 들어 있습니다.`,
  noFont: "동봉한 글꼴 파일이 없습니다.",
  fontLicense:
    "동봉한 글꼴에는 SIL Open Font License 1.1이 적용됩니다. 원본 글꼴과 수정 사항은 아래 고지를 참고하세요. 원본에서 글자 일부를 추리거나 파일 형식을 변환한 글꼴은 이 라이선스에서 수정본(Modified Version)으로 정의합니다. 예약 글꼴 이름(Reserved Font Name)은 아래 저작권 고지에 명시된 이름을 뜻합니다. 수정본에서 해당 이름을 사용자에게 표시되는 주된 글꼴 이름으로 사용하려면 해당 저작권자의 명시적인 서면 허가가 필요합니다. 라이선스 전문은 아래와 assets/fonts/OFL.txt에 있습니다.",
  noImage: "동봉한 사용자 업로드 이미지가 없습니다.",
  imageRights:
    "이 절의 이미지 파일은 샘플을 만든 사용자가 업로드한 자료입니다. 이미지의 권리는 해당 권리자에게 있으며, 업로드한 사용자는 이용·배포에 필요한 권한을 확인해야 합니다. 생성 도구는 업로드한 이미지에 대한 권리를 주장하지 않습니다.",
  graphics: "이미지가 없거나 누락된 자리에 표시되는 자체 그래픽(인라인 SVG·CSS)은 생성 도구의 산출물입니다. 생성 도구는 이 자체 그래픽에 대한 권리를 주장하지 않으며, 제약 없이 사용·수정할 수 있습니다.",
  lost: (lost: number) => `이미지 ${lost}장을 불러오지 못해 해당 자리에 자체 그래픽을 표시했습니다.`,
  code: "index.html 안의 CSS와 메뉴 스크립트는 생성 도구의 산출물입니다. 생성 도구는 이 코드·스타일에 대한 권리를 주장하지 않으며, 제약 없이 사용·수정할 수 있습니다. 이 코드·스타일에는 제3자 코드가 포함되어 있지 않습니다.",
};
/** 제목·경로 목록·OFL 전문 블록을 뺀 문단(= 고정 문장만 남아야 함) */
const prose = (md: string) =>
  md
    .replace(/```text\n[\s\S]*?\n```/g, "")
    .split("\n\n")
    .map((block) => block.trim())
    .filter((block) => block !== "" && !/^#{1,2} /.test(block) && !block.startsWith("- "));
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
    expect(md).toContain(COPY.head(7));
    expect(md).toContain(COPY.fontLicense);
    for (const text of [...INPUT.fonts, "Modified Version of Noto Sans KR", "SIL Open Font License 1.1", "Reserved Font Name", "SIL OPEN FONT LICENSE Version 1.1", "assets/fonts/OFL.txt"]) expect(md).toContain(text);
  });

  it("이미지 절 = 파일 목록 그대로 · 0장이면 '동봉한 사용자 업로드 이미지가 없습니다.' 1줄 · 잃은 이미지는 그래픽 절에 개수 1줄", () => {
    const md = licensesMarkdown(INPUT);
    for (const name of INPUT.images) expect(md).toContain(`- ${name}`);
    const none = licensesMarkdown({ ...INPUT, images: [], lost: 2 });
    expect(none).toContain(COPY.noImage);
    expect(none).toContain(COPY.lost(2));
    expect(licensesMarkdown({ ...INPUT, lost: 0 })).not.toMatch(/잃은|다시 골라야|불러오지 못해/);
  });

  it("글꼴 없음(허용 밖 계열) = 글꼴 절 '동봉한 글꼴 파일이 없습니다.' · OFL.txt 안내 0", () => {
    const md = licensesMarkdown({ ...INPUT, family: undefined, fonts: [] });
    expect(headings(md)[1]).toBe("## 글꼴");
    expect(md).toContain(COPY.noFont);
    expect(md).not.toContain("OFL.txt");
  });

  it("결정적 · 사용자 글자 0 · 제품 브랜드 0(Q8·Q10)", () => {
    expect(licensesMarkdown(INPUT)).toBe(licensesMarkdown({ ...INPUT }));
    const legacy = ["a", "p", "f", "s"].join("");
    expect(licensesMarkdown(INPUT).toLowerCase()).not.toContain(brand.name.toLowerCase());
    expect(licensesMarkdown(INPUT).toLowerCase()).not.toContain(legacy);
  });

  it("고정 문안 = COPY.md 1절 '이후' 글자 그대로 · 문단은 고정 문장만(사용자 글자 0)", () => {
    expect(prose(licensesMarkdown(INPUT))).toEqual([COPY.head(7), COPY.fontLicense, COPY.imageRights, COPY.graphics, COPY.code]);
    expect(prose(licensesMarkdown({ family: undefined, fonts: [], images: [], lost: 3 }))).toEqual([COPY.head(2), COPY.noFont, COPY.noImage, COPY.imageRights, COPY.graphics, COPY.lost(3), COPY.code]);
  });

  it("결정적 바이트(같은 입력 2회 → 같은 UTF-8 바이트) · 마지막 개행 1개", () => {
    const enc = new TextEncoder();
    for (const input of [INPUT, { ...INPUT, family: undefined, fonts: [], images: [], lost: 1 }]) {
      expect(enc.encode(licensesMarkdown(input))).toEqual(enc.encode(licensesMarkdown({ ...input })));
      expect(licensesMarkdown(input)).toMatch(/[^\n]\n$/);
    }
  });

  it("F-14 대상 문자열 0 — brand.name · 이전 브랜드 4글자(대소문자 무시) · 이전 토큰 접두어 (글꼴 있음·없음 두 분기)", () => {
    const legacy = ["a", "p", "f", "s"].join("");
    for (const input of [INPUT, { ...INPUT, family: undefined, fonts: [], images: [], lost: 1 }]) {
      const md = licensesMarkdown(input).toLowerCase();
      for (const banned of [brand.name.toLowerCase(), legacy, `--${legacy}-`]) expect(md).not.toContain(banned);
    }
  });
});
