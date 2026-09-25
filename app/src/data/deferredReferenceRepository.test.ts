import { describe, expect, it, vi } from "vitest";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { createDeferredReferenceRepository } from "./deferredReferenceRepository";
import { createMemoryReferenceRepository } from "./referenceRepository";

const memory = () => createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures);

describe("지연 로드 ReferenceRepository (그룹 C — 픽스처를 초기 청크에서 뺀다)", () => {
  it("처음 호출될 때 한 번만 불러오고, 모든 메서드를 불러온 저장소에 위임한다", async () => {
    const inner = memory();
    const load = vi.fn(async () => inner);
    const repo = createDeferredReferenceRepository(load);
    expect(load).not.toHaveBeenCalled();

    const id = referenceFixtures[0]!.id;
    expect(await repo.list()).toEqual(await inner.list());
    expect(await repo.getById(id)).toEqual(await inner.getById(id));
    expect(await repo.getDetail(id)).toEqual(await inner.getDetail(id));
    expect(await repo.getSimilar(id)).toEqual(await inner.getSimilar(id));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("불러오기에 실패하면 다음 호출에서 다시 시도한다", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("청크 로드 실패")).mockResolvedValue(memory());
    const repo = createDeferredReferenceRepository(load);
    await expect(repo.list()).rejects.toThrow("청크 로드 실패");
    expect((await repo.list()).length).toBeGreaterThan(0);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
