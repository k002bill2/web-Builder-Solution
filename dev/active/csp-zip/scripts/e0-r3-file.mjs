// E0-1 CSP-AC-R3: 정적 zip file:// (CSP 임시 삽입본 · 무CSP 대조) + static-html(file://, R1 위반·R5)
const { measure } = await import("file:///Users/younghwankang/orca/workspaces/web-builder-solution/csp-zip/dev/active/csp-zip/scripts/e0-measure.mjs");
const task = await taskSpace("csp-zip E0");
console.log({ space: task.spaceId });
const res = await measure(task, [
  { name: "static-zip+CSP(file)", url: "file:///var/folders/jh/3l0ptrs90gl5vk9_z2t7r4900000gn/T/csp-e0/static-csp/index.html" },
  { name: "static-zip 무CSP 대조(file)", url: "file:///var/folders/jh/3l0ptrs90gl5vk9_z2t7r4900000gn/T/csp-e0/static/index.html" },
  { name: "static-html(file)", url: "file:///var/folders/jh/3l0ptrs90gl5vk9_z2t7r4900000gn/T/csp-e0/static.html" },
]);
console.log(JSON.stringify(res, null, 1));
