/**
 * React zip 테스트 입력(REACTZIP-SPEC 4.4 M1·M2) — 참조 문서 ref-a(테스트가 넘김) · 사이트 글꼴 실제 바이트 · webp/jpg/png 최소 이미지.
 * M2 = ref-a + about 사본 1개 · 켜진 이미지 슬롯에 로컬 id(webp·jpg·png 각 1 + 같은 id 2슬롯 + 잃은 이미지 1) + 끈 슬롯 1(로컬 id).
 * vitest(css: false)에서 `?raw` CSS가 비므로 킷 CSS 원문을 읽어 넘긴다.
 */
import { readFileSync } from "node:fs";
import type { ImageSlotValue, PageDoc, SlotValue } from "../../../engine/contracts/pageDoc";
import type { FontBytes, KitTokenInput, RenderImage } from "../../../render/protocol";

const FONT_FILES: Readonly<Record<string, Readonly<Record<number, string>>>> = {
  Pretendard: { 400: "src/assets/fonts/Pretendard-Regular.subset.woff2", 700: "src/assets/fonts/Pretendard-Bold.subset.woff2" },
  "Kit Sans KR": { 400: "src/assets/site-fonts/kit-sans-kr/KitSansKR-400.woff2", 700: "src/assets/site-fonts/kit-sans-kr/KitSansKR-700.woff2" },
  "Kit Serif KR": { 400: "src/assets/site-fonts/kit-serif-kr/KitSerifKR-400.woff2", 700: "src/assets/site-fonts/kit-serif-kr/KitSerifKR-700.woff2" },
};
export const fontBytes = (family: string): FontBytes[] =>
  ([400, 700] as const).map((weight) => {
    const buf = readFileSync(FONT_FILES[family]![weight]!);
    return { family, weight, data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer };
  });

export const KIT_CSS = { "kit.css": readFileSync("src/kit/kit.css", "utf8"), "motion.css": readFileSync("src/kit/motion.css", "utf8") };

const blob = (base64: string, type: string) => new Blob([Buffer.from(base64, "base64")], { type });
export const PNG = () => blob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "image/png");
export const WEBP = () => blob("UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA", "image/webp");
export const JPG = () =>
  blob("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=", "image/jpeg");

export const ID = { webp: "11111111-1111-4111-8111-111111111111", jpg: "22222222-2222-4222-8222-222222222222", png: "33333333-3333-4333-8333-333333333333", lost: "44444444-4444-4444-8444-444444444444", off: "55555555-5555-4555-8555-555555555555" } as const;

export interface ZipCase {
  readonly doc: PageDoc;
  readonly kitTokens: KitTokenInput;
  readonly fonts: FontBytes[];
  readonly images: Record<string, RenderImage>;
  readonly lost: number;
}

/** M1 — ref-a header·hero·services (스파이크 문서) */
/** 입력 = 테스트가 넘기는 참조 문서 렌더 입력(thumbs referenceRenderInput("ref-a") — 제품 파일은 thumbs를 import하지 않는다, M3P-AC-G3) */
export interface RefInput {
  readonly doc: PageDoc;
  readonly kitTokens: KitTokenInput;
}

export function m1(input: RefInput): ZipCase {
  const doc = { ...input.doc, sections: ["header", "hero", "services"].map((t) => input.doc.sections.find((s) => s.type === t)!) };
  return { doc, kitTokens: input.kitTokens, fonts: fontBytes(input.kitTokens.type.family), images: {}, lost: 0 };
}

/** M2 — ref-a 전체 · 켜진 이미지 슬롯 순서대로 webp → jpg → png → webp(같은 id) → 잃은 id · 그다음 켜진 슬롯 1개를 끄고 로컬 id */
export function m2(input: RefInput): ZipCase {
  const plan: readonly { readonly source: string; readonly enabled?: boolean }[] = [{ source: ID.webp }, { source: ID.jpg }, { source: ID.png }, { source: ID.webp }, { source: ID.lost }, { source: ID.off, enabled: false }];
  let n = 0;
  const assign = (v: SlotValue): SlotValue => (typeof v === "object" && v.enabled && n < plan.length ? ({ ...v, ...plan[n++] } as ImageSlotValue) : v);
  // ref-a 켜진 이미지 슬롯은 5개 — about 섹션 사본 1개(새 instanceId)를 footer 앞에 더해 6개로
  const about = input.doc.sections.find((s) => s.type === "about")!;
  const footer = input.doc.sections.findIndex((s) => s.type === "footer");
  const base = [...input.doc.sections.slice(0, footer), { ...about, instanceId: `${about.instanceId}-copy` }, ...input.doc.sections.slice(footer)];
  const doc = { ...input.doc, meta: { title: "모던카페고유제목", description: "모던카페고유설명" }, sections: base.map((s) => ({ ...s, slots: Object.fromEntries(Object.entries(s.slots).map(([k, v]) => [k, assign(v)])) })) };
  if (n !== plan.length) throw new Error(`ref-a 켜진 이미지 슬롯이 ${plan.length}개보다 적습니다(${n})`);
  const images = {
    [ID.webp]: { blob: WEBP(), width: 800, height: 600 },
    [ID.jpg]: { blob: JPG(), width: 600, height: 900 },
    [ID.png]: { blob: PNG(), width: 1000, height: 1000 },
  };
  return { doc, kitTokens: input.kitTokens, fonts: fontBytes(input.kitTokens.type.family), images, lost: 1 };
}
