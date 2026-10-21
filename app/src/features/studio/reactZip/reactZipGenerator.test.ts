import type { StudioReader } from "../../../data/studioStore";
import { docKitTokens } from "../docPurpose";
import { createReactZipGenerator } from "./reactZip";

/** Codex r1 — render.html·CSS 조회가 멈춰도 생성 전체 상한에서 JOB_TIMEOUT으로 끝나고, 늦게 끝나도 결과를 게시하지 않는다 */
vi.mock("../docPurpose", () => ({ docKitTokens: vi.fn(() => ({ type: { family: "Pretendard", headingWeight: 700, bodyWeight: 400 } })) }));

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

it("TS-AC-09 킷 토큰 = 문서 프로필 버전 + 문서 typeScale(docKitTokens 세 번째 인자)", async () => {
  const store = { projects: () => [{ projectId: "p1", profileId: "f1" }], versions: () => [{ version: 1 }] } as unknown as StudioReader;
  const generate = createReactZipGenerator(store, { fetchText: () => new Promise<string>(() => undefined), timeoutMs: 5, urls: { createObjectURL: vi.fn(), revokeObjectURL: vi.fn() }, onBuilt: vi.fn() });
  await generate({ projectId: "p1", format: "react-zip", doc: { profileVersion: 1, typeScale: 1.333, updatedAt: "2026-10-18T00:00:00.000Z" } as never }).catch(() => undefined);
  expect(vi.mocked(docKitTokens)).toHaveBeenLastCalledWith(expect.objectContaining({ profileId: "f1" }), 1, 1.333);
});
