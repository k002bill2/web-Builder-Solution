import { describe, expect, it } from "vitest";
import { parsePreviewView, toPreviewViewParams } from "./previewView";

const parse = (query: string) => parsePreviewView(new URLSearchParams(query));

describe("미리보기 폭 URL (V2-AC-28)", () => {
  it("view 값을 읽고, 없거나 모르는 값이면 desktop", () => {
    expect(parse("")).toBe("desktop");
    expect(parse("view=tablet")).toBe("tablet");
    expect(parse("view=mobile")).toBe("mobile");
    expect(parse("view=desktop")).toBe("desktop");
    expect(parse("view=nope")).toBe("desktop");
  });

  it("옛 tab=mobile은 mobile로, 다른 옛 tab 값은 desktop으로 해석한다", () => {
    expect(parse("tab=mobile")).toBe("mobile");
    expect(parse("tab=tokens")).toBe("desktop");
    expect(parse("tab=scores")).toBe("desktop");
  });

  it("유효한 view가 옛 tab보다 앞선다", () => {
    expect(parse("view=tablet&tab=mobile")).toBe("tablet");
    expect(parse("view=nope&tab=mobile")).toBe("mobile");
  });

  it("쓸 때는 기본(desktop)을 생략하고 옛 tab을 남기지 않는다", () => {
    expect(toPreviewViewParams("desktop").toString()).toBe("");
    expect(toPreviewViewParams("tablet").toString()).toBe("view=tablet");
    expect(toPreviewViewParams("mobile").toString()).toBe("view=mobile");
  });
});
