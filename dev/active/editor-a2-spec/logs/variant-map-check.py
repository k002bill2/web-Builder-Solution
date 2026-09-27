"""VARIANT-MAP.md ↔ 코드 grep 대조 (L1). 저장소 루트에서 실행: python3 dev/active/editor-a2-spec/logs/variant-map-check.py"""
import re, collections, sys
fx = open('app/src/fixtures/referenceComparisons.ts').read().splitlines()
pairs = collections.defaultdict(list)
for i, l in enumerate(fx, 1):
    m = re.search(r'type: "([^"]+)", variant: "([^"]+)"', l)
    if m: pairs[f"{m[1]}/{m[2]}"].append(i)
print("fixture lines", sum(len(v) for v in pairs.values()), "unique", len(pairs))
eng = {}
for i, l in enumerate(open('app/src/engine/sections/bodySections.ts').read().splitlines(), 1):
    m = re.search(r'\{ type: "([^"]+)", variant: "([^"]+)"', l)
    if m: eng[f"{m[1]}/{m[2]}"] = i
cur = None
for i, l in enumerate(open('app/src/engine/sections/boundSections.ts').read().splitlines()[25:47], 26):
    m = re.match(r'\s{2}(header|hero|footer): \{', l)
    if m: cur = m[1]; continue
    m = re.match(r'\s{4}"?([a-z0-9-]+)"?: \{', l)
    if m and cur: eng[f"{cur}/{m[1]}"] = i
print("engine pairs", len(eng))
md = open('docs/design/2a-05/VARIANT-MAP.md').read()
rows = [[x.strip() for x in l.strip('|').split('|')] for l in md.splitlines() if re.match(r'\| \d+ \| [a-z-]+/', l)]
fails = 0
for c in rows:
    targets = re.findall(r'([a-z-]+/[a-z0-9-]+)', c[3])
    for t in targets:
        if t not in eng: print("TARGET NOT IN ENGINE", t); fails += 1
    if re.match(r'^\d', c[2]):
        lines = [int(x) for x in re.findall(r'(\d+)\(', c[2])]
        if sorted(lines) != sorted(pairs.get(c[1], [])): print("LINE MISMATCH", c[1], lines, pairs.get(c[1])); fails += 1
        if (c[4] == "같음") != (c[1] == c[3]): print("CLASS MISMATCH", c); fails += 1
covered = {c[1] for c in rows if re.match(r'^\d', c[2])}
print("fixture pairs not in table:", sorted(set(pairs) - covered))
print("engine pairs not mentioned:", [k for k in eng if k not in md])
print("fails", fails)
sys.exit(1 if fails or set(pairs) - covered else 0)
