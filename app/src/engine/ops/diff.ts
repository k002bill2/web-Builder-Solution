/**
 * 슬롯 비교 (SPEC 8.2 `diffSlots` · `diffSlotValues`) — 변형 교체 캡션(5.5)과 테마 바꾸기 검증(5.8).
 */
import type { PageDoc, SectionInstance, SlotValue } from "../contracts/pageDoc";
import type { SlotSchema, SlotSchemaEntry } from "../contracts/sectionDefinition";
import { canonicalJson } from "./hash";

export interface SlotSchemaDiff {
  /** A에도 B에도 같은 키·같은 종류 (A 순서) */
  readonly kept: readonly SlotSchemaEntry[];
  /** A에만 있거나 종류가 달라진 슬롯 (A 순서) — 값을 잃는다 */
  readonly lost: readonly SlotSchemaEntry[];
  /** B에만 있는 슬롯 (B 순서) — 기본 값으로 채운다 */
  readonly added: readonly SlotSchemaEntry[];
}

export function diffSlots(a: SlotSchema, b: SlotSchema): SlotSchemaDiff {
  const same = (x: SlotSchemaEntry, y: SlotSchemaEntry) => x.key === y.key && x.kind === y.kind;
  return {
    kept: a.filter((x) => b.some((y) => same(x, y))),
    lost: a.filter((x) => !b.some((y) => same(x, y))),
    added: b.filter((y) => !a.some((x) => same(x, y))),
  };
}

export interface SlotValueChange {
  readonly instanceId: string;
  readonly key: string;
  /** 없던 값은 undefined */
  readonly before: SlotValue | undefined;
  readonly after: SlotValue | undefined;
}

export interface SlotValuesDiff {
  /** 비교한 슬롯 값 개수("슬롯 값 23개 모두 그대로입니다") */
  readonly compared: number;
  readonly changed: readonly SlotValueChange[];
}

function compareSection(instanceId: string, a: SectionInstance["slots"], b: SectionInstance["slots"]) {
  const keys = [...Object.keys(a), ...Object.keys(b).filter((k) => !Object.hasOwn(a, k))];
  const changed = keys
    .filter((key) => canonicalJson(a[key]) !== canonicalJson(b[key]))
    .map((key) => ({ instanceId, key, before: a[key], after: b[key] }));
  return { compared: keys.length, changed };
}

/** instanceId로 섹션을 맞춰 슬롯 값을 비교한다. 한쪽에만 있는 섹션의 값은 모두 달라진 값이다 */
export function diffSlotValues(a: PageDoc, b: PageDoc): SlotValuesDiff {
  const EMPTY = {};
  const inA = new Set(a.sections.map((s) => s.instanceId));
  const pairs = [
    ...a.sections.map((s) => compareSection(s.instanceId, s.slots, b.sections.find((t) => t.instanceId === s.instanceId)?.slots ?? EMPTY)),
    ...b.sections.filter((t) => !inA.has(t.instanceId)).map((t) => compareSection(t.instanceId, EMPTY, t.slots)),
  ];
  return {
    compared: pairs.reduce((n, p) => n + p.compared, 0),
    changed: pairs.flatMap((p) => p.changed),
  };
}
