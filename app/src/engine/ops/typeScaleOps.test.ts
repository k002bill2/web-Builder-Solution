/**
 * TYPESCALE TS-AC-07 · TS-AC-15 — 테마 바꾸기는 문서 비율을 유지하고, 내보내기 게이트는 비율과 무관하다.
 */
import { runGate } from "../gate/runGate";
import { sampleDoc } from "../testing/sampleDoc";
import { sampleTheme } from "../testing/sampleTheme";
import { hashDoc } from "./hash";
import { swapTheme } from "./slotOps";

const withScale = (typeScale: number) => {
  const doc = { ...sampleDoc(), typeScale };
  return { ...doc, hash: hashDoc(doc) };
};

describe("TYPESCALE 연산·게이트", () => {
  it("TS-AC-07 swapTheme 뒤 typeScale 유지 · profileVersion만 바뀜", () => {
    const doc = withScale(1.333);
    const next = swapTheme(doc, doc.profileVersion + 1);
    expect(next.typeScale).toBe(1.333);
    expect({ ...next, profileVersion: doc.profileVersion }).toEqual(doc);
  });
  it("TS-AC-15 typeScale만 다른 문서 = runGate 판정 행 같음(docHash만 문서 해시를 따른다)", () => {
    const ctx = sampleTheme();
    const rows = (typeScale?: number) => runGate(typeScale === undefined ? sampleDoc() : withScale(typeScale), ctx).rows;
    expect(rows(1.2)).toEqual(rows(1.333));
    expect(rows(1.2)).toEqual(rows());
  });
});
