/**
 * PERSIST-P1b 이미지 자동 복원 본문 (부록 Codex 제약 2) — 참조 집합만 읽고, 레코드 검증·한도(checkLimits)를 저장 규칙 그대로 거친 뒤 메타 WeakMap까지 재구성한다.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ImageSlotValue, LocalImageId, PageDoc } from "../../engine/contracts/pageDoc";
import { setSlot } from "../../engine/ops/slotOps";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { makePng } from "../../features/studio/images/ingest/fixtures/imageBytes";
import { widthLadder } from "../../features/studio/images/ingest/ladder";
import type { IngestedImage } from "../../features/studio/images/ingest/types";
import { addImage, imageMeta, pickVariant, slotTarget } from "../../features/studio/images/store/imageStore";
import type { RenderImages } from "../../features/studio/images/store/types";
import { SCHEMA_VERSION } from "./envelope";
import type { DocRecord } from "./entryRead";
import { imageRecordId } from "./imageRecord";
import { IMAGE_READ, restoreImages } from "./imageRestore";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}` as LocalImageId;
const slot = (source: ImageSlotValue["source"], enabled = true): ImageSlotValue => ({ kind: "image", enabled, source, alt: "", decorative: false });
const png = (width: number) => new Blob([new Uint8Array(makePng({ width, height: 10 }))], { type: "image/png" });
const image = (width = 2000): IngestedImage => {
  const variants = Object.fromEntries(widthLadder(width).map((w) => [w, png(w)]));
  return { variants, width, height: 400, format: "png", bytes: Object.values(variants).reduce((s, b) => s + b.size, 0) };
};
const recordOf = (doc: PageDoc, snapshots: PageDoc[] = []): DocRecord => ({ doc, snapshots: snapshots.map((d, i) => ({ snapshotId: `snapshot-${i + 1}`, doc: d })) }) as unknown as DocRecord;
const stored = (entries: ReadonlyArray<readonly [LocalImageId, unknown]>) => {
  const rows = new Map(entries.map(([id, data]) => [imageRecordId("project-1", id), { schemaVersion: SCHEMA_VERSION, kind: "image", id: imageRecordId("project-1", id), data }]));
  return vi.fn(async (key: string) => rows.get(key));
};
async function run(record: DocRecord, prev?: RenderImages) {
  let images = prev;
  const publish = vi.fn((update: (p: RenderImages | undefined) => RenderImages | undefined) => {
    images = update(images);
  });
  await restoreImages("project-1", record, publish);
  return { images, publish };
}
const original = IMAGE_READ.read;
afterEach(() => {
  IMAGE_READ.read = original;
});

describe("restoreImages", () => {
  it("문서(켜진·꺼진 슬롯)·스냅샷 참조 id만 읽는다 → 슬롯 목표 폭 변형본 + 메타 · 스냅샷만 참조하는 id도", async () => {
    const [a, b, c] = [image(), image(900), image(700)];
    IMAGE_READ.read = stored([
      [uuid(1), a],
      [uuid(2), b],
      [uuid(3), c],
    ]);
    const doc = setSlot(setSlot(sampleDoc(), "s-hero", "image", slot(uuid(1))), "s-about", "image", slot(uuid(2), false));
    const snap = setSlot(sampleDoc(), "s-about", "image", slot(uuid(3)));
    const { images } = await run(recordOf(doc, [snap]));
    const hero = doc.sections.find((s) => s.instanceId === "s-hero")!;
    const about = doc.sections.find((s) => s.instanceId === "s-about")!;
    expect(Object.keys(images!).sort()).toEqual([uuid(1), uuid(2), uuid(3)]);
    expect(images![uuid(1)]!.blob).toBe(pickVariant(a.variants, slotTarget(hero.type, hero.variant)));
    expect(images![uuid(2)]!.blob).toBe(pickVariant(b.variants, slotTarget(about.type, about.variant)));
    expect(imageMeta(images![uuid(1)]!)).toEqual({ variants: a.variants, width: a.width, height: a.height, format: "png", bytes: a.bytes });
    expect(IMAGE_READ.read).toHaveBeenCalledTimes(3);
  });

  it("불량·없는 레코드 id만 빠진다(잃은 이미지) · 나머지는 복원", async () => {
    IMAGE_READ.read = stored([
      [uuid(1), image()],
      [uuid(2), { ...image(), bytes: 1 }],
    ]);
    const doc = setSlot(setSlot(sampleDoc(), "s-hero", "image", slot(uuid(1))), "s-about", "image", slot(uuid(2)));
    const withMissing = setSlot(doc, "s-about", "image", slot(uuid(2)));
    expect(Object.keys((await run(recordOf(withMissing, [setSlot(sampleDoc(), "s-hero", "image", slot(uuid(9)))]))).images!)).toEqual([uuid(1)]);
  });

  it("복원 중 사용자가 넣은 이미지가 이긴다(prev 우선 병합)", async () => {
    IMAGE_READ.read = stored([[uuid(1), image()]]);
    const mine = addImage({}, uuid(1), image(640), 640);
    const { images } = await run(recordOf(setSlot(sampleDoc(), "s-hero", "image", slot(uuid(1)))), mine);
    expect(images![uuid(1)]).toBe(mine[uuid(1)]);
  });

  it("참조 없음 → 읽기 0 · publish 0 / 복원 결과가 한도(checkLimits) 밖 → publish 0", async () => {
    IMAGE_READ.read = stored([]);
    expect((await run(recordOf(sampleDoc()))).publish).not.toHaveBeenCalled();
    expect(IMAGE_READ.read).not.toHaveBeenCalled();
    // 켜진 이미지 13개(문서 한도 12) — 저장 규칙상 있을 수 없는 레코드 묶음
    const ids = Array.from({ length: 13 }, (_, k) => uuid(k + 1));
    IMAGE_READ.read = stored(ids.map((id) => [id, image(640)] as const));
    const over = { ...sampleDoc(), sections: sampleDoc().sections.map((s, k) => (k === 0 ? { ...s, slots: { ...s.slots, ...Object.fromEntries(ids.map((id, i) => [`x${i}`, slot(id)])) } } : s)) } as PageDoc;
    expect((await run(recordOf(over))).publish).not.toHaveBeenCalled();
  });
});
