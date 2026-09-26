/**
 * 슬롯 스키마 조립 도우미 — 정의 파일을 짧게 유지한다.
 */
import type { SlotSchemaEntry } from "../contracts/sectionDefinition";

interface Opts {
  readonly required?: boolean;
  readonly recommended?: number;
  readonly text?: string;
}

function entry(kind: SlotSchemaEntry["kind"], key: string, label: string, maxLength: number, opts: Opts): SlotSchemaEntry {
  return {
    key,
    label,
    kind,
    maxLength,
    required: opts.required ?? false,
    ...(opts.recommended === undefined ? {} : { recommendedLength: opts.recommended }),
    ...(opts.text === undefined ? {} : { defaultText: opts.text }),
  };
}

export const short = (key: string, label: string, max: number, opts: Opts = {}) => entry("short-text", key, label, max, opts);
export const long = (key: string, label: string, max: number, opts: Opts = {}) => entry("long-text", key, label, max, opts);
export const link = (key: string, label: string, max: number, opts: Opts = {}) => entry("link-label", key, label, max, opts);
/** 이미지 슬롯 — maxLength = 대체텍스트 상한 */
export const image = (key: string, label: string) => entry("image", key, label, 120, {});

/** 섹션 제목 — 본문 공통 (h2) */
export const heading = (text: string) => short("heading", "섹션 제목", 40, { required: true, recommended: 28, text });
