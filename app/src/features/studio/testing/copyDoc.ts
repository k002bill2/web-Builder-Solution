import { readFileSync } from "node:fs";

/** 확정 문안(dev/active/m4b-impl/COPY.md) — `## <제목>` 다음 첫 펜스 블록 본문(펜스 줄 제외 · 끝 줄바꿈 없음). 테스트 cwd = app */
const COPY = readFileSync("../dev/active/m4b-impl/COPY.md", "utf8").split("\n");

export function copyBlock(heading: string): string {
  const at = COPY.indexOf(`## ${heading}`);
  if (at < 0) throw new Error(`COPY.md에 '## ${heading}' 없음`);
  const open = COPY.findIndex((line, i) => i > at && /^(```|~~~)/.test(line));
  const fence = COPY[open]!.slice(0, 3);
  const close = COPY.findIndex((line, i) => i > open && line === fence);
  return COPY.slice(open + 1, close).join("\n");
}
