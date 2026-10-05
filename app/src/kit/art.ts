/**
 * 자체 그래픽 — 토큰 기반 결정적 SVG 도형 (SPEC m2c 4절 · MQ-C6 ★A). 부작용 없음.
 * 시드 = (patternId, type, variant, slotKey) 문자열 → FNV-1a 32비트 → mulberry32. instanceId·시각·Math.random·뷰포트 폭은 넣지 않는다
 * (3안 비교에서 같은 변형 = 같은 그림, 차이는 토큰 색만). 좌표는 viewBox 0~100 · 소수 1자리(직렬화 바이트 고정) · 색 값 0(class만, kit.css가 --site-* 토큰으로 칠).
 */
export type ArtFamily = "diagonal" | "circles" | "dots";
export interface ArtShape {
  readonly tag: "rect" | "circle" | "polygon";
  /** kit-art-bg(배경) · kit-art-1~3(도형) */
  readonly cls: string;
  readonly attrs: Readonly<Record<string, string>>;
}

const FAMILIES: readonly ArtFamily[] = ["diagonal", "circles", "dots"];

export const artSeed = (patternId: string, type: string, variant: string, slot: string) => [patternId, type, variant, slot].join("|");

function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return hash;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const n1 = (n: number) => String(Math.round(n * 10) / 10);
const art = (k: number) => `kit-art-${(k % 3) + 1}`;

/** ① 대각 띠 2~4개(오른쪽 위 → 왼쪽 아래 평행사변형) */
const diagonal = (rand: () => number): ArtShape[] =>
  Array.from({ length: 2 + Math.floor(rand() * 3) }, (_, i) => {
    const o = 10 + rand() * 150;
    const w = 8 + rand() * 18;
    return { tag: "polygon", cls: art(i), attrs: { points: `${n1(o)},0 ${n1(o + w)},0 ${n1(o + w - 100)},100 ${n1(o - 100)},100` } };
  });

/** ② 겹친 원 2~3개 */
const circles = (rand: () => number): ArtShape[] =>
  Array.from({ length: 2 + Math.floor(rand() * 2) }, (_, i) => ({
    tag: "circle",
    cls: art(i),
    attrs: { cx: n1(15 + rand() * 70), cy: n1(15 + rand() * 70), r: n1(18 + rand() * 27) },
  }));

/** ③ 모서리 밖 큰 원(원호로 보임) + 점 격자 3×3 */
function dots(rand: () => number): ArtShape[] {
  const arc: ArtShape = { tag: "circle", cls: art(0), attrs: { cx: n1(60 + rand() * 45), cy: n1(60 + rand() * 45), r: n1(35 + rand() * 25) } };
  const [x0, y0, gap, r] = [10 + rand() * 20, 10 + rand() * 20, 10 + rand() * 5, 1.5 + rand() * 1.5];
  const grid = Array.from({ length: 9 }, (_, i): ArtShape => ({
    tag: "circle",
    cls: art(2),
    attrs: { cx: n1(x0 + (i % 3) * gap), cy: n1(y0 + Math.floor(i / 3) * gap), r: n1(r) },
  }));
  return [arc, ...grid];
}

const DRAW: Readonly<Record<ArtFamily, (rand: () => number) => ArtShape[]>> = { diagonal, circles, dots };
const BACKGROUND: ArtShape = { tag: "rect", cls: "kit-art-bg", attrs: { width: "100", height: "100" } };

/** 시드 → 도형 계열 1개 + 도형(배경 포함 ≤ 12) */
export function artShapes(seed: string): { readonly family: ArtFamily; readonly shapes: readonly ArtShape[] } {
  const hash = fnv1a(seed);
  const family = FAMILIES[hash % FAMILIES.length]!;
  return { family, shapes: [BACKGROUND, ...DRAW[family](mulberry32(hash))] };
}
