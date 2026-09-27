// QA 독립 표적 검증 (제품 코드 무변경) — L4b createDocFromCandidate · runGate. 개발자 테스트와 별개 입력으로 계약을 다시 잰다.
// 실행: cd app && npx vitest run --config ../docs/qa/post-merge/tools/vitest.qa.config.ts
import { createDocFromCandidate } from "../../../../app/src/engine/doc/createDocFromCandidate";
import { validatePageDoc } from "../../../../app/src/engine/validate/validatePageDoc";
import { hashDoc } from "../../../../app/src/engine/ops/hash";
import { runGate } from "../../../../app/src/engine/gate/runGate";
import { GATE_ROWS } from "../../../../app/src/engine/contracts/records";
import { passingDoc, rowOf } from "../../../../app/src/engine/testing/gateKit";
import { CAFE_PALETTE, GOOD_PALETTE, sampleTheme, type Palette } from "../../../../app/src/engine/testing/sampleTheme";
import { nearestCompliantColor } from "../../../../app/src/domain/contrast";

const SECTIONS = [
  { type: "header", variant: "sticky-right-cta" },
  { type: "hero", variant: "fullbleed-left" },
  { type: "about", variant: "story" },
  { type: "services", variant: "list" },
  { type: "faq", variant: "accordion" },
  { type: "services", variant: "cards-3" },
  { type: "contact", variant: "form" },
  { type: "footer", variant: "biz-extended" },
] as const;

// 동결하지 않은 입력 — 함수가 입력을 바꾸면 JSON 비교로 잡힌다
const plan = () => ({ candidateId: "qa-c", sections: SECTIONS.map((s) => ({ ...s })), libraryVersion: "1.4", generatorVersion: "preview-1" });
const start = () => ({ projectId: "qa-project", updatedAt: "2026-09-27T09:00:00.000Z" });

describe("QA L4b createDocFromCandidate", () => {
  it("본문 4개(R-01 위반) 구조안은 EngineOpError로 거부 — 잘못된 문서를 만들지 않음 (probe 1차 시도에서 관찰)", () => {
    const bad = { ...plan(), sections: plan().sections.filter((x) => x.type !== "services") };
    expect(() => createDocFromCandidate(bad as never, 2, start())).toThrow(/R-01/);
  });
  it("유효 문서 · hash = hashDoc · 입력 불변(비동결 입력) · 결과 깊은 동결", () => {
    const p = plan(); const s = start();
    const before = JSON.stringify([p, s]);
    const doc = createDocFromCandidate(p as never, 2, s);
    expect(validatePageDoc(doc).ok).toBe(true);
    expect(doc.hash).toBe(hashDoc(doc));
    expect(JSON.stringify([p, s])).toBe(before);
    expect(Object.isFrozen(doc) && Object.isFrozen(doc.sections) && doc.sections.every((x) => Object.isFrozen(x) && Object.isFrozen(x.slots))).toBe(true);
  });
  it("결정성: 독립 객체 입력 두 번 → 깊은 동등 · 같은 hash · 다른 profileVersion은 다른 문서", () => {
    const a = createDocFromCandidate(plan() as never, 2, start());
    const b = createDocFromCandidate(plan() as never, 2, start());
    expect(b).toEqual(a);
    expect(b.hash).toBe(a.hash);
    expect(createDocFromCandidate(plan() as never, 3, start()).profileVersion).toBe(3);
  });
});

const probe = (palette: Palette, cardTone: "dark" | "light", contrast: "enhanced" | "aa") =>
  runGate(passingDoc(), sampleTheme({ palette, cardTone, adjustments: contrast === "enhanced" ? { contrast: "enhanced" } : {} }));

describe("QA L4b runGate", () => {
  it("8줄 · GATE_ROWS 순서", () => {
    const r = runGate(passingDoc(), sampleTheme());
    expect(r.rows).toHaveLength(8);
    expect(r.rows.map((x) => x.id)).toEqual([...GATE_ROWS]);
  });
  // 7:1 불가 primary 후보(이전 QA L2 추정 포함): #8B5E3C(카페) · #1F5FBF · #777777
  const UNREACHABLE = ["#8B5E3C", "#1F5FBF", "#777777"];
  for (const primary of UNREACHABLE) {
    it(`7:1 불가 조합 primary ${primary} + 어두운 카드 + 강화 → throw 0 · 대비 줄 block · 보정 함수 reached=false`, () => {
      expect(nearestCompliantColor(CAFE_PALETTE.ink, primary, 7).reached).toBe(false);
      let report: ReturnType<typeof runGate> | undefined;
      expect(() => (report = probe({ ...CAFE_PALETTE, primary }, "dark", "enhanced"))).not.toThrow();
      expect(rowOf(report!, "contrast").state).toBe("block");
      expect(report!.rows).toHaveLength(8);
    });
  }
  it("밝은 카드 + 중간 명도 면(#777777) + 강화 → throw 0", () => {
    expect(() => probe({ ...GOOD_PALETTE, surface: "#777777" }, "light", "enhanced")).not.toThrow();
  });
  it("GOOD_PALETTE + 강화 → 대비 줄 pass (판정이 무조건 block이 아님)", () => {
    expect(rowOf(probe(GOOD_PALETTE, "light", "enhanced"), "contrast").state).toBe("pass");
  });
});
