import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { INDUSTRY_LABELS } from "../fixtures/catalogFilters";
import { generatedReferenceFixtures } from "../fixtures/generatedReferences";
import { referenceFixtures } from "../fixtures/references";
import { renderApp } from "../test/renderApp";

/** 생성 레퍼런스 포함 카탈로그 (SPEC m3p 1·4절 · FR-CAT-06) — 실제 생성 카드 로더(큐레이션 주입 없음) */
const cards = () => screen.queryAllByRole("article");
const TOTAL = referenceFixtures.length + generatedReferenceFixtures.length;
const SLOW = 5_000;

describe("카탈로그 + 생성 레퍼런스", () => {
  it("필터 없이 큐레이션 6 + 생성 15 = 21개, 생성 카드는 점수 대신 '접근성·성능 미측정'이고 측정일 <time>이 없다", async () => {
    renderApp("/catalog");
    await waitFor(() => expect(cards()).toHaveLength(TOTAL), { timeout: SLOW });
    const generated = cards().filter((c) => within(c).queryByText("접근성·성능 미측정"));
    expect(generated).toHaveLength(generatedReferenceFixtures.length);
    for (const card of generated) expect(card.querySelector("time")).toBeNull();
  });

  it("베타 대상 5업종은 업종 칩마다 4개 이상 (FR-CAT-06 · MQ-M3P-2 A)", async () => {
    renderApp("/catalog");
    await waitFor(() => expect(cards()).toHaveLength(TOTAL), { timeout: SLOW });
    for (const industry of ["cafe-fnb", "beauty", "medical", "professional", "education"] as const) {
      await userEvent.click(screen.getByRole("button", { name: INDUSTRY_LABELS[industry] }));
      await waitFor(() => expect(cards().length, industry).toBeGreaterThanOrEqual(4), { timeout: SLOW });
    }
  });

  it("점수순에서 생성(미측정) 카드는 측정된 큐레이션 카드 뒤에 모인다", async () => {
    renderApp("/catalog?sort=score");
    await waitFor(() => expect(cards()).toHaveLength(TOTAL), { timeout: SLOW });
    const unmeasured = cards().map((c) => within(c).queryByText("접근성·성능 미측정") !== null);
    expect(unmeasured).toEqual([...Array(referenceFixtures.length).fill(false), ...Array(generatedReferenceFixtures.length).fill(true)]);
  });
});
