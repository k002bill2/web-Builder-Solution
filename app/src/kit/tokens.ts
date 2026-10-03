import type { KitTokenInput } from "../render/protocol";

/**
 * 킷 토큰 생성기 (M2A-2a K1 · m2a 0.3~0.5) — 킷 토큰 입력 → 사이트 CSS 변수 `--site-*`. 순수 · 결정적(키 순서 고정, 숫자 소수 4자리).
 * 단위는 rem(root = 사용자 브라우저 기본 글자 크기 t0)·ch·비율만 — px·hex·vh 0(K-AC-01·07). 앱 DS 토큰을 참조하지 않는다.
 */
const num = (n: number) => String(Number(n.toFixed(4)));
const rem = (n: number) => (n === 0 ? "0" : `${num(n)}rem`);
/** 흰색 고정 — 팔레트 역할이 아니라 게이트 C-1의 글자색(`contrast.ts` ON_PRIMARY와 같은 값, src/test에서 대조) */
export const SITE_ON_PRIMARY = "rgb(255 255 255)";
/** 간격 단계 s1~s6 = grid × 배수 */
const STEPS = [0.5, 1, 1.5, 2, 3, 4] as const;
const TYPE_STEPS = [-1, 0, 1, 2, 3, 4, 5] as const;
const CARD: Readonly<Record<KitTokenInput["card"]["style"], readonly [radius: string, stroke: string, shadow: string]>> = {
  "bordered-lg": ["var(--site-r2)", "var(--site-stroke-1)", "none"],
  "bordered-md": ["var(--site-r1)", "var(--site-stroke-1)", "none"],
  elevated: ["var(--site-r1)", "0", "var(--site-shadow-1)"],
  flat: ["0", "0", "none"],
};

const fontStack = (family: string) => (/serif/i.test(family) && !/sans/i.test(family) ? `"${family}", serif` : `"${family}", system-ui, sans-serif`);

export function kitVars(input: KitTokenInput): Readonly<Record<string, string>> {
  const { palette, card, type, space, mediaRatio } = input;
  const g = space.grid / 16;
  const [radius, stroke, shadow] = CARD[card.style];
  const compact = space.density === "compact";
  return {
    "--site-primary": palette.primary,
    "--site-surface": palette.surface,
    "--site-ink": palette.ink,
    "--site-muted": palette.muted,
    "--site-bg": palette.bg,
    "--site-on-primary": SITE_ON_PRIMARY,
    "--site-font": fontStack(type.family),
    "--site-weight-heading": String(type.headingWeight),
    "--site-weight-body": String(type.bodyWeight),
    ...Object.fromEntries(TYPE_STEPS.map((n) => [`--site-t${n}`, rem(type.scale ** n)])),
    ...Object.fromEntries(STEPS.map((m, i) => [`--site-s${i + 1}`, rem(g * m)])),
    "--site-section-gap": rem(space.sectionGap / 16),
    "--site-section-gap-narrow": rem(space.sectionGap / 32),
    "--site-card-pad": compact ? "var(--site-s4)" : "var(--site-s5)",
    "--site-card-pad-narrow": compact ? "var(--site-s3)" : "var(--site-s4)",
    "--site-r1": rem(g),
    "--site-r2": rem(g * 2),
    "--site-radius-card": radius,
    "--site-radius-control": card.style === "bordered-lg" ? "var(--site-r2)" : "var(--site-r1)",
    "--site-stroke-1": "0.0625rem",
    "--site-stroke-2": "0.125rem",
    "--site-card-stroke": stroke,
    "--site-shadow-1": "0 0.125rem 0.5rem color-mix(in srgb, var(--site-ink) 16%, transparent)",
    "--site-card-shadow": shadow,
    "--site-hit-min": "2.75rem",
    "--site-prose-max": "60ch",
    "--site-content-max": "72rem",
    "--site-header-offset": "calc(2 * (var(--site-hit-min) + 2 * var(--site-s2)))",
    "--site-media-ratio": mediaRatio.replace(":", " / "),
  };
}

/** 같은 입력 = 같은 문자열 — 정적 HTML(M2A-3)에도 이 문자열을 쓴다 */
export const kitCssText = (input: KitTokenInput) =>
  Object.entries(kitVars(input))
    .map(([name, value]) => `${name}: ${value};`)
    .join(" ");
