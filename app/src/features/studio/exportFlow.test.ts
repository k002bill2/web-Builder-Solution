import type { ExportJob, ProjectRepository } from "../../data/projectRepository";
import type { StudioReader } from "../../data/studioStore";
import type { StaticHtmlDeps } from "./staticHtml/staticHtml";

/** SPEC m2c 5.1·5.2 · MQ-C3 ★A — 앱 경로 생성기 주입(readImage·onBuilt) · 결과 크기 표시 · 3MB 안내 · 잃은 이미지 문장 · decode 실패 사유 */
const made = vi.hoisted(() => ({ deps: [] as Partial<StaticHtmlDeps>[], run: vi.fn() }));
vi.mock("./staticHtml/staticHtml", () => ({
  createStaticHtmlGenerator: (_store: unknown, deps: Partial<StaticHtmlDeps>) => {
    made.deps.push(deps);
    return made.run;
  },
}));
const { exportNotes, requestExportOnce } = await import("./exportFlow");

const MB = 1024 * 1024;
const ID = "11111111-1111-4111-8111-111111111111";
const SLOT = Symbol.for("design-studio/static-html-generator");

/** 저장소 흉내 — requestExport가 슬롯 생성기를 돌려 그 결과로 잡을 끝낸다(memoryDocBook 앱 경로와 같은 순서) */
async function repositoryRunningSlot(): Promise<ProjectRepository> {
  const factory = await (globalThis as unknown as Record<symbol, () => Promise<(store: StudioReader) => (input: unknown) => Promise<{ downloadRef: string; resultHash: string }>>>)[SLOT]!();
  const generate = factory({} as StudioReader);
  let job: ExportJob;
  return {
    requestExport: async (projectId: string, format: "static-html", docRevision: number) => {
      job = await generate({ projectId, format, doc: {} }).then(
        (r) => ({ jobId: "j1", format, docRevision, state: "succeeded", retryable: false, downloadRef: r.downloadRef, resultHash: r.resultHash }) as ExportJob,
        () => ({ jobId: "j1", format, docRevision, state: "failed", retryable: true, errorCode: "INFRA" }) as ExportJob,
      );
      return { wrote: false, snapshotName: "내보내기 전 · 10:00", snapshotId: "s1", job };
    },
    getExportJob: async () => job,
    getProject: async () => ({ name: "가게" }),
  } as unknown as ProjectRepository;
}

describe("내보내기 결과 크기 표시 (MQ-C3 ★A · IMG-AC-24·25)", () => {
  it("크기 줄 = 'HTML 1개 · N.NMB (이미지 N장 포함)' · 이미지 0이면 괄호 생략", () => {
    expect(exportNotes({ bytes: 4.2 * MB, images: 9, lost: 0 })[0]).toBe("HTML 1개 · 4.2MB (이미지 9장 포함)");
    expect(exportNotes({ bytes: 0.72 * MB, images: 0, lost: 0 })).toEqual(["HTML 1개 · 0.7MB"]);
  });

  it("3MB 경계 — 3MB 이하 안내 0 · 넘으면 한 줄 안내(차단 0)", () => {
    expect(exportNotes({ bytes: 3 * MB, images: 1, lost: 0 })).toHaveLength(1);
    expect(exportNotes({ bytes: 3 * MB + 1, images: 1, lost: 0 })[1]).toBe("메일 첨부에는 클 수 있습니다 — zip 내보내기는 다음 단계에서 지원합니다");
  });

  it("잃은 이미지 = 마지막 줄 '이미지 N장을 다시 골라야 해 자체 그래픽으로 넣었습니다'", () => {
    expect(exportNotes({ bytes: 3.5 * MB, images: 2, lost: 2 })).toEqual([
      "HTML 1개 · 3.5MB (이미지 2장 포함)",
      "메일 첨부에는 클 수 있습니다 — zip 내보내기는 다음 단계에서 지원합니다",
      "이미지 2장을 다시 골라야 해 자체 그래픽으로 넣었습니다",
    ]);
  });
});

describe("앱 경로 생성기 주입 (SPEC m2c 5.1 — ExportGenerator 계약 그대로)", () => {
  it("슬롯 생성기 = readImage(이번 요청의 images 맵 · 파생본 전부) + onBuilt 요약 → done 결과 notes", async () => {
    const repository = await repositoryRunningSlot();
    const blob = new Blob(["x"]);
    let read: unknown;
    made.run.mockImplementationOnce(async () => {
      read = made.deps.at(-1)!.readImage!(ID);
      made.deps.at(-1)!.onBuilt!("blob:r1", { bytes: 2 * MB, images: 1, lost: 1 });
      return { downloadRef: "blob:r1", resultHash: "0123456789ab" };
    });
    const result = await requestExportOnce(repository, "p1", "static-html", 3, { [ID]: { blob, width: 800, height: 600 } });
    expect(read).toEqual({ variants: { 800: blob }, width: 800, height: 600 });
    expect(result).toMatchObject({ kind: "done", notes: ["HTML 1개 · 2.0MB (이미지 1장 포함)", "이미지 1장을 다시 골라야 해 자체 그래픽으로 넣었습니다"] });
    await requestExportOnce(repository, "p1", "static-html", 4);
    expect(made.deps.at(-1)!.readImage!(ID)).toBeUndefined();
  });

  it("생성기 decode 실패(IMAGE_FAILED) → retryable + 사유 '이미지를 그리지 못했습니다' · 다른 실패는 사유 0", async () => {
    const repository = await repositoryRunningSlot();
    made.run.mockRejectedValueOnce(new Error("이미지를 그리지 못했습니다")).mockRejectedValueOnce(new Error("다른 실패"));
    expect(await requestExportOnce(repository, "p1", "static-html", 5)).toEqual({ kind: "retryable", format: "static-html", reason: "이미지를 그리지 못했습니다" });
    expect(await requestExportOnce(repository, "p1", "static-html", 6)).toEqual({ kind: "retryable", format: "static-html" });
  });

  it("이미지 맵은 요청(프로젝트)별 — 생성 중 다른 프로젝트 요청이 덮어쓰지 않음 · 요청이 끝나면 놓는다(Codex r1)", async () => {
    const repository = await repositoryRunningSlot();
    const [a, b] = [new Blob(["a"]), new Blob(["b"])];
    const B_ID = "22222222-2222-4222-8222-222222222222";
    let release!: () => void;
    const seen: unknown[] = [];
    made.run.mockImplementationOnce(async () => {
      await new Promise<void>((resolve) => (release = resolve));
      seen.push(made.deps.at(-1)!.readImage!(ID));
      return { downloadRef: "blob:a", resultHash: "a" };
    });
    made.run.mockImplementationOnce(async () => ({ downloadRef: "blob:b", resultHash: "b" }));
    const first = requestExportOnce(repository, "pa", "static-html", 7, { [ID]: { blob: a, width: 10, height: 10 } });
    await Promise.resolve();
    await requestExportOnce(repository, "pb", "static-html", 8, { [B_ID]: { blob: b, width: 10, height: 10 } });
    release();
    await first;
    expect(seen).toEqual([{ variants: { 10: a }, width: 10, height: 10 }]);
    expect(made.deps.at(-1)!.readImage!(ID)).toBeUndefined();
    expect(made.deps.at(-1)!.readImage!(B_ID)).toBeUndefined();
  });
});
