/**
 * save-core-qa 반례 — 원본 코어·헬퍼는 읽기 전용 import. 이름 규칙:
 *  - "CE-n [계약]" = MINIMAL-CONTRACT 불변식을 그대로 단언. 실패 = 반례 확인(테스트를 유리하게 고치지 않는다).
 *  - "OBS-n [관찰]" = 실제 동작을 고정(결함 판정 아님, 보고용).
 * 라벨: [모델 내] 단일 탭·배타 writer·제품 메모리 영속만으로 도달 · [범위 밖 사용] · [id 정책 의존] · [비배타 writer 필요]
 */
import { describe, expect, it } from "vitest";
import { hashOf, openSaveCore, readImage, readStored, type WriterCheck } from "../../save-core-harness/core/saveCore";
import { blobOf, deferred, docOf, harnessDb, until, writerAlways } from "../../save-core-harness/test/helpers";
import { createWriterGate } from "../../../../app/src/data/persistence/writerLock";
import { createLockRegistry } from "../../../../app/src/data/persistence/fakeLocks";

const log = (name: string, value: unknown) => console.log(`[QA] ${name} ${JSON.stringify(value)}`);
const open = (db: ReturnType<typeof harnessDb>, writer: WriterCheck = writerAlways, projectId = "p") =>
  openSaveCore({ projectId, persistence: db.persistence, writer, initial: docOf(0, "init") });

