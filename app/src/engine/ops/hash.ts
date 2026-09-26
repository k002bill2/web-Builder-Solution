/**
 * 문서 내용 해시 — 동기·결정적(SPEC 8.2 `hashDoc`). 키 정렬 정규 JSON + FNV-1a 64(비암호).
 * 같은 내용 = 같은 해시(키 순서 무관). hash·revision·updatedAt은 저장 메타라 뺀다
 * (넣으면 저장마다 해시가 바뀌어 게이트 "편집 전 기준"(E-S25)·멱등 키(revision, hash)가 무의미해진다).
 */
import type { PageDoc } from "../contracts/pageDoc";

/** 키를 재귀 정렬한 JSON. 배열 순서는 유지, 값이 undefined인 키는 생략 */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((v) => (v === undefined ? "null" : canonicalJson(v))).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .filter((k) => (value as Record<string, unknown>)[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

const OFFSET = 0xcbf29ce484222325n;
const PRIME = 0x100000001b3n;
const MASK = 0xffffffffffffffffn;
const encoder = new TextEncoder();

/** FNV-1a 64 over UTF-8 bytes → 16진 16자 */
export function fnv1a64(text: string): string {
  let h = OFFSET;
  for (const byte of encoder.encode(text)) {
    h = ((h ^ BigInt(byte)) * PRIME) & MASK;
  }
  return h.toString(16).padStart(16, "0");
}

/** 해시 대상에서 빼는 저장 메타 */
const STORAGE_META: ReadonlySet<string> = new Set(["hash", "revision", "updatedAt"]);

export function hashDoc(doc: PageDoc): string {
  const content = Object.fromEntries(Object.entries(doc).filter(([key]) => !STORAGE_META.has(key)));
  return `fnv1a64:${fnv1a64(canonicalJson(content))}`;
}
