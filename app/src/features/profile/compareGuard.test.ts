// @vitest-environment node
/**
 * M2B-5 SPEC 2.3 · 5 · CMP-AC-G2·G3 — 비교 프레임 보안·로컬 상수 가드.
 * G2: 소스 전체(테스트 밖)에 `allow-same-origin` 0 · 비교 프레임 sandbox 리터럴 = "allow-scripts"만.
 * G3: 값 import 대신 둔 로컬 상수(/render.html · 폭 rem · 폭 라벨)와 축소 계산이 편집기 원본과 같다(previewFrame.test E-AC-15 방식).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { FRAME_REM, PREVIEW_WIDTH_OPTIONS, previewScale, scaleCaption } from "../studio/previewFrame";
import { COMPARE_FRAME_REM, COMPARE_RENDER_SRC, COMPARE_WIDTH_OPTIONS, compareScale, compareScaleCaption } from "./compareFrame";

const SRC = fileURLToPath(new URL("../../", import.meta.url));
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [path] : [];
  });

describe("비교 프레임 가드 (CMP-AC-G2·G3)", () => {
  it("G2 — 소스 전체 allow-same-origin 0 · 비교 프레임 sandbox 리터럴 = allow-scripts", () => {
    const all = files(SRC);
    expect(all.filter((path) => readFileSync(path, "utf8").includes("allow-same-origin"))).toEqual([]);
    const compare = readFileSync(join(SRC, "features/profile/PreviewFrame.tsx"), "utf8");
    expect([...compare.matchAll(/sandbox=("[^"]*"|\{[^}]*\})/g)].map(([, value]) => value)).toEqual(['"allow-scripts"']);
  });

  it("G3 — 로컬 상수·축소 계산 = RENDER_DOC_SRC · FRAME_REM · PREVIEW_WIDTH_OPTIONS · previewScale · scaleCaption", async () => {
    const { RENDER_DOC_SRC } = await import("../../components/studio/StructureCanvas");
    expect(COMPARE_RENDER_SRC).toBe(RENDER_DOC_SRC);
    expect(COMPARE_FRAME_REM).toEqual({ desktop: FRAME_REM.desktop, mobile: FRAME_REM.mobile });
    expect(COMPARE_WIDTH_OPTIONS).toEqual(PREVIEW_WIDTH_OPTIONS.filter((o) => o.value !== "tablet"));
    for (const [frame, available] of [[1280, 389], [1280, 1280], [390, 300], [1280, 0], [390, 1000]] as const) {
      expect(compareScale(frame, available)).toBe(previewScale(frame, available));
      expect(compareScaleCaption(compareScale(frame, available))).toBe(scaleCaption(previewScale(frame, available)));
    }
  });
});
