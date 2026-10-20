// E0-2 CSP-AC-C1(+R4 선행): React zip(CQ-04 A 임시 vite.config) docker 빌드 → vite preview 4399
const { measure } = await import("file:///Users/younghwankang/orca/workspaces/web-builder-solution/csp-zip/dev/active/csp-zip/scripts/e0-measure.mjs");
const task = await taskSpace("csp-zip E0");
const res = await measure(task, [{ name: "react-zip preview", url: "http://localhost:4399/" }]);
const page = task.page("p1");
res[0].styleAttrs = await page.evaluate(() => ({ withStyleAttr: document.querySelectorAll("[style]").length, inlineStyleEls: document.querySelectorAll("style").length, inlineScripts: [...document.scripts].filter((s) => !s.src).length, rootVars: (document.querySelector("[data-site-root]")?.getAttribute("style") || "").slice(0, 60), primary: getComputedStyle(document.querySelector("[data-site-root]")).getPropertyValue("--site-primary") }));
console.log(JSON.stringify(res, null, 1));
