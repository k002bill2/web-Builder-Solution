/**
 * React zip 허용표 (REACTZIP-SPEC 2.4 · M4-a checkZipEntries와 분리) — 경로·개수·순서·내용(템플릿 바이트 동일·킷 집합·서명) · 참조 무결성.
 * 위반 = 이유 문자열 목록(빈 목록 = 통과). 생성기는 하나라도 있으면 단언 실패로 멈춘다.
 */
import { SIGNATURE } from "../zip/staticZip";
import type { ZipEntry } from "../zip/storeZip";
import { siteJsonProblems, type SiteJsonV1 } from "./siteJson";
import { IMAGES_TS, INDEX_CSS, MAIN_TSX, PACKAGE_JSON, PACKAGE_LOCK, PAGE_DOCUMENT_TSX, TSCONFIG, VITE_CONFIG, indexHtml } from "./templates";

export interface ReactZipExpect {
  /** 생성기가 동봉해야 할 킷 원문(이름 → 글자) · 타입 원문(치환 뒤) */
  readonly kit: ReadonlyMap<string, string>;
  readonly types: ReadonlyMap<string, string>;
}

const FIXED: Readonly<Record<string, string>> = {
  "package.json": PACKAGE_JSON,
  "package-lock.json": PACKAGE_LOCK,
  "vite.config.ts": VITE_CONFIG,
  "tsconfig.json": TSCONFIG,
  "src/main.tsx": MAIN_TSX,
  "src/PageDocument.tsx": PAGE_DOCUMENT_TSX,
  "src/images.ts": IMAGES_TS,
  "src/index.css": INDEX_CSS,
};
const FONT = /^src\/assets\/fonts\/[A-Za-z]+-\d{3}\.woff2$/;
const IMAGE = /^src\/assets\/images\/img-\d{2,3}\.(webp|jpg|png)$/;
const KIT = /^src\/kit\/[A-Za-z][A-Za-z0-9]*\.(tsx?|css)$/;
const OFL = "src/assets/fonts/OFL.txt";
const SINGLE = ["package.json", "package-lock.json", "index.html", "vite.config.ts", "tsconfig.json", "README.md", "LICENSES.md", "src/PageDocument.tsx", "src/fonts.css", "src/images.ts", "src/index.css", "src/main.tsx", "src/site.json"];
const LICENSE_SECTIONS = ["## 사이트 코드", "## npm 직접 의존성", "## 하위 의존성", "## 글꼴", "## 이미지", "## 그래픽"];

