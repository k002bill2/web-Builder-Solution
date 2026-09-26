/**
 * 슬롯 기반 두 줄 — 대체텍스트(R-09)와 글자 수(R-13 상한·필수 빈 값 + FR-EDT-05 권장 경고).
 * 순회는 문서 섹션 순서 → 섹션 정의의 슬롯 스키마 순서(값 객체의 키 순서와 무관 — 결정성). 없는 키 = 빈 값.
 * 모르는 변형 섹션은 건너뛴다(필수 섹션 줄이 차단한다).
 */
import type { ImageSlotValue, PageDoc, SectionInstance, SlotValue } from "../contracts/pageDoc";
import type { GateIssue } from "../contracts/records";
import type { SlotSchemaEntry } from "../contracts/sectionDefinition";
import { SECTION_TYPE_INFO, getSectionDefinition } from "../sections/registry";
import { GATE_TEXT, overMax, overRecommended, recommendedNote } from "./gateText";
import { charCount, isBlank, issue } from "./issue";

export interface SlotRowIssues {
  readonly altText: readonly GateIssue[];
  readonly textLength: readonly GateIssue[];
}

const isImage = (value: SlotValue | undefined): value is ImageSlotValue =>
  typeof value === "object" && value !== null && (value as { kind?: unknown }).kind === "image";

interface SlotContext {
  readonly section: SectionInstance;
  readonly entry: SlotSchemaEntry;
  /** "Hero 제목" — 섹션 이름 + 슬롯 이름표 */
  readonly where: string;
}

const at = ({ section, entry }: SlotContext) => ({ instanceId: section.instanceId, slotKey: entry.key });

function overMaxIssue(ctx: SlotContext, length: number): GateIssue {
  return issue("R-13", "block", `${ctx.where}: ${overMax(ctx.entry.maxLength, length)}`, GATE_TEXT.shortenTo(ctx.entry.maxLength), at(ctx));
}

/** 켜진 · 장식 아닌 이미지만 본다(B-18: 끄면 검사에서 빠진다) */
function imageIssues(ctx: SlotContext, value: SlotValue | undefined): SlotRowIssues {
  if (!isImage(value) || value.enabled !== true || value.decorative === true) return { altText: [], textLength: [] };
  const alt = typeof value.alt === "string" ? value.alt : "";
  if (isBlank(alt)) return { altText: [issue("R-09", "block", `${ctx.where}: ${GATE_TEXT.altMissing}`, GATE_TEXT.altAlternative, at(ctx))], textLength: [] };
  const length = charCount(alt);
  return { altText: [], textLength: length > ctx.entry.maxLength ? [overMaxIssue(ctx, length)] : [] };
}

function textIssues(ctx: SlotContext, value: SlotValue | undefined, sectionName: string): readonly GateIssue[] {
  const text = typeof value === "string" ? value : "";
  const { entry } = ctx;
  if (entry.required && isBlank(text)) return [issue("R-13", "block", `${ctx.where}: ${GATE_TEXT.requiredEmpty}`, GATE_TEXT.requiredAlternative, at(ctx))];
  const length = charCount(text);
  if (length > entry.maxLength) return [overMaxIssue(ctx, length)];
  const recommended = entry.recommendedLength;
  if (recommended !== undefined && length > recommended) {
    return [issue("FR-EDT-05", "warn", `${sectionName} ${overRecommended(entry.label, length, recommended)}`, recommendedNote(recommended), at(ctx))];
  }
  return [];
}

function sectionIssues(section: SectionInstance): SlotRowIssues {
  const def = getSectionDefinition(section.type, section.variant);
  if (!def) return { altText: [], textLength: [] };
  const name = SECTION_TYPE_INFO[def.type].name;
  const perSlot = def.slots.map((entry) => {
    const ctx: SlotContext = { section, entry, where: `${name} ${entry.label}` };
    const value = Object.hasOwn(section.slots, entry.key) ? section.slots[entry.key] : undefined;
    return entry.kind === "image" ? imageIssues(ctx, value) : { altText: [], textLength: textIssues(ctx, value, name) };
  });
  return { altText: perSlot.flatMap((p) => p.altText), textLength: perSlot.flatMap((p) => p.textLength) };
}

export function slotRowIssues(doc: PageDoc): SlotRowIssues {
  const perSection = doc.sections.map(sectionIssues);
  return { altText: perSection.flatMap((p) => p.altText), textLength: perSection.flatMap((p) => p.textLength) };
}
