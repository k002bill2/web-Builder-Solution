/**
 * 가져오기 검증 ①~④ (P2-SPEC 3.2 · 3.3 · AC-P02 거절 = 쓰기 0 — 단계별 IM 문장 정확히 · 실패면 결과 객체 없음).
 */
import { describe, expect, it, vi } from "vitest";
import { hashDoc } from "../../engine/ops/hash";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { createMemoryCompareBoardRepository } from "../../data/memoryCompareBoardRepository";
import { createMemoryProfileRepository } from "../../data/memoryProfileRepository";
import { createMemoryGenerationRepository } from "../../data/memoryGenerationRepository";
import { createMemoryProjectRepository } from "../../data/memoryProjectRepository";
import { isTerminal } from "../../domain/generation";
import { createStudioStore } from "../../data/studioStore";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import { fileOf, jsonFile, seedDoc, seedDocRecord, seedFile, seedProject, seedSeries } from "../../test/projectFileFixtures";
import { checkFile } from "./checkFile";
import { IMPORT_MESSAGES, MAX_FILE_BYTES, type ImportCode } from "./format";

async function rejected(file: { size: number; text: () => Promise<string> }, code: ImportCode) {
  const result = await checkFile(file);
  expect(result).toEqual({ ok: false, code, message: IMPORT_MESSAGES[code] });
}

describe("checkFile ① 크기 · ② 파싱", () => {
  it("96MB+1 = IM-1 · 파일을 읽지 않는다(text 호출 0)", async () => {
    const text = vi.fn(async () => "{}");
    await rejected({ size: MAX_FILE_BYTES + 1, text }, "IM-1");
    expect(text).not.toHaveBeenCalled();
  });
  it("0바이트 = IM-2 · 읽지 않는다", async () => {
    const text = vi.fn(async () => "");
    await rejected({ size: 0, text }, "IM-2");
    expect(text).not.toHaveBeenCalled();
  });
  it("JSON 아님 · 최상위 배열 · null · 읽기 실패 = IM-2", async () => {
    await rejected(fileOf("{\"format\": "), "IM-2");
    await rejected(fileOf("[1]"), "IM-2");
    await rejected(fileOf("null"), "IM-2");
    await rejected({ size: 10, text: () => Promise.reject(new Error("NotReadable")) }, "IM-2");
  });
});

describe("checkFile ③ 봉투", () => {
  it("format 다름 = IM-2", async () => {
    await rejected(jsonFile(seedFile({ format: "design-studio" })), "IM-2");
  });
  it("미래 버전 = IM-3 — 다른 필드보다 먼저(formatVersion 2 + series 없음 · schemaVersion 2)", async () => {
    await rejected(jsonFile(seedFile({ formatVersion: 2, series: undefined })), "IM-3");
    await rejected(jsonFile(seedFile({ schemaVersion: 2 })), "IM-3");
  });
  it("버전이 정수 1이 아님(문자열·0·소수) = IM-2", async () => {
    await rejected(jsonFile(seedFile({ formatVersion: "1" })), "IM-2");
    await rejected(jsonFile(seedFile({ schemaVersion: 0 })), "IM-2");
    await rejected(jsonFile(seedFile({ formatVersion: 1.5 })), "IM-2");
  });
  it("필드 모양 — exportedAt 문자열 · project 객체 · series 배열 · doc 객체|null · images 배열 아니면 IM-2", async () => {
    for (const over of [{ exportedAt: 1 }, { project: "p" }, { series: {} }, { doc: "d" }, { images: null }]) await rejected(jsonFile(seedFile(over)), "IM-2");
  });
});

