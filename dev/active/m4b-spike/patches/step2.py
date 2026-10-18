import sys
root = sys.argv[1]
def edit(rel, old, new):
    p = root + "/" + rel
    s = open(p).read()
    assert old in s, (rel, old[:60])
    open(p, "w").write(s.replace(old, new, 1))
edit("src/data/memoryDocBook.ts", 'return format !== "react-zip" && load ?', 'return load ?')
edit("src/features/studio/staticHtml/staticHtml.ts",
     "const { markup } = await renderAndSerialize(",
     'const { markup } = format === "react-zip" ? { markup: "" } : await renderAndSerialize(')
edit("src/features/studio/staticHtml/staticHtml.ts",
     "    const built =\n      format === \"static-zip\"",
     "    const built =\n      format === \"react-zip\"\n        ? { data: (await import(\"../reactZip/reactZip\")).buildReactZip({ doc, kitTokens, fonts: fonts.bytes, date: new Date(head.updatedAt) }), images: 0, type: \"application/zip\" }\n        : format === \"static-zip\"")
edit("src/features/studio/exportFlow.ts", '(format === "static-zip" ? staticZipFileName', '(format !== "static-html" ? staticZipFileName')
edit("src/data/memoryDocBook.ts", "const appGenerator = (format: ExportFormat)", "const appGenerator = (_format: ExportFormat)")
