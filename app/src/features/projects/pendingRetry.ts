/**
 * `/projects` 행 주 버튼 본문(RESTART SPEC-4 r0.3a 5.2 · RS6-L5) — 조작 뒤 청크(클릭 때 import).
 * 판정은 프로필과 같은 restartFlow(4.2 재생 · 4.3 confirmDoc)를 쓴다. 성공해도 자동 이동하지 않는다(목록에서 사용자가 고른다).
 * 버튼 → method 1:1(I6 8.2): "시작 다시 시도" = starter(기존 재생) · "다시 저장" = 코어 `save` · "저장 확인" = 코어 `confirm`(코어 없음 = confirmDoc).
 */
import type { ProjectRepository } from "../../data/projectRepository";
import type { SaveCore } from "../studio/save/saveCore";
import { guarding, pendingOf, settle, ticketOf, type Pending } from "../pending/pendingWrites";
import { restartOnce, startEdit } from "../profile/restartFlow";
import { RESTART_TEXT as T } from "../profile/restartText";
import { CORE_REASON_TEXT, CORE_ROW_TEXT as C, stuckOf } from "./coreRowText";
import { coreOf } from "./pendingRows";

/** P-U2(RESTART SPEC-4 5.2) — 저장 확인·시작 다시 시도 성공(조작 뒤에만 나온다 — 진입 직후 청크 pendingText에 두지 않는다, B-RS-09 상쇄) */
const CONFIRMED = "저장을 확인했습니다 — 편집기를 열 수 있습니다";
/** UX-5 2.3 영구 확인 — 회복 status(다시 저장 결과에만 나온다 — 행 첫 판정의 진입 직후 청크에 두지 않는다, B-RS-09 상쇄) */
const SAVED = "다시 저장했습니다";
/** 결과 reason 문구 = 행 사유(coreRowText) + 결과에만 나오는 image-missing(UX-5 2.3 `/projects` 행 — 개수는 코어 결과에 없어 뺀 형태, 새 문장 — RS6-L5 REPORT 기록) */
const REASON: Readonly<Record<string, string>> = { ...CORE_REASON_TEXT, "image-missing": "이미지가 빠져 있어 저장을 확인하지 못했습니다" };

/** ok = 확인됨 · stuck = 이 탭에서 더 확인할 수 없음(stale·cleared·이미지 — 폐기만) */
export interface RetryOut {
  readonly ok: boolean;
  readonly text: string;
  readonly stuck?: boolean;
}

/** 시작 대기 = starter(같은 인자 재생 — 코어 `retryStart`에 주입할 함수와 같은 것) · 미확인 기록(코어 없음) = confirmDoc */
export async function retryPending(repo: ProjectRepository, pending: Pending): Promise<RetryOut> {
  const { projectId } = pending;
  if (pending.kind === "start" && pending.mode === "restart" && pending.origin.kind === "doc") {
    const out = await restartOnce(repo, projectId, { selected: pending.selected, version: pending.version, doc: pending.origin.head, held: pending.held });
    if ("done" in out) return { ok: true, text: CONFIRMED };
    if ("held" in out && out.held === "record") return { ok: false, text: T.notApplied(out.doc) };
    return { ok: false, text: T.notYet };
  }
  const version = pending.kind === "start" ? pending.version : (pending.head?.profileVersion ?? 0);
  const selected = pending.kind === "start" ? pending.selected : (pending.head?.candidateId ?? "");
  const out = await startEdit(repo, projectId, version, selected, true);
  if ("go" in out || "open" in out) return { ok: true, text: CONFIRMED };
  return { ok: !out.held && !out.retry, text: out.alert, stuck: Boolean(out.held) && !out.retry };
}

/** 코어 실패 결과 → 행 알림. stale·cleared·unsupported = 이 탭에서 다시 저장해도 같은 결과(버튼 숨김) */
const failed = (reason?: string): RetryOut => ({ ok: false, text: (reason && REASON[reason]) || C.failed, stuck: stuckOf(reason) });

/** "다시 저장"(L3b QA note 1 · I6 12절) — 코어 save 1회. reject도 실패로(거짓 saved 0). memory = not-persistent가 메모리 커밋 성공 */
async function saveAgain(core: SaveCore): Promise<RetryOut> {
  const out = await core.save().catch(() => undefined);
  if (out?.status === "saved" || (out && out.reason === "not-persistent")) return { ok: true, text: SAVED };
  return failed(out?.reason);
}

/**
 * 미확인 기록 + 코어 — 코어 `confirm`(바인딩 이미지까지 · C5 T5). clean이면 재읽기만(같은 내용 재확인 쓰기 0, C5 T13).
 * 재읽기가 마지막 증명과 다르면(기록이 IDB에 닿지 않음) 지금 초안을 한 번 다시 써서 확인한다 — confirmDoc이 하던 "메모리 문서를 다시 쓰기"를 코어 경유로.
 */
async function confirmCore(repo: ProjectRepository, core: SaveCore, projectId: string): Promise<RetryOut> {
  const ticket = ticketOf(repo, projectId);
  const confirm = () => core.link((io, s, link) => io.confirm(s, link, core.save)).catch(() => undefined);
  return guarding(async () => {
    let out = await confirm();
    // stale은 다른 탭 세대(mode)일 수도 있다 — 이 탭이 쓰기 탭일 때만 다시 쓴다(아니면 초안을 건드리지 않는다)
    const writer = out?.status === "failed" && (out.reason === "stale" || out.reason === "not-committed") && !core.view().dirty && (await core.link((_, __, link) => link.port?.mode()).catch(() => undefined)) === "writer";
    if (writer) {
      core.edit(core.view().doc);
      out = await confirm();
    }
    if (out?.status !== "confirmed" && out?.status !== "newer") return failed(out?.reason);
    settle(repo, projectId, ticket, undefined, "confirmed");
    return { ok: true, text: CONFIRMED };
  });
}

/** 클릭~청크 로드 사이에 행 상태가 사라짐(기억 풀림·코어 clean) — 이번 클릭은 저장 0이라 성공 문구 없이 행만 새로고침(B-RS-15) */
const gone: RetryOut = { ok: true, text: "" };

/** 행 주 버튼 — 그 행 상태(pendingRows.describeRow와 같은 우선순위)의 method 1개 */
export async function retryRow(repo: ProjectRepository, projectId: string): Promise<RetryOut> {
  const pending = pendingOf(repo, projectId);
  const core = coreOf(repo, projectId);
  if (pending?.kind === "start" || !core) return pending ? retryPending(repo, pending) : gone;
  if (core.view().dirty) return saveAgain(core);
  return pending ? confirmCore(repo, core, projectId) : gone;
}
