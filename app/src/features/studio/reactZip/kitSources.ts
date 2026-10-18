/**
 * 킷 원문 동봉(REACTZIP-SPEC Q1 (a)안 · 2.1 · 2.3.1-4) — 빌드 시점 `?raw`로 이 청크에 들어온다(조작 뒤 청크).
 * 킷 = app/src/kit의 테스트 제외 .ts·.tsx + kit.css·motion.css(kit/fonts.css는 빼고 zip이 자기 src/fonts.css를 쓴다).
 * 함정: vitest(css: false)에서는 `?raw` CSS가 빈 문자열 — 테스트는 CSS 원문을 주입하고, 빈 원문은 생성 실패다.
 */
const KIT = import.meta.glob(["../../../kit/*.ts", "../../../kit/*.tsx", "../../../kit/kit.css", "../../../kit/motion.css", "!../../../kit/*.test.*"], { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const PAGE_DOC = import.meta.glob("../../../engine/contracts/pageDoc.ts", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const PROTOCOL = import.meta.glob("../../../render/protocol.ts", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

export type KitCss = Partial<Readonly<Record<"kit.css" | "motion.css", string>>>;

/** 킷 밖 type-only import 2곳 → 동봉한 타입 파일 */
const relink = (source: string) => source.replaceAll(`"../engine/contracts/pageDoc"`, `"../types/pageDoc"`).replaceAll(`"../render/protocol"`, `"../types/protocol"`);

/** 이름순 `src/kit/<이름>` 원문(relink 뒤) — 빈 원문 = 실패 */
export function kitSources(css: KitCss = {}): { readonly name: string; readonly text: string }[] {
  return Object.entries(KIT)
    .map(([path, source]) => {
      const file = path.slice(path.lastIndexOf("/") + 1);
      const text = css[file as keyof KitCss] ?? source;
      if (text.trim() === "") throw new Error(`킷 원문이 비었습니다: ${file}`);
      return { name: `src/kit/${file}`, text: file.endsWith(".css") ? text : relink(text) };
    })
    .sort((a, b) => (a.name < b.name ? -1 : 1));
}

export const MOTION_IMPORT = `import type { MotionPreset } from "../../domain/compareBoard";`;
export const LOCAL_IMAGE_ID = `export type LocalImageId = string & { readonly __brand: "LocalImageId" };`;
const once = (source: string, from: string, to: string) => {
  if (source.split(from).length !== 2) throw new Error(`타입 원문 치환 대상이 정확히 1개가 아닙니다: ${from}`);
  return source.replace(from, to);
};
const only = (files: Record<string, string>) => Object.values(files)[0] ?? "";

/** 2.3.1-4 — pageDoc.ts 치환 2개(MotionPreset 리터럴 · LocalImageId = 이미지 키) · protocol.ts는 import가 없어 원문 그대로 */
export function typeSources(): { readonly name: string; readonly text: string }[] {
  const pageDoc = once(once(only(PAGE_DOC), MOTION_IMPORT, `type MotionPreset = "L0" | "L1" | "L2";`), LOCAL_IMAGE_ID, "export type LocalImageId = `img-${string}`;");
  const protocol = only(PROTOCOL);
  if (/^import /m.test(protocol)) throw new Error("render/protocol.ts에 import가 생겼습니다 — 치환 규칙을 갱신하세요");
  return [
    { name: "src/types/pageDoc.ts", text: pageDoc },
    { name: "src/types/protocol.ts", text: protocol },
  ];
}
