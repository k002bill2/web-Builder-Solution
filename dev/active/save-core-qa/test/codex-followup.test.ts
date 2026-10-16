/**
 * Codex adversarial-review 이후 작성(07dec81 자기 반례 커밋 뒤) — Codex 지적 3번 "discard가 폐기 바인딩을 남김" 독립 재현.
 * "CX-n [계약]" = 계약 단언, 실패 = Codex 지적 재현.
 */
import { describe, expect, it } from "vitest";
import { openSaveCore, readImage, readStored } from "../../save-core-harness/core/saveCore";
import { blobOf, docOf, harnessDb, writerAlways } from "../../save-core-harness/test/helpers";

describe("Codex 지적 재현", () => {
  it("CX-3 [계약 I7 '저장 상태로 복귀'] [모델 내·id 정책 의존] discard 뒤 바인딩에 폐기 Blob이 남아 다음 저장이 폐기 바이트를 커밋", async () => {
    const db = harnessDb();
    const core = await openSaveCore({ projectId: "p", persistence: db.persistence, writer: writerAlways, initial: docOf(0, "init") });
    core.edit(docOf(1, "A", ["img"]), new Map([["img", blobOf("X")]]));
    await core.save();
    core.edit(docOf(2, "B", ["img"]), new Map([["img", blobOf("Y")]]));
    const d = await core.discard();
    const viewBlob = await core.view().blob("img")?.text();
    core.edit(docOf(3, "A-text", ["img"]));
    const s = await core.save();
    const bytes = await (await readImage(db.persistence, "img"))?.text();
    console.log(`[QA] CX-3 ${JSON.stringify({ discard: d.status, viewBlobAfterDiscard: viewBlob, save: s.status, stored: (await readStored(db.persistence, "p"))?.doc.body, imageBytes: bytes })}`);
    expect(bytes).toBe("X");
  });
});
