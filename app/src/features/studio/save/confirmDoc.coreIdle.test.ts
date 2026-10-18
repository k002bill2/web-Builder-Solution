/**
 * B-RS-08 U14-b — `confirmDoc`는 코어 chain(`idle`)이 끝난 뒤 DocBook 확인을 낸다(G1).
 * 장치: 이미지 키 읽기(`keys("images")`)를 호출 순번별로 막는다 — 1번 = 코어 commit(바인딩 0 · IDB 이미지 참조), 2번 = 확인.
 * 코어 B 제출 뒤 · DocBook 맞춤(align) 앞에 확인이 쓰면 옛 문서(A)가 B 뒤에 커밋된다 — 끝 IDB 문서 = 코어가 마지막 커밋한 B여야 한다.
 */
import { describe, expect, it } from "vitest";
import { PROJECT, bindOf, deferred, edited, otherTab, startedRig, ticks, uuid, withImage, type Deferred, type HarnessDb } from "./testRig";

/** keys("images") n번째 호출(무장 뒤 1부터)을 막는다 — reached = 닿음 · release = 진행(닿기 전 release면 그냥 지나간다) */
function gatedKeys(db: HarnessDb) {
  const gates = new Map<number, { readonly reached: Deferred; readonly gate: Deferred }>();
  let armed = false;
  let calls = 0;
  const gated: HarnessDb = {
    ...db,
    persistence: {
      ...db.persistence,
      keys: async (store: Parameters<HarnessDb["persistence"]["keys"]>[0]) => {
        if (armed && store === "images") {
          calls += 1;
          const held = gates.get(calls);
          if (held) {
            held.reached.release();
            await held.gate.promise;
          }
        }
        return db.persistence.keys(store);
      },
    },
  };
  return {
    gated,
    arm(n: number) {
      armed = true;
      const held = { reached: deferred(), gate: deferred() };
      gates.set(n, held);
      return { reached: held.reached.promise, release: held.gate.release };
    },
  };
}

describe("confirmDoc — 코어 chain 뒤(U14-b)", () => {
  it("코어 save가 commit 중일 때 확인해도 끝 IDB 문서 = 코어가 커밋한 문서(옛 DocBook 문서 덮어쓰기 0)", async () => {
    const { db, doc, core } = await startedRig();
    // 탭 1: 이미지 참조 문서 A를 바인딩과 함께 커밋 — IDB에 이미지 레코드
    const a = withImage(edited(doc, "A"), uuid(1));
    const first = core();
    first.edit(a, bindOf(a, uuid(1)));
    expect((await first.save()).status).toBe("saved");
    await ticks();

    // 탭 2: 진입 = 지금 레코드(A) · 코어 바인딩 0 → commit이 IDB 이미지 키를 읽는다(1번)
    const keys = gatedKeys(db);
    const tab = await otherTab(keys.gated, {});
    await ticks();
    tab.core.edit(edited(tab.seed, "B"));
    const coreKeys = keys.arm(1);
    const confirmKeys = keys.arm(2);
    const saving = tab.core.save();
    await coreKeys.reached;

    const confirming = tab.repo.confirmDoc!(PROJECT).then(
      () => "ok",
      (e: { code?: string }) => e.code ?? String(e),
    );
    const write = db.hold(1);
    coreKeys.release();
    await ticks();
    confirmKeys.release();
    await ticks();
    write.release();
    const saved = await saving;
    expect(saved.status).toBe("saved");
    expect(await confirming).toBe("ok");
    await ticks();

    const record = await db.doc();
    expect(record?.doc.meta.title).toBe("B");
    expect(saved.status === "saved" && record?.doc.revision).toBe(saved.status === "saved" && saved.receipt.revision);
  });
});
