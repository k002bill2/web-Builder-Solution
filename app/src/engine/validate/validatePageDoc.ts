/**
 * 저장 경계용 문서 검증 — 모양만 본다(SPEC 8.2 경계 검증). 게이트 몫(상한 초과·필수 빈 값·본문 개수)은 통과시킨다.
 * 통과하면 아는 필드만 담아 새로 만든 동결 사본을 돌려준다(입력 객체를 그대로 넘기지 않는다).
 */
import type { ImageSlotValue, ImageSource, PageDoc, SectionInstance, SlotValue } from "../contracts/pageDoc";
import { SECTION_TYPES } from "../contracts/pageDoc";
import type { SlotSchemaEntry } from "../contracts/sectionDefinition";
import { deepFreeze } from "../freeze";
import { getSectionDefinition } from "../sections/registry";
import { POLLUTION_KEYS, createReader, finish, readBool, readInt, readOneOf, readString, type Reader, type ValidationResult } from "./reader";

/** 모양 상한 — 슬롯 maxLength(R-13, 게이트)와 별개인 저장 상한 */
export const LIMITS = Object.freeze({ text: 2000, sections: 32, id: 64, version: 32 });

/** 외부 참조가 될 수 없는 id(슬래시·점·콜론 없음) — 이미지 출처·instanceId */
const STRICT_ID = /^[A-Za-z0-9_-]+$/;
/** 프로젝트·안 id — 공백·슬래시 없음 */
const LOOSE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const VERSION = /^[A-Za-z0-9._-]+$/;
const HASH = /^[A-Za-z0-9:]*$/;
const ISO_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-](\d{2}):(\d{2}))$/;

/** 모양 + 실제 달력·시각 값(월 1~12, 그 달의 날짜, 시 <24, 분·초 <60, 오프셋 시 <24) */
function isIsoTime(value: string): boolean {
  const m = ISO_TIME.exec(value);
  if (!m) return false;
  const [year, month, day, hour, minute, second = 0, offH = 0, offM = 0] = m.slice(1).map((v) => (v === undefined ? undefined : Number(v)));
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  const dayValid = date.getUTCFullYear() === year && date.getUTCMonth() === month! - 1 && date.getUTCDate() === day;
  return dayValid && hour! < 24 && minute! < 60 && second < 60 && offH < 24 && offM < 60;
}

const DOC_KEYS = ["projectId", "revision", "hash", "profileVersion", "candidateId", "libraryVersion", "generatorVersion", "meta", "sections", "updatedAt"];
const SECTION_KEYS = ["instanceId", "type", "variant", "motion", "tone", "slots"];
const IMAGE_KEYS = ["kind", "enabled", "source", "alt", "decorative"];

const text = (r: Reader, value: unknown, path: string) => readString(r, value, path, { max: LIMITS.text });
const strictId = (r: Reader, value: unknown, path: string) => readString(r, value, path, { min: 1, max: LIMITS.id, pattern: STRICT_ID });

function readTime(r: Reader, value: unknown, path: string): string | undefined {
  const time = readString(r, value, path, { min: 1, max: 40 });
  if (time !== undefined && !isIsoTime(time)) r.add(path, "ISO 8601 시각이어야 합니다");
  return time;
}

function readSource(r: Reader, value: unknown, path: string): ImageSource | undefined {
  const rec = r.map(value, path);
  const kind = rec && readOneOf(r, r.field(rec, "kind", path), `${path}.kind`, ["placeholder", "local"] as const);
  if (!rec || !kind) return undefined;
  const idKey = kind === "placeholder" ? "patternId" : "assetId";
  r.extra(rec, path, ["kind", idKey]);
  const id = strictId(r, r.field(rec, idKey, path), `${path}.${idKey}`);
  if (id === undefined) return undefined;
  return kind === "placeholder" ? { kind, patternId: id } : { kind, assetId: id };
}

function readImage(r: Reader, value: unknown, path: string): ImageSlotValue | undefined {
  const rec = r.record(value, path, IMAGE_KEYS);
  if (!rec) return undefined;
  const get = (key: string) => r.field(rec, key, path);
  readOneOf(r, get("kind"), `${path}.kind`, ["image"] as const);
  const enabled = readBool(r, get("enabled"), `${path}.enabled`);
  const source = readSource(r, get("source"), `${path}.source`);
  const alt = text(r, get("alt"), `${path}.alt`);
  const decorative = readBool(r, get("decorative"), `${path}.decorative`);
  return { kind: "image", enabled: enabled!, source: source!, alt: alt!, decorative: decorative! };
}

