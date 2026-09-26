/** 2A-04b2 Codex P2 — 제안·충돌은 초안(다른 역할 보정 적용) 기준, from은 그 역할의 base 값 */
import { describe, expect, it } from "vitest";
import type { PaletteEntry } from "../../domain/referenceDetail";
import { referenceDetailFixtures } from "../../fixtures/referenceDetails";
import { contrastView } from "./profileMessages";

const BASE: readonly PaletteEntry[] = [
  { role: "primary", hex: "#444444" },
  { role: "surface", hex: "#FFFFFF" },
  { role: "ink", hex: "#999999" },
  { role: "muted", hex: "#767676" },
  { role: "bg", hex: "#FFFFFF" },
];

describe("contrastView — 다른 역할의 저장 안 된 보정을 반영한 제안", () => {
  it("원본(어두운 카드 #444)에서는 ink가 충돌 → 초안에서 primary를 #000000으로 보정하면 ink 제안은 충돌 아님, from = base ink", () => {
    const before = contrastView(BASE, "dark", "aa");
    expect(before.proposals.find((p) => p.role === "ink")?.conflict).toBeDefined();
    const draft = BASE.map((p) => (p.role === "primary" ? { ...p, hex: "#000000" } : p));
    const ink = contrastView(draft, "dark", "aa", BASE).proposals.find((p) => p.role === "ink");
    expect(ink).toMatchObject({ from: "#999999" });
    expect(ink?.conflict).toBeUndefined();
  });
});

describe("contrastView — 강화 7:1 불가 (D-2A4B2-01 · SPEC 10.0.3 QA-B2)", () => {
  it("ref-a + 어두운 카드 + 강화: C-3 미달, ink 제안 = 충돌(보정값 쓰기 없음) · 도달 불가 문장 · '비교 보드에서 팔레트 바꾸기'", () => {
    const view = contrastView(referenceDetailFixtures["ref-a"]!.palette, "dark", "enhanced");
    expect(view.checks.find((c) => c.id === "C-3")).toMatchObject({ ratio: "2.5:1", pass: false });
    const ink = view.proposals.find((p) => p.role === "ink")!;
    expect(ink.conflict).toEqual({
      text: "본문 글자(ink)가 어두운 카드(2.5:1)에서 어떤 명도로도 기준 7.0:1을 맞출 수 없습니다. 대체안: 비교 보드에서 다른 팔레트를 고르세요",
      detail: "대비가 가장 높은 후보 #FFFFFF도 5.5:1",
      link: "비교 보드에서 팔레트 바꾸기",
    });
    expect(view.proposals.find((p) => p.role === "primary")?.conflict).toBeUndefined();
  });
});
