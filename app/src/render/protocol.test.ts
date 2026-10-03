import { readParentMessage, readRenderMessage } from "./protocol";
import { SAMPLE_KIT_TOKENS } from "./testing/sampleKitTokens";

describe("메시지 모양 검사 (M2A-2a K2 · MQ-1 render{doc, kitTokens})", () => {
  const doc = { sections: [] };
  it("render{doc, kitTokens} — 킷 토큰 입력을 그대로 넘긴다 · 없으면 doc만", () => {
    expect(readParentMessage({ type: "render", doc, kitTokens: SAMPLE_KIT_TOKENS })).toEqual({ type: "render", doc, kitTokens: SAMPLE_KIT_TOKENS });
    expect(readParentMessage({ type: "render", doc })).toEqual({ type: "render", doc });
  });

  it("palette 단독 필드는 더 읽지 않는다(팔레트는 kitTokens 안)", () => {
    expect(readParentMessage({ type: "render", doc, palette: SAMPLE_KIT_TOKENS.palette })).toEqual({ type: "render", doc });
  });

  it.each([
    ["팔레트 역할 누락", { ...SAMPLE_KIT_TOKENS, palette: { ...SAMPLE_KIT_TOKENS.palette, bg: undefined } }],
    ["글꼴 이름에 따옴표·세미콜론(CSS 주입)", { ...SAMPLE_KIT_TOKENS, type: { ...SAMPLE_KIT_TOKENS.type, family: 'X"; color: red' } }],
    ["팔레트 값에 세미콜론", { ...SAMPLE_KIT_TOKENS, palette: { ...SAMPLE_KIT_TOKENS.palette, ink: "red; x: y" } }],
    ["scale 숫자 아님", { ...SAMPLE_KIT_TOKENS, type: { ...SAMPLE_KIT_TOKENS.type, scale: "1.2" } }],
    ["카드 모양 모름", { ...SAMPLE_KIT_TOKENS, card: { tone: "light", style: "glass" } }],
    ["비율 모름", { ...SAMPLE_KIT_TOKENS, mediaRatio: "3:2" }],
    ["sectionGap 음수", { ...SAMPLE_KIT_TOKENS, space: { ...SAMPLE_KIT_TOKENS.space, sectionGap: -1 } }],
  ])("kitTokens 모양이 틀리면(%s) 메시지 전체를 버린다", (_name, kitTokens) => {
    expect(readParentMessage({ type: "render", doc, kitTokens })).toBeUndefined();
  });

  it("렌더 → 부모 error 코드: INVALID_DOC · NO_KIT_TOKENS만", () => {
    expect(readRenderMessage({ type: "error", code: "NO_KIT_TOKENS" })).toEqual({ type: "error", code: "NO_KIT_TOKENS" });
    expect(readRenderMessage({ type: "error", code: "INVALID_DOC" })).toEqual({ type: "error", code: "INVALID_DOC" });
    expect(readRenderMessage({ type: "error", code: "OTHER" })).toBeUndefined();
  });
});
