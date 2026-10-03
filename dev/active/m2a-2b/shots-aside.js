// B10 대체 캡처(aside repl) — ego-browser Page.captureScreenshot가 단순 페이지에서도 타임아웃(2026-10-03 실측)이라
// 같은 출처 래퍼 iframe(폭 = 창 폭 1280/390, 높이 900) 안에서 shots.mjs와 같은 앱 흐름을 클릭으로 진행하고 뷰포트(clip) 캡처.
// 저장은 aside 세션 ./artifacts → 실행 뒤 shots/로 복사(aside가 세션 밖 경로 거부).
// 미디어쿼리·축소 비율은 iframe 폭 기준이라 창 폭 변경과 같다. fullPage 0.
const tB10 = await openTab('http://127.0.0.1:4337/catalog');
await page.evaluate(() => { document.open(); document.write('<!doctype html><body style="margin:0;background:#fff"><iframe id="w" src="/catalog" style="width:1280px;height:900px;border:0;display:block"></iframe></body>'); document.close(); });
const inner = async (fn, arg) => page.evaluate(([src, a]) => { const w = document.getElementById('w').contentWindow; return w.eval(`(${src})`)(a); }, [fn.toString(), arg]);
const waitIn = async (label, fn, ms = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await inner(fn)) return true; } catch {} await sleep(300); } console.log('TIMEOUT', label); return false; };
await waitIn('catalog', () => [...document.querySelectorAll('button')].some((b) => (b.getAttribute('aria-label') || b.textContent).trim().endsWith('비교 추가')));
await inner(() => { window.parent.__m = []; window.addEventListener('message', (e) => { const f = document.querySelector('iframe'); if (!f || e.source !== f.contentWindow) return; const d = e.data ?? {}; window.parent.__m.push({ type: d.type, code: d.code }); if (d.type === 'rects') window.parent.__r = d.rects; }); });
for (const n of ['모던 카페 브랜드', '프리미엄 헤어살롱', '동네 치과 클리닉']) { await inner((name) => [...document.querySelectorAll('button')].find((b) => (b.getAttribute('aria-label') || b.textContent).trim() === `${name} 비교 추가`).click(), n); await sleep(300); }
await inner(() => [...document.querySelectorAll('button,a')].find((b) => (b.getAttribute('aria-label') || b.textContent).trim() === '비교 보드 열기').click());
await waitIn('compare', () => location.pathname === '/compare' && !!document.querySelector("button[aria-label='Hero 구성: A 모던 카페 브랜드의 요소 선택']"));
await inner(() => document.querySelector("button[aria-label='Hero 구성: A 모던 카페 브랜드의 요소 선택']").click());
await waitIn('confirm', () => [...document.querySelectorAll('button')].some((b) => /^프로필 확정/.test(b.textContent.trim()) && b.getAttribute('aria-disabled') !== 'true' && !b.disabled));
await inner(() => [...document.querySelectorAll('button')].find((b) => /^프로필 확정/.test(b.textContent.trim())).click());
await waitIn('profile', () => /^\/profile\//.test(location.pathname) && [...document.querySelectorAll('button')].some((b) => /^3안 만들기/.test(b.textContent.trim())));
await inner(() => [...document.querySelectorAll('button')].find((b) => /^3안 만들기/.test(b.textContent.trim())).click());
await waitIn('3안', () => document.querySelector('table caption')?.textContent === '3안 비교');
await inner(() => document.querySelector("button[aria-label='A안 선택']").click());
await waitIn('A선택', () => document.querySelector("button[aria-label='A안 선택']")?.getAttribute('aria-pressed') === 'true');
await inner(() => [...document.querySelectorAll('button')].find((b) => /편집 시작/.test(b.textContent)).click());
await waitIn('studio', () => /^\/studio\//.test(location.pathname) && !!document.querySelector('#studio-canvas-heading'));
await waitIn('chip', () => !!document.querySelector('[data-canvas-overlay] span.bg-primary'));
const OUTB10 = '/Users/younghwankang/orca/workspaces/web-builder-solution/m2a-2b/dev/active/m2a-2b/shots';
const infoB10 = () => inner(() => { const f = document.querySelector('iframe'); const r = f.getBoundingClientRect(); const ps = [...document.querySelectorAll('p')].map((p) => p.textContent.trim()); const box = document.querySelector('[data-canvas-overlay] span.bg-primary')?.parentElement?.getBoundingClientRect(); const rs = window.parent.__r ?? []; const k = r.width / f.offsetWidth; const head = rs.find((x) => x[0] === 'hero-1' && x[1] === null); return { w: innerWidth, frameCssW: f.offsetWidth, shownW: r.width, scale: +k.toFixed(4), scaleCaption: ps.find((t) => /^축소 보기/.test(t)) ?? null, caption: ps.find((t) => /^(구조 미리보기 \(F0\)|실제 렌더)/.test(t)) ?? null, iframeTitle: f.title, box: box && [box.x, box.y, box.width, box.height].map((v) => +v.toFixed(1)), expected: head && [r.x + head[2] * k, r.y + head[3] * k, head[4] * k, head[5] * k].map((v) => +v.toFixed(1)), hScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth, errors: window.parent.__m.filter((m) => m.type === 'error').map((m) => m.code), sections: [...new Set(rs.map((x) => x[0]))] }; });
await fs.mkdir('./artifacts', { recursive: true });
console.log('PWD', String(pwd));
const shots = [];
for (const wB of [1280, 390]) {
  await page.evaluate((w) => { document.getElementById('w').style.width = w + 'px'; }, wB);
  await sleep(1800);
  await inner(() => document.querySelector('iframe')?.scrollIntoView({ block: 'start' }));
  await sleep(900);
  console.log('STATE', wB, JSON.stringify(await infoB10()));
  const H = await inner(() => document.querySelector('iframe').getBoundingClientRect().height);
  const n = Math.max(1, Math.ceil(H / 700) + 1);
  for (let i = 0; i < n; i++) {
    if (i > 0) { await inner((y) => { const f = document.querySelector('iframe'); let el = f.parentElement; while (el && !(el.scrollHeight > el.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(el).overflowY))) el = el.parentElement; if (el) el.scrollTop += y; else scrollBy(0, y); }, 700); await sleep(700); }
    const name = `b10-${wB}-${String(i + 1).padStart(2, '0')}.png`;
    const saved = await page.screenshot({ path: `./artifacts/${name}`, clip: { x: 0, y: 0, width: wB, height: 900 } });
    shots.push(String(saved?.path ?? saved));
  }
}
await inner(() => [...document.querySelectorAll('p')].find((p) => /^(구조 미리보기 \(F0\)|실제 렌더)/.test(p.textContent.trim()))?.scrollIntoView({ block: 'center' }));
await sleep(700);
shots.push(String(await page.screenshot({ path: './artifacts/b10-390-caption.png', clip: { x: 0, y: 0, width: 390, height: 900 } })).length);
console.log('SHOTS', shots.length);
await closeTab(tB10);
