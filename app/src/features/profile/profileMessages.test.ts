/** 2A-04b2 Codex P2 — 제안·충돌은 초안(다른 역할 보정 적용) 기준, from은 그 역할의 base 값 */
import { describe, expect, it } from "vitest";
import type { PaletteEntry } from "../../domain/referenceDetail";
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
