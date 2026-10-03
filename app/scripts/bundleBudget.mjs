// 번들 예산 판정 (부작용 없음 — 파일 읽기는 check-bundle-size.mjs가 한다). 판정 규칙의 근거는 그 스크립트 머리 주석.
// manifest = dist/.vite/manifest.json · sizeOf(file) = gzip KB · scenarios = 앱 라우트 시나리오 · renderAuto = 렌더 문서 자동 dynamic import.

export const APP_ENTRY = "index.html";
export const RENDER_ENTRY = "render.html";
export const ROUTE_BUDGET_KB = 100;
export const ROUTE_EAGER_BUDGET_KB = 125;
export const RENDER_JS_BUDGET_KB = 90;
export const RENDER_CSS_BUDGET_KB = 30;

const format = (kb) => `${kb.toFixed(2)}KB`;

export function checkBundle({ manifest, sizeOf, scenarios, renderAuto = [] }) {
  const lines = [];
  const failures = [];
  const sumKb = (files) => [...files].reduce((total, file) => total + sizeOf(file), 0);

  /** 청크 키에서 정적 import를 따라간 JS 파일 집합 */
  const staticClosure = (key, seen = new Set()) => {
    const chunk = manifest[key];
    if (!chunk || seen.has(chunk.file)) return seen;
    seen.add(chunk.file);
    for (const dep of chunk.imports ?? []) staticClosure(dep, seen);
    return seen;
  };
  /** 정적 + dynamic import 전부를 따라간 키 집합(앱이 받을 수 있는 모든 청크 — 공유 판정용) */
  const reachable = (key, seen = new Set()) => {
    if (!manifest[key] || seen.has(key)) return seen;
    seen.add(key);
    for (const dep of [...(manifest[key].imports ?? []), ...(manifest[key].dynamicImports ?? [])]) reachable(dep, seen);
    return seen;
  };

  // 엔트리는 이름으로 고정한다 — 엔트리가 하나라는 가정(find(isEntry))은 렌더 엔트리를 공통으로 잡을 수 있다(결정 5)
  for (const key of Object.keys(manifest).filter((k) => manifest[k].isEntry && k !== APP_ENTRY && k !== RENDER_ENTRY)) {
    failures.push(`manifest에 알 수 없는 엔트리 ${key} — 엔트리는 ${APP_ENTRY}·${RENDER_ENTRY}만 허용합니다`);
  }

  if (!manifest[APP_ENTRY]) {
    failures.push(`앱: manifest에 ${APP_ENTRY} 엔트리가 없습니다`);
  } else {
    const common = staticClosure(APP_ENTRY);
    lines.push(`[bundle] 공통 JS (gzip, 참고): ${format(sumKb(common))}`);
    for (const file of common) lines.push(`  - ${file} ${format(sizeOf(file))}`);
    for (const { name, page, auto, afterAction = [] } of scenarios) {
      // 목록 키가 manifest에 없으면(경로 변경·다른 청크에 합쳐짐) 합계가 조용히 줄어든다 — 실패로 본다
      const missing = [page, ...auto, ...afterAction].filter((key) => !manifest[key]);
      if (missing.length > 0) {
        failures.push(`${name}: manifest에 ${missing.join(", ")}가 없습니다 (경로 변경 시 SCENARIOS를 고치세요)`);
        continue;
      }
      const routeFiles = staticClosure(page, new Set(common));
      const routeKb = sumKb(routeFiles);
      const eagerFiles = auto.reduce((files, key) => staticClosure(key, files), new Set(routeFiles));
      const eagerKb = sumKb(eagerFiles);
      lines.push(`[bundle] ${name} 첫 화면 합계: ${format(routeKb)} / 예산 ${ROUTE_BUDGET_KB}KB · 진입 직후 자동 로드 포함: ${format(eagerKb)} / 예산 ${ROUTE_EAGER_BUDGET_KB}KB`);
      for (const key of afterAction) {
        const extra = [...staticClosure(key)].filter((file) => !eagerFiles.has(file));
        lines.push(`[bundle]   ${name} 조작 뒤 ${key}: +${format(sumKb(extra))} (${extra.length}개 파일, 예산 판정 밖)`);
      }
      if (routeKb > ROUTE_BUDGET_KB) failures.push(`${name}: 첫 화면 ${format(routeKb)} > ${ROUTE_BUDGET_KB}KB`);
      if (eagerKb > ROUTE_EAGER_BUDGET_KB) failures.push(`${name}: 진입 직후 자동 로드 포함 ${format(eagerKb)} > ${ROUTE_EAGER_BUDGET_KB}KB`);
    }
  }

  if (!manifest[RENDER_ENTRY]) {
    failures.push(`렌더 문서: manifest에 ${RENDER_ENTRY} 엔트리가 없습니다`);
    return { lines, failures };
  }
  const missing = renderAuto.filter((key) => !manifest[key]);
  if (missing.length > 0) {
    failures.push(`렌더 문서: manifest에 ${missing.join(", ")}가 없습니다 (경로 변경 시 RENDER_AUTO를 고치세요)`);
    return { lines, failures };
  }
  // 렌더 문서 = 렌더 엔트리 정적 닫힘 + 조작 없이 받는 dynamic import(결정 1). CSS = 그 범위 청크가 싣는 css 전부
  const renderKeys = [RENDER_ENTRY, ...renderAuto].reduce((keys, key) => {
    const visit = (k) => {
      if (!manifest[k] || keys.has(k)) return;
      keys.add(k);
      for (const dep of manifest[k].imports ?? []) visit(dep);
    };
    visit(key);
    return keys;
  }, new Set());
  const renderJs = new Set([...renderKeys].map((key) => manifest[key].file));
  const renderCss = new Set([...renderKeys].flatMap((key) => manifest[key].css ?? []));
  const jsKb = sumKb(renderJs);
  const cssKb = sumKb(renderCss);
  lines.push(`[bundle] 렌더 문서(${RENDER_ENTRY}) JS 합계: ${format(jsKb)} / 예산 ${RENDER_JS_BUDGET_KB}KB · CSS 합계: ${format(cssKb)} / 예산 ${RENDER_CSS_BUDGET_KB}KB`);
  for (const file of [...renderJs, ...renderCss]) lines.push(`  - ${file} ${format(sizeOf(file))}`);
  // 공유 청크는 양쪽에 다 센다(결정 3) — 앱이 받을 수 있는 청크와 겹치는 파일을 보인다
  const appFiles = manifest[APP_ENTRY] ? new Set([...reachable(APP_ENTRY)].map((key) => manifest[key].file)) : new Set();
  const shared = [...renderJs].filter((file) => appFiles.has(file));
  lines.push(`[bundle]   렌더 문서 중 앱과 공유: ${shared.map((file) => `${file} ${format(sizeOf(file))}`).join(", ") || "없음"} (합 ${format(sumKb(shared))}, 양쪽에 다 센다)`);
  if (jsKb > RENDER_JS_BUDGET_KB) failures.push(`렌더 문서: JS ${format(jsKb)} > ${RENDER_JS_BUDGET_KB}KB`);
  if (cssKb > RENDER_CSS_BUDGET_KB) failures.push(`렌더 문서: CSS ${format(cssKb)} > ${RENDER_CSS_BUDGET_KB}KB`);
  return { lines, failures };
}
