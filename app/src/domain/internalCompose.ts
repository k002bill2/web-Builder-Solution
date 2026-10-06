/**
 * internal 조합 생성기 `composeInternalReferences` (SPEC m3p 2절 · MQ-M3P-2·3·4 A) — 저장소 안 추상 표만으로 레퍼런스(카드·상세·비교 3벌)를 조립한다.
 * - 순수·결정적: 시각·Math.random 0, seed = hash(업종|순번|시도|버전). 같은 입력 → 바이트 동일 직렬화. 출력 깊게 동결, 입력 변경 0.
 * - 게이트(2.6, 하나라도 실패하면 후보 버림): ① 엔진 문서 생성(주입 — domain은 engine을 import하지 않는다, engineImportGuard)
 *   ② lintPlan block 0 ③ 대비 AA = checkProfileContrast(대비 게이트 행·lint R-08과 같은 판정, 흰 글자 ON_PRIMARY) ④ 실렌더 변형만(주입 ①에서)
 *   ⑤ 출력 문자열에 URL·마크업·data: 0.
 * - 중복 제거(2.5): 정규 키(업종·hero·본문 변형 정렬·팔레트·카드) · 기존과 근접(섹션 순서열 + 대표색) · 업종 안 hero 중복 0. 시도 상한을 넘으면 모자란 채로 리포트.
 * 앱 번들에 들어가지 않는다 — 생성 스크립트(scripts/generate-internal-refs.mjs)와 테스트만 부른다.
 */
import type { DesignProfileInput, MotionPreset, SectionPlanEntry } from "./compareBoard";
import type { ComparisonAttributes } from "./comparisonCells";
import { contrastRatio } from "./contrast";
import { mapVariant } from "../data/engineVariantMap";
import { FONT_OPTIONS } from "./fonts";
import { hash } from "./hash";
import { lintPlan } from "./lintPlan";
import { checkProfileContrast } from "./profileContrast";
import type { DesignReference, LayoutTypeId, MotionLevel } from "./reference";
import type { PaletteEntry, ReferenceDetail, SimilarKind } from "./referenceDetail";
import { SIMILAR_LIMIT } from "./referenceDetail";
import { SECTION_LIBRARY } from "./sectionLibrary";
import { INDUSTRY_LABELS, VISUAL_TAG_LABELS } from "../fixtures/catalogFilters";
import {
  AUDIENCE_NOTES,
  CARD_AXIS,
  GENERATOR_DATE,
  HEADER_TEXT,
  HERO_OF_LAYOUT,
  INDUSTRY_SPECS,
  INTERNAL_PALETTES,
  LAYOUT_ORDER,
  LAYOUT_SHORT,
  MAX_ATTEMPTS,
  MEDIA_RATIOS,
  MOTION_NOTES,
  OUTPUT_LIMIT,
  SKELETON_TEMPLATES,
  SPACING_AXIS,
  TYPE_SCALES,
  type IndustrySpec,
  type InternalPalette,
} from "./internalComposeData";

/** 엔진 게이트 — 구조안(비교 변형) → 실패 이유, 통과면 undefined */
export type EngineGate = (plan: readonly SectionPlanEntry[]) => string | undefined;

export interface EngineGateDeps {
  /** 엔진 `createDocFromCandidate` — 실패하면 던진다(UNKNOWN_VARIANT · R-01 · R-02 · validatePageDoc) */
  readonly createDoc: (
    plan: { readonly candidateId: string; readonly sections: readonly SectionPlanEntry[]; readonly libraryVersion: string; readonly generatorVersion: string },
    profileVersion: number,
    start: { readonly projectId: string; readonly updatedAt: string },
  ) => unknown;
  /** 킷이 렌더하는 `type/variant` (RENDERED_VARIANTS) — 밖이면 폴백 섹션 */
  readonly renderedVariants: readonly string[];
}

