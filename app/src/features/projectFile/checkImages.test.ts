/**
 * 가져오기 ⑤ 이미지 (P2-SPEC 3.3 ⑤ + Jarvis 채택 결정 2 — 규칙 검사·디코드 뒤 업로드 경로와 같은 인코더로 재인코딩).
 * jsdom에 디코더·캔버스가 없어 IngestDeps 가짜(주입)로 본다 — 실제 브라우저는 L3 Ego Lite.
 */
import { describe, expect, it } from "vitest";
import { readImageRecord } from "../../data/persistence/imageRecord";
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
    const calls = await rejected([{ ...image, variants: { 500: toBase64(fakeImageBytes("png", 499, 300)) } }], "IM-6");
    await rejected([{ ...image, variants: { 500: toBase64(fakeImageBytes("png", 500, 301)) } }], "IM-6");
    expect(calls.closed).toBe(calls.decoded);
  });
  it("인코더가 다른 형식을 내면(webp 미지원 → png) = IM-6", async () => {
    await rejected([fileImage("a", 500, 300, "webp")], "IM-6", { encodeType: "image/png" });
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
