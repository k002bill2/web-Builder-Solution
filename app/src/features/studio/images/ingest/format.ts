/**
 * 포맷 결정 (SPEC 2.4): 1순위 WebP 0.82 · 미지원이면 투명 없음 → JPEG 0.85 · 투명 있음 → PNG(JPEG는 투명을 검게 만든다).
 * WebP 미지원 = 인코딩 결과 `blob.type`이 image/webp가 아님(미지원 형식 요청은 PNG로 조용히 떨어진다).
 */
import type { ImageFormat } from "./types";

export interface EncodeChoice {
  readonly format: ImageFormat;
  readonly type: string;
  readonly quality?: number;
}

const WEBP: EncodeChoice = { format: "webp", type: "image/webp", quality: 0.82 };
const JPEG: EncodeChoice = { format: "jpeg", type: "image/jpeg", quality: 0.85 };
const PNG: EncodeChoice = { format: "png", type: "image/png" };

export function chooseFormat(alpha: boolean, webp: boolean): EncodeChoice {
  if (webp) return WEBP;
  return alpha ? PNG : JPEG;
}

/** 감지 결과는 인코더(키)마다 1번만 재고 기억한다(탭에서 1회 — 기본 인코더는 하나). 시험 인코딩이 던지면 미지원. */
const probes = new WeakMap<object, Promise<boolean>>();

export function probeWebp(key: object, encodeProbe: () => Promise<Blob>): Promise<boolean> {
  const known = probes.get(key);
  if (known) return known;
  const probe = encodeProbe().then(
    (blob) => blob.type === WEBP.type,
    () => false,
  );
  probes.set(key, probe);
  return probe;
}
