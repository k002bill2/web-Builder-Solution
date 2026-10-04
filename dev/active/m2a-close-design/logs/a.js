console.log('PWD', String(pwd));
await setW(1280); await canvasTop(); await sleep(1500);
console.log('S1280', JSON.stringify(await state()));
await shot('v2-1280-01-top.png', 1280);
await scrollCanvas(700); await sleep(900); await shot('v2-1280-02.png', 1280);
await scrollCanvas(700); await sleep(900); await shot('v2-1280-03.png', 1280);
// 게이트 · 내보내기 · PNG 묶음
await inner(() => [...document.querySelectorAll('h3')].find((h) => h.textContent.trim() === '내보내기')?.scrollIntoView({ block: 'center' })); await sleep(800);
await shot('v2-1280-04-export.png', 1280);
console.log('EXPORT', JSON.stringify(await inner(() => { const h = [...document.querySelectorAll('h3')].find((h) => h.textContent.trim() === '내보내기'); return h?.parentElement?.parentElement?.innerText.slice(0, 1200); })));
await setW(390, 844); await canvasTop(); await sleep(1500);
console.log('S390', JSON.stringify(await state()));
await shot('v2-390-01-top.png', 390, 844);
await scrollCanvas(500); await sleep(800); await shot('v2-390-02.png', 390, 844);
console.log('B390', JSON.stringify(await inner(() => [...document.querySelectorAll('button,[role=tab],h2')].map((b) => b.tagName + ':' + (b.getAttribute('aria-label') || b.textContent).trim()).slice(0, 40))));
await closeTab(T);
