// @vitest-environment node
import { describe, expect, it } from "vitest";
import { reactZipEntryIssues } from "./check-bundle-size.mjs";

/**
 * React zip 진입 정적 포함 0 가드 판정 (REACTZIP-SPEC 5.4 · RZ-AC-20 · QA P2) — 가짜 manifest + 파일 본문으로 음성·양성을 본다.
 * 음성 = `/studio/` 시나리오 진입 집합에 생성기 청크·킷 원문 표식·lock 표식 0 · 양성 = 생성기 청크(정적 닫힘)에 두 표식 있음 · manifest에 생성기 없으면 실패
 */
const GEN = "src/features/studio/reactZip/reactZip.ts";
const KIT_HEAD = "/* M2A-2a K3 — 킷 원문 */";
const manifest = (over = {}) => ({
  "index.html": { file: "assets/index.js", isEntry: true, imports: ["_shared.js"] },
  "_shared.js": { file: "assets/shared.js" },
  "src/pages/StudioPage.tsx": { file: "assets/studio.js", isDynamicEntry: true, imports: ["index.html"] },
  "src/Auto.ts": { file: "assets/auto.js", isDynamicEntry: true },
  [GEN]: { file: "assets/reactZip.js", isDynamicEntry: true, imports: ["_gen.js"] },
  "_gen.js": { file: "assets/gen.js" },
  ...over,
});
const CODE = { "assets/index.js": "createRoot()", "assets/shared.js": "s", "assets/studio.js": "p", "assets/auto.js": "a", "assets/reactZip.js": "const css = `/* M2A-2a K3 */`", "assets/gen.js": '{\\"lockfileVersion\\":3}' };
const SCENARIOS = [
  { name: "/studio/:projectId", page: "src/pages/StudioPage.tsx", auto: ["src/Auto.ts"] },
  { name: "/studio/:projectId (저장 데이터 복원 진입)", page: "src/pages/StudioPage.tsx", auto: [] },
  { name: "/catalog", page: "src/pages/StudioPage.tsx", auto: [GEN] },
];
const judge = ({ m = manifest(), code = {}, kitHead = KIT_HEAD, scenarios = SCENARIOS } = {}) =>
  reactZipEntryIssues({ manifest: m, codeOf: (file) => ({ ...CODE, ...code })[file] ?? "", kitHead, scenarios });

describe("React zip 진입 정적 포함 0 가드 (reactZipEntryIssues)", () => {
  it("정상 = 위반 0 · /studio/ 밖 시나리오(/catalog)는 보지 않는다", () => {
    expect(judge()).toEqual([]);
  });

  it("음성 — 진입에 생성기 청크 · 킷 원문 표식 · lock 표식 → 실패", () => {
    expect(judge({ scenarios: [{ name: "/studio/:projectId", page: "src/pages/StudioPage.tsx", auto: [GEN] }] })).toEqual([
      "/studio/:projectId 진입에 React zip 생성기 청크 assets/reactZip.js",
      "/studio/:projectId 진입 assets/reactZip.js에 킷 원문 표식",
      "/studio/:projectId 진입 assets/gen.js에 lock 표식",
    ]);
    expect(judge({ code: { "assets/auto.js": "x M2A-2a K3 x" } })).toEqual(["/studio/:projectId 진입 assets/auto.js에 킷 원문 표식"]);
    expect(judge({ code: { "assets/shared.js": "lockfileVersion" } })).toEqual([
      "/studio/:projectId 진입 assets/shared.js에 lock 표식",
      "/studio/:projectId (저장 데이터 복원 진입) 진입 assets/shared.js에 lock 표식",
    ]);
  });

  it("양성 — 생성기 청크에 표식 없음 · manifest에 생성기 없음 · kit.css 첫 줄 표식 없음 → 실패(가드가 조용히 꺼지지 않게)", () => {
    expect(judge({ code: { "assets/reactZip.js": "x" } })).toEqual(["React zip 생성기 청크에 킷 원문 표식 M2A-2a K3 없음"]);
    expect(judge({ code: { "assets/gen.js": "x" } })).toEqual(["React zip 생성기 청크에 lock 표식 lockfileVersion 없음"]);
    const without = manifest();
    delete without[GEN];
    expect(judge({ m: without })).toEqual([`React zip 생성기 청크(${GEN})가 manifest에 없습니다`]);
    expect(judge({ kitHead: "/* 다른 머리 */" })).toEqual(["킷 원문 표식 M2A-2a K3가 src/kit/kit.css 첫 줄에 없습니다 — 표식을 갱신하세요"]);
  });
});
