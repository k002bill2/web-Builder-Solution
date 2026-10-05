import { HTML_MAX, readHtmlMessage } from "./htmlMessage";
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

  it("렌더 → 부모 error 코드: INVALID_DOC · NO_KIT_TOKENS (· IMAGE_DECODE_FAILED 아래) — 모르는 코드는 버림", () => {
    expect(readRenderMessage({ type: "error", code: "NO_KIT_TOKENS" })).toEqual({ type: "error", code: "NO_KIT_TOKENS" });
    expect(readRenderMessage({ type: "error", code: "INVALID_DOC" })).toEqual({ type: "error", code: "INVALID_DOC" });
    expect(readRenderMessage({ type: "error", code: "OTHER" })).toBeUndefined();
  });

  it("render{doc, images} — 로컬 이미지 id → {blob, width, height}(K4 · SPEC m2c 3절 MQ-C4 ★A) · Blob만·문자열·id 형식 틀림은 메시지 전체를 버린다", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const blob = new Blob(["x"], { type: "image/png" });
    const image = { blob, width: 1600, height: 900 };
    expect(readParentMessage({ type: "render", doc, images: { [id]: image } })).toEqual({ type: "render", doc, images: { [id]: image } });
    expect(readParentMessage({ type: "render", doc, images: { [id]: blob } })).toBeUndefined();
    expect(readParentMessage({ type: "render", doc, images: { [id]: "blob:http://x/1" } })).toBeUndefined();
    expect(readParentMessage({ type: "render", doc, images: { "blob:x": image } })).toBeUndefined();
  });

  it("IMG-AC-22: images 메타 — 폭·높이 = 1~16384 정수(한 변 경계 · SPEC 2절) · blob = Blob · 하나라도 틀리면 메시지 전체를 버린다", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const blob = new Blob(["x"], { type: "image/png" });
    const read = (image: unknown) => readParentMessage({ type: "render", doc, images: { [id]: image } });
    expect(read({ blob, width: 16384, height: 1 })).toEqual({ type: "render", doc, images: { [id]: { blob, width: 16384, height: 1 } } });
    for (const bad of [
      { blob, width: 0, height: 10 },
      { blob, width: -1, height: 10 },
      { blob, width: 10.5, height: 10 },
      { blob, width: 16385, height: 10 },
      { blob, width: Number.NaN, height: 10 },
      { blob, width: "10", height: 10 },
      { blob, width: 10 },
      { blob: "x", width: 10, height: 10 },
      null,
    ])
      expect(read(bad)).toBeUndefined();
  });

  it("render{loading} — 내보내기만 \"eager\"(SPEC m2c 5.3) · 그 밖 값이면 메시지 전체를 버린다 · 없으면 키 없음", () => {
    expect(readParentMessage({ type: "render", doc, loading: "eager" })).toEqual({ type: "render", doc, loading: "eager" });
    expect(readParentMessage({ type: "render", doc, loading: "lazy" })).toBeUndefined();
    expect(readParentMessage({ type: "render", doc, loading: true })).toBeUndefined();
    expect(readParentMessage({ type: "render", doc })).not.toHaveProperty("loading");
  });

  it("렌더 → 부모 error IMAGE_DECODE_FAILED(내보내기 이미지 decode 실패 — SPEC m2c 5.3-3)", () => {
    expect(readRenderMessage({ type: "error", code: "IMAGE_DECODE_FAILED" })).toEqual({ type: "error", code: "IMAGE_DECODE_FAILED" });
  });

  it("render{fonts} — 내보내기용 글꼴 바이트(M2B-4a 2.4): 별칭·400|700·ArrayBuffer · 2개 이하 · 어긋나면 메시지 전체를 버린다", () => {
    const data = new ArrayBuffer(8);
    const fonts = [{ family: "Kit Serif KR", weight: 700, data }];
    expect(readParentMessage({ type: "render", doc, fonts })).toEqual({ type: "render", doc, fonts });
    expect(readParentMessage({ type: "render", doc, fonts: [{ family: "Kit Serif KR", weight: 500, data }] })).toBeUndefined();
    expect(readParentMessage({ type: "render", doc, fonts: [{ family: "Kit;Serif", weight: 700, data }] })).toBeUndefined();
    expect(readParentMessage({ type: "render", doc, fonts: [{ family: "Kit Serif KR", weight: 700, data: "AAAA" }] })).toBeUndefined();
    expect(readParentMessage({ type: "render", doc, fonts: [...fonts, ...fonts, ...fonts] })).toBeUndefined();
  });
});

describe("직렬화 메시지 (M2A-3b G2 — serialize 부모→렌더 · html 렌더→부모)", () => {
  it("serialize — 다른 필드는 버린다", () => {
    expect(readParentMessage({ type: "serialize" })).toEqual({ type: "serialize" });
    expect(readParentMessage({ type: "serialize", extra: 1 })).toEqual({ type: "serialize" });
  });

  it("html{markup} — 글자만 · 빈 글자·상한(HTML_MAX) 초과·글자 아님은 버린다 · 편집기 다리(readRenderMessage)는 html을 읽지 않는다", () => {
    expect(readHtmlMessage({ type: "html", markup: "<div data-site-root></div>" })).toEqual({ type: "html", markup: "<div data-site-root></div>" });
    expect(readHtmlMessage({ type: "html", markup: "" })).toBeUndefined();
    expect(readHtmlMessage({ type: "html", markup: 1 })).toBeUndefined();
    expect(readHtmlMessage({ type: "html", markup: "x".repeat(HTML_MAX + 1) })).toBeUndefined();
    expect(readHtmlMessage({ type: "ready" })).toBeUndefined();
    expect(readRenderMessage({ type: "html", markup: "<div></div>" })).toBeUndefined();
  });
});
