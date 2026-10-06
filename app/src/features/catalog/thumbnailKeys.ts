/**
 * 썸네일 키 맵 (M3P-2 · SPEC 3절 A) — 레퍼런스 id → `{id}.{콘텐츠 해시 8자}`. 카드가 `import()`로 받는 지연 청크용(연결은 M3P-3).
 * 앱 빌드만 값이 차고(src/thumbs/vitePlugin.ts), dev·테스트는 빈 맵 = img 0·와이어 유지. DesignReference에 URL 필드를 넣지 않는다(TR-POL-01).
 */
import keys from "virtual:thumbnail-keys";

export const THUMBNAIL_KEYS: Readonly<Record<string, string>> = Object.freeze({ ...keys });

/** 같은 출처 정적 경로 */
export const thumbnailPath = (key: string) => `/thumbs/${key}.svg`;
