/**
 * 내보내기 요청 · 결과 처리 (DS-2A-05 5.13 · E-S27 · 9절) — 조작 뒤 청크(S-B5: 잡 조회 · 결과 처리 · requestExport 호출 경로).
 * 내보내기 버튼을 눌렀을 때만 받는다. `requestExport` **1회** → 새 잡이면 끝날 때까지 조회. 화면은 스냅샷을 만들지 않는다(8.3.2).
 */
import { projectErrorCode, type ExportFormat, type ExportJob, type ProjectRepository } from "../../data/projectRepository";
import { emitEditorEvent } from "./editorEvents";
import { staticHtmlFileName } from "./staticHtml/exportFileName";

export type ExportResult =
  | { readonly kind: "unavailable"; readonly format: ExportFormat }
  | { readonly kind: "unrendered"; readonly format: ExportFormat; readonly sections: readonly string[] }
  | { readonly kind: "retryable"; readonly format: ExportFormat }
  | {
      readonly kind: "done";
      readonly format: ExportFormat;
      readonly snapshotName: string;
      /** 내려받기(부모 문서 a download — M2A-3b G4) · 파일 이름(K-AC-32 HTML판) · 결과 해시 */
      readonly download?: { readonly href: string; readonly fileName: string; readonly hash: string };
    }
  | { readonly kind: "refused"; readonly format: ExportFormat; readonly code: string };

// 앱 경로 정적 HTML 생성기 등록(M2A-3b) — 이 청크(내보내기 버튼을 누른 뒤)가 생성기 청크를 import해야 편집기 청크와 코드를 나눠 쓴다.
// 저장소 쪽은 모듈이 아니라 전역 심볼 슬롯으로 받는다(memoryDocBook STATIC_HTML_SLOT — 같은 키, 청크 분리 0)
(globalThis as Record<symbol, unknown>)[Symbol.for("design-studio/static-html-generator")] ??= async () => (await import("./staticHtml/staticHtml")).createStaticHtmlGenerator;

const POLL_MS = 250;
/** 이 탭에서 화면에 낸 내려받기 object URL — 편집기 이탈 때 해제(releaseDownloads) */
const made = new Set<string>();

/** 편집기 이탈(M2A-3b G3 · ExportAfter DownloadLink) — 내려받기 object URL 해제. 돌아와 같은 revision을 다시 요청하면 같은 잡(멱등)이라 링크가 죽는다(REPORT 9절) */
export function releaseDownloads() {
  for (const href of made) URL.revokeObjectURL(href);
  made.clear();
}
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
      const name = (await repository.getProject(projectId))?.name ?? "";
      const download = job.downloadRef && { href: job.downloadRef, fileName: staticHtmlFileName(name, job.docRevision), hash: job.resultHash ?? "" };
      if (download) made.add(download.href);
      return { kind: "done", format, snapshotName: result.snapshotName, ...(download && { download }) };
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
