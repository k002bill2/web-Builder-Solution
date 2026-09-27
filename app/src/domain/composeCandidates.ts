/**
 * 결정적 구조안 3안 (DS-2A-04 SPEC 4.1~4.5 · FR-GEN-03~06). 생성기(M2) 전 미리보기 — 가짜 페이지가 아니라
 * SectionPlan + 축 값 + 모션 배정 + 로그 + lint + 해시다. 순수 함수: 시각·무작위 없음, 객체 키 순서에 기대지 않는다
 * (키는 정렬해서 읽고 해시는 정렬 직렬화). 출력은 깊게 동결하고 입력은 건드리지 않는다.
 *
 * - 입력 프로필 = 저장된 버전의 **적용된 값**(effectiveProfile). 라이브러리 = 프로필 `library_version`의 것(없으면 3안 모두 결정적 실패).
 * - 본문 = header·footer 밖(Hero 포함) — 엔진 R-01과 같은 뜻, 판정 재료는 lintPlan과 공유한다.
 * - L4c 이음새: `plan.sections`(type·variant)를 generation.ts `toEngineCandidate`가 엔진 `createDocFromCandidate` 입력으로 옮긴다(2a-05).
 */
import type { DesignProfileInput, MotionPreset, SectionPlanEntry, SectionType } from "./compareBoard";
import { CANDIDATE_IDS, type CandidateAxes, type CandidateId, type CandidatePlan, type ComposedResult, type GridStyle, type PlannedSection } from "./generation";
import { BODY_MAX, isBody, isInquiry, isReservation, lastInquiry, lintPlan } from "./lintPlan";
import type { ContrastLevel } from "./profile";
import { hash } from "./hash";
import type { PurposeId } from "./reference";
import { DEFAULT_FOOTER_VARIANT, resolveVariant, type SectionLibrary } from "./sectionLibrary";

export interface ComposeInput {
  /** 저장된 버전의 적용된 값 */
  readonly profile: DesignProfileInput;
  readonly purpose: PurposeId | "none";
  /** R-08 목표 */
  readonly contrast: ContrastLevel;
  /** profile.library_version의 라이브러리 — undefined = 찾지 못함 */
  readonly library: SectionLibrary | undefined;
  /** GENERATOR_VERSION */
  readonly generatorVersion: string;
}

const GRID_LADDER: readonly GridStyle[] = ["grid-3", "grid-2", "masonry"];
const SCALE_LADDER: readonly number[] = [1.2, 1.25, 1.333];
const GRID_LABEL: Readonly<Record<GridStyle, string>> = { "grid-3": "3열", "grid-2": "2열", masonry: "마소니" };
const PURPOSE_LABEL: Readonly<Record<ComposeInput["purpose"], string>> = { booking: "예약", inquiry: "문의", sales: "판매", none: "정하지 않음" };
const CONTRAST_LABEL: Readonly<Record<ContrastLevel, string>> = { aa: "AA", enhanced: "강화" };
const SECTION_NAME: Readonly<Record<SectionType, string>> = {
  header: "Header", hero: "Hero", about: "About", services: "Services", portfolio: "Portfolio", statistics: "Statistics",
  testimonials: "Testimonials", pricing: "Pricing", faq: "FAQ", contact: "Contact", "cta-band": "CTA 띠", footer: "Footer",
};
/**
 * R-01 본문 9개 상한 제외 순서(고정) — 앞일수록 먼저 뺀다. 같은 유형이 여럿이면 뒤의 것부터.
 * 부가 정보(요금·FAQ·수치·후기) → 소개성(사례·소개·서비스) → 행동(CTA 띠·Contact) 순. header·hero·footer는 목록에 없어 빼지 않는다.
 * 목적 필수 섹션(예약 = contact/booking, 문의 = contact·cta-band)과 그리드 축이 걸린 섹션(첫 services/portfolio)도 빼지 않는다.
 */
const DROP_ORDER: readonly SectionType[] = ["pricing", "faq", "statistics", "testimonials", "portfolio", "about", "services", "cta-band", "contact"];
const LIMIT_REASON = `본문 ${BODY_MAX}개 상한 (R-01)`;

