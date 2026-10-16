// preload 빌드 산출물 가드(STUDIO-PRELOAD-SLIM, 부작용 없음 — 파일 읽기는 check-bundle-size.mjs). 설정·근거: src/build/preloadDedup.ts · vite.config.ts.
// preload 중복 제거는 Vite 내부 훅 순서에 기대므로, 순서가 바뀌면 조용히 0건이 된다 — 산출물에서 직접 확인한다.
// manifest = 앱 manifest(dist/.vite/manifest.json — 렌더 문서 빌드는 이 설정 밖) · codeOf(file) = dist 파일 내용 · indexHtml = dist/index.html.
//  ① JS 청크의 preload 목록(__vite__mapDeps)에 그 청크·앱 엔트리의 정적 import 닫힘 청크가 없다 (목록 있는 청크 0개도 실패)
//  ② index.html에 엔트리 정적 의존 modulepreload 링크가 그대로 있다 (HTML 호스트는 거르지 않는다)
//  ③ 엔트리 청크에 modulepreload polyfill(`link[rel="modulepreload"]` 훑기)이 없다 (build.modulePreload.polyfill: false)

const APP_ENTRY = "index.html";
const MAP_DEPS = /m\.f\|\|\(m\.f=(\[[^\]]*\])\)/;
const POLYFILL_MARK = 'querySelectorAll(`link[rel="modulepreload"]`)';

/** 청크 코드의 __vite__mapDeps 파일 목록(없으면 빈 배열) */
export const readPreloadDeps = (code) => {
  const match = MAP_DEPS.exec(code);
  return match ? JSON.parse(match[1]) : [];
};

export function checkPreload({ manifest, codeOf, indexHtml }) {
  const entry = manifest[APP_ENTRY];
  if (!entry) return { lines: [], failures: [`preload: 앱 manifest에 ${APP_ENTRY} 엔트리가 없습니다`] };
  const closure = (key, seen = new Set()) => {
    const chunk = manifest[key];
    if (!chunk || seen.has(chunk.file)) return seen;
    seen.add(chunk.file);
    for (const dep of chunk.imports ?? []) closure(dep, seen);
    return seen;
  };
  const entryClosure = closure(APP_ENTRY);
  const failures = [];
  let checked = 0;
  for (const key of Object.keys(manifest).filter((k) => manifest[k].file.endsWith(".js"))) {
    const { file } = manifest[key];
    const deps = readPreloadDeps(codeOf(file));
    if (deps.length === 0) continue;
    checked += 1;
    const loaded = closure(key, new Set(entryClosure));
    const dup = deps.filter((dep) => loaded.has(dep));
    if (dup.length > 0) failures.push(`preload: ${file} 목록에 이미 정적으로 받은 청크 ${dup.join(", ")}`);
  }
  if (checked === 0) failures.push("preload: __vite__mapDeps 목록이 있는 앱 청크가 없습니다 (Vite 출력 형식 확인)");
  for (const file of [...entryClosure].filter((f) => f !== entry.file)) {
    if (!indexHtml.includes(`<link rel="modulepreload" crossorigin href="/${file}">`)) failures.push(`preload: dist/index.html에 ${file} modulepreload 링크가 없습니다`);
  }
  if (codeOf(entry.file).includes(POLYFILL_MARK)) failures.push(`preload: 엔트리 ${entry.file}에 modulepreload polyfill이 있습니다 (build.modulePreload.polyfill: false)`);
  return { lines: [`[bundle] preload 가드: preload 목록 ${checked}개 청크 · index.html modulepreload ${entryClosure.size - 1}개 · polyfill 검사 — ${failures.length === 0 ? "통과" : "실패"}`], failures };
}
