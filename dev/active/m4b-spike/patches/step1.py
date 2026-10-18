import sys
root = sys.argv[1]
p = root + "/src/components/studio/ExportButtons.tsx"
s = open(p).read()
old = '''  { format: "static-html", label: "HTML 파일 1개 내보내기" },
];'''
assert old in s
open(p, "w").write(s.replace(old, old[:-3] + '''  { format: "react-zip", label: "React 프로젝트(zip) 내보내기" },
];'''))
