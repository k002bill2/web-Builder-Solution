import type { PageDoc } from "../../engine/contracts/pageDoc";
import { runGate } from "../../engine/gate/runGate";
import { diffSlotValues, diffSlots } from "../../engine/ops/diff";
import { hashDoc } from "../../engine/ops/hash";
import { normalizeDoc } from "../../engine/ops/normalize";
import { canAdd, canMove, canRemove, canSwapVariant } from "../../engine/ops/rules";
import { setMeta, setSlot, swapTheme } from "../../engine/ops/slotOps";
import { getSectionDefinition } from "../../engine/sections/registry";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { sampleTheme } from "../../engine/testing/sampleTheme";
import { createInstanceIds, runDocOp, type DocOp } from "./docOps";
import * as engine from "./docEngine";

/**
 * K7 엔진 불변 (E-AC-23) — 동결한 입력 문서로 8.2 연산 전부를 편집기 경로(docOps 어댑터 포함)로 실행:
 * 예외 0 · 입력 불변(깊은 비교 + 동결 유지) · instanceId 유지. engine/ 쓰기 금지 레인이라 편집기 쪽에 둔다.
 */
const clone = (doc: PageDoc): PageDoc => JSON.parse(JSON.stringify(doc)) as PageDoc;
const ids = (doc: PageDoc) => doc.sections.map((s) => s.instanceId);

describe("엔진 연산 불변 (E-AC-23)", () => {
  it("구조 연산 4종(docOps) + 슬롯·메타·테마·비교·게이트·보정·해시·가능 여부 — 예외 0 · 입력 불변 · instanceId 유지", () => {
    const input = sampleDoc();
    const before = clone(input);
    expect(Object.isFrozen(input.sections[1]!.slots)).toBe(true);
    const ctx = { purpose: "inquiry" as const, motionPreset: "L2" as const, nextInstanceId: createInstanceIds("s-inv") };
    const ops: readonly DocOp[] = [
      { kind: "move", instanceId: "s-faq", direction: "up" },
      { kind: "move", instanceId: "s-about", direction: "down" },
      { kind: "remove", instanceId: "s-services" },
      { kind: "add", type: "pricing", variant: "tiers-2", afterInstanceId: "s-about" },
      { kind: "add", type: "faq", variant: "accordion", afterInstanceId: null },
      { kind: "swap", instanceId: "s-services", variant: "list" },
      { kind: "swap", instanceId: "s-hero", variant: "split" },
    ];
    const results = ops.map((op) => runDocOp(engine, input, op, ctx));
    for (const result of results) {
      const kept = ids(input).filter((id) => ids(result.doc).includes(id));
      expect(kept).toEqual(ids(input).filter((id) => id !== "s-services" || result.doc.sections.some((s) => s.instanceId === id)));
      expect(result.doc.sections.find((s) => s.instanceId === "s-hero")?.instanceId).toBe("s-hero");
    }
    const hero = input.sections[1]!;
    const others = [
      setSlot(input, "s-hero", "title", "바뀐 제목"),
      setMeta(input, "title", "바뀐 페이지 제목"),
      swapTheme(input, 5),
      normalizeDoc(input),
    ];
    diffSlots(getSectionDefinition("hero", "fullbleed-left")!.slots, getSectionDefinition("hero", "center")!.slots);
    diffSlotValues(input, others[0]!);
    runGate(input, sampleTheme());
    hashDoc(input);
    canAdd(input);
    canAdd(input, "faq");
    canMove(input, "s-faq", "up");
    canRemove(input, "s-contact", "inquiry");
    canSwapVariant(input, "s-contact", "booking", "booking");
    expect(others.every((doc) => ids(doc).join() === ids(input).join())).toBe(true);
    expect(input).toEqual(before);
    expect(input.sections[1]).toBe(hero);
    expect(Object.isFrozen(input.sections[1]!.slots)).toBe(true);
  });
});
