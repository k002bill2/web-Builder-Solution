/**
 * 파괴 흐름(지우기 clearBrowserData · 프로젝트 삭제 deleteProject) 공유 — 탭(링크)당 잠금 소유 상태 1개 (Codex r1 P2 — P1D-L3 후속).
 * 쓰기 탭에서 한 흐름이 실패하면 싱크는 멈춰(isWriter=false) 있어도 잠금은 탭 수명 동안 이 탭이 쥔다. 흐름마다 따로 기억하면
 * 다른 흐름이 같은 잠금을 다시 요청해(Web Locks 재진입 불가 → null) 자기 잠금을 다른 탭 편집으로 오인한다 — 그래서 한 곳에 둔다.
 * 조작 뒤 청크 전용(두 대화상자 청크만 import — 진입·복원 closure 비공유).
 */
import type { TabLink } from "../../data/persistence/tabLink";
import { tryLock, type WriterLocks } from "../../data/persistence/writerLock";

interface Hold {
  /** writer = 이 탭 싱크가 보유한 잠금(멈춘 뒤에도 탭 수명 동안 보유) · 함수 = 파괴 흐름이 잡은 잠금 */
  held?: "writer" | (() => void);
  /** 지우기 deleteDatabase 요청이 대기 중(onblocked 뒤) — 다른 파괴 흐름은 busy */
  clearing: boolean;
  /** 어느 파괴 흐름이든 이 탭 싱크를 멈췄다 — 실패 뒤 닫으면 새로고침 이동 */
  stopped: boolean;
}

const perTab = new WeakMap<TabLink, Hold>();
const holdOf = (link: TabLink): Hold => {
  const found = perTab.get(link);
  if (found) return found;
  const made: Hold = { clearing: false, stopped: false };
  perTab.set(link, made);
  return made;
};

export interface TabLockHold {
  /** 잠금 확보 — 쓰기 탭이면 보유 잠금 · 이미 쥐고 있으면 재사용 · 아니면 tryLock. false = busy. `navigator.locks` 없음 = 잠금 없이 true */
  acquire(): Promise<boolean>;
  /** 파괴 흐름이 잡은 잠금만 놓는다(싱크 보유 잠금은 탭 수명 동안 유지) */
  release(): void;
  /** 이 탭 싱크 멈춤(있으면) — 멈춤 상태를 두 흐름이 공유한다 */
  stop(): void;
  readonly stopped: boolean;
  clearing: boolean;
}

export function tabLockHold(link: TabLink, locks: WriterLocks | undefined): TabLockHold {
  const hold = holdOf(link);
  return {
    async acquire() {
      if (hold.clearing) return false;
      if (link.own()?.isWriter()) hold.held = "writer";
      if (!hold.held && locks) {
        hold.held = await tryLock(locks);
        if (!hold.held) return false;
      }
      return true;
    },
    release() {
      if (typeof hold.held === "function") {
        hold.held();
        hold.held = undefined;
      }
    },
    stop() {
      const own = link.own();
      if (!own) return;
      own.stop();
      hold.stopped = true;
    },
    get stopped() {
      return hold.stopped;
    },
    get clearing() {
      return hold.clearing;
    },
    set clearing(next: boolean) {
      hold.clearing = next;
    },
  };
}
