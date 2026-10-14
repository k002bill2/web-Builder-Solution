/**
 * RESTART SPEC-4 r0.3a 3.1~3.3 — 미확인 기억(탭 수명 · 저장소 인스턴스 범위)과 모듈 수준 이탈 보호(RS4-AC-05 · 08 · 18c 일부).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DocHead } from "../../data/projectRepository";
import { discardAndReload, guarding, pendingOf, settle, ticketOf, type PendingStart } from "./pendingWrites";

const head = (revision: number) => ({ projectId: "p1", candidateId: "B", profileVersion: 3, revision }) as unknown as DocHead;
const start = (projectId = "p1"): PendingStart => ({
  kind: "start",
  mode: "restart",
  projectId,
  version: 4,
  selected: "C",
  origin: { kind: "doc", head: head(5) },
  held: "unconfirmed",
});
/** 지금 beforeunload가 막히는가(브라우저 경고 조건) */
const guarded = () => {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
};

afterEach(() => discardAndReload(() => undefined));

describe("기억 — 저장소 인스턴스·프로젝트별 1건, 전이는 그 사이 변화가 없을 때만", () => {
  it("처음 요청(기억 없음)도 그 사이 변화 0이면 기억을 만든다(F-5·F-7 — RS4-AC-18c ⑴)", () => {
    const repo = {};
    const t = ticketOf(repo, "p1");
    expect(settle(repo, "p1", t, start())).toBe(true);
    expect(pendingOf(repo, "p1")).toMatchObject({ kind: "start", selected: "C" });
    expect(pendingOf(repo, "p2")).toBeUndefined();
    expect(pendingOf({}, "p1")).toBeUndefined();
  });

  it("늦게 끝난 요청은 그 사이 생긴·지워진 기억을 덮거나 되살리지 않는다(RS4-AC-18c ⑵)", () => {
    const repo = {};
    const late = ticketOf(repo, "p1");
    const now = ticketOf(repo, "p1");
    settle(repo, "p1", now, start());
    settle(repo, "p1", ticketOf(repo, "p1"), undefined, "confirmed");
    expect(settle(repo, "p1", late, start())).toBe(false);
    expect(pendingOf(repo, "p1")).toBeUndefined();
  });

  it("기억이 있던 요청의 해제·종류 전환도 시작 이후 변화가 없을 때만", () => {
    const repo = {};
    settle(repo, "p1", ticketOf(repo, "p1"), start());
    const t = ticketOf(repo, "p1");
    expect(t.token).toBe(pendingOf(repo, "p1")?.token);
    expect(settle(repo, "p1", t, { kind: "record", projectId: "p1", cause: "start-not-applied" })).toBe(true);
    expect(pendingOf(repo, "p1")?.kind).toBe("record");
    expect(settle(repo, "p1", t, undefined, "confirmed")).toBe(false);
    expect(pendingOf(repo, "p1")?.kind).toBe("record");
  });
});

describe("이탈 보호 — 기억·진행 중 요청에 붙는다(화면 수명과 무관)", () => {
  it("기억 0→1 경고 · 1→0 해제", () => {
    const repo = {};
    expect(guarded()).toBe(false);
    settle(repo, "p1", ticketOf(repo, "p1"), start());
    expect(guarded()).toBe(true);
    settle(repo, "p1", ticketOf(repo, "p1"), undefined, "confirmed");
    expect(guarded()).toBe(false);
  });

  it("진행 중 요청 동안 경고 · 성공으로 끝나면 해제(기억 0) · 결과가 기억이면 0을 거치지 않는다", async () => {
    const repo = {};
    let release!: () => void;
    const running = guarding(() => new Promise<void>((ok) => (release = ok)));
    expect(guarded()).toBe(true);
    release();
    await running;
    expect(guarded()).toBe(false);

    const seen: boolean[] = [];
    await guarding(async () => {
      settle(repo, "p1", ticketOf(repo, "p1"), start());
    }).finally(() => seen.push(guarded()));
    expect(seen).toEqual([true]);
    await expect(guarding(() => Promise.reject(new Error("x")))).rejects.toThrow("x");
    expect(guarded()).toBe(true);
  });
});

describe("폐기 — 사용자 확인 뒤에만, 리스너를 먼저 떼고 새로고침", () => {
  it("기억·진행 중 카운트를 비우고 경고 해제 → reload 1회", async () => {
    const repo = {};
    settle(repo, "p1", ticketOf(repo, "p1"), start());
    void guarding(() => new Promise<void>(() => undefined));
    const order: string[] = [];
    const reload = vi.fn(() => order.push(`reload:${guarded()}`));
    discardAndReload(reload);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(order).toEqual(["reload:false"]);
    expect(pendingOf(repo, "p1")).toBeUndefined();
  });
});
