import type { ExportJob, ProjectRepository } from "../../data/projectRepository";
import type { StudioReader } from "../../data/studioStore";
import { exportChunk } from "./exportFlowFails";
import type { ReactZipDeps } from "./reactZip/reactZip";
import { REACT_ZIP_NEXT, reactZipNote } from "./reactZip/reactZipText";

/** REACTZIP-SPEC 1.2·1.3 — 생성기 청크는 exportFlow의 별도 retryableImport 슬롯(RZQ-02 A) · 같은 실패 계수 · 파일 이름 · 결과 줄 · 읽기 전용 탭 */
const made = vi.hoisted(() => ({ deps: [] as Partial<ReactZipDeps>[], run: vi.fn(), failures: 0, loads: 0 }));
vi.mock("./reactZip/reactZip", () => {
  made.loads++;
  if (made.failures-- > 0) throw new TypeError("Failed to fetch dynamically imported module");
  return {
    createReactZipGenerator: (_store: unknown, deps: Partial<ReactZipDeps>) => {
      made.deps.push(deps);
      return made.run;
    },
  };
});
vi.mock("./staticHtml/staticHtml", () => {
  throw new Error("React zip 경로는 정적 HTML 생성기 청크를 받지 않는다");
});
const { requestExportOnce } = await import("./exportFlow");

const MB = 1024 * 1024;
const SLOT = Symbol.for("design-studio/react-zip-generator");
type Factory = (store: StudioReader) => (input: unknown) => Promise<{ downloadRef: string; resultHash: string }>;
const slot = () => (globalThis as unknown as Record<symbol, () => Promise<Factory>>)[SLOT]!;

/** 저장소 흉내 — 요청마다 슬롯 생성기를 부른다(memoryDocBook 앱 경로) · 청크 로드 실패 = 잡 INFRA(재시도 가능) */
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

describe("React zip 생성기 청크 (RZ-AC-04 · B-M4A-08과 같은 계수)", () => {
  // 생성기를 받기 전이어야 한다(받은 모듈은 기억) → 이 파일 첫 테스트
  it("청크 로드 1회 실패 → retryable · 계수 1 → 다시 시도 성공 → done · 계수 0 · 정적 HTML 청크 로드 0", async () => {
    exportChunk.fails = 0;
    made.failures = 1;
    const repository = repositoryCallingSlot();
    made.run.mockResolvedValue({ downloadRef: "blob:react-1", resultHash: "0123456789ab" });
    expect(await requestExportOnce(repository, "p1", "react-zip", 5)).toEqual({ kind: "retryable", format: "react-zip" });
    expect(exportChunk.fails).toBe(1);
    expect((await requestExportOnce(repository, "p1", "react-zip", 5)).kind).toBe("done");
    expect(exportChunk.fails).toBe(0);
    expect(made.loads).toBe(2);
  });

  it("완료 → 내려받기 이름 <이름>_r<rev>_react.zip(RZ-AC-19) · 결과 줄 = 자리 상수(크기·이미지·글꼴) + 다음 할 일 안내", async () => {
    const repository = repositoryCallingSlot();
    made.run.mockImplementationOnce(async () => {
      made.deps.at(-1)!.onBuilt!("blob:react-2", { bytes: 1.5 * MB, images: 2, lost: 0, fonts: 2 });
      return { downloadRef: "blob:react-2", resultHash: "0123456789ab" };
    });
    const result = await requestExportOnce(repository, "p1", "react-zip", 5);
    expect(result).toMatchObject({ kind: "done", format: "react-zip", download: { href: "blob:react-2", fileName: "가게_r5_react.zip", hash: "0123456789ab" } });
    expect(result.kind === "done" && result.notes).toEqual([reactZipNote(1.5 * MB, 2, 2), REACT_ZIP_NEXT]);
  });

  it("잃은 이미지 → 결과 줄 끝에 현행 lostImageText", async () => {
    const repository = repositoryCallingSlot();
    made.run.mockImplementationOnce(async () => {
      made.deps.at(-1)!.onBuilt!("blob:react-3", { bytes: MB, images: 1, lost: 1, fonts: 1 });
      return { downloadRef: "blob:react-3", resultHash: "h" };
    });
    const result = await requestExportOnce(repository, "p1", "react-zip", 6);
    expect(result.kind === "done" && result.notes?.at(-1)).toBe("이미지 1장을 다시 골라야 해 자체 그래픽으로 넣었습니다");
  });

  it("생성기 단언·용량 초과(shown 표식) → retryable + 사유 = 생성기 문구(RZ-AC-18 사유 경로)", async () => {
    const repository = repositoryCallingSlot();
    made.run.mockRejectedValueOnce(Object.assign(new Error("문구"), { shown: true }));
    expect(await requestExportOnce(repository, "p1", "react-zip", 5)).toEqual({ kind: "retryable", format: "react-zip", reason: "문구" });
  });

  it("읽기 전용 탭(INFRA + READ_ONLY_TAB) → refused READ_ONLY · 다시 시도 0 (RZ-AC-05)", async () => {
    const READ_ONLY_TAB = "다른 탭에서 편집 중입니다 — 이 탭의 변경은 저장하지 않습니다";
    const { ProjectRepositoryError } = await import("../../data/projectRepository");
    const repository = { requestExport: async () => Promise.reject(new ProjectRepositoryError("INFRA", `저장 실패: ${READ_ONLY_TAB}`)) } as unknown as ProjectRepository;
    expect(await requestExportOnce(repository, "p1", "react-zip", 5)).toEqual({ kind: "refused", format: "react-zip", code: "READ_ONLY", reason: READ_ONLY_TAB });
  });
});