/** 게이트 ①·④ — ENGINE_VARIANT_MAP으로 옮긴 뒤 실렌더 목록 안인지 보고 문서를 만들어 본다 */
export function engineGateOf(deps: EngineGateDeps, generatorVersion: string): EngineGate {
  return (plan) => {
    const sections = plan.map((s) => ({ type: s.type, variant: mapVariant(s.type, s.variant) ?? "" }));
    const fallback = sections.find((s) => !deps.renderedVariants.includes(`${s.type}/${s.variant}`));
    if (fallback) return `실렌더 목록 밖 변형: ${fallback.type}/${fallback.variant}`;
    try {
      deps.createDoc({ candidateId: "A", sections, libraryVersion: SECTION_LIBRARY.version, generatorVersion }, 1, { projectId: "internal-compose", updatedAt: `${GENERATOR_DATE}T00:00:00.000Z` });
      return undefined;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  };
}

export interface ComposeSpec {
  readonly industries: readonly IndustrySpec[];
  readonly palettes: readonly InternalPalette[];
  /** 기존(큐레이션) 레퍼런스 — 근접 중복·hero 중복·유사 추천 후보 */
  readonly existing: readonly DesignReference[];
  readonly existingPlans: Readonly<Record<string, ComparisonAttributes>>;
}

export interface ComposeOutput {
  readonly references: readonly DesignReference[];
  readonly details: Readonly<Record<string, ReferenceDetail>>;
  readonly comparisons: Readonly<Record<string, ComparisonAttributes>>;
  /** 모자란 업종·버린 후보 이유 (조용히 채우지 않는다) */
  readonly report: readonly string[];
}

export const defaultComposeSpec = (existing: readonly DesignReference[], existingPlans: Readonly<Record<string, ComparisonAttributes>>): ComposeSpec => ({
  industries: INDUSTRY_SPECS,
  palettes: INTERNAL_PALETTES,
  existing,
  existingPlans,
});

const ROLES = ["primary", "surface", "ink", "muted", "bg"] as const;
export const paletteEntries = (p: InternalPalette): readonly PaletteEntry[] => ROLES.map((role) => ({ role, hex: p[role] }));

/** 게이트 ③ — 대비 게이트 행과 같은 판정(밝은 카드 · AA) */
export const paletteFailures = (p: InternalPalette): readonly string[] =>
  checkProfileContrast(paletteEntries(p), "light", "aa")
    .filter((c) => !c.pass)
    .map((c) => `${p.id} ${c.id} ${c.ratio.toFixed(2)}`);

const SECTION_NAMES: Readonly<Record<string, string>> = {
  header: "Header", hero: "Hero", about: "About", services: "Services", portfolio: "Portfolio", statistics: "Statistics",
  testimonials: "Testimonials", pricing: "Pricing", faq: "FAQ", contact: "Contact", "cta-band": "CTA", footer: "Footer",
};

/** 금지 문자열 (2.6 ⑤ · TR-POL-01) */
const FORBIDDEN = ["http:", "https:", "//", "<", "data:"];

function freezeDeep<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const v of Object.values(value)) freezeDeep(v);
    Object.freeze(value);
  }
  return value;
}

const pick = <T>(list: readonly T[], seed: string, salt: string): T => list[parseInt(hash(`${seed}|${salt}`), 16) % list.length]!;

interface Candidate {
  readonly reference: DesignReference;
  readonly detail: Omit<ReferenceDetail, "similar">;
  readonly comparison: ComparisonAttributes;
  readonly canonical: string;
}

interface Slot {
  readonly spec: IndustrySpec;
  readonly n: number;
  readonly attempt: number;
  readonly layout: LayoutTypeId;
  readonly palettes: readonly InternalPalette[];
}

function planOf(spec: IndustrySpec, n: number, seed: string, layout: LayoutTypeId): { purpose: IndustrySpec["purposes"][number]; plan: SectionPlanEntry[] } {
  const purpose = spec.purposes[(n - 1) % spec.purposes.length]!;
  const plan = SKELETON_TEMPLATES[purpose].map((slot) => ({
    type: slot.type,
    variant: slot.type === "hero" ? HERO_OF_LAYOUT[layout] : pick(slot.variants, seed, slot.type),
  }));
  return { purpose, plan };
}

