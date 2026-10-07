/**
 * StudioPersistence 계약 테스트 1벌 (ADR-007 P6 A) — 같은 함수를 모든 구현에 등록한다.
 * vitest(jsdom)에는 IndexedDB가 없어 메모리 가짜만 등록하고, IDB 구현은 브라우저 실측(P1a-2 새로고침 생존)으로 같은 계약을 확인한다.
 */
import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION, type Envelope } from "../data/persistence/envelope";
import type { StudioPersistence } from "../data/persistence/studioPersistence";

const record = <T>(kind: string, id: string, data: T): Envelope<T> => ({ schemaVersion: SCHEMA_VERSION, kind, id, data });

export function persistenceContract(name: string, open: () => Promise<StudioPersistence>) {
  describe(`StudioPersistence 계약 — ${name}`, () => {
    it("없는 레코드 = undefined · put 뒤 get = 같은 봉투 · getAll = 그 저장소 레코드 전부", async () => {
      const p = await open();
      expect(await p.get("docs", "project-1")).toBeUndefined();
      await p.write([
        { type: "put", store: "docs", record: record("doc", "project-1", { title: "가" }) },
        { type: "put", store: "docs", record: record("doc", "project-2", { title: "나" }) },
        { type: "put", store: "studio", record: record("job", "job-1", { state: "queued" }) },
      ]);
      expect(await p.get("docs", "project-1")).toEqual(record("doc", "project-1", { title: "가" }));
      expect(await p.getAll("docs")).toEqual([record("doc", "project-1", { title: "가" }), record("doc", "project-2", { title: "나" })]);
      expect(await p.getAll("snapshots")).toEqual([]);
      p.close();
    });

    it("같은 id 뒤 put이 앞 put을 덮는다 · delete는 그 레코드만 지운다(한 트랜잭션 안 순서대로)", async () => {
      const p = await open();
      await p.write([{ type: "put", store: "docs", record: record("doc", "a", 1) }]);
      await p.write([
        { type: "put", store: "docs", record: record("doc", "a", 2) },
        { type: "put", store: "docs", record: record("doc", "b", 3) },
        { type: "delete", store: "docs", id: "b" },
      ]);
      expect(await p.getAll("docs")).toEqual([record("doc", "a", 2)]);
      p.close();
    });

    it("structured clone 저장: 넣은 객체·읽은 객체를 바꿔도 저장값 불변 · 배열 안 undefined 칸(StoredJob.hidden)·Map 보존", async () => {
      const p = await open();
      const data = { hidden: [{ id: "A" }, undefined, undefined], series: new Map([["profile-1", [1]]]) };
      await p.write([{ type: "put", store: "studio", record: record("job", "job-1", data) }]);
      data.hidden[0] = { id: "바뀜" };
      const read = (await p.get("studio", "job-1")) as Envelope<typeof data>;
      expect(read.data.hidden).toEqual([{ id: "A" }, undefined, undefined]);
      expect(read.data.hidden).toHaveLength(3);
      expect(read.data.series.get("profile-1")).toEqual([1]);
      read.data.hidden[1] = { id: "읽은 쪽 수정" };
      expect(((await p.get("studio", "job-1")) as Envelope<typeof data>).data.hidden[1]).toBeUndefined();
      p.close();
    });

    it("keys = 그 저장소 레코드 id 오름차순(이미지 Blob을 읽지 않고 저장된 id만 — P1b)", async () => {
      const p = await open();
      await p.write([
        { type: "put", store: "images", record: record("image", "project-2/b", 1) },
        { type: "put", store: "images", record: record("image", "project-1/a", 2) },
        { type: "put", store: "docs", record: record("doc", "project-1", 3) },
      ]);
      expect(await p.keys("images")).toEqual(["project-1/a", "project-2/b"]);
      expect(await p.keys("snapshots")).toEqual([]);
      p.close();
    });

    it("Blob 보존(이미지 변형본 — P1b): put한 Blob을 같은 크기·형식·바이트로 읽는다", async () => {
      const p = await open();
      const blob = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 7])], { type: "image/png" });
      await p.write([{ type: "put", store: "images", record: record("image", "project-1/a", { variants: { 640: blob }, bytes: blob.size }) }]);
      const read = ((await p.get("images", "project-1/a")) as Envelope<{ variants: Record<number, Blob> }>).data.variants[640]!;
      expect(read).toBeInstanceOf(Blob);
      expect([read.size, read.type]).toEqual([5, "image/png"]);
      expect([...new Uint8Array(await read.arrayBuffer())]).toEqual([0x89, 0x50, 0x4e, 0x47, 7]);
      p.close();
    });
  });
}
