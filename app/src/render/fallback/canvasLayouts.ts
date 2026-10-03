import type { SectionType } from "../../engine/contracts/pageDoc";
import type { CanvasPalette } from "../protocol";

/**
 * 캔버스 변형별 모양 표 (SPEC r4.7 A3-Q7 · 5.7) — 렌더 문서 와이어프레임 폴백(ADR-004 개정 2 결정 3, M2A-1에서 features/studio에서 옮김). 표는 이 파일 하나. 키 = `type/variant`, 모르는 쌍 = 기본 블록(예외 0).
 * 색은 캔버스 루트의 `--canvas-*` 변수(문서 프로필 버전 팔레트)만 쓴다 — 컴포넌트 hex 0, 불투명도 글자 0.
 */
export type CanvasLayout = "bar" | "cover" | "center" | "split" | "tiles" | "text" | "image" | "cols3" | "cols2" | "masonry" | "list" | "form" | "band" | "dark" | "block";

const BY_LAYOUT: Readonly<Record<Exclude<CanvasLayout, "block">, string>> = {
  bar: "header/sticky-right-cta header/sticky-hamburger header/sticky-two-tier header/transparent",
  cover: "hero/fullbleed-left",
  center: "hero/center",
  split: "hero/split about/story",
  tiles: "hero/grid",
  text: "hero/text about/text",
  image: "hero/image",
  cols3: "services/cards-3 portfolio/grid-3 statistics/stats-3",
  cols2: "services/cards-2 portfolio/grid-2 testimonials/quotes-2 pricing/tiers-2",
  masonry: "services/cards-masonry portfolio/masonry",
  list: "services/list faq/accordion",
  form: "contact/form contact/booking",
  band: "cta-band/banner",
  dark: "footer/biz-extended footer/biz-extended-map footer/minimal footer/minimal-biz",
};
const TABLE = new Map(Object.entries(BY_LAYOUT).flatMap(([layout, keys]) => keys.split(" ").map((key) => [key, layout as CanvasLayout])));

export const canvasLayout = (type: SectionType, variant: string): CanvasLayout => TABLE.get(`${type}/${variant}`) ?? "block";

/**
 * 모양별 클래스(Tailwind 리터럴 — 조합하지 않는다). face = 블록 면·글자 색, row = 머리(카피)와 이미지 배치, head = 카피 묶음,
 * items = 번호 슬롯 칸(card1… · image1… · q1…) 배치, cell = 칸 하나. `media: false` = 머리 이미지는 전면 색 면이 대신한다.
 */
export interface CanvasLook {
  readonly face?: string;
  readonly row?: string;
  readonly head?: string;
  readonly items?: string;
  readonly media?: false;
  readonly big?: true;
}
const ON_PRIMARY = "bg-(--canvas-primary) text-(--canvas-bg)";
const CELLS = "grid gap-2 grid-cols-3";
export const CANVAS_LOOKS: Readonly<Record<CanvasLayout, CanvasLook>> = {
  bar: { head: "flex-row flex-wrap items-baseline gap-x-4" },
  cover: { face: `${ON_PRIMARY} py-10`, head: "w-3/5", media: false, big: true },
  center: { face: `${ON_PRIMARY} py-10`, head: "items-center text-center", media: false, big: true },
  split: { row: "flex-row items-stretch", big: true },
  tiles: { row: "flex-row-reverse items-end", head: "bg-(--canvas-surface) p-3", big: true },
  text: { face: "py-8", big: true },
  image: { row: "flex-col", big: true },
  cols3: { items: CELLS },
  cols2: { items: "grid gap-2 grid-cols-2" },
  masonry: { items: "columns-3 gap-2 *:mb-2 *:break-inside-avoid" },
  list: { items: "flex flex-col divide-y divide-(--canvas-muted)" },
  form: {},
  band: { face: ON_PRIMARY, head: "flex-row flex-wrap items-baseline justify-between gap-x-4" },
  dark: { face: "bg-(--canvas-ink) text-(--canvas-bg)" },
  block: {},
};

export type { CanvasPalette };
/** 조회 전·실패 = 중립 토큰(앱 색) */
const NEUTRAL: CanvasPalette = { primary: "var(--label-neutral)", surface: "var(--fill-normal)", ink: "var(--label-normal)", muted: "var(--fill-strong)", bg: "var(--background-normal)" };

export function canvasVars(palette: CanvasPalette | undefined): Readonly<Record<string, string>> {
  return Object.fromEntries(Object.entries(NEUTRAL).map(([role, value]) => [`--canvas-${role}`, palette?.[role as keyof CanvasPalette] ?? value]));
}

/** 슬롯 키 끝 번호로 묶는다 — 번호 없음 = 머리(제목·소개·버튼), 번호 있음 = 칸(card1Title+card1Body …). 스키마 순서 유지 */
export function groupSlots<T extends { readonly key: string }>(slots: readonly T[]): { readonly head: readonly T[]; readonly cells: readonly (readonly T[])[] } {
  const cells = new Map<string, T[]>();
  const head: T[] = [];
  for (const slot of slots) {
    const n = /\d+/.exec(slot.key)?.[0];
    if (n === undefined) head.push(slot);
    else cells.set(n, [...(cells.get(n) ?? []), slot]);
  }
  return { head, cells: [...cells.values()] };
}
