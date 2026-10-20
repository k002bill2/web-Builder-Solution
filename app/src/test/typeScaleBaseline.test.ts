/**
 * TYPESCALE-SPEC r1 T0 기준선 — 제목 비율 축 전달(★B) 전 현행 결과 고정(TS-AC-04 후반 · TS-AC-11).
 * 필드 없는 기존 문서는 해시·킷 토큰이 바이트 단위로 그대로여야 한다.
 */
import type { DesignProfileInput } from "../domain/compareBoard";
import type { ProfileSeries, ProfileVersion } from "../domain/profile";
import { createDocFromCandidate } from "../engine/doc/createDocFromCandidate";
import { deepFreeze } from "../engine/freeze";
import { hashDoc } from "../engine/ops/hash";
import { docKitTokens } from "../features/studio/docPurpose";

const PLAN = deepFreeze({
  candidateId: "B",
  sections: [
    { type: "header", variant: "sticky-right-cta" },
    { type: "hero", variant: "fullbleed-left" },
    { type: "about", variant: "story" },
    { type: "services", variant: "cards-3" },
    { type: "faq", variant: "accordion" },
    { type: "contact", variant: "form" },
    { type: "services", variant: "list" },
    { type: "footer", variant: "biz-extended" },
  ],
  libraryVersion: "1.4",
  generatorVersion: "preview-1",
} as const);
const START = deepFreeze({ projectId: "project-1", updatedAt: "2026-10-21T00:00:00.000Z" });

const color = (v: string) => ({ $type: "color" as const, $value: v });
const BASE = {
  color_tokens: { primary: color("rgb(1 1 1)"), surface: color("rgb(2 2 2)"), ink: color("rgb(3 3 3)"), muted: color("rgb(4 4 4)"), bg: color("rgb(5 5 5)") },
  typography_tokens: { family: "Noto Serif KR", headingWeight: 700, bodyWeight: 400, scale: 1.25 },
  spacing_tokens: { grid: "8pt", sectionGap: 96 },
  motion_preset: "L1",
  component_choices: { card_style: { style: "bordered-lg", surfaceTone: "dark" }, media_ratio: "16:9" },
} as unknown as DesignProfileInput;
const V1: ProfileVersion = { profileId: "p", version: 1, origin: "adjust", baseReferenceId: "ref-a", base: BASE, adjustments: {}, createdAt: "2026-10-03T00:00:00.000Z" };
const SERIES: ProfileSeries = { profileId: "p", versions: [V1], latestVersion: 1 };

describe("TYPESCALE T0 기준선 — 필드 없는 문서·토큰은 그대로", () => {
  it("구조안 → 새 문서 해시 고정(TS-AC-11)", () => {
    const doc = createDocFromCandidate(PLAN, 1, START);
    expect(Object.keys(doc)).toEqual(["projectId", "revision", "hash", "profileVersion", "candidateId", "libraryVersion", "generatorVersion", "meta", "sections", "updatedAt"]);
    expect(doc.hash).toBe(hashDoc(doc));
    expect(doc.hash).toBe("fnv1a64:5acdb47336801ddd");
  });

  it("docKitTokens 결과 고정(TS-AC-04 후반)", () => {
    expect(JSON.stringify(docKitTokens(SERIES, 1))).toBe(
      '{"palette":{"primary":"rgb(1 1 1)","surface":"rgb(2 2 2)","ink":"rgb(3 3 3)","muted":"rgb(4 4 4)","bg":"rgb(5 5 5)"},"card":{"tone":"dark","style":"bordered-lg"},' +
        '"type":{"family":"Noto Serif KR","headingWeight":700,"bodyWeight":400,"scale":1.25},"space":{"grid":8,"sectionGap":96,"density":"comfortable"},"mediaRatio":"16:9"}',
    );
  });
});
