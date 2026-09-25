import type { LicenseStatus } from "../../domain/reference";
import type { TagTone } from "../ds/Tag";

/** 라이선스 Tag 색 (카드·상세 공통). */
export const LICENSE_TONE: Readonly<Record<LicenseStatus, TagTone>> = Object.freeze({
  internal: "green",
  licensed: "violet",
  external_observed: "neutral",
});

/** ISO 날짜(YYYY-MM-DD) → 목업 표기(YYYY.MM.DD). */
export const formatDate = (iso: string) => iso.replaceAll("-", ".");
