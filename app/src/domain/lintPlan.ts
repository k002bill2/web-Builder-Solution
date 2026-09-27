/**
 * 구조안 lint (DS-2A-04 SPEC 4.4 · FR-GEN-06). 순수 함수 — 같은 입력이면 같은 결과, 입력은 건드리지 않는다.
 * 경고는 선택을 막지 않는다(차단은 발행 단계). `message` = "원인 · 대체안"(규칙 ID는 `rule` 필드 — 화면이 "R-01 · …"로 붙인다).
 *
 * 판정 뜻은 엔진 게이트(`engine/gate/requiredSections`)와 같다 — 구조안이 2a-05 `createDocFromCandidate`(같은 판정으로 거부)를
 * 통과해야 하기 때문이다. engine은 import하지 않는다(화면 번들 0, engineImportGuard) — 판정 재료를 여기 두고
 * composeCandidates가 같이 쓴다(구조안 규칙과 lint가 어긋나지 않게). 엔진과 같은 뜻인지는 lintPlan.test가 대조한다.
 * - 본문 = header·footer 밖 섹션(**Hero 포함**, 엔진 R-01 `BODY_MIN`·`BODY_MAX`와 같은 5~9).
 * - R-04 예약 = contact/booking(엔진 `reservation: true`) — 다른 contact 변형(문의 폼·지도)은 예약이 아니다.
 * - R-03 문의 = 본문 중 마지막 contact·cta-band가 후반 1/3(index ≥ n − ⌈n/3⌉).
 * - 목적 "정하지 않음" 정보 줄은 R-03 하나로 낸다(R-03·R-04 공통 안내라 한 줄).
 */
import type { DesignProfileInput, SectionPlanEntry, SectionType } from "./compareBoard";
import type { LintIssue, LintRule, PlannedSection } from "./generation";
import type { ContrastLevel } from "./profile";
import { checkProfileContrast } from "./profileContrast";
import type { PurposeId } from "./reference";
import type { PaletteEntry, PaletteRole } from "./referenceDetail";
import { resolveVariant, type SectionLibrary } from "./sectionLibrary";

/** R-01 본문(Hero 포함) 하한·상한 — 엔진 ops/rules와 같은 값 */
export const BODY_MIN = 5;
export const BODY_MAX = 9;

export const isBody = (s: SectionPlanEntry): boolean => s.type !== "header" && s.type !== "footer";
/** R-04 예약 섹션 (엔진 bodySections `reservation: true`) */
export const isReservation = (s: SectionPlanEntry): boolean => s.type === "contact" && s.variant === "booking";
/** R-03 문의 섹션 */
export const isInquiry = (s: SectionPlanEntry): boolean => s.type === "contact" || s.type === "cta-band";
/** R-03 "후반 1/3" 시작 — 본문 n개 중 index ≥ n − ⌈n/3⌉ (엔진 lateThirdStart) */
export const lateThirdStart = (bodyLength: number): number => bodyLength - Math.ceil(bodyLength / 3);

/** 본문 중 마지막 문의 섹션의 전체 섹션 위치 · 후반 1/3 여부 */
export function lastInquiry(sections: readonly SectionPlanEntry[]): { readonly index: number; readonly late: boolean } | undefined {
  const bodies = sections.flatMap((s, index) => (isBody(s) ? [{ s, index }] : []));
  const at = bodies.findLastIndex(({ s }) => isInquiry(s));
  return at < 0 ? undefined : { index: bodies[at]!.index, late: at >= lateThirdStart(bodies.length) };
}

export interface LintInput {
  readonly profile: DesignProfileInput;
  readonly purpose: PurposeId | "none";
  readonly contrast: ContrastLevel;
  readonly library: SectionLibrary;
}

export const PURPOSE_INFO = "목적을 고르면 필수 섹션을 검사합니다";

const issueOf = (rule: LintRule, severity: LintIssue["severity"], message: string, sectionIndex?: number): LintIssue =>
  sectionIndex === undefined ? { rule, severity, message } : { rule, severity, message, sectionIndex };
const block = (rule: LintRule, cause: string, alternative: string, sectionIndex?: number) => issueOf(rule, "block", `${cause} · ${alternative}`, sectionIndex);

const NAMES: Readonly<Partial<Record<SectionType, string>>> = { header: "Header", hero: "Hero", footer: "Footer" };

type Indexed = { readonly s: SectionPlanEntry; readonly i: number };

/** 정확히 하나: 없음 → 1건, 둘째부터 → 그 섹션마다 1건 (엔진 exactlyOne 순서) */
function exactlyOne(sections: readonly Indexed[], type: SectionType, rule: LintRule): LintIssue[] {
  const name = NAMES[type] ?? type;
  const found = sections.filter(({ s }) => s.type === type);
  if (found.length === 0) return [block(rule, `${name}가 없습니다`, `${name}를 하나 두세요`)];
  return found.slice(1).map(({ i }) => block(rule, `${name}가 둘 이상입니다`, `${name}는 하나만 남기세요`, i));
}

