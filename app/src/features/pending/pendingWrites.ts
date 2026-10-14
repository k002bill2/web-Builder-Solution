/**
 * 미확인 쓰기 기억 (RESTART SPEC-4 r0.3a 3.1~3.3) — 탭 수명 · 저장소 인스턴스 범위 · 프로젝트당 1건. 런타임 import 0.
 * - 전이는 요청을 시작할 때 잡은 `ticketOf`(프로젝트 세대 epoch)가 그대로일 때만 적용한다 — 늦게 끝난 요청이 그 사이 생긴·지워진 기억을 덮거나 되살리지 않는다(3.2 세대 규칙 ①④).
 * - 이탈 보호는 화면이 아니라 이 모듈에 붙는다 — 기억 수 + 진행 중 요청 수가 0↔1로 바뀔 때 `beforeunload`를 걸고 뗀다(화면 언마운트 공백 0).
 *   브라우저가 경고를 띄우지 않을 수 있으므로(사용자 활성화 없음 · 모바일 종료) 무손실 보장은 아니다(5.6).
 */
import type { DocHead } from "../../data/projectRepository";

/** 최초 요청 직전 이 탭 메모리의 문서 상태 — 최초 요청 때 1번만 읽고 재시도는 다시 읽지 않는다(F1) */
export type Origin = { readonly kind: "absent" } | { readonly kind: "doc"; readonly head: DocHead } | { readonly kind: "unknown" };

/** 시작 요청(create·restart)이 커밋됐을 수 있으나 IDB 커밋은 확인 못 함 — 재시도 = 같은 인자 startDoc 재생 */
export interface PendingStart {
  readonly kind: "start";
  readonly mode: "create" | "restart";
  readonly projectId: string;
  readonly version: number;
  readonly selected: string;
  readonly origin: Origin;
  readonly held: "unconfirmed" | "unknown";
}

/** 시작 요청은 반영되지 않음(종결) · 메모리 레코드의 IDB 커밋은 확인 못 함 — 재시도 = confirmDoc */
export interface PendingRecord {
  readonly kind: "record";
  readonly projectId: string;
  readonly cause: "start-not-applied";
  /** 안내 문구용(안 · 버전) — 판정에 쓰지 않는다 */
  readonly head?: DocHead;
}

export type Pending = PendingStart | PendingRecord;
export type Held = Pending & { readonly token: number };
/** 요청 시작 때 잡는 세대 — 끝날 때 그대로여야 전이한다 */
export interface Ticket {
  readonly epoch: number;
  readonly token?: number;
}
/** 기억을 지우는 이유 — 영속 확인 · 처음부터 없음(문서도 없음) · 사용자 폐기 */
export type ReleaseWhy = "confirmed" | "not-applied-absent" | "discarded";

interface Book {
  readonly id: number;
  readonly held: Map<string, Held>;
  readonly epoch: Map<string, number>;
}
let books = new WeakMap<object, Book>();
let instances = 0;
let tokens = 0;
const active = new Set<string>();
let inflight = 0;
let listening = false;
/** 기억 변경 구독(이미 그려진 목록이 늦게 끝난 요청의 기억을 다시 판정 — Codex review P2) */
const listeners = new Set<() => void>();
export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}
const notify = () => listeners.forEach((listener) => listener());

const onUnload = (event: BeforeUnloadEvent) => {
  event.preventDefault();
  event.returnValue = "";
};
function sync() {
  const want = active.size + inflight > 0;
  if (want === listening) return;
  listening = want;
  if (want) window.addEventListener("beforeunload", onUnload);
  else window.removeEventListener("beforeunload", onUnload);
}
function bookOf(repo: object): Book {
  let book = books.get(repo);
  if (!book) books.set(repo, (book = { id: (instances += 1), held: new Map(), epoch: new Map() }));
  return book;
}

export const pendingOf = (repo: object, projectId: string): Held | undefined => books.get(repo)?.held.get(projectId);

export function ticketOf(repo: object, projectId: string): Ticket {
  const book = bookOf(repo);
  return { epoch: book.epoch.get(projectId) ?? 0, token: book.held.get(projectId)?.token };
}

/** 요청 끝 전이 — 시작 이후 그 프로젝트 기억에 변화가 없을 때만 next로 바꾼다(undefined = why로 해제). 적용했으면 true */
export function settle(repo: object, projectId: string, ticket: Ticket, next: Pending, why?: never): boolean;
export function settle(repo: object, projectId: string, ticket: Ticket, next: undefined, why: ReleaseWhy): boolean;
export function settle(repo: object, projectId: string, ticket: Ticket, next: Pending | undefined): boolean {
  const book = bookOf(repo);
  if ((book.epoch.get(projectId) ?? 0) !== ticket.epoch) return false;
  book.epoch.set(projectId, ticket.epoch + 1);
  const key = `${book.id}:${projectId}`;
  if (next) {
    book.held.set(projectId, { ...next, token: (tokens += 1) });
    active.add(key);
  } else {
    book.held.delete(projectId);
    active.delete(key);
  }
  sync();
  notify();
  return true;
}

/** 진행 중 요청 보호 — 끝나기 전(커밋 여부를 모르는 구간) 새로고침을 경고한다. 판정·기억 전이는 work 안에서 끝내야 카운트가 0을 거치지 않는다 */
export async function guarding<T>(work: () => Promise<T>): Promise<T> {
  inflight += 1;
  sync();
  try {
    return await work();
  } finally {
    inflight = Math.max(0, inflight - 1);
    sync();
  }
}

/** 사용자가 확인한 폐기(5.5) — 이 탭의 미확인 기억을 모두 버리고, 경고를 먼저 뗀 뒤 새로고침한다 */
export function discardAndReload(reload: () => void = () => window.location.reload()) {
  books = new WeakMap();
  active.clear();
  inflight = 0;
  sync();
  reload();
}