/** 2.4 entry 순서 — 고정 파일 → src/* 고정(이름순) → types → kit(이름순) → 글꼴(이름순) → 이미지(번호순) */
const rank = (name: string) => {
  const top = SINGLE.indexOf(name);
  if (top >= 0 && top < 7) return top;
  if (!name.includes("/", 4)) return 7;
  return name.startsWith("src/types/") ? 8 : name.startsWith("src/kit/") ? 9 : name.startsWith("src/assets/fonts/") ? 10 : 11;
};
const imageNumber = (name: string) => Number(/img-(\d+)\./.exec(name)?.[1] ?? 0);
export const orderReactZipEntries = (entries: readonly ZipEntry[]): ZipEntry[] =>
  [...entries].sort((a, b) => rank(a.name) - rank(b.name) || imageNumber(a.name) - imageNumber(b.name) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

const text = (entry: ZipEntry | undefined) => (entry ? new TextDecoder().decode(entry.data) : "");
const head = (data: Uint8Array, length: number) => String.fromCharCode(...data.subarray(0, length));
const safePath = (name: string) => /^[\x21-\x7e]+$/.test(name) && !name.startsWith("/") && !name.includes("..") && !/[\\:]/.test(name) && name.length <= 100;

export function checkReactZipEntries(entries: readonly ZipEntry[], expect: ReactZipExpect): string[] {
  const problems: string[] = [];
  const names = entries.map((e) => e.name);
  const byName = new Map(entries.map((e) => [e.name, e]));
  const lower = names.map((n) => n.toLowerCase());
  if (new Set(lower).size !== names.length) problems.push("이름 중복(대소문자 무시)");
  if (names.some((n) => !safePath(n) || n.endsWith("/"))) problems.push("경로 규칙 위반(ASCII · 선행 / · .. · \\ · : · 100자 · 디렉터리 entry)");
  for (const name of SINGLE) if (names.filter((n) => n === name).length !== 1) problems.push(`${name}는 정확히 1개`);
  const kit = names.filter((n) => KIT.test(n));
  const fonts = entries.filter((e) => FONT.test(e.name));
  const images = entries.filter((e) => IMAGE.test(e.name));
  const types = names.filter((n) => n.startsWith("src/types/"));
  const other = names.filter((n) => !SINGLE.includes(n) && !KIT.test(n) && !FONT.test(n) && !IMAGE.test(n) && n !== OFL && !expect.types.has(n));
  if (other.length > 0) problems.push(`허용표 밖 파일 ${other.join(", ")}`);
  if (names.join("\n") !== orderReactZipEntries(entries).map((e) => e.name).join("\n")) problems.push("entry 순서");
  for (const [name, body] of Object.entries(FIXED)) if (byName.has(name) && text(byName.get(name)) !== body) problems.push(`${name} ≠ 템플릿`);
  // 킷 = 생성기 원문 목록과 같은 집합 · 같은 글자 · 빈 원문 0
  if ([...kit].sort().join() !== [...expect.kit.keys()].sort().join()) problems.push("킷 entry 집합 ≠ 킷 목록");
  for (const name of kit) if (text(byName.get(name)).trim() === "" || text(byName.get(name)) !== expect.kit.get(name)) problems.push(`${name} 원문 불일치·빈 원문`);
  if (types.join() !== [...expect.types.keys()].join()) problems.push("타입 파일 집합");
  for (const name of types) {
    const body = text(byName.get(name));
    // 타입 파일은 import 0(치환 뒤) — domain/·engine/ 경로 import가 남으면 산출물 tsc가 깨진다
    if (body !== expect.types.get(name) || /^\s*(import|export)\b[^\n]*\sfrom\s/m.test(body)) problems.push(`${name} 치환 원문 불일치·허용 트리 밖 import`);
  }
  if (fonts.length > 2) problems.push("글꼴은 2개까지");
  if (fonts.some((f) => head(f.data, 4) !== "wOF2")) problems.push("woff2 서명이 아닌 글꼴");
  if (names.filter((n) => n === OFL).length !== (fonts.length > 0 ? 1 : 0)) problems.push("OFL.txt는 글꼴이 있을 때만 정확히 1개");
  if (images.length > 64) problems.push("이미지는 64개까지");
  if (images.some((i) => !SIGNATURE[i.name.slice(i.name.lastIndexOf(".") + 1)]!(i.data))) problems.push("확장자와 서명이 다른 이미지");
  // fonts.css url() = 글꼴 entry 집합 · @import 0
  const fontsCss = text(byName.get("src/fonts.css"));
  const urls = [...fontsCss.matchAll(/url\(([^)]*)\)/g)].map((m) => m[1]!.replace(/^["']|["']$/g, ""));
  if (/@import/.test(fontsCss) || urls.some((u) => !/^\.\/assets\/fonts\/[A-Za-z]+-\d{3}\.woff2$/.test(u))) problems.push("fonts.css url()·@import");
  if (urls.map((u) => `src/${u.slice(2)}`).sort().join() !== fonts.map((f) => f.name).sort().join()) problems.push("fonts.css 참조 ≠ 글꼴 entry");
  // site.json 스키마 · 이미지 파일 ↔ entry · index.html = meta 이스케이프
  let site: SiteJsonV1 | undefined;
  try {
    site = JSON.parse(text(byName.get("src/site.json"))) as SiteJsonV1;
  } catch {
    problems.push("site.json JSON 아님");
  }
  if (site) {
    problems.push(...siteJsonProblems(site));
    const files = Object.values(site.images ?? {}).map((i) => `src/assets/images/${i.file}`);
    if (files.sort().join() !== images.map((i) => i.name).sort().join()) problems.push("site.json images ≠ 이미지 entry");
    if (text(byName.get("index.html")) !== indexHtml(site.doc?.meta?.title ?? "", site.doc?.meta?.description ?? "")) problems.push("index.html ≠ 템플릿(meta)");
  }
  const licenses = text(byName.get("LICENSES.md"));
  if (LICENSE_SECTIONS.some((title) => !licenses.includes(title))) problems.push("LICENSES.md 필수 절");
  return problems;
}