function ctaOf(header: string, hero: string): ComparisonAttributes["cta"] {
  if (hero === "center") return { label: "히어로 중앙", value: "hero-center" };
  if (header === "transparent") return { label: "하단 고정 버튼", value: "sticky-bottom" };
  if (header === "sticky-right-cta") return { label: "헤더 우측 고정", value: "header-fixed" };
  return { label: "히어로 좌측 하단", value: "hero-inline" };
}

function build({ spec, n, attempt, layout, palettes }: Slot, version: string): Candidate {
  const seed = hash(`${spec.industry}|${n}|${attempt}|${version}`);
  const { purpose, plan } = planOf(spec, n, seed, layout);
  const palette = pick(palettes, seed, "palette");
  const card = pick(CARD_AXIS, seed, "card");
  const ratio = pick(MEDIA_RATIOS, seed, "ratio");
  const spacing = pick(SPACING_AXIS, seed, "spacing");
  const motion: MotionLevel = pick(["low", "mid"] as const, seed, "motion");
  const family = pick(FONT_OPTIONS.filter((f) => f.enabled), seed, "font").family;
  const concept = spec.concepts[(n - 1 + attempt) % spec.concepts.length]!;
  const audience = pick(spec.audiences, seed, "audience");
  const header = plan.find((s) => s.type === "header")!.variant;
  const headerText = HEADER_TEXT[header]!;
  const id = `gen-${spec.industry}-${n}`;
  const reference: DesignReference = {
    id,
    key: "",
    slug: `${spec.industry}-${concept[0]}-${layout}-${n}`,
    title: `${INDUSTRY_LABELS[spec.industry]} · ${VISUAL_TAG_LABELS[concept[0]]} ${LAYOUT_SHORT[layout]}형`,
    licenseStatus: "internal",
    sourceKind: "library_composition",
    industry: spec.industry,
    audience: [...audience],
    purpose: [purpose],
    visualTags: [...concept],
    layoutType: layout,
    colorPalette: { primary: palette.primary, surface: palette.surface, ink: palette.ink },
    motionLevel: motion,
    responsive: true,
    devices: ["desktop", "mobile", "responsive"],
    scores: { status: "unmeasured" },
    createdAt: GENERATOR_DATE,
  };
  const detail: Omit<ReferenceDetail, "similar"> = {
    audienceNote: audience.map((a) => AUDIENCE_NOTES[a]).join(" · "),
    buildNote: `internal 조합 생성기 ${version}으로 조립`,
    sections: plan.filter((s) => s.type !== "footer").map((s) => ({ name: SECTION_NAMES[s.type]!, variant: s.variant })),
    palette: paletteEntries(palette),
    bodyContrast: Math.round(contrastRatio(palette.ink, palette.bg) * 10) / 10,
    typography: { family, headingWeight: 700, bodyWeight: 400, scale: pick(TYPE_SCALES, seed, "scale") },
    spacing: { grid: "8pt", sectionGap: spacing.sectionGap },
    motionNote: MOTION_NOTES[motion],
    mobileFlow: [headerText.mobile.value.startsWith("two-column") ? "2컬럼 카드" : "단일 컬럼", headerText.flow, `히어로 ${ratio}`, "카드 세로 스택", headerText.mobile.label.split(" · ")[1] ?? "하단 CTA"],
    measuredWith: "미측정",
  };
  const comparison: ComparisonAttributes = {
    sectionPlan: plan,
    menuLabel: headerText.menu,
    cta: ctaOf(header, HERO_OF_LAYOUT[layout]),
    card: { label: card.label, style: card.style, surfaceTone: "light" },
    imageRatio: ratio,
    mobile: headerText.mobile,
    paletteNote: palette.note,
  };
  const bodies = plan.filter((s) => s.type !== "header" && s.type !== "footer" && s.type !== "hero").map((s) => `${s.type}/${s.variant}`).sort();
  return { reference, detail, comparison, canonical: [spec.industry, HERO_OF_LAYOUT[layout], bodies.join(","), palette.id, card.style].join("|") };
}

