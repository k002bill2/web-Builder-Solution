/**
 * 문서 단위 세 줄 — 헤딩 순서(R-10) · 모션 예산(R-07) · SEO 메타(R-11, canonical은 2a-05b).
 */
import type { PageDoc, PageMetaField } from "../contracts/pageDoc";
import type { GateIssue } from "../contracts/records";
import { getSectionDefinition } from "../sections/registry";
import { GATE_TEXT, overRecommended } from "./gateText";
import { charCount, isBlank, issue } from "./issue";

/** R-07 L2 섹션 상한 */
export const L2_MAX = 3;
const ALLOWED_MOTION: ReadonlySet<string> = new Set(["L0", "L1", "L2"]);

/**
 * R-10 — 섹션 정의 헤딩 수준(`a11y.headingLevel`, 없으면 건너뜀)을 문서 순서로 잇는다.
 * h1 정확히 1개 · 앞 헤딩보다 2단계 이상 깊어지면 건너뛰기(첫 헤딩의 앞 = 0 → 첫 헤딩은 h1이어야 한다).
 */
export function headingIssues(doc: PageDoc): readonly GateIssue[] {
  const headings = doc.sections.flatMap((section) => {
    const level = getSectionDefinition(section.type, section.variant)?.a11y.headingLevel;
    return level ? [{ instanceId: section.instanceId, level }] : [];
  });
  const noH1 = headings.some((h) => h.level === 1) ? [] : [issue("R-10", "block", GATE_TEXT.headingNoH1, GATE_TEXT.headingAlternative)];
  const perHeading = headings.flatMap(({ instanceId, level }, i) => {
    const previous = i === 0 ? 0 : headings[i - 1]!.level;
    const extraH1 = level === 1 && headings.slice(0, i).some((h) => h.level === 1);
    if (extraH1) return [issue("R-10", "block", GATE_TEXT.headingExtraH1, GATE_TEXT.removeExtraAlternative, { instanceId })];
    return level > previous + 1 ? [issue("R-10", "block", GATE_TEXT.headingSkip(previous, level), GATE_TEXT.headingAlternative, { instanceId })] : [];
  });
  return [...noH1, ...perHeading];
}

/** R-07 — 인스턴스 모션 값 기준(Q-23): L2는 문서 순서 4번째부터 차단 · L0~L2 밖 값(L3)은 1개도 차단 */
export function motionIssues(doc: PageDoc): readonly GateIssue[] {
  return doc.sections.flatMap((section, i) => {
    const { instanceId, motion } = section;
    if (!ALLOWED_MOTION.has(motion)) return [issue("R-07", "block", GATE_TEXT.motionL3, GATE_TEXT.motionAlternative, { instanceId })];
    if (motion !== "L2") return [];
    const nth = doc.sections.slice(0, i + 1).filter((s) => s.motion === "L2").length;
    return nth > L2_MAX ? [issue("R-07", "block", GATE_TEXT.motionL2Over(nth), GATE_TEXT.motionAlternative, { instanceId })] : [];
  });
}

/** SPEC 5.6 — 권장 길이 제목 60자 · 설명 160자(L3 관행 값) */
const SEO_FIELDS: readonly { readonly key: PageMetaField; readonly label: string; readonly recommended: number; readonly empty: string }[] = [
  { key: "title", label: "제목", recommended: 60, empty: GATE_TEXT.seoTitleEmpty },
  { key: "description", label: "설명", recommended: 160, empty: GATE_TEXT.seoDescriptionEmpty },
];

/** R-11 — 빈 값 차단 · 권장 길이 초과 경고. slotKey = 메타 필드 이름("페이지 정보" 필드로 이동) */
export function seoIssues(doc: PageDoc): readonly GateIssue[] {
  return SEO_FIELDS.flatMap(({ key, label, recommended, empty }) => {
    const raw: unknown = doc.meta?.[key];
    const value = typeof raw === "string" ? raw : "";
    if (isBlank(value)) return [issue("R-11", "block", empty, GATE_TEXT.seoAlternative, { slotKey: key })];
    const length = charCount(value);
    return length > recommended ? [issue("R-11", "warn", overRecommended(label, length, recommended), GATE_TEXT.shortenTo(recommended), { slotKey: key })] : [];
  });
}
