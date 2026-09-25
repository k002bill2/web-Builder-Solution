import { screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderApp } from "../test/renderApp";

/** vitest는 css: false라 index.css가 적용되지 않는다. 전역 규칙이 있는 base.css를 직접 주입해 계산 스타일을 본다. */
const BASE_CSS = readFileSync(join(import.meta.dirname, "tokens/base.css"), "utf8");

describe("한국어 줄바꿈 (QA-1A-01 D06)", () => {
  let style: HTMLStyleElement;
  beforeEach(() => {
    style = document.createElement("style");
    style.textContent = BASE_CSS;
    document.head.appendChild(style);
  });
  afterEach(() => style.remove());

  it("카탈로그 제목은 어절 단위로 줄바꿈하고(keep-all) 긴 영문·URL은 넘치지 않게 끊는다(anywhere)", async () => {
    renderApp("/catalog");
    const title = await screen.findByRole("heading", { level: 1 });
    const computed = getComputedStyle(title);
    expect(computed.wordBreak).toBe("keep-all");
    expect(computed.overflowWrap).toBe("anywhere");
  });

  it("본문 텍스트에도 같은 규칙이 적용된다", async () => {
    renderApp("/catalog");
    const body = await screen.findByText("필터 상태는 URL로 유지됩니다");
    expect(getComputedStyle(body).wordBreak).toBe("keep-all");
  });
});