const MOTION_PRESET: Readonly<Record<MotionLevel, MotionPreset>> = { low: "L1", mid: "L1", high: "L2" };

const token = (palette: readonly PaletteEntry[], role: PaletteEntry["role"]) => ({ $type: "color" as const, $value: palette.find((p) => p.role === role)?.hex ?? "" });

/** 게이트 ②·③ — lint 입력 프로필은 후보 값 그대로(조정 0) */
function lintFailures(c: Candidate): readonly string[] {
  const { reference: r, detail: d, comparison: a } = c;
  const profile: DesignProfileInput = {
    source_reference_ids: [r.id],
    visual_direction: r.visualTags.join(","),
    layout_direction: r.layoutType,
    color_tokens: {
      primary: token(d.palette, "primary"),
      surface: token(d.palette, "surface"),
      ink: token(d.palette, "ink"),
      muted: token(d.palette, "muted"),
      bg: token(d.palette, "bg"),
    },
    typography_tokens: d.typography,
    spacing_tokens: d.spacing,
    motion_preset: MOTION_PRESET[r.motionLevel],
    component_choices: { card_style: { style: a.card.style, surfaceTone: a.card.surfaceTone } },
    section_plan: a.sectionPlan,
    library_version: SECTION_LIBRARY.version,
    seed: hash(r.id),
    selection_mode: "template",
  };
  const sections = a.sectionPlan.map((s) => ({ ...s, motion: "L1" as const }));
  return lintPlan(sections, { profile, purpose: r.purpose[0]!, contrast: "aa", library: SECTION_LIBRARY })
    .filter((i) => i.severity === "block")
    .map((i) => `${i.rule} ${i.message}`);
}

const planKey = (plan: readonly SectionPlanEntry[]) => plan.map((s) => `${s.type}/${s.variant}`).join(">");

function similarOf(self: DesignReference, all: readonly DesignReference[]): Record<SimilarKind, readonly string[]> {
  const others = all.filter((r) => r.id !== self.id);
  const ids = (match: (r: DesignReference) => boolean) => others.filter(match).map((r) => r.id).sort().slice(0, SIMILAR_LIMIT);
  return {
    industry: ids((r) => r.industry === self.industry),
    concept: ids((r) => r.visualTags.some((t) => self.visualTags.includes(t))),
    layout: ids((r) => r.layoutType === self.layoutType),
  };
}

