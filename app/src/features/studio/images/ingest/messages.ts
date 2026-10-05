/** 실패 문구 (SPEC 2.3 표 그대로) — 필드 오류로 보여 준다. */
import type { IngestErrorCode, IngestFailure } from "./types";

const MESSAGES: Readonly<Record<IngestErrorCode, string>> = {
  TYPE_MISMATCH: "JPEG·PNG·WebP 이미지만 쓸 수 있습니다",
  TOO_LARGE: "10MB까지 쓸 수 있습니다",
  TOO_MANY_PIXELS: "4천만 화소까지 쓸 수 있습니다",
  DECODE_FAILED: "이미지 파일을 읽을 수 없습니다",
};

export function ingestErrorMessage(failure: IngestFailure): string {
  const base = MESSAGES[failure.code];
  return failure.detail === undefined ? base : `${base} (${failure.detail})`;
}
