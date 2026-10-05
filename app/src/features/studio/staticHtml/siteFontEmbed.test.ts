import { FONT_FAILED, FontLoadError, cssFontFaces, fontNotice, loadSiteFonts, stripFontFaces } from "./siteFontEmbed";

/** 내보내기 글꼴 인라인 (M2B-4a SPEC-MOTION-FONT 2.4 · MF-AC-U7·G4·B9) */
const CSS = [
  "a{color:red}",
  '@font-face{font-family:"Pretendard";font-weight:400;font-style:normal;font-display:swap;src:url(/assets/Pretendard-Regular.subset-AAA.woff2) format("woff2")}',
  '@font-face{font-family:"Pretendard";font-weight:700;font-style:normal;font-display:swap;src:url(/assets/Pretendard-Bold.subset-BBB.woff2) format("woff2")}',
  '@font-face{font-family:"Kit Serif KR";font-weight:400;font-style:normal;font-display:swap;src:url(/assets/KitSerifKR-400-CCC.woff2) format("woff2")}',
  '@font-face{font-family:"Kit Serif KR";font-weight:700;font-style:normal;font-display:swap;src:url(/assets/KitSerifKR-700-DDD.woff2) format("woff2")}',
  "[data-site-root]{font-synthesis:none}",
].join("");
const SERIF = { family: "Noto Serif KR", headingWeight: 700, bodyWeight: 400 };
const bytesOf = (url: string) => new TextEncoder().encode(url).buffer as ArrayBuffer;

