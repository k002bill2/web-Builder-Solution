/**
 * React zip 고정 파일 템플릿 (REACTZIP-SPEC 2.1·3·4.2·4.3) — 생성기 청크 안 문자열(앱 의존성 0).
 * package.json·lock = `template/*.tpl`(`?raw` — app/src 안에 진짜 package.json을 두지 않는다, 3.2-1). 그 밖 = 이 파일 상수.
 */
import PACKAGE_LOCK_TPL from "./template/package-lock.json.tpl?raw";
import PACKAGE_JSON_TPL from "./template/package.json.tpl?raw";

export const PACKAGE_JSON = PACKAGE_JSON_TPL;
export const PACKAGE_LOCK = PACKAGE_LOCK_TPL;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** title·description = 문서 meta(HTML 이스케이프) · 스크립트 = /src/main.tsx 1개 · 외부 URL 0 */
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

export const TSCONFIG =
  JSON.stringify(
    {
      compilerOptions: { target: "ES2022", lib: ["ES2023", "DOM", "DOM.Iterable"], module: "ESNext", moduleResolution: "bundler", jsx: "react-jsx", strict: true, noEmit: true, resolveJsonModule: true, skipLibCheck: true, isolatedModules: true, types: ["vite/client"] },
      include: ["src"],
    },
    null,
    2,
  ) + "\n";

/**
 * 메뉴 닫기 리스너(4.3) — 정적 내보내기 STATIC_MENU_SCRIPT와 같은 판정(문서 click 위임 → `a[href^="#"]` → 그 앵커의 `[popover]` → hidePopover).
 * strict TS이면서 그대로 JS로도 돌아가는 모양(테스트가 jsdom에서 이 문자열을 실행한다 — RZ-AC-15)
 */
export const MENU_LISTENER = `document.addEventListener("click", (e) => {
  const anchor = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
  const menu = anchor ? anchor.closest("[popover]") : null;
  if (menu instanceof HTMLElement && typeof menu.hidePopover === "function") menu.hidePopover();
});
`;

export const MAIN_TSX = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PageDocument, type SiteJson } from "./PageDocument";
import { images } from "./images";
import site from "./site.json";
import "./index.css";

// 메뉴 안 # 앵커를 누르면 그 메뉴(popover)를 닫는다
${MENU_LISTENER}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PageDocument site={site as unknown as SiteJson} images={images} />
  </StrictMode>,
);
`;

/** RZQ-05 A — src/assets/images/img-NN.<ext> → Vite가 해시를 붙인 URL. 키 = 파일 이름에서 확장자를 뺀 것(site.json 이미지 키) */
export const IMAGES_TS = `const files = import.meta.glob<string>("./assets/images/*", { eager: true, query: "?url", import: "default" });

export const images: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.slice(path.lastIndexOf("/") + 1).replace(/\\.[^.]+$/, ""), url]),
);
`;

/** 앱 render/PageDocument.tsx에서 폴백·편집기 경로를 뺀 것 — 뼈대·data-*·킷 props(images·imageSizes 포함)는 같다 */
export const PAGE_DOCUMENT_TSX = `import type { CSSProperties } from "react";
import type { PageDoc, SectionInstance, SectionMotion } from "./types/pageDoc";
import type { KitTokenInput } from "./types/protocol";
import type { ImageSize } from "./kit/types";
import { KIT_REGISTRY, kitFor } from "./kit/registry";
import { kitLinks } from "./kit/text";
import { kitVars } from "./kit/tokens";

export interface SiteJson {
  readonly schema: 1;
  readonly doc: PageDoc;
  readonly kitTokens: KitTokenInput;
  readonly motion: Readonly<Record<string, SectionMotion>>;
  readonly mainStyle: CSSProperties;
  readonly images: Readonly<Record<string, ImageSize & { readonly file: string }>>;
}

export function PageDocument({ site, images }: { readonly site: SiteJson; readonly images: Readonly<Record<string, string>> }) {
  const { doc, kitTokens, motion, mainStyle } = site;
  const links = kitLinks(doc);
  const [w = 4, h = 5] = kitTokens.mediaRatio.split(":").map(Number);
  const mediaRatio = [w, h] as const;
  const draw = (section: SectionInstance) => {
    const Kit = kitFor(section, KIT_REGISTRY);
    if (!Kit) return null;
    const level = motion[section.instanceId];
    const root = { id: \`s-\${section.instanceId}\`, "data-section": \`\${section.type}/\${section.variant}\`, "data-instance-id": section.instanceId, "data-kit": "", ...(level && { "data-motion": level }) } as const;
    return <Kit key={section.instanceId} section={section} links={links} images={images} imageSizes={site.images} mediaRatio={mediaRatio} root={root} />;
  };
  const outside = (type: "header" | "footer") => doc.sections.filter((s) => s.type === type && kitFor(s, KIT_REGISTRY));
  const head = outside("header");
  const foot = outside("footer");
  const body = doc.sections.filter((s) => !head.includes(s) && !foot.includes(s));
  return (
    <div data-site-root data-motion-play="" style={kitVars(kitTokens)}>
      {head.map(draw)}
      {body.length > 0 && (
        <main data-fallback-root style={mainStyle} className="flex flex-col">
          {body.map(draw)}
        </main>
      )}
      {foot.map(draw)}
    </div>
  );
}
`;

/**
 * body 기본값(4.2 Q6 A) — 렌더 문서가 앱 base.css body에서 상속하는 값(상속 속성 전부, rem·rgb로 풀어 씀). 앱 토큰 이름·앱 CSS는 넣지 않는다.
 * 대조: template.test.ts가 앱 base.css body + 토큰 파일(:root)과 비교한다(RZ-AC-14)
 */
export const BODY_DEFAULTS: Readonly<Record<string, string>> = {
  "font-size": "0.875rem",
  "line-height": "1.375rem",
  color: "rgb(26 38 32)",
  background: "rgb(255 255 255)",
  "-webkit-font-smoothing": "antialiased",
  "-moz-osx-font-smoothing": "grayscale",
  "text-rendering": "optimizeLegibility",
  "word-break": "keep-all",
  "overflow-wrap": "anywhere",
};

export const INDEX_CSS = `@import "tailwindcss";
@import "./kit/kit.css";
@import "./kit/motion.css";
@import "./fonts.css";

@layer base {
  body {
    margin: 0;
${Object.entries(BODY_DEFAULTS)
  .map(([key, value]) => `    ${key}: ${value};`)
  .join("\n")}
  }
  [data-site-root] {
    font-family: var(--site-font, system-ui, sans-serif);
  }
}
`;
