import { describe, expect, it } from "vitest";
import type { ZipEntry } from "./storeZip";
import { ZIP_MAX, checkZipEntries, fontFileName, imageFileNames, orderZipEntries, tooLargeText } from "./staticZip";

/** M4-a SPEC 2.1·2.2·2.4·2.5·4.3 — zip 구성·이름·순서·허용표 */
const enc = new TextEncoder();
const WEBP = new Uint8Array([...enc.encode("RIFF"), 0, 0, 0, 0, ...enc.encode("WEBP")]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
const WOFF2 = enc.encode("wOF2....");
const blob = (type: string) => ({ blob: new Blob(["x"], { type }), width: 1, height: 1 });
const html = (body: string, css = "") => enc.encode(`<!doctype html><html><head><style>${css}</style></head><body>${body}</body></html>`);
const FONT_CSS = "@font-face{src:url(assets/fonts/KitSansKR-400.woff2)}";
const entry = (name: string, data: Uint8Array): ZipEntry => ({ name, data });
const valid = () => [
  entry("index.html", html('<img src="assets/images/img-01.webp"><img src="assets/images/img-02.jpg">', FONT_CSS)),
  entry("LICENSES.md", enc.encode("# LICENSES")),
  entry("assets/fonts/KitSansKR-400.woff2", WOFF2),
  entry("assets/fonts/OFL.txt", enc.encode("OFL")),
  entry("assets/images/img-01.webp", WEBP),
  entry("assets/images/img-02.jpg", JPG),
];

describe("이미지 파일 이름 (SPEC 2.2 · EXP-AC-06)", () => {
  it("markup의 image:<id> 첫 등장 순 img-01부터 · 같은 id = 파일 1개 · 확장자 = Blob type(webp·jpg·png)", () => {
    const markup = '<img src="image:b"><img src="image:a"><img src="image:b"><img src="image:c">';
    const names = imageFileNames(markup, { a: blob("image/jpeg"), b: blob("image/webp"), c: blob("image/png") });
    expect([...names]).toEqual([
      ["b", "assets/images/img-01.webp"],
      ["a", "assets/images/img-02.jpg"],
      ["c", "assets/images/img-03.png"],
    ]);
  });

  it("markup에 없는 id는 파일 0(고아 0) · 99장 넘으면 3자리 · 그 밖 type = 실패", () => {
    expect([...imageFileNames('<img src="image:a">', { a: blob("image/png"), z: blob("image/png") }).keys()]).toEqual(["a"]);
    const many = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`i${i}`, blob("image/png")]));
    const markup = Object.keys(many).map((id) => `<img src="image:${id}">`).join("");
    expect(imageFileNames(markup, many).get("i99")).toBe("assets/images/img-100.png");
    expect(() => imageFileNames('<img src="image:g">', { g: blob("image/gif") })).toThrow();
  });
});

describe("글꼴 파일 이름 (SPEC 2.1 · Q19)", () => {
  it("계열 이름의 영문자만 + 굵기 3자리", () => {
    expect(fontFileName("Kit Sans KR", 400)).toBe("KitSansKR-400.woff2");
    expect(fontFileName("Pretendard", 700)).toBe("Pretendard-700.woff2");
  });
});

describe("entry 순서 (SPEC 2.4 — 결정적)", () => {
  it("index.html → LICENSES.md → assets/fonts/*(이름순) → assets/images/*(번호순)", () => {
    const shuffled = [...valid()].reverse();
    expect(orderZipEntries(shuffled).map((e) => e.name)).toEqual(valid().map((e) => e.name));
    const hundred = orderZipEntries([entry("assets/images/img-100.png", PNG), entry("assets/images/img-99.png", PNG)]);
    expect(hundred.map((e) => e.name)).toEqual(["assets/images/img-99.png", "assets/images/img-100.png"]);
  });
});

describe("zip 허용표 (SPEC 4.3 · EXP-AC-05·07·09)", () => {
  it("허용표 안 묶음 = 통과", () => {
    expect(() => checkZipEntries(valid())).not.toThrow();
  });

  it.each([
    ["허용표 밖 파일", (e: ZipEntry[]) => [...e, entry("assets/site.css", enc.encode("x"))]],
    ["index.html 없음", (e: ZipEntry[]) => e.filter((x) => x.name !== "index.html")],
    ["LICENSES.md 없음", (e: ZipEntry[]) => e.filter((x) => x.name !== "LICENSES.md")],
    ["글꼴 3개", (e: ZipEntry[]) => [...e, entry("assets/fonts/KitSansKR-500.woff2", WOFF2), entry("assets/fonts/KitSansKR-700.woff2", WOFF2)]],
    ["글꼴 서명 아님", (e: ZipEntry[]) => e.map((x) => (x.name.endsWith(".woff2") ? entry(x.name, enc.encode("<html>")) : x))],
    ["글꼴 있는데 OFL.txt 없음", (e: ZipEntry[]) => e.filter((x) => !x.name.endsWith("OFL.txt"))],
    ["확장자 ↔ 서명 불일치", (e: ZipEntry[]) => e.map((x) => (x.name.endsWith(".jpg") ? entry(x.name, PNG) : x))],
    ["고아 이미지(index.html이 참조 안 함)", (e: ZipEntry[]) => [...e, entry("assets/images/img-03.png", PNG)]],
    ["끊긴 참조(entry 없음)", (e: ZipEntry[]) => e.filter((x) => !x.name.endsWith("img-02.jpg"))],
    ["고아 글꼴", (e: ZipEntry[]) => [...e, entry("assets/fonts/KitSansKR-700.woff2", WOFF2)]],
  ])("%s = 실패", (_name, mutate) => {
    expect(() => checkZipEntries(mutate(valid()))).toThrow(/zip/);
  });

  it("글꼴 0개면 OFL.txt도 0이어야 한다", () => {
    const noFont = valid().filter((x) => !x.name.startsWith("assets/fonts/")).map((x) => (x.name === "index.html" ? entry("index.html", html('<img src="assets/images/img-01.webp"><img src="assets/images/img-02.jpg">')) : x));
    expect(() => checkZipEntries(noFont)).not.toThrow();
    expect(() => checkZipEntries([...noFont, entry("assets/fonts/OFL.txt", enc.encode("OFL"))])).toThrow(/zip/);
  });
});

describe("크기 상한 (SPEC 2.5 · Q7 · EXP-AC-14)", () => {
  it("ZIP_MAX = 64MB · 초과 문구에 크기·상한", () => {
    expect(ZIP_MAX).toBe(64 * 1024 * 1024);
    expect(tooLargeText(70 * 1024 * 1024)).toBe("묶음이 70.0MB로 상한 64MB를 넘어 만들지 않았습니다 — 큰 이미지를 줄여 주세요");
  });
});
