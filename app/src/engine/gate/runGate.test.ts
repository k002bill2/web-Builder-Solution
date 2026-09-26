import { nearestCompliantColor } from "../../domain/contrast";
import { GATE_ROWS } from "../contracts/records";
import { canonicalJson, hashDoc } from "../ops/hash";
import { passingDoc, reverseKeys, rowOf } from "../testing/gateKit";
import { sampleDoc, withSections } from "../testing/sampleDoc";
import { CAFE_PALETTE, GOOD_PALETTE, sampleTheme } from "../testing/sampleTheme";
import { GATE_TEXT } from "./gateText";
import { runGate } from "./runGate";

const THEME = sampleTheme();

describe("runGate — 8줄 틀 (SPEC 5.12 · 8.1 GateReport)", () => {
  it("8줄 · GATE_ROWS 순서 · docHash = hashDoc(doc) · docRevision", () => {
    const doc = passingDoc();
    const report = runGate(doc, THEME);
    expect(report.rows.map((r) => r.id)).toEqual([...GATE_ROWS]);
    expect(report.docHash).toBe(hashDoc(doc));
    expect(report.docRevision).toBe(3);
  });

  it("통과 문서 — 성능 외 7줄 pass · 이슈 0", () => {
    const report = runGate(passingDoc(), THEME);
    for (const row of report.rows.filter((r) => r.id !== "performance")) {
      expect({ id: row.id, state: row.state, issues: row.issues }).toEqual({ id: row.id, state: "pass", issues: [] });
    }
  });

  it("성능 예산 줄은 어떤 문서든 unmeasured · 이슈 0 (Q13 '측정 전')", () => {
    const broken = withSections(sampleDoc({ meta: { title: "", description: "" } }), []);
    for (const doc of [passingDoc(), sampleDoc(), broken]) {
      expect(rowOf(runGate(doc, THEME), "performance")).toEqual({ id: "performance", state: "unmeasured", issues: [] });
    }
    expect(GATE_TEXT.performanceNote).toBe("생성기 연결 후 측정합니다");
  });

  it("결정성 — 키 순서를 뒤집은 같은 문서·테마 → 같은 report", () => {
    const doc = sampleDoc();
    const theme = sampleTheme({ palette: CAFE_PALETTE, purpose: "inquiry" });
    const a = runGate(doc, theme);
    const b = runGate(reverseKeys(doc), reverseKeys(theme));
    expect(b).toEqual(a);
    expect(canonicalJson(b)).toBe(canonicalJson(a));
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
  });

  it("입력 불변 — 동결 입력으로 throw 0 · 입력 내용 그대로 · 결과는 동결", () => {
    const doc = sampleDoc();
    const theme = sampleTheme({ palette: CAFE_PALETTE });
    const before = canonicalJson({ doc, theme });
    const report = runGate(doc, theme);
    expect(canonicalJson({ doc, theme })).toBe(before);
    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.rows[1]!.issues[0])).toBe(true);
  });

  it("시각·난수를 읽지 않는다 (Date.now · Math.random 호출 0)", () => {
    const now = vi.spyOn(Date, "now");
    const random = vi.spyOn(Math, "random");
    runGate(sampleDoc(), sampleTheme({ palette: CAFE_PALETTE, purpose: "booking" }));
    expect(now).not.toHaveBeenCalled();
    expect(random).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});

describe("대비 AA 줄 (R-08 — checkProfileContrast 판정만, throw 0)", () => {
  it("pass — 모든 검사 통과 팔레트", () => {
    expect(rowOf(runGate(passingDoc(), sampleTheme({ palette: GOOD_PALETTE })), "contrast")).toEqual({ id: "contrast", state: "pass", issues: [] });
  });

  it("block — 카페 팔레트 AA: C-5 muted/bg 3.8:1 미달 1건, 대체안 '프로필에서 보정'", () => {
    const row = rowOf(runGate(passingDoc(), sampleTheme({ palette: CAFE_PALETTE })), "contrast");
    expect(row.state).toBe("block");
    expect(row.issues).toHaveLength(1);
    expect(row.issues[0]).toMatchObject({ ruleId: "R-08", severity: "block", alternative: GATE_TEXT.contrastAlternative });
    expect(row.issues[0]!.cause).toContain("C-5");
    expect(row.issues[0]!.cause).toContain("3.8:1");
    expect(row.issues[0]!.cause).toContain("4.5:1");
    expect(row.issues[0]!.instanceId).toBeUndefined();
  });

  // FIX-2A04B2-P1 병합 조정: 보정 함수가 throw 대신 도달 불가를 값(reached: false)으로 돌려준다.
  // 게이트가 보정 함수를 부르지 않는다는 이 테스트의 목적은 그대로다.
  it("7:1 불가 조합(QA D-2A4B2-01: #8B5E3C primary + 어두운 카드 + 강화) — 보정 함수는 도달 불가를 값으로, 게이트는 throw 0 · 대비 줄 block", () => {
    expect(nearestCompliantColor(CAFE_PALETTE.ink, CAFE_PALETTE.primary, 7).reached).toBe(false);
    const theme = sampleTheme({ palette: CAFE_PALETTE, cardTone: "dark", adjustments: { contrast: "enhanced" } });
    let report: ReturnType<typeof runGate> | undefined;
    expect(() => (report = runGate(passingDoc(), theme))).not.toThrow();
    const row = rowOf(report!, "contrast");
    expect(row.state).toBe("block");
    const causes = row.issues.map((i) => i.cause).join("\n");
    expect(causes).toContain("C-3");
    expect(causes).toContain("7.0:1");
  });

  it("적용 값 = effectiveProfile(base + 보정) — muted 보정이 들어간 버전은 pass", () => {
    const theme = sampleTheme({ palette: CAFE_PALETTE, adjustments: { corrections: [{ role: "muted", from: "#9A7B63", to: "#8E715B", check: "C-5" }] } });
    expect(rowOf(runGate(passingDoc(), theme), "contrast").state).toBe("pass");
  });

  it("어두운 카드일 때만 C-3을 본다 — 밝은 카드·카드 없음은 C-3 이슈 0", () => {
    const light = rowOf(runGate(passingDoc(), sampleTheme({ palette: GOOD_PALETTE, cardTone: "light" })), "contrast");
    const dark = rowOf(runGate(passingDoc(), sampleTheme({ palette: GOOD_PALETTE, cardTone: "dark" })), "contrast");
    expect(light.state).toBe("pass");
    expect(dark.issues.map((i) => i.cause.slice(0, 3))).toEqual(["C-3"]);
  });

  it("색 값이 #RRGGBB가 아니면 throw 없이 block (그 역할 1건)", () => {
    const theme = sampleTheme({ palette: { ...GOOD_PALETTE, muted: "gray" } });
    let report: ReturnType<typeof runGate> | undefined;
    expect(() => (report = runGate(passingDoc(), theme))).not.toThrow();
    const row = rowOf(report!, "contrast");
    expect(row.state).toBe("block");
    expect(row.issues).toHaveLength(1);
    expect(row.issues[0]!.cause).toContain("muted");
  });
});
