import { brand } from "../../../brand/brand.config";
import { referenceRenderInput } from "../../../thumbs/referenceDoc";
import { ID, KIT_CSS, m1 as m1Of, m2 as m2Of } from "../testing/reactZipFixture";

const m1 = () => m1Of(referenceRenderInput("ref-a"));
const m2 = () => m2Of(referenceRenderInput("ref-a"));
import { fontFileName } from "../zip/staticZip";
import { buildZipSite } from "../zip/zipSite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PageDocument } from "../../../render/PageDocument";
import { fontLicenseText } from "../staticHtml/siteFontEmbed";
import { buildReactZip, reactZipEntries } from "./reactZip";
import { README_MD } from "./reactZipText";
import type { SiteJsonV1 } from "./siteJson";

/** REACTZIP-SPEC 5.2 생성 단위 — RZ-AC-06·07·08·09·16 */
const dec = new TextDecoder();
const entriesOf = (c: ReturnType<typeof m1>) => reactZipEntries({ ...c, css: KIT_CSS });
const textOf = (entries: { name: string; data: Uint8Array }[], name: string) => dec.decode(entries.find((e) => e.name === name)!.data);
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

describe("React zip entry (RZ-AC-06)", () => {
  it("허용표 순서 — 고정 7 → src 고정(이름순) → types → kit(이름순) → 글꼴 → 이미지(번호순) · 디렉터리 entry 0 · ASCII 경로", async () => {
    const names = (await entriesOf(m2())).map((e) => e.name);
    expect(names.slice(0, 13)).toEqual(["package.json", "package-lock.json", "index.html", "vite.config.ts", "tsconfig.json", "README.md", "LICENSES.md", "src/PageDocument.tsx", "src/fonts.css", "src/images.ts", "src/index.css", "src/main.tsx", "src/site.json"]);
    expect(names.slice(13, 15)).toEqual(["src/types/pageDoc.ts", "src/types/protocol.ts"]);
    const kit = names.filter((n) => n.startsWith("src/kit/"));
    expect(kit).toEqual([...kit].sort());
    expect(names.slice(-6)).toEqual(["src/assets/fonts/OFL.txt", "src/assets/fonts/Pretendard-400.woff2", "src/assets/fonts/Pretendard-700.woff2", "src/assets/images/img-01.webp", "src/assets/images/img-02.jpg", "src/assets/images/img-03.png"]);
    expect(names.every((n) => /^[\x21-\x7e]+$/.test(n) && !n.endsWith("/"))).toBe(true);
  });

  it("킷 entry 집합 = app/src/kit 테스트 제외 .ts·.tsx + kit.css·motion.css(fonts.css 제외) · 빈 원문 0 · 킷 밖 import는 ../types/로", async () => {
    const { readdirSync } = await import("node:fs");
    const expected = readdirSync("src/kit").filter((f) => !/\.test\./.test(f) && (/\.tsx?$/.test(f) || f === "kit.css" || f === "motion.css")).map((f) => `src/kit/${f}`).sort();
    const entries = await entriesOf(m1());
    const kit = entries.filter((e) => e.name.startsWith("src/kit/"));
    expect(kit.map((e) => e.name)).toEqual(expected);
    expect(kit.every((e) => dec.decode(e.data).trim().length > 0)).toBe(true);
    const all = kit.map((e) => dec.decode(e.data)).join("\n");
    expect(all).not.toMatch(/from "\.\.\/(engine|render|domain|features)\//);
    expect(textOf(entries, "src/kit/kit.css")).toBe(KIT_CSS["kit.css"]);
  });

  it("타입 원문 치환 2개 — MotionPreset 리터럴 유니온 · LocalImageId = img- 키 · import 0", async () => {
    const pageDoc = textOf(await entriesOf(m1()), "src/types/pageDoc.ts");
    expect(pageDoc).toContain(`type MotionPreset = "L0" | "L1" | "L2";`);
    expect(pageDoc).toContain("export type LocalImageId = `img-${string}`;");
    expect(pageDoc).not.toMatch(/^import /m);
  });
});

describe("결정성 (RZ-AC-07)", () => {
  it("같은 문서·revision 두 번 → 같은 바이트", async () => {
    const c = m2();
    const date = new Date(c.doc.updatedAt);
    const [a, b] = [await buildReactZip({ ...c, date, css: KIT_CSS }), await buildReactZip({ ...m2(), date, css: KIT_CSS })];
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  });
});

describe("site.json (RZ-AC-08 · 2.3.1)", () => {
  it("최상위 = schema·doc·kitTokens·motion·mainStyle·images 순서 · 내부 필드 = 중립 상수 · 사용자 글자는 meta·sections만", async () => {
    const c = m2();
    const site = JSON.parse(textOf(await entriesOf(c), "src/site.json")) as SiteJsonV1;
    expect(Object.keys(site)).toEqual(["schema", "doc", "kitTokens", "motion", "mainStyle", "images"]);
    expect(site.schema).toBe(1);
    expect(site.doc).toMatchObject({ projectId: "site", revision: 0, hash: "", profileVersion: 0, candidateId: "", libraryVersion: "", generatorVersion: "", updatedAt: "" });
    expect(Object.keys(site.doc)).toEqual(["projectId", "revision", "hash", "profileVersion", "candidateId", "libraryVersion", "generatorVersion", "updatedAt", "meta", "sections"]);
    expect(site.kitTokens).toEqual(c.kitTokens);
    // 실효 모션 = 앱 렌더와 같은 값(L0 = 키 없음) · main 변수 = 팔레트 → --canvas-*
    expect(site.motion).toEqual({ "header-1": "L1", "hero-1": "L1", "about-1": "L1", "services-1": "L1" });
    const p = c.kitTokens.palette;
    expect(site.mainStyle).toEqual({ "--canvas-primary": p.primary, "--canvas-surface": p.surface, "--canvas-ink": p.ink, "--canvas-muted": p.muted, "--canvas-bg": p.bg });
    expect(site.doc.meta).toEqual(c.doc.meta);
    expect(site.doc.sections.map((s) => Object.keys(s))).toEqual(c.doc.sections.map(() => ["instanceId", "type", "variant", "motion", "tone", "slots"]));
  });

  it("TS-AC-09 문서 typeScale — site.json doc 키 = 현행 10개(새 키 0) · kitTokens.type.scale = 문서 값 · schema 1", async () => {
    const c = m2();
    const scaled = { ...c, doc: { ...c.doc, typeScale: 1.333 }, kitTokens: { ...c.kitTokens, type: { ...c.kitTokens.type, scale: 1.333 } } };
    const site = JSON.parse(textOf(await entriesOf(scaled), "src/site.json")) as SiteJsonV1;
    expect(site.schema).toBe(1);
    expect(Object.keys(site.doc)).toEqual(["projectId", "revision", "hash", "profileVersion", "candidateId", "libraryVersion", "generatorVersion", "updatedAt", "meta", "sections"]);
    expect(site.kitTokens.type.scale).toBe(1.333);
  });

  it("이미지 source — 고른 id = img-NN(같은 id 2슬롯 = 키 1개) · 잃은·끈 로컬 id = placeholder diagonal · UUID 0 · 참조 = images 키 = 이미지 entry", async () => {
    const entries = await entriesOf(m2());
    const json = textOf(entries, "src/site.json");
    const site = JSON.parse(json) as SiteJsonV1;
    const slots = site.doc.sections.flatMap((s) => Object.values(s.slots)).filter((v) => typeof v === "object");
    const sources = slots.map((v) => v.source);
    expect(sources.filter((s) => typeof s === "string")).toEqual(["img-01", "img-02", "img-03", "img-01"]);
    expect(slots.filter((v) => typeof v.source === "object" && v.source.patternId === "diagonal").length).toBeGreaterThanOrEqual(2);
    expect(json).not.toMatch(UUID);
    for (const id of Object.values(ID)) expect(json).not.toContain(id);
    expect(site.images).toEqual({ "img-01": { file: "img-01.webp", width: 800, height: 600 }, "img-02": { file: "img-02.jpg", width: 600, height: 900 }, "img-03": { file: "img-03.png", width: 1000, height: 1000 } });
    expect(entries.filter((e) => e.name.startsWith("src/assets/images/")).map((e) => e.name.slice(18))).toEqual(Object.values(site.images).map((i) => i.file));
  });
});

describe("글꼴 (RZ-AC-09)", () => {
  it("글꼴 entry 바이트 = 입력 글꼴 바이트(정적 zip과 같은 loadSiteFonts 바이트 · 이름 fontFileName) · OFL.txt = fontLicenseText · fonts.css url = 글꼴 entry", async () => {
    const c = m1();
    const entries = await entriesOf(c);
    for (const face of c.fonts) {
      const entry = entries.find((e) => e.name === `src/assets/fonts/${fontFileName(face.family, face.weight)}`)!;
      expect(Buffer.from(entry.data).equals(Buffer.from(face.data))).toBe(true);
    }
    expect(textOf(entries, "src/assets/fonts/OFL.txt")).toBe(fontLicenseText(c.fonts[0]!.family));
    expect(textOf(entries, "src/fonts.css")).toContain('src:url(./assets/fonts/Pretendard-400.woff2) format("woff2")');
  });

  it("같은 문서 정적 zip과 직접 대조 — 두 zip 바이트를 풀어 글꼴 entry(이름·바이트)·OFL.txt가 같다", async () => {
    const c = m1();
    const date = new Date(c.doc.updatedAt);
    const react = unzipEntries(await buildReactZip({ ...c, date, css: KIT_CSS }));
    const statics = unzipEntries((await buildZipSite({ markup: renderToStaticMarkup(createElement(PageDocument, { doc: c.doc, kitTokens: c.kitTokens })), css: "", title: c.doc.meta.title, description: c.doc.meta.description, fonts: c.fonts, images: {}, lost: 0, date })).data);
    const staticFonts = [...statics.keys()].filter((n) => n.startsWith("assets/fonts/")).sort();
    expect(staticFonts).toEqual(["assets/fonts/OFL.txt", "assets/fonts/Pretendard-400.woff2", "assets/fonts/Pretendard-700.woff2"]);
    expect([...react.keys()].filter((n) => n.startsWith("src/assets/fonts/")).sort()).toEqual(staticFonts.map((n) => `src/${n}`));
    for (const name of staticFonts) expect(Buffer.from(react.get(`src/${name}`)!).equals(Buffer.from(statics.get(name)!)), name).toBe(true);
  });
});

/** 중앙 디렉터리로 entry 이름·본문을 읽는 테스트용 파서(store 전용 — staticHtml.test와 같은 방식) */
function unzipEntries(zip: Uint8Array) {
  const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const end = zip.length - 22;
  let at = v.getUint32(end + 16, true);
  const out = new Map<string, Uint8Array>();
  for (let i = 0; i < v.getUint16(end + 10, true); i++) {
    const size = v.getUint32(at + 20, true);
    const nameLen = v.getUint16(at + 28, true);
    const local = v.getUint32(at + 42, true);
    const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
    out.set(dec.decode(zip.subarray(at + 46, at + 46 + nameLen)), zip.subarray(start, start + size));
    at += 46 + nameLen;
  }
  return out;
}

describe("브랜드·사용자 글자 (RZ-AC-16)", () => {
  it("고정 부분(템플릿·README·LICENSES·main·PageDocument)에 브랜드 문자열·이전 브랜드 4글자 0 · 사용자 글자(meta 제목)는 site.json·index.html에만", async () => {
    const c = m2();
    const entries = await entriesOf(c);
    const fixed = entries.filter((e) => !e.name.startsWith("src/kit/") && !e.name.startsWith("src/types/") && !e.name.startsWith("src/assets/") && e.name !== "src/site.json" && e.name !== "index.html").map((e) => dec.decode(e.data).toLowerCase());
    const legacy = ["a", "p", "f", "s"].join("");
    for (const banned of [brand.name.toLowerCase(), legacy]) expect(fixed.filter((t) => t.includes(banned))).toEqual([]);
    expect(README_MD.toLowerCase()).not.toContain(brand.name.toLowerCase());
    const title = c.doc.meta.title;
    expect(entries.filter((e) => !e.name.startsWith("src/assets/") && dec.decode(e.data).includes(title)).map((e) => e.name).sort()).toEqual(["index.html", "src/site.json"]);
  });
});
