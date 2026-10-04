console.log('PWD', String(pwd));
const VIEW = typeof VIEW0 === 'undefined' ? 'desktop' : VIEW0;
await inner(() => { window.parent.__msgs = []; window.addEventListener('message', (e) => { const d = e.data ?? {}; window.parent.__msgs.push(d.type + (d.code ? ':' + d.code : '')); }); });
const drawn = await waitIn('rects', () => (window.parent.__r || []).length > 0, 8000);
if (!drawn) { await inner(() => document.querySelector('input[name=studio-preview-width][value=tablet]').click()); await sleep(1500); await inner(() => document.querySelector('input[name=studio-preview-width][value=desktop]').click()); console.log('redraw', await waitIn('rects2', () => (window.parent.__r || []).length > 0, 8000)); }
console.log('MSGS', JSON.stringify(await inner(() => window.parent.__msgs)));
for (let k = 0; k < 2; k++) { console.log('mv', await clickText(/^첫 구조 미리보기 섹션으로 이동$/)); await sleep(500); console.log('del', await inner(() => { const b = [...document.querySelectorAll('button')].filter((b) => b.textContent.trim() === '삭제' && !b.disabled && b.getAttribute('aria-disabled') !== 'true' && b.offsetParent); if (!b.length) return 'none'; b[b.length - 1].click(); return b.length; })); await sleep(700); }
console.log('pi', await clickText(/^페이지 정보/)); await waitIn('pi', () => [...document.querySelectorAll('label')].some((l) => /제목/.test(l.textContent) && !/섹션/.test(l.textContent)), 5000);
const fields = await inner(() => [...document.querySelectorAll('input:not([type=radio]),textarea')].map((e) => [e.id, e.labels?.[0]?.textContent.trim()]));
console.log('FIELDS', JSON.stringify(fields));
const tId = fields.find((f) => /제목/.test(f[1] || '') && !/섹션/.test(f[1] || ''))?.[0], dId = fields.find((f) => /설명/.test(f[1] || ''))?.[0];
if (tId) await fillField(tId, '모던 카페 브랜드');
if (dId) await fillField(dId, '동네에서 매일 굽는 빵과 커피를 소개하는 작은 카페입니다.');
await sleep(1500);
if (VIEW === 'mobile') { await inner(() => document.querySelector('input[name=studio-preview-width][value=mobile]').click()); await sleep(2500); await waitIn('rects-m', () => (window.parent.__r || []).length > 0, 8000); }
console.log('GATEHEAD', JSON.stringify(await inner(() => [...document.querySelectorAll('h2')].find((h) => h.textContent.trim() === '품질 게이트')?.parentElement?.innerText.slice(0, 300))));
// 가로채기: object URL Blob 보관 · a[download] 클릭 무효
await inner(() => { const W = window; W.__blobs = []; const orig = W.URL.createObjectURL.bind(W.URL); W.URL.createObjectURL = (b) => { const u = orig(b); W.__blobs.push({ u, b }); return u; }; const oc = W.HTMLAnchorElement.prototype.click; W.HTMLAnchorElement.prototype.click = function () { if (this.hasAttribute('download')) { W.__dl = this.getAttribute('download'); return; } return oc.call(this); }; });
// 캔버스 캡처(같은 순간 — 내보내기 직전)
await inner(() => document.querySelector('iframe').scrollIntoView({ block: 'start' })); await sleep(1200);
const CW = 1280;
await shot(`v4-canvas-${VIEW}-01.png`, CW); await scrollCanvas(800); await sleep(700); await shot(`v4-canvas-${VIEW}-02.png`, CW); await scrollCanvas(800); await sleep(700); await shot(`v4-canvas-${VIEW}-03.png`, CW);
// PNG
console.log('png', await clickText(/^PNG 내려받기$/));
await waitIn('png', () => /PNG를 내려받았습니다|PNG를 만들지 못했습니다/.test(document.body.innerText), 20000); console.log('MSGS2', JSON.stringify(await inner(() => window.parent.__msgs.slice(-8))));
console.log('PNGSTATE', await inner(() => (document.body.innerText.match(/PNG를 (내려받았습니다[^\n]*|만들지 못했습니다[^\n]*)/) || [''])[0]), await inner(() => window.__dl));
const png = await inner(async () => { const e = window.__blobs.filter((x) => x.b.type === 'image/png').pop(); if (!e) return null; return await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(e.b); }); });
if (png) { await fs.writeFile(`./artifacts/v4-png-${VIEW}.png`, Buffer.from(png.split(',')[1], 'base64')); console.log('PNG saved', png.length); }
{
  console.log('html', await clickText(/^정적 HTML 내보내기$/)); await sleep(2500);
  console.log('EXPTXT', JSON.stringify(await inner(() => { const h = [...document.querySelectorAll('h3')].find((h) => h.textContent.trim() === '내보내기'); return h?.parentElement?.innerText.slice(0, 600); })), JSON.stringify(await inner(() => [...document.querySelectorAll('a')].map((a) => [a.textContent.trim().slice(0, 30), a.getAttribute('download'), (a.getAttribute('href') || '').slice(0, 40)]).filter((x) => x[1] !== null || /내려/.test(x[0])))));
  const dlg = await inner(() => !!document.querySelector('dialog[open]'));
  if (dlg) { console.log('dialog', await clickText(/경고를 확인했습니다/)); }
  await waitIn('htmldone', () => !!document.querySelector('a[download]'), 12000);
  const h = await inner(async () => { const a = document.querySelector('a[download]'); if (!a) return null; const t = await (await fetch(a.href)).text(); return { name: a.getAttribute('download'), t }; });
  if (h) { await fs.writeFile(`./artifacts/v4-export.html`, h.t); console.log('HTML saved', h.name, h.t.length); }
  console.log('AFTER', JSON.stringify(await inner(() => { const a = document.querySelector('a[download]'); return a?.closest('section,div')?.innerText.slice(0, 300); })));
}
await closeTab(T);
