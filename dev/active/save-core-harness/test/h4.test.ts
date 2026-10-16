/**
 * H4 — 탭 A 확인 → 탭 B 실제 저장(세대+1) → 탭 A wrote:false confirm. 두 탭 = 같은 영속 인스턴스 위 코어 2개.
 * 잠금 = 제품 createWriterGate + 제품 fakeLocks registry(브라우저 Web Locks 아님). gate의 fresh 콜백은 `async () => true` mock(범위: 잠금 획득 직후 최신성 판정은 코어 confirm이 대신 함).
 */
import { describe, expect, it } from "vitest";
import { createLockRegistry } from "../../../../app/src/data/persistence/fakeLocks";
import { createWriterGate, type WriterLocks } from "../../../../app/src/data/persistence/writerLock";
import { hashOf, openSaveCore, readStored } from "../core/saveCore";
import { docOf, harnessDb } from "./helpers";

const P = "p1";
const A = docOf(1, "A");
const B2 = docOf(2, "B-tab");
const gateOf = (locks: WriterLocks) => {
  const gate = createWriterGate(locks, async () => true);
  return { mode: () => gate.enter() };
};

async function twoTabs() {
  const db = harnessDb();
  const browser = createLockRegistry();
  const seedTab = browser.tab();
  const seed = await openSaveCore({ projectId: P, persistence: db.persistence, writer: gateOf(seedTab), initial: docOf(0, "seed") });
  seed.edit(A);
  await seed.save(); // 세대 1
  seedTab.close();
  const lockA = browser.tab();
  const lockB = browser.tab();
  const tabA = await openSaveCore({ projectId: P, persistence: db.persistence, writer: gateOf(lockA), initial: docOf(0, "seed") });
  const tabB = await openSaveCore({ projectId: P, persistence: db.persistence, writer: gateOf(lockB), initial: docOf(0, "seed") });
  return { db, lockA, lockB, tabA, tabB };
}

describe("H4 낡은 증명으로 거짓 confirmed 0", () => {
  it("탭 B 저장(세대 2) 뒤 탭 B 닫힘 → 탭 A가 잠금 획득해도 wrote:false confirm = failed stale", async () => {
    const { db, lockB, tabA, tabB } = await twoTabs();
    expect(tabA.view().confirmed).toMatchObject({ generation: 1 });
    tabB.edit(B2);
    expect(await tabB.save()).toMatchObject({ status: "saved", receipt: { generation: 2 } });
    lockB.close();
    const result = await tabA.confirm();
    expect(result).toMatchObject({ status: "failed", reason: "stale" });
    expect((await readStored(db.persistence, P))?.hash).toBe(hashOf(B2));
  });

  it("hydration 같음 ≠ fresh proof: 아무도 안 쓴 writer 탭의 wrote:false는 IDB 재읽기로 proof=fresh receipt", async () => {
    const { tabA } = await twoTabs();
    const result = await tabA.confirm();
    expect(result).toMatchObject({ status: "confirmed", wrote: false, receipt: { hash: hashOf(A), generation: 1, proof: "fresh" } });
    expect(tabA.view().confirmed).toMatchObject({ proof: "hydrated" });
  });

  it("읽기 전용 탭(다른 탭이 잠금 보유): 편집 없이 confirm → failed readonly(hydration 증명 재사용 0)", async () => {
    const { tabA, tabB } = await twoTabs();
    tabB.edit(B2);
    await tabB.save(); // 탭 B가 잠금을 탭 수명 동안 보유
    expect(await tabA.confirm()).toMatchObject({ status: "failed", reason: "readonly" });
  });

  it("탭 B 저장 뒤 탭 A의 dirty 저장 → failed stale · B 문서 덮어쓰기 0(예상 세대 불일치)", async () => {
    const { db, lockB, tabA, tabB } = await twoTabs();
    tabB.edit(B2);
    await tabB.save();
    lockB.close();
    tabA.edit(docOf(2, "A-edit"));
    expect(await tabA.save()).toMatchObject({ status: "failed", reason: "stale" });
    expect((await readStored(db.persistence, P))?.hash).toBe(hashOf(B2));
    expect(tabA.view()).toMatchObject({ dirty: true, confirmed: { generation: 1 } });
  });
});
