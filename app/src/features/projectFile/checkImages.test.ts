/**
 * 가져오기 ⑤ 이미지 (P2-SPEC 3.3 ⑤ + Jarvis 채택 결정 2 — 규칙 검사·디코드 뒤 업로드 경로와 같은 인코더로 재인코딩).
 * jsdom에 디코더·캔버스가 없어 IngestDeps 가짜(주입)로 본다 — 실제 브라우저는 L3 Ego Lite.
 */
import { describe, expect, it } from "vitest";
import { readImageRecord } from "../../data/persistence/imageRecord";
import { readImageHeader } from "../studio/images/ingest/header";
import { fakeDeps, fakeImageBytes, fileImage, jsonFile, seedFile, toBase64 } from "../../test/projectFileFixtures";
import { checkFile } from "./checkFile";
import { checkImages } from "./checkImages";
import { IMPORT_MESSAGES, MAX_IMAGE_BYTES, type ImportCode } from "./format";

const MB = 1024 * 1024;
const fail = (code: ImportCode) => ({ ok: false, code, message: IMPORT_MESSAGES[code] });

async function rejected(images: readonly unknown[], code: ImportCode, options?: Parameters<typeof fakeDeps>[0]) {
  const { deps, calls } = fakeDeps(options);
  expect(await checkImages(images, deps)).toEqual(fail(code));
  return calls;
}

describe("픽스처 = 실제 헤더(readImageHeader가 읽는 치수)", () => {
  it("png · jpeg · webp 헤더 치수 = 인자", () => {
    for (const format of ["png", "jpeg", "webp"] as const) expect(readImageHeader(format, fakeImageBytes(format, 1280, 768))).toMatchObject({ width: 1280, height: 768 });
  });
});

describe("⑤ 한도 = IM-5 (디코드 전)", () => {
  it("25개 = IM-5 · 디코드 0", async () => {
    const calls = await rejected(Array.from({ length: 25 }, (_, i) => fileImage(`img-${i}`, 500, 300)), "IM-5");
    expect(calls.decoded).toBe(0);
  });
  it("선언 bytes 합 60MB+1 = IM-5 · 디코드 0", async () => {
    const calls = await rejected([fileImage("a", 500, 300, "png", { bytes: 30 * MB }), fileImage("b", 500, 300, "png", { bytes: 30 * MB + 1 })], "IM-5");
    expect(calls.decoded).toBe(0);
    expect(MAX_IMAGE_BYTES).toBe(60 * MB);
  });
});

describe("⑤ 규칙 = IM-6", () => {
  it("base64 — 잘못된 문자 · 패딩 누락 · 공백", async () => {
    const good = fileImage("a", 500, 300);
    const b64 = good.variants["500"]!;
    for (const bad of [`${b64.slice(0, -4)}*AAA`, b64.replace(/=+$/, ""), `${b64.slice(0, 4)} ${b64.slice(4)}`]) await rejected([{ ...good, variants: { 500: bad } }], "IM-6");
  });
  it("머리 서명 ≠ format · 사다리 불일치 · bytes 합 불일치", async () => {
    await rejected([{ ...fileImage("a", 500, 300), format: "jpeg" }], "IM-6");
    await rejected([{ ...fileImage("a", 1500, 900), variants: { 640: toBase64(fakeImageBytes("png", 640, 384)) } }], "IM-6");
    await rejected([fileImage("a", 500, 300, "png", { bytes: 1 })], "IM-6");
  });
  it("레코드 — localId에 / · localId 중복 · 형식 모름 · 변 0 · 픽셀 초과", async () => {
    await rejected([fileImage("a/b", 500, 300)], "IM-6");
    await rejected([fileImage("a", 500, 300), fileImage("a", 640, 300)], "IM-6");
    await rejected([{ ...fileImage("a", 500, 300), format: "gif" }], "IM-6");
    await rejected([{ ...fileImage("a", 500, 300), height: 0 }], "IM-6");
    await rejected([{ ...fileImage("a", 500, 300), width: 16_384, height: 16_384 }], "IM-6");
  });
  it("디코드 실패 = IM-6 · 인코딩 0(쓸 바이트 없음)", async () => {
    const calls = await rejected([fileImage("a", 500, 300)], "IM-6", { failDecode: true });
    expect(calls.encodes).toEqual([]);
  });
  it("디코드 치수 ≠ 사다리(폭·높이) = IM-6 · bitmap 닫음", async () => {
    const image = fileImage("a", 500, 300);
    // 헤더 = 사다리(500×300)인데 디코더가 다른 치수를 낸다 — 헤더 검사를 지나 디코드 경로까지 간다
    const header = { width: 500, height: 300 };
    const calls = await rejected([{ ...image, variants: { 500: toBase64(fakeImageBytes("png", 499, 300, "", header)) } }], "IM-6");
    expect(calls.decoded).toBe(1);
    expect(calls.closed).toBe(calls.decoded);
    const taller = await rejected([{ ...image, variants: { 500: toBase64(fakeImageBytes("png", 500, 301, "", header)) } }], "IM-6");
    expect([taller.decoded, taller.closed]).toEqual([1, 1]);
  });
  it("인코더가 다른 형식을 내면(webp 미지원 → png) = IM-6", async () => {
    await rejected([fileImage("a", 500, 300, "webp")], "IM-6", { encodeType: "image/png" });
  });
});

