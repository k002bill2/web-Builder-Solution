/**
 * 테스트 전용 Web Locks 가짜 (P1C-SPEC 1.5) — jsdom에는 `navigator.locks`가 없다. 브라우저 1개(registry) 안의 탭별 핸들을 낸다.
 * `ifAvailable` 요청만 흉내 낸다: 이미 누가 잡았으면 콜백에 null. 콜백이 돌려준 Promise가 끝나면 놓고, `close()`(탭 닫힘)는 그 탭의 잠금을 모두 놓는다.
 */
import type { WriterLocks } from "./writerLock";

export interface FakeLockTab extends WriterLocks {
  close(): void;
}

export function createLockRegistry() {
  let held: ReadonlyMap<string, FakeLockTab> = new Map();
  const release = (name: string, tab: FakeLockTab) => {
    if (held.get(name) === tab) held = new Map([...held].filter(([key]) => key !== name));
  };
  return {
    tab(): FakeLockTab {
      const tab: FakeLockTab = {
        request: async (name, _options, callback) => {
          if (held.has(name)) return callback(null);
          held = new Map(held).set(name, tab);
          try {
            return await callback({ name });
          } finally {
            release(name, tab);
          }
        },
        close: () => [...held].filter(([, by]) => by === tab).forEach(([name]) => release(name, tab)),
      };
      return tab;
    },
    /** `navigator.locks.query()`의 held 이름 목록에 해당 */
    held: () => [...held.keys()],
    holder: (name: string) => held.get(name),
  };
}

/** 탭 1개뿐인 브라우저 — 다중 탭을 보지 않는 기존 싱크 테스트용(호출마다 새 registry) */
export const soloLocks = () => createLockRegistry().tab();
