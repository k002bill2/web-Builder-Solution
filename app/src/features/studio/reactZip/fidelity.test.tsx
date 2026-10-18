// @vitest-environment node
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentType } from "react";
import { SECTION_DEFINITIONS } from "../../../engine/sections/registry";
import { section } from "../../../engine/testing/sampleDoc";
import { PageDocument } from "../../../render/PageDocument";
import { referenceRenderInput } from "../../../thumbs/referenceDoc";
import { ID, KIT_CSS, m2, type ZipCase } from "../testing/reactZipFixture";
import { reactZipEntries } from "./reactZip";

/**
 * REACTZIP-SPEC 4.1 단위 대조(RZQ-12 A · RZ-AC-13) — 생성기가 만든 **실제 산출 파일** src/**를 풀어 그 PageDocument를 SSR하고,
 * 같은 입력으로 앱 render/PageDocument를 SSR해 정규화 ①②③ 뒤 문자 단위로 비교한다. 30개 변형 전부 + 이미지 문서(masonry aspect 포함).
 * 푸는 곳 = gitignore된 app/.vite/react-zip-fidelity (node_modules 아래는 vitest가 .tsx를 변환하지 않을 수 있어 쓰지 않는다 · dist는 빌드가 지운다)
 */
const ROOT = resolve(".vite/react-zip-fidelity");
type ZipPageDocument = ComponentType<{ site: unknown; images: Readonly<Record<string, string>> }>;

async function zipMarkup(name: string, c: ZipCase, images: Readonly<Record<string, string>>): Promise<string> {
  const dir = join(ROOT, name);
  rmSync(dir, { recursive: true, force: true });
  const entries = await reactZipEntries({ ...c, css: KIT_CSS });
  for (const e of entries.filter((x) => x.name.startsWith("src/") && !x.name.startsWith("src/assets/"))) {
    mkdirSync(dirname(join(dir, e.name)), { recursive: true });
    writeFileSync(join(dir, e.name), e.data);
  }
  const site = JSON.parse(new TextDecoder().decode(entries.find((e) => e.name === "src/site.json")!.data));
  const { PageDocument: Zip } = (await import(/* @vite-ignore */ join(dir, "src/PageDocument.tsx"))) as { PageDocument: ZipPageDocument };
  return renderToStaticMarkup(<Zip site={site} images={images} />);
}

/**
 * ① data-motion-play 제거(B만 켜는 재생 스위치) ② img src → 이미지 키 ③ A는 eager render가 아니므로 loading 그대로.
 * ②는 SSR만의 산출물에도 같이 적용한다 — React SSR이 fetchPriority high img 앞에 붙이는 `<link rel="preload" as="image" href>`(브라우저에서는 head로 가서 사이트 루트 DOM에 없다)
 */
const normalize = (html: string, keys: Readonly<Record<string, string>> = {}) =>
  html.replaceAll(' data-motion-play=""', "").replace(/ (src|href)="([^"]*)"/g, (whole, attr: string, url: string) => (keys[url] ? ` ${attr}="${keys[url]}"` : whole));

afterAll(() => rmSync(ROOT, { recursive: true, force: true }));

describe("SSR 대조 — 30개 변형 (RZ-AC-13)", () => {
  const ref = referenceRenderInput("ref-a");
  it("변형 정의 = 30개", () => expect(SECTION_DEFINITIONS).toHaveLength(30));
  it.each(SECTION_DEFINITIONS.map((d) => [`${d.type}/${d.variant}`, d] as const))("%s — 산출 PageDocument SSR = 앱 PageDocument SSR(정규화 뒤)", async (key, d) => {
    const doc = { ...ref.doc, sections: [section(d.type, d.variant, `s-${d.type}`)] };
    const c: ZipCase = { doc, kitTokens: ref.kitTokens, fonts: [], images: {}, lost: 0 };
    const app = renderToStaticMarkup(<PageDocument doc={doc} kitTokens={ref.kitTokens} />);
    const zip = await zipMarkup(key.replace("/", "_"), c, {});
    expect(app).toContain(`data-section="${key}"`);
    expect(normalize(zip)).toBe(normalize(app));
  });
});

describe("SSR 대조 — 이미지 문서 M2 (RZ-AC-13 · 2.3.1 변환 뒤 DOM 동일)", () => {
  it("webp·jpg·png + 같은 id 2슬롯 + 잃은 이미지 + 끈 슬롯 — src만 키로 바꾸면 같다 · masonry aspect(imageSizes) 포함", async () => {
    const c = m2(referenceRenderInput("ref-a"));
    const keyOf: Record<string, string> = { [ID.webp]: "img-01", [ID.jpg]: "img-02", [ID.png]: "img-03" };
    const appImages = Object.fromEntries(Object.keys(c.images).map((id) => [id, `blob:app/${id}`]));
    const sizes = Object.fromEntries(Object.entries(c.images).map(([id, i]) => [id, { width: i.width, height: i.height }]));
    const app = renderToStaticMarkup(<PageDocument doc={c.doc} kitTokens={c.kitTokens} images={appImages} imageSizes={sizes} />);
    const zip = await zipMarkup("m2", c, { "img-01": "/assets/img-01.webp", "img-02": "/assets/img-02.jpg", "img-03": "/assets/img-03.png" });
    const fromApp = Object.fromEntries(Object.entries(keyOf).map(([id, key]) => [`blob:app/${id}`, key]));
    const fromZip = { "/assets/img-01.webp": "img-01", "/assets/img-02.jpg": "img-02", "/assets/img-03.png": "img-03" };
    expect(app.match(/data-media="image"/g)?.length).toBe(4);
    // masonry 실제 이미지 칸 = 원본 비율 aspect(imageSizes) — 양쪽 모두 마크업에 있어야 대조가 의미 있다
    const aspects = ['style="aspect-ratio:1000 / 1000"', 'style="aspect-ratio:800 / 600"'];
    expect(app).toContain('data-section="portfolio/masonry"');
    expect(app.match(/style="aspect-ratio:[^"]+"/g)).toEqual(aspects);
    expect(zip.match(/style="aspect-ratio:[^"]+"/g)).toEqual(aspects);
    expect(normalize(zip, fromZip)).toBe(normalize(app, fromApp));
  });
});