export function composeInternalReferences(spec: ComposeSpec, version: string, engineGate: EngineGate): ComposeOutput {
  const report: string[] = [];
  const palettes = spec.palettes.filter((p) => {
    const failures = paletteFailures(p);
    if (failures.length > 0) report.push(`팔레트 제외(대비 AA): ${failures.join(", ")}`);
    return failures.length === 0;
  });
  // 쓸 팔레트가 없으면 후보를 만들 수 없다 — 예외 대신 부족 리포트(M3P-1 Codex P2-2)
  if (palettes.length === 0) {
    report.push("쓸 수 있는 팔레트 0개 — 생성 0 (모든 업종 모자람)");
    return freezeDeep({ references: [], details: {}, comparisons: {}, report });
  }
  const existingPlans = new Set(spec.existing.map((r) => `${planKey(spec.existingPlans[r.id]?.sectionPlan ?? [])}|${r.colorPalette.primary}`));
  const canonicals = new Set<string>();
  const accepted: Candidate[] = [];
  for (const industry of spec.industries) {
    const usedLayouts = new Set(spec.existing.filter((r) => r.industry === industry.industry).map((r) => r.layoutType));
    let attempts = 0;
    for (let n = 1; n <= industry.count && accepted.length < OUTPUT_LIMIT; n += 1) {
      let placed = false;
      while (!placed && attempts < MAX_ATTEMPTS) {
        const attempt = attempts;
        attempts += 1;
        const seed = hash(`${industry.industry}|${n}|${attempt}|${version}|layout`);
        const free = LAYOUT_ORDER.filter((l) => !usedLayouts.has(l));
        if (free.length === 0) break;
        const unusedPalettes = palettes.filter((p) => !accepted.some((c) => c.reference.colorPalette.primary === p.primary));
        const candidate = build({ spec: industry, n, attempt, layout: pick(free, seed, "hero"), palettes: unusedPalettes.length > 0 ? unusedPalettes : palettes }, version);
        const reasons = [
          ...(canonicals.has(candidate.canonical) ? ["정규 키 중복"] : []),
          ...(existingPlans.has(`${planKey(candidate.comparison.sectionPlan)}|${candidate.reference.colorPalette.primary}`) ? ["기존 근접 중복"] : []),
          ...[engineGate(candidate.comparison.sectionPlan)].filter((r): r is string => r !== undefined),
          ...lintFailures(candidate),
          ...FORBIDDEN.filter((f) => JSON.stringify(candidate).includes(f)).map((f) => `금지 문자열 ${f}`),
        ];
        if (reasons.length > 0) {
          report.push(`${candidate.reference.id} 시도 ${attempt} 버림: ${reasons.join(" · ")}`);
          continue;
        }
        canonicals.add(candidate.canonical);
        usedLayouts.add(candidate.reference.layoutType);
        accepted.push(candidate);
        placed = true;
      }
      if (!placed) report.push(`${industry.industry} ${n}번째 모자람 (시도 상한 ${MAX_ATTEMPTS})`);
    }
  }
  // id 순 — 점수순(안정 정렬)에서 미측정 그룹이 id 오름차순이 되게(SPEC 4.2)
  const references = accepted.map((c) => c.reference).sort((a, b) => a.id.localeCompare(b.id));
  const all = [...spec.existing, ...references];
  return freezeDeep({
    references,
    details: Object.fromEntries(accepted.map((c) => [c.reference.id, { ...c.detail, similar: similarOf(c.reference, all) }])),
    comparisons: Object.fromEntries(accepted.map((c) => [c.reference.id, c.comparison])),
    report,
  });
}

/** 커밋하는 픽스처 파일 이름 → 텍스트 — 생성 스크립트가 쓰고, 가드 테스트(M3P-AC-G1)가 재실행 결과와 바이트 비교한다 */
export const GENERATED_FIXTURE_FILES = ["generatedReferences.ts", "generatedReferenceDetails.ts"] as const;

/**
 * 카드(목록·프로필 출처 조회)와 상세·비교(상세 화면·보드)를 다른 파일 = 다른 청크로 — 프로필이 생성 출처를 풀 때 카드만 받는다(SPEC 6절 · MQ-M3P-7 A).
 * 기존 픽스처(references·referenceDetails·referenceComparisons)와도 별도 청크.
 */
export function renderGeneratedFixture(output: ComposeOutput, version: string): Readonly<Record<(typeof GENERATED_FIXTURE_FILES)[number], string>> {
  const json = (value: unknown) => JSON.stringify(value, null, 2);
  const head = `// 생성 파일 — 손으로 고치지 않는다. internal 조합 생성기 ${version} (SPEC m3p 2절) · 다시 만들기: node scripts/generate-internal-refs.mjs`;
  return {
    "generatedReferences.ts": [
      head,
      'import type { DesignReference } from "../domain/reference";',
      "",
      `export const generatedReferenceFixtures: readonly DesignReference[] = Object.freeze(${json(output.references)});`,
      "",
    ].join("\n"),
    "generatedReferenceDetails.ts": [
      head,
      'import type { ComparisonAttributes } from "../domain/comparisonCells";',
      'import type { ReferenceDetail } from "../domain/referenceDetail";',
      "",
      `export const generatedReferenceDetailFixtures: Readonly<Record<string, ReferenceDetail>> = Object.freeze(${json(output.details)});`,
      "",
      `export const generatedReferenceComparisonAttributes: Readonly<Record<string, ComparisonAttributes>> = Object.freeze(${json(output.comparisons)});`,
      "",
    ].join("\n"),
  };
}

