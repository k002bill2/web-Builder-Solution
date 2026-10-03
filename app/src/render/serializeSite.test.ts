import { serializeSite } from "./serializeSite";

/** M2A-3b G2 — 렌더 문서 쪽 직렬화: 사이트 루트만(클릭 받는 래퍼 0) · 렌더 문서 blob: 이미지 → data URL(부모는 불투명 출처 blob:을 못 연다) */
describe("serializeSite", () => {
  const host = (html: string) => {
    const root = document.createElement("div");
    root.innerHTML = html;
    return root;
  };

  it("사이트 루트의 outerHTML만 — 감싼 래퍼는 넣지 않는다 · 원본 DOM은 바꾸지 않는다", async () => {
    const root = host('<div data-site-root style="--site-ink: var(--x)"><header id="s-h">글</header></div>');
    const markup = await serializeSite(root, async () => "data:,x");
    expect(markup).toBe('<div data-site-root="" style="--site-ink: var(--x)"><header id="s-h">글</header></div>');
  });

  it("blob: 이미지는 data URL로 바꾼다 — 원본 img는 그대로", async () => {
    const root = host('<div data-site-root><img src="blob:null/1" alt="가게 외관"><img src="data:image/png;base64,AA" alt=""></div>');
    const seen: string[] = [];
    const markup = await serializeSite(root, async (url) => (seen.push(url), "data:image/png;base64,QUJD"));
    expect(seen).toEqual(["blob:null/1"]);
    expect(markup).toContain('src="data:image/png;base64,QUJD" alt="가게 외관"');
    expect(markup).not.toContain("blob:");
    expect(root.querySelector("img")!.getAttribute("src")).toBe("blob:null/1");
  });

  it("사이트 루트가 없으면(그리기 전·INVALID_DOC) undefined", async () => {
    expect(await serializeSite(host("<p>없음</p>"), async () => "data:,x")).toBeUndefined();
  });
});
