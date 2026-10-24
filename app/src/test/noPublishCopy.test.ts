// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * SMP-AC-A05 (SAMPLE-SPEC 3.1 · ADR-009 1절 6) — 사용자 노출 문자열에 구축·발행 약속 문구 0건.
 * 대상: src의 *.ts·*.tsx(테스트·테스트 도우미 제외), 주석은 지우고 본다.
 */
const SRC = fileURLToPath(new URL("../", import.meta.url));
const FORBIDDEN = ["발행", "정적 사이트", "게시"];
/** 허용 목록 — 앱 자체 배포 안내(SAMPLE-SPEC 3.1 유지 목록) */
const ALLOWED = ["배포되었을 수 있으니"];

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

const isTestCode = (path: string) => /\.test\.tsx?$/.test(path) || path.startsWith("test/") || path.includes("/testing/");
/** 블록 주석 · 줄 주석 제거(문자열 안 `://`는 남긴다) */
const stripComments = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const scanned = listFiles(SRC)
  .map((file) => relative(SRC, file))
  .filter((path) => /\.tsx?$/.test(path) && !isTestCode(path));

function hits(code: string): string[] {
  return stripComments(code)
    .split("\n")
    .filter((line) => FORBIDDEN.some((word) => line.includes(word)) && !ALLOWED.some((ok) => line.includes(ok)))
    .map((line) => line.trim());
}

describe("SMP-AC-A05 구축·발행 약속 문구 가드", () => {
  it("검사 대상이 있다", () => {
    expect(scanned.length).toBeGreaterThan(100);
  });

  it("검사기가 금지어·주석·허용 목록을 구분한다", () => {
    expect(hits(`const a = "정적 사이트(zip)";\n// 발행\n/** 게시 */`)).toEqual([`const a = "정적 사이트(zip)";`]);
    expect(hits(`const b = "새 버전이 배포되었을 수 있으니";`)).toEqual([]);
  });

  it.each(FORBIDDEN)("'%s' 0건", (word) => {
    const found = scanned.flatMap((path) => hits(readFileSync(join(SRC, path), "utf8")).filter((line) => line.includes(word)).map((line) => `${path}: ${line}`));
    expect(found).toEqual([]);
  });
});
