import type { SectionType } from "../domain/compareBoard";

/** V4 RED 자리 — 표는 GREEN에서 채운다 */
export const SAMPLE_COPY: Readonly<Record<string, string>> = {};
export const sampleCopyOf = (type: SectionType, key: string): string | undefined => SAMPLE_COPY[`${type}/${key}`];
