// QA 전용: dist/.vite/manifest.json에서 정적 import closure를 계산한다 (번들 스크립트와 같은 규칙, 대조용)
import { readFileSync } from "node:fs";
const m = JSON.parse(readFileSync(process.argv[2], "utf8"));
const closure = (keys) => {
  const out = new Set();
  const visit = (k) => { const e = m[k]; if (!e || out.has(e.file)) return; out.add(e.file); (e.imports ?? []).forEach(visit); };
  keys.forEach(visit);
  return [...out].sort();
};
const entry = Object.keys(m).find((k) => m[k].isEntry);
const groups = {
  COMMON: [entry],
  PROFILE_PAGE: [entry, "src/pages/ProfilePage.tsx"],
  PROFILE_AUTO: [entry, "src/pages/ProfilePage.tsx", "src/features/profile/profileEngine.ts", "src/data/memoryStudio.ts", "src/fixtures/referenceComparisons.ts", "src/fixtures/references.ts", "src/fixtures/referenceDetails.ts"],
  AFTER_memoryProfileAdjust: [entry, "src/data/memoryProfileAdjust.ts"],
  COMPARE_PAGE: [entry, "src/pages/CompareBoardPage.tsx"],
};
for (const [name, keys] of Object.entries(groups)) console.log(name, closure(keys.filter((k) => m[k] || console.error("missing", k))).join(" "));
