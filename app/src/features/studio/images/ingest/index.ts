/** M2C-1 이미지 변환기 공개 진입점 — M2C-3가 파일을 고른 순간 동적 import한다(SPEC 2.1). */
export { ingestImage } from "./ingestImage";
export { ingestErrorMessage } from "./messages";
export { browserIngestDeps, type IngestBitmap, type IngestDeps } from "./deps";
export type { ImageFormat, IngestedImage, IngestErrorCode, IngestFailure, IngestResult } from "./types";
