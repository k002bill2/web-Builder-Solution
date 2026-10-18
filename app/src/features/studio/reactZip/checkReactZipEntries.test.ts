import type { ZipEntry } from "../zip/storeZip";
import { referenceRenderInput } from "../../../thumbs/referenceDoc";
import { KIT_CSS, m2 as m2Of } from "../testing/reactZipFixture";

const m2 = () => m2Of(referenceRenderInput("ref-a"));
import { checkReactZipEntries } from "./checkReactZipEntries";
import { kitSources, typeSources } from "./kitSources";
import { ReactZipError, buildReactZip, reactZipEntries } from "./reactZip";
import { REACT_ZIP_FAIL_PATTERN } from "./reactZipText";

/** REACTZIP-SPEC 2.4 허용표 — 위반 entry 주입마다 실패 (RZ-AC-06·08·18) · 용량 상한은 작게 바꿔 본다 */
vi.mock("../zip/staticZip", async (importOriginal) => ({ ...(await importOriginal<typeof import("../zip/staticZip")>()), ZIP_MAX: 500_000 }));

const enc = new TextEncoder();
const expect_ = () => ({ kit: new Map(kitSources(KIT_CSS).map((k) => [k.name, k.text])), types: new Map(typeSources().map((t) => [t.name, t.text])) });
const base = () => reactZipEntries({ ...m2(), css: KIT_CSS });
const replace = (entries: ZipEntry[], name: string, data: Uint8Array) => entries.map((e) => (e.name === name ? { name, data } : e));
const site = (entries: ZipEntry[]) => JSON.parse(new TextDecoder().decode(entries.find((e) => e.name === "src/site.json")!.data));
const withSite = (entries: ZipEntry[], value: unknown) => replace(entries, "src/site.json", enc.encode(JSON.stringify(value)));

describe("checkReactZipEntries (2.4)", () => {
  it("정상 M2 묶음 = 위반 0", async () => {
    expect(checkReactZipEntries(await base(), expect_())).toEqual([]);
  });

  it.each([
    ["허용표 밖 파일", (e: ZipEntry[]) => [...e, { name: ".npmrc", data: enc.encode("x") }], /허용표 밖 파일 \.npmrc/],
    ["빈 킷 원문", (e: ZipEntry[]) => replace(e, "src/kit/kit.css", enc.encode("")), /src\/kit\/kit\.css 원문 불일치·빈 원문/],
    ["킷 빠짐", (e: ZipEntry[]) => e.filter((x) => x.name !== "src/kit/Media.tsx"), /킷 entry 집합/],
    ["`..` 경로", (e: ZipEntry[]) => [...e, { name: "src/../x.ts", data: enc.encode("x") }], /경로 규칙/],
    ["디렉터리 entry", (e: ZipEntry[]) => [...e, { name: "src/assets/", data: new Uint8Array() }], /경로 규칙/],
    ["템플릿과 다른 package.json", (e: ZipEntry[]) => replace(e, "package.json", enc.encode("{}")), /package\.json ≠ 템플릿/],
    ["서명 불일치 이미지", (e: ZipEntry[]) => replace(e, "src/assets/images/img-01.webp", enc.encode("not webp")), /확장자와 서명/],
    ["고아 이미지", (e: ZipEntry[]) => [...e, { name: "src/assets/images/img-09.png", data: e.find((x) => x.name.endsWith(".png"))!.data }], /site\.json images ≠ 이미지 entry/],
    ["순서 뒤바뀜", (e: ZipEntry[]) => [e[1]!, e[0]!, ...e.slice(2)], /entry 순서/],
  ])("%s → 실패", async (_why, mutate, message) => {
    expect(checkReactZipEntries(mutate(await base()), expect_()).join(" | ")).toMatch(message);
  });

  it("끊긴 이미지 참조(doc 키 ↔ images) · UUID source · 중립 상수 아님 · 섹션 필드 추가 → 실패", async () => {
    const entries = await base();
    const s = site(entries);
    const cut = { ...s, images: { "img-01": s.images["img-01"], "img-02": s.images["img-02"] } };
    expect(checkReactZipEntries(withSite(entries, cut), expect_()).join(" | ")).toMatch(/doc 이미지 참조 ≠ images 키/);
    const uuid = JSON.parse(JSON.stringify(s).replace('"img-02"', '"22222222-2222-4222-8222-222222222222"'));
    expect(checkReactZipEntries(withSite(entries, uuid), expect_()).join(" | ")).toMatch(/키 모양이 아님/);
    expect(checkReactZipEntries(withSite(entries, { ...s, doc: { ...s.doc, projectId: "project-7" } }), expect_()).join(" | ")).toMatch(/doc\.projectId 중립 상수 아님/);
    const extra = { ...s, doc: { ...s.doc, sections: s.doc.sections.map((x: object, i: number) => (i === 0 ? { ...x, owner: "me" } : x)) } };
    expect(checkReactZipEntries(withSite(entries, extra), expect_()).join(" | ")).toMatch(/섹션 필드 허용 목록/);
  });

  it("index.html = meta 이스케이프 템플릿 — 제목에 <script> 를 넣어도 태그가 생기지 않는다", async () => {
    const c = m2();
    const entries = await reactZipEntries({ ...c, doc: { ...c.doc, meta: { title: '<script>alert("x")</script>', description: "a & b" } }, css: KIT_CSS });
    const html = new TextDecoder().decode(entries.find((e) => e.name === "index.html")!.data);
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(checkReactZipEntries(entries, expect_())).toEqual([]);
  });
});

describe("생성기 실패 (RZ-AC-18)", () => {
  it("ZIP_MAX 초과 → 사유 표시 실패(export.fail.tooLarge 문구) · 단언 실패 → export.fail.pattern 자리 상수", async () => {
    const c = m2();
    const big = await buildReactZip({ ...c, date: new Date(c.doc.updatedAt), css: KIT_CSS }).catch((e: unknown) => e);
    expect(big).toBeInstanceOf(ReactZipError);
    expect((big as Error).message).toMatch(/^묶음이 .*MB로 상한 64MB를 넘어 만들지 않았습니다/);
    const empty = await buildReactZip({ ...c, date: new Date(c.doc.updatedAt), css: { "kit.css": " " } }).catch((e: unknown) => e);
    expect(empty).toBeInstanceOf(Error);
    const gif = await buildReactZip({ ...c, images: { ...c.images, x: { blob: new Blob(["GIF89a"], { type: "image/gif" }), width: 1, height: 1 } }, date: new Date(c.doc.updatedAt), css: KIT_CSS }).catch((e: unknown) => e);
    expect(gif).toMatchObject({ message: REACT_ZIP_FAIL_PATTERN, shown: true });
  });
});
