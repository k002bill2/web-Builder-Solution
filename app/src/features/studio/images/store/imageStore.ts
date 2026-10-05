/**
 * 이미지 보관소 (SPEC m2c 2.6 · 5.1 · 2a-05 5.9) — 탭 메모리. 패널 청크와 함께 lazy로 받는다(진입 청크 import 금지, 7절).
 * 값의 자리는 편집 틀의 state 1쌍(`RenderImages` — 캔버스로 그대로 보내는 맵)이고, 파생본·형식·바이트 메타는 캔버스 Blob을 키로
 * WeakMap에 둔다 — 맵에서 빠지면 메타도 함께 놓인다(편집기를 떠나면 state와 함께 사라진다). 원본 File·파일 이름은 받지 않는다(2.6 · IMG-AC-15).
 */
import type { PageDoc, SectionType } from "../../../../engine/contracts/pageDoc";
import type { IngestedImage } from "../ingest";
import type { RenderImages } from "./types";

export type ImageMeta = Pick<IngestedImage, "variants" | "width" | "height" | "format" | "bytes">;
export type LimitCheck = { readonly ok: true } | { readonly ok: false; readonly message: string };

const metas = new WeakMap<Blob, ImageMeta>();
const MB = 1024 * 1024;
/** 2a-05 5.9 한도 — 문서(켜진 슬롯) 12개·30MB · 탭(되돌릴 수 있는 문서까지) 24개·60MB */
const DOC_COUNT = 12;
const DOC_BYTES = 30 * MB;
const TAB_COUNT = 24;
const TAB_BYTES = 60 * MB;

/** 문서들의 로컬 이미지 id — `onlyEnabled`면 켜진 슬롯만(문서 한도 = 렌더 `docImageIds`와 같은 뜻 · 렌더 모듈을 import하지 않는다) */
const localIds = (docs: ReadonlyArray<PageDoc | undefined>, onlyEnabled: boolean): ReadonlySet<string> =>
  new Set(docs.flatMap((d) => d?.sections.flatMap((s) => Object.values(s.slots).flatMap((v) => (typeof v === "object" && typeof v.source === "string" && (v.enabled || !onlyEnabled) ? [v.source] : []))) ?? []));

/** 참조 집합 = 문서 ∪ 되돌릴 문서의 로컬 id — 꺼진 슬롯도 붙잡는다(다시 켜면 그대로 보이게) */
export const retainedIds = (doc: PageDoc, undoDoc: PageDoc | undefined): ReadonlySet<string> => localIds([doc, undoDoc], false);

/** 참조 밖 id를 버린 새 맵 — 버릴 것이 없으면 같은 맵(편집 틀 재렌더 0) */
export function pruneImages(images: RenderImages | undefined, keep: ReadonlySet<string>): RenderImages {
  const current = images ?? {};
  const kept = Object.entries(current).filter(([id]) => keep.has(id));
  return images && kept.length === Object.keys(current).length ? images : Object.fromEntries(kept);
}

const total = (images: RenderImages, ids: Iterable<string>) => {
  const held = [...ids].flatMap((id) => (images[id] ? [imageMeta(images[id])?.bytes ?? 0] : []));
  return { count: held.length, bytes: held.reduce((sum, b) => sum + b, 0) };
};

/** 새 이미지를 넣은 뒤의 문서·맵으로 한도를 잰다(보관 바이트). 거부는 아무것도 바꾸지 않는다 — 부르는 쪽이 넣지 않는다 */
export function checkLimits(doc: PageDoc, undoDoc: PageDoc | undefined, images: RenderImages): LimitCheck {
  const page = total(images, localIds([doc], true));
  if (page.count > DOC_COUNT) return { ok: false, message: "이미지는 한 페이지에 12개까지 쓸 수 있습니다 — 다른 슬롯의 이미지를 끈 뒤 고르세요" };
  if (page.bytes > DOC_BYTES) return { ok: false, message: `이 페이지의 이미지가 합계 30MB를 넘습니다 (${(page.bytes / MB).toFixed(1)}MB) — 더 작은 파일을 고르세요` };
  const tab = total(images, retainedIds(doc, undoDoc));
  if (tab.count > TAB_COUNT || tab.bytes > TAB_BYTES) return { ok: false, message: "이 탭에 보관한 이미지가 24개 · 60MB를 넘습니다 — 쓰지 않는 슬롯의 이미지를 지운 뒤 고르세요" };
  return { ok: true };
}

/** 동봉·미리보기 폭(SPEC 5.1 표) — 화면 폭을 다 쓰는 hero = 1920 · 반 폭 = 1280 · 칸·지도 = 640 */
export function slotTarget(type: SectionType, variant: string): number {
  if (type === "hero") return variant === "fullbleed-left" || variant === "image" ? 1920 : 1280;
  return type === "about" ? 1280 : 640;
}

/** 목표 이상인 가장 작은 폭, 없으면 가장 큰 후보(SPEC 5.1 `pickVariant`) */
export function pickVariant(variants: IngestedImage["variants"], target: number): Blob | undefined {
  const widths = Object.keys(variants)
    .map(Number)
    .sort((a, b) => a - b);
  const width = widths.find((w) => w >= target) ?? widths.at(-1);
  return width === undefined ? undefined : variants[width];
}

/** 새 맵 = 이전 맵 + id → {고른 Blob, 원본 폭·높이}. 메타는 고른 Blob 키로 기억한다 */
export function addImage(images: RenderImages, id: string, image: IngestedImage, target: number): RenderImages {
  const blob = pickVariant(image.variants, target);
  if (!blob) return images;
  metas.set(blob, { variants: image.variants, width: image.width, height: image.height, format: image.format, bytes: image.bytes });
  return { ...images, [id]: { blob, width: image.width, height: image.height } };
}

export const imageMeta = (image: RenderImages[string]): ImageMeta | undefined => metas.get(image.blob);
