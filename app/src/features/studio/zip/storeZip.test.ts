// @vitest-environment node
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { crc32, storeZip, zipParts, type ZipEntry } from "./storeZip";

const dir = mkdtempSync(join(tmpdir(), "m4a-zip-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
const enc = new TextEncoder();
const bytesOf = (parts: Uint8Array[]) => new Uint8Array(Buffer.concat(parts));
const sameBytes = (a: Uint8Array, b: Uint8Array) => Buffer.from(a).equals(Buffer.from(b));
/** 로컬 생성자 — 시간대와 무관하게 같은 로컬 시각. 홀수 초(11)로 2초 내림 확인 */
const DATE = new Date(2026, 9, 18, 12, 30, 11);
/** 2026-10-18 12:30:11 → time 0x63C5(초 10) · day 0x5D52 (python으로 계산한 리터럴) */
const DOS_TIME = 0x63c5;
const DOS_DAY = 0x5d52;

interface Parsed {
  readonly name: string;
  readonly made: number;
  readonly needed: number;
  readonly flags: number;
  readonly method: number;
  readonly time: number;
  readonly day: number;
  readonly data: Uint8Array;
}

/** 로컬 헤더 필드가 중앙 헤더와 같은지 단언하고 본문 시작 위치를 돌려준다 */
function checkLocal(zip: Uint8Array, v: DataView, local: number, central: number, nameLen: number): number {
  expect(v.getUint32(local, true)).toBe(0x04034b50);
  expect(v.getUint16(local + 4, true)).toBe(10);
  expect(v.getUint16(local + 6, true)).toBe(0);
  expect(v.getUint16(local + 8, true)).toBe(0);
  for (const [l, c] of [[10, 12], [12, 14], [14, 16], [18, 20], [22, 24]] as const) expect(v.getUint32(local + l, true)).toBe(v.getUint32(central + c, true));
  expect(v.getUint16(local + 26, true)).toBe(nameLen);
  expect(v.getUint16(local + 28, true)).toBe(0);
  expect(sameBytes(zip.subarray(local + 30, local + 30 + nameLen), zip.subarray(central + 46, central + 46 + nameLen))).toBe(true);
  return local + 30 + nameLen;
}

/** 순수 파서 — EOCD → 중앙 디렉터리 → 로컬 헤더 → 본문 · CRC 재계산 */
function parse(zip: Uint8Array): Parsed[] {
  const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const e = zip.length - 22;
  expect(v.getUint32(e, true)).toBe(0x06054b50);
  const count = v.getUint16(e + 10, true);
  expect(v.getUint16(e + 8, true)).toBe(count);
  let at = v.getUint32(e + 16, true);
  expect(at + v.getUint32(e + 12, true)).toBe(e);
  const out: Parsed[] = [];
  for (let i = 0; i < count; i++) {
    expect(v.getUint32(at, true)).toBe(0x02014b50);
    const size = v.getUint32(at + 20, true);
    expect(v.getUint32(at + 24, true)).toBe(size);
    const nameLen = v.getUint16(at + 28, true);
    expect([v.getUint16(at + 30, true), v.getUint16(at + 32, true)]).toEqual([0, 0]);
    const start = checkLocal(zip, v, v.getUint32(at + 42, true), at, nameLen);
    const data = zip.subarray(start, start + size);
    expect(crc32(data)).toBe(v.getUint32(at + 16, true));
    out.push({
      name: new TextDecoder().decode(zip.subarray(at + 46, at + 46 + nameLen)),
      made: v.getUint16(at + 4, true),
      needed: v.getUint16(at + 6, true),
      flags: v.getUint16(at + 8, true),
      method: v.getUint16(at + 10, true),
      time: v.getUint16(at + 12, true),
      day: v.getUint16(at + 14, true),
      data,
    });
    at += 46 + nameLen;
  }
  return out;
}

const sample: ZipEntry[] = [
  { name: "index.html", data: enc.encode("<!doctype html><title>안녕</title>") },
  { name: "LICENSES.md", data: enc.encode("# 라이선스\n") },
  { name: "assets/fonts/KitSansKR-400.woff2", data: new Uint8Array(0) },
  { name: "assets/images/img-01.webp", data: new Uint8Array(4096).map((_, i) => (i * 31) & 0xff) },
];
const one = (name: string): ZipEntry[] => [{ name, data: new Uint8Array(1) }];

describe("storeZip (M4-a-2 CP1)", () => {
  it("CRC-32 표준 벡터", () => {
    expect(crc32(enc.encode("123456789"))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array(0))).toBe(0);
  });

  it("순수 파서 — 이름·version 10·flags 0·store·CRC·시각 필드", () => {
    const entries = parse(bytesOf(zipParts(sample, DATE)));
    expect(entries.map((e) => e.name)).toEqual(sample.map((e) => e.name));
    for (const [i, e] of entries.entries()) {
      expect([e.made, e.needed, e.flags, e.method]).toEqual([10, 10, 0, 0]);
      expect([e.time, e.day]).toEqual([DOS_TIME, DOS_DAY]);
      expect(sameBytes(e.data, sample[i]!.data)).toBe(true);
    }
  });

  it("1980 미만 시각은 1980-01-01 00:00:00으로 고정", () => {
    const [e] = parse(bytesOf(zipParts(one("a.txt"), new Date(1975, 5, 15, 13, 45, 31))));
    expect([e!.time, e!.day]).toEqual([0, 0x0021]);
  });

  it("표현할 수 없는 시각(Invalid Date · 2108년 이후)은 거절", () => {
    expect(() => zipParts(one("a.txt"), new Date(Number.NaN))).toThrow(/시각/);
    expect(() => zipParts(one("a.txt"), new Date(2108, 0, 1))).toThrow(/시각/);
    expect(() => zipParts(one("a.txt"), new Date(2107, 11, 31, 23, 59, 59))).not.toThrow();
  });

  it("빈 목록 = EOCD 22바이트", () => {
    const zip = bytesOf(zipParts([], DATE));
    expect(zip.length).toBe(22);
    expect(parse(zip)).toEqual([]);
  });

  it("본문 복사 0 — 입력 data가 같은 참조로 조각에 들어간다 · Blob 형식", () => {
    const parts = zipParts(sample, DATE);
    for (const { data } of sample) expect(parts.some((p) => p === data)).toBe(true);
    expect(storeZip(sample, DATE).type).toBe("application/zip");
  });

  it("결정성 — 같은 입력·같은 date 두 번 → 바이트 동일", async () => {
    const a = new Uint8Array(await storeZip(sample, new Date(DATE)).arrayBuffer());
    const b = new Uint8Array(await storeZip(sample, new Date(DATE)).arrayBuffer());
    expect(sameBytes(a, b)).toBe(true);
    expect(sameBytes(a, bytesOf(zipParts(sample, DATE)))).toBe(true);
  });

  it("unzip -t · zipinfo(stor) · unzip -p 본문 일치(macOS 기본 도구)", async () => {
    const file = join(dir, "site.zip");
    writeFileSync(file, Buffer.from(await storeZip(sample, DATE).arrayBuffer()));
    expect(execFileSync("unzip", ["-t", file]).toString()).toContain("No errors detected");
    const info = execFileSync("zipinfo", [file]).toString();
    expect(info).toContain("4 files");
    expect(info).toContain("stor");
    expect(execFileSync("unzip", ["-p", file, "index.html"]).toString()).toBe("<!doctype html><title>안녕</title>");
    expect(sameBytes(execFileSync("unzip", ["-p", file, "assets/images/img-01.webp"]), sample[3]!.data)).toBe(true);
  });

  it.each([
    ["선행 /", "/a"],
    [".. 세그먼트(앞)", "../a"],
    [".. 세그먼트(가운데)", "a/../b"],
    [".. 세그먼트(끝)", "a/.."],
    ["역슬래시", "a\\b"],
    ["콜론", "a:b"],
    ["빈 이름", ""],
    ["디렉터리 entry", "dir/"],
    ["비 ASCII", "한글.txt"],
    ["제어 문자 탭", "a\tb"],
    ["DEL", "a\x7Fb"],
    ["100자 초과", "a".repeat(101)],
  ])("경로 거절 — %s", (_label, name) => {
    expect(() => zipParts(one(name), DATE)).toThrow(/ZIP 경로/);
  });

  it("경로 거절 — 같은 이름 · 대소문자만 다른 중복", () => {
    expect(() => zipParts([...one("a.txt"), ...one("a.txt")], DATE)).toThrow(/중복/);
    expect(() => zipParts([...one("a.txt"), ...one("A.TXT")], DATE)).toThrow(/중복/);
  });

  it("경로 허용 — a..b/c.txt · 공백 · 정확히 100자", () => {
    for (const name of ["a..b/c.txt", "a b.txt", "a".repeat(100)]) expect(() => zipParts(one(name), DATE)).not.toThrow();
  });

  it("ZIP64 거절 — 항목 65,535개 이상", () => {
    const empty = new Uint8Array(0);
    const many = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `f${i}`, data: empty }));
    expect(() => zipParts(many(65_536), DATE)).toThrow(/항목/);
    expect(() => zipParts(many(65_535), DATE)).toThrow(/항목/);
    expect(() => zipParts(many(65_534), DATE)).not.toThrow();
  });

  it("ZIP64 거절 — 크기 상한(주입): 단일 항목 초과 · 누적 offset·중앙 디렉터리 초과", () => {
    expect(() => zipParts(one("a.txt"), DATE, { max32: 0 })).toThrow(/ZIP64/);
    expect(() => zipParts([{ name: "a.txt", data: new Uint8Array(200) }], DATE, { max32: 100 })).toThrow(/ZIP64/);
    // 각 로컬 = 30 + 5 + 10 = 45B → 두 개 90B는 상한 100 안, 중앙 디렉터리(46 + 5) × 2를 더하면 초과
    const small = [{ name: "a.txt", data: new Uint8Array(10) }, { name: "b.txt", data: new Uint8Array(10) }];
    expect(() => zipParts(small, DATE, { max32: 100 })).toThrow(/ZIP64/);
    expect(() => zipParts(small, DATE, { max32: 1000 })).not.toThrow();
  });
});
