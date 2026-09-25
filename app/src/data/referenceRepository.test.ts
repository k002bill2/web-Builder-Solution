import { describe, expect, it } from "vitest";
import type { DesignReference } from "../domain/reference";
import type { SimilarGroup } from "../domain/referenceDetail";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { createMemoryReferenceRepository } from "./referenceRepository";

const keys = (refs: readonly DesignReference[]) => refs.map((r) => r.key);

const externalObserved: DesignReference = {
  ...referenceFixtures[0]!,
  id: "ref-x",
  key: "X",
  slug: "observed-cafe",
  title: "외부 관찰 카페",
  licenseStatus: "external_observed",
};

describe("메모리 ReferenceRepository", () => {
  const repo = createMemoryReferenceRepository(referenceFixtures);

  it("필터 없이 목업 레퍼런스 6개를 돌려준다", async () => {
    expect(keys(await repo.list())).toEqual(["A", "B", "C", "D", "E", "F"]);
  });

  it("업종=카페·F&B 필터는 A·F 2개를 돌려준다", async () => {
    expect(keys(await repo.list({ industry: "cafe-fnb" }))).toEqual(["A", "F"]);
  });

  it("external_observed 레코드는 목록·단건 조회 어디에도 나오지 않는다 (FR-CAT-04)", async () => {
    const withExternal = createMemoryReferenceRepository([...referenceFixtures, externalObserved]);
    expect(keys(await withExternal.list())).not.toContain("X");
    expect(keys(await withExternal.list({ industry: "cafe-fnb" }))).toEqual(["A", "F"]);
    expect(await withExternal.getById("ref-x")).toBeUndefined();
  });

  it("같은 그룹 안의 선택은 OR로 결합한다", async () => {
    expect(keys(await repo.list({ concept: ["minimal", "bold"] }))).toEqual(["A", "B"]);
  });

  it("서로 다른 그룹의 선택은 AND로 결합한다", async () => {
    expect(keys(await repo.list({ concept: ["minimal", "bold"], purpose: ["booking"], audience: ["age-20-30"] }))).toEqual([
      "A",
      "B",
    ]);
    expect(keys(await repo.list({ concept: ["minimal"], audience: ["b2b"] }))).toEqual([]);
  });

  it("타깃·레이아웃·목적·라이선스·모션 필터를 각각 적용한다", async () => {
    expect(keys(await repo.list({ audience: ["family"] }))).toEqual(["C", "F"]);
    expect(keys(await repo.list({ layout: ["split", "grid"] }))).toEqual(["B", "D"]);
    expect(keys(await repo.list({ purpose: ["inquiry"] }))).toEqual(["C", "E"]);
    expect(keys(await repo.list({ license: ["licensed"] }))).toEqual(["B", "E"]);
    expect(keys(await repo.list({ motion: "low" }))).toEqual(["A", "C", "E"]);
  });

  it("점수순은 접근성+성능 합계 내림차순, 최신순은 등록일 내림차순이다", async () => {
    expect(keys(await repo.list({ sort: "score" }))).toEqual(["C", "E", "A", "F", "B", "D"]);
    expect(keys(await repo.list({ sort: "latest" }))).toEqual(["F", "A", "D", "B", "C", "E"]);
  });

  it("색상 계열 필터는 대표색(c1) 계열로 거른다 (FR-CAT-01)", async () => {
    expect(keys(await repo.list({ color: ["warm"] }))).toEqual(["A", "F"]);
    expect(keys(await repo.list({ color: ["neutral", "green"] }))).toEqual(["B", "D", "E"]);
    expect(keys(await repo.list({ color: ["cool"], purpose: ["sales"] }))).toEqual([]);
  });

  it("디바이스 필터는 지원 디바이스 중 하나라도 겹치면 통과한다 (FR-CAT-01)", async () => {
    expect(keys(await repo.list({ device: ["desktop"] }))).toEqual(["A", "C", "E"]);
    expect(keys(await repo.list({ device: ["desktop", "mobile"] }))).toEqual(["A", "B", "C", "D", "E", "F"]);
    expect(keys(await repo.list({ device: ["desktop"], color: ["warm"] }))).toEqual(["A"]);
  });

  it("id로 단건을 조회한다", async () => {
    expect((await repo.getById("ref-c"))?.title).toBe("동네 치과 클리닉");
    expect(await repo.getById("ref-zz")).toBeUndefined();
  });

  it("입력 레코드 배열을 변경하지 않는다", async () => {
    const records = [...referenceFixtures];
    await createMemoryReferenceRepository(records).list({ sort: "score" });
    expect(keys(records)).toEqual(["A", "B", "C", "D", "E", "F"]);
  });
});

describe("상세·유사 레퍼런스 (FR-CAT-03, T-API-CAT-04)", () => {
  const repo = createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures);
  const groupKeys = (groups: readonly SimilarGroup[]) => groups.map((g) => [g.kind, keys(g.items)]);

  it("노출 레퍼런스는 모두 상세 데이터(섹션·팔레트·모바일 구조·유사 3그룹)를 가진다", async () => {
    for (const ref of referenceFixtures) {
      const detail = await repo.getDetail(ref.id);
      expect(detail, ref.id).toBeDefined();
      expect(detail!.sections.length, ref.id).toBeGreaterThan(0);
      expect(detail!.palette[0]?.hex, ref.id).toBe(ref.colorPalette.primary);
      expect(detail!.mobileFlow.length, ref.id).toBeGreaterThan(0);
      for (const group of await repo.getSimilar(ref.id)) expect(group.items.length, `${ref.id} ${group.kind}`).toBeGreaterThan(0);
    }
  });

  it("A의 유사 레퍼런스는 목업 3그룹(업종·콘셉트·레이아웃) 순서이고 자기 자신은 빠진다", async () => {
    expect(groupKeys(await repo.getSimilar("ref-a"))).toEqual([
      ["industry", ["F", "D", "B"]],
      ["concept", ["E", "C", "F"]],
      ["layout", ["D", "F"]],
    ]);
  });

  it("그룹마다 최대 6개, 자기 자신·중복·비노출·없는 id는 제외한다", async () => {
    const extra = ["G", "H", "I"].map((k, i) => ({ ...referenceFixtures[i]!, id: `ref-${k.toLowerCase()}`, key: k }));
    const records = [...referenceFixtures, ...extra, externalObserved];
    const everyone = ["ref-a", "ref-b", "ref-b", "ref-c", "ref-x", "ref-zz", "ref-d", "ref-e", "ref-f", "ref-g", "ref-h", "ref-i"];
    const details = { "ref-a": { ...referenceDetailFixtures["ref-a"]!, similar: { industry: everyone, concept: ["ref-a", "ref-x"], layout: [] } } };
    const groups = await createMemoryReferenceRepository(records, details).getSimilar("ref-a");
    expect(groupKeys(groups)).toEqual([
      ["industry", ["B", "C", "D", "E", "F", "G"]],
      ["concept", []],
      ["layout", []],
    ]);
  });

  it("없는 id·비노출 id는 상세가 없고 유사 그룹도 비어 있다", async () => {
    const withExternal = createMemoryReferenceRepository([...referenceFixtures, externalObserved], {
      ...referenceDetailFixtures,
      "ref-x": referenceDetailFixtures["ref-a"]!,
    });
    for (const id of ["ref-zz", "ref-x"]) {
      expect(await withExternal.getDetail(id)).toBeUndefined();
      expect(groupKeys(await withExternal.getSimilar(id))).toEqual([
        ["industry", []],
        ["concept", []],
        ["layout", []],
      ]);
    }
  });
});
