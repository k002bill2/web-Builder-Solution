/**
 * preload 중복 제거(STUDIO-PRELOAD-SLIM · REPORT-M2 후보 1) — `build.modulePreload.resolveDependencies`.
 *
 * Vite는 dynamic import마다 그 청크의 정적 의존 전부를 preload 목록(`__vite__mapDeps`)에 싣는다. 그중 호스트 청크(import()를
 * 부르는 청크)와 앱 엔트리의 정적 import 닫힘은 그 import() 시점에 이미 받아 평가가 끝났으므로 다시 적을 필요가 없다 —
 * 빼도 받는 파일·순서는 같고(동작 변화 0) 목록 문자열만 줄어든다(`/studio` 정규화 −0.15KB 실측).
 *
 * Vite 내부 순서 의존: resolveDependencies는 번들 그래프를 받지 않는다. 그래서 플러그인의 `generateBundle`(enforce pre ·
 * order pre)이 번들을 먼저 잡고, Vite import-analysis의 generateBundle(목록을 실제로 쓰는 곳)이 그 뒤에 resolveDependencies를
 * 부른다(Vite 8.3 실측). 순서가 바뀌면 잡은 번들이 비어 필터가 0건 = 기존과 같은 출력(안전한 방향 실패)이다 —
 * 조용한 무효화는 빌드 산출물 가드(`scripts/preloadGuard.mjs`)가 잡는다.
 */

/** 번들에서 쓰는 부분만 — Rollup OutputBundle(키 = 파일 이름)과 호환 */
export type BundleGraph = Readonly<Record<string, { type: "chunk"; isEntry?: boolean; imports?: readonly string[] } | { type: "asset" }>>;

/** Vite `ResolveModulePreloadDependenciesFn`의 context — hostType "html" = index.html의 modulepreload 링크 */
export interface PreloadHost {
  hostId: string;
  hostType: "html" | "js";
}

/** start 청크들과 그 정적 import를 끝까지 따라간 파일 이름 집합 */
export function staticClosure(bundle: BundleGraph, start: readonly string[]): ReadonlySet<string> {
  const seen = new Set<string>();
  const visit = (file: string): void => {
    if (seen.has(file)) return;
    seen.add(file);
    const output = bundle[file];
    if (output?.type === "chunk") output.imports?.forEach(visit);
  };
  start.forEach(visit);
  return seen;
}

/** JS 호스트 preload 목록에서 호스트·엔트리 정적 닫힘을 뺀다. HTML 호스트는 그대로 — index.html 링크를 지우면 첫 로드 워터폴(동작 변화) */
export function dedupPreloads(bundle: BundleGraph, deps: string[], { hostId, hostType }: PreloadHost): string[] {
  if (hostType !== "js") return deps;
  const entries = Object.keys(bundle).filter((file) => {
    const output = bundle[file];
    return output?.type === "chunk" && output.isEntry === true;
  });
  const loaded = staticClosure(bundle, [hostId, ...entries]);
  return deps.filter((dep) => !loaded.has(dep));
}

/** 번들을 잡는 플러그인 + 그 번들로 거르는 resolveDependencies 한 쌍(인스턴스마다 따로 — 빌드 간 상태 공유 없음) */
export function createPreloadDedup() {
  let bundle: BundleGraph = {};
  const plugin = {
    name: "preload-dedup-capture-bundle",
    enforce: "pre" as const,
    generateBundle: {
      order: "pre" as const,
      handler(_options: unknown, output: BundleGraph) {
        bundle = output;
      },
    },
  };
  const resolveDependencies = (_filename: string, deps: string[], host: PreloadHost): string[] => dedupPreloads(bundle, deps, host);
  return { plugin, resolveDependencies };
}
