import type { PageDoc } from "../../../engine/contracts/pageDoc";
import { kitVars } from "../../../kit/tokens";
import { siteWeight } from "../../../kit/siteFonts";
import type { KitTokenInput } from "../../../render/protocol";

/**
 * 디자인 샘플 JSON 직렬화기 (SAMPLE-SPEC r0 2.1·2.2) — 순수 · 결정적(키 순서 고정 · 2칸 들여쓰기 · 끝 개행).
 * 새 값을 계산하지 않는다: 토큰 값은 kitVars() 결과를 그대로 옮긴다. 단위는 rem·ch·비율·CSS 색만(px 0 — SMP-AC-A03).
 * 조작 뒤 청크 전용 — 진입 청크에서 정적 import 금지.
 */
const stringify = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const pick = (vars: Readonly<Record<string, string>>, names: readonly string[], prefix: string) =>
  Object.fromEntries(names.map((n) => [n, vars[`${prefix}${n}`]!]));

type SampleDoc = Pick<PageDoc, "profileVersion" | "candidateId" | "generatorVersion" | "libraryVersion" | "sections">;

export function designTokensJson(tokens: KitTokenInput, doc: SampleDoc): string {
  const vars = kitVars(tokens);
  return stringify({
    $schema: "design-sample/tokens@0",
    source: { kind: "internal", profileVersion: doc.profileVersion, candidateId: doc.candidateId, generatorVersion: doc.generatorVersion, libraryVersion: doc.libraryVersion },
    color: { ...tokens.palette, onPrimary: vars["--site-on-primary"] },
    font: { family: tokens.type.family, weight: { heading: siteWeight(tokens.type.headingWeight), body: siteWeight(tokens.type.bodyWeight) } },
    typeScale: { ratio: tokens.type.scale, steps: pick(vars, ["t-1", "t0", "t1", "t2", "t3", "t4", "t5"], "--site-") },
    space: {
      grid: vars["--site-s2"],
      steps: pick(vars, ["s1", "s2", "s3", "s4", "s5", "s6"], "--site-"),
      sectionGap: vars["--site-section-gap"],
      density: tokens.space.density,
    },
    radius: { r1: vars["--site-r1"], r2: vars["--site-r2"], card: vars["--site-radius-card"], control: vars["--site-radius-control"] },
    card: { style: tokens.card.style, tone: tokens.card.tone },
    media: { ratio: tokens.mediaRatio },
    motion: { preset: doc.sections.map((s) => s.motion) },
    cssVars: vars,
  });
}

/** 섹션 구성만 — 슬롯 값(글·이미지)·instanceId 0 (SMP-AC-A04) */
export function sectionsJson(doc: Pick<PageDoc, "sections">): string {
  return stringify({
    $schema: "design-sample/sections@0",
    sections: doc.sections.map((s, i) => ({ order: i + 1, type: s.type, variant: s.variant, tone: s.tone, motion: s.motion })),
  });
}
