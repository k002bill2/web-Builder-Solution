/**
 * RESTART SPEC-4 r0.3a 4.1·4.2·4.3 판정표 — 가짜 저장소로 결과만 본다(RS4-AC-01 · 02 · 03 · 04 · 16).
 * 핵심: 재시도는 before를 다시 읽지 않는다(F1) · 요청 미반영은 저장 확정이 아니다(F2 → PendingRecord + confirmDoc).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectRepositoryError, type DocHead, type ProjectRepository } from "../../data/projectRepository";
import { discardAndReload, pendingOf } from "../pending/pendingWrites";
import { restartOnce, startEdit } from "./restartFlow";

const head = (candidateId: string, revision: number, profileVersion = 1) => ({ projectId: "p", candidateId, profileVersion, revision, hash: `h${revision}` }) as unknown as DocHead;
type Script = {
  docs: (DocHead | undefined | Error)[];
  start: (() => Promise<unknown>)[];
  confirm?: () => Promise<void>;
};
/** getDoc·startDoc 결과를 순서대로 돌려주는 가짜 */
function fake(script: Script) {
  const getDoc = vi.fn(async () => {
    const next = script.docs.length > 1 ? script.docs.shift() : script.docs[0];
    if (next instanceof Error) throw next;
    return next;
  });
  const startDoc = vi.fn(() => (script.start.shift() ?? (() => Promise.reject(new Error("no script"))))());
  const confirmDoc = vi.fn(script.confirm ?? (async () => undefined));
  return { persistence: "local", getDoc, startDoc, confirmDoc } as unknown as ProjectRepository & { getDoc: typeof getDoc; startDoc: typeof startDoc; confirmDoc: typeof confirmDoc };
}
const infra = (reason: string) => new ProjectRepositoryError("INFRA", `저장 — ${reason}`);
const created = { doc: head("B", 1), changes: undefined };

afterEach(() => discardAndReload(() => undefined));

describe("create 최초 요청(4.1)", () => {
  it("F-7 커밋 뒤 실패(문서 없음 → 요청 쌍) = C-E4 · 기억 origin absent", async () => {
    const repo = fake({ docs: [undefined, head("B", 1)], start: [() => Promise.reject(infra("quota"))] });
    const out = await startEdit(repo, "p", 1, "B");
    expect(out).toMatchObject({ held: "unconfirmed", retry: true, label: "저장 다시 시도" });
    expect(pendingOf(repo, "p")).toMatchObject({ kind: "start", mode: "create", origin: { kind: "absent" }, held: "unconfirmed" });
  });

  it("F-8 요청 전 그대로(문서 없음 → 없음) = 사유 · 기억 0 / F-9 문서가 있었는데 실패 = C-E3 · 기억 0", async () => {
    const a = fake({ docs: [undefined, undefined], start: [() => Promise.reject(infra("다른 탭에서 편집 중입니다 — 이 탭의 변경은 저장하지 않습니다"))] });
    expect(await startEdit(a, "p", 1, "B")).toMatchObject({ alert: expect.stringMatching(/^다른 탭에서 편집 중이라 편집을 시작하지 않았습니다/), retry: true });
    expect(pendingOf(a, "p")).toBeUndefined();
    const b = fake({ docs: [head("B", 1), head("B", 1)], start: [() => Promise.reject(new Error("request"))] });
    expect(await startEdit(b, "p", 1, "B")).toMatchObject({ alert: "편집을 시작하지 못했습니다", retry: true });
    expect(pendingOf(b, "p")).toBeUndefined();
  });

  it("F-5 지금 읽기 실패 = C-E5 · F-6 origin 읽기 실패 + 문서 있음 = C-E5(origin unknown) · F-6b + 문서 없음 = C-E3 (RS4-AC-16)", async () => {
    const a = fake({ docs: [undefined, new Error("read")], start: [() => Promise.reject(new Error("x"))] });
    expect(await startEdit(a, "p", 1, "B")).toMatchObject({ held: "unknown" });
    const b = fake({ docs: [new Error("read"), head("B", 1)], start: [() => Promise.reject(new Error("x"))] });
    expect(await startEdit(b, "p", 1, "B")).toMatchObject({ held: "unknown" });
    expect(pendingOf(b, "p")).toMatchObject({ origin: { kind: "unknown" } });
    const c = fake({ docs: [new Error("read"), undefined], start: [() => Promise.reject(new Error("x"))] });
    expect(await startEdit(c, "p", 1, "B")).toMatchObject({ alert: "편집을 시작하지 못했습니다" });
    expect(pendingOf(c, "p")).toBeUndefined();
  });
});

