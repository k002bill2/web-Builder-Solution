import { describe, expect, it } from "vitest";
import type { ImageSlotValue, LocalImageId, PageDoc } from "../../../../engine/contracts/pageDoc";
import { setSlot } from "../../../../engine/ops/slotOps";
import { sampleDoc } from "../../../../engine/testing/sampleDoc";
import type { IngestedImage } from "../ingest";
import { addImage, checkLimits, imageMeta, pickVariant, pruneImages, retainedIds, slotTarget } from "./imageStore";
import type { RenderImages } from "./types";

/** 이미지 보관소 순수 함수 (SPEC m2c 2.6 · 5.1 · 2a-05 5.9 한도 · IMG-AC-11 · 15) */
const MB = 1024 * 1024;
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}` as LocalImageId;
const slot = (source: ImageSlotValue["source"], enabled = true): ImageSlotValue => ({ kind: "image", enabled, source, alt: "", decorative: false });
const blobOf = (bytes: number) => new Blob([new Uint8Array(bytes)], { type: "image/webp" });
const ingested = (width: number, widths: readonly number[], bytesEach = 10): IngestedImage => ({
  variants: Object.fromEntries(widths.map((w) => [w, blobOf(bytesEach)])),
  width,
  height: Math.round(width / 2),
  format: "webp",
  bytes: bytesEach * widths.length,
});
/** n개 섹션 이미지 슬롯을 흉내 내려고 hero 슬롯 하나만 쓰고, 나머지는 같은 문서의 about·hero 교차로 채운다 */
const withHero = (doc: PageDoc, source: ImageSlotValue["source"], enabled = true) => setSlot(doc, "s-hero", "image", slot(source, enabled));
const withAbout = (doc: PageDoc, source: ImageSlotValue["source"], enabled = true) => setSlot(doc, "s-about", "image", slot(source, enabled));
/** images 맵에 id마다 bytes 크기 항목을 넣는다(메타 = 보관 바이트) */
const store = (entries: ReadonlyArray<readonly [LocalImageId, number]>): RenderImages =>
  entries.reduce<RenderImages>((acc, [id, bytes]) => addImage(acc, id, { ...ingested(800, [640], bytes), bytes }, 1920), {});

describe("보관소 — 참조 집합 · 해제", () => {
  it("retainedIds = 현재 문서 ∪ 되돌릴 문서의 로컬 id(꺼진 슬롯 포함 · 플레이스홀더 제외)", () => {
    const doc = withAbout(withHero(sampleDoc(), uuid(1)), uuid(2), false);
    const undo = withHero(sampleDoc(), uuid(3));
    expect([...retainedIds(doc, undo)].sort()).toEqual([uuid(1), uuid(2), uuid(3)]);
    expect([...retainedIds(sampleDoc(), undefined)]).toEqual([]);
  });

  it("pruneImages: 참조 밖 id만 버린 새 맵 · 버릴 것이 없으면 같은 맵(재렌더 0) · 입력 불변", () => {
    const images = store([
      [uuid(1), 10],
      [uuid(2), 10],
    ]);
    const pruned = pruneImages(images, new Set([uuid(1)]));
    expect(Object.keys(pruned)).toEqual([uuid(1)]);
    expect(Object.keys(images)).toHaveLength(2);
    expect(pruneImages(pruned, new Set([uuid(1)]))).toBe(pruned);
    expect(pruneImages(undefined, new Set())).toEqual({});
  });
});

describe("보관소 — 한도(보관 바이트 · 2a-05 5.9 · IMG-AC-11)", () => {
  /** 문서 하나에 켜진 이미지 n개를 흉내 낸다 — hero에 새 id, 나머지는 맵에만 두고 about 끈 슬롯에 둔 것처럼 센다 */
  const docUsing = (enabledIds: readonly LocalImageId[]): PageDoc =>
    ({ ...sampleDoc(), sections: sampleDoc().sections.map((s, k) => (k === 0 ? { ...s, slots: { ...s.slots, ...Object.fromEntries(enabledIds.map((id, i) => [`x${i}`, slot(id)])) } } : s)) }) as PageDoc;

  it("13번째 켜진 이미지 → 거부 문구(개수) · 12번째는 통과", () => {
    const ids = Array.from({ length: 13 }, (_, k) => uuid(k + 1));
    const twelve = store(ids.slice(0, 12).map((id) => [id, 10] as const));
    expect(checkLimits(docUsing(ids.slice(0, 12)), undefined, twelve)).toEqual({ ok: true });
    const thirteen = store(ids.map((id) => [id, 10] as const));
    expect(checkLimits(docUsing(ids), undefined, thirteen)).toEqual({ ok: false, message: "이미지는 한 페이지에 12개까지 쓸 수 있습니다 — 다른 슬롯의 이미지를 끈 뒤 고르세요" });
  });

  it("문서 합계 30MB 초과 → 거부 문구(합계 소수 1자리) · 꺼진 슬롯 이미지는 문서 한도에서 빠진다", () => {
    const big = store([
      [uuid(1), 20 * MB],
      [uuid(2), 11.4 * MB],
    ]);
    expect(checkLimits(docUsing([uuid(1), uuid(2)]), undefined, big)).toEqual({ ok: false, message: "이 페이지의 이미지가 합계 30MB를 넘습니다 (31.4MB) — 더 작은 파일을 고르세요" });
    const offDoc = withHero(docUsing([uuid(1)]), uuid(2), false);
    expect(checkLimits(offDoc, undefined, big)).toEqual({ ok: true });
  });

  it("탭 전체 24개 · 60MB(문서 ∪ 되돌릴 문서) 초과 → 거부 · 맵·문서 그대로", () => {
    const ids = Array.from({ length: 25 }, (_, k) => uuid(k + 1));
    const images = store(ids.map((id) => [id, 10] as const));
    const doc = docUsing(ids.slice(0, 12));
    const undo = docUsing(ids.slice(12));
    const before = JSON.stringify(Object.keys(images));
    expect(checkLimits(doc, undo, images)).toEqual({ ok: false, message: "이 탭에 보관한 이미지가 24개 · 60MB를 넘습니다 — 쓰지 않는 슬롯의 이미지를 지운 뒤 고르세요" });
    expect(JSON.stringify(Object.keys(images))).toBe(before);
    expect(checkLimits(doc, docUsing(ids.slice(12, 24)), images)).toEqual({ ok: true });
  });
});

describe("보관소 — 파생본 선택(SPEC 5.1) · 메타", () => {
  it("slotTarget: hero fullbleed-left·image = 1920 · split·grid·about = 1280 · portfolio·map = 640", () => {
    expect(slotTarget("hero", "fullbleed-left")).toBe(1920);
    expect(slotTarget("hero", "image")).toBe(1920);
    expect(slotTarget("hero", "split")).toBe(1280);
    expect(slotTarget("about", "story")).toBe(1280);
    expect(slotTarget("portfolio", "grid-3")).toBe(640);
    expect(slotTarget("footer", "biz-extended-map")).toBe(640);
  });

  it("pickVariant: 목표 이상 가장 작은 폭 · 없으면 가장 큰 후보 · 후보 0 = undefined", () => {
    const v500 = ingested(500, [500]).variants;
    expect(pickVariant(v500, 1920)).toBe(v500[500]);
    expect(pickVariant(v500, 640)).toBe(v500[500]);
    const v1500 = ingested(1500, [640, 1280, 1500]).variants;
    expect(pickVariant(v1500, 1920)).toBe(v1500[1500]);
    expect(pickVariant(v1500, 640)).toBe(v1500[640]);
    expect(pickVariant({}, 640)).toBeUndefined();
  });

  it("addImage: 캔버스 값 = {고른 Blob, 원본 폭·높이} · 메타 = 파생본·형식·바이트 · 파일 이름 0 · 입력 맵 불변", () => {
    const image = ingested(1500, [640, 1280, 1500], 7);
    const before: RenderImages = {};
    const next = addImage(before, uuid(9), image, 640);
    expect(before).toEqual({});
    expect(next[uuid(9)]).toEqual({ blob: image.variants[640], width: 1500, height: 750 });
    const meta = imageMeta(next[uuid(9)]!);
    expect(meta).toEqual({ variants: image.variants, width: 1500, height: 750, format: "webp", bytes: 21 });
    expect(Object.keys(meta!).sort()).toEqual(["bytes", "format", "height", "variants", "width"]);
  });
});

describe("참조 집합 ∪ 스냅샷 — ER-AC-S6 (EDITOR-REST SPEC r1 3.2 · 2a-05 5.9 탭 한도)", () => {
  it("retainedIds = 문서 ∪ 되돌릴 문서 ∪ 모든 스냅샷 문서", () => {
    const snap = withHero(sampleDoc(), uuid(7));
    expect([...retainedIds(withHero(sampleDoc(), uuid(1)), undefined, [snap, withAbout(sampleDoc(), uuid(8))])].sort()).toEqual([uuid(1), uuid(7), uuid(8)]);
  });

  it("탭 한도 초과가 스냅샷이 붙잡은 이미지 때문이면 스냅샷 거부 문장 · 스냅샷 없으면 통과", () => {
    const doc = withHero(sampleDoc(), uuid(1));
    const snap = withHero(sampleDoc(), uuid(2));
    const images = store([
      [uuid(1), 25 * MB],
      [uuid(2), 40 * MB],
    ]);
    expect(checkLimits(doc, undefined, images, [snap])).toEqual({ ok: false, message: "스냅샷이 이전 이미지를 보관하고 있어 더 넣을 수 없습니다 (24개 · 60MB까지) — 더 작은 파일을 고르세요" });
    expect(checkLimits(doc, undefined, images)).toEqual({ ok: true });
  });
});
