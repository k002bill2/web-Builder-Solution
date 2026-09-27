// QA 전용 계측 (제품 코드 무변경) — docs/qa/2a-04b2/tools/expose-studio.mjs 복사본, 99993b9 빌드의 치환 앵커(let n=_())만 갱신.
// CDP Fetch로 memoryStudio 청크 응답만 가로채 createMemoryStudio 반환값을 window.__qaStudio에 노출한다.
// D-2A4B2-02(요청 실패·커밋 뒤 응답 실패) 주입용. 계측 없는 경로(logs/pathA.txt)와 구별한다.
export async function exposeStudio(page, log = console.log) {
  await page.cdp("Fetch.enable", { patterns: [{ urlPattern: "*memoryStudio-*.js", requestStage: "Response" }] });
  let stop = false;
  let patched = 0;
  const loop = (async () => {
    while (!stop) {
      const events = await page.events();
      for (const ev of events) {
        const method = ev.method ?? ev.name;
        if (method !== "Fetch.requestPaused") continue;
        const params = ev.params ?? ev.data;
        const { requestId } = params;
        const res = await page.cdp("Fetch.getResponseBody", { requestId });
        let body = res.base64Encoded ? Buffer.from(res.body, "base64").toString("utf8") : res.body;
        const next = body.replace("let n=_();return{board:", "let n=_();return window.__qaStudio={board:");
        patched += next !== body ? 1 : 0;
        await page.cdp("Fetch.fulfillRequest", {
          requestId,
          responseCode: 200,
          responseHeaders: [{ name: "Content-Type", value: "text/javascript" }],
          body: Buffer.from(next, "utf8").toString("base64"),
        });
        log({ intercepted: params.request?.url, patched: next !== body });
      }
      await new Promise((r) => setTimeout(r, 30));
    }
  })();
  return async () => {
    stop = true;
    await loop;
    await page.cdp("Fetch.disable", {});
    return patched;
  };
}