// ── 축 (4.2) ────────────────────────────────────────────────

/** seed(8자리 16진) → 수. 읽을 수 없으면 0 */
function seedNumber(seed: string): number {
  const n = Number.parseInt(seed, 16);
  return Number.isNaN(n) ? 0 : n;
}
const sortedKeys = (record: object): string[] => Object.keys(record).sort((a, b) => a.localeCompare(b));
const isGrid = (variant: string): variant is GridStyle => (GRID_LADDER as readonly string[]).includes(variant);
const firstGridIndex = (sections: readonly SectionPlanEntry[]) => sections.findIndex((s) => s.type === "services" || s.type === "portfolio");

/**
 * A = 프로필 Hero(component_choices → section_plan → 라이브러리 키 사전순 첫째). B·C = A(와 그 이전 이름이 옮겨 간 변형)를 뺀 키를
 * 사전순으로 놓고 seed % n 위치부터 연속 2개(끝에서 처음으로 돈다). 모자라면 undefined → 그 안은 결정적 실패.
 */
function heroAxis(profile: DesignProfileInput, library: SectionLibrary): readonly (string | undefined)[] {
  const keys = sortedKeys(library.sections.hero);
  const a = profile.component_choices.hero?.variant ?? profile.section_plan.find((s) => s.type === "hero")?.variant ?? keys[0] ?? "";
  const current = resolveVariant(library, "hero", a)?.variant;
  const rest = keys.filter((k) => k !== a && k !== current);
  const start = rest.length === 0 ? 0 : seedNumber(profile.seed) % rest.length;
  const pick = (offset: number) => (offset < rest.length ? rest[(start + offset) % rest.length] : undefined);
  return [a, pick(0), pick(1)];
}

/** A = 첫 services/portfolio 변형(사다리 값일 때, 아니면 3열). B·C = 나머지 사다리 순서, seed 홀수면 서로 바꾼다 */
function gridAxis(profile: DesignProfileInput): readonly GridStyle[] {
  const variant = profile.section_plan[firstGridIndex(profile.section_plan)]?.variant;
  const a: GridStyle = variant !== undefined && isGrid(variant) ? variant : "grid-3";
  const [x, y] = GRID_LADDER.filter((g) => g !== a) as [GridStyle, GridStyle];
  return seedNumber(profile.seed) % 2 === 1 ? [a, y, x] : [a, x, y];
}

/** A = 프로필 비율(사다리 밖이어도 그대로). B·C = 사다리에서 A와 다른 값 중 가까운 2개(B가 더 가깝다, 같으면 작은 값 먼저) */
function scaleAxis(scale: number): readonly number[] {
  const distance = (v: number) => Math.round(Math.abs(v - scale) * 1e6);
  const [b, c] = SCALE_LADDER.filter((v) => v !== scale).sort((x, y) => distance(x) - distance(y) || x - y);
  return [scale, b!, c!];
}

// ── 구조 규칙 (4.2 공통) ─────────────────────────────────────

interface Draft {
  readonly sections: readonly SectionPlanEntry[];
  /** 로그 1줄째 — 구조를 바꾼 규칙 */
  readonly applied: readonly string[];
  /** 로그 3줄째 — 뺀 섹션 유형 */
  readonly excluded: readonly SectionType[];
  readonly log: readonly string[];
}

const entry = (type: SectionType, variant: string): SectionPlanEntry => ({ type, variant });
const insertAt = (sections: readonly SectionPlanEntry[], at: number, next: SectionPlanEntry) => [...sections.slice(0, at), next, ...sections.slice(at)];
const replaceAt = (sections: readonly SectionPlanEntry[], at: number, next: SectionPlanEntry) => sections.map((s, i) => (i === at ? next : s));
const noted = (draft: Draft, line: string): Draft => ({ ...draft, log: [...draft.log, line] });
const applied = (draft: Draft, sections: readonly SectionPlanEntry[], line: string): Draft => ({ ...draft, sections, applied: [...draft.applied, line], log: [...draft.log, line] });
const variantLabel = (library: SectionLibrary, type: "hero" | "footer", variant: string) => resolveVariant(library, type, variant)?.def.label ?? variant;

