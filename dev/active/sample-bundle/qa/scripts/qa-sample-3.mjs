// 편집기 섹션 수 · design.html file:// 렌더 스크린샷
const D = "/Users/younghwankang/orca/workspaces/web-builder-solution/sample-bundle/dev/active/sample-bundle/qa";
const task = await taskSpace("sample-bundle qa-1");
const page = task.page("p1");
const log = (k, v) => console.log("X", k, JSON.stringify(v).slice(0, 1500));
log("path", await page.evaluate(() => location.pathname));
log("section candidates", await page.evaluate(() => ({
  dataSection: document.querySelectorAll("[data-section-id],[data-section]").length,
  lists: [...document.querySelectorAll("ol,ul,[role=list],[role=listbox],[role=tree]")].map((l) => ({ label: l.getAttribute("aria-label") || "", n: l.children.length, first: [...l.children].slice(0, 10).map((c) => c.textContent.trim().slice(0, 18)) })).filter((l) => /섹션|구조|레이어/.test(l.label) || l.n >= 8),
  sectionWords: (document.body.innerText.match(/섹션 \d+개/g) || []),
})));
const p2 = await task.newPage();
await p2.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await p2.goto("file:///tmp/qa-sample-x/design.html");
await p2.waitForTimeout(1500);
log("html", await p2.evaluate(() => ({ title: document.title, h: document.documentElement.scrollHeight, sections: document.querySelectorAll("section,header,footer").length, text: document.body.innerText.trim().length, imgs: [...document.images].filter((i) => i.complete && i.naturalWidth > 0).length })));
log("shot", await p2.screenshot({ path: `${D}/shots/design-html-file-1280.png` }));
await p2.close();
