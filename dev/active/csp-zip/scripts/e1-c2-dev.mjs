// C2: dev 서버 첫 화면 렌더 + HMR(새로고침 없이 CSS 변경 반영) — HMR 트리거는 바깥 셸이 docker exec로 index.css에 규칙 추가
const task = await taskSpace("csp-zip E0");
const page = task.page("p1");
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await page.goto("http://localhost:4399/");
await page.waitForSelector("[data-site-root]", { state: "visible", timeout: 20000 });
const first = await page.evaluate(() => { window.__noReload = 1; return { siteRoot: !!document.querySelector("[data-site-root]"), sections: document.querySelectorAll("[data-kit]").length, csp: document.querySelectorAll("meta[http-equiv]").length, outline: getComputedStyle(document.querySelector("[data-site-root]")).outlineColor }; });
console.log(JSON.stringify({ first }));
const { execSync } = await import("node:child_process");
execSync(`docker exec csp-e1-dev sh -c 'printf "\\n[data-site-root]{outline:3px solid rgb(1, 2, 3)}\\n" >> /w/src/index.css'`);
await page.waitForFunction(() => getComputedStyle(document.querySelector("[data-site-root]")).outlineColor === "rgb(1, 2, 3)", undefined, { timeout: 15000 }).catch(() => {});
const after = await page.evaluate(() => ({ outline: getComputedStyle(document.querySelector("[data-site-root]")).outlineColor, noReload: window.__noReload === 1 }));
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
console.log(JSON.stringify({ after }));