function readSlots(r: Reader, value: unknown, path: string, schema: readonly SlotSchemaEntry[] | undefined) {
  const rec = r.map(value, path);
  if (!rec || !schema) return {};
  const out: Record<string, SlotValue | undefined> = {};
  for (const key of Object.keys(rec)) {
    const entry = schema.find((s) => s.key === key);
    const at = `${path}.${key}`;
    if (!entry) {
      if (!POLLUTION_KEYS.has(key)) r.add(at, "스키마에 없는 슬롯입니다");
      continue;
    }
    out[key] = entry.kind === "image" ? readImage(r, rec[key], at) : text(r, rec[key], at);
  }
  return out as Record<string, SlotValue>;
}

function readSection(r: Reader, value: unknown, path: string, seen: ReadonlySet<string>): SectionInstance | undefined {
  const rec = r.record(value, path, SECTION_KEYS);
  if (!rec) return undefined;
  const get = (key: string) => r.field(rec, key, path);
  const instanceId = strictId(r, get("instanceId"), `${path}.instanceId`);
  if (instanceId !== undefined && seen.has(instanceId)) r.add(`${path}.instanceId`, "instanceId가 겹칩니다");
  const type = readOneOf(r, get("type"), `${path}.type`, SECTION_TYPES);
  const variant = readString(r, get("variant"), `${path}.variant`, { min: 1, max: LIMITS.id });
  const def = type && variant !== undefined ? getSectionDefinition(type, variant) : undefined;
  if (type && variant !== undefined && !def) r.add(`${path}.variant`, "모르는 변형입니다");
  const motion = readOneOf(r, get("motion"), `${path}.motion`, ["L0", "L1", "L2"] as const);
  const tone = readOneOf(r, get("tone"), `${path}.tone`, ["base", "alt"] as const);
  const slots = readSlots(r, get("slots"), `${path}.slots`, def?.slots);
  return { instanceId: instanceId!, type: type!, variant: variant!, motion: motion!, tone: tone!, slots };
}

function readSections(r: Reader, value: unknown, path: string): SectionInstance[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > LIMITS.sections) {
    r.add(path, `섹션 배열(최대 ${LIMITS.sections}개)이어야 합니다`);
    return [];
  }
  const seen = new Set<string>();
  // Array.from은 구멍(sparse)을 undefined로 채운다 → 객체 아님으로 거부(map은 구멍을 건너뛴다)
  return Array.from(value, (item: unknown, i) => {
    const section = readSection(r, item, `${path}[${i}]`, seen);
    if (section?.instanceId !== undefined) seen.add(section.instanceId);
    return section!;
  });
}

export function validatePageDoc(input: unknown): ValidationResult<PageDoc> {
  const r = createReader();
  const rec = r.record(input, "$", DOC_KEYS);
  if (!rec) return finish(r, () => input as PageDoc);
  const get = (key: string) => r.field(rec, key, "$");
  const metaRec = r.record(get("meta"), "$.meta", ["title", "description"]);
  const doc = {
    projectId: readString(r, get("projectId"), "$.projectId", { min: 1, max: LIMITS.id, pattern: LOOSE_ID }),
    revision: readInt(r, get("revision"), "$.revision", 0),
    hash: readString(r, get("hash"), "$.hash", { max: 80, pattern: HASH }),
    profileVersion: readInt(r, get("profileVersion"), "$.profileVersion", 1),
    candidateId: readString(r, get("candidateId"), "$.candidateId", { min: 1, max: LIMITS.id, pattern: LOOSE_ID }),
    libraryVersion: readString(r, get("libraryVersion"), "$.libraryVersion", { min: 1, max: LIMITS.version, pattern: VERSION }),
    generatorVersion: readString(r, get("generatorVersion"), "$.generatorVersion", { min: 1, max: LIMITS.version, pattern: VERSION }),
    meta: metaRec && {
      title: text(r, r.field(metaRec, "title", "$.meta"), "$.meta.title"),
      description: text(r, r.field(metaRec, "description", "$.meta"), "$.meta.description"),
    },
    sections: readSections(r, get("sections"), "$.sections"),
    updatedAt: readTime(r, get("updatedAt"), "$.updatedAt"),
  };
  return finish(r, () => deepFreeze(doc as PageDoc));
}
