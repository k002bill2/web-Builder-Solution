import type { ImageSlotValue } from "../contracts/pageDoc";
import { getSectionDefinition } from "../sections/registry";
import { ids, sampleDoc, section, withSections } from "../testing/sampleDoc";
import { diffSlotValues, diffSlots } from "./diff";
import { hashDoc } from "./hash";
import { normalizeDoc } from "./normalize";
import { parseLocalImageId } from "../validate/localImageId";
import { setMeta, setSlot, swapTheme } from "./slotOps";

const doc = sampleDoc();
const hero = (d: typeof doc) => d.sections.find((s) => s.instanceId === "s-hero")!;
const LOCAL: ImageSlotValue = { kind: "image", enabled: true, source: parseLocalImageId("7c9e6679-7425-40de-944b-e07fc1f90ae7")!, alt: "매장 사진", decorative: false };

describe("setSlot · setMeta (5.6 · 5.9)", () => {
  it("슬롯 값을 바꾼 새 문서 · 다른 섹션은 같은 참조", () => {
    const next = setSlot(doc, "s-hero", "title", "새 제목");
    expect(hero(next).slots.title).toBe("새 제목");
    expect(hero(doc).slots.title).not.toBe("새 제목");
    expect(next.sections[2]).toBe(doc.sections[2]);
    expect(setSlot(doc, "s-hero", "image", LOCAL).sections[1]?.slots.image).toEqual(LOCAL);
  });

  it("상한 초과·빈 값도 막지 않는다 (R-13은 게이트)", () => {
    expect(hero(setSlot(doc, "s-hero", "title", "가".repeat(100))).slots.title).toHaveLength(100);
    expect(hero(setSlot(doc, "s-hero", "title", "")).slots.title).toBe("");
  });

  it("스키마 밖 키 · 종류 불일치 · 없는 id는 오류", () => {
    expect(() => setSlot(doc, "s-hero", "badge", "x")).toThrow(expect.objectContaining({ code: "UNKNOWN_SLOT" }));
    expect(() => setSlot(doc, "s-hero", "title", LOCAL)).toThrow(expect.objectContaining({ code: "SLOT_KIND" }));
    expect(() => setSlot(doc, "s-hero", "image", "그림")).toThrow(expect.objectContaining({ code: "SLOT_KIND" }));
    expect(() => setSlot(doc, "nope", "title", "x")).toThrow(expect.objectContaining({ code: "NOT_FOUND" }));
  });

  it("setMeta는 메타 한 필드만 바꾼다", () => {
    const next = setMeta(doc, "description", "새 설명");
    expect(next.meta).toEqual({ title: doc.meta.title, description: "새 설명" });
    expect(next.sections).toBe(doc.sections);
  });
});

describe("swapTheme (5.8)", () => {
  it("프로필 버전만 바뀌고 슬롯 값은 모두 그대로(diffSlotValues 0건)", () => {
    const next = swapTheme(doc, 4);
    expect(next.profileVersion).toBe(4);
    expect(next.sections).toBe(doc.sections);
    const diff = diffSlotValues(doc, next);
    expect(diff.changed).toEqual([]);
    expect(diff.compared).toBe(doc.sections.reduce((n, s) => n + Object.keys(s.slots).length, 0));
  });

  it("정수 1 이상이 아니면 오류", () => {
    expect(() => swapTheme(doc, 0)).toThrow(expect.objectContaining({ code: "BAD_VALUE" }));
    expect(() => swapTheme(doc, 1.5)).toThrow(expect.objectContaining({ code: "BAD_VALUE" }));
  });
});

describe("diffSlots · diffSlotValues", () => {
  it("diffSlots: 같은 키·같은 종류 = 유지, 아니면 잃음, B에만 = 추가", () => {
    const a = getSectionDefinition("hero", "fullbleed-left")!.slots;
    const b = getSectionDefinition("hero", "center")!.slots;
    const diff = diffSlots(a, b);
    expect(diff.kept.map((e) => e.key)).toEqual(["title", "subtitle", "cta"]);
    expect(diff.lost.map((e) => [e.key, e.label])).toEqual([["image", "대표 이미지"]]);
    expect(diffSlots(b, a).added.map((e) => e.key)).toEqual(["image"]);
    const kindChanged = [{ ...a[0]!, kind: "long-text" as const }];
    expect(diffSlots([a[0]!], kindChanged).lost.map((e) => e.key)).toEqual(["title"]);
  });

  it("diffSlotValues: 달라진 값 위치(instanceId·key)와 전후 값", () => {
    const next = setSlot(setSlot(doc, "s-hero", "title", "바뀐 제목"), "s-hero", "image", LOCAL);
    const diff = diffSlotValues(doc, next);
    expect(diff.changed.map((c) => [c.instanceId, c.key])).toEqual([
      ["s-hero", "title"],
      ["s-hero", "image"],
    ]);
    expect(diff.changed[0]).toMatchObject({ before: hero(doc).slots.title, after: "바뀐 제목" });
  });

  it("diffSlotValues: 한쪽에만 있는 섹션의 슬롯은 모두 달라진 값", () => {
    const removed = withSections(doc, doc.sections.filter((s) => s.instanceId !== "s-cta"));
    const diff = diffSlotValues(doc, removed);
    expect(new Set(diff.changed.map((c) => c.instanceId))).toEqual(new Set(["s-cta"]));
    expect(diff.changed.every((c) => c.after === undefined)).toBe(true);
  });
});

describe("normalizeDoc (R-05 인접 톤)", () => {
  const sameTone = withSections(doc, doc.sections.map((s) => ({ ...s, tone: "base" as const })));

  it("인접 섹션 톤이 같지 않게 보정한다", () => {
    const tones = normalizeDoc(sameTone).sections.map((s) => s.tone);
    tones.slice(1).forEach((tone, i) => expect(tone).not.toBe(tones[i]));
  });

  it("멱등 — 두 번 = 한 번(해시)", () => {
    const once = normalizeDoc(sameTone);
    expect(hashDoc(normalizeDoc(once))).toBe(hashDoc(once));
  });

  it("슬롯 값·instanceId·순서는 그대로", () => {
    const normalized = normalizeDoc(sameTone);
    expect(diffSlotValues(sameTone, normalized).changed).toEqual([]);
    expect(ids(normalized)).toEqual(ids(sameTone));
  });

  it("이미 맞는 문서는 그대로 돌려준다", () => {
    expect(normalizeDoc(doc)).toBe(doc);
  });

  it("충돌 지점만 바꾼다", () => {
    const d = withSections(doc, [section("header", "transparent", "a"), section("hero", "split", "b", { tone: "alt" }), section("about", "text", "c", { tone: "alt" })]);
    expect(normalizeDoc(d).sections.map((s) => s.tone)).toEqual(["base", "alt", "base"]);
  });
});
