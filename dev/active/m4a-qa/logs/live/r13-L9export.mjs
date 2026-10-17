const page = (await taskSpace(37)).page("p1");
const O = "/tmp/m4a-qa-live/out/L9-";
console.log("imgs", await page.evaluate(() => [...document.querySelectorAll("details")].map(d => (d.innerText.match(/\d+ × \d+ · WebP [\d.]+(KB|MB)/g) ?? []).join(",")).filter(Boolean)));
for (const [name, fn] of [["정적 사이트(zip) 내보내기", "zip"], ["HTML 파일 1개 내보내기", "html"]]) {
  const before = await page.evaluate(() => [...document.querySelectorAll("[role=status]")].map(s => s.textContent).join("|"));
  const t0 = Date.now();
  await page.click(`loc=role:button[name='${name}']`, { label: `L9 export ${fn}` });
  await page.waitForFunction((b) => { const now = [...document.querySelectorAll("[role=status]")].map(s => s.textContent).join("|"); return (now !== b && /만들었습니다/.test(now)) || [...document.querySelectorAll("[role=alert]")].some(a => a.textContent.trim()); }, before, { timeout: 120000 }).catch(e => console.log("wait err", String(e).slice(0, 80)));
  const ms = Date.now() - t0;
  const st = await page.evaluate(() => ({ s: [...document.querySelectorAll("[role=status]")].map(s => s.textContent.trim()).filter(t => /만들었/.test(t)).map(t => t.slice(0, 200)), a: [...document.querySelectorAll("[role=alert]")].map(s => s.textContent.trim()).filter(Boolean) }));
  console.log(fn, "ms", ms, JSON.stringify(st));
  const dlp = page.waitForEvent("download", { timeout: 30000 }).catch(e => ({ err: String(e).slice(0, 80) }));
  await page.evaluate(() => [...document.querySelectorAll("a[download]")].filter(a => a.offsetParent).pop()?.click());
  const dl = await dlp;
  if (!dl.err) { const p = O + dl.suggestedFilename(); await dl.saveAs(p); console.log("saved", p); } else console.log(dl.err);
}
await page.screenshot({ path: "/tmp/m4a-qa-live/out/L9-1280-html.png" });
