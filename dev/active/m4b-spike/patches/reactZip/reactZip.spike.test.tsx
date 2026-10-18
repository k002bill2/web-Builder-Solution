// [M4-b-0 스파이크 — 커밋 금지] 시제품 zip을 $TMPDIR/m4b에 쓴다 + 비교 기준(렌더 입력 JSON · 앱 PageDocument SSR 마크업)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { PageDocument } from "../../../render/PageDocument";
import { referenceRenderInput } from "../../../thumbs/referenceDoc";
import { thumbnailIds } from "../../../thumbs/entry";
import type { FontBytes } from "../../../render/protocol";
import { buildReactZip } from "./reactZip";

const OUT = join(process.env.TMPDIR ?? "/tmp", "m4b");
const FILES: Record<string, Record<number, string>> = {
  Pretendard: { 400: "src/assets/fonts/Pretendard-Regular.subset.woff2", 700: "src/assets/fonts/Pretendard-Bold.subset.woff2" },
  "Kit Sans KR": { 400: "src/assets/site-fonts/kit-sans-kr/KitSansKR-400.woff2", 700: "src/assets/site-fonts/kit-sans-kr/KitSansKR-700.woff2" },
  "Kit Serif KR": { 400: "src/assets/site-fonts/kit-serif-kr/KitSerifKR-400.woff2", 700: "src/assets/site-fonts/kit-serif-kr/KitSerifKR-700.woff2" },
};

it("spike: React zip 시제품", () => {
  const id = process.env.M4B_REF ?? thumbnailIds()[0]!;
  const input = referenceRenderInput(id);
  const pick = ["header", "hero", "services"];
  const sections = pick.map((t) => input.doc.sections.find((s) => s.type === t)).filter((s) => s !== undefined);
  const doc = { ...input.doc, sections };
  const family = input.kitTokens.type.family as string;
  const fonts: FontBytes[] = ([400, 700] as const).flatMap((weight) => {
    const file = FILES[family]?.[weight];
    if (!file) return [];
    const buf = readFileSync(file);
    return [{ family, weight, data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer }];
  });
  mkdirSync(OUT, { recursive: true });
  const zip = buildReactZip({ doc, kitTokens: input.kitTokens, fonts, date: new Date(doc.updatedAt), css: { "kit.css": readFileSync("src/kit/kit.css", "utf8"), "motion.css": readFileSync("src/kit/motion.css", "utf8") } });
  writeFileSync(join(OUT, "react.zip"), zip);
  writeFileSync(join(OUT, "render-input.json"), JSON.stringify({ id, doc, kitTokens: input.kitTokens }));
  writeFileSync(join(OUT, "app-ssr.html"), renderToStaticMarkup(<PageDocument doc={doc} kitTokens={input.kitTokens} />));
  console.log(`[m4b] ref=${id} family=${family} sections=${sections.map((s) => `${s.type}/${s.variant}`).join(",")} zipBytes=${zip.length}`);
  expect(sections.length).toBe(3);
});
