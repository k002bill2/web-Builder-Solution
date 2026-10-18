import type { ExportJob, ProjectRepository } from "../../data/projectRepository";
import type { StudioReader } from "../../data/studioStore";
import { exportChunk } from "./exportFlowFails";

/**
 * RZ-AC-04 단일 흐름 — exportFlow의 React zip 생성기 로더가 retryableImport로 싸여 있어, 첫 청크 import 실패(브라우저 실패 캐시) 뒤
 * 다시 시도하면 같은 청크를 새 URL(`?retry=1`)로 받아 내보내기가 끝난다. 빌드 출력 모양 로더는 cachedChunkFailure가 흉내 낸다
 * (Vitest의 import()는 `./<청크>.js` 모양이 아니라 실제 로더로는 새 URL 경로를 타지 않는다).
 */
const chunk = vi.hoisted(() => ({ staticImports: 0, retries: [] as string[], run: vi.fn() }));
vi.mock("../../data/chunkRetry", async () => {
  const actual = await vi.importActual<typeof import("../../data/chunkRetry")>("../../data/chunkRetry");
  // chunkFailureCache는 chunkRetry를 import해 이 mock 안에서 순환한다 — WebKit 오류 문장만 같게 만든다
  const moduleScriptFailed = () => new TypeError("Importing a module script failed.");
  return {
    retryableImport: <M>(load: () => Promise<M>) => {
      if (!String(load).includes("reactZip/reactZip")) return actual.retryableImport(load);
      const staticImport = Object.assign(() => (chunk.staticImports++, Promise.reject<M>(moduleScriptFailed())), {
        toString: () => "()=>i(()=>import(`./reactZip-RZ4.js`),__vite__mapDeps([0]))",
      });
      return actual.retryableImport(staticImport, (url) => (chunk.retries.push(url), load()));
    },
  };
});
vi.mock("./reactZip/reactZip", () => ({ createReactZipGenerator: () => chunk.run }));
const { requestExportOnce } = await import("./exportFlow");

const SLOT = Symbol.for("design-studio/react-zip-generator");
type Factory = (store: StudioReader) => (input: unknown) => Promise<{ downloadRef: string; resultHash: string }>;
const slot = () => (globalThis as unknown as Record<symbol, () => Promise<Factory>>)[SLOT]!;

/** 저장소 흉내 — 요청마다 슬롯 생성기를 부른다 · 청크 로드 실패 = 잡 INFRA(재시도 가능) */
function repositoryCallingSlot(): ProjectRepository {
  let job: ExportJob;
  return {
    requestExport: async (projectId: string, format: "react-zip", docRevision: number) => {
      job = await slot()()
        .then((factory) => factory({} as StudioReader)({ projectId, format, doc: {} }))
        .then(
          (r) => ({ jobId: "j1", format, docRevision, state: "succeeded", retryable: false, downloadRef: r.downloadRef, resultHash: r.resultHash }) as ExportJob,
          () => ({ jobId: "j1", format, docRevision, state: "failed", retryable: true, errorCode: "INFRA" }) as ExportJob,
        );
      return { wrote: false, snapshotName: "내보내기 전 · 10:00", snapshotId: "s1", job };
    },
    getExportJob: async () => job,
    getProject: async () => ({ name: "가게" }),
  } as unknown as ProjectRepository;
}

describe("React zip 생성기 청크 새 URL 재시도 (RZ-AC-04 단일 흐름)", () => {
  it("첫 import 실패 → retryable · 계수 1 → 다시 시도 = 같은 청크 ?retry=1로 받아 done · 계수 0 · 정적 import 1회", async () => {
    exportChunk.fails = 0;
    chunk.run.mockResolvedValue({ downloadRef: "blob:react-r1", resultHash: "0123456789ab" });
    const repository = repositoryCallingSlot();
    expect(await requestExportOnce(repository, "p1", "react-zip", 5)).toEqual({ kind: "retryable", format: "react-zip" });
    expect(exportChunk.fails).toBe(1);
    const done = await requestExportOnce(repository, "p1", "react-zip", 5);
    expect(done).toMatchObject({ kind: "done", format: "react-zip", download: { href: "blob:react-r1", fileName: "가게_r5_react.zip", hash: "0123456789ab" } });
    expect(exportChunk.fails).toBe(0);
    expect(chunk.staticImports).toBe(1);
    expect(chunk.retries).toEqual([expect.stringMatching(/\/reactZip-RZ4\.js\?retry=1$/)]);
    expect(chunk.run).toHaveBeenCalledTimes(1);
  });
});
