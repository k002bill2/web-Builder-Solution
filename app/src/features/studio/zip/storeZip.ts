/**
 * store(무압축) ZIP 작성기 (EXPORT-SPEC 2.4 · 의존성 0) — 로컬 헤더 · 중앙 디렉터리 · EOCD · CRC-32.
 * version needed 10 · general purpose flag 0(이름 ASCII라 UTF-8 bit 11 불필요 · 크기를 미리 알아 bit 3 불필요).
 * ZIP64 0 — 항목 65,535개 이상이거나 크기·오프셋이 상한(기본 0xFFFFFFFF) 이상이면 실패.
 * 결과는 조각 배열(Uint8Array[]) — 본문을 복사하지 않고 Blob 조각으로 넘긴다.
 */
export interface ZipEntry {
  /** `/` 구분 상대 경로 — ASCII(0x20~0x7E) · 100자 이하 · 선행 `/`·`..`·`\`·`:`·끝 `/` 금지 (SPEC 4.3) */
  readonly name: string;
  readonly data: Uint8Array;
}

/** 크기 상한 주입(테스트용) — 기본 0xFFFFFFFF(ZIP64 경계) */
export interface ZipLimits {
  readonly max32?: number;
}

const CRC_TABLE = /* @__PURE__ */ (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/** CRC-32(APPNOTE 4.4.7 · reflected 0xEDB88320) */
export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const MAX32 = 0xffffffff;
/** EOCD 항목 수 0xFFFF는 ZIP64 표지값이라 그 미만만 허용 */
const MAX_ENTRIES = 0xffff;
const MAX_NAME = 100;
const ASCII_NAME = /^[\x20-\x7e]+$/;
const BAD_NAME = /^\/|(^|\/)\.\.(\/|$)|\\|:|\/$/;

/** 경로 규칙(SPEC 4.3) — 위반 시 throw. 대소문자만 다른 중복도 거절 */
function assertNames(entries: readonly ZipEntry[]): void {
  const seen = new Set<string>();
  for (const { name } of entries) {
    if (!ASCII_NAME.test(name) || name.length > MAX_NAME || BAD_NAME.test(name)) throw new Error(`ZIP 경로가 올바르지 않습니다: ${name}`);
    const key = name.toLowerCase();
    if (seen.has(key)) throw new Error(`ZIP 경로가 중복됩니다: ${name}`);
    seen.add(key);
  }
}

/** MS-DOS 날짜·시각(로컬 · 2초 내림) — 1980 미만은 1980-01-01 00:00:00, 표현 불가(Invalid · 2108년 이후)는 throw */
function dosDateTime(date: Date): { readonly time: number; readonly day: number } {
  const year = date.getFullYear();
  if (Number.isNaN(year) || year > 2107) throw new Error("ZIP 시각을 표현할 수 없습니다");
  if (year < 1980) return { time: 0, day: (1 << 5) | 1 };
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    day: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

interface Fields {
  readonly name: Uint8Array;
  readonly crc: number;
  readonly size: number;
  readonly time: number;
  readonly day: number;
}

/** 로컬·중앙 공통 26바이트(version needed 10 · flag 0 · store · 시각 · CRC · 크기 2번 · 이름 길이 · extra 0) */
function writeCommon(view: DataView, at: number, f: Fields): void {
  view.setUint16(at, 10, true);
  view.setUint16(at + 2, 0, true);
  view.setUint16(at + 4, 0, true);
  view.setUint16(at + 6, f.time, true);
  view.setUint16(at + 8, f.day, true);
  view.setUint32(at + 10, f.crc, true);
  view.setUint32(at + 14, f.size, true);
  view.setUint32(at + 18, f.size, true);
  view.setUint16(at + 22, f.name.length, true);
  view.setUint16(at + 24, 0, true);
}

function localHeader(f: Fields): Uint8Array {
  const head = new Uint8Array(30 + f.name.length);
  const view = new DataView(head.buffer);
  view.setUint32(0, 0x04034b50, true);
  writeCommon(view, 4, f);
  head.set(f.name, 30);
  return head;
}

/** 중앙 헤더 — version made by 10(상위 바이트 0 = MS-DOS) · 주석·디스크·속성 0 */
function centralHeader(f: Fields, offset: number): Uint8Array {
  const head = new Uint8Array(46 + f.name.length);
  const view = new DataView(head.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 10, true);
  writeCommon(view, 6, f);
  view.setUint32(42, offset, true);
  head.set(f.name, 46);
  return head;
}

function endRecord(count: number, size: number, offset: number): Uint8Array {
  const end = new Uint8Array(22);
  const view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, count, true);
  view.setUint16(10, count, true);
  view.setUint32(12, size, true);
  view.setUint32(16, offset, true);
  return end;
}

/** ZIP 조각 배열 — [로컬 헤더 + 본문] × N → 중앙 헤더 × N → EOCD. 입력 순서 그대로(결정적) */
export function zipParts(entries: readonly ZipEntry[], date: Date, limits: ZipLimits = {}): Uint8Array[] {
  if (entries.length >= MAX_ENTRIES) throw new Error("ZIP 항목이 너무 많습니다(ZIP64 필요)");
  assertNames(entries);
  const max32 = Math.min(limits.max32 ?? MAX32, MAX32);
  const { time, day } = dosDateTime(date);
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const fields: Fields = { name: encoder.encode(name), crc: crc32(data), size: data.length, time, day };
    const local = localHeader(fields);
    if (offset + local.length + data.length >= max32) throw new Error("ZIP64가 필요한 크기입니다");
    central.push(centralHeader(fields, offset));
    parts.push(local, data);
    offset += local.length + data.length;
  }
  const size = central.reduce((sum, head) => sum + head.length, 0);
  if (offset + size >= max32) throw new Error("ZIP64가 필요한 크기입니다");
  return [...parts, ...central, endRecord(entries.length, size, offset)];
}

/** zip Blob(`application/zip`) — 조각을 그대로 Blob에 넘긴다 */
export function storeZip(entries: readonly ZipEntry[], date: Date, limits: ZipLimits = {}): Blob {
  return new Blob(zipParts(entries, date, limits) as BlobPart[], { type: "application/zip" });
}
