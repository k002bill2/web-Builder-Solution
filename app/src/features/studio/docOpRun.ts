import type { PageDoc } from "../../engine/contracts/pageDoc";
import { diffSlotValues } from "../../engine/ops/diff";
import { swapTheme } from "../../engine/ops/slotOps";
import type { DocEngine, DocOp, OpContext, OpResult } from "./docOps";

/** 조작 뒤 청크(docEngine)에만 싣는다 — docOps.applyDocOp가 엔진 청크를 받은 뒤에만 부른다(/studio 진입 예산, M2C-3S) */
const NO_LOSS: readonly string[] = [];

/** 연산 1회 + R-05 보정(연산 뒤 공통 normalizeDoc). 막힌 연산은 엔진이 EngineOpError를 던진다(화면은 can*로 먼저 막는다) */
export function runDocOp(engine: DocEngine, doc: PageDoc, op: DocOp, ctx: OpContext): OpResult {
  const done = (next: PageDoc, instanceId: string, index: number, lostSlotKeys = NO_LOSS): OpResult => ({
    doc: engine.normalizeDoc(next),
    instanceId,
    index,
    lostSlotKeys,
  });
  switch (op.kind) {
    case "move": {
      const moved = engine.moveSection(doc, op.instanceId, op.direction);
      return done(moved.doc, op.instanceId, moved.index);
    }
    case "remove": {
      const removed = engine.removeSection(doc, op.instanceId, ctx.purpose);
      return done(removed.doc, op.instanceId, removed.undo.index);
    }
    case "add": {
      const instanceId = ctx.nextInstanceId(doc);
      const added = engine.addSection(doc, op.type, op.variant, op.afterInstanceId, { instanceId, motionPreset: ctx.motionPreset });
      return done(added.doc, instanceId, added.index);
    }
    case "swap": {
      const swapped = engine.swapVariant(doc, op.instanceId, op.variant, ctx.purpose);
      return done(swapped.doc, op.instanceId, swapped.doc.sections.findIndex((s) => s.instanceId === op.instanceId), swapped.lostSlotKeys);
    }
    case "theme": {
      // 대상 섹션 없음(문서 전체) — instanceId "" · index -1. 값 비교 = 슬롯(diffSlotValues) + meta 2칸(SPEC r1 3.1 "meta 포함")
      const next = engine.normalizeDoc(swapTheme(doc, op.profileVersion));
      const slots = diffSlotValues(doc, next);
      const meta = (["title", "description"] as const).filter((key) => doc.meta[key] !== next.meta[key]).map((key) => ({ instanceId: "", key }));
      return { doc: next, instanceId: "", index: -1, lostSlotKeys: NO_LOSS, values: { compared: slots.compared + 2, changed: [...slots.changed, ...meta] } };
    }
  }
}
