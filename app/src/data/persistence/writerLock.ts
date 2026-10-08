/**
 * 다중 탭 쓰기 잠금 (P1C-SPEC 1.5 · ADR-007 3절 Web Locks · MQ-C2 A "먼저 편집한 탭" · MQ-C3 A steal 없음) — 조작 뒤 localSync 몫(진입 0).
 * - 첫 쓰기 때 `design-studio-writer`를 ifAvailable로 요청한다(진입·읽기만으로는 잡지 않음). 잡으면 끝나지 않는 Promise로 탭 수명 동안 보유 → 탭 닫힘·언로드에 자연 해제.
 * - 잡은 직후 최신성 확인(fresh) — 낡았으면 즉시 놓고 "stale"(새로고침 전까지 유지 · 쓰지 못하는 탭이 다른 탭의 쓰기를 막지 않게).
 * - 못 잡으면 "readonly" — 다음 enter(다시 저장)에서 다시 요청한다. `navigator.locks` 없음 = "unsupported"(쓰기 0, THREATS T5 읽기 전용 폴백).
 */
export const WRITER_LOCK = "design-studio-writer";

/** `navigator.locks` 중 쓰는 부분 — 테스트는 fakeLocks로 바꿔 끼운다 */
export interface WriterLocks {
  request<T>(name: string, options: { readonly ifAvailable: true }, callback: (lock: { readonly name: string } | null) => T | Promise<T>): Promise<T>;
}

export type WriterMode = "writer" | "readonly" | "stale" | "unsupported";

export interface WriterGate {
  /** 아직 시도 전 = undefined */
  readonly mode: WriterMode | undefined;
  /** 쓰기 전 — writer·stale·unsupported는 그대로, 시도 전·readonly는 잠금을 (다시) 요청한다. 진행 중 요청은 함께 기다린다 */
  enter(): Promise<WriterMode>;
}

/** 잡으면 놓는 함수 · 못 잡으면 undefined */
const tryLock = (locks: WriterLocks) =>
  new Promise<(() => void) | undefined>((resolve) => {
    locks
      .request(WRITER_LOCK, { ifAvailable: true }, (lock) => (lock ? new Promise<void>((release) => resolve(release)) : resolve(undefined)))
      .catch(() => resolve(undefined));
  });

export function createWriterGate(locks: WriterLocks | undefined, fresh: () => Promise<boolean>): WriterGate {
  let mode: WriterMode | undefined = locks ? undefined : "unsupported";
  let attempt: Promise<WriterMode> | undefined;
  const acquire = async (held: WriterLocks): Promise<WriterMode> => {
    const release = await tryLock(held);
    if (!release) return "readonly";
    try {
      if (await fresh()) return "writer";
    } catch (error) {
      release();
      throw error;
    }
    release();
    return "stale";
  };
  return {
    get mode() {
      return mode;
    },
    enter() {
      if (!locks || mode === "writer" || mode === "stale") return Promise.resolve(mode!);
      attempt ??= acquire(locks)
        .then((next) => (mode = next))
        .finally(() => (attempt = undefined));
      return attempt;
    },
  };
}
