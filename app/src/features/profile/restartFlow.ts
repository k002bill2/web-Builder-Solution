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
import { guarding, pendingOf, settle, ticketOf, type Origin, type Pending, type PendingStart, type Ticket } from "../pending/pendingWrites";
import { RESTART_TEXT as T, TAB_REASON } from "./restartText";

/** 대화상자를 여는 인자 — `held` = 미확인 기억으로 다시 연 상태(R-E4 unconfirmed · R-E5 unknown · R-E6 record = 새로 시작 미반영 · 저장 확인 전) */
export interface RestartOpen {
  readonly selected: string;
  readonly version: number;
  /** 이 요청의 `expectedRevision`을 주는 문서 = 최초 요청 직전 상태(origin — 재시도는 다시 읽지 않는다, SPEC-4 F1) */
  readonly doc: DocHead;
  readonly held?: "unconfirmed" | "unknown" | "record";
}
/** create 미확인(C-E4·C-E5·C-E6) — 편집 시작 Callout이 "저장 다시 시도"·"저장 확인"·폐기를 보여 준다 */
export type CreateHeld = "unconfirmed" | "unknown" | "record";
export type EditOutcome =
  | { readonly go: StudioEntryState }
  | { readonly open: RestartOpen }
  /** held = 미확인 Callout — label = 주 버튼 이름(문구는 이 청크에 · 진입 청크 바이트 0) */
  | { readonly alert: string; readonly retry: boolean; readonly held?: CreateHeld; readonly label?: string };

export const shapeOf = (error: unknown) => (error ?? {}) as { code?: string; alert?: string; doc?: DocHead; message?: string };

/** 같은 문서 상태인가(요청 전 그대로 판정 — SPEC-4 6절 3) */
const same = (a: DocHead, b: DocHead) => a.revision === b.revision && a.candidateId === b.candidateId && a.profileVersion === b.profileVersion;
/** 지금 문서 읽기 — 실패 = undefined(확인 불가) */
const read = (repo: ProjectRepository, projectId: string) => repo.getDoc(projectId).then((doc) => ({ doc }), () => undefined);

/** 기억 → 대화상자 인자(restart) */
export function openOf(pending: Pending): RestartOpen | undefined {
  if (pending.kind === "start") return pending.mode === "restart" && pending.origin.kind === "doc" ? { selected: pending.selected, version: pending.version, doc: pending.origin.head, held: pending.held } : undefined;
  return undefined;
}

/** 3.1 표 — 다른 안 = 대화상자(F4) · 같은 안 = 이동(F2 · 버전만 다르면 R-C2 F3) */
const judge = (doc: DocHead, version: number, selected: string, alert?: string): EditOutcome =>
  doc.candidateId !== selected ? { open: { selected, version, doc } } : { go: { editNotice: T.openedAt(doc, version, alert) } };

/** create 사유(쓰기 0 확실) — C-E2·2b·2c·3 · UNKNOWN_VARIANT */
function createReason(error: unknown): EditOutcome {
  const { code, alert, message = "" } = shapeOf(error);
  if (code === "UNKNOWN_VARIANT") return { alert: alert || CANDIDATE_TEXT.startFailed, retry: false };
  if (code === "INFRA" && message.endsWith(TAB_REASON.readonly)) return { alert: T.createReadonly, retry: true };
  if (code === "INFRA" && message.endsWith(TAB_REASON.stale)) return { alert: T.createStaleTab, retry: false };
  if (code === "INFRA" && message.endsWith(TAB_REASON.cleared)) return { alert: T.createCleared, retry: false };
  const cut = message.indexOf(" — ");
  return { alert: code === "INFRA" && cut >= 0 ? `${CANDIDATE_TEXT.startFailed} · ${message.slice(cut + 3)}` : CANDIDATE_TEXT.startFailed, retry: true };
}
const createHeldOut = (held: CreateHeld, head?: DocHead): EditOutcome => ({
  alert: held === "unconfirmed" ? T.createUnconfirmed : held === "unknown" ? T.createUnknown : T.createNotApplied(head),
  retry: true,
  held,
  label: held === "record" ? T.confirm : T.retrySave,
});
/** create 성공 — 재생일 수 있다(3.1 r2): 지금 문서가 돌려받은 머리와 다르면 지금 문서로 다시 판정. 읽기 실패 = F1 */
async function createdOut(repo: ProjectRepository, projectId: string, version: number, selected: string, started: { doc: DocHead; changes?: StudioEntryState["changes"]; changeNotice?: string }): Promise<EditOutcome> {
  const now = await repo.getDoc(projectId).catch(() => undefined);
  return !now || now.revision === started.doc.revision ? { go: { changes: started.changes, editNotice: started.changeNotice } } : judge(now, version, selected);
}

