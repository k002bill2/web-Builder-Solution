/**
 * 프로젝트 파일 테스트 시드 (P2-SPEC 7절 AC-P01 시드 — 프로젝트·계열 2버전·문서·스냅샷 3개(snapshotSeq 2)·이미지는 각 테스트가 붙인다).
 * 문서는 실제 엔진 문서(writeStartDoc) — checkSaveDoc·readDoc을 그대로 통과해야 해서 손으로 만들지 않는다.
 */
import type { DocRecord } from "../data/persistence/entryRead";
import type { Project, ProjectSnapshot, DocHead } from "../data/projectRepository";
import { writeStartDoc } from "../data/startDocWrite";
import type { PlannedSection } from "../domain/generation";
import type { ProfileVersion } from "../domain/profile";
import type { FileImage, ProjectFile } from "../features/projectFile/format";

const SECTIONS: readonly PlannedSection[] = [
  { type: "header", variant: "sticky-right-cta", motion: "L1" },
  { type: "hero", variant: "split", motion: "L2" },
  { type: "about", variant: "split", motion: "L2" },
  { type: "services", variant: "grid-2", motion: "L2" },
  { type: "portfolio", variant: "masonry", motion: "L1" },
  { type: "contact", variant: "form", motion: "L1" },
  { type: "footer", variant: "biz-extended", motion: "L1" },
];

export function seedDoc(projectId = "project-1", updatedAt = "2026-10-01T00:00:00.000Z"): DocHead {
  const result = writeStartDoc({ candidateId: "B", sections: SECTIONS, libraryVersion: "1.4", generatorVersion: "preview-1", profileVersion: 2, projectId, updatedAt });
  if (!result.ok) throw new Error(result.alert);
  return result.doc;
}

export const seedProject = (projectId = "project-1", profileId = "profile-1"): Project => ({
  projectId,
  name: "강남 카페",
  revision: 3,
  profileId,
  baseReferenceId: "ref-a",
  createdAt: "2026-09-30T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
});

export const seedSeries = (profileId = "profile-1"): ProfileVersion[] =>
  [1, 2].map((version) => ({ profileId, version, origin: "board", baseReferenceId: "ref-a", base: {}, adjustments: {}, createdAt: `2026-09-30T00:0${version}:00.000Z` }) as unknown as ProfileVersion);

const snapshot = (doc: DocHead, n: number, kind: ProjectSnapshot<DocHead>["kind"]): ProjectSnapshot<DocHead> => ({
  snapshotId: `snapshot-${n}`,
  projectId: doc.projectId,
  kind,
  ...(kind === "auto" && { reason: "restore" as const }),
  name: `스냅샷 ${n}`,
  createdAt: `2026-10-01T00:0${n}:00.000Z`,
  doc,
  profileVersion: doc.profileVersion,
  candidateId: doc.candidateId,
  hash: doc.hash,
});

export function seedDocRecord(projectId = "project-1"): DocRecord {
  const doc = seedDoc(projectId);
  return { doc, snapshots: [snapshot(doc, 1, "manual"), snapshot(doc, 3, "auto"), snapshot(doc, 4, "manual")], snapshotSeq: 2 };
}

export function seedFile(over: Partial<Record<keyof ProjectFile, unknown>> = {}, images: readonly FileImage[] = []): Record<string, unknown> {
  return {
    format: "design-studio-project",
    formatVersion: 1,
    schemaVersion: 1,
    exportedAt: "2026-10-08T09:12:33.000Z",
    project: seedProject(),
    series: seedSeries(),
    doc: seedDocRecord(),
    images,
    ...over,
  };
}

/** checkFile 입력 — size·text만(①은 text를 부르지 않아야 한다) */
export const fileOf = (text: string, size = new TextEncoder().encode(text).length) => ({ size, text: async () => text });
export const jsonFile = (value: unknown) => fileOf(JSON.stringify(value));

// ── 이미지(⑤) — 가짜 바이트 = 형식 서명 16바이트 + "가로x세로" · 가짜 디코더는 그 치수를 읽고 가짜 인코더는 "re:" 표시를 붙인다
const MAGIC: Readonly<Record<string, readonly number[]>> = {
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0],
  jpeg: [0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  webp: [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0, 0, 0, 0],
};
export const fakeImageBytes = (format: string, width: number, height: number, mark = ""): Uint8Array =>
  new Uint8Array([...MAGIC[format]!, ...new TextEncoder().encode(`${mark}${width}x${height}`)]);
export const toBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes));

export function fileImage(localId: string, width: number, height: number, format: FileImage["format"] = "png", over: Partial<FileImage> = {}): FileImage {
  const ladder = [640, 1280, 1920].filter((s) => s <= width);
  const widths = width < 1920 && !ladder.includes(width) ? [...ladder, width] : ladder;
  const bytes = widths.map((w) => fakeImageBytes(format, w, Math.max(1, Math.round((height * w) / width))));
  return {
    localId,
    width,
    height,
    format,
    bytes: bytes.reduce((sum, b) => sum + b.length, 0),
    variants: Object.fromEntries(widths.map((w, i) => [String(w), toBase64(bytes[i]!)])),
    ...over,
  };
}

export function fakeDeps(options: { readonly failDecode?: boolean; readonly encodeType?: string } = {}) {
  const calls = { decoded: 0, closed: 0, encodes: [] as Array<{ type: string; quality?: number }> };
  const deps = {
    createImageBitmap: async (source: Blob | { width: number; height: number }) => {
      if (options.failDecode) throw new Error("decode");
      const text = new TextDecoder().decode(new Uint8Array(await (source as Blob).arrayBuffer()).slice(16)).replace(/^re:/, "");
      const [width, height] = text.split("x").map(Number) as [number, number];
      calls.decoded += 1;
      return { width, height, close: () => void (calls.closed += 1) };
    },
    encode: async (bitmap: { width: number; height: number }, type: string, quality?: number) => {
      calls.encodes.push({ type, ...(quality !== undefined && { quality }) });
      const format = type.replace("image/", "");
      return new Blob([fakeImageBytes(MAGIC[format] ? format : "png", bitmap.width, bitmap.height, "re:") as BlobPart], { type: options.encodeType ?? type });
    },
    drawScaled: async () => {
      throw new Error("재인코딩은 축소하지 않는다");
    },
  };
  return { deps, calls };
}
