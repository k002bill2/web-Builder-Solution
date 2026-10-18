/**
 * [M4-b-0 스파이크 시제품 — 커밋 금지] React 프로젝트 zip 생성기 (FR-PUB-02 · (a)안: 킷 소스 동봉 + 문서 JSON 주입).
 * 킷 소스는 빌드 시점에 `?raw`로 이 청크에 들어온다(조작 뒤 청크). 앱 의존성 0 — 산출 package.json은 문자열.
 */
import type { PageDoc } from "../../../engine/contracts/pageDoc";
import type { FontBytes, KitTokenInput } from "../../../render/protocol";
import { canvasVars } from "../../../render/fallback/canvasLayouts";
import { firstScreenIds, motionOf } from "../../../render/sectionMotion";
import { faceRule, fontLicenseText } from "../staticHtml/siteFontEmbed";
import { fontFileName } from "../zip/staticZip";
import { zipParts, type ZipEntry } from "../zip/storeZip";
import { INDEX_CSS_BASE, MAIN_TSX, PAGE_DOCUMENT_TSX, TSCONFIG, VITE_CONFIG, indexHtml, packageJson } from "./templates";

const KIT = import.meta.glob(["../../../kit/*.ts", "../../../kit/*.tsx", "../../../kit/kit.css", "../../../kit/motion.css", "!../../../kit/*.test.*"], { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const PAGE_DOC_TS = import.meta.glob("../../../engine/contracts/pageDoc.ts", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const PROTOCOL_TS = import.meta.glob("../../../render/protocol.ts", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

const only = (files: Record<string, string>) => Object.values(files)[0]!;
/** 킷 밖 type-only import 2곳 → 동봉한 타입 파일 */
const relink = (source: string) => source.replaceAll(`"../engine/contracts/pageDoc"`, `"../types/pageDoc"`).replaceAll(`"../render/protocol"`, `"../types/protocol"`);

export interface ReactZipInput {
  readonly doc: PageDoc;
  readonly kitTokens: KitTokenInput;
  readonly fonts: readonly FontBytes[];
  readonly date: Date;
  /** 킷 CSS 원문 덮어쓰기 — vitest(css: false)에서는 `?raw` CSS가 빈 문자열이라 테스트가 주입한다 */
  readonly css?: Readonly<Record<"kit.css" | "motion.css", string>>;
}

export function reactZipEntries({ doc, kitTokens, fonts, css }: Omit<ReactZipInput, "date">): ZipEntry[] {
  const enc = new TextEncoder();
  const text = (name: string, body: string): ZipEntry => ({ name, data: enc.encode(body) });
  const body = doc.sections.filter((s) => s.type !== "header" && s.type !== "footer");
  const first = firstScreenIds(body);
  // 실효 모션(엔진 레지스트리 maxMotion)은 생성 시점에 계산해 넣는다 — 산출물에 엔진 0
  const motion = Object.fromEntries(doc.sections.flatMap((s) => {
    const level = motionOf(s, first.has(s.instanceId));
    return level ? [[s.instanceId, level]] : [];
  }));
  const fontFiles = fonts.map((f) => ({ face: f, name: `assets/fonts/${fontFileName(f.family, f.weight)}` }));
  const kitFiles = Object.entries(KIT).map(([path, source]) => {
    const file = path.slice(path.lastIndexOf("/") + 1);
    const body = (css as Record<string, string> | undefined)?.[file] ?? source;
    if (body.trim() === "") throw new Error(`킷 원문이 비었습니다: ${file}`);
    return text(`src/kit/${file}`, file.endsWith(".css") ? body : relink(body));
  });
  const fontsCss = fontFiles.map(({ face, name }) => faceRule(face, `"./${name}"`)).join("\n") + "\n[data-site-root] {\n  font-synthesis: none;\n}\n";
  return [
    text("package.json", packageJson()),
    text("index.html", indexHtml(doc.meta.title, doc.meta.description)),
    text("vite.config.ts", VITE_CONFIG),
    text("tsconfig.json", TSCONFIG),
    text("src/main.tsx", MAIN_TSX),
    text("src/PageDocument.tsx", PAGE_DOCUMENT_TSX),
    text("src/index.css", INDEX_CSS_BASE + `@import "./fonts.css";\n`),
    text("src/fonts.css", fontsCss),
    text("src/site.json", JSON.stringify({ doc, kitTokens, motion, mainStyle: canvasVars(kitTokens.palette) }, null, 2) + "\n"),
    text("src/types/pageDoc.ts", only(PAGE_DOC_TS).replace(`import type { MotionPreset } from "../../domain/compareBoard";`, `type MotionPreset = "L0" | "L1" | "L2";`)),
    text("src/types/protocol.ts", only(PROTOCOL_TS)),
    ...kitFiles,
    ...fontFiles.map(({ face, name }) => ({ name: `src/${name}`, data: new Uint8Array(face.data) })),
    ...(fonts[0] ? [text("src/assets/fonts/OFL.txt", fontLicenseText(fonts[0].family))] : []),
    text("LICENSES.md", "# LICENSES\n\n(스파이크 — 문안 미정. 글꼴 OFL 1.1: src/assets/fonts/OFL.txt · npm 의존성은 각 패키지 라이선스)\n"),
  ];
}

export function buildReactZip(input: ReactZipInput): Uint8Array<ArrayBuffer> {
  const parts = zipParts(reactZipEntries(input), input.date);
  const out = new Uint8Array(new ArrayBuffer(parts.reduce((n, p) => n + p.length, 0)));
  parts.reduce((at, p) => (out.set(p, at), at + p.length), 0);
  return out;
}
