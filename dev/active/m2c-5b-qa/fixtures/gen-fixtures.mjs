// M2C-5 QA fixture 생성기 — 자체 제작만(캔버스 패턴 + 직접 붙인 EXIF/방향 태그). 외부 이미지·실사진 0.
// 실행: SPACE=<id> ego-browser nodejs < gen-fixtures.mjs   (Ego Lite 페이지의 OffscreenCanvas로 그려 인코딩 → Node에서 저장·EXIF 삽입)
// 결과: 이 폴더에 바이너리 + MANIFEST.json(크기·sha256). 바이너리는 .gitignore — 이 스크립트로 재생성한다.
const DIR = "/Users/younghwankang/orca/workspaces/web-builder-solution/m2c-5b-qa/dev/active/m2c-5b-qa/fixtures";
const { writeFile } = await import("node:fs/promises");
const { createHash } = await import("node:crypto");
const task = await taskSpace(77);
console.log("SPACE", task.spaceId);
const page = task.page("p1");
if (!(await page.url()).startsWith("http://127.0.0.1:4339")) await page.goto("http://127.0.0.1:4339/");

// 브라우저 쪽: spec = {w,h,kind,type,q,seed,rotateCCW?} → base64
const draw = (spec) => page.evaluate(async (s) => {
  let seed = s.seed >>> 0;
  const rnd = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const W = s.rotateCCW ? s.h : s.w, H = s.rotateCCW ? s.w : s.h; // 그림은 "보이는 방향"(W×H)으로 그린다
  const pic = new OffscreenCanvas(W, H);
  const g = pic.getContext("2d");
  if (s.kind === "alpha") {
    g.clearRect(0, 0, W, H);
    g.fillStyle = "rgba(30,120,200,0.9)"; g.beginPath(); g.arc(W / 2, H / 2, Math.min(W, H) / 3, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(240,80,60,0.5)"; g.fillRect(W * 0.1, H * 0.1, W * 0.3, H * 0.3);
  } else if (s.kind === "noise") {
    const img = g.createImageData(W, H);
    for (let i = 0; i < img.data.length; i += 4) { img.data[i] = rnd() * 255; img.data[i + 1] = rnd() * 255; img.data[i + 2] = rnd() * 255; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
  } else {
    const hue = Math.floor(rnd() * 360);
    const grd = g.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, `hsl(${hue},60%,55%)`); grd.addColorStop(1, `hsl(${(hue + 120) % 360},60%,35%)`);
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 24; i++) { g.fillStyle = `hsla(${(hue + i * 37) % 360},70%,${40 + rnd() * 40}%,0.6)`; g.beginPath(); g.arc(rnd() * W, rnd() * H, (0.03 + rnd() * 0.12) * Math.min(W, H), 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = Math.max(2, W / 400);
    for (let x = 0; x < W; x += W / 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    // 방향 표식: 위쪽 화살표 + 글자 "UP"(보이는 방향 기준)
    g.fillStyle = "#fff"; const a = Math.min(W, H) / 6;
    g.beginPath(); g.moveTo(W / 2, H * 0.08); g.lineTo(W / 2 - a / 2, H * 0.08 + a); g.lineTo(W / 2 + a / 2, H * 0.08 + a); g.closePath(); g.fill();
    g.font = `bold ${Math.round(a * 0.8)}px sans-serif`; g.textAlign = "center"; g.fillText(s.label || "UP", W / 2, H * 0.08 + a * 2);
  }
  let out = pic;
  if (s.rotateCCW) { // 저장 바이트 = 보이는 그림을 반시계 90° 돌린 가로 그림 → EXIF 방향 6(시계 90°)으로 바로 보인다
    out = new OffscreenCanvas(s.w, s.h);
    const o = out.getContext("2d"); o.translate(0, s.h); o.rotate(-Math.PI / 2); o.drawImage(pic, 0, 0);
  }
  const blob = await out.convertToBlob({ type: s.type, quality: s.q });
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = ""; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return { type: blob.type, b64: btoa(bin) };
}, spec);

// EXIF APP1(TIFF little-endian): IFD0 = Orientation + Make("QA-FIXTURE") + GPS 포인터 · GPS IFD = 위도/경도(서울 근처 가짜 값)
const exifApp1 = (orientation) => {
  const entries0 = 3, entriesG = 4;
  const ifd0 = 8, ifd0Size = 2 + entries0 * 12 + 4;
  const makeOff = ifd0 + ifd0Size; const make = Buffer.from("QA-FIXTURE\0");
  const gpsOff = makeOff + make.length + (make.length % 2);
  const gpsSize = 2 + entriesG * 12 + 4;
  const latOff = gpsOff + gpsSize, lonOff = latOff + 24;
  const t = Buffer.alloc(lonOff + 24);
  t.write("II", 0); t.writeUInt16LE(42, 2); t.writeUInt32LE(ifd0, 4);
  let p = ifd0; t.writeUInt16LE(entries0, p); p += 2;
  const ent = (tag, type, count, val) => { t.writeUInt16LE(tag, p); t.writeUInt16LE(type, p + 2); t.writeUInt32LE(count, p + 4); if (type === 3) t.writeUInt16LE(val, p + 8); else t.writeUInt32LE(val, p + 8); p += 12; };
  ent(0x010f, 2, make.length, makeOff); ent(0x0112, 3, 1, orientation); ent(0x8825, 4, 1, gpsOff);
  t.writeUInt32LE(0, p); make.copy(t, makeOff);
  p = gpsOff; t.writeUInt16LE(entriesG, p); p += 2;
  const entA = (tag, type, count, raw) => { t.writeUInt16LE(tag, p); t.writeUInt16LE(type, p + 2); t.writeUInt32LE(count, p + 4); if (typeof raw === "string") t.write(raw, p + 8); else t.writeUInt32LE(raw, p + 8); p += 12; };
  entA(0x0001, 2, 2, "N\0"); entA(0x0002, 5, 3, latOff); entA(0x0003, 2, 2, "E\0"); entA(0x0004, 5, 3, lonOff);
  t.writeUInt32LE(0, p);
  const rat = (off, d, m, s) => { [[d, 1], [m, 1], [s, 100]].forEach(([n, den], i) => { t.writeUInt32LE(n, off + i * 8); t.writeUInt32LE(den, off + i * 8 + 4); }); };
  rat(latOff, 37, 33, 1234); rat(lonOff, 126, 58, 5678);
  const body = Buffer.concat([Buffer.from("Exif\0\0"), t]);
  const seg = Buffer.alloc(4); seg[0] = 0xff; seg[1] = 0xe1; seg.writeUInt16BE(body.length + 2, 2);
  return Buffer.concat([seg, body]);
};
const withExif = (jpg, o) => Buffer.concat([jpg.subarray(0, 2), exifApp1(o), jpg.subarray(2)]);

const manifest = [];
const save = async (name, buf, note) => {
  await writeFile(`${DIR}/${name}`, buf);
  manifest.push({ name, bytes: buf.length, sha256: createHash("sha256").update(buf).digest("hex").slice(0, 16), note });
  console.log("WROTE", name, buf.length);
};
const enc = async (spec) => { const r = await draw(spec); if (r.type !== spec.type) throw new Error(`encode ${spec.type} → ${r.type}`); return Buffer.from(r.b64, "base64"); };

const jpg12 = await enc({ w: 4000, h: 3000, kind: "pattern", type: "image/jpeg", q: 0.92, seed: 12 });
await save("f01-jpeg-12mp.jpg", jpg12, "4000×3000 JPEG 패턴 (QB-2·QB-5)");
await save("f02-png-alpha.png", await enc({ w: 1200, h: 800, kind: "alpha", type: "image/png", seed: 2 }), "1200×800 PNG 투명(색 유형 6) (QB-2)");
await save("f03-webp.webp", await enc({ w: 1600, h: 900, kind: "pattern", type: "image/webp", q: 0.85, seed: 3 }), "1600×900 WebP (QB-2)");
const land = await enc({ w: 1200, h: 800, kind: "pattern", type: "image/jpeg", q: 0.9, seed: 4, rotateCCW: true, label: "UP6" });
await save("f04-orient6-gps.jpg", withExif(land, 6), "저장 1200×800 · EXIF 방향 6 + GPS → 보이는 800×1200, 화살표 위 (QB-4)");
await save("f05-exif-gps.jpg", withExif(await enc({ w: 1600, h: 1000, kind: "pattern", type: "image/jpeg", q: 0.9, seed: 5, label: "GPS" }), 1), "1600×1000 · EXIF 방향 1 + GPS + Make (QB-4 EXIF 0)");
await save("f06-disguised-jpeg.png", await enc({ w: 800, h: 600, kind: "pattern", type: "image/jpeg", q: 0.9, seed: 6 }), "JPEG 바이트를 .png 이름으로 — 형식 위장 (QB-3)");
await save("f07-11mb.jpg", Buffer.concat([jpg12, Buffer.alloc(11 * 1024 * 1024 - jpg12.length)]), "유효 JPEG 뒤 0 채움 → 11MB (QB-3 V4)");
await save("f08-41mp.jpg", await enc({ w: 8000, h: 5125, kind: "pattern", type: "image/jpeg", q: 0.6, seed: 8 }), "8000×5125 = 41,000,000화소 JPEG ≤10MB (QB-3 V5) — PNG는 22MB라 V4에 먼저 걸려 JPEG로");
await save("f09-truncated.jpg", jpg12.subarray(0, 4096), "12MP JPEG 앞 4096바이트 — SOF 있음, 디코드 실패 (QB-3 V6)");
await save("f09b-truncated-head.jpg", jpg12.subarray(0, 12), "앞 12바이트 — 헤더 못 읽음 (QB-3 V5)");
await save("f10-vector.svg", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#3a7"/></svg>'), "SVG (QB-3 V1)");
await save("f11-land-3x2.jpg", await enc({ w: 1500, h: 1000, kind: "pattern", type: "image/jpeg", q: 0.9, seed: 11, label: "3:2" }), "가로 3:2 (QB-6)");
await save("f12-port-2x3.jpg", await enc({ w: 1000, h: 1500, kind: "pattern", type: "image/jpeg", q: 0.9, seed: 13, label: "2:3" }), "세로 2:3 (QB-6)");
await save("f13-pano-4x1.jpg", await enc({ w: 3200, h: 800, kind: "pattern", type: "image/jpeg", q: 0.9, seed: 14, label: "4:1" }), "파노라마 4:1 → 2:1로 잘림 기대 (QB-6)");
for (let i = 1; i <= 6; i++) await save(`f2${i}-set-${i}.jpg`, await enc({ w: 1600, h: 1000, kind: "pattern", type: "image/jpeg", q: 0.9, seed: 20 + i, label: `N${i}` }), `9장 문서용 패턴 ${i} (QB-8)`);
for (let i = 1; i <= 4; i++) await save(`f3${i}-noise-${i}.jpg`, await enc({ w: 3000, h: 2000, kind: "noise", type: "image/jpeg", q: 0.95, seed: 30 + i }), `노이즈 3000×2000 (B-M2C-01 큰 문서)`);
await writeFile(`${DIR}/MANIFEST.json`, JSON.stringify(manifest, null, 1));
console.log("DONE", manifest.length);
