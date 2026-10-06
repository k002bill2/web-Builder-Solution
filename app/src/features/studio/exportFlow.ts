/**
 * 내보내기 요청 · 결과 처리 (DS-2A-05 5.13 · E-S27 · 9절) — 조작 뒤 청크(S-B5: 잡 조회 · 결과 처리 · requestExport 호출 경로).
 * 내보내기 버튼을 눌렀을 때만 받는다. `requestExport` **1회** → 새 잡이면 끝날 때까지 조회. 화면은 스냅샷을 만들지 않는다(8.3.2).
 */
import { retryableImport } from "../../data/chunkRetry";
import { projectErrorCode, type ExportFormat, type ExportGenerator, type ExportJob, type ProjectRepository } from "../../data/projectRepository";
import type { StudioReader } from "../../data/studioStore";
import { emitEditorEvent } from "./editorEvents";
import type { RenderImages } from "./images/store/types";
import { staticHtmlFileName } from "./staticHtml/exportFileName";
import { IMAGE_FAILED, imageReader, lostImageText, type ExportSummary } from "./staticHtml/exportImages";

export type ExportResult =
  | { readonly kind: "unavailable"; readonly format: ExportFormat }
  | { readonly kind: "unrendered"; readonly format: ExportFormat; readonly sections: readonly string[] }
  /** reason = 사용자에게 보일 실패 사유(지금은 이미지 decode 실패만 — SPEC m2c 5.3-3) */
  | { readonly kind: "retryable"; readonly format: ExportFormat; readonly reason?: string }
  | {
      readonly kind: "done";
      readonly format: ExportFormat;
      readonly snapshotName: string;
      /** 내려받기(부모 문서 a download — M2A-3b G4) · 파일 이름(K-AC-32 HTML판) · 결과 해시 */
      readonly download?: { readonly href: string; readonly fileName: string; readonly hash: string };
      /** 결과 줄(MQ-C3 ★A) — 크기 · 3MB 초과 안내 · 잃은 이미지 */
      readonly notes?: readonly string[];
    }
  | { readonly kind: "refused"; readonly format: ExportFormat; readonly code: string };

// 앱 경로 정적 HTML 생성기 등록(M2A-3b) — 이 청크(내보내기 버튼을 누른 뒤)가 생성기 청크를 import해야 편집기 청크와 코드를 나눠 쓴다.
// 저장소 쪽은 모듈이 아니라 전역 심볼 슬롯으로 받는다(memoryDocBook STATIC_HTML_SLOT — 같은 키, 청크 분리 0)
// 생성기 청크는 retryableImport로 받는다(P2-2 — 첫 로드 실패 뒤 다시 시도하면 새 URL로 다시 받는다)
// 이미지(SPEC m2c 5.1): 생성기 계약은 그대로 두고 팩토리에 readImage(이번 요청의 images 맵 — 파생본 전부)·onBuilt(결과 요약)를 주입한다.
// 생성기는 저장소당 1개라 맵은 요청(프로젝트)별 자리에서 읽는다 — 로컬 id(UUID)는 프로젝트 사이에 겹치지 않는다(Codex r1).
// 놓는 때 = 잡이 끝났을 때(생성기 종료 · 조회한 잡이 끝남). 잡은 응답과 따로 돌므로 응답 실패로는 놓지 않는다(Codex r2)
// 요약은 내려받기 참조 키(같은 revision 멱등 재생도 같은 참조)
const loadGenerator = retryableImport(() => import("./staticHtml/staticHtml"));
const requestImages = new Map<string, RenderImages>();
const readRequestImage = (id: string) => [...requestImages.values()].map((images) => imageReader(images)(id)).find(Boolean);
const summaries = new Map<string, ExportSummary>();
const imageFailed = new Set<string>();
(globalThis as Record<symbol, unknown>)[Symbol.for("design-studio/static-html-generator")] ??= async () => {
  const { createStaticHtmlGenerator } = await loadGenerator();
  return (store: StudioReader): ExportGenerator => {
    const generate = createStaticHtmlGenerator(store, { readImage: readRequestImage, onBuilt: (ref, summary) => summaries.set(ref, summary) });
    return (input) =>
      generate(input)
        .catch((error: unknown) => {
          if (error instanceof Error && error.message === IMAGE_FAILED) imageFailed.add(input.projectId);
          throw error;
        })
        .finally(() => requestImages.delete(input.projectId));
  };
};

const MB = 1024 * 1024;
/** 결과 줄(MQ-C3 ★A · SPEC m2c 5.2): 크기 표시 → 3MB 넘으면 안내(차단 0) → 잃은 이미지 개수 */
export const exportNotes = ({ bytes, images, lost }: ExportSummary): string[] => [
  `HTML 1개 · ${(bytes / MB).toFixed(1)}MB${images > 0 ? ` (이미지 ${images}장 포함)` : ""}`,
  ...(bytes > 3 * MB ? ["메일 첨부에는 클 수 있습니다 — zip 내보내기는 다음 단계에서 지원합니다"] : []),
  ...(lost > 0 ? [lostImageText(lost)] : []),
];

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

export async function requestExportOnce(repository: ProjectRepository, projectId: string, format: ExportFormat, revision: number, images?: RenderImages, onSnapshot?: () => void): Promise<ExportResult> {
  emitEditorEvent({ name: "export_requested", format });
  imageFailed.delete(projectId);
  if (images) requestImages.set(projectId, images);
  else requestImages.delete(projectId);
  try {
    const result = await repository.requestExport(projectId, format, revision);
    // 스냅샷 생성 응답 시점에 참조 집합을 갱신한다 — 잡을 기다리는 동안 이미지를 바꿔도 "내보내기 전" 스냅샷 Blob을 놓지 않게(B-ER-06)
    onSnapshot?.();
    // "내보내기 전" 스냅샷은 이번 호출이 썼을 때만(멱등 재생·재실행이면 내지 않는다 — 9절)
    if (result.wrote) emitEditorEvent({ name: "snapshot_created", kind: "auto", reason: "export" });
    const job = await settle(repository, result.job);
    if (job.state === "succeeded" || job.state === "failed") requestImages.delete(projectId);
    if (job.state === "succeeded") {
      emitEditorEvent({ name: "export_succeeded", format });
      const name = (await repository.getProject(projectId))?.name ?? "";
      const download = job.downloadRef && { href: job.downloadRef, fileName: staticHtmlFileName(name, job.docRevision), hash: job.resultHash ?? "" };
      const summary = job.downloadRef ? summaries.get(job.downloadRef) : undefined;
      return { kind: "done", format, snapshotName: result.snapshotName, ...(download && { download }), ...(summary && { notes: exportNotes(summary) }) };
    }
    emitEditorEvent({ name: "export_failed", reason: job.errorCode ?? "UNKNOWN" });
    return job.retryable || job.state !== "failed" ? { kind: "retryable", format, ...(imageFailed.has(projectId) && { reason: IMAGE_FAILED }) } : { kind: "refused", format, code: job.errorCode ?? "UNKNOWN" };
  } catch (error) {
    const code = projectErrorCode(error) ?? "UNKNOWN";
    emitEditorEvent({ name: "export_failed", reason: code });
    if (code === "GENERATOR_UNAVAILABLE") return { kind: "unavailable", format };
    if (code === "UNRENDERED_SECTIONS") return { kind: "unrendered", format, sections: (error as { readonly sections?: readonly string[] }).sections ?? [] };
    if (code === "JOB_TIMEOUT" || code === "INFRA" || code === "NETWORK" || code === "UNKNOWN") return { kind: "retryable", format };
    return { kind: "refused", format, code };
  }
}