describe("checkFile ④ 레코드 모양 = IM-4", () => {
  it("checkSaveDoc 실패 문서(hash 위조) · 스냅샷 문서 projectId 다름", async () => {
    const record = seedDocRecord();
    await rejected(jsonFile(seedFile({ doc: { ...record, doc: { ...record.doc, hash: "x" } } })), "IM-4");
    const other = seedDocRecord("project-9");
    await rejected(jsonFile(seedFile({ doc: { ...record, snapshots: [other.snapshots[0]] } })), "IM-4");
  });
  it("스냅샷 — projectId 다름 · snapshotId 문자열 아님 · kind 모름 · snapshots 배열 아님 · snapshotSeq 정수 아님", async () => {
    const record = seedDocRecord();
    const snap = record.snapshots[0]!;
    for (const doc of [
      { ...record, snapshots: [{ ...snap, projectId: "project-9" }] },
      { ...record, snapshots: [{ ...snap, snapshotId: 7 }] },
      { ...record, snapshots: [{ ...snap, kind: "draft" }] },
      { ...record, snapshots: {} },
      { ...record, snapshotSeq: 1.5 },
    ])
      await rejected(jsonFile(seedFile({ doc })), "IM-4");
  });
  it("series — 비었음 · 버전 구멍 · 다른 계열 profileId", async () => {
    const [v1, v2] = seedSeries();
    await rejected(jsonFile(seedFile({ series: [] })), "IM-4");
    await rejected(jsonFile(seedFile({ series: [v1, { ...v2, version: 3 }] })), "IM-4");
    await rejected(jsonFile(seedFile({ series: [v1, { ...v2, profileId: "profile-9" }] })), "IM-4");
  });
  it("project — 이름이 validateProjectName 결과와 다름(앞뒤 공백·빈 값) · revision 정수 아님 · 필드 누락", async () => {
    await rejected(jsonFile(seedFile({ project: { ...seedProject(), name: " 강남 " } })), "IM-4");
    await rejected(jsonFile(seedFile({ project: { ...seedProject(), name: "" } })), "IM-4");
    await rejected(jsonFile(seedFile({ project: { ...seedProject(), revision: "3" } })), "IM-4");
    await rejected(jsonFile(seedFile({ project: { ...seedProject(), baseReferenceId: undefined } })), "IM-4");
  });
  it("doc.profileVersion > series 길이", async () => {
    await rejected(jsonFile(seedFile({ series: seedSeries().slice(0, 1) })), "IM-4");
  });
});

describe("checkFile 통과 (AC-P05 앞단 — 원래 id로 검증)", () => {
  it("시드 파일 = ok · 값 그대로 · 파일 크기", async () => {
    const value = seedFile();
    const file = jsonFile(value);
    const result = await checkFile(file);
    if (!result.ok) throw new Error(result.message);
    expect(result.file).toMatchObject({ exportedAt: value.exportedAt, project: value.project, series: value.series, doc: value.doc, images: [], size: file.size });
  });
  it("문서 없음(doc null) = ok", async () => {
    const result = await checkFile(jsonFile(seedFile({ doc: null })));
    expect(result.ok && result.file.doc).toBe(null);
  });
  it("스냅샷 문서는 엔진 hash 규칙 그대로 — 내용을 바꾸고 hash를 다시 재면 통과", async () => {
    const record = seedDocRecord();
    const doc = { ...(record.doc as PageDoc), updatedAt: record.doc.updatedAt, sections: (record.doc as PageDoc).sections.slice(0, 2) };
    const rehashed = { ...doc, hash: hashDoc(doc) };
    const result = await checkFile(jsonFile(seedFile({ doc: { ...record, doc: rehashed } })));
    expect(result.ok).toBe(true);
  });
});