describe("SEC M-1 압축 폭탄 — 디코드 전 실제 헤더 = 사다리 (업로드 V5와 같은 파서)", () => {
  /** 선언 640×480 · 변형본 1개(640) — 실제 바이트만 바꾼다. bytes는 실제 길이(선언 합 검사 통과) */
  const declared640 = (bytes: Uint8Array) => ({ ...fileImage("a", 640, 480), bytes: bytes.length, variants: { 640: toBase64(bytes) } });
  for (const format of ["png", "webp", "jpeg"] as const) {
    it(`${format}: 선언 640×480 · 실제 헤더 16384×16384 = IM-6 · 디코드 0`, async () => {
      const bomb = fakeImageBytes(format, 16_384, 16_384);
      expect(readImageHeader(format, bomb)).toMatchObject({ width: 16_384, height: 16_384 });
      const calls = await rejected([{ ...declared640(bomb), format }], "IM-6");
      expect(calls.decoded).toBe(0);
    });
  }
  it("헤더가 사다리와 1px 다름(641×480 · 640×481) = IM-6 · 디코드 0 — 디코더가 선언 치수를 내도", async () => {
    for (const header of [{ width: 641, height: 480 }, { width: 640, height: 481 }]) {
      const calls = await rejected([declared640(fakeImageBytes("png", 640, 480, "", header))], "IM-6");
      expect(calls.decoded).toBe(0);
    }
  });
  it("헤더가 사다리보다 1px 작음(639×480 · 640×479) = IM-6 · 디코드 0 — 디코더가 선언 치수를 내도", async () => {
    for (const header of [{ width: 639, height: 480 }, { width: 640, height: 479 }]) {
      const calls = await rejected([declared640(fakeImageBytes("png", 640, 480, "", header))], "IM-6");
      expect(calls.decoded).toBe(0);
    }
  });
  it("헤더를 못 읽음(서명만 · IHDR 없음) = IM-6 · 디코드 0", async () => {
    const signatureOnly = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0, ...new TextEncoder().encode("640x480")]);
    expect(readImageHeader("png", signatureOnly)).toBeNull();
    const calls = await rejected([declared640(signatureOnly)], "IM-6");
    expect(calls.decoded).toBe(0);
  });
  it("여러 변형본 중 마지막 하나만 폭탄 = IM-6 · 디코드 0(앞 변형본도 디코드 전에 거절)", async () => {
    const image = fileImage("a", 1500, 900);
    const bomb = fakeImageBytes("png", 1500, 900, "", { width: 16_384, height: 16_384 });
    const good = Object.values(image.variants).slice(0, 2).map((b64) => atob(b64).length);
    const calls = await rejected([{ ...image, bytes: good[0]! + good[1]! + bomb.length, variants: { ...image.variants, 1500: toBase64(bomb) } }], "IM-6");
    expect(calls.decoded).toBe(0);
  });
});

