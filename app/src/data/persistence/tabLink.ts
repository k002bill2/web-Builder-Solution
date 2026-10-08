/**
 * 탭 간 알림 + 이 탭 싱크 손잡이 (P1C-SPEC 1.5 · 1.6) — 조작 뒤 localSync 청크와 `/projects` 영역만 import(`/studio` 진입 몫 0).
 * - BroadcastChannel `design-studio` 메시지 2종: `saved`(쓰기 탭 IDB 커밋 뒤) · `cleared`(지우기 직전). 받는 쪽은 모양을 검사한다(경계).
 * - 탭당 채널 1개를 공유한다: 같은 탭의 다른 BroadcastChannel 인스턴스는 자기 탭 메시지도 받으므로, 싱크와 영역이 따로 열면
 *   같은 탭 저장이 영역에 "다른 탭에서 저장한 변경"으로 뜬다.
 * - 손잡이: 열린 싱크가 등록 — 지우기가 "이 탭이 쓰기 탭인가"(같은 탭 재요청은 Web Locks 재진입 불가로 null)와 싱크 멈춤을 쓴다.
 */
export const TAB_CHANNEL = "design-studio";

export type TabMessage = { readonly type: "saved" } | { readonly type: "cleared" };

/** 이 탭 싱크 — isWriter = 잠금 보유 쓰기 탭(멈추면 false) · stop = 쓰기 0 + 연결 닫기 */
export interface TabSyncHandle {
  isWriter(): boolean;
  stop(): void;
}

export interface TabLink {
  post(message: TabMessage): void;
  /** 끊는 함수를 돌려준다 */
  listen(fn: (message: TabMessage) => void): () => void;
  /** 끊는 함수를 돌려준다(그 손잡이가 아직 등록돼 있을 때만 뗀다) */
  attach(handle: TabSyncHandle): () => void;
  own(): TabSyncHandle | undefined;
}

type Channel = {
  postMessage(message: TabMessage): void;
  addEventListener(type: "message", fn: (event: { readonly data: unknown }) => void): void;
  removeEventListener(type: "message", fn: (event: { readonly data: unknown }) => void): void;
};

const readMessage = (data: unknown): TabMessage | undefined => {
  const type = data && typeof data === "object" ? (data as { type?: unknown }).type : undefined;
  return type === "saved" || type === "cleared" ? { type } : undefined;
};

export function createTabLink(channel: Channel | undefined): TabLink {
  let handle: TabSyncHandle | undefined;
  return {
    post: (message) => {
      try {
        channel?.postMessage(message);
      } catch {
        // 닫힌 채널 — 알림은 보조 수단(데이터 안전은 최신성 확인이 맡는다)
      }
    },
    listen: (fn) => {
      const onMessage = (event: { readonly data: unknown }) => {
        const message = readMessage(event.data);
        if (message) fn(message);
      };
      channel?.addEventListener("message", onMessage);
      return () => channel?.removeEventListener("message", onMessage);
    },
    attach: (next) => {
      handle = next;
      return () => {
        if (handle === next) handle = undefined;
      };
    },
    own: () => handle,
  };
}

let shared: TabLink | undefined;
/** 이 탭의 링크(처음 부를 때 채널을 연다) — BroadcastChannel 없음이면 알림 0 */
export const tabLink = (): TabLink =>
  (shared ??= createTabLink(typeof BroadcastChannel === "undefined" ? undefined : (new BroadcastChannel(TAB_CHANNEL) as unknown as Channel)));
