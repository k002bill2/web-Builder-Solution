// RS-AC-15 실흐름 ② — 스냅샷 "새로 시작 전" 미리보기 → 이 스냅샷으로 복원 → A안 v1
const task = await taskSpace(13);
const page = task.page("p1");
const click = (re) => page.evaluate((src) => [...document.querySelectorAll("button")].find((b) => new RegExp(src).test((b.getAttribute("aria-label") || b.textContent).trim()))?.click() ?? "missing", re);
console.log(await click("^이 스냅샷으로 복원$"));
await page.waitForTimeout(800);
const confirm = await page.evaluate(() => document.querySelector("dialog[open]")?.innerText.slice(0, 400));
console.log({ confirm });
if (confirm) {
  console.log(await page.evaluate(() => [...document.querySelectorAll("dialog[open] button")].map((b) => b.textContent.trim()).join(" | ")));
  console.log(await page.evaluate(() => [...document.querySelectorAll("dialog[open] button")].find((b) => /복원/.test(b.textContent))?.click() ?? "missing"));
  await page.waitForTimeout(1500);
}
console.log(await page.evaluate(() => ({
  notice: [...document.querySelectorAll('[role="status"]')].map((n) => n.textContent.trim()).filter((t) => t.length > 3),
  gate: [...document.querySelectorAll("button")].map((b) => b.textContent.trim()).filter((t) => /^대비 AA/.test(t)),
  sections: [...document.querySelectorAll("button")].map((b) => b.textContent.trim()).filter((t) => /^(Services|Testimonials)/.test(t)),
})));
await page.screenshot({ path: "/Users/younghwankang/orca/workspaces/web-builder-solution/restart-impl/dev/active/restart-impl/shots/rs15-restored-1280.png" });
