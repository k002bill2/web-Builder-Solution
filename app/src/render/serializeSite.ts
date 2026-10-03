/**
 * 내보내기 직렬화 (M2A-3b G2 · m2a 0.11 K-AC-06) — 숨은 iframe에 **새로 그린** 사이트 루트의 outerHTML. 클릭을 받는 래퍼(RenderApp div)는 넣지 않는다.
 * 렌더 문서의 `blob:` 이미지는 data URL로 바꾼다(부모는 불투명 출처 blob:을 못 연다 · 결과는 외부 요청 0). 정리(스크립트·편집기 흔적 제거)는 부모 생성기가 한다.
 */
type ToDataUrl = (url: string) => Promise<string>;

const blobToDataUrl: ToDataUrl = async (url) => {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
};

export async function serializeSite(root: Element, toDataUrl: ToDataUrl = blobToDataUrl): Promise<string | undefined> {
  const site = root.querySelector("[data-site-root]");
  if (!site) return undefined;
  const copy = site.cloneNode(true) as Element;
  for (const img of copy.querySelectorAll<HTMLImageElement>('img[src^="blob:"]')) img.setAttribute("src", await toDataUrl(img.getAttribute("src")!));
  return copy.outerHTML;
}
