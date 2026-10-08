/**
 * "이 브라우저 데이터 지우기" 흐름 (P1C-SPEC 1.6 1~4단계 · AC-C04·C05) — 조작 뒤 청크(대화상자와 함께 받는다).
 * 1. 잠금: 이 탭이 쓰기 탭이면 이미 보유한 배타 잠금 안에서 진행(같은 탭 재요청은 Web Locks 재진입 불가로 null — 거짓 "다른 탭 편집 중" 방지).
 *    아니면 `design-studio-writer`를 ifAvailable로 — 못 잡으면 busy. 잡은 잠금은 새로고침 이동까지 보유(실패면 놓는다).
 *    `navigator.locks` 없음 = 잠금 없이 진행(어느 탭도 쓰지 않는다 — ADR-007 개정 2 보충).
 * 2. 이 탭 싱크 멈춤(쓰기 0·연결 닫기) → `cleared` 전송 → 3. `deleteDatabase`. onblocked = busy(요청은 대기로 남아 연결이 닫히면 늦게
 *    성공할 수 있다 — 늦은 성공도 성공 흐름) · onerror = failed. 4. 성공 = sessionStorage 1회 키 → `/projects` 새로고침 이동.
 */
import type { TabLink } from "../../data/persistence/tabLink";
import { tryLock, type WriterLocks } from "../../data/persistence/writerLock";

export type ClearResult = "done" | "busy" | "failed";

/** envelope.DB_NAME과 같은 값 — envelope를 import하면 복원 진입 closure에 공유 청크가 하나 더 생긴다(실측 +0.13KB). 테스트가 같음을 단언 */
export const CLEAR_DB_NAME = "design-studio";

/** 새로고침 뒤 `/projects` 영역이 "이 브라우저 데이터를 지웠습니다"를 1회 알리는 키(5단계) */
export const CLEARED_KEY = "design-studio-cleared";

export interface ClearDeps {
  readonly locks: WriterLocks | undefined;
  readonly factory: IDBFactory;
  readonly link: TabLink;
  readonly session: Pick<Storage, "setItem"> | undefined;
  /** 새로고침 이동(메모리 store를 버린다) */
  readonly go: (path: string) => void;
}

export function createClearer({ locks, factory, link, session, go }: ClearDeps) {
  /** 대기 중인 삭제 요청(onblocked 뒤) — 재시도가 두 번째 삭제를 내지 않게 */
  let waiting = false;
  /** writer = 이 탭 싱크가 보유한 잠금(멈춘 뒤에도 탭 수명 동안 보유 — 재시도도 다시 요청하지 않는다) · 함수 = 지우기가 잡은 잠금 */
  let held: "writer" | (() => void) | undefined;
  const finish = () => {
    try {
      session?.setItem(CLEARED_KEY, "1");
    } catch {
      // 저장 불가 — 알림 1회만 잃는다
    }
    go("/projects");
  };
  const fail = (): ClearResult => {
    if (typeof held === "function") {
      held();
      held = undefined;
    }
    return "failed";
  };
  return {
    async clear(): Promise<ClearResult> {
      if (waiting) return "busy";
      const own = link.own();
      if (own?.isWriter()) held = "writer";
      if (!held && locks) {
        held = await tryLock(locks);
        if (!held) return "busy";
      }
      own?.stop();
      link.post({ type: "cleared" });
      return new Promise<ClearResult>((resolve) => {
        try {
          const request = factory.deleteDatabase(CLEAR_DB_NAME);
          waiting = true;
          request.onsuccess = () => {
            waiting = false;
            finish();
            resolve("done");
          };
          request.onblocked = () => resolve("busy");
          request.onerror = () => {
            waiting = false;
            resolve(fail());
          };
        } catch {
          resolve(fail());
        }
      });
    },
  };
}

export type Clearer = ReturnType<typeof createClearer>;

/** 탭(링크)당 지우기 1개 — 보유 잠금(`held`)·대기 중 삭제 요청(`waiting`)은 대화상자 수명이 아니라 탭 수명 상태다.
 *  대화상자마다 새로 만들면 실패 뒤 다시 연 지우기가 멈춘 싱크(isWriter=false)만 보고 자기 잠금에 막혀 busy가 된다(Codex r1). */
const perTab = new WeakMap<TabLink, Clearer>();
export function clearerFor(deps: ClearDeps): Clearer {
  const found = perTab.get(deps.link);
  if (found) return found;
  const made = createClearer(deps);
  perTab.set(deps.link, made);
  return made;
}
