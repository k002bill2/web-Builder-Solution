import { describe, expect, it } from "vitest";
import { checkPreload, readPreloadDeps } from "./preloadGuard.mjs";

const mapDeps = (files) =>
  `const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=${JSON.stringify(files)})))=>i.map(i=>d[i]);`;
const POLYFILL = 'for(const e of document.querySelectorAll(`link[rel="modulepreload"]`))r(e);new MutationObserver(e=>{})';

// manifest(키 = 소스, imports = 키) — index.html → react · Page → react·ui · Page가 Lazy를 dynamic import
const MANIFEST = {
  "index.html": { file: "assets/index-AAAAAAAA.js", isEntry: true, imports: ["_react-BBBBBBBB.js"], dynamicImports: ["src/Page.tsx"] },
  "_react-BBBBBBBB.js": { file: "assets/react-BBBBBBBB.js" },
  "src/Page.tsx": { file: "assets/Page-CCCCCCCC.js", imports: ["_react-BBBBBBBB.js", "src/ui.ts"], dynamicImports: ["src/Lazy.tsx"] },
  "src/ui.ts": { file: "assets/ui-DDDDDDDD.js" },
  "src/Lazy.tsx": { file: "assets/Lazy-EEEEEEEE.js", imports: ["_react-BBBBBBBB.js", "src/ui.ts"] },
};
const HTML = '<script type="module" crossorigin src="/assets/index-AAAAAAAA.js"></script>\n<link rel="modulepreload" crossorigin href="/assets/react-BBBBBBBB.js">';
const slimCode = {
  "assets/index-AAAAAAAA.js": mapDeps(["assets/Page-CCCCCCCC.js", "assets/ui-DDDDDDDD.js"]),
  "assets/Page-CCCCCCCC.js": mapDeps(["assets/Lazy-EEEEEEEE.js"]),
};
const judge = (code = slimCode, indexHtml = HTML) => checkPreload({ manifest: MANIFEST, codeOf: (file) => code[file] ?? "", indexHtml });

describe("readPreloadDeps — 청크의 __vite__mapDeps 목록", () => {
  it("목록을 읽고, 없으면 빈 배열", () => {
    expect(readPreloadDeps(`x;${mapDeps(["assets/a.js", "assets/b.css"])}y`)).toEqual(["assets/a.js", "assets/b.css"]);
    expect(readPreloadDeps("export const a=1")).toEqual([]);
  });
});

describe("checkPreload — 빌드 산출물 가드 (STUDIO-PRELOAD-SLIM · 조용한 무효화 방지)", () => {
  it("정리된 산출물은 통과하고 검사한 청크 수를 보고한다", () => {
    const { failures, lines } = judge();
    expect(failures).toEqual([]);
    expect(lines.join("\n")).toContain("preload 목록 2개 청크");
  });

  it("① JS 청크의 preload 목록에 호스트·엔트리 정적 닫힘 청크(react·ui)가 있으면 실패 — 훅 순서가 바뀌어 필터가 0건이 된 경우", () => {
    const { failures } = judge({ ...slimCode, "assets/Page-CCCCCCCC.js": mapDeps(["assets/Lazy-EEEEEEEE.js", "assets/react-BBBBBBBB.js", "assets/ui-DDDDDDDD.js"]) });
    expect(failures).toEqual(["preload: assets/Page-CCCCCCCC.js 목록에 이미 정적으로 받은 청크 assets/react-BBBBBBBB.js, assets/ui-DDDDDDDD.js"]);
  });

  it("① preload 목록이 있는 청크가 하나도 없으면 실패(형식이 바뀌어 검사가 빈 채 통과하지 않는다)", () => {
    expect(judge({}).failures).toEqual(["preload: __vite__mapDeps 목록이 있는 앱 청크가 없습니다 (Vite 출력 형식 확인)"]);
  });

  it("② index.html에 엔트리 정적 의존 modulepreload 링크가 없으면 실패 — HTML 호스트까지 걸러 첫 로드 워터폴", () => {
    const { failures } = judge(slimCode, '<script type="module" crossorigin src="/assets/index-AAAAAAAA.js"></script>');
    expect(failures).toEqual(["preload: dist/index.html에 assets/react-BBBBBBBB.js modulepreload 링크가 없습니다"]);
  });

  it("③ 엔트리에 modulepreload polyfill이 있으면 실패", () => {
    const code = { ...slimCode, "assets/index-AAAAAAAA.js": `${POLYFILL};${slimCode["assets/index-AAAAAAAA.js"]}` };
    expect(judge(code).failures).toEqual(["preload: 엔트리 assets/index-AAAAAAAA.js에 modulepreload polyfill이 있습니다 (build.modulePreload.polyfill: false)"]);
  });

  it("앱 manifest에 index.html이 없으면 실패", () => {
    expect(checkPreload({ manifest: {}, codeOf: () => "", indexHtml: "" }).failures).toEqual(["preload: 앱 manifest에 index.html 엔트리가 없습니다"]);
  });
});
