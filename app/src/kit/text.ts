import type { ImageSlotValue, PageDoc, SectionInstance } from "../engine/contracts/pageDoc";
import type { HeroTop, KitLinks } from "./types";

/** 글자 슬롯 값 — 공백뿐이면 undefined(0.8 빈 요소 0). 값은 바꾸지 않고 그대로 낸다(K-AC-03 입력 = 출력) */
export function slotText(section: SectionInstance, key: string): string | undefined {
  const value = section.slots[key];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

/** 이미지 슬롯 — 꺼짐·없음 = undefined(0.8) */
export function slotImage(section: SectionInstance, key: string): ImageSlotValue | undefined {
  const value = section.slots[key];
  return typeof value === "object" && value.enabled ? value : undefined;
}

/** 메뉴·하단 링크 나누기 (0.10) — 가운뎃점 · 로 나눠 앞뒤 공백 제거, 빈 조각 버림, 순서 유지 */
export const splitItems = (text: string | undefined): readonly string[] =>
  (text ?? "")
    .split("·")
    .map((part) => part.trim())
    .filter((part) => part !== "");

export const anchorOf = (instanceId: string) => `#s-${instanceId}`;

/**
 * 링크 대상 (0.10 · MQ-2) — CTA = 첫 contact 섹션 → 없으면 footer → 없으면 대상 없음(버튼 모양 글자).
 * 메뉴 항목 = 본문 섹션 heading 글자(앞뒤 공백 제거)와 정확히 같으면 첫 일치 섹션 앵커.
 */
export function kitLinks(doc: PageDoc): KitLinks {
  const target = doc.sections.find((s) => s.type === "contact") ?? doc.sections.find((s) => s.type === "footer");
  const headings = new Map<string, string>();
  for (const section of doc.sections) {
    const heading = slotText(section, "heading")?.trim();
    if (heading && !headings.has(heading)) headings.set(heading, anchorOf(section.instanceId));
  }
  const top = heroTop(doc);
  return { ...(target && { cta: anchorOf(target.instanceId) }), headings, ...(top && { heroTop: top }) };
}

/**
 * hero 맨 위 면 (D-1 · B-3 표) — 첫 본문 섹션(header 아닌 첫 섹션)이 hero일 때만. 섹션 톤 면 = base bg · alt surface.
 * 문서 데이터만 읽는다(DOM·:has() 0 → 캔버스·정적 HTML 같은 결과). 모르는 변형(킷 없음) = 값 없음.
 */
function heroTop(doc: PageDoc): HeroTop | undefined {
  const hero = doc.sections.find((s) => s.type !== "header");
  if (hero?.type !== "hero") return undefined;
  const tone = hero.tone === "alt" ? "surface" : "bg";
  const image = slotImage(hero, "image") ? "media" : undefined;
  const faces: Readonly<Record<string, HeroTop | undefined>> = { "fullbleed-left": image ?? "primary", center: "primary", image: image ?? tone, split: tone, grid: tone, text: tone };
  return faces[hero.variant];
}
