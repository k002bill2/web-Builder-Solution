import { describe, expect, it } from "vitest";
import { zipCssDataUrls } from "./zipCssGuard.mjs";

describe("CSP-AC-11 빌드 가드 — 렌더 문서 빌드 CSS(@font-face 제외 = 정적 zip <style>)에 url(data:) 0", () => {
  it("@font-face 밖 url(data:) = 잡는다(따옴표 3종·대소문자)", () => {
    expect(zipCssDataUrls('[data-kit]{background:url(data:image/png;base64,QUJD)}')).toEqual(["url(data:"]);
    expect(zipCssDataUrls(`a{b:url( "DATA:image/svg+xml,x")}c{d:url('data:x')}`)).toHaveLength(2);
  });

  it("@font-face 안 url()은 생성기가 지우므로 보지 않는다 · 상대 경로·assets url() = 통과", () => {
    expect(zipCssDataUrls('@font-face{font-family:"P";src:url(data:font/woff2;base64,AA) format("woff2")}@font-face{src:url(/assets/P.woff2)}a{b:url(assets/x.png)}')).toEqual([]);
  });
});
