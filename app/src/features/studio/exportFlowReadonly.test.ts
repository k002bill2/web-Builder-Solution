/**
 * B-M4A-12 — 읽기 전용 두 번째 탭의 내보내기 = 재시도 불가 결과(사유 = 읽기 전용) · 쓰기 탭은 그대로 완료.
 * 실제 경로(가짜 Web Locks 두 탭): requestExport 판정 뒤 `kept` flush가 쓰기 탭이 아니라 INFRA(READ_ONLY_TAB)로 거절한다.
 */
import { ProjectRepositoryError, type ProjectRepository } from "../../data/projectRepository";
import { READ_ONLY_TAB, toInfra } from "../../data/persistence/infra";
import { createLockRegistry } from "../../data/persistence/fakeLocks";
import { PROJECT, otherTab, startedRig } from "./save/testRig";

vi.mock("./staticHtml/staticHtml", () => ({
  createStaticHtmlGenerator: () => async () => ({ downloadRef: "blob:test/html", resultHash: "0123456789ab" }),
}));
// 리그 시드 문서는 게이트 차단(대비)이라 GATE_FAILED가 먼저 난다 — 게이트 판정만 통과로 두고 잠금·flush 경로는 실제 그대로 쓴다
vi.mock("../../data/startDocWrite", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../data/startDocWrite")>()),
  judgeExport: () => ({ gateBlocked: false, unrendered: [] }),
}));
const { requestExportOnce } = await import("./exportFlow");

const rejecting = (error: unknown) => ({ requestExport: async () => Promise.reject(error) }) as unknown as ProjectRepository;

describe("B-M4A-12 읽기 전용 탭 내보내기", () => {
  it("다른 탭이 쓰기 탭 → 이 탭 내보내기 = refused READ_ONLY(사유 READ_ONLY_TAB · 재시도 불가) · 쓰기 탭 내보내기 = done", async () => {
    const locks = createLockRegistry();
    const a = await startedRig({ locks: locks.tab() });
    const b = await otherTab(a.db, { locks: locks.tab() });
    const second = await requestExportOnce(b.repo, PROJECT, "static-html", b.seed.revision);
    expect(second).toEqual({ kind: "refused", format: "static-html", code: "READ_ONLY", reason: READ_ONLY_TAB });
    const writer = await requestExportOnce(a.repo, PROJECT, "static-html", a.doc.revision);
    expect(writer).toMatchObject({ kind: "done", format: "static-html" });
  });

  it("그 밖 INFRA(저장 공간 부족·사유 없는 INFRA)는 그대로 재시도 가능 · 사유 0", async () => {
    const quota = toInfra(Object.assign(new Error("q"), { name: "QuotaExceededError" }), "저장");
    expect(await requestExportOnce(rejecting(quota), PROJECT, "static-html", 1)).toEqual({ kind: "retryable", format: "static-html" });
    expect(await requestExportOnce(rejecting(new ProjectRepositoryError("INFRA", "연결")), PROJECT, "static-zip", 1)).toEqual({ kind: "retryable", format: "static-zip" });
  });
});
