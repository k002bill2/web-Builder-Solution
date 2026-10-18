import type { ExportJob, ProjectRepository } from "../../data/projectRepository";
import { exportChunk } from "./exportFlowFails";

/** B-M4A-08 — 생성기 청크(staticHtml)를 받지 못한 시도도 내보내기 청크 연속 실패로 센다. 청크 실패 없이 끝난 시도는 0으로 */
const load = vi.hoisted(() => ({ failures: 0 }));
vi.mock("./staticHtml/staticHtml", () => {
  if (load.failures-- > 0) throw new TypeError("Failed to fetch dynamically imported module");
  return { createStaticHtmlGenerator: () => async () => ({ downloadRef: "blob:x", resultHash: "h" }) };
});
const { requestExportOnce } = await import("./exportFlow");
const SLOT = Symbol.for("design-studio/static-html-generator");

/** memoryDocBook 앱 경로처럼 요청마다 슬롯 생성기를 부른다 — 생성기 청크 로드 실패 = 잡 실패(INFRA · 재시도 가능) */
function repositoryCallingSlot(): ProjectRepository {
  let job: ExportJob;
  return {
    requestExport: async (projectId: string, format: "static-html", docRevision: number) => {
      const slot = (globalThis as unknown as Record<symbol, () => Promise<(store: unknown) => (input: unknown) => Promise<{ downloadRef: string; resultHash: string }>>>)[SLOT]!;
      job = await slot().then(
        (factory) => factory({})({ projectId, format, doc: {} }).then((r) => ({ jobId: "j1", format, docRevision, state: "succeeded", retryable: false, downloadRef: r.downloadRef, resultHash: r.resultHash }) as ExportJob),
        () => ({ jobId: "j1", format, docRevision, state: "failed", retryable: true, errorCode: "INFRA" }) as ExportJob,
      );
      return { wrote: false, snapshotName: "내보내기 전 · 10:00", snapshotId: "s1", job };
    },
    getExportJob: async () => job,
    getProject: async () => ({ name: "가게" }),
  } as unknown as ProjectRepository;
}

describe("생성기 청크 로드 실패 횟수 (B-M4A-08)", () => {
  it("생성기 청크 2회 연속 실패 → 1 → 2 · 다음 시도 성공 → 0", async () => {
    exportChunk.fails = 0;
    load.failures = 2;
    const repository = repositoryCallingSlot();
    expect(await requestExportOnce(repository, "p1", "static-html", 1)).toEqual({ kind: "retryable", format: "static-html" });
    expect(exportChunk.fails).toBe(1);
    expect(await requestExportOnce(repository, "p1", "static-html", 1)).toEqual({ kind: "retryable", format: "static-html" });
    expect(exportChunk.fails).toBe(2);
    expect((await requestExportOnce(repository, "p1", "static-html", 1)).kind).toBe("done");
    expect(exportChunk.fails).toBe(0);
  });
});