describe("create 재시도(4.2) — before 재조회 0 (F1 · RS4-AC-01)", () => {
  it("C-E4 → 재시도 → 같은 키 재생도 flush 실패 → 미확인 유지(문서가 있어도 '반영 안 됨'으로 풀지 않는다) → 성공 → 해제", async () => {
    const repo = fake({ docs: [undefined, head("B", 1)], start: [() => Promise.reject(infra("quota")), () => Promise.reject(infra("quota")), () => Promise.resolve(created)] });
    await startEdit(repo, "p", 1, "B");
    const reads = repo.getDoc.mock.calls.length;
    // 기억이 있으면 그냥 누르면 상태만 다시 보인다(요청 0)
    expect(await startEdit(repo, "p", 1, "C")).toMatchObject({ held: "unconfirmed" });
    expect(repo.startDoc).toHaveBeenCalledTimes(1);
    expect(await startEdit(repo, "p", 1, "C", true)).toMatchObject({ held: "unconfirmed" });
    expect(repo.startDoc.mock.calls[1]).toEqual(["p", 1, "B", "create"]);
    // 재시도 경로는 origin을 다시 읽지 않는다 — 실패 뒤 커밋 확인 읽기 1번뿐
    expect(repo.getDoc.mock.calls.length - reads).toBe(1);
    expect(pendingOf(repo, "p")).toMatchObject({ kind: "start", origin: { kind: "absent" } });
    expect(await startEdit(repo, "p", 1, "B", true)).toMatchObject({ go: expect.anything() });
    expect(pendingOf(repo, "p")).toBeUndefined();
  });

  it("origin unknown 기억 — 재시도 실패는 문서 유무와 무관하게 유지(R-4u) · 재생 성공으로만 해제", async () => {
    const repo = fake({ docs: [new Error("read"), head("B", 1), undefined], start: [() => Promise.reject(new Error("x")), () => Promise.reject(new Error("x")), () => Promise.resolve(created)] });
    await startEdit(repo, "p", 1, "B");
    expect(await startEdit(repo, "p", 1, "B", true)).toMatchObject({ held: "unknown" });
    expect(pendingOf(repo, "p")).toMatchObject({ origin: { kind: "unknown" } });
  });

  it("origin absent 기억 + 재시도 실패 + 지금도 문서 없음 = 반영 안 됨(not-applied-absent) · 기억 해제", async () => {
    const repo = fake({ docs: [undefined, new Error("read"), undefined], start: [() => Promise.reject(new Error("x")), () => Promise.reject(new Error("x"))] });
    expect(await startEdit(repo, "p", 1, "B")).toMatchObject({ held: "unknown" });
    expect(await startEdit(repo, "p", 1, "B", true)).toMatchObject({ alert: "편집 시작이 반영되지 않았습니다 — 프로필에서 다시 고르세요", retry: false });
    expect(pendingOf(repo, "p")).toBeUndefined();
  });
});

