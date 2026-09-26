// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { GATE_TEXT, INFERRED_GATE_TEXT, josaIGa, overMax, overRecommended, recommendedNote } from "./gateText";

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
const SPEC = read("../../../../docs/design/2a-05/SPEC.md");

describe("게이트 문장 = SPEC 5.6·5.7·5.12·E-S14·E-S23 문구 그대로 (L4a reasons.test 방식)", () => {
  const quoted = Object.entries(GATE_TEXT).filter(
    ([key, value]) => typeof value === "string" && !(INFERRED_GATE_TEXT as readonly string[]).includes(key) && key !== "seoDescriptionEmpty",
  );

  it.each(quoted)("%s", (_, sentence) => {
    expect(SPEC).toContain(`"${sentence}"`);
  });

  it("'설명 없음'은 E-S23·5.13 내보내기 이유 문장 속 SEO 메타 원인 그대로", () => {
    expect(SPEC).toContain(`"차단 1건(SEO 메타: ${GATE_TEXT.seoDescriptionEmpty}) — 고치면 열립니다"`);
  });

  it("숫자 문장 틀 — SPEC 예시 숫자로 채우면 원문과 같다", () => {
    expect(SPEC).toContain(`"${overMax(40, 46)}"`);
    expect(SPEC).toContain(`"${overRecommended("3번 카드 제목", 34, 28)}"`);
    expect(SPEC).toContain(`"${recommendedNote(28)}"`);
  });

  it("유추 문장은 SPEC에 없다(REPORT에 유추로 표시)", () => {
    for (const key of INFERRED_GATE_TEXT) expect(SPEC).not.toContain(`"${GATE_TEXT[key]}"`);
  });

  it("조사 이/가 — 받침·숫자 끝", () => {
    expect(["카드 3 제목", "질문 2", "대표 이미지", "버튼 문구", "설명", "후기 1", "수치 4"].map((w) => josaIGa(w))).toEqual([
      "이", "가", "가", "가", "이", "이", "가",
    ]);
  });
});
