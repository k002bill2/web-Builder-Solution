import { describe, expect, it } from "vitest";
import type { DesignReference } from "../domain/reference";
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
    expect(await withExternal.get("ref-x")).toBeUndefined();
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
    expect((await repo.get("ref-c"))?.title).toBe("동네 치과 클리닉");
  });

  it("입력 레코드 배열을 변경하지 않는다", async () => {
    const records = [...referenceFixtures];
    await createMemoryReferenceRepository(records).list({ sort: "score" });
    expect(keys(records)).toEqual(["A", "B", "C", "D", "E", "F"]);
  });
});
