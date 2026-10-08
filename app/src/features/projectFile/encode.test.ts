/**
 * 내보내기 조각 (P2-SPEC 2.1 · 3.2 조각 배열 → Blob · 3.6 자기 거절 파일 금지 EX-12) + AC-P01 왕복(Jarvis 채택 결정 2 수정본).
 */
import { describe, expect, it } from "vitest";
import { fakeDeps, fakeImageBytes, seedDocRecord, seedProject, seedSeries } from "../../test/projectFileFixtures";
import type { IngestedImage } from "../studio/images/ingest/types";
import { checkFile } from "./checkFile";
import { encodeProjectFile, exportLimitHolds, type ExportSource } from "./encode";
import { EXPORT_TOO_LARGE, MAX_FILE_BYTES, MAX_IMAGE_BYTES } from "./format";
import { rekeyImport } from "./rekey";

const image = (width: number, height: number): IngestedImage => {
  const widths = width < 640 ? [width] : [640, width];
  const variants = Object.fromEntries(widths.map((w) => [w, new Blob([fakeImageBytes("png", w, Math.round((height * w) / width)) as BlobPart], { type: "image/png" })]));
  return { variants, width, height, format: "png", bytes: Object.values(variants).reduce((s, b) => s + b!.size, 0) };
};

const source = (images: ExportSource["images"] = [{ localId: "a", image: image(500, 300) }, { localId: "b", image: image(800, 400) }]): ExportSource => ({
  project: seedProject(),
  series: seedSeries(),
  doc: seedDocRecord(),
  images,
  exportedAt: "2026-10-08T09:12:33.000Z",
});

describe("encodeProjectFile", () => {
  it("2.1 봉투 · application/json · 이미지 = 사다리 폭 → 표준 base64", async () => {
    const result = await encodeProjectFile(source());
    if (!result.ok) throw new Error(result.message);
    expect(result.blob.type).toBe("application/json");
    const file = JSON.parse(await result.blob.text());
    expect(file).toMatchObject({ format: "design-studio-project", formatVersion: 1, schemaVersion: 1, exportedAt: "2026-10-08T09:12:33.000Z", project: seedProject(), series: seedSeries() });
    expect(file.doc).toEqual(JSON.parse(JSON.stringify(seedDocRecord())));
    expect(file.images.map((im: { localId: string; variants: object }) => [im.localId, Object.keys(im.variants)])).toEqual([["a", ["500"]], ["b", ["640", "800"]]]);
    expect(atob(file.images[1].variants["640"])).toBe(String.fromCharCode(...fakeImageBytes("png", 640, 320)));
  });

  it("자기 거절 파일 0 — 이미지 25개 · bytes 합 60MB+1 = EX-12 · 파일 96MB+1 판정", async () => {
    const many = Array.from({ length: 25 }, (_, i) => ({ localId: `i${i}`, image: image(500, 300) }));
    expect(await encodeProjectFile(source(many))).toEqual({ ok: false, message: EXPORT_TOO_LARGE });
    const heavy = [{ localId: "h", image: { ...image(500, 300), bytes: MAX_IMAGE_BYTES + 1 } }];
    expect(await encodeProjectFile(source(heavy))).toEqual({ ok: false, message: EXPORT_TOO_LARGE });
    expect(exportLimitHolds({ count: 24, bytes: MAX_IMAGE_BYTES, size: MAX_FILE_BYTES })).toBe(true);
    expect(exportLimitHolds({ count: 1, bytes: 1, size: MAX_FILE_BYTES + 1 })).toBe(false);
  });
});

describe("AC-P01 왕복 — encode → checkFile → rekey (문서·스냅샷 값 동일 · 이미지 수·localId·형식·치수 동일 + 디코드 성공)", () => {
  it("값 동일(재매김 규칙 밖 필드) · 새 id · hash 재계산 · 이미지 = 재인코딩 바이트", async () => {
    const src = source();
    const encoded = await encodeProjectFile(src);
    if (!encoded.ok) throw new Error(encoded.message);
    const { deps, calls } = fakeDeps();
    const checked = await checkFile(encoded.blob, deps);
    if (!checked.ok) throw new Error(checked.message);
    const result = rekeyImport(checked.file, undefined, "2026-10-08T10:00:00.000Z");
    if (!result.ok) throw new Error(result.message);
    const { plan } = result;
    const canon = (v: unknown) => JSON.parse(JSON.stringify(v));
    const strip = (v: object) => ({ ...v, projectId: undefined, hash: undefined });
    expect(canon(strip(plan.doc!.doc))).toEqual(canon(strip(src.doc!.doc)));
    expect(canon(plan.doc!.snapshots.map((s) => ({ ...strip(s), doc: strip(s.doc) })))).toEqual(canon(src.doc!.snapshots.map((s) => ({ ...strip(s), doc: strip(s.doc) }))));
    expect(plan.doc!.snapshotSeq).toBe(src.doc!.snapshotSeq);
    const noProfile = (v: object) => ({ ...v, profileId: undefined });
    expect(canon(plan.series.map(noProfile))).toEqual(canon(src.series.map(noProfile)));
    expect(plan.images.map(({ key, image: im }) => [key, im.format, im.width, im.height, Object.keys(im.variants)])).toEqual([
      ["project-1/a", "png", 500, 300, ["500"]],
      ["project-1/b", "png", 800, 400, ["640", "800"]],
    ]);
    expect(calls.decoded).toBe(3);
    expect(await plan.images[0]!.image.variants["500"]!.text()).toContain("re:");
  });
});

describe("Codex r1 ① 큰 변형본 왕복", () => {
  it("원본 6MiB(base64 8MiB) 변형본 = encode → checkFile ok · 디코드 1 · 재인코딩 바이트", async () => {
    const bytes = new Uint8Array(6 * 1024 * 1024).fill(0x20);
    bytes.set(fakeImageBytes("png", 500, 300));
    const blob = new Blob([bytes as BlobPart], { type: "image/png" });
    const encoded = await encodeProjectFile(source([{ localId: "big", image: { variants: { 500: blob }, width: 500, height: 300, format: "png", bytes: blob.size } }]));
    if (!encoded.ok) throw new Error(encoded.message);
    const { deps, calls } = fakeDeps();
    const checked = await checkFile(encoded.blob, deps);
    if (!checked.ok) throw new Error(checked.message);
    expect(calls.decoded).toBe(1);
    const [image] = checked.file.images;
    expect(image).toMatchObject({ localId: "big", width: 500, height: 300, format: "png" });
    expect(new Uint8Array(await image!.variants["500"]!.arrayBuffer())).toEqual(fakeImageBytes("png", 500, 300, "re:"));
  });
});
