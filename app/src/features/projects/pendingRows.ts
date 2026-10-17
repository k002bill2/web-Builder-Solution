/**
 * `/projects` 미확인 행 표시(RESTART SPEC-4 r0.3a 5.2) — 진입 직후 자동 import(첫 화면 바이트 0 · 진입 직후 합계에 포함).
 * 목록은 이 모듈이 오기 전에는 그리지 않는다(기억이 있는 행에 "편집기 열기"가 잠깐 보이는 거짓 구간 0).
 * RS6-L5: 저장 코어 상태도 읽는다(레지스트리 읽기만 — 코어 생성 0). 우선순위 = 시작 대기 > 저장 중 > 저장 실패 > 미확인 기록.
 */
import type { CoreKeeper, SaveCore } from "../studio/save/saveCore";
import { DiscardConfirm } from "../pending/DiscardConfirm";
import { PENDING_TEXT as P } from "../pending/pendingText";
import { pendingOf, settle, subscribe, ticketOf, type Pending } from "../pending/pendingWrites";
import { CORE_REASON_TEXT as R, CORE_ROW_TEXT as C, stuckOf } from "./coreRowText";

export { DiscardConfirm, pendingOf, subscribe };

/** P-U1 상태 글자 · 주 버튼 이름 */
export function describePending(p: Pending): { readonly status: string; readonly label: string } {
  const status =
    p.kind === "record" ? P.record(p.head) : p.held === "unknown" ? P.unknown(p.version, p.selected) : p.mode === "restart" ? P.restart(p.version, p.selected) : P.create(p.version, p.selected);
  return { status, label: p.kind === "record" ? P.confirm : P.retryStart };
}
export const ROW_TEXT = { caption: P.caption, working: P.working, discard: P.discard };

/** 레지스트리에 있는 코어(편집기가 연 것만) — 없으면 undefined */
export const coreOf = (repo: object, projectId: string): SaveCore | undefined => (repo as CoreKeeper).cores?.get(projectId);

/** 행 표시 — label 없음 = 버튼 없음 · open = "편집기 열기" 유지(코어 초안은 편집기가 다시 이어 받는다) · quiet = 실패 색 아님 */
export interface RowState {
  readonly status: string;
  readonly label?: string;
  readonly working: string;
  readonly open?: boolean;
  readonly quiet?: boolean;
}

/** 코어 → 포트 환경(writer·readonly·stale·cleared·unsupported) — 행 판정은 동기라 목록을 그리기 전에 읽어 둔다(B-RS-09) */
const envs = new WeakMap<SaveCore, string | undefined>();

/**
 * 저장 실패로 초안이 걸린 코어(dirty · 저장 중 아님)만 포트 mode를 읽는다(confirmCore와 같은 호출 — readonly면 잠금을 다시 요청한다).
 * 목록 게이트가 이 뒤에 열린다 → 첫 표시부터 사유 문구(UX-5 2.3). 읽기 실패 = 모름(일반 실패 문구) · reject 0.
 */
export const probeCores = (repo: object) =>
  Promise.all(
    [...((repo as CoreKeeper).cores?.values() ?? [])].map(async (core) => {
      const view = core.view();
      if (view.dirty && !view.inflight) envs.set(core, await core.link((_, __, link) => link.port?.mode()).catch(() => undefined));
    }),
  );

/** 한 행 상태 1개(UX-5 2.2 "한 상태에 버튼 1개") — 시작 대기는 코어 상태보다 앞선다(UX-5 4.1) · 환경 사유 > 저장 중 > 저장 실패(2.2) */
export function describeRow(repo: object, projectId: string): RowState | undefined {
  const pending = pendingOf(repo, projectId);
  if (pending?.kind === "start") return { ...describePending(pending), working: P.working };
  const core = coreOf(repo, projectId);
  const view = core?.view();
  if (view && view.inflight > 0) return { status: C.saving, working: C.saving, open: true, quiet: true };
  // stale·cleared·unsupported = 다시 저장해도 같은 결과(pendingRetry `failed`와 같은 규칙) → 버튼 숨김 · readonly = 그 탭을 닫은 뒤 다시 저장
  const env = core && envs.get(core);
  if (view?.dirty) return { status: (env && R[env]) || C.failed, label: stuckOf(env) ? undefined : C.saveAgain, working: C.saving, open: true };
  return pending && { ...describePending(pending), working: P.working };
}

/**
 * 코어 변화 따라가기 — 코어에는 구독이 없다. 저장 중인 코어는 `idle()`(성공·실패 모두 resolve) 뒤 onChange.
 * RS6-AC-U16(RS4-R2): 미확인 기록 뒤 코어가 local 커밋에 성공했으면(기록 revision보다 새 커밋 · clean) 그 기록을 푼다 — 1클릭 확인 불필요.
 * 시작 대기(PendingStart)는 풀지 않는다(I6 G8). 돌려주는 함수 = 그만 따라가기.
 */
export function watchCores(repo: object, onChange: () => void): () => void {
  let live = true;
  (repo as CoreKeeper).cores?.forEach((core, projectId) => {
    const view = core.view();
    // 저장이 끝나면 환경을 다시 읽고(실패했으면 사유 문구) 다시 판정
    if (view.inflight > 0) void core.idle().then(() => probeCores(repo)).then(() => live && onChange());
    const pending = pendingOf(repo, projectId);
    const proof = view.confirmed;
    if (pending?.kind === "record" && pending.head && !view.dirty && view.inflight === 0 && proof?.proof === "committed" && proof.revision > pending.head.revision)
      settle(repo, projectId, ticketOf(repo, projectId), undefined, "confirmed");
  });
  return () => void (live = false);
}
