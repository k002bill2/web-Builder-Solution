/** P-8 확정 가능 조건 — Hero 선택 + 저장 완료(저장 중·실패 아님). 경고는 확정을 막지 않는다. */
import type { SaveStatus } from "./compareBoard";
import type { ProfileDraft } from "./profileDraft";

export type ConfirmAvailability = { readonly ok: true } | { readonly ok: false; readonly reason: string };

export function confirmAvailability(draft: ProfileDraft, saveStatus: SaveStatus): ConfirmAvailability {
  if (draft.status !== "ready") return { ok: false, reason: "Hero를 하나 고르면 확정할 수 있습니다" };
  if (saveStatus === "saving") return { ok: false, reason: "선택을 저장하는 중입니다" };
  if (saveStatus === "error") return { ok: false, reason: "저장하지 못한 선택이 있습니다 · 다시 시도" };
  return { ok: true };
}
