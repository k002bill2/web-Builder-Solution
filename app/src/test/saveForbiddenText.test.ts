/**
 * RS6-AC-G3 · UX5-AC-14 — UX-5 2.4 금지 문구가 앱 소스(테스트 제외)에 0건. 주석은 화면 문구가 아니라 뺀다
 * (`features/pending/DiscardConfirm.tsx:3` 주석 "자동 복구가 아니다" — 부정 서술).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const FORBIDDEN = ["저장 버튼을 누르세요", "⌘S", "Ctrl+S로 저장", "편집기에서 한 번 저장하세요", "자동 복구", "안전하게 보관됩니다", "모든 편집이 저장됐습니다", "방금 편집이 저장됐습니다"];
const ROOT = join(__dirname, "..");

/** 블록·줄 주석 제거(문자열 안 `//`는 URL뿐이라 금지 문구와 겹치지 않는다) */
const code = (path: string) => readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("RS6-AC-G3 금지 문구 0", () => {
  it.each(FORBIDDEN)("%s = 0건", (text) => {
    expect(sources(ROOT).filter((path) => code(path).includes(text))).toEqual([]);
  });
});
