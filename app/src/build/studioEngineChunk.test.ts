// @vitest-environment node
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { STUDIO_ENGINE_CHUNK_MODULES, studioEngineChunk } from "./studioEngineChunk";

const APP = fileURLToPath(new URL("../../", import.meta.url));

describe("studioEngineChunk (STUDIO-OFF3 A1 — 편집기 엔진 공유 청크 1개)", () => {
  it("목록의 경로는 모두 실제 파일이다 (오타·이동이면 조용히 청크가 다시 갈라진다)", () => {
    for (const path of STUDIO_ENGINE_CHUNK_MODULES) expect(existsSync(`${APP}${path}`), path).toBe(true);
  });

  it("목록 모듈만 그룹에 넣는다 — 절대 경로 끝이 정확히 같을 때만", () => {
    expect(studioEngineChunk(`${APP}src/engine/gate/runGate.ts`)).toBe(true);
    expect(studioEngineChunk(`${APP}src/engine/sections/registry.ts`)).toBe(true);
    // 다른 화면 공유 모듈(대비 판정 등)·비슷한 이름은 넣지 않는다
    expect(studioEngineChunk(`${APP}src/domain/contrast.ts`)).toBe(false);
    expect(studioEngineChunk(`${APP}src/engine/gate/runGate.test.ts`)).toBe(false);
    expect(studioEngineChunk(`${APP}src/other/src/engine/gate/runGate.tsx`)).toBe(false);
  });

  it("게이트 진입 청크(gateCheck)는 넣지 않는다 — 검사기 manifest 키(facade)로 남아야 한다", () => {
    expect(STUDIO_ENGINE_CHUNK_MODULES).not.toContain("src/features/studio/gateCheck.ts");
    expect(studioEngineChunk(`${APP}src/features/studio/gateCheck.ts`)).toBe(false);
  });
});
