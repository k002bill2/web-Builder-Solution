// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * tryLock 직접 호출 가드 (RS3-AC-04 · rs23-port-gaps 항목 2) — 프로필·/projects 흐름 코드는 파괴 흐름 공유 tabLockHold만 쓰고
 * writerLock 의 tryLock 을 직접 끌어오지 않는다. 텍스트 정규식 대신 주석을 지운 뒤 import 그래프로 판정한다:
 * writerLock 모듈에서 tryLock 을 이름(별칭 포함)으로 가져와 쓰거나, 네임스페이스·동적 import 로 writerLock 을 끌어오면 위반.
 * `import type` 은 번들에 남지 않아 허용한다(pendingImportGuard.test.ts 와 같은 방식).
 */
const SRC = fileURLToPath(new URL("../", import.meta.url));
const FILES = [
  "features/profile/restartFlow.ts",
  "features/profile/RestartDialog.tsx",
  "features/profile/CandidatesSection.tsx",
  "components/projects/ProjectRow.tsx",
] as const;

const isWriterLock = (spec: string) => /(^|\/)writerLock(\.tsx?)?$/.test(spec);
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
const IMPORT = /\bimport\s+(?!type\b)([^"';]*?)\s*\bfrom\s*["']([^"']+)["']/g;
const DYNAMIC = /\bimport\s*\(\s*["'`]([^"'`]+)["'`]/g;
const used = (code: string, name: string) => new RegExp(`(^|[^\\w$.])${name.replace(/\$/g, "\\$")}\\b`).test(code);

export type TryLockEdge = { readonly kind: "named" | "namespace" | "dynamic"; readonly local: string };

export function tryLockEdges(text: string): TryLockEdge[] {
  const code = stripComments(text);
  const edges: TryLockEdge[] = [];
  for (const [whole, clause = "", spec = ""] of code.matchAll(IMPORT)) {
    if (!isWriterLock(spec)) continue;
    const rest = code.replace(whole, "");
    const ns = /\*\s*as\s+([\w$]+)/.exec(clause);
    if (ns) edges.push({ kind: "namespace", local: ns[1] ?? "" });
    for (const part of /\{([^}]*)\}/.exec(clause)?.[1]?.split(",") ?? []) {
      const m = /^\s*(?!type\b)tryLock(?:\s+as\s+([\w$]+))?\s*$/.exec(part);
      const local = m ? (m[1] ?? "tryLock") : undefined;
      if (local && used(rest, local)) edges.push({ kind: "named", local });
    }
  }
  for (const [, spec = ""] of code.matchAll(DYNAMIC)) if (isWriterLock(spec)) edges.push({ kind: "dynamic", local: spec });
  return edges;
}

describe("tryLockGuard — 검출기 자체", () => {
  it("주석 속 tryLock 단어 · import type · 다른 모듈 · tabLockHold 사용 = 통과", () => {
    const text = [
      "/** tryLock 직접 호출 금지 — tabLockHold 만 쓴다 */",
      "// tryLock(locks) 는 쓰지 않는다",
      'import type { WriterLocks } from "../../data/persistence/writerLock";',
      'import { type tryLock as T } from "../../data/persistence/writerLock";',
      'import { tabLockHold } from "../projects/tabLockHold";',
      'import { tryLock } from "./otherLock";',
      'const url = "https://example.invalid/tryLock";',
      "await tabLockHold(link, locks).acquire(); tryLock(x);",
    ].join("\n");
    expect(tryLockEdges(text)).toEqual([]);
  });

  it("이름·별칭·네임스페이스·동적 import = 위반", () => {
    expect(tryLockEdges('import { tryLock } from "../../data/persistence/writerLock";\nawait tryLock(locks);')).toEqual([{ kind: "named", local: "tryLock" }]);
    expect(tryLockEdges('import { WRITER_LOCK, tryLock as grab } from "../data/persistence/writerLock.ts";\nconst r = await grab(locks);')).toEqual([{ kind: "named", local: "grab" }]);
    expect(tryLockEdges('import * as w from "../../data/persistence/writerLock";\nawait w.tryLock(locks);')).toEqual([{ kind: "namespace", local: "w" }]);
    expect(tryLockEdges('const m = await import("../../data/persistence/writerLock");')).toEqual([{ kind: "dynamic", local: "../../data/persistence/writerLock" }]);
  });
});

describe("tryLockGuard — 대상 파일 tryLock 직접 간선 0", () => {
  it.each(FILES)("%s → writerLock tryLock 직접 간선 0", (rel) => {
    expect(tryLockEdges(readFileSync(join(SRC, rel), "utf8"))).toEqual([]);
  });
});
