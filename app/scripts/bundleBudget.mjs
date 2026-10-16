// 번들 예산 판정 (부작용 없음 — 파일 읽기는 check-bundle-size.mjs가 한다). 판정 규칙의 근거는 그 스크립트 머리 주석.
// manifest = dist/.vite/manifest.json · sizeOf(file) = gzip KB · scenarios = 앱 라우트 시나리오 · renderAuto = 렌더 문서 자동 dynamic import.

export const APP_ENTRY = "index.html";
export const RENDER_ENTRY = "render.html";
export const ROUTE_BUDGET_KB = 100;
export const ROUTE_EAGER_BUDGET_KB = 125;
export const RENDER_JS_BUDGET_KB = 90;
export const RENDER_CSS_BUDGET_KB = 30;

const format = (kb) => `${kb.toFixed(2)}KB`;
/** 출력과 같은 소수 2자리로 비교(부동소수 오차 · 화면 값과 판정 일치) */
const over = (kb, limit) => Number(kb.toFixed(2)) > Number(limit.toFixed(2));
export const BASELINE_FILE = "scripts/m2cBaseline.json";
const isKb = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;
const isKbMap = (m) => typeof m === "object" && m !== null && Object.values(m).every(isKb);
/** M2c 기준선(SPEC m2c 7절 · IMG-AC-29) — { base, eagerKb: {시나리오: KB}, normEagerKb?: {시나리오: KB}(개정 16), toleranceKb, renderJsStopKb } */
const isBaseline = (b) =>
  typeof b === "object" && b !== null && typeof b.base === "string" && isKbMap(b.eagerKb) &&
  (b.normEagerKb === undefined || isKbMap(b.normEagerKb)) && isKb(b.toleranceKb) && isKb(b.renderJsStopKb);

/**
 * 해시 정규화(ADR-004 개정 16) — Vite 청크 이름 `이름-해시8.js|css`의 해시를 지운다. 어느 모듈이든 바뀌면 청크 해시가 바뀌고
 * 그 이름을 담은 importer의 gzip이 흔들린다(rs4-spike2 대조 N: /studio와 무관한 1글자 → −22B). 기준선 판정은 이 흔들림을 뺀 크기로 한다.
 */
export const normalizeHashes = (code) => code.replace(/-[A-Za-z0-9_-]{8}(\.(?:js|css))/g, "$1");

/**
 * baseline: undefined = 한도 판정만(개정 전) · 객체 = 한도 + 기준선 판정(시나리오 진입 > 기준선 + 허용 · 렌더 JS > 멈춤선 = 실패) · null·형식 틀림 = 실패.
 * 한도 값(100·125·시나리오 한도·90·30)은 기준선과 무관하게 그대로 판정한다.
 */
export function checkBundle({ manifest, sizeOf, normSizeOf, scenarios, renderAuto = [], baseline }) {
  const lines = [];
  const failures = [];
  const guard = baseline === undefined ? undefined : isBaseline(baseline) ? baseline : null;
  if (guard === null) failures.push(`M2c 기준선 파일이 없거나 형식이 틀립니다 (${BASELINE_FILE})`);
  for (const name of [...new Set([...Object.keys(guard?.eagerKb ?? {}), ...Object.keys(guard?.normEagerKb ?? {})])].filter((n) => !scenarios.some((s) => s.name === n))) {
    failures.push(`M2c 기준선: 시나리오 ${name}가 SCENARIOS에 없습니다`);
  }
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
    // eagerBudgetKb = 시나리오별 진입 직후 한도(ADR-004 개정 3 — /studio만 127). 없으면 ROUTE_EAGER_BUDGET_KB
    // routeBudgetKb = 시나리오별 첫 화면 한도(ADR-004 개정 7 — /catalog만 101). 없으면 ROUTE_BUDGET_KB
    for (const { name, page, auto, afterAction = [], eagerBudgetKb = ROUTE_EAGER_BUDGET_KB, routeBudgetKb = ROUTE_BUDGET_KB } of scenarios) {
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
      lines.push(`[bundle] ${name} 첫 화면 합계: ${format(routeKb)} / 예산 ${routeBudgetKb}KB · 진입 직후 자동 로드 포함: ${format(eagerKb)} / 예산 ${eagerBudgetKb}KB`);
      for (const key of afterAction) {
        const extra = [...staticClosure(key)].filter((file) => !eagerFiles.has(file));
        lines.push(`[bundle]   ${name} 조작 뒤 ${key}: +${format(sumKb(extra))} (${extra.length}개 파일, 예산 판정 밖)`);
      }
      if (routeKb > routeBudgetKb) failures.push(`${name}: 첫 화면 ${format(routeKb)} > ${routeBudgetKb}KB`);
      if (eagerKb > eagerBudgetKb) failures.push(`${name}: 진입 직후 자동 로드 포함 ${format(eagerKb)} > ${eagerBudgetKb}KB`);
      const norm = guard?.normEagerKb?.[name];
      if (norm !== undefined) {
        // 개정 16 — 기준선은 해시 정규화 크기로만 판정(raw는 참고). 정규화 함수가 없으면 조용히 raw로 돌아가지 않는다
        if (!normSizeOf) failures.push(`${name}: 해시 정규화 기준선이 있는데 정규화 크기 함수가 없습니다`);
        else {
          const normKb = [...eagerFiles].reduce((total, file) => total + normSizeOf(file), 0);
          lines.push(`[bundle]   ${name} 해시 정규화 진입 ${format(normKb)} · 기준선 ${format(norm)} + ${format(guard.toleranceKb)} (멈춤 > ${format(norm + guard.toleranceKb)}) — raw ${format(eagerKb)}는 참고(해시 이름 흔들림 포함)`);
          if (over(normKb, norm + guard.toleranceKb)) failures.push(`${name}: 해시 정규화 진입 ${format(normKb)} > 기준선 ${format(norm)} + ${format(guard.toleranceKb)}`);
        }
        continue;
      }
      const base = guard?.eagerKb[name];
      if (base !== undefined) {
        lines.push(`[bundle]   ${name} M2c 기준선 ${format(base)} + ${format(guard.toleranceKb)} (멈춤 > ${format(base + guard.toleranceKb)})`);
        if (over(eagerKb, base + guard.toleranceKb)) failures.push(`${name}: 진입 직후 자동 로드 포함 ${format(eagerKb)} > 기준선 ${format(base)} + ${format(guard.toleranceKb)}`);
      }
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
  else if (guard && over(jsKb, guard.renderJsStopKb)) failures.push(`렌더 문서: JS ${format(jsKb)} > 멈춤선 ${format(guard.renderJsStopKb)}`);
  if (cssKb > RENDER_CSS_BUDGET_KB) failures.push(`렌더 문서: CSS ${format(cssKb)} > ${RENDER_CSS_BUDGET_KB}KB`);
  return { lines, failures };
}
