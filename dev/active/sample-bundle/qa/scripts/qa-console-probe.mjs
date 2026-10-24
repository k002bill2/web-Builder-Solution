// 콘솔 수집 프로브 — 같은 페이지에서 console.error 1건을 주입해 page.events()가 잡는지 확인(수집 경로 검증용)
const task = await taskSpace("sample-bundle qa-1");
const page = task.page("p1");
await page.cdp("Runtime.enable", {});
await page.events();
await page.evaluate(() => console.error("QA-PROBE"));
await page.waitForTimeout(500);
const ev = await page.events();
console.log("X probe", JSON.stringify(ev.filter((e) => /Runtime|Log/.test(e.method)).map((e) => e.method)));
