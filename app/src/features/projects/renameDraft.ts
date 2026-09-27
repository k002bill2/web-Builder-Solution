/**
 * 이름 바꾸기 초안 (DS-2A-05 SPEC 2.4 J-S05~J-S07). 순수 상태 — 매번 새 객체를 돌려준다.
 * 검증은 저장을 누를 때 한다(J-S06: 저장 버튼은 막지 않는다). 오류가 보이는 동안에는 입력마다 다시 판정한다.
 */
import { ProjectRepositoryError, type Project } from "../../data/projectRepository";
import { validateProjectName } from "../../domain/projectName";

export interface RenameDraft {
  readonly projectId: string;
  /** 저장 요청의 expectedRevision — STALE_PROJECT 뒤에는 최신 값 */
  readonly revision: number;
  readonly value: string;
  readonly submitting: boolean;
  /** 검증 문장(J-S06) — `aria-describedby` */
  readonly error?: string;
  /** 저장 실패 문장(J-S07) — `role=alert` */
  readonly alert?: string;
}

export interface RenameRequest {
  readonly projectId: string;
  readonly revision: number;
  /** 정규화(앞뒤 공백 제거)된 이름 */
  readonly name: string;
}

const FAILED = "이름을 바꾸지 못했습니다 · 다시 시도";

export function openRename(project: Pick<Project, "projectId" | "revision" | "name">): RenameDraft {
  return { projectId: project.projectId, revision: project.revision, value: project.name, submitting: false };
}

export function editRename(draft: RenameDraft, value: string): RenameDraft {
  if (draft.error === undefined) return { ...draft, value };
  const check = validateProjectName(value);
  const next: RenameDraft = { ...core(draft), value, ...(draft.alert !== undefined && { alert: draft.alert }) };
  return check.ok ? next : { ...next, error: check.message };
}

/** 저장 누름 — 저장 중이면 그대로(연타 무시), 무효면 오류만, 유효면 요청 + 저장 중 */
export function submitRename(draft: RenameDraft): { readonly draft: RenameDraft; readonly request?: RenameRequest } {
  if (draft.submitting) return { draft };
  const check = validateProjectName(draft.value);
  if (!check.ok) return { draft: { ...draft, error: check.message } };
  return {
    draft: { ...core(draft), submitting: true },
    request: { projectId: draft.projectId, revision: draft.revision, name: check.name },
  };
}

/** 실패 — 입력은 남긴다. STALE_PROJECT면 최신 revision으로 다음 저장 */
export function failRename(draft: RenameDraft, error: unknown): RenameDraft {
  const latest = error instanceof ProjectRepositoryError && error.code === "STALE_PROJECT" ? error.project : undefined;
  if (!latest) return { ...draft, submitting: false, alert: FAILED };
  return {
    ...draft,
    submitting: false,
    revision: latest.revision,
    alert: `다른 곳에서 이름이 '${latest.name}'로 바뀌었습니다. 입력은 남겨 두었습니다 — 확인 후 다시 저장하세요`,
  };
}

export function renamedText(name: string): string {
  return `이름을 '${name}'으로 바꿨습니다`;
}

/** 오류·알림을 뺀 필수 필드 */
function core(draft: RenameDraft): RenameDraft {
  return { projectId: draft.projectId, revision: draft.revision, value: draft.value, submitting: draft.submitting };
}
