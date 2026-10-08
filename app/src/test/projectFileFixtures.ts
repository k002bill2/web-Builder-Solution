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