describe("save-core-qa 반례", () => {
  it("CE-1 [계약 I7·H5 '폐기 초안 부활 0'] [모델 내] discard await 중 save 진입 → discarded인데 B가 커밋·confirm됨", async () => {
    const db = harnessDb();
    const core = await open(db);
    core.edit(docOf(1, "A"));
    expect((await core.save()).status).toBe("saved"); // write 1 = A gen1
    const B = docOf(2, "B", ["img-b"]);
    core.edit(B, new Map([["img-b", blobOf("bytes-B")]]));
    const gate = db.hold(2);
    const d = core.discard(); // inflight 0 검사 통과 후 await
    const s = core.save(); // discard의 await 사이 진입 — target = B
    const dr = await d;
    gate.release();
    const sr = await s;
    const c = await core.confirm();
    const stored = await readStored(db.persistence, "p");
    const v = core.view();
    log("CE-1", { discard: dr.status, save: sr.status, confirm: c.status, confirmHashIsB: c.status !== "failed" && c.receipt.hash === hashOf(B), stored: stored?.doc.body, view: { body: v.doc.body, dirty: v.dirty } });
    // 계약: discarded라면 폐기한 B가 IDB에 있거나 confirm되면 안 된다
    expect(dr.status === "discarded" && stored?.doc.body === "B").toBe(false);
    expect(c.status === "confirmed" && c.receipt.hash === hashOf(B) && v.doc.body !== "B").toBe(false);
  });

  it("CE-2 [계약 I6 '바인딩 동결' · H3] [id 정책 의존] 같은 id 다른 Blob: 제출 doc1이 나중 Blob Y와 커밋 · 재읽기 confirm이 바이트를 안 봄", async () => {
    const db = harnessDb();
    const held = deferred();
    let calls = 0;
    const writer: WriterCheck = {
      mode: async () => {
        calls += 1;
        if (calls === 1) await held.promise;
        return "writer";
      },
    };
    const core = await open(db, writer);
    const D1 = docOf(1, "D1", ["img"]);
    core.edit(D1, new Map([["img", blobOf("X")]]));
    const s = core.save();
    await until(() => calls === 1); // saveNow가 target=D1을 잡고 writer.mode에서 대기
    core.edit(docOf(2, "D2", ["img"]), new Map([["img", blobOf("Y")]]));
    held.release();
    const sr = await s;
    const stored = await readStored(db.persistence, "p");
    const bytes = await (await readImage(db.persistence, "img"))?.text();
    const reopened = await open(db);
    const rc = await reopened.confirm();
    log("CE-2", { save: sr.status, receiptHashIsD1: sr.status === "saved" && sr.receipt.hash === hashOf(D1), storedBody: stored?.doc.body, imageBytes: bytes, reopenedConfirm: rc.status });
    // 계약: 커밋된 D1의 이미지는 D1 편집 때 등록한 X여야 한다
    expect(stored?.doc.body === "D1" ? bytes : "X").toBe("X");
  });

  it("CE-3a [계약 I6b '다른 writer 덮어쓰기 0'] [범위 밖 사용: 한 탭 코어 2개, 제품 gate 공유] 동시 save → 같은 세대 2회 saved", async () => {
    const db = harnessDb();
    const gate = createWriterGate(createLockRegistry().tab(), async () => true);
    const writer: WriterCheck = { mode: () => gate.enter() };
    const seed = await open(db, writer);
    seed.edit(docOf(1, "A"));
    await seed.save();
    const c1 = await open(db, writer);
    const c2 = await open(db, writer);
    c1.edit(docOf(2, "c1"));
    c2.edit(docOf(2, "c2"));
    const [r1, r2] = await Promise.all([c1.save(), c2.save()]);
    const stored = await readStored(db.persistence, "p");
    log("CE-3a", { r1: r1.status === "saved" ? r1.receipt.generation : r1, r2: r2.status === "saved" ? r2.receipt.generation : r2, stored: [stored?.doc.body, stored?.generation] });
    expect([r1, r2].filter((r) => r.status === "saved").length).toBeLessThanOrEqual(1);
  });

  it("CE-3b [계약 I6b] [두 탭 = 제품 gate 2개 + fakeLocks] 동시 save → 하나만 saved(배타 writer)", async () => {
    const db = harnessDb();
    const reg = createLockRegistry();
    const gA = createWriterGate(reg.tab(), async () => true);
    const gB = createWriterGate(reg.tab(), async () => true);
    const seed = await openSaveCore({ projectId: "p", persistence: db.persistence, writer: writerAlways, initial: docOf(1, "A") });
    seed.edit(docOf(1, "A"));
    await seed.save();
    const a = await open(db, { mode: () => gA.enter() });
    const b = await open(db, { mode: () => gB.enter() });
    a.edit(docOf(2, "a"));
    b.edit(docOf(2, "b"));
    const [ra, rb] = await Promise.all([a.save(), b.save()]);
    log("CE-3b", { ra: ra.status === "saved" ? "saved" : ra.reason, rb: rb.status === "saved" ? "saved" : rb.reason });
    expect([ra, rb].filter((r) => r.status === "saved").length).toBeLessThanOrEqual(1);
  });

  it("CE-4 [계약 I3: 커밋됐으면 confirmed|newer] [모델 내] 같은 코어 confirm 2회 동시(더블클릭)", async () => {
    const db = harnessDb();
    const core = await open(db);
    core.edit(docOf(1, "B", ["img-b"]), new Map([["img-b", blobOf("bytes-B")]]));
    const [c1, c2] = await Promise.all([core.confirm(), core.confirm()]);
    log("CE-4", { c1: c1.status === "failed" ? c1 : [c1.status, c1.receipt.generation], c2: c2.status === "failed" ? c2 : [c2.status, c2.receipt.generation], writes: db.ops.length });
    expect(c1.status).not.toBe("failed");
    expect(c2.status).not.toBe("failed");
  });

  it("CE-5 [계약 I4: 내용 같으면 wrote:false confirmed] [모델 내] clean 상태에서 save 진행 중 confirm", async () => {
    const db = harnessDb();
    const core = await open(db);
    core.edit(docOf(1, "A"));
    await core.save();
    const gate = db.hold(2);
    const s = core.save(); // 편집 없음 — 같은 내용을 세대 2로 다시 씀
    const c = core.confirm();
    await until(() => db.seen.includes(2));
    gate.release();
    const [sr, cr] = await Promise.all([s, c]);
    log("CE-5", { save: sr.status === "saved" ? sr.receipt.generation : sr, confirm: cr.status === "failed" ? cr : [cr.status, cr.receipt.generation], writes: db.ops.length });
    expect(cr.status).not.toBe("failed");
  });

  it("CE-6 [계약 I7/I8] [모델 내] clean discard await 중 replace → discard는 교체본을 되돌리지 않는다", async () => {
    const db = harnessDb();
    const core = await open(db);
    core.edit(docOf(1, "A"));
    await core.save();
    const d = core.discard();
    const rr = core.replace(docOf(9, "R"), { intent: "replace", expectedEpoch: core.view().epoch });
    const dr = await d;
    log("CE-6", { replace: rr, discard: dr.status === "discarded" ? "discarded" : dr.reason, body: core.view().doc.body });
    expect(core.view().doc.body).toBe("R");
  });

  it("OBS-1 [관찰] stale 이후 회복 경로 없음: save stale · discard blocked stale · replace dirty · confirm stale (재열기 외)", async () => {
    const db = harnessDb();
    const a = await open(db);
    a.edit(docOf(1, "A"));
    await a.save();
    const other = await open(db);
    other.edit(docOf(2, "other"));
    await other.save();
    a.edit(docOf(2, "A2"));
    const out = {
      save: await a.save(),
      discard: await a.discard(),
      replace: a.replace(docOf(3, "R"), { intent: "replace", expectedEpoch: a.view().epoch }),
      confirm: await a.confirm(),
    };
    log("OBS-1", { save: out.save.status === "failed" && out.save.reason, discard: out.discard, replace: out.replace, confirm: out.confirm });
    expect([out.save.status, out.discard.status, out.replace.status, out.confirm.status]).toEqual(["failed", "blocked", "rejected", "failed"]);
  });

  it("OBS-2 [관찰] 이미지 존재 확인은 프로젝트 무관 — 다른 프로젝트 img-x가 있으면 바인딩 없이 saved", async () => {
    const db = harnessDb();
    const p1 = await open(db, writerAlways, "p1");
    p1.edit(docOf(1, "p1", ["img-x"]), new Map([["img-x", blobOf("p1-bytes")]]));
    await p1.save();
    const p2 = await open(db, writerAlways, "p2");
    p2.edit(docOf(1, "p2", ["img-x"]));
    const r = await p2.save();
    log("OBS-2", { p2save: r.status });
    expect(r.status).toBe("saved");
  });
});