describe("Codex r1 ② 프로필 버전 모양 · ③ 스냅샷 프로필 범위 = IM-4", () => {
  it("series {profileId, version}만 + doc:null = IM-4 (Codex 재현)", async () => {
    await rejected(jsonFile(seedFile({ series: [{ profileId: "profile-1", version: 1 }], doc: null })), "IM-4");
  });
  it("화면이 직접 읽는 필드 손상 각각 = IM-4", async () => {
    const [v1, v2] = seedSeries() as [ReturnType<typeof seedSeries>[number], ReturnType<typeof seedSeries>[number]];
    const base = v2.base;
    const broken: unknown[] = [
      { ...v2, adjustments: undefined },
      { ...v2, adjustments: { corrections: {} } },
      { ...v2, adjustments: { corrections: [{ role: "ink", from: "#1F1F1F", to: 7, check: "C-4" }] } },
      { ...v2, origin: "unknown" },
      { ...v2, createdAt: 1 },
      { ...v2, baseReferenceId: undefined },
      { ...v2, base: undefined },
      { ...v2, base: { ...base, color_tokens: undefined } },
      { ...v2, base: { ...base, color_tokens: { ...base.color_tokens, ink: { $type: "color" } } } },
      { ...v2, base: { ...base, typography_tokens: { ...base.typography_tokens, scale: "1.25" } } },
      { ...v2, base: { ...base, spacing_tokens: undefined } },
      { ...v2, base: { ...base, motion_preset: "L9" } },
      { ...v2, base: { ...base, component_choices: null } },
      { ...v2, base: { ...base, source_reference_ids: "ref-a" } },
      { ...v2, base: { ...base, section_plan: [{ type: "hero" }] } },
      { ...v2, base: { ...base, library_version: undefined } },
      { ...v2, base: { ...base, seed: 1 } },
      { ...v2, base: { ...base, selection_mode: "auto" } },
      { ...v2, base: { ...base, visual_direction: undefined } },
    ];
    for (const v of broken) await rejected(jsonFile(seedFile({ series: [v1, v] })), "IM-4");
  });
  it("실제 보드 확정(confirmProfile)으로 만든 버전 = 통과(과잉 엄격 0)", async () => {
    const store = createStudioStore();
    const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }), store });
    await board.confirmProfile(1, 0);
    const series = (await createMemoryProfileRepository({ store }).getProfile("profile-1"))!;
    const result = await checkFile(jsonFile(seedFile({ series: series.versions, doc: null })));
    expect(result.ok).toBe(true);
  });
  it("현재 v2 · 스냅샷 문서 v3(hash 일치) · 계열 v1·v2 = IM-4", async () => {
    const record = seedDocRecord();
    const v3 = seedDoc("project-1", "2026-10-01T00:00:00.000Z", 3);
    const doc = { ...record, snapshots: [...record.snapshots, { ...record.snapshots[0]!, snapshotId: "snapshot-9", doc: v3, profileVersion: 3, hash: v3.hash }] };
    await rejected(jsonFile(seedFile({ doc })), "IM-4");
  });
});

