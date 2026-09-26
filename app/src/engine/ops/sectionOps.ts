/**
 * 섹션 구조 연산 (SPEC 8.2) — 모두 순수: 입력 문서를 바꾸지 않고 새 문서를 돌려준다. instanceId는 연산을 지나도 그대로다.
 * 막힌 조작은 rules.ts의 같은 규칙으로 EngineOpError를 던진다. R-05 톤 보정은 부르는 쪽이 normalizeDoc으로 한다(연산 뒤 공통).
 */
import type { MotionPreset } from "../../domain/compareBoard";
import type { PageDoc, SectionInstance, SectionMotion, SectionType } from "../contracts/pageDoc";
import type { SectionDefinition } from "../contracts/sectionDefinition";
import { defaultSlotValue, defaultSlots } from "../sections/defaults";
import { getSectionDefinition } from "../sections/registry";
import { diffSlots } from "./diff";
import { EngineOpError, INSTANCE_ID, indexOfSection, sectionAt } from "./errors";
import { canAdd, canMove, canRemove, canSwapVariant, type MoveDirection, type Permission, type Purpose } from "./rules";

const MOTION_ORDER: readonly SectionMotion[] = ["L0", "L1", "L2"];
const minMotion = (...motions: SectionMotion[]): SectionMotion =>
  MOTION_ORDER[Math.min(...motions.map((m) => MOTION_ORDER.indexOf(m)))]!;

function assertAllowed(permission: Permission): void {
  if (!permission.ok) throw new EngineOpError("NOT_ALLOWED", permission.reason);
}

function definitionOf(type: SectionType, variant: string): SectionDefinition {
  const def = getSectionDefinition(type, variant);
  if (!def) throw new EngineOpError("UNKNOWN_VARIANT", `변형 없음: ${type}/${variant}`);
  return def;
}

function assertNewId(doc: PageDoc, instanceId: string): void {
  if (!INSTANCE_ID.test(instanceId) || doc.sections.some((s) => s.instanceId === instanceId)) {
    throw new EngineOpError("BAD_ID", `쓸 수 없는 instanceId: ${instanceId}`);
  }
}

const insertAt = (list: readonly SectionInstance[], index: number, item: SectionInstance) => [...list.slice(0, index), item, ...list.slice(index)];
const withSections = (doc: PageDoc, sections: readonly SectionInstance[]): PageDoc => ({ ...doc, sections });

/** 넣는 자리(5.3): 선택 바로 뒤. 선택이 Header·"페이지 정보"(null)면 Hero 뒤, Footer면 Footer 앞 */
function insertIndex(doc: PageDoc, type: SectionType, afterInstanceId: string | null): number {
  const { sections } = doc;
  if (type === "header") return 0;
  if (type === "footer") return sections.length;
  const afterIndex = afterInstanceId === null ? -1 : indexOfSection(doc, afterInstanceId);
  const after = sections[afterIndex];
  if (after?.type === "footer") return afterIndex;
  if (after && after.type !== "header" && type !== "hero") return afterIndex + 1;
  const heroIndex = sections.findIndex((s) => s.type === "hero");
  const anchor = type !== "hero" && heroIndex >= 0 ? heroIndex : sections.findIndex((s) => s.type === "header");
  return anchor + 1;
}

export interface AddSectionOptions {
  /** 새 instanceId — 부르는 쪽이 정한다(카운터·seed 주입, 결정성) */
  readonly instanceId: string;
  /** 문서 모션 프리셋(프로필) — 새 섹션 모션 = min(프리셋, L1, 정의 상한) */
  readonly motionPreset: MotionPreset;
}

export function addSection(doc: PageDoc, type: SectionType, variant: string, afterInstanceId: string | null, opts: AddSectionOptions) {
  assertAllowed(canAdd(doc, type));
  const def = definitionOf(type, variant);
  assertNewId(doc, opts.instanceId);
  const index = insertIndex(doc, type, afterInstanceId);
  const section: SectionInstance = {
    instanceId: opts.instanceId,
    type,
    variant,
    motion: minMotion(opts.motionPreset, "L1", def.constraints.maxMotion),
    tone: "base",
    slots: defaultSlots(def),
  };
  return { doc: withSections(doc, insertAt(doc.sections, index, section)), instanceId: opts.instanceId, index };
}

/** 되돌리기 정보(5.4) — 지운 섹션과 그 자리 */
export interface RemovedSection {
  readonly section: SectionInstance;
  readonly index: number;
}

const PURPOSES: readonly Purpose[] = ["booking", "inquiry", "sales", "none"];

/** 목적은 필수 인자(기본값 없음) — 목적이 없는 문서는 부르는 쪽이 "none"을 명시한다(구조 규칙만) */
function assertPurpose(purpose: Purpose): void {
  if (!PURPOSES.includes(purpose)) throw new EngineOpError("BAD_VALUE", `모르는 목적: ${String(purpose)}`);
}

/** canRemove 전체 판정(구조 R-01·R-02 + 목적 R-03·R-04)을 강제한다 */
export function removeSection(doc: PageDoc, instanceId: string, purpose: Purpose): { readonly doc: PageDoc; readonly undo: RemovedSection } {
  assertPurpose(purpose);
  assertAllowed(canRemove(doc, instanceId, purpose));
  const index = indexOfSection(doc, instanceId);
  return { doc: withSections(doc, doc.sections.filter((_, i) => i !== index)), undo: { section: doc.sections[index]!, index } };
}

export function restoreSection(doc: PageDoc, undo: RemovedSection): PageDoc {
  assertNewId(doc, undo.section.instanceId);
  return withSections(doc, insertAt(doc.sections, Math.min(undo.index, doc.sections.length), undo.section));
}

export function moveSection(doc: PageDoc, instanceId: string, direction: MoveDirection): { readonly doc: PageDoc; readonly index: number } {
  assertAllowed(canMove(doc, instanceId, direction));
  const from = indexOfSection(doc, instanceId);
  const to = direction === "up" ? from - 1 : from + 1;
  const sections = doc.sections.map((s, i) => (i === from ? doc.sections[to]! : i === to ? doc.sections[from]! : s));
  return { doc: withSections(doc, sections), index: to };
}

/**
 * 같은 키·같은 종류 슬롯 값은 유지, 잃은 키 목록을 돌려준다(5.5 — diffSlots와 같은 판정).
 * 목적 필수 조건은 canSwapVariant로 강제한다(8.2 r3 Q-14) — 검사 순서: 목적 → 없는 id → 모르는 변형 → 목적 판정.
 */
export function swapVariant(doc: PageDoc, instanceId: string, variant: string, purpose: Purpose) {
  assertPurpose(purpose);
  const current = sectionAt(doc, instanceId);
  const from = definitionOf(current.type, current.variant);
  const to = definitionOf(current.type, variant);
  assertAllowed(canSwapVariant(doc, instanceId, variant, purpose));
  const diff = diffSlots(from.slots, to.slots);
  const keptKeys = new Set(diff.kept.map((e) => e.key));
  const slots = Object.fromEntries(
    to.slots.map((entry) => {
      const value = current.slots[entry.key];
      return [entry.key, keptKeys.has(entry.key) && value !== undefined ? value : defaultSlotValue(entry)];
    }),
  );
  const next: SectionInstance = { ...current, variant, motion: minMotion(current.motion, to.constraints.maxMotion), slots };
  return {
    doc: withSections(doc, doc.sections.map((s) => (s.instanceId === instanceId ? next : s))),
    lostSlotKeys: diff.lost.map((e) => e.key),
  };
}
