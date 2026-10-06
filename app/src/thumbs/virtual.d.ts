/** 썸네일 키 맵 가상 모듈(src/thumbs/vitePlugin.ts) — id → `{id}.{해시 8자}` */
declare module "virtual:thumbnail-keys" {
  const keys: Readonly<Record<string, string>>;
  export default keys;
}
