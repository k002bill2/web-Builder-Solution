import { SAMPLE_KIT_TOKENS } from "../render/testing/sampleKitTokens";
import { fontStack, siteFaces, siteWeight } from "./siteFonts";
import { kitVars } from "./tokens";

/** 사이트 글꼴 (M2B-4a · SPEC-MOTION-FONT 2.1·2.2 · MF-AC-U6·U8) */
describe("사이트 글꼴 — 별칭·굵기 대응", () => {
  it("굵기 대응(U6): ≤ 550 → 400 · > 550 → 700", () => {
    expect([300, 400, 550, 551, 700, 900].map(siteWeight)).toEqual([400, 400, 400, 700, 700, 700]);
  });

  it("쓰는 면 = 프로필 계열 1개의 별칭 × 대응 굵기(제목 = 본문 대응이면 1개) · 허용 밖 계열 = 0", () => {
    expect(siteFaces({ family: "Noto Serif KR", headingWeight: 700, bodyWeight: 400 })).toEqual([
      { family: "Kit Serif KR", weight: 700 },
      { family: "Kit Serif KR", weight: 400 },
    ]);
    expect(siteFaces({ family: "Pretendard", headingWeight: 600, bodyWeight: 900 })).toEqual([{ family: "Pretendard", weight: 700 }]);
    expect(siteFaces({ family: "Noto Sans KR", headingWeight: 300, bodyWeight: 500 })).toEqual([{ family: "Kit Sans KR", weight: 400 }]);
    expect(siteFaces({ family: "Arial", headingWeight: 700, bodyWeight: 400 })).toEqual([]);
  });

  it("글꼴 스택(U8): 맨 앞 = 별칭 · 원본 Noto 이름 0 · sans/serif 시스템 대체", () => {
    expect(fontStack("Pretendard")).toBe('"Pretendard", system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif');
    expect(fontStack("Noto Sans KR")).toBe('"Kit Sans KR", system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif');
    expect(fontStack("Noto Serif KR")).toBe('"Kit Serif KR", "AppleMyungjo", "Batang", serif');
    for (const family of ["Pretendard", "Noto Sans KR", "Noto Serif KR"]) expect(fontStack(family)).not.toMatch(/Noto/);
  });

  it("킷 토큰 굵기 = 대응값(파일 없는 굵기 0) · --site-font = 별칭 스택", () => {
    const v = kitVars({ ...SAMPLE_KIT_TOKENS, type: { ...SAMPLE_KIT_TOKENS.type, family: "Noto Sans KR", headingWeight: 551, bodyWeight: 300 } });
    expect([v["--site-weight-heading"], v["--site-weight-body"]]).toEqual(["700", "400"]);
    expect(v["--site-font"]).toMatch(/^"Kit Sans KR", /);
  });
});