/** Hero 축: 첫 hero 변형을 바꾸고, 없으면 header 바로 뒤(header가 없으면 맨 앞)에 넣는다 */
function withHero(draft: Draft, heroVariant: string, library: SectionLibrary): Draft {
  const at = draft.sections.findIndex((s) => s.type === "hero");
  const hero = entry("hero", heroVariant);
  const label = variantLabel(library, "hero", heroVariant);
  if (at < 0) return applied(draft, insertAt(draft.sections, draft.sections.findIndex((s) => s.type === "header") + 1, hero), `Hero 없음 → ${label} 추가 (R-02)`);
  return noted({ ...draft, sections: replaceAt(draft.sections, at, hero) }, `Hero 축 → ${label}`);
}

/** 그리드 축: 첫 services/portfolio 변형이 사다리 값일 때만 바꾼다(아니면 구조안 그대로, 축 값은 보고) */
function withGrid(draft: Draft, grid: GridStyle): Draft {
  const at = firstGridIndex(draft.sections);
  const target = draft.sections[at];
  if (!target || !isGrid(target.variant)) return noted(draft, `카드 그리드 축 ${GRID_LABEL[grid]} — 첫 services/portfolio 변형이 사다리 밖이라 구조안은 그대로`);
  return noted({ ...draft, sections: replaceAt(draft.sections, at, entry(target.type, grid)) }, `카드 그리드 축 → ${SECTION_NAME[target.type]} ${GRID_LABEL[grid]}`);
}

/** Footer: 없으면 기본 Footer를 끝에(R-01), 사업자정보 없는 변형은 확장 변형으로(R-12, 보드 확정과 같은 규칙) — 못 바꾸면 lint R-12 */
function withFooter(draft: Draft, library: SectionLibrary): Draft {
  const at = draft.sections.findIndex((s) => s.type === "footer");
  if (at < 0) {
    const line = `Footer 없음 → '${variantLabel(library, "footer", DEFAULT_FOOTER_VARIANT)}' 추가 (R-01)`;
    return applied(draft, [...draft.sections, entry("footer", DEFAULT_FOOTER_VARIANT)], line);
  }
  const { variant } = draft.sections[at]!;
  const def = resolveVariant(library, "footer", variant)?.def;
  if (!def) return noted(draft, `Footer '${variant}' — 라이브러리 ${library.version}에 없어 사업자정보를 확인할 수 없음 → lint R-12`);
  if (def.hasBusinessInfo !== false) return noted(draft, `Footer '${def.label}' — 사업자정보 있음 (R-12 충족)`);
  const alt = def.businessInfoVariant === undefined ? undefined : resolveVariant(library, "footer", def.businessInfoVariant);
  if (!alt) return noted(draft, `Footer '${def.label}' — 사업자정보 없음, 바꿀 확장 변형 없음 → lint R-12`);
  return applied(draft, replaceAt(draft.sections, at, entry("footer", alt.variant)), `Footer '${def.label}' → '${alt.def.label}' (R-12)`);
}

const beforeFooter = (sections: readonly SectionPlanEntry[]) => {
  const at = sections.findIndex((s) => s.type === "footer");
  return at < 0 ? sections.length : at;
};

/** 목적 필수 섹션: 예약 → contact/booking(R-04), 문의 → 후반 1/3에 cta-band·contact(R-03). 없으면 footer 앞에 넣는다 */
function withPurpose(draft: Draft, purpose: ComposeInput["purpose"]): Draft {
  const { sections } = draft;
  if (purpose === "booking") {
    if (sections.some(isReservation)) return noted(draft, "목적 '예약' — Contact(예약) 있음 (R-04 충족)");
    return applied(draft, insertAt(sections, beforeFooter(sections), entry("contact", "booking")), "목적 '예약' → Contact(예약) 추가 (R-04)");
  }
  if (purpose === "inquiry") {
    if (lastInquiry(sections)?.late) return noted(draft, "목적 '문의' — 후반 1/3에 문의 섹션 있음 (R-03 충족)");
    return applied(draft, insertAt(sections, beforeFooter(sections), entry("cta-band", "banner")), `목적 '문의' → ${SECTION_NAME["cta-band"]} 추가 (R-03)`);
  }
  return noted(draft, purpose === "none" ? "목적 정하지 않음 — 필수 섹션 검사 안 함" : `목적 '${PURPOSE_LABEL[purpose]}' — 추가 필수 섹션 없음`);
}