/**
 * 프로필 "X안으로 편집 시작" — 기억이 있으면 그 상태부터(RS-AC-08d). `retry` = 미확인 Callout의 주 버튼(재생 · 저장 확인).
 * 판정 = SPEC-4 4.1(최초) · 4.2(재시도 — before 재조회 0) · 4.3(저장 확인). 전이는 시작 때 세대가 그대로일 때만(3.2).
 */
export async function startEdit(repo: ProjectRepository, projectId: string, version: number, selected: string, retry = false): Promise<EditOutcome> {
  const pending = pendingOf(repo, projectId);
  if (pending?.kind === "start" && pending.mode === "restart") return { open: openOf(pending)! };
  if (pending && !retry) return pending.kind === "start" ? createHeldOut(pending.held) : createHeldOut("record", pending.head);
  const ticket = ticketOf(repo, projectId);
  return guarding(async () => {
    if (pending?.kind === "record") return confirmRecord(repo, projectId, ticket, version, selected);
    if (pending?.kind === "start") return replayCreate(repo, projectId, ticket, pending);
    // 최초 요청 — origin은 여기서 1번만 읽는다(F1)
    const before = await read(repo, projectId);
    const origin: Origin = !before ? { kind: "unknown" } : before.doc ? { kind: "doc", head: before.doc } : { kind: "absent" };
    try {
      const started = await repo.startDoc(projectId, version, selected, "create");
      // 성공도 세대를 올린다 — 앞서 시작해 늦게 실패한 요청이 기억을 되살리지 못하게(Codex review r2)
      settle(repo, projectId, ticket, undefined, "confirmed");
      return await createdOut(repo, projectId, version, selected, started);
    } catch (error: unknown) {
      const { code, alert, doc } = shapeOf(error);
      if (code === "DOC_EXISTS" && doc) return judge(doc, version, selected, alert);
      if (code === "UNKNOWN_VARIANT") return createReason(error);
      const now = await read(repo, projectId);
      // F-5·F-6 확인 불가 · F-7 양성 · F-8 요청 전 그대로 · F-9 문서가 있었는데 create = 커밋 0
      const held: CreateHeld | undefined =
        !now || (origin.kind === "unknown" && now.doc) ? "unknown" : origin.kind === "absent" && now.doc ? "unconfirmed" : undefined;
      if (!held) return createReason(error);
      settle(repo, projectId, ticket, { kind: "start", mode: "create", projectId, version, selected, origin, held });
      return createHeldOut(held);
    }
  });
}

/** create 재시도(4.2) — 기억의 인자 그대로 재생 · before 재조회 0 */
async function replayCreate(repo: ProjectRepository, projectId: string, ticket: Ticket, pending: PendingStart): Promise<EditOutcome> {
  try {
    const started = await repo.startDoc(projectId, pending.version, pending.selected, "create");
    settle(repo, projectId, ticket, undefined, "confirmed");
    return await createdOut(repo, projectId, pending.version, pending.selected, started);
  } catch (error: unknown) {
    const { code, doc } = shapeOf(error);
    // R-2 같은 키 미커밋 → 요청 미반영 종결 · 메모리에 문서가 있으니 그 레코드 확인이 남는다(C-E6)
    if (code === "DOC_EXISTS" && doc) {
      settle(repo, projectId, ticket, { kind: "record", projectId, cause: "start-not-applied", head: doc });
      return createHeldOut("record", doc);
    }
    const now = await read(repo, projectId);
    if (!now || pending.origin.kind === "unknown") return keep(repo, projectId, ticket, pending, "unknown");
    // R-4 요청 전 그대로(문서 없음) — 메모리에 문서 0 = 확인할 것도 0
    if (pending.origin.kind === "absent" && !now.doc) {
      settle(repo, projectId, ticket, undefined, "not-applied-absent");
      return { alert: T.createNotAppliedAbsent, retry: false };
    }
    return keep(repo, projectId, ticket, pending, "unconfirmed");
  }
}
function keep(repo: ProjectRepository, projectId: string, ticket: Ticket, pending: PendingStart, held: PendingStart["held"]): EditOutcome {
  settle(repo, projectId, ticket, { ...pending, held });
  return createHeldOut(held);
}

