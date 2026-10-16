// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createPreloadDedup, dedupPreloads, staticClosure, type BundleGraph } from "./preloadDedup";

// 엔트리 index → react·shared(정적) · 페이지 Page → react·ui(정적) · ui → shared(정적) · Page가 lazy 청크 Lazy를 dynamic import
const BUNDLE: BundleGraph = {
  "assets/index.js": { type: "chunk", isEntry: true, imports: ["assets/react.js", "assets/shared.js"] },
  "assets/react.js": { type: "chunk", isEntry: false, imports: [] },
  "assets/shared.js": { type: "chunk", isEntry: false, imports: [] },
  "assets/Page.js": { type: "chunk", isEntry: false, imports: ["assets/react.js", "assets/ui.js"] },
  "assets/ui.js": { type: "chunk", isEntry: false, imports: ["assets/shared.js"] },
  "assets/Lazy.js": { type: "chunk", isEntry: false, imports: ["assets/react.js", "assets/ui.js", "assets/extra.js"] },
  "assets/extra.js": { type: "chunk", isEntry: false, imports: [] },
  "assets/Lazy.css": { type: "asset" },
};
const LAZY_DEPS = ["assets/Lazy.js", "assets/react.js", "assets/ui.js", "assets/shared.js", "assets/extra.js", "assets/Lazy.css"];

describe("staticClosure — 정적 import 닫힘", () => {
  it("시작 청크와 정적 import를 끝까지 따라간다(순환·중복 안전, 없는 키·asset은 자기만)", () => {
    expect([...staticClosure(BUNDLE, ["assets/Page.js"])].sort()).toEqual(["assets/Page.js", "assets/react.js", "assets/shared.js", "assets/ui.js"]);
    const cyclic: BundleGraph = { a: { type: "chunk", imports: ["b"] }, b: { type: "chunk", imports: ["a"] } };
    expect([...staticClosure(cyclic, ["a"])].sort()).toEqual(["a", "b"]);
    expect([...staticClosure(BUNDLE, ["assets/missing.js", "assets/Lazy.css"])].sort()).toEqual(["assets/Lazy.css", "assets/missing.js"]);
  });
});

describe("dedupPreloads — 이미 정적으로 받은 청크를 preload 목록에서 뺀다 (M2 후보 1)", () => {
  it("JS 호스트: 호스트 닫힘(react·ui·shared)과 엔트리 닫힘을 빼고 새 청크·CSS만 남긴다(순서 유지)", () => {
    expect(dedupPreloads(BUNDLE, LAZY_DEPS, { hostId: "assets/Page.js", hostType: "js" })).toEqual(["assets/Lazy.js", "assets/extra.js", "assets/Lazy.css"]);
  });

  it("호스트가 엔트리 닫힘 밖이어도 엔트리 닫힘(shared)은 이미 받았으므로 뺀다", () => {
    const deps = ["assets/Page.js", "assets/react.js", "assets/ui.js", "assets/shared.js"];
    expect(dedupPreloads(BUNDLE, deps, { hostId: "assets/index.js", hostType: "js" })).toEqual(["assets/Page.js", "assets/ui.js"]);
  });

  it("HTML 호스트는 그대로 돌려준다 — index.html의 modulepreload 링크(react 등)를 지우면 첫 로드 워터폴(동작 변화)", () => {
    const deps = ["assets/react.js", "assets/shared.js"];
    expect(dedupPreloads(BUNDLE, deps, { hostId: "index.html", hostType: "html" })).toBe(deps);
  });

  it("입력 배열을 바꾸지 않는다", () => {
    const deps = [...LAZY_DEPS];
    dedupPreloads(BUNDLE, deps, { hostId: "assets/Page.js", hostType: "js" });
    expect(deps).toEqual(LAZY_DEPS);
  });
});

describe("createPreloadDedup — 플러그인이 번들을 잡아 resolveDependencies에 넘긴다", () => {
  it("generateBundle(order pre) 전에는 번들이 비어 목록을 그대로 둔다(안전한 방향) · 잡은 뒤에는 뺀다", () => {
    const { plugin, resolveDependencies } = createPreloadDedup();
    const ctx = { hostId: "assets/Page.js", hostType: "js" as const };
    expect(resolveDependencies("assets/Lazy.js", LAZY_DEPS, ctx)).toEqual(LAZY_DEPS);
    expect(plugin.enforce).toBe("pre");
    expect(plugin.generateBundle.order).toBe("pre");
    plugin.generateBundle.handler({}, BUNDLE);
    expect(resolveDependencies("assets/Lazy.js", LAZY_DEPS, ctx)).toEqual(["assets/Lazy.js", "assets/extra.js", "assets/Lazy.css"]);
  });

  it("인스턴스마다 번들을 따로 잡는다(모듈 전역 상태 없음)", () => {
    const first = createPreloadDedup();
    const second = createPreloadDedup();
    first.plugin.generateBundle.handler({}, BUNDLE);
    expect(second.resolveDependencies("assets/Lazy.js", LAZY_DEPS, { hostId: "assets/Page.js", hostType: "js" })).toEqual(LAZY_DEPS);
  });
});
