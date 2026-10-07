/**
 * PERSIST-P1b 이미지 레코드 (ADR-007 3절 (a) `images` · 2a-05 5.9 참조 집합) — 쓰기 op 계산 · 읽은 레코드 검증(저장 규칙과 1:1).
 */
import { describe, expect, it } from "vitest";
import type { ImageSlotValue, LocalImageId, PageDoc } from "../../engine/contracts/pageDoc";
import { setSlot } from "../../engine/ops/slotOps";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { makePng, makeWebp } from "../../features/studio/images/ingest/fixtures/imageBytes";
import { widthLadder } from "../../features/studio/images/ingest/ladder";
import type { IngestedImage } from "../../features/studio/images/ingest/types";
import { addImage } from "../../features/studio/images/store/imageStore";
import type { RenderImages } from "../../features/studio/images/store/types";
import { SCHEMA_VERSION } from "./envelope";
import type { DocRecord } from "./entryRead";
import { imageOps } from "./imageOps";
import { imageRecordId, readImageRecord } from "./imageRecord";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}` as LocalImageId;
const slot = (source: ImageSlotValue["source"], enabled = true): ImageSlotValue => ({ kind: "image", enabled, source, alt: "", decorative: false });
const png = (width: number) => new Blob([new Uint8Array(makePng({ width, height: 10 }))], { type: "image/png" });
/** 변형본을 바꾸면 bytes도 다시 잰다 — 검사 하나만 어기게 */
const withVariants = (img: IngestedImage, variants: Record<number, Blob>): IngestedImage => ({ ...img, variants, bytes: Object.values(variants).reduce((s, b) => s + b.size, 0) });
/** 원본 폭 800 → 사다리 640·800(ingestImage와 같은 규칙) */
const image = (width = 800, height = 400): IngestedImage =>
  withVariants({ variants: {}, width, height, format: "png", bytes: 0 }, Object.fromEntries(widthLadder(width).map((w) => [w, png(w)])));
const docWith = (hero?: LocalImageId, about?: LocalImageId): PageDoc => {
  let doc = sampleDoc();
  if (hero) doc = setSlot(doc, "s-hero", "image", slot(hero));
  if (about) doc = setSlot(doc, "s-about", "image", slot(about, false));
  return doc;
};
const recordOf = (doc: PageDoc, snapshots: PageDoc[] = []): DocRecord =>
  ({ doc, snapshots: snapshots.map((d, i) => ({ snapshotId: `snapshot-${i + 1}`, doc: d })) }) as unknown as DocRecord;
const mapOf = (entries: ReadonlyArray<readonly [LocalImageId, IngestedImage]>): RenderImages => entries.reduce<RenderImages>((acc, [id, img]) => addImage(acc, id, img, 1920), {});
const envelopeOf = (id: string, data: unknown) => ({ schemaVersion: SCHEMA_VERSION, kind: "image", id, data });

describe("imageOps — 문서 쓰기 트랜잭션에 얹을 이미지 op(5.9 참조 집합 규칙)", () => {
  it("참조(켜진·꺼진 슬롯·스냅샷) ∩ 맵 − 저장됨 = put(변형본 Blob 전부 + 메타) · 이 프로젝트의 참조 밖 저장 id = delete · 다른 프로젝트·맵에 없는 참조는 손대지 않는다", () => {
    const [a, b, c] = [image(), image(900), image(700)];
    const images = mapOf([
      [uuid(1), a],
      [uuid(2), b],
      [uuid(3), c],
    ]);
    const stored = new Set([imageRecordId("project-1", uuid(3)), imageRecordId("project-1", uuid(9)), imageRecordId("project-10", uuid(8)), imageRecordId("project-1", uuid(4))]);
    // 문서 = hero uuid1 · about(꺼짐) uuid2 · 스냅샷 = uuid3·uuid4(저장됨) · uuid5는 참조만(맵에 없음 = 잃은 이미지)
    const record = recordOf(docWith(uuid(1), uuid(2)), [docWith(uuid(3), uuid(4)), docWith(uuid(5))]);
    const ops = imageOps("project-1", record, images, stored);
    expect(ops).toEqual([
      { type: "put", store: "images", record: envelopeOf(imageRecordId("project-1", uuid(1)), a) },
      { type: "put", store: "images", record: envelopeOf(imageRecordId("project-1", uuid(2)), b) },
      { type: "delete", store: "images", id: imageRecordId("project-1", uuid(9)) },
    ]);
    // 변형본은 같은 Blob(재인코딩 0)
    expect((ops[0] as { record: { data: IngestedImage } }).record.data.variants[640]).toBe(a.variants[640]);
  });

  it("맵 없음(복원 전) · 참조 없음 → put 0 · 이 프로젝트 저장 id는 참조 밖이면 delete", () => {
    const stored = new Set([imageRecordId("project-1", uuid(1)), imageRecordId("project-1", uuid(2))]);
    expect(imageOps("project-1", recordOf(docWith(uuid(1))), undefined, stored)).toEqual([{ type: "delete", store: "images", id: imageRecordId("project-1", uuid(2)) }]);
    expect(imageOps("project-1", recordOf(docWith()), undefined, new Set())).toEqual([]);
  });
});

describe("readImageRecord — 저장 규칙과 1:1(widthLadder · formatFromMagic · MAX_SIDE·MAX_PIXELS · bytes = 변형본 합)", () => {
  const id = imageRecordId("project-1", uuid(1));
  it("정상 레코드 → 같은 변형본·메타", async () => {
    const img = image();
    expect(await readImageRecord(envelopeOf(id, img), id)).toEqual(img);
  });

  it.each([
    ["봉투 종류·id·버전 다름", (img: IngestedImage) => [{ ...envelopeOf(id, img), kind: "doc" }, { ...envelopeOf("project-1/x", img) }, { ...envelopeOf(id, img), schemaVersion: SCHEMA_VERSION + 1 }]],
    ["형식 목록 밖", (img: IngestedImage) => [envelopeOf(id, { ...img, format: "gif" })]],
    ["사다리와 다른 폭 집합(1280 단 추가·640 빠짐)", (img: IngestedImage) => [envelopeOf(id, withVariants(img, { ...img.variants, 1280: png(1280) } as Record<number, Blob>)), envelopeOf(id, withVariants(img, { 800: img.variants[800]! }))]],
    ["바이트 서명이 형식과 다름(PNG 바이트를 webp로)", (img: IngestedImage) => [envelopeOf(id, { ...img, format: "webp", variants: Object.fromEntries(Object.entries(img.variants).map(([w, b]) => [w, new Blob([b!], { type: "image/webp" })])) })]],
    ["bytes ≠ 변형본 합", (img: IngestedImage) => [envelopeOf(id, { ...img, bytes: img.bytes + 1 })]],
    ["변 길이·픽셀 한도 밖 · 정수 아님", (img: IngestedImage) => [envelopeOf(id, { ...img, height: 16_385 }), envelopeOf(id, image(8000, 6000)), envelopeOf(id, { ...img, height: 1.5 })]],
    ["변형본이 Blob 아님", (img: IngestedImage) => [envelopeOf(id, { ...img, variants: { 640: "x", 800: img.variants[800] } })]],
  ])("%s → undefined(잃은 이미지 경로)", async (_, bad) => {
    for (const record of bad(image())) expect(await readImageRecord(record, id)).toBeUndefined();
  });

  it("WebP 레코드(브라우저 기본 인코딩)도 서명으로 통과", async () => {
    const webp = (w: number) => new Blob([new Uint8Array(makeWebp({ kind: "VP8L", width: w, height: 10 }))], { type: "image/webp" });
    const variants = { 640: webp(640) };
    const img: IngestedImage = { variants, width: 640, height: 320, format: "webp", bytes: variants[640].size };
    expect(await readImageRecord(envelopeOf(id, img), id)).toEqual(img);
  });
});
