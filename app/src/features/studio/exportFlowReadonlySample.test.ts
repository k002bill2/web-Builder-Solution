/**
 * B-M4A-12 × 샘플 묶음(SAMPLE-BUNDLE CONTINUE-2) — 읽기 전용 두 번째 탭의 sample-zip 내보내기 = refused READ_ONLY(재시도 불가).
 * exportFlowReadonly.test.ts와 같은 실제 경로(가짜 Web Locks 두 탭 · flush 거절).
 */
import { READ_ONLY_TAB } from "../../data/persistence/infra";
import { createLockRegistry } from "../../data/persistence/fakeLocks";
import { PROJECT, otherTab, startedRig } from "./save/testRig";

vi.mock("./staticHtml/staticHtml", () => ({
  createStaticHtmlGenerator: () => async () => ({ downloadRef: "blob:test/sample", resultHash: "0123456789ab" }),
}));
vi.mock("../../data/startDocWrite", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../data/startDocWrite")>()),
  judgeExport: () => ({ gateBlocked: false, unrendered: [] }),
}));
const { requestExportOnce } = await import("./exportFlow");

describe("B-M4A-12 읽기 전용 탭 — 샘플 묶음", () => {
  it("다른 탭이 쓰기 탭 → 이 탭 sample-zip = refused READ_ONLY(사유 READ_ONLY_TAB) · 쓰기 탭 sample-zip = done", async () => {
    const locks = createLockRegistry();
    const a = await startedRig({ locks: locks.tab() });
    const b = await otherTab(a.db, { locks: locks.tab() });
    expect(await requestExportOnce(b.repo, PROJECT, "sample-zip", b.seed.revision)).toEqual({ kind: "refused", format: "sample-zip", code: "READ_ONLY", reason: READ_ONLY_TAB });
    expect(await requestExportOnce(a.repo, PROJECT, "sample-zip", a.doc.revision)).toMatchObject({ kind: "done", format: "sample-zip" });
  });
});
