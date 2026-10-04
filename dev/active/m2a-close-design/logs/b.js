console.log('PWD', String(pwd));
const fh = () => inner(() => { const f = document.querySelector('iframe'); const r = f.getBoundingClientRect(); return [Math.round(r.y), Math.round(r.width), Math.round(r.height), f.style.height || null, f.getAttribute('height')]; });
for (let i = 0; i < 8; i++) { console.log('T', i, JSON.stringify(await fh()), 'rects', await inner(() => (window.parent.__r || []).length)); await sleep(700); }
console.log('S390', JSON.stringify(await state()));
await inner(() => document.querySelector('iframe').scrollIntoView({ block: 'start' })); await sleep(1000);
await shot('v2-390-fresh-canvas.png', 390, 844);
// 모바일 폭 미리보기
await clickText(/^모바일$/); await sleep(2500);
console.log('MOB', JSON.stringify(await fh()), JSON.stringify(await state()));
await inner(() => document.querySelector('iframe').scrollIntoView({ block: 'start' })); await sleep(1000);
await shot('v2-390-mobileframe.png', 390, 844);
await clickText(/^데스크톱$/); await sleep(2500);
console.log('DESK', JSON.stringify(await fh()));
await closeTab(T);
