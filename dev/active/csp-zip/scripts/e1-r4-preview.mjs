// CSP-AC-C1(preview)·R4: 실제 생성기 React zip → docker 빌드 → vite preview 4399 · 1280 로드 + 390 메뉴 + 양성 대조
const { measure } = await import("file:///Users/younghwankang/orca/workspaces/web-builder-solution/csp-zip/dev/active/csp-zip/scripts/e0-measure.mjs");
const task = await taskSpace("csp-zip E0");
const res = await measure(task, [{ name: "react-zip preview (E1 생성기)", url: "http://localhost:4399/" }]);
console.log(JSON.stringify(res, null, 1));
