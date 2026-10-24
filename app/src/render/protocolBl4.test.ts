import { readParentMessage } from "./protocol";
import { SAMPLE_KIT_TOKENS } from "./testing/sampleKitTokens";

/** BL-4 (THREAT-MODEL T09) — 팔레트 값의 함수 표기는 허용 목록(rgb/rgba/hsl/hsla)만, 그 외 ident( · 주석 · @ 거부 */
describe("팔레트 값 함수 표기 거부 (BL-4)", () => {
  const doc = { schema: 1 };
  const withPrimary = (primary: string) => ({ type: "render", doc, kitTokens: { ...SAMPLE_KIT_TOKENS, palette: { ...SAMPLE_KIT_TOKENS.palette, primary } } });

  it.each(["url(https://x)", "red;}</style><script>", "expression(alert(1))", "image-set(a 1x)", "red /* */", "@import x", "URL(https://x)", "var(--x)", "env(x)", "rgb(1 2 3) url(x)", "\\66"])(
    "악성 값 %s → 렌더 메시지 거부",
    (value) => {
      expect(readParentMessage(withPrimary(value))).toBeUndefined();
    },
  );

  it.each(["#2F5D50", "rgb(255 255 255)", "rgba(0, 0, 0, 0.5)", "hsl(120 50% 50%)", "hsla(120, 50%, 50%, 0.4)", "white"])("현행 형식 %s 는 통과", (value) => {
    expect(readParentMessage(withPrimary(value))).toBeDefined();
  });
});
