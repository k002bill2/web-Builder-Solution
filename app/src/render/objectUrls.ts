import type { PageDoc } from "../engine/contracts/pageDoc";

/**
 * 로컬 이미지 object URL (M2A-2a K4 · m2a 0.9 · Opus B-1-7) — 렌더 문서는 불투명 출처라 부모의 `blob:` URL을 열 수 없다.
 * 부모가 Blob 자체를 postMessage로 넘기면 여기서 자기 URL을 만들고, 문서에서 빠지거나 교체된 이미지의 URL은 해제한다.
 */
type UrlApi = Pick<typeof URL, "createObjectURL" | "revokeObjectURL">;

/** 문서의 켜진 이미지 슬롯이 가리키는 로컬 이미지 id(플레이스홀더 = 객체 출처라 제외) */
export function docImageIds(doc: PageDoc): ReadonlySet<string> {
  return new Set(
    doc.sections.flatMap((section) =>
      Object.values(section.slots).flatMap((value) => (typeof value === "object" && value.enabled && typeof value.source === "string" ? [value.source] : [])),
    ),
  );
}

export function createObjectUrlCache(api: UrlApi = URL) {
  let held = new Map<string, { readonly blob: Blob; readonly url: string }>();
  return {
    /** 쓰는 id만 남긴다 — 같은 Blob은 URL 유지, 바뀐 Blob·빠진 id는 해제 */
    sync(blobs: Readonly<Record<string, Blob>>, used: ReadonlySet<string>): Readonly<Record<string, string>> {
      const next = new Map<string, { readonly blob: Blob; readonly url: string }>();
      for (const id of used) {
        const blob = blobs[id];
        if (!blob) continue;
        const kept = held.get(id);
        next.set(id, kept?.blob === blob ? kept : { blob, url: api.createObjectURL(blob) });
      }
      for (const [id, entry] of held) if (next.get(id) !== entry) api.revokeObjectURL(entry.url);
      held = next;
      return Object.fromEntries([...next].map(([id, entry]) => [id, entry.url]));
    },
    clear() {
      for (const entry of held.values()) api.revokeObjectURL(entry.url);
      held = new Map();
    },
  };
}
