/** [M4-b-0 스파이크 시제품 — 커밋 금지] React zip 고정 파일 템플릿. 버전 = 앱 설치본과 같게 고정(motion은 npm view 14.3.0) */
const DEPS = { react: "19.3.0", "react-dom": "19.3.0", motion: "14.3.0" };
const DEV_DEPS = { "@tailwindcss/vite": "4.3.3", "@types/react": "19.3.0", "@types/react-dom": "19.3.0", "@vitejs/plugin-react": "6.1.1", tailwindcss: "4.3.3", typescript: "6.0.3", vite: "8.3.1" };

export const packageJson = () =>
  JSON.stringify({ name: "site", private: true, version: "0.0.0", type: "module", scripts: { dev: "vite", build: "tsc --noEmit && vite build", preview: "vite preview" }, dependencies: DEPS, devDependencies: DEV_DEPS }, null, 2) + "\n";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const indexHtml = (title: string, description: string) => `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

export const VITE_CONFIG = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({ plugins: [react(), tailwindcss()] });
`;

export const TSCONFIG = JSON.stringify({ compilerOptions: { target: "ES2022", lib: ["ES2023", "DOM", "DOM.Iterable"], module: "ESNext", moduleResolution: "bundler", jsx: "react-jsx", strict: true, noEmit: true, resolveJsonModule: true, allowImportingTsExtensions: false, skipLibCheck: true, isolatedModules: true, types: ["vite/client"] }, include: ["src"] }, null, 2) + "\n";

export const MAIN_TSX = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PageDocument, type Site } from "./PageDocument";
import site from "./site.json";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageDocument site={site as unknown as Site} />
  </StrictMode>,
);
`;

/** 앱 render/PageDocument.tsx에서 폴백·편집기 경로를 뺀 것 — 뼈대·속성은 같다 */
export const PAGE_DOCUMENT_TSX = `import type { CSSProperties } from "react";
import type { PageDoc, SectionInstance, SectionMotion } from "./types/pageDoc";
import type { KitTokenInput } from "./types/protocol";
import { KIT_REGISTRY, kitFor } from "./kit/registry";
import { kitLinks } from "./kit/text";
import { kitVars } from "./kit/tokens";
import { EagerImages } from "./kit/Media";

export interface Site {
  readonly doc: PageDoc;
  readonly kitTokens: KitTokenInput;
  readonly motion: Readonly<Record<string, SectionMotion>>;
  readonly mainStyle: CSSProperties;
}

export function PageDocument({ site: { doc, kitTokens, motion, mainStyle }, images = {} }: { readonly site: Site; readonly images?: Readonly<Record<string, string>> }) {
  const links = kitLinks(doc);
  const [w = 4, h = 5] = kitTokens.mediaRatio.split(":").map(Number);
  const mediaRatio = [w, h] as const;
  const draw = (section: SectionInstance) => {
    const Kit = kitFor(section, KIT_REGISTRY);
    if (!Kit) return null;
    const level = motion[section.instanceId];
    const root = { id: \`s-\${section.instanceId}\`, "data-section": \`\${section.type}/\${section.variant}\`, "data-instance-id": section.instanceId, "data-kit": "", ...(level && { "data-motion": level }) } as const;
    return <Kit key={section.instanceId} section={section} links={links} images={images} mediaRatio={mediaRatio} root={root} />;
  };
  const outside = (type: "header" | "footer") => doc.sections.filter((s) => s.type === type && kitFor(s, KIT_REGISTRY));
  const head = outside("header");
  const foot = outside("footer");
  const body = doc.sections.filter((s) => !head.includes(s) && !foot.includes(s));
  return (
    <EagerImages value={false}>
      <div data-site-root data-motion-play="" style={kitVars(kitTokens)}>
        {head.map(draw)}
        {body.length > 0 && (
          <main data-fallback-root style={mainStyle} className="flex flex-col">
            {body.map(draw)}
          </main>
        )}
        {foot.map(draw)}
      </div>
    </EagerImages>
  );
}
`;

/** render.css에서 앱 DS 토큰·폴백 규칙을 뺀 것 + 앱 base.css body 기본값(값으로 풀어 씀) */
export const INDEX_CSS_BASE = `@import "tailwindcss";
@import "./kit/kit.css";
@import "./kit/motion.css";

@layer base {
  body {
    margin: 0;
    /* 렌더 문서가 앱 DS base.css에서 상속하는 값(body3 · label-normal · background-normal) — 킷이 정하지 않는 글자 크기·색의 출처 */
    font-size: 0.875rem;
    color: rgb(26 38 32);
    background: rgb(255 255 255);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    word-break: keep-all;
    overflow-wrap: anywhere;
  }
  [data-site-root] {
    font-family: var(--site-font, system-ui, sans-serif);
  }
}
`;
