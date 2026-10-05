/**
 * 내보내기 동봉 이미지 (SPEC m2c 5.1·5.2) — 정적 HTML·PNG 공통. `ExportGenerator` 계약은 그대로 두고 생성기 팩토리에 `readImage`(파생본 전부)를 주입한다.
 * 문서가 쓰는 id(켜진 슬롯 — 렌더 `docImageIds`와 같은 뜻)마다 목표 폭 = 그 id를 쓰는 슬롯들의 동봉 단계 중 가장 큰 값 → `pickVariant`로 1장.
 * 후보가 없으면 잃은 이미지 — 보내지 않고(렌더 문서가 자체 그래픽으로 그린다) 개수만 센다(차단 0).
 */
import type { PageDoc } from "../../../engine/contracts/pageDoc";
import type { RenderImage } from "../../../render/protocol";
import type { IngestedImage } from "../images/ingest";
import { imageMeta, pickVariant, slotTarget } from "../images/store/imageStore";
import type { RenderImages } from "../images/store/types";

export type ReadImage = (id: string) => { readonly variants: IngestedImage["variants"]; readonly width: number; readonly height: number } | undefined;
/** 정적 HTML 결과 요약(크기 표시 — MQ-C3 ★A): 결과 바이트 · 넣은 이미지 수 · 잃은 이미지 수 */
export interface ExportSummary {
  readonly bytes: number;
  readonly images: number;
  readonly lost: number;
}

/** 렌더 문서가 내보내기 이미지 decode에 실패(error IMAGE_DECODE_FAILED — SPEC m2c 5.3-3) — 조용히 빠뜨리지 않고 실패 */
export const IMAGE_FAILED = "이미지를 그리지 못했습니다";
export const lostImageText = (lost: number) => `이미지 ${lost}장을 다시 골라야 해 자체 그래픽으로 넣었습니다`;

export function exportImages(doc: PageDoc, readImage: ReadImage): { readonly images: Readonly<Record<string, RenderImage>>; readonly lost: number } {
  const targets = new Map<string, number>();
  for (const s of doc.sections)
    for (const v of Object.values(s.slots)) if (typeof v === "object" && v.enabled && typeof v.source === "string") targets.set(v.source, Math.max(targets.get(v.source) ?? 0, slotTarget(s.type, s.variant)));
  const images: Record<string, RenderImage> = {};
  let lost = 0;
  for (const [id, target] of targets) {
    const image = readImage(id);
    const blob = image && pickVariant(image.variants, target);
    if (image && blob) images[id] = { blob, width: image.width, height: image.height };
    else lost++;
  }
  return { images, lost };
}

/** 편집 틀 images 맵(캔버스로 보내는 id → 고른 Blob) + 보관소 메타 → 파생본 전부. 메타가 없으면 그 Blob 1장 */
export const imageReader =
  (images: RenderImages | undefined): ReadImage =>
  (id) => {
    const image = images?.[id];
    return image && { variants: imageMeta(image)?.variants ?? { [image.width]: image.blob }, width: image.width, height: image.height };
  };
