/**
 * 내보내기 요청 · 결과 처리 (DS-2A-05 5.13 · E-S27 · 9절) — 조작 뒤 청크(S-B5: 잡 조회 · 결과 처리 · requestExport 호출 경로).
 * 내보내기 버튼을 눌렀을 때만 받는다. `requestExport` **1회** → 새 잡이면 끝날 때까지 조회. 화면은 스냅샷을 만들지 않는다(8.3.2).
 */
import { projectErrorCode, type ExportFormat, type ExportJob, type ProjectRepository } from "../../data/projectRepository";
import { emitEditorEvent } from "./editorEvents";

export type ExportResult =
  | { readonly kind: "unavailable"; readonly format: ExportFormat }
  | { readonly kind: "unrendered"; readonly format: ExportFormat; readonly sections: readonly string[] }
  | { readonly kind: "retryable"; readonly format: ExportFormat }
  | { readonly kind: "done"; readonly format: ExportFormat; readonly snapshotName: string }
  | { readonly kind: "refused"; readonly format: ExportFormat; readonly code: string };

const POLL_MS = 250;
const POLL_MAX = 40;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function settle(repository: ProjectRepository, job: ExportJob): Promise<ExportJob> {
  let current = job;
  for (let i = 0; i < POLL_MAX && (current.state === "queued" || current.state === "running"); i++) {
    await wait(POLL_MS);
    current = (await repository.getExportJob(job.jobId)) ?? current;
  }
  return current;
}

export async function requestExportOnce(repository: ProjectRepository, projectId: string, format: ExportFormat, revision: number): Promise<ExportResult> {
  emitEditorEvent({ name: "export_requested", format });
  try {
    const result = await repository.requestExport(projectId, format, revision);
    // "내보내기 전" 스냅샷은 이번 호출이 썼을 때만(멱등 재생·재실행이면 내지 않는다 — 9절)
    if (result.wrote) emitEditorEvent({ name: "snapshot_created", kind: "auto", reason: "export" });
    const job = await settle(repository, result.job);
    if (job.state === "succeeded") {
      emitEditorEvent({ name: "export_succeeded", format });
      return { kind: "done", format, snapshotName: result.snapshotName };
    }
    emitEditorEvent({ name: "export_failed", reason: job.errorCode ?? "UNKNOWN" });
    return job.retryable || job.state !== "failed" ? { kind: "retryable", format } : { kind: "refused", format, code: job.errorCode ?? "UNKNOWN" };
  } catch (error) {
    const code = projectErrorCode(error) ?? "UNKNOWN";
    emitEditorEvent({ name: "export_failed", reason: code });
    if (code === "GENERATOR_UNAVAILABLE") return { kind: "unavailable", format };
    if (code === "UNRENDERED_SECTIONS") return { kind: "unrendered", format, sections: (error as { readonly sections?: readonly string[] }).sections ?? [] };
    if (code === "JOB_TIMEOUT" || code === "INFRA" || code === "NETWORK" || code === "UNKNOWN") return { kind: "retryable", format };
    return { kind: "refused", format, code };
  }
}
