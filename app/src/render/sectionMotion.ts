import type { SectionInstance, SectionMotion } from "../engine/contracts/pageDoc";
import { getSectionDefinition } from "../engine/sections/registry";

/**
 * 섹션 루트 data-motion (M2B-4b · SPEC-MOTION-FONT 1.3·1.4 · MF-AC-U1) — 실효 레벨 = min(section.motion, 변형 maxMotion), L0 = 속성 없음.
 * 등장은 첫 화면만: main 문서 순서상 첫 hero + 그 뒤 2자리(hero가 없으면 main 첫 2자리) · hero 앞 본문 = 0. 위치는 데이터로 판정한다(CSS :nth-child 0).
 * header = 시트 열림만이라 위치와 무관 · footer·faq·contact = 모션 0(자리는 차지). 재생 스위치 data-motion-play는 렌더 문서가 쓰지 않는다.
 */
const STILL = /^(footer|faq|contact)$/;
const FIRST_AFTER_HERO = 2;

/** main 안 첫 화면 섹션 instanceId */
export function firstScreenIds(main: readonly SectionInstance[]): ReadonlySet<string> {
  const hero = main.findIndex((s) => s.type === "hero");
  const first = hero < 0 ? main.slice(0, FIRST_AFTER_HERO) : main.slice(hero, hero + 1 + FIRST_AFTER_HERO);
  return new Set(first.map((s) => s.instanceId));
}

export function motionOf(section: SectionInstance, firstScreen: boolean): SectionMotion | undefined {
  if (STILL.test(section.type) || (section.type !== "header" && !firstScreen)) return undefined;
  const max = getSectionDefinition(section.type, section.variant)?.constraints.maxMotion;
  if (!max) return undefined;
  // "L0" < "L1" < "L2" — 같은 길이 문자열 비교 = 레벨 순서
  const level = section.motion < max ? section.motion : max;
  return level === "L0" ? undefined : level;
}
