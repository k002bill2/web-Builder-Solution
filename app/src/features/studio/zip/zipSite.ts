/**
 * 정적 사이트(zip) 조립 (M4-a CP3 · SPEC 2절) — 렌더 문서 참조 직렬화 markup + 부모 Blob(이미지) + 글꼴 바이트 →
 * `index.html` + `LICENSES.md` + `assets/fonts/*`(+ OFL.txt) + `assets/images/*`. 허용표(4.3) 검사 → 크기 상한(2.5) → store zip.
 */
import type { FontBytes, RenderImage } from "../../../render/protocol";
import { faceRule, fontLicenseText } from "../staticHtml/siteFontEmbed";
import { buildStaticHtml } from "../staticHtml/staticMarkup";
import { licensesMarkdown } from "./licenses";
import { ZIP_MAX, checkZipEntries, fontFileName, imageFileNames, orderZipEntries, tooLargeText } from "./staticZip";
import { zipParts, type ZipEntry } from "./storeZip";

export interface ZipSiteInput {
  readonly markup: string;
  /** 킷 CSS(`@font-face` 뺀 것) */
  readonly css: string;
  readonly title: string;
  readonly description: string;
  readonly fonts: readonly FontBytes[];
  readonly images: Readonly<Record<string, RenderImage>>;
  readonly lost: number;
  /** entry 시각 = 그 revision 문서의 updatedAt(Q6) */
  readonly date: Date;
}

/** 사유를 사용자에게 보일 실패(용량 초과) — exportFlow가 재시도 알림에 문구를 싣는다 */
export class ZipTooLargeError extends Error {
  readonly shown = true;
}

export async function buildZipSite({ markup, css, title, description, fonts, images, lost, date }: ZipSiteInput) {
  const names = imageFileNames(markup, images);
  const fontEntries = fonts.map((f) => ({ face: f, name: `assets/fonts/${fontFileName(f.family, f.weight)}` }));
  const html = buildStaticHtml({
    markup,
    css: css + fontEntries.map(({ face, name }) => faceRule(face, name)).join(""),
    title,
    description,
    notice: fonts.length > 0 ? "Fonts: SIL OFL 1.1 — see LICENSES.md" : undefined,
    images: Object.fromEntries(names),
    target: "zip",
  });
  const family = fonts[0]?.family;
  const imageEntries = await Promise.all([...names].map(async ([id, name]) => ({ name, data: new Uint8Array(await images[id]!.blob.arrayBuffer()) })));
  const encoder = new TextEncoder();
  const entries: ZipEntry[] = orderZipEntries([
    { name: "index.html", data: encoder.encode(html) },
    { name: "LICENSES.md", data: encoder.encode(licensesMarkdown({ family, fonts: fontEntries.map((f) => f.name).sort(), images: imageEntries.map((e) => e.name), lost })) },
    ...fontEntries.map(({ face, name }) => ({ name, data: new Uint8Array(face.data) })),
    ...(family ? [{ name: "assets/fonts/OFL.txt", data: encoder.encode(fontLicenseText(family)) }] : []),
    ...imageEntries,
  ]);
  checkZipEntries(entries);
  const parts = zipParts(entries, date);
  const bytes = parts.reduce((sum, part) => sum + part.length, 0);
  if (bytes > ZIP_MAX) throw new ZipTooLargeError(tooLargeText(bytes));
  const data = new Uint8Array(bytes);
  parts.reduce((at, part) => (data.set(part, at), at + part.length), 0);
  return { data, images: names.size, fonts: fonts.length };
}
