/** M2C-1 변환기 공개 타입 — PLAN 2절 시그니처 고정(M2C-3가 쓴다). */
export type ImageFormat = "jpeg" | "png" | "webp";

export type IngestErrorCode = "TYPE_MISMATCH" | "TOO_LARGE" | "TOO_MANY_PIXELS" | "DECODE_FAILED";

export interface IngestedImage {
  readonly variants: Partial<Record<640 | 1280 | 1920 | number, Blob>>;
  /** 방향 적용 뒤 원본 픽셀 크기(SPEC 3절) */
  readonly width: number;
  readonly height: number;
  readonly format: ImageFormat;
  /** 보관 바이트 = 파생본 크기 합계(SPEC 2.3 문서·탭 한도의 기준) */
  readonly bytes: number;
}

export type IngestResult =
  | { readonly ok: true; readonly image: IngestedImage }
  | { readonly ok: false; readonly code: IngestErrorCode; readonly detail?: string };

export type IngestFailure = Extract<IngestResult, { ok: false }>;
