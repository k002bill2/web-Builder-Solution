import type { KitTokenInput } from "../protocol";

/** 테스트 전용 킷 토큰 입력 — 팔레트 5역할이 서로 다른 값(역할 역추적용, K-AC-11) */
export const SAMPLE_KIT_TOKENS: KitTokenInput = Object.freeze({
  palette: { primary: "rgb(10, 92, 54)", surface: "rgb(244, 240, 232)", ink: "rgb(26, 26, 26)", muted: "rgb(110, 110, 110)", bg: "rgb(255, 255, 255)" },
  card: { tone: "light", style: "bordered-md" },
  type: { family: "Pretendard", headingWeight: 700, bodyWeight: 400, scale: 1.25 },
  space: { grid: 8, sectionGap: 96, density: "comfortable" },
  mediaRatio: "4:5",
}) as KitTokenInput;