describe("⑤ 통과 = 재인코딩 바이트가 저장 대상", () => {
  it("결과 변형본 = 인코더 출력(원본 아님) · 형식·치수 불변 · bytes = 새 합 · bitmap 전부 닫음", async () => {
    const { deps, calls } = fakeDeps();
    const result = await checkImages([fileImage("a", 1500, 900), fileImage("b", 500, 300)], deps);
    if (!result.ok) throw new Error(result.message);
    const [a, b] = result.images;
    expect(a).toMatchObject({ localId: "a", width: 1500, height: 900, format: "png" });
    expect(Object.keys(a!.variants)).toEqual(["640", "1280", "1500"]);
    expect(await a!.variants["1280"]!.text()).toBe(new TextDecoder().decode(fakeImageBytes("png", 1280, 768, "re:")));
    expect(a!.variants["1280"]!.type).toBe("image/png");
    expect(a!.bytes).toBe(Object.values(a!.variants).reduce((sum, blob) => sum + blob!.size, 0));
    expect(b).toMatchObject({ localId: "b", width: 500, height: 300, format: "png" });
    expect(calls.decoded).toBe(4);
    expect(calls.closed).toBe(4);
    expect(calls.encodes).toEqual(Array.from({ length: 4 }, () => ({ type: "image/png" })));
  });
  it("업로드 경로와 같은 인코더 설정 — webp 0.82 · jpeg 0.85 · png 품질 없음(chooseFormat)", async () => {
    const { deps, calls } = fakeDeps();
    const result = await checkImages([fileImage("w", 500, 300, "webp"), fileImage("j", 500, 300, "jpeg"), fileImage("p", 500, 300, "png")], deps);
    expect(result.ok).toBe(true);
    expect(calls.encodes).toEqual([{ type: "image/webp", quality: 0.82 }, { type: "image/jpeg", quality: 0.85 }, { type: "image/png" }]);
  });
});

describe("parity — 재인코딩 결과 = 다음 열기 readImageRecord 통과(잃은 이미지 0)", () => {
  it("png 3단 · webp · jpeg 결과를 실제 readImageRecord가 받는다", async () => {
    const { deps } = fakeDeps();
    const result = await checkImages([fileImage("a", 1500, 900), fileImage("w", 500, 300, "webp"), fileImage("j", 640, 300, "jpeg")], deps);
    if (!result.ok) throw new Error(result.message);
    for (const { localId, ...data } of result.images) {
      const id = `project-1/${localId}`;
      expect(await readImageRecord({ schemaVersion: 1, kind: "image", id, data }, id)).toEqual(data);
    }
  });
  it("한도가 레코드 검사보다 먼저 — localId 중복 + 합 60MB+1 = IM-5", async () => {
    await rejected([fileImage("a", 500, 300, "png", { bytes: 30 * MB }), fileImage("a", 500, 300, "png", { bytes: 30 * MB + 1 })], "IM-5");
  });
});

describe("checkFile ①~⑤ 연결", () => {
  it("이미지 있는 파일 = ok + 재인코딩된 이미지 · 이미지 손상 = IM-6", async () => {
    const { deps } = fakeDeps();
    const ok = await checkFile(jsonFile(seedFile({}, [fileImage("a", 500, 300)])), deps);
    expect(ok.ok && (await ok.file.images[0]!.variants["500"]!.text()).includes("re:")).toBe(true);
    const bad = await checkFile(jsonFile(seedFile({}, [{ ...fileImage("a", 500, 300), format: "jpeg" }])), deps);
    expect(bad).toEqual(fail("IM-6"));
  });
  it("④ 실패면 ⑤는 돌지 않는다(디코드 0)", async () => {
    const { deps, calls } = fakeDeps();
    expect(await checkFile(jsonFile(seedFile({ series: [] }, [fileImage("a", 500, 300)])), deps)).toEqual(fail("IM-4"));
    expect(calls.decoded).toBe(0);
  });
});

describe("Codex r1 ① 큰 base64 · 검증 중 예외 = IM-6 결과(reject 0)", () => {
  it("변형본 \"A\" × 8MiB(유효 base64) = IM-6 결과 · checkFile도 결과를 돌려준다", async () => {
    const big = { ...fileImage("a", 500, 300), bytes: 6 * MB, variants: { 500: "A".repeat(8 * MB) } };
    await rejected([big], "IM-6");
    expect(await checkFile(jsonFile(seedFile({}, [big])))).toEqual(fail("IM-6"));
  });
  it("변형본 읽기가 던짐 = IM-6 결과", async () => {
    const image = fileImage("a", 500, 300);
    Object.defineProperty(image, "variants", {
      get: () => {
        throw new RangeError("boom");
      },
    });
    await rejected([image], "IM-6");
  });
});