describe("내보내기 글꼴 인라인", () => {
  it("킷 CSS의 @font-face 파싱(계열·굵기·url) · 제거하면 @font-face·url 0, 나머지 규칙 그대로", () => {
    expect(cssFontFaces(CSS).map((f) => [f.family, f.weight, f.url])).toEqual([
      ["Pretendard", 400, "/assets/Pretendard-Regular.subset-AAA.woff2"],
      ["Pretendard", 700, "/assets/Pretendard-Bold.subset-BBB.woff2"],
      ["Kit Serif KR", 400, "/assets/KitSerifKR-400-CCC.woff2"],
      ["Kit Serif KR", 700, "/assets/KitSerifKR-700-DDD.woff2"],
    ]);
    expect(stripFontFaces(CSS)).toBe("a{color:red}[data-site-root]{font-synthesis:none}");
  });

  it("쓰는 계열 1개 × 대응 굵기만 받아 data: 규칙 ≤ 2(U7) · 다른 계열 0 · swap · local( 0 · 바이트 = 받은 그대로", async () => {
    const fetchBytes = vi.fn(async (url: string) => bytesOf(url));
    const fonts = await loadSiteFonts(CSS, SERIF, fetchBytes);
    expect(fetchBytes.mock.calls.map((c) => c[0])).toEqual(["/assets/KitSerifKR-700-DDD.woff2", "/assets/KitSerifKR-400-CCC.woff2"]);
    expect(fonts.bytes.map((f) => [f.family, f.weight, new TextDecoder().decode(f.data)])).toEqual([
      ["Kit Serif KR", 700, "/assets/KitSerifKR-700-DDD.woff2"],
      ["Kit Serif KR", 400, "/assets/KitSerifKR-400-CCC.woff2"],
    ]);
    const rules = fonts.css.match(/@font-face\s*\{[^}]*\}/g) ?? [];
    expect(rules).toHaveLength(2);
    for (const rule of rules) {
      expect(rule).toMatch(/font-family:\s*"Kit Serif KR"/);
      expect(rule).toMatch(/font-display:\s*swap/);
      expect(rule).toMatch(/src:\s*url\(data:font\/woff2;base64,[A-Za-z0-9+/=]+\) format\("woff2"\)/);
    }
    expect(fonts.css).not.toMatch(/Pretendard|local\(|\/assets\//);
    expect(atob(fonts.css.match(/base64,([^)]+)\)/)![1]!)).toBe("/assets/KitSerifKR-700-DDD.woff2");
    // 제목 = 본문 대응이면 1개
    expect((await loadSiteFonts(CSS, { family: "Pretendard", headingWeight: 600, bodyWeight: 800 }, fetchBytes)).bytes).toHaveLength(1);
  });

  it("실패 정책(B9): 4.9초 도착 = 성공 · 5초 넘김 = FontLoadError(문구) · 응답 실패·킷 CSS에 면 없음 = FontLoadError", async () => {
    vi.useFakeTimers();
    try {
      const slow = (ms: number) => (url: string) => new Promise<ArrayBuffer>((resolve) => setTimeout(() => resolve(bytesOf(url)), ms));
      const ok = loadSiteFonts(CSS, SERIF, slow(4900));
      await vi.advanceTimersByTimeAsync(4900);
      await expect(ok).resolves.toMatchObject({ bytes: [{ weight: 700 }, { weight: 400 }] });
      const late = loadSiteFonts(CSS, SERIF, slow(5001));
      const settled = expect(late).rejects.toBeInstanceOf(FontLoadError);
      await vi.advanceTimersByTimeAsync(5001);
      await settled;
      await expect(late).rejects.toThrow(FONT_FAILED);
    } finally {
      vi.useRealTimers();
    }
    await expect(loadSiteFonts(CSS, SERIF, async () => Promise.reject(new Error("404")))).rejects.toBeInstanceOf(FontLoadError);
    await expect(loadSiteFonts("a{}", SERIF, async (url) => bytesOf(url))).rejects.toBeInstanceOf(FontLoadError);
  });

  it("시간 초과 뒤 도착한 글꼴은 무시(이미 실패 — 결과 0) · 쓰는 면 0(허용 밖 계열)이면 받지 않음", async () => {
    vi.useFakeTimers();
    try {
      let arrive: (b: ArrayBuffer) => void = () => undefined;
      const result = loadSiteFonts(CSS, SERIF, () => new Promise<ArrayBuffer>((r) => (arrive = r)), 100);
      const settled = expect(result).rejects.toBeInstanceOf(FontLoadError);
      await vi.advanceTimersByTimeAsync(100);
      await settled;
      arrive(new ArrayBuffer(1));
      await vi.advanceTimersByTimeAsync(10);
      await expect(result).rejects.toBeInstanceOf(FontLoadError);
    } finally {
      vi.useRealTimers();
    }
    const fetchBytes = vi.fn(async (url: string) => bytesOf(url));
    expect(await loadSiteFonts(CSS, { family: "system-ui", headingWeight: 700, bodyWeight: 400 }, fetchBytes)).toEqual({ bytes: [], css: "", notice: "" });
    expect(fetchBytes).not.toHaveBeenCalled();
  });

  it("고지 주석(G4): 사용 계열 저작권 줄 + 수정본 표기(Noto 2종) + OFL 1.1 전문 · 계열마다 고정 문자열(사용자 글자 0) · 주석 끝 문자 0", () => {
    const serif = fontNotice("Kit Serif KR");
    expect(serif).toContain("Kit Serif KR is a Modified Version of Noto Serif KR");
    expect(serif).toContain("SIL OPEN FONT LICENSE Version 1.1");
    expect(serif).toContain("PERMISSION & CONDITIONS");
    expect(serif).toContain("DISCLAIMER");
    expect(fontNotice("Kit Sans KR")).toContain("with Reserved Font Name 'Source'");
    expect(fontNotice("Pretendard")).toContain("Copyright (c) 2021, Kil Hyung-jin");
    expect(fontNotice("Pretendard")).not.toContain("is a Modified Version of");
    for (const family of ["Pretendard", "Kit Sans KR", "Kit Serif KR"]) expect(fontNotice(family)).not.toMatch(/-->|--!>/);
    expect(fontNotice("Kit Serif KR")).toBe(serif);
  });
});