/** R-01(header 1 맨 위 · footer 1 맨 아래 · 본문 5~9) · R-02(Hero 1개 · 첫 본문) — 엔진 structureIssues와 같은 순서 */
function structureIssues(sections: readonly PlannedSection[]): LintIssue[] {
  const indexed = sections.map((s, i) => ({ s, i }));
  const bodies = indexed.filter(({ s }) => isBody(s));
  const header = sections.findIndex((s) => s.type === "header");
  const footer = sections.findIndex((s) => s.type === "footer");
  const hero = bodies.find(({ s }) => s.type === "hero");
  const n = bodies.length;
  return [
    ...exactlyOne(indexed, "header", "R-01"),
    ...(header > 0 ? [block("R-01", "Header가 맨 위에 있지 않습니다", "Header를 맨 위로 옮기세요", header)] : []),
    ...exactlyOne(indexed, "footer", "R-01"),
    ...(footer >= 0 && footer !== sections.length - 1 ? [block("R-01", "Footer가 맨 아래에 있지 않습니다", "Footer를 맨 아래로 옮기세요", footer)] : []),
    ...(n < BODY_MIN ? [block("R-01", `본문 섹션이 ${n}개입니다 — ${BODY_MIN}개 이상이어야 합니다`, `편집기에서 본문 섹션을 추가하세요`)] : []),
    ...(n > BODY_MAX ? [block("R-01", `본문 섹션이 ${n}개입니다 — ${BODY_MAX}개까지입니다`, `본문 섹션을 ${BODY_MAX}개 이하로 지우세요`)] : []),
    ...exactlyOne(bodies, "hero", "R-02"),
    ...(hero && bodies[0] !== hero ? [block("R-02", "Hero가 첫 본문이 아닙니다", "Hero를 Header 바로 아래로 옮기세요", hero.i)] : []),
  ];
}

/** R-03·R-04 — 목적이 정해졌을 때만. "정하지 않음"이면 정보 한 줄 */
function purposeIssues(sections: readonly PlannedSection[], purpose: LintInput["purpose"]): LintIssue[] {
  if (purpose === "none") return [issueOf("R-03", "info", PURPOSE_INFO)];
  if (purpose === "booking" && !sections.some(isReservation)) {
    return [block("R-04", "목적이 '예약'인데 예약 폼(Contact 예약)이 없습니다", "Footer 앞에 예약 폼을 추가하세요")];
  }
  if (purpose !== "inquiry") return [];
  const last = lastInquiry(sections);
  if (!last) return [block("R-03", "목적이 '문의'인데 문의 섹션(CTA 띠·Contact)이 없습니다", "Footer 앞에 CTA 띠를 추가하세요")];
  return last.late ? [] : [block("R-03", "문의 섹션이 본문 후반 1/3에 없습니다", "문의 섹션을 Footer 가까이 옮기거나 Footer 앞에 CTA 띠를 추가하세요", last.index)];
}

/** R-07 — 배정 규칙상 0이어야 한다(회귀 방지) */
function motionIssues(sections: readonly PlannedSection[]): LintIssue[] {
  const l2 = sections.filter((s) => s.motion === "L2").length;
  return l2 > 3 ? [block("R-07", `모션 L2 섹션이 ${l2}개입니다 — 3개까지입니다`, "Hero와 앞 본문 2개 밖의 섹션은 L1로 낮추세요")] : [];
}

const ROLES: readonly PaletteRole[] = ["primary", "surface", "ink", "muted", "bg"];

/** R-08 — 프로필 대비 검사(3.3, 대비 조정 목표)에서 남은 미달 수 */
function contrastIssues(profile: DesignProfileInput, contrast: ContrastLevel): LintIssue[] {
  const palette: PaletteEntry[] = ROLES.map((role) => ({ role, hex: profile.color_tokens[role].$value }));
  const failing = checkProfileContrast(palette, profile.component_choices.card_style?.surfaceTone, contrast).filter((c) => !c.pass).length;
  return failing > 0 ? [issueOf("R-08", "block", `대비 미달 ${failing} — 프로필에서 보정`)] : [];
}

/** R-12 — 사업자정보 없는 Footer, 또는 라이브러리에서 찾을 수 없어 확인할 수 없는 Footer */
function footerIssues(sections: readonly PlannedSection[], library: SectionLibrary): LintIssue[] {
  return sections.flatMap((s, i) => {
    if (s.type !== "footer") return [];
    const def = resolveVariant(library, "footer", s.variant)?.def;
    if (!def) return [block("R-12", `라이브러리 ${library.version}에 Footer '${s.variant}'가 없어 사업자정보를 확인할 수 없습니다`, "사업자정보가 있는 Footer 변형으로 바꾸세요", i)];
    return def.hasBusinessInfo === false ? [block("R-12", `Footer '${def.label}'에 사업자정보가 없습니다`, "사업자정보가 있는 Footer 변형으로 바꾸세요", i)] : [];
  });
}

export function lintPlan(sections: readonly PlannedSection[], input: LintInput): readonly LintIssue[] {
  const issues = [
    ...structureIssues(sections),
    ...purposeIssues(sections, input.purpose),
    ...motionIssues(sections),
    ...contrastIssues(input.profile, input.contrast),
    ...footerIssues(sections, input.library),
  ];
  return Object.freeze(issues.map((issue) => Object.freeze(issue)));
}