type Keep = (s: SectionPlanEntry, index: number, sections: readonly SectionPlanEntry[]) => boolean;

/** 빼지 않는 섹션: 목적 필수 섹션 + 그리드 축이 걸린 첫 services/portfolio */
const keepOf = (purpose: ComposeInput["purpose"]): Keep => (s, index, sections) =>
  index === firstGridIndex(sections) || (purpose === "booking" && isReservation(s)) || (purpose === "inquiry" && isInquiry(s));

function victimIndex(sections: readonly SectionPlanEntry[], keep: Keep): number {
  for (const type of DROP_ORDER) {
    const at = sections.findLastIndex((s, i) => s.type === type && !keep(s, i, sections));
    if (at >= 0) return at;
  }
  return -1;
}

/** R-01: 본문(Hero 포함)이 9개를 넘으면 고정 순서로 뺀다. 더 뺄 수 없으면 그대로 두고 lint R-01이 알린다 */
function trimBody(draft: Draft, keep: Keep): Draft {
  if (draft.sections.filter(isBody).length <= BODY_MAX) return draft;
  const victim = victimIndex(draft.sections, keep);
  if (victim < 0) return noted(draft, `본문이 ${BODY_MAX}개를 넘지만 뺄 수 있는 섹션이 없음 → lint R-01`);
  const { type } = draft.sections[victim]!;
  const next = { ...draft, sections: draft.sections.filter((_, i) => i !== victim), excluded: [...draft.excluded, type] };
  return trimBody(noted(next, `${SECTION_NAME[type]} 제외 — ${LIMIT_REASON}`), keep);
}

/** 모션: L2 → 첫 hero + 앞 본문 2개만 L2(R-07 L2 ≤ 3), 나머지 L1 · L1·L0 → 모두 그 값 */
function withMotion(sections: readonly SectionPlanEntry[], preset: MotionPreset): PlannedSection[] {
  if (preset !== "L2") return sections.map(({ type, variant }) => ({ type, variant, motion: preset }));
  const hero = sections.findIndex((s) => s.type === "hero");
  const lead = new Set(sections.flatMap((s, i) => (isBody(s) && i !== hero ? [i] : [])).slice(0, 2));
  return sections.map(({ type, variant }, i) => ({ type, variant, motion: i === hero || lead.has(i) ? "L2" : "L1" }));
}

/** 적용 순서: Hero 축 → 그리드 축 → Footer → 상한(목적 섹션 보호) → 목적 필수 섹션 → 상한(추가로 넘친 1개) */
function composeSections(input: ComposeInput, library: SectionLibrary, axes: CandidateAxes): Draft {
  const keep = keepOf(input.purpose);
  const start: Draft = { sections: input.profile.section_plan, applied: [], excluded: [], log: [] };
  const shaped = withFooter(withGrid(withHero(start, axes.heroVariant, library), axes.grid), library);
  return trimBody(withPurpose(trimBody(shaped, keep), input.purpose), keep);
}

// ── 로그 · 해시 (4.3 · 4.5) ──────────────────────────────────

const shortLabel = (label: string) => label.replace(/\s*\(.*\)$/, "");
const scaleText = (scale: number) => `${scale}${SCALE_LADDER.includes(scale) ? "" : " (프로필)"}`;

function summaryOf(id: CandidateId, axes: CandidateAxes, draft: Draft, library: SectionLibrary): readonly [string, string, string] {
  const hero = shortLabel(variantLabel(library, "hero", axes.heroVariant));
  const excluded = draft.excluded.map((type) => SECTION_NAME[type]);
  return [
    draft.applied.length > 0 ? draft.applied.join(" / ") : "구조 규칙 모두 충족",
    id === "A" ? "프로필 값 그대로" : `Hero ${hero} · 카드 ${GRID_LABEL[axes.grid]} · 비율 ${axes.typeScale} (A와 3축 다름)`,
    excluded.length > 0 ? `${excluded.join(" · ")} 제외 — ${LIMIT_REASON}` : "제외한 섹션 없음",
  ];
}

