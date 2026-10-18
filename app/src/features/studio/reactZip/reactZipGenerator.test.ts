import type { StudioReader } from "../../../data/studioStore";
import { createReactZipGenerator } from "./reactZip";

/** Codex r1 — render.html·CSS 조회가 멈춰도 생성 전체 상한에서 JOB_TIMEOUT으로 끝나고, 늦게 끝나도 결과를 게시하지 않는다 */
vi.mock("../docPurpose", () => ({ docKitTokens: () => ({ type: { family: "Pretendard", headingWeight: 700, bodyWeight: 400 } }) }));

it("CSS 조회 정체 → 상한 뒤 JOB_TIMEOUT · object URL·onBuilt 0", async () => {
  const store = { projects: () => [{ projectId: "p1", profileId: "f1" }], versions: () => [{ version: 1 }] } as unknown as StudioReader;
  const urls = { createObjectURL: vi.fn(() => "blob:x"), revokeObjectURL: vi.fn() };
  const onBuilt = vi.fn();
  const generate = createReactZipGenerator(store, { fetchText: () => new Promise<string>(() => undefined), timeoutMs: 20, urls, onBuilt });
  const error = await generate({ projectId: "p1", format: "react-zip", doc: { profileVersion: 1, updatedAt: "2026-10-18T00:00:00.000Z" } as never }).catch((e: unknown) => e);
  expect(error).toMatchObject({ code: "JOB_TIMEOUT" });
  expect(urls.createObjectURL).not.toHaveBeenCalled();
  expect(onBuilt).not.toHaveBeenCalled();
});
