import { siteFaces } from "../kit/siteFonts";
import type { FontBytes, KitTokenInput } from "./protocol";

/** 편집 캔버스 글꼴 대기 상한 — 넘으면 폴백 글꼴로 그리고 사각형을 보낸다(오류 아님) */
const CANVAS_FONT_WAIT_MS = 3000;

/**
 * 사이트 글꼴 대기 (M2B-4a SPEC 2.4 · MF-AC-B7) — 쓰는 계열·굵기가 준비된 뒤 `ready` 1회(첫 rects를 그때 보낸다).
 *  - 편집 캔버스: `kit/fonts.css` 면을 `document.fonts.load`로 받는다. 실패·3초 초과 = 폴백 글꼴로 `ready` · 그 뒤에 한 면이라도 로드되면 `late`(배치가 바뀌니 다시 잰다)
 *  - 내보내기(부모가 `fonts` 바이트를 줌): 그 바이트를 FontFace로 등록·로드한 뒤에만 `ready` — 측정 글꼴 = 결과물 글꼴. 실패면 `ready` 0(부모 상한이 실패 처리)
 * 글꼴 API가 없는 환경(jsdom)·쓰는 면 0이면 바로 `ready`. 돌려준 함수 = 취소(다음 문서가 오면 이전 대기는 버린다)
 */
export function awaitSiteFonts(host: Window, kitTokens: KitTokenInput | undefined, bytes: readonly FontBytes[] | undefined, ready: () => void, late: () => void): () => void {
  let live = true;
  const once = (fn: () => void) => () => live && fn();
  const set = host.document.fonts as FontFaceSet | undefined;
  const faces = kitTokens ? siteFaces(kitTokens.type) : [];
  const Face = typeof FontFace === "undefined" ? undefined : FontFace;
  if (!set || faces.length === 0) ready();
  else if (bytes) {
    if (!Face) ready();
    else
      void Promise.all(
        bytes.map((font) => {
          const face = new Face(font.family, font.data, { weight: String(font.weight) });
          set.add(face);
          return face.load();
        }),
      ).then(once(ready), () => undefined);
  } else {
    let waited = false;
    const fallback = () => {
      if (waited) return;
      waited = true;
      clearTimeout(timer);
      if (live) ready();
    };
    const timer = setTimeout(fallback, CANVAS_FONT_WAIT_MS);
    const loads = faces.map((face) => set.load(`${face.weight} 1em "${face.family}"`));
    // 한 면 실패 = 바로 폴백. 다 끝났을 때 받은 면이 하나라도 있고 이미 폴백으로 그렸으면 `late`(Codex P2)
    loads.forEach((load) => load.catch(fallback));
    void Promise.allSettled(loads).then((results) => {
      if (!results.some((r) => r.status === "fulfilled")) fallback();
      else if (waited) once(late)();
      else fallback();
    });
  }
  return () => {
    live = false;
  };
}
