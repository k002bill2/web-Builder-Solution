/**
 * FIX-2A04-NARROW N1 — 좁은 폭 버전 비교·버전 줄 (DS-CHECK-01 A-03·A-04·A-05 = D-2A4-05, SPEC r7 10.0.3 E안).
 * 마크업은 표 한 벌. <768은 CSS만으로 행을 쌓고(항목 → vA → vB → 바뀜), display를 바꿔도 표 의미가 남도록 role을 명시한다.
 * jsdom은 미디어 쿼리를 적용하지 않는다 — 여기서는 구조·role·클래스·이름과 styles/versionDiff.css 규칙만 보고, 배치는 브라우저 실측(REPORT)으로 본다.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createMemoryStudio } from "../data/memoryStudio";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";

const THREE = ["ref-a", "ref-b", "ref-c"];
/** 폭별 배치 규칙 — vitest는 css: false라 파일 원문으로 본다(공백은 한 칸으로) */
const CSS = readFileSync(join(import.meta.dirname, "../styles/versionDiff.css"), "utf8").replace(/\s+/g, " ");
const INDEX_CSS = readFileSync(join(import.meta.dirname, "../index.css"), "utf8");

/** v1 확정 → 대표색 ref-c로 v2 → 전부 ref-b로 v3 (v1↔v3에 바뀐 줄과 같은 줄이 섞인다) */
async function open(path: string) {
  const studio = createMemoryStudio({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(THREE, { hero: "ref-a" }) });
  await studio.board.confirmProfile(1, 0);
  for (const [latest, picks] of [[1, { palette: "ref-c" }], [2, { hero: "ref-b", palette: "ref-b", font: "ref-b" }]] as const) {
    const { board } = await studio.board.getBoard();
    const changed = await studio.board.savePicks({ ...board.picks, ...picks }, board.custom, board.revision);
    await studio.board.createProfileVersion("profile-1", changed.revision, latest);
  }
  renderApp(path, createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures), studio.board, studio.profiles);
  await screen.findByRole("heading", { level: 1, name: "디자인 프로필" });
}

const diffTable = () => screen.findByRole("table", { name: "v1과 v3 비교" });

describe("N1 버전 비교 — 표 한 벌 · role 명시 (A-03)", () => {
  it("table > rowgroup > row > columnheader/rowheader/cell role이 속성으로 명시된다(display를 바꿔도 표 의미 유지)", async () => {
    await open("/profile/profile-1?v=1&diff=3");
    const table = await diffTable();
    expect(table).toHaveAttribute("role", "table");
    for (const group of table.querySelectorAll("thead, tbody")) expect(group).toHaveAttribute("role", "rowgroup");
    for (const tr of table.querySelectorAll("tr")) expect(tr).toHaveAttribute("role", "row");
    for (const th of table.querySelectorAll("thead th")) expect(th).toHaveAttribute("role", "columnheader");
    for (const th of table.querySelectorAll("tbody th")) expect(th).toHaveAttribute("role", "rowheader");
    for (const td of table.querySelectorAll("td")) expect(td).toHaveAttribute("role", "cell");
    expect(screen.queryByRole("figure")).not.toBeInTheDocument();
    expect(table.closest(".rounded-md")?.querySelector("dl")).toBeNull();
  });

  it("값 셀의 열 이름(data-col) = 같은 위치의 열 머리글 — 쌓인 배치의 'v1'·'v3' 글자는 이 값을 CSS로만 보이고 낭독 대체 글자는 비운다", async () => {
    await open("/profile/profile-1?v=1&diff=3");
    const table = await diffTable();
    const headers = within(table).getAllByRole("columnheader").map((th) => th.textContent);
    expect(headers).toEqual(["항목", "v1", "v3", "차이"]);
    const bodyRows = within(table).getAllByRole("row").slice(1);
    for (const row of bodyRows) {
      const [, a, b] = [...row.children] as HTMLElement[];
      expect([a?.dataset.col, b?.dataset.col]).toEqual([headers[1], headers[2]]);
    }
    expect(CSS).toContain('.version-diff td[data-col]::before { @apply max-md:mr-2 max-md:font-normal max-md:text-label-alternative; @variant max-md { content: attr(data-col) / ""; } }');
  });

  it("<768 쌓기 규칙(versionDiff.css): 표·caption·본문은 블록, 행은 세로 줄, 열 머리글은 숨기지 않고 sr-only(열 관계 유지)", async () => {
    await open("/profile/profile-1?v=1&diff=3");
    expect(await diffTable()).toHaveClass("version-diff");
    expect(INDEX_CSS).toContain('@import "./styles/versionDiff.css";');
    expect(CSS).toContain(".version-diff, .version-diff > caption, .version-diff > tbody { @apply max-md:block; }");
    expect(CSS).toContain(".version-diff > thead { @apply max-md:sr-only; }");
    expect(CSS).not.toMatch(/max-md:hidden|display: none/);
    expect(CSS).toContain(".version-diff > tbody > tr { @apply max-md:flex max-md:flex-col max-md:py-1.5; }");
    expect(CSS).toContain(".version-diff > tbody :is(th, td) { @apply max-md:p-0; }");
  });

  it("768: 항목(열·행 머리글)·차이 열은 줄바꿈 없음 — 값은 body의 keep-all로 어절 단위", async () => {
    await open("/profile/profile-1?v=1&diff=3");
    const table = await diffTable();
    expect(CSS).toContain(".version-diff :is(thead th:first-child, thead th:last-child, tbody th, td:last-child) { @apply whitespace-nowrap; }");
    const [item, , , change] = within(table).getAllByRole("columnheader");
    expect(item!.matches("thead th:first-child")).toBe(true);
    expect(change!.matches("thead th:last-child")).toBe(true);
    for (const th of within(table).getAllByRole("rowheader")) expect(th.matches("tbody th")).toBe(true);
  });

  it("중복 낭독 0: 제목·항목 이름이 DOM에 한 번씩, 표 이름 = caption, 셀 이름에 열 이름을 덧붙이는 aria 속성 없음", async () => {
    await open("/profile/profile-1?v=1&diff=3");
    const table = await diffTable();
    expect(screen.getAllByText("v1과 v3 비교")).toHaveLength(1);
    for (const th of within(table).getAllByRole("rowheader")) expect(within(table).getAllByText(th.textContent!)).toHaveLength(1);
    expect(table.querySelectorAll("[aria-label], [aria-describedby], [aria-labelledby]")).toHaveLength(0);
  });
});

describe("N1 버전 줄 요약 (A-05)", () => {
  it("<768은 요약이 줄 전체 폭 둘째 줄(basis-full), 768부터 남은 폭(md:flex-1)", async () => {
    await open("/profile/profile-1");
    const row = screen.getByRole("listitem", { name: /^v2 / });
    const summary = within(row).getByText(/외 \d+$|·/, { selector: "span.ds-caption1" });
    expect(summary).toHaveClass("basis-full", "md:basis-auto", "md:flex-1");
    expect(summary).not.toHaveClass("flex-1");
  });
});
