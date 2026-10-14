/**
 * `/projects` 행 "저장 다시 시도"·"저장 확인" 본문(RESTART SPEC-4 r0.3a 5.2) — 조작 뒤 청크(클릭 때 import).
 * 판정은 프로필과 같은 restartFlow(4.2 재생 · 4.3 confirmDoc)를 쓴다. 성공해도 자동 이동하지 않는다(목록에서 사용자가 고른다).
 */
import type { ProjectRepository } from "../../data/projectRepository";
import { PENDING_TEXT as P } from "../pending/pendingText";
import type { Pending } from "../pending/pendingWrites";
import { restartOnce, startEdit } from "../profile/restartFlow";
import { RESTART_TEXT as T } from "../profile/restartText";

export async function retryPending(repo: ProjectRepository, pending: Pending): Promise<{ readonly ok: boolean; readonly text: string }> {
  const { projectId } = pending;
  if (pending.kind === "start" && pending.mode === "restart" && pending.origin.kind === "doc") {
    const out = await restartOnce(repo, projectId, { selected: pending.selected, version: pending.version, doc: pending.origin.head, held: pending.held });
    if ("done" in out) return { ok: true, text: P.confirmed };
    if ("held" in out && out.held === "record") return { ok: false, text: T.notApplied(out.doc) };
    return { ok: false, text: T.notYet };
  }
  const version = pending.kind === "start" ? pending.version : (pending.head?.profileVersion ?? 0);
  const selected = pending.kind === "start" ? pending.selected : (pending.head?.candidateId ?? "");
  const out = await startEdit(repo, projectId, version, selected, true);
  if ("go" in out || "open" in out) return { ok: true, text: P.confirmed };
  return { ok: !out.held && !out.retry, text: out.alert };
}
