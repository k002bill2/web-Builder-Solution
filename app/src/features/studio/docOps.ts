import type { MotionPreset } from "../../domain/compareBoard";
import type { PageDoc, SectionType } from "../../engine/contracts/pageDoc";
import type { MoveDirection, Purpose } from "../../engine/ops/rules";

/** 편집기 구조 연산 1회(SPEC 8.2 · 5.2~5.5) */
export type DocOp =
  | { readonly kind: "move"; readonly instanceId: string; readonly direction: MoveDirection }
  | { readonly kind: "remove"; readonly instanceId: string }
  | { readonly kind: "add"; readonly type: SectionType; readonly variant: string; readonly afterInstanceId: string | null }
  | { readonly kind: "swap"; readonly instanceId: string; readonly variant: string };

export interface OpContext {
  /** 문서 목적(docPurpose) — remove·swap이 넘긴다 */
  readonly purpose: Purpose;
  /** 문서 모션 프리셋(docMotionPreset) — add가 넘긴다 */
  readonly motionPreset: MotionPreset;
  /** 새 instanceId(카운터 주입 — createInstanceIds) */
  readonly nextInstanceId: (doc: PageDoc) => string;
}

export interface OpResult {
  /** 연산 + normalizeDoc(R-05) 뒤 문서 */
  readonly doc: PageDoc;
  /** 연산 대상 섹션 */
  readonly instanceId: string;
  /** 대상의 새 자리(삭제면 지운 자리) — 0부터 */
  readonly index: number;
  /** swap만 — 잃은 슬롯 키 */
  readonly lostSlotKeys: readonly string[];
}

export type DocEngine = typeof import("./docEngine");

/** 연산을 누를 때만 엔진 연산 청크를 받는다(조작 뒤, S-B5) */
export const loadDocEngine = (): Promise<DocEngine> => import("./docEngine");

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
  }
}

export async function applyDocOp(doc: PageDoc, op: DocOp, ctx: OpContext): Promise<OpResult> {
  return runDocOp(await loadDocEngine(), doc, op, ctx);
}

/** 편집기 마운트 단위 단조 카운터 — 문서에 이미 있는 id는 건너뛴다 */
export function createInstanceIds(prefix = "s-new"): (doc: PageDoc) => string {
  let count = 0;
  return (doc) => {
    const taken = new Set(doc.sections.map((s) => s.instanceId));
    do count += 1;
    while (taken.has(`${prefix}-${count}`));
    return `${prefix}-${count}`;
  };
}
