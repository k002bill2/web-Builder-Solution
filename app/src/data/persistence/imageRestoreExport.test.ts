/**
 * B-SEC-07 결합 테스트 — 저장 이미지 레코드 Blob.type 손상 1 + 정상 1을 열기 복원(restoreImages · 실제 readImageRecord)부터
 * 내보내기(imageReader → exportImages → zip 이미지 이름 · 결과 줄)까지 한 줄로 잇는다: 손상 1장만 잃은 이미지 → lostImageText 1회 · 정상 이미지는 포함 · 내보내기 실패 0.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ImageSlotValue, LocalImageId } from "../../engine/contracts/pageDoc";
import { setSlot } from "../../engine/ops/slotOps";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { exportNotes } from "../../features/studio/exportFlow";
import { makePng } from "../../features/studio/images/ingest/fixtures/imageBytes";
import { widthLadder } from "../../features/studio/images/ingest/ladder";
import type { IngestedImage } from "../../features/studio/images/ingest/types";
import type { RenderImages } from "../../features/studio/images/store/types";
import { exportImages, imageReader, lostImageText } from "../../features/studio/staticHtml/exportImages";
import { imageFileNames } from "../../features/studio/zip/staticZip";
import { SCHEMA_VERSION } from "./envelope";
import type { DocRecord } from "./entryRead";
import { imageRecordId } from "./imageRecord";
import { IMAGE_READ, restoreImages } from "./imageRestore";

const GOOD = "00000000-0000-4000-8000-000000000001" as LocalImageId;
const BAD = "00000000-0000-4000-8000-000000000002" as LocalImageId;
const slot = (source: LocalImageId): ImageSlotValue => ({ kind: "image", enabled: true, source, alt: "", decorative: false });
const image = (type = "image/png"): IngestedImage => {
  const variants = Object.fromEntries(widthLadder(2000).map((w) => [w, new Blob([new Uint8Array(makePng({ width: w, height: 10 }))], { type })]));
  return { variants, width: 2000, height: 400, format: "png", bytes: Object.values(variants).reduce((s, b) => s + b.size, 0) };
};
const original = IMAGE_READ.read;
afterEach(() => {
  IMAGE_READ.read = original;
});

describe("B-SEC-07 Blob.type 손상 1 + 정상 1 → 열기 복원 → 내보내기", () => {
  it("손상 레코드만 잃은 이미지 · 결과 줄 lostImageText(1) 정확히 1회 · 정상 이미지는 zip 이미지 파일로 포함 · 내보내기 실패 0", async () => {
    // 바이트·서명·bytes 합은 그대로 두고 Blob.type만 손상(image/<형식> 밖) — 그대로 내보내면 zip 확장자·data URL MIME에서 전체 실패하는 레코드
    const rows = new Map(
      ([
        [GOOD, image()],
        [BAD, image("text/html")],
      ] as const).map(([id, data]) => [imageRecordId("project-1", id), { schemaVersion: SCHEMA_VERSION, kind: "image", id: imageRecordId("project-1", id), data }]),
    );
    IMAGE_READ.read = vi.fn(async (key: string) => rows.get(key));
    const doc = setSlot(setSlot(sampleDoc(), "s-hero", "image", slot(GOOD)), "s-about", "image", slot(BAD));
    let images: RenderImages | undefined;
    await restoreImages("project-1", () => ({ doc, snapshots: [] }) as unknown as DocRecord, (update) => void (images = update(images)));
    expect(IMAGE_READ.read).toHaveBeenCalledTimes(2);
    expect(Object.keys(images ?? {})).toEqual([GOOD]);

    const { images: sent, lost } = exportImages(doc, imageReader(images));
    expect(lost).toBe(1);
    expect(Object.keys(sent)).toEqual([GOOD]);
    expect(sent[GOOD]!.blob.type).toBe("image/png");
    // 렌더 문서 markup에는 정상 id만 image:<id>로 나온다(잃은 이미지 = 자체 그래픽) — zip 이름 규칙이 정상 이미지를 파일로 담는다
    const markup = Object.keys(sent).map((id) => `<img src="image:${id}">`).join("");
    expect([...imageFileNames(markup, sent)]).toEqual([[GOOD, "assets/images/img-01.png"]]);

    for (const format of ["static-zip", "static-html", "react-zip"] as const) {
      const notes = exportNotes({ bytes: 1024, images: Object.keys(sent).length, lost, fonts: 1 }, format);
      expect(notes.filter((note) => note === lostImageText(1))).toHaveLength(1);
      expect(notes.filter((note) => note.includes("다시 골라야"))).toHaveLength(1);
    }
  });
});