describe("요청 미반영 ≠ 저장 확정 (F2 · RS4-AC-02)", () => {
  it("create 재시도 DOC_EXISTS → PendingRecord(C-E6 · 저장 확인) → confirmDoc 실패 = 유지 · 성공 = 해제 뒤 기존 판정(확인 전 이동 0)", async () => {
    let ok = false;
    const repo = fake({
      docs: [undefined, new Error("read"), head("B", 3)],
      start: [() => Promise.reject(new Error("x")), () => Promise.reject(new ProjectRepositoryError("DOC_EXISTS", "p", { doc: head("B", 3) }))],
      confirm: async () => {
        if (!ok) throw infra("quota");
      },
    });
    await startEdit(repo, "p", 1, "B");
    const out = await startEdit(repo, "p", 1, "B", true);
    expect(out).toMatchObject({ held: "record", label: "저장 확인", alert: expect.stringMatching(/^편집 시작은 반영되지 않았습니다/) });
    expect(out).not.toHaveProperty("go");
    expect(await startEdit(repo, "p", 1, "B", true)).toMatchObject({ held: "record", alert: "아직 저장을 확인하지 못했습니다 · quota" });
    expect(pendingOf(repo, "p")?.kind).toBe("record");
    ok = true;
    expect(await startEdit(repo, "p", 1, "B", true)).toMatchObject({ go: { editNotice: expect.stringMatching(/^저장을 확인했습니다/) } });
    expect(pendingOf(repo, "p")).toBeUndefined();
    expect(repo.startDoc).toHaveBeenCalledTimes(2);
  });

  it("IMAGES_MISSING = 저장 확인 버튼 없음(폐기만) · 기억 유지", async () => {
    const repo = fake({
      docs: [undefined, new Error("read"), head("B", 3)],
      start: [() => Promise.reject(new Error("x")), () => Promise.reject(new ProjectRepositoryError("DOC_EXISTS", "p", { doc: head("B", 3) }))],
      confirm: async () => {
        throw new ProjectRepositoryError("IMAGES_MISSING", "p");
      },
    });
    await startEdit(repo, "p", 1, "B");
    await startEdit(repo, "p", 1, "B", true);
    expect(await startEdit(repo, "p", 1, "B", true)).toMatchObject({ retry: false, held: "record", alert: expect.stringMatching(/일부 이미지/) });
    expect(pendingOf(repo, "p")?.kind).toBe("record");
  });
});

describe("restart(4.1·4.2 restart 열 — RS4-AC-03·04)", () => {
  const origin = head("A", 5);
  const open = { selected: "B", version: 1, doc: origin };
  it("처음: STALE_DOC = 사유(기억 0) · 이 요청의 새 문서 = 미확인 · 요청 전 그대로 = 사유 · 더 나감 = 미확인(SPEC-3 3-1 유지)", async () => {
    const stale = fake({ docs: [head("A", 6)], start: [() => Promise.reject(new ProjectRepositoryError("STALE_DOC", "x", { doc: head("A", 6) }))] });
    expect(await restartOnce(stale, "p", open)).toHaveProperty("reason");
    expect(pendingOf(stale, "p")).toBeUndefined();
    const mine = fake({ docs: [head("B", 6)], start: [() => Promise.reject(new ProjectRepositoryError("STALE_DOC", "응답 단계 주입"))] });
    expect(await restartOnce(mine, "p", open)).toEqual({ held: "unconfirmed" });
    const untouched = fake({ docs: [origin], start: [() => Promise.reject(new Error("x"))] });
    expect(await restartOnce(untouched, "p", open)).toHaveProperty("reason");
    const advanced = fake({ docs: [head("B", 7)], start: [() => Promise.reject(new Error("x"))] });
    expect(await restartOnce(advanced, "p", open)).toEqual({ held: "unconfirmed" });
  });

  it("재시도: STALE_DOC(같은 키 미커밋) = PendingRecord(R-E6) · 요청 전 그대로 = PendingRecord · 재생 성공 = 해제", async () => {
    const stale = fake({ docs: [head("A", 7)], start: [() => Promise.reject(new ProjectRepositoryError("STALE_DOC", "x", { doc: head("A", 7) }))] });
    expect(await restartOnce(stale, "p", { ...open, held: "unknown" })).toMatchObject({ held: "record", doc: { revision: 7 } });
    expect(pendingOf(stale, "p")).toMatchObject({ kind: "record", cause: "start-not-applied" });
    const same = fake({ docs: [origin], start: [() => Promise.reject(new Error("x"))] });
    expect(await restartOnce(same, "p", { ...open, held: "unknown" })).toMatchObject({ held: "record" });
    const ok = fake({ docs: [head("B", 6)], start: [() => Promise.resolve({ doc: head("B", 6) })] });
    expect(await restartOnce(ok, "p", { ...open, held: "unconfirmed" })).toHaveProperty("done");
    expect(pendingOf(ok, "p")).toBeUndefined();
  });
});
