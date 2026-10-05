/**
 * 폭 사다리 (SPEC 2.4): 가로 폭 640·1280·1920. 원본 폭보다 큰 단계는 만들지 않는다(업스케일 0).
 * 원본 폭이 1920 미만이고 단계와 다르면 원본 폭 1단을 맨 위에 더한다(1500 → 640·1280·1500 · 500 → 500).
 */
export const WIDTH_STEPS = [640, 1280, 1920] as const;
const TOP_STEP = 1920;

export function widthLadder(width: number): number[] {
  const steps: number[] = WIDTH_STEPS.filter((step) => step <= width);
  return width < TOP_STEP && !steps.includes(width) ? [...steps, width] : steps;
}

export const variantHeight = (srcWidth: number, srcHeight: number, width: number): number =>
  Math.max(1, Math.round((srcHeight * width) / srcWidth));
