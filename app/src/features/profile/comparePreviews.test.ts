/**
 * M2B-5 SPEC 3.2 · CMP-AC-U5 — 3안 → 미리보기 문서 변환(순수). 같은 안 = 같은 해시 · 저장소 쓰기 0 · 프로젝트 없는 프로필도 문서 ·
 * 만들지 못한 안 = 문서 없음 · 대응표 밖 변형 = UNKNOWN_VARIANT · 킷 토큰 = 문서 프로필 버전 docKitTokens와 같은 값(type.scale 덮어쓰기 0, MQ-2 A).
 */
import { describe, expect, it } from "vitest";
import { createMemoryCompareBoardRepository } from "../../data/memoryCompareBoardRepository";
import { createMemoryGenerationRepository, type MemoryGenerationOptions } from "../../data/memoryGenerationRepository";
import { createMemoryProfileRepository } from "../../data/memoryProfileRepository";
import { createMemoryProjectRepository } from "../../data/memoryProjectRepository";
import { createStudioStore } from "../../data/studioStore";
import { isTerminal, type GenerationJob } from "../../domain/generation";
import type { ProfileVersion } from "../../domain/profile";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import { docKitTokens } from "../studio/docPurpose";
import { compareKitTokens, comparePreviews } from "./comparePreviews";

async function fixture(options: Omit<MemoryGenerationOptions, "store"> = {}) {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }), store });
  await board.confirmProfile(1, 0);
  const series = (await createMemoryProfileRepository({ store }).getProfile("profile-1"))!;
  const gen = createMemoryGenerationRepository({ ...options, store });
  let job: GenerationJob = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 6 && !isTerminal(job.state); i += 1) job = await gen.getJob(job.jobId);
  return { series, viewed: series.versions.at(-1)!, job, store };
}

describe("미리보기 문서 변환 (SPEC 3.2 · CMP-AC-U5)", () => {
  it("같은 안 2회 = 같은 hash · projectId preview · 고정 시각 · 예시 문구 문서", async () => {
    const { job, viewed } = await fixture();
    const first = comparePreviews(job, viewed);
    const second = comparePreviews(job, viewed);
    expect(first.map((p) => p.id)).toEqual(["A", "B", "C"]);
    for (const [i, preview] of first.entries()) {
      expect(preview.kind).toBe("doc");
      const again = second[i]!;
      if (preview.kind !== "doc" || again.kind !== "doc" || !preview.write.ok || !again.write.ok) throw new Error("문서가 아닙니다");
      expect(preview.write.doc.hash).toBe(again.write.doc.hash);
      expect(preview.write.doc).toMatchObject({ projectId: "preview", updatedAt: "1970-01-01T00:00:00.000Z", candidateId: preview.id, profileVersion: 1 });
    }
  });

  it("저장소 쓰기 0 — 프로젝트(series.project)를 읽지 않고 보는 버전만으로 문서, 변환 뒤에도 프로젝트 편집 문서 없음", async () => {
    const { job, viewed, store } = await fixture();
    const bare: ProfileVersion = { ...viewed };
    expect(comparePreviews(job, bare).every((p) => p.kind === "doc" && p.write.ok)).toBe(true);
    expect(await createMemoryProjectRepository({ store }).getDoc("project-1")).toBeUndefined();
  });

  it("만들지 못한 안 = 문서 없음(kind failed) · 대응표 밖 변형 = UNKNOWN_VARIANT 결과(쓰기 0)", async () => {
    const { job, viewed } = await fixture({ outcome: ({ id }) => (id === "C" ? "INFRA" : undefined) });
    const previews = comparePreviews(job, viewed);
    expect(previews.find((p) => p.id === "C")).toMatchObject({ kind: "failed" });
    const a = job.candidates[0]!;
    if (a.status !== "succeeded") throw new Error("A안 성공 전제");
    const odd: GenerationJob = {
      ...job,
      candidates: [{ ...a, plan: { ...a.plan, sections: a.plan.sections.map((s, i) => (i === 1 ? { ...s, variant: "nope" } : s)) } }, ...job.candidates.slice(1)],
    };
    const preview = comparePreviews(odd, viewed)[0]!;
    expect(preview.kind === "doc" && preview.write).toMatchObject({ ok: false, reason: "UNKNOWN_VARIANT" });
  });

  it("킷 토큰 = 문서 프로필 버전 docKitTokens(전체 계열)와 같은 값 — 3안 공통, 비율 덮어쓰기 0", async () => {
    const { series, viewed } = await fixture();
    const tokens = compareKitTokens(viewed);
    expect(tokens).toEqual(docKitTokens(series, viewed.version));
    expect(tokens?.type.scale).toBe(viewed.base.typography_tokens.scale);
  });

  it("복제 대조 — 보정(나중 것 우선)·촘촘·어두운 카드·미디어 비율·부분 레코드(팔레트·글꼴 없음)도 docKitTokens와 같은 값", async () => {
    const { series, viewed } = await fixture();
    const variants: ProfileVersion[] = [
      { ...viewed, adjustments: { ...viewed.adjustments, density: "compact", corrections: [{ role: "ink", from: "#000000", to: "#111111", check: "C-4" }, { role: "ink", from: "#111111", to: "#222222", check: "C-4" }] } },
      { ...viewed, base: { ...viewed.base, component_choices: { ...viewed.base.component_choices, card_style: { style: "elevated", surfaceTone: "dark" }, media_ratio: "16:9" } } as ProfileVersion["base"] },
      { ...viewed, base: { ...viewed.base, spacing_tokens: { ...viewed.base.spacing_tokens, grid: "abc" } } },
      { ...viewed, base: { ...viewed.base, color_tokens: undefined } as unknown as ProfileVersion["base"] },
      { ...viewed, base: { ...viewed.base, typography_tokens: undefined } as unknown as ProfileVersion["base"] },
    ];
    for (const version of variants) expect(compareKitTokens(version)).toEqual(docKitTokens({ ...series, versions: [version] }, version.version));
    expect(compareKitTokens(variants[3]!)).toBeUndefined();
  });
});