function motionLine(sections: readonly PlannedSection[], preset: MotionPreset): string {
  const l2 = sections.filter((s) => s.motion === "L2").map((s) => SECTION_NAME[s.type]);
  if (preset !== "L2") return `모션 ${preset} — 모든 섹션 ${preset}`;
  return `모션 L2 — L2: ${l2.join(" · ")} (${l2.length}개, R-07 L2 ≤ 3) · 나머지 L1`;
}

/** 정렬 직렬화 — 키는 코드 단위 순서(로캘 무관), undefined 값 키는 JSON.stringify처럼 뺀다 */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((v) => (v === undefined ? "null" : canonical(v))).join(",")}]`;
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  const record = value as Readonly<Record<string, unknown>>;
  const keys = Object.keys(record).filter((k) => record[k] !== undefined).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(record[k])}`).join(",")}}`;
}

function planOf(id: CandidateId, axes: CandidateAxes, input: ComposeInput, library: SectionLibrary): CandidatePlan {
  const { profile, purpose, contrast, generatorVersion } = input;
  const draft = composeSections(input, library, axes);
  const sections = withMotion(draft.sections, profile.motion_preset);
  const lint = lintPlan(sections, { profile, purpose, contrast, library });
  const planHash = hash(canonical({ generatorVersion, libraryVersion: library.version, id, profile, purpose, contrast, axes, sections }));
  const blocks = lint.filter((i) => i.severity === "block").length;
  const log = [
    `입력 · 라이브러리 ${library.version} · seed ${profile.seed} · 생성기 ${generatorVersion} · 목적 ${PURPOSE_LABEL[purpose]} · 대비 ${CONTRAST_LABEL[contrast]}`,
    `축 · Hero ${variantLabel(library, "hero", axes.heroVariant)} · 카드 ${GRID_LABEL[axes.grid]} · 비율 ${scaleText(axes.typeScale)}`,
    ...draft.log,
    motionLine(sections, profile.motion_preset),
    `lint · 경고 ${blocks} · 정보 ${lint.length - blocks}`,
    `해시 ${planHash}`,
  ];
  return { id, axes, sections, summary: summaryOf(id, axes, draft, library), log, lint, hash: planHash };
}

// ── 결과 ─────────────────────────────────────────────────────

const failure = (id: CandidateId, message: string): ComposedResult => ({ id, status: "failed", errorCode: "UNSUPPORTED_COMBINATION", retryable: false, message });

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export function composeCandidates(input: ComposeInput): readonly ComposedResult[] {
  const { profile, library } = input;
  if (!library) {
    const message = `라이브러리 ${profile.library_version}를 찾을 수 없습니다 · 이 버전으로는 다시 만들 수 없으니 비교 보드에서 현재 라이브러리로 다시 확정하세요`;
    return deepFreeze(CANDIDATE_IDS.map((id) => failure(id, message)));
  }
  const heroes = heroAxis(profile, library);
  const grids = gridAxis(profile);
  const scales = scaleAxis(profile.typography_tokens.scale);
  const heroCount = Object.keys(library.sections.hero).length;
  return deepFreeze(
    CANDIDATE_IDS.map((id, i): ComposedResult => {
      const heroVariant = heroes[i];
      if (heroVariant === undefined) {
        return failure(id, `라이브러리 ${library.version}의 Hero 변형이 ${heroCount}개뿐이라 ${id}안에 다른 안과 겹치지 않는 Hero를 줄 수 없습니다 · Hero 변형이 3개 이상인 라이브러리 버전으로 비교 보드에서 다시 확정하세요`);
      }
      return { id, status: "succeeded", plan: planOf(id, { heroVariant, grid: grids[i]!, typeScale: scales[i]! }, input, library) };
    }),
  );
}