/** 4.3 저장 확인(confirmDoc) — 성공이면 기억 해제 뒤 지금 문서로 기존 판정(확인 전 이동 0) */
async function confirmRecord(repo: ProjectRepository, projectId: string, ticket: Ticket, version: number, selected: string): Promise<EditOutcome> {
  try {
    await repo.confirmDoc(projectId);
  } catch (error: unknown) {
    return { ...confirmFailed(error), held: "record", label: T.confirm };
  }
  settle(repo, projectId, ticket, undefined, "confirmed");
  const now = await repo.getDoc(projectId).catch(() => undefined);
  if (!now) return { alert: T.confirmed, retry: false };
  const next = judge(now, version, selected, T.confirmedOpen(now));
  return next;
}
/** 4.3 저장 확인 실패 사유 — 다시 누를 수 있으면 retry */
export function confirmFailed(error: unknown): { readonly alert: string; readonly retry: boolean } {
  const { code, message = "" } = shapeOf(error);
  if (code === "IMAGES_MISSING") return { alert: T.imagesMissing, retry: false };
  if (code === "INFRA" && message.endsWith(TAB_REASON.readonly)) return { alert: T.confirmReadonly, retry: true };
  if (code === "INFRA" && message.endsWith(TAB_REASON.stale)) return { alert: T.confirmStaleTab, retry: false };
  if (code === "INFRA" && message.endsWith(TAB_REASON.cleared)) return { alert: T.confirmCleared, retry: false };
  const cut = message.indexOf(" — ");
  return { alert: code === "INFRA" && cut >= 0 ? `${T.notYet} · ${message.slice(cut + 3)}` : T.notYet, retry: true };
}

/**
 * restart 판정(SPEC-4 4.1·4.2 restart 열) — 대화상자가 부른다. 기억이 없던 최초 요청: STALE_DOC = R-E1(기억 0) · 그 밖은 커밋 확인.
 * 기억이 있던 재시도: STALE_DOC = R-2 → PendingRecord(R-E6) · 요청 전 그대로 = PendingRecord · 확인 불가 = unknown · 그 밖 = unconfirmed.
 * 돌려주는 값: "done" = 성공(기억 해제) · held 상태 · "reason" = 음성(쓰기 0 — 대화상자가 코드·사유로)
 */
export async function restartOnce(repo: ProjectRepository, projectId: string, open: RestartOpen): Promise<{ readonly done: { changeNotice?: string } } | { readonly held: "unconfirmed" | "unknown" | "record"; readonly doc?: DocHead } | { readonly reason: unknown }> {
  const ticket = ticketOf(repo, projectId);
  const retrying = Boolean(open.held);
  return guarding(async () => {
    try {
      const started = await repo.startDoc(projectId, open.version, open.selected, "restart", open.doc.revision);
      settle(repo, projectId, ticket, undefined, "confirmed");
      return { done: { changeNotice: started.changeNotice } };
    } catch (error: unknown) {
      const { code, doc: latest } = shapeOf(error);
      const base = { kind: "start", mode: "restart", projectId, version: open.version, selected: open.selected, origin: { kind: "doc", head: open.doc } } as const;
      const hold = (held: "unconfirmed" | "unknown") => (settle(repo, projectId, ticket, { ...base, held }), { held });
      const record = (head?: DocHead) => (settle(repo, projectId, ticket, { kind: "record", projectId, cause: "start-not-applied", head }), { held: "record" as const, doc: head });
      // 커밋 확인 먼저(SPEC r2 3.3.1 — 오류 모양만으로 커밋 전·뒤를 가를 수 없다): 이 요청의 새 문서면 미확인
      const now = await read(repo, projectId);
      const doc = now?.doc;
      if (doc && doc.revision === open.doc.revision + 1 && doc.candidateId === open.selected && doc.profileVersion === open.version) return hold("unconfirmed");
      // 판정 단계 오류 — 같은 키 재생보다 뒤라 이 요청은 커밋된 적 없다(3-2): 처음이면 사유, 재시도면 미반영 종결(R-E6)
      if (code === "STALE_DOC" || code === "UNKNOWN_VARIANT") return retrying ? record(latest ?? doc) : { reason: error };
      if (!now) return hold("unknown");
      if (doc && same(doc, open.doc)) return retrying ? record(doc) : { reason: error };
      return hold("unconfirmed");
    }
  });
}

/** 대화상자 "저장 확인"(R-E6) — 성공 = 기억 해제 + 지금 문서 · 실패 = 사유 */
export async function confirmRestart(repo: ProjectRepository, projectId: string): Promise<{ readonly doc?: DocHead } | { readonly failed: { readonly alert: string; readonly retry: boolean } }> {
  const ticket = ticketOf(repo, projectId);
  return guarding(async () => {
    try {
      await repo.confirmDoc(projectId);
    } catch (error: unknown) {
      return { failed: confirmFailed(error) };
    }
    settle(repo, projectId, ticket, undefined, "confirmed");
    return { doc: await repo.getDoc(projectId).catch(() => undefined) };
  });
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
