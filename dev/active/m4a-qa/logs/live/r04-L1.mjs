const page = (await taskSpace(37)).page("p1");
const O = "/tmp/m4a-qa-live/out/";
console.log("alts", await page.evaluate(() => [...document.querySelectorAll("details input[type=text]")].map(i => i.value)));
const probe = (label) => page.evaluate((label) => {
  const box = (el) => { const r = el.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; };
  const bs = [...document.querySelectorAll("button")].filter(b => /내보내기$|PNG/.test(b.textContent.trim()) && b.offsetParent).map(b => `${b.textContent.trim()}:${box(b)}`);
  const links = [...document.querySelectorAll("a[download], a[href^='blob:']")].map(a => `${a.textContent.trim()}|dl=${a.getAttribute("download")}|${box(a)}`);
  const st = [...document.querySelectorAll("[role=status]")].map(s => s.textContent.trim()).filter(t => /내보|zip|HTML|파일/.test(t));
  const al = [...document.querySelectorAll("[role=alert]")].map(s => s.textContent.trim()).filter(Boolean);
  const ae = document.activeElement; const focus = `${ae?.tagName}:${(ae?.getAttribute("aria-label") ?? ae?.textContent ?? "").trim().slice(0, 40)}`;
  const heads = [...document.querySelectorAll("h1,h2,h3,h4,p,strong")].map(h => h.textContent.trim()).filter(t => /내보냈|만들었|준비|정적 사이트\(zip\)|HTML 파일/.test(t) && t.length < 120);
  return { label, bs, links, st, al, focus, heads };
}, label);
for (const w of [1280, 390]) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: w === 390 ? 844 : 900, deviceScaleFactor: 1, mobile: w === 390 });
  await page.waitForTimeout(1200);
  if (w === 390) { await page.evaluate(() => [...document.querySelectorAll("[role=tab]")].find(t => /검사|내보내기/.test(t.textContent))?.click()); await page.waitForTimeout(800); }
  console.log(w, "tabs", await page.evaluate(() => [...document.querySelectorAll("[role=tab]")].map(t => `${t.textContent.trim()}:${t.getAttribute("aria-selected")}`)));
  console.log(JSON.stringify(await probe(`${w}-before`)));
  for (const [name, fn] of [["정적 사이트(zip) 내보내기", "zip"], ["HTML 파일 1개 내보내기", "html"]]) {
    const dlp = page.waitForEvent("download", { timeout: 30000 }).catch(e => ({ err: String(e).slice(0, 100) }));
    const t0 = Date.now();
    await page.click(`loc=role:button[name='${name}']`, { label: `export ${fn} ${w}` });
    await page.waitForFunction(() => [...document.querySelectorAll("[role=status],[role=alert]")].some(s => /내보냈|만들었|실패|못했/.test(s.textContent)), undefined, { timeout: 60000 }).catch(e => console.log("wait err", String(e).slice(0, 100)));
    console.log(fn, w, "ms", Date.now() - t0, JSON.stringify(await probe(`${w}-${fn}-after`)));
    await page.screenshot({ path: `${O}L1-${w}-${fn}.png` });
    let dl = await dlp;
    if (dl.err) {
      console.log("no auto download", dl.err);
      const dlp2 = page.waitForEvent("download", { timeout: 20000 }).catch(e => ({ err: String(e).slice(0, 100) }));
      await page.evaluate(() => [...document.querySelectorAll("a[download], a[href^='blob:']")].filter(a => a.offsetParent).pop()?.click());
      dl = await dlp2;
    }
    if (dl && !dl.err) { const p = `${O}${w}-${dl.suggestedFilename()}`; await dl.saveAs(p); console.log("saved", p); } else console.log("download", JSON.stringify(dl));
  }
}
