/**
 * "편집 시작" 결과 판정 (RESTART SPEC r2 3.1 F1~F4 · create 재생 재판정 · 3.3 미확인 기억 · 3.3.1 커밋 확인 · R-D5 판정) — 조작 뒤 청크(MQ-S7 ★A).
 * 진입 청크(CandidatesSection)는 `startEdit` 호출 1곳뿐. 오류는 모양만 읽는다(오류 클래스 import 0 — `CandidatesSection` 원칙).
 */
import type { DocHead, ProjectRepository, StudioEntryState } from "../../data/projectRepository";
import { effectiveProfile } from "../../domain/effectiveProfile";
import type { ProfileVersion } from "../../domain/profile";
import { checkProfileContrast } from "../../domain/profileContrast";
import type { PaletteEntry } from "../../domain/referenceDetail";
import { CANDIDATE_TEXT } from "./generationText";
import { RESTART_TEXT as T } from "./restartText";

/** 대화상자를 여는 인자 — `held` = 미확인 기억으로 다시 연 상태(R-E4 unconfirmed · R-E5 unknown) */
export interface RestartOpen {
  readonly selected: string;
  readonly version: number;
  /** 이 요청의 `expectedRevision`을 주는 지금 문서 */
  readonly doc: DocHead;
  readonly held?: "unconfirmed" | "unknown";
}
export type EditOutcome =
  | { readonly go: StudioEntryState }
  | { readonly open: RestartOpen }
  | { readonly alert: string; readonly retry: boolean };

export const shapeOf = (error: unknown) => (error ?? {}) as { code?: string; alert?: string; doc?: DocHead; message?: string };

/** 미확인 기억(3.3) — 저장소(탭 메모리)별 · 프로젝트별. 새로고침이면 메모리도 IDB로 돌아가 기억도 사라진다 */
const memory = new WeakMap<ProjectRepository, Map<string, RestartOpen>>();
export function remember(repo: ProjectRepository, projectId: string, open?: RestartOpen) {
  const held = memory.get(repo) ?? new Map<string, RestartOpen>();
  memory.set(repo, held);
  if (open) held.set(projectId, open);
  else held.delete(projectId);
}

/** 3.1 표 — 다른 안 = 대화상자(F4) · 같은 안 = 이동(F2 · 버전만 다르면 R-C2 F3) */
const judge = (doc: DocHead, version: number, selected: string, alert?: string): EditOutcome =>
  doc.candidateId !== selected ? { open: { selected, version, doc } } : { go: { editNotice: T.openedAt(doc, version, alert) } };

export async function startEdit(repo: ProjectRepository, projectId: string, version: number, selected: string): Promise<EditOutcome> {
  // 미확인 restart가 있으면 create·이동 전에 그 대화상자부터(어느 안을 골랐든 — RS-AC-08d)
  const held = memory.get(repo)?.get(projectId);
  if (held) return { open: held };
  let started;
  try {
    started = await repo.startDoc(projectId, version, selected, "create");
  } catch (error: unknown) {
    const { code, alert, doc } = shapeOf(error);
    if (code === "DOC_EXISTS" && doc) return judge(doc, version, selected, alert);
    return { alert: (code === "UNKNOWN_VARIANT" && alert) || CANDIDATE_TEXT.startFailed, retry: code !== "UNKNOWN_VARIANT" };
  }
  // create 성공도 재생일 수 있다(3.1 r2) — 지금 문서가 돌려받은 머리와 다르면 지금 문서로 다시 판정. 읽기 실패 = F1
  const now = await repo.getDoc(projectId).catch(() => undefined);
  return !now || now.revision === started.doc.revision ? { go: { changes: started.changes, editNotice: started.changeNotice } } : judge(now, version, selected);
}

/** 3.3.1 커밋 확인 — 이 탭 저장소 문서가 이 요청의 새 문서인가. 읽기 실패 = 확인 불가 */
export async function committed(repo: ProjectRepository, projectId: string, open: RestartOpen): Promise<"yes" | "no" | "unknown"> {
  try {
    const now = await repo.getDoc(projectId);
    return now && now.revision === open.doc.revision + 1 && now.candidateId === open.selected && now.profileVersion === open.version ? "yes" : "no";
  } catch {
    return "unknown";
  }
}

const ROLES = ["primary", "surface", "ink", "muted", "bg"] as const;
const HEX = /^#[0-9A-Fa-f]{6}$/;
/**
 * R-D5 미달 수 — 편집기 게이트 대비 줄(engine/gate/contrastRow `contrastIssues`)과 같은 판정. 색을 못 읽으면 undefined(줄 생략 · RS-D6).
 * 엔진은 프로필 청크에서 import하지 않는다(엔진 import 가드) — 같은 domain 함수로.
 */
export function contrastFails({ base, adjustments }: ProfileVersion): number | undefined {
  const applied = base.color_tokens ? effectiveProfile(base, adjustments) : undefined;
  const palette = ROLES.map((role) => ({ role, hex: applied?.color_tokens[role]?.$value as unknown }));
  if (!applied || palette.some((p) => typeof p.hex !== "string" || !HEX.test(p.hex))) return undefined;
  const level = adjustments.contrast === "enhanced" ? "enhanced" : "aa";
  return checkProfileContrast(palette as PaletteEntry[], applied.component_choices.card_style?.surfaceTone, level).filter((c) => !c.pass).length;
}
