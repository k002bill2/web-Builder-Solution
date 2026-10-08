/**
 * 테스트 전용 탭 간 알림 가짜 (P1C-SPEC 1.5) — 브라우저 1개(network) 안의 탭별 링크를 낸다.
 * BroadcastChannel처럼 보낸 탭은 받지 않고 다른 탭들만 받는다(탭당 채널 1개 공유 전제). 전달은 마이크로태스크 뒤.
 */
import { createTabLink, type TabMessage } from "./tabLink";

export function createLinkNetwork() {
  type Listener = (event: { readonly data: unknown }) => void;
  let tabs: readonly { readonly listeners: Set<Listener> }[] = [];
  const sent: TabMessage[] = [];
  return {
    tab() {
      const listeners = new Set<Listener>();
      const me = { listeners };
      tabs = [...tabs, me];
      return createTabLink({
        postMessage: (data: TabMessage) => {
          sent.push(data);
          const others = tabs.filter((t) => t !== me);
          void Promise.resolve().then(() => others.forEach((t) => t.listeners.forEach((fn) => fn({ data }))));
        },
        addEventListener: (_type: "message", fn: Listener) => void listeners.add(fn),
        removeEventListener: (_type: "message", fn: Listener) => void listeners.delete(fn),
      });
    },
    /** 이 브라우저에서 보낸 메시지(순서대로) */
    sent: () => [...sent],
  };
}
