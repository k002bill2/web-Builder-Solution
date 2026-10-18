/**
 * 정적 사이트(zip) 구성 (M4-a SPEC 2.1·2.2·2.4·2.5·4.3) — 파일 이름 규칙 · entry 순서 · 허용표 검사 · 크기 상한.
 * zip 안 경로는 ASCII 고정 규칙뿐(사용자 글자 0). 바이트 작성은 storeZip.
 */
import type { RenderImage } from "../../../render/protocol";
import type { ZipEntry } from "./storeZip";

/** 안전망 — 정상 입력(이미지 보관 30MB + 글꼴 ≤ 2면)으로는 닿지 않는다(Q7) */
export const ZIP_MAX = 64 * 1024 * 1024;
export const tooLargeText = (bytes: number) => `묶음이 ${(bytes / (1024 * 1024)).toFixed(1)}MB로 상한 64MB를 넘어 만들지 않았습니다 — 큰 이미지를 줄여 주세요`;

export const EXT: Readonly<Record<string, string>> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

/** 렌더 문서가 준 `image:<id>` 첫 등장 순 → `assets/images/img-NN.<ext>`(01부터 · 100장부터 3자리). markup에 없는 id는 파일 0 */
export function imageFileNames(markup: string, images: Readonly<Record<string, RenderImage>>): ReadonlyMap<string, string> {
  const names = new Map<string, string>();
  for (const [, id] of markup.matchAll(/src="image:([^"]*)"/g)) {
    const image = id !== undefined && Object.hasOwn(images, id) ? images[id] : undefined;
    if (!image || names.has(id!)) continue;
    const ext = EXT[image.blob.type];
    if (!ext) throw new Error(`zip 이미지 형식이 아닙니다: ${image.blob.type}`);
    names.set(id!, `assets/images/img-${String(names.size + 1).padStart(2, "0")}.${ext}`);
  }
  return names;
}

/** `Kit Sans KR` 400 → `KitSansKR-400.woff2` */
export const fontFileName = (family: string, weight: number) => `${family.replace(/[^A-Za-z]/g, "")}-${weight}.woff2`;

const rank = (name: string) => (name === "index.html" ? 0 : name === "LICENSES.md" ? 1 : name.startsWith("assets/fonts/") ? 2 : 3);
const imageNumber = (name: string) => Number(/img-(\d+)\./.exec(name)?.[1] ?? 0);

/** index.html → LICENSES.md → assets/fonts/*(이름순) → assets/images/*(번호순) */
export const orderZipEntries = (entries: readonly ZipEntry[]): ZipEntry[] =>
  [...entries].sort((a, b) => rank(a.name) - rank(b.name) || imageNumber(a.name) - imageNumber(b.name) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

const FONT = /^assets\/fonts\/[A-Za-z]+-\d{3}\.woff2$/;
const IMAGE = /^assets\/images\/img-\d{2,3}\.(webp|jpg|png)$/;
const OFL = "assets/fonts/OFL.txt";
const head = (data: Uint8Array, length: number) => String.fromCharCode(...data.subarray(0, length));
export const SIGNATURE: Readonly<Record<string, (data: Uint8Array) => boolean>> = {
  webp: (d) => head(d, 4) === "RIFF" && String.fromCharCode(...d.subarray(8, 12)) === "WEBP",
  jpg: (d) => d[0] === 0xff && d[1] === 0xd8 && d[2] === 0xff,
  png: (d) => d[0] === 0x89 && head(d, 4).slice(1) === "PNG",
};

const fail = (why: string): never => {
  throw new Error(`zip 허용표 위반: ${why}`);
};

const CSS_URL = /url\(\s*(['"]?)([^'")]*)\1\s*\)/gi;
/** 실제 URL 자리(img src · style 요소·속성의 url())만 참조로 센다 — 본문·alt·title 글자의 경로는 참조가 아니다 */
function referencedAssets(html: string): Set<string> {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const css = [...doc.querySelectorAll("style")].map((el) => el.textContent ?? "").concat([...doc.querySelectorAll("[style]")].map((el) => el.getAttribute("style") ?? ""));
  const urls = [...[...doc.querySelectorAll("img[src]")].map((img) => img.getAttribute("src")!), ...css.flatMap((text) => [...text.matchAll(CSS_URL)].map((m) => m[2]!.trim()))];
  return new Set(urls.filter((url) => url.startsWith("assets/")));
}

/** 4.3 허용표 — 파일 종류·개수·서명 + index.html ↔ assets 양방향 참조(고아 0 · 끊긴 참조 0, OFL.txt는 참조 대상 아님) */
export function checkZipEntries(entries: readonly ZipEntry[]): void {
  const names = entries.map((e) => e.name);
  const count = (name: string) => names.filter((n) => n === name).length;
  if (count("index.html") !== 1 || count("LICENSES.md") !== 1) fail("index.html·LICENSES.md는 정확히 1개");
  const fonts = entries.filter((e) => FONT.test(e.name));
  const images = entries.filter((e) => IMAGE.test(e.name));
  const other = names.filter((n) => n !== "index.html" && n !== "LICENSES.md" && n !== OFL && !FONT.test(n) && !IMAGE.test(n));
  if (other.length > 0) fail(`허용표 밖 파일 ${other.join(", ")}`);
  if (fonts.length > 2) fail("글꼴은 2개까지");
  if (count(OFL) !== (fonts.length > 0 ? 1 : 0)) fail("OFL.txt는 글꼴이 있을 때만 정확히 1개");
  if (fonts.some((f) => head(f.data, 4) !== "wOF2")) fail("woff2 서명이 아닌 글꼴");
  if (images.some((i) => !SIGNATURE[i.name.slice(i.name.lastIndexOf(".") + 1)]!(i.data))) fail("확장자와 서명이 다른 이미지");
  const referenced = referencedAssets(new TextDecoder().decode(entries.find((e) => e.name === "index.html")!.data));
  const assets = new Set([...fonts, ...images].map((e) => e.name));
  if ([...referenced].some((ref) => !assets.has(ref))) fail("index.html이 가리키는 파일이 없음");
  if ([...assets].some((name) => !referenced.has(name))) fail("index.html이 참조하지 않는 파일");
}
