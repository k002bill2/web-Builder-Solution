import type { KitTokenInput } from "../render/protocol";
import { kitCssText, kitVars } from "./tokens";

const INPUT: KitTokenInput = {
  palette: { primary: "rgb(139 94 60)", surface: "rgb(240 230 220)", ink: "rgb(30 30 30)", muted: "rgb(120 110 100)", bg: "rgb(255 255 255)" },
  card: { tone: "light", style: "bordered-lg" },
  type: { family: "Pretendard", headingWeight: 700, bodyWeight: 400, scale: 1.25 },
  space: { grid: 8, sectionGap: 96, density: "comfortable" },
  mediaRatio: "4:5",
};

describe("킷 토큰 생성기 (M2A-2a K1 · m2a 0.3~0.5)", () => {
  it("결정적 — 같은 입력 = 같은 문자열(키 순서 고정), 입력을 바꾸지 않는다", () => {
    const frozen = JSON.parse(JSON.stringify(INPUT)) as KitTokenInput;
    expect(kitCssText(INPUT)).toBe(kitCssText(frozen));
    expect(Object.keys(kitVars(INPUT))).toEqual(Object.keys(kitVars({ ...INPUT, palette: { ...INPUT.palette, ink: "rgb(0 0 0)" } })));
    expect(INPUT).toEqual(frozen);
    expect(kitCssText(INPUT)).toMatch(/^--site-primary: rgb\(139 94 60\); --site-surface: /);
  });

  it("팔레트 5역할 + on-primary(흰색 고정) · 글꼴 스택(계열 + 시스템 대체) · 굵기", () => {
    const v = kitVars(INPUT);
    expect([v["--site-primary"], v["--site-surface"], v["--site-ink"], v["--site-muted"], v["--site-bg"]]).toEqual(Object.values(INPUT.palette));
    expect(v["--site-on-primary"]).toBe("rgb(255 255 255)");
    expect(v["--site-font"]).toBe('"Pretendard", system-ui, sans-serif');
    expect(kitVars({ ...INPUT, type: { ...INPUT.type, family: "Noto Serif KR" } })["--site-font"]).toBe('"Noto Serif KR", serif');
    expect([v["--site-weight-heading"], v["--site-weight-body"]]).toEqual(["700", "400"]);
  });

  it("글자 단계 tN = scale^N rem (t-1 … t5, 소수 4자리)", () => {
    const v = kitVars(INPUT);
    expect(v["--site-t0"]).toBe("1rem");
    expect(v["--site-t1"]).toBe("1.25rem");
    expect(v["--site-t3"]).toBe("1.9531rem");
    expect(v["--site-t5"]).toBe("3.0518rem");
    expect(v["--site-t-1"]).toBe("0.8rem");
  });

  it("간격: grid 배수 s1~s6 · section-gap = sectionGap(rem) · 좁은 폭 절반 · 촘촘이면 카드 여백 한 단계 아래", () => {
    const v = kitVars(INPUT);
    expect([1, 2, 3, 4, 5, 6].map((n) => v[`--site-s${n}`])).toEqual(["0.25rem", "0.5rem", "0.75rem", "1rem", "1.5rem", "2rem"]);
    expect(v["--site-section-gap"]).toBe("6rem");
    expect(v["--site-section-gap-narrow"]).toBe("3rem");
    expect(v["--site-card-pad"]).toBe("var(--site-s5)");
    expect(kitVars({ ...INPUT, space: { ...INPUT.space, density: "compact" } })["--site-card-pad"]).toBe("var(--site-s4)");
  });

  it("카드 모양 → radius·경계·그림자 · 버튼 radius(bordered-lg = r2, 그 밖 r1) · 이미지 비율", () => {
    const of = (style: KitTokenInput["card"]["style"]) => kitVars({ ...INPUT, card: { tone: "light", style } });
    expect([of("bordered-lg")["--site-radius-card"], of("bordered-md")["--site-radius-card"], of("elevated")["--site-radius-card"], of("flat")["--site-radius-card"]]).toEqual([
      "var(--site-r2)",
      "var(--site-r1)",
      "var(--site-r1)",
      "0",
    ]);
    expect(of("bordered-lg")["--site-radius-control"]).toBe("var(--site-r2)");
    expect(of("flat")["--site-radius-control"]).toBe("var(--site-r1)");
    expect(of("elevated")["--site-card-shadow"]).toBe("var(--site-shadow-1)");
    expect(of("bordered-md")["--site-card-shadow"]).toBe("none");
    expect(of("elevated")["--site-card-stroke"]).toBe("0");
    expect(kitVars(INPUT)["--site-media-ratio"]).toBe("4 / 5");
  });

  it("값에 px·hex·vh 0 (K-AC-01·07 — 생성 결과도 단위는 rem·ch·비율)", () => {
    expect(kitCssText(INPUT)).not.toMatch(/\d(px|vh|dvh|svh|lvh)\b|#[0-9a-f]{3,8}\b/i);
  });
});
