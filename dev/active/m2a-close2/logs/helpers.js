await inner(() => { window.parent.__r = null; window.addEventListener('message', (e) => { const d = e.data ?? {}; if (d.type === 'rects') window.parent.__r = d.rects; }); });
const fillField = (id, v) => inner(([id, v]) => { const el = document.getElementById(id); const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); return el.value.length; }, [id, v]);
// 판정: 오버레이 안 문장 0 · 목록 줄 · 배지(글자·위치) · 배지가 덮는 "다른" 렌더 슬롯 · 목록이 iframe 위에 겹치는지
const judge = () => inner(() => {
  const f = document.querySelector('iframe'); const R = f.getBoundingClientRect(); const k = R.width / f.offsetWidth;
  const all = (window.parent.__r || []).map((x) => ({ inst: x[0], key: x[1], x: R.x + x[2] * k, y: R.y + x[3] * k, w: x[4] * k, h: x[5] * k }));
  const slots = all.filter((s) => s.key !== null);
  const hit = (b, s) => s.x < b.right && s.x + s.w > b.left && s.y < b.bottom && s.y + s.h > b.top;
  const list = document.querySelector('[data-canvas-issues]'); const lb = list?.getBoundingClientRect();
  const issues = [...(list?.querySelectorAll('li') ?? [])].map((li) => li.textContent);
  const badges = [...document.querySelectorAll('[data-issue-badge]')].map((b) => { const r = b.getBoundingClientRect(); const ring = b.parentElement.getBoundingClientRect(); return { text: b.textContent, aria: b.getAttribute('aria-hidden'), rect: [r.x, r.y, r.width, r.height].map(Math.round), ring: [ring.x, ring.y, ring.width, ring.height].map(Math.round), insideRing: r.top >= ring.top && r.right <= ring.right + 0.5, coversSlots: slots.filter((s) => hit(r, s)).map((s) => s.inst + '.' + s.key) }; });
  return { scale: k.toFixed(3), overlayP: document.querySelectorAll('[data-canvas-overlay] p').length, list: lb && [lb.x, lb.y, lb.width, lb.height].map(Math.round), listAboveFrame: lb ? lb.bottom <= R.top : null, frameTop: Math.round(R.top), issues, badges, sectionRects: all.filter((s) => s.key === null && s.inst.startsWith('hero')).map((s) => [s.inst, Math.round(s.x), Math.round(s.y), Math.round(s.w), Math.round(s.h)]), hScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth };
});