describe("Codex r2 — 화면이 열거·모양으로 바로 쓰는 필드 = IM-4 (REPORT 9절 표)", () => {
  const [v1, v2] = seedSeries() as [ReturnType<typeof seedSeries>[number], ReturnType<typeof seedSeries>[number]];
  const base = v2.base;
  const withVersion = (v: unknown) => jsonFile(seedFile({ series: [v1, v] }));
  const record = seedDocRecord();
  const withSnapshot = (over: Record<string, unknown>) => jsonFile(seedFile({ doc: { ...record, snapshots: [{ ...record.snapshots[0]!, ...over }] } }));

  it("① adjustments.contrast \"invalid\" = IM-4 (Codex 재현 — targetText CONTRAST_TARGET[level].toFixed)", async () => {
    await rejected(withVersion({ ...v2, adjustments: { contrast: "invalid" } }), "IM-4");
  });
  it("② dropped \"x\" = IM-4 (Codex 재현 — summarizeVersions droppedSummary(dropped.map))", async () => {
    await rejected(withVersion({ ...v2, dropped: "x" }), "IM-4");
  });
  it("③ 스냅샷 name {bad:true} = IM-4 (Codex 재현 — SnapshotDialog {s.name})", async () => {
    await rejected(withSnapshot({ name: { bad: true } }), "IM-4");
  });
  it("버전 표 행 손상 각각 = IM-4", async () => {
    const choices = base.component_choices;
    const broken: unknown[] = [
      { ...v2, adjustments: { density: "tight" } },
      { ...v2, adjustments: { purpose: "shop" } },
      { ...v2, adjustments: { purpose: "toString" } },
      { ...v2, adjustments: { corrections: [{ role: "ink", from: "#1F1F1F", to: "#111111", check: "C-9" }] } },
      { ...v2, adjustments: { corrections: [{ role: "ink", from: "red", to: "#111111", check: "C-4" }] } },
      { ...v2, adjustments: { corrections: [{ role: "ink", from: "#1F1F1F", to: "#11111", check: "C-4" }] } },
      { ...v2, dropped: [1] },
      { ...v2, dropped: [{ key: "size" }] },
      { ...v2, dropped: [{ key: "correction", role: 3 }] },
      { ...v2, dropped: [{ key: "motion", reason: "oops" }] },
      { ...v2, basedOn: "1" },
      { ...v1, boardRevision: 1.5 },
      { ...v2, base: { ...base, color_tokens: { ...base.color_tokens, ink: { $type: "color", $value: "blue" } } } },
      { ...v2, base: { ...base, section_plan: [{ type: "banner", variant: "x" }] } },
      { ...v2, base: { ...base, component_choices: { ...choices, hero: { section: "hero", variant: 1 } } } },
      { ...v2, base: { ...base, component_choices: { ...choices, header: "sticky" } } },
      { ...v2, base: { ...base, component_choices: { ...choices, cta_placement: {} } } },
      { ...v2, base: { ...base, component_choices: { ...choices, media_ratio: 16 } } },
      { ...v2, base: { ...base, component_choices: { ...choices, mobile_pattern: [] } } },
      { ...v2, base: { ...base, component_choices: { ...choices, card_style: { style: "flat", surfaceTone: "grey" } } } },
      { ...v2, base: { ...base, component_choices: { ...choices, card_style: { style: {}, surfaceTone: "dark" } } } },
    ];
    for (const v of broken) await rejected(withVersion(v), "IM-4");
  });
  it("스냅샷 머리 표 행 손상 각각 = IM-4", async () => {
    const broken: Record<string, unknown>[] = [
      { name: undefined },
      { createdAt: 1 },
      { candidateId: null },
      { hash: 7 },
      { profileVersion: "2" },
      { profileVersion: 0 },
      { profileVersion: 3 },
      { kind: "auto", reason: "oops" },
    ];
    for (const over of broken) await rejected(withSnapshot(over), "IM-4");
  });

  it("실제 저장소 버전(조정 4열거+보정 · 재확정 dropped · revertTo basedOn) = 통과(과잉 엄격 0)", async () => {
    const store = createStudioStore();
    const now = () => "2026-09-26T00:00:00.000Z";
    const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, now, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }), store });
    const profiles = createMemoryProfileRepository({ store, now });
    await board.confirmProfile(1, 0);
    const mutedFix = { role: "muted", from: "#9A7B63", to: "#8E715B", check: "C-5" } as const;
    await profiles.saveAdjustments("profile-1", 1, { density: "compact", motion: "L0", contrast: "enhanced", purpose: "booking", corrections: [mutedFix] });
    const { board: current } = await board.getBoard();
    const saved = await board.savePicks({ hero: "ref-a", palette: "ref-c", motion: "ref-b" }, {}, current.revision);
    await board.createProfileVersion("profile-1", saved.revision, 2, "current");
    await profiles.revertTo("profile-1", 2, 3);
    const versions = (await profiles.getProfile("profile-1"))!.versions;
    expect(versions[2]!.dropped?.length).toBeGreaterThan(0);
    expect(versions[3]).toMatchObject({ origin: "revert", basedOn: 2 });
    const result = await checkFile(jsonFile(seedFile({ series: versions, doc: null })));
    expect(result.ok).toBe(true);
  });
  it("실제 저장소 스냅샷(createSnapshot manual · restoreSnapshot auto/restore) = 통과(과잉 엄격 0)", async () => {
    const store = createStudioStore();
    const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }), store });
    await board.confirmProfile(1, 0);
    const gen = createMemoryGenerationRepository({ store });
    let job = await gen.requestGeneration("profile-1", 1);
    for (let i = 0; i < 10 && !isTerminal(job.state); i++) job = await gen.getJob(job.jobId);
    let ticks = 0;
    const repo = createMemoryProjectRepository({ store, now: () => `2026-09-27T09:00:0${ticks++}.000Z` });
    const { doc: first } = await repo.startDoc("project-1", 1, "B", "create");
    const kept = await repo.createSnapshot("project-1");
    await repo.restoreSnapshot("project-1", kept.snapshotId, first.revision);
    const snapshots = await repo.listSnapshots("project-1");
    expect(snapshots.map((s) => s.kind)).toEqual(["manual", "auto"]);
    const doc = { doc: await repo.getDoc("project-1"), snapshots, snapshotSeq: 0 };
    const result = await checkFile(jsonFile(seedFile({ doc })));
    expect(result.ok).toBe(true);
  });
});
