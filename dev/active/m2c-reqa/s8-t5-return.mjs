// M2C-REQA 3 — T-5: 툴바 "프로젝트로 돌아가기"(/projects, 앱 안 링크) → 같은 프로젝트 편집기 복귀 → 잃은 이미지 상태
const S = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2c-reqa/dev/active/m2c-reqa/shots/";
const page = (await taskSpace(80)).page("p1");
await page.click("loc=role:link[name='프로젝트로 돌아가기']", { label: "toolbar project" });
await page.waitForTimeout(1500);
console.log("AT", await page.evaluate(() => location.pathname), JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("a[href],button")].filter(e => e.offsetParent).map(e => `${e.tagName[0]}:${e.getAttribute("href") ?? ""}:${(e.getAttribute("aria-label") || e.textContent.trim()).slice(0, 30)}`).slice(5, 25))));
await page.screenshot({ path: `${S}t5-projects.png` });
const target = await page.evaluate(() => { const a = [...document.querySelectorAll("a[href]")].find(e => e.getAttribute("href") === "/studio/project-1"); return a ? (a.getAttribute("aria-label") || a.textContent.trim()) : null; });
console.log("TARGET", target);
await page.click("loc=css:a[href='/studio/project-1']", { label: "reopen project-1" });
await page.waitForTimeout(3000);
const st = await page.evaluate(() => {
  const ds = [...document.querySelectorAll("details")].filter(x => x.querySelector("summary")?.textContent.includes("이미지 편집"));
  const body = document.body.innerText;
  return { url: location.pathname, panels: ds.map(d => d.innerText.replace(/\n+/g, " | ").slice(0, 300)), again: (body.match(/[^\n]*다시 골라[^\n]*/g) || []).slice(0, 8), f2: (body.match(/[^\n]*시안 \(F2\)[^\n]*/g) || []), gate: [...document.querySelectorAll("button")].filter(b => /차단|내보내기|PNG/.test(b.textContent)).map(b => `${b.textContent.trim().slice(0, 30)}:dis=${b.disabled}`) };
});
console.log("RETURN", JSON.stringify(st, null, 1));
await page.evaluate(() => document.querySelector("iframe").scrollIntoView({ block: "start" }));
await page.waitForTimeout(1500);
await page.screenshot({ path: `${S}t5-after-return-canvas.png` });
