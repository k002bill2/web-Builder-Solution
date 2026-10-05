import { addSection, moveSection, removeSection, swapVariant } from "../../engine/ops/sectionOps";
import { normalizeDoc } from "../../engine/ops/normalize";
import { ids, sampleDoc, section, withSections } from "../../engine/testing/sampleDoc";
import { applyDocOp, createInstanceIds, type OpContext } from "./docOps";
import * as engine from "./docEngine";
import { runDocOp } from "./docEngine";

const doc = sampleDoc();
const ctx = (over: Partial<OpContext> = {}): OpContext => ({ purpose: "none", motionPreset: "L2", nextInstanceId: () => "s-new-1", ...over });

describe("docOps 연산 어댑터 (K2 · 8.2)", () => {
  it("move: 엔진 moveSection + normalizeDoc, 새 자리", () => {
    const result = runDocOp(engine, doc, { kind: "move", instanceId: "s-faq", direction: "up" }, ctx());
    expect(result.doc).toEqual(normalizeDoc(moveSection(doc, "s-faq", "up").doc));
    expect(result).toMatchObject({ instanceId: "s-faq", index: 3, lostSlotKeys: [] });
  });

  it("remove: 목적을 넘긴다 — 예약 목적의 유일한 예약 Contact는 거부", () => {
    const booking = withSections(doc, doc.sections.map((s) => (s.type === "contact" ? section("contact", "booking", "s-contact") : s)));
    expect(() => runDocOp(engine, booking, { kind: "remove", instanceId: "s-contact" }, ctx({ purpose: "booking" }))).toThrow(
      expect.objectContaining({ code: "NOT_ALLOWED" }),
    );
    const result = runDocOp(engine, booking, { kind: "remove", instanceId: "s-contact" }, ctx());
    expect(result.doc).toEqual(normalizeDoc(removeSection(booking, "s-contact", "none").doc));
    expect(result).toMatchObject({ instanceId: "s-contact", index: 5 });
  });

  it("add: 5인자 {instanceId(주입), motionPreset} · 선택 뒤 자리 · normalizeDoc", () => {
    const result = runDocOp(engine, doc, { kind: "add", type: "faq", variant: "accordion", afterInstanceId: "s-about" }, ctx({ nextInstanceId: () => "s-new-7", motionPreset: "L0" }));
    const expected = addSection(doc, "faq", "accordion", "s-about", { instanceId: "s-new-7", motionPreset: "L0" });
    expect(result.doc).toEqual(normalizeDoc(expected.doc));
    expect(result).toMatchObject({ instanceId: "s-new-7", index: 3 });
    expect(result.doc.sections[3]?.motion).toBe("L0");
  });

  it("swap: 잃은 슬롯 키 · 목적 전달", () => {
    const result = runDocOp(engine, doc, { kind: "swap", instanceId: "s-services", variant: "list" }, ctx());
    const expected = swapVariant(doc, "s-services", "list", "none");
    expect(result.doc).toEqual(normalizeDoc(expected.doc));
    expect(result.lostSlotKeys).toEqual(expected.lostSlotKeys);
    expect(result).toMatchObject({ instanceId: "s-services", index: 3 });
  });

  it("applyDocOp: 엔진 청크를 동적 import해 같은 결과", async () => {
    const op = { kind: "move", instanceId: "s-faq", direction: "down" } as const;
    expect(await applyDocOp(doc, op, ctx())).toEqual(runDocOp(engine, doc, op, ctx()));
  });

  it("applyDocOp: 엔진이 거부하면 같은 오류로 reject — useSectionOps가 그 문장을 알린다", async () => {
    const booking = withSections(doc, doc.sections.map((s) => (s.type === "contact" ? section("contact", "booking", "s-contact") : s)));
    await expect(applyDocOp(booking, { kind: "remove", instanceId: "s-contact" }, ctx({ purpose: "booking" }))).rejects.toMatchObject({ code: "NOT_ALLOWED" });
  });

  it("연산 본문(runDocOp)은 조작 뒤 청크(docEngine)에만 — docOps는 내보내지 않는다(/studio 진입 예산, M2C-3S)", async () => {
    expect(Object.keys(await import("./docOps"))).not.toContain("runDocOp");
    expect(typeof (engine as Record<string, unknown>).runDocOp).toBe("function");
  });
});

describe("instanceId 카운터 (K2)", () => {
  it("마운트 단위 단조 증가 · 문서에 있는 id는 건너뛴다", () => {
    const next = createInstanceIds("s-new");
    const taken = withSections(doc, [...doc.sections.slice(0, -1), section("faq", "accordion", "s-new-2"), doc.sections.at(-1)!]);
    expect(next(doc)).toBe("s-new-1");
    expect(next(taken)).toBe("s-new-3");
    expect(next(doc)).toBe("s-new-4");
    expect(ids(doc)).not.toContain("s-new-4");
  });
});
