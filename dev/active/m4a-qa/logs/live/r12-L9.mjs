const task = await taskSpace(37);
try { await task.page("p2").close(); } catch (e) { console.log("p2 close", String(e).slice(0, 60)); }
const page = task.page("p1");
const F = "/tmp/m4a-qa-live/fx/";
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.waitForTimeout(1000);
const secs = await page.evaluate(() => [...new Set([...document.querySelectorAll("button")].map(b => (b.getAttribute("aria-label") ?? b.textContent).trim()).filter(t => /^(Hero|About|Portfolio|Services|Gallery|Team)/.test(t)))]);
console.log("secs", secs);
let n = 0; const log = [];
for (const sec of secs) {
  await page.evaluate((s) => [...document.querySelectorAll("button")].find(b => (b.getAttribute("aria-label") ?? b.textContent).trim() === s)?.click(), sec);
  await page.waitForTimeout(1200);
  await page.evaluate(() => [...document.querySelectorAll("details")].filter(x => x.querySelector("summary")?.textContent.includes("이미지 편집")).forEach(d => d.open = true));
  await page.waitForTimeout(400);
  const cnt = await page.evaluate(() => document.querySelectorAll("details[open] input[type=file]").length);
  for (let i = 0; i < cnt && n < 12; i++) {
    const t0 = Date.now();
    await page.setInputFiles(`loc=css:details[open] input[type=file] >> nth=${i}`, [F + `noise-${String(n).padStart(2, "0")}.png`]);
    await page.waitForFunction((k) => (document.querySelectorAll("details[open]")[0]?.innerText.match(/WebP \d+(\.\d+)?(KB|MB)/g) ?? []).length > k, i, { timeout: 60000 }).catch(e => log.push(`wait ${sec}#${i} ${String(e).slice(0, 60)}`));
    n++;
    log.push(`${sec}#${i} ${Date.now() - t0}ms`);
  }
  const texts = await page.evaluate(() => [...document.querySelectorAll("details[open]")].map(d => (d.innerText.match(/\d+ × \d+ · WebP [\d.]+(KB|MB)|[^\n]*(넘|크|실패|못)[^\n]*/g) ?? []).join(" ; ")));
  log.push(`${sec} cnt=${cnt} :: ${texts.join(" | ").slice(0, 400)}`);
  // alt: 장식 이미지 체크 대신 빈 대체텍스트 채우기
  await page.evaluate(() => { for (const inp of document.querySelectorAll("details[open] input[type=text]")) { if (!inp.value) { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(inp, "노이즈 테스트 이미지"); inp.dispatchEvent(new Event("input", { bubbles: true })); } } });
  await page.waitForTimeout(600);
}
console.log(log.join("\n"));
console.log("uploaded", n);
console.log("gate", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("button")].filter(b => /차단|내보내기$/.test(b.textContent.trim())).map(b => `${b.textContent.trim().slice(0, 30)}:dis=${b.getAttribute("aria-disabled") ?? b.disabled}`))));
console.log("toolbar", await page.evaluate(() => document.body.innerText.match(/이 (브라우저|탭)에 저장[^\n]*/)?.[0]));
