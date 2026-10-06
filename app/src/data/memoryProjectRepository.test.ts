/**
 * 편집 문서 저장소 (DS-2A-05 8.3 saveDoc · 8.3.1 startDoc · 8.2.1) — E-AC-11 · E-AC-40 · E-AC-41 · E-AC-42 · 픽스처 6 × 3안.
 */
import { isTerminal } from "../domain/generation";
import type { PageDoc } from "../engine/contracts/pageDoc";
import { hashDoc } from "../engine/ops/hash";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { createMemoryCompareBoardRepository } from "./memoryCompareBoardRepository";
import { createMemoryGenerationRepository } from "./memoryGenerationRepository";
import { createMemoryProjectRepository, type ProjectCall } from "./memoryProjectRepository";
import type { ProjectRepository } from "./projectRepository";
import { createStudioStore, type StudioStore } from "./studioStore";

const REFS = ["ref-a", "ref-b", "ref-c", "ref-d", "ref-e", "ref-f"] as const;
type Hooks = { readonly delay?: (c: ProjectCall) => Promise<void> | void; readonly fail?: (c: ProjectCall) => Error | undefined };

async function setup(base: string = "ref-a", hooks: Hooks = {}) {
  const store = createStudioStore();
  const others = REFS.filter((r) => r !== base).slice(0, 2);
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf([base, ...others], { hero: base }), store });
  await board.confirmProfile(1, 0);
  const gen = createMemoryGenerationRepository({ store });
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i++) job = await gen.getJob(job.jobId);
  let ticks = 0;
  const now = () => `2026-09-27T09:00:0${ticks++}.000Z`;
  const repo = createMemoryProjectRepository({ store, now, ...hooks }) as ProjectRepository<PageDoc>;
  return { store, repo, job };
}

const codeOf = (p: Promise<unknown>) => p.then(() => "ok", (e: { code?: string }) => e.code ?? String(e));
const edit = (doc: PageDoc, title: string): PageDoc => {
  const next = { ...doc, meta: { ...doc.meta, title } };
  return { ...next, hash: hashDoc(next) };
};
/** 저장된 잡의 안 하나를 표 밖 쌍으로 바꾼다(8.2.1 (b) 주입) */
function inject(store: StudioStore, candidateId: string, variant: string) {
  const stored = store.job("job-1")!;
  store.transact((tx) =>
    tx.putJob({
      ...stored,
      job: {
        ...stored.job,
        candidates: stored.job.candidates.map((c) =>
          c.id === candidateId && c.status === "succeeded" ? { ...c, plan: { ...c.plan, sections: c.plan.sections.map((s) => (s.type === "about" || s.type === "services" ? { ...s, variant } : s)) } } : c,
        ),
      },
    }),
  );
}

describe("startDoc (8.3.1 · 8.2.1)", () => {
  it("create → 문서 revision 1 · updatedAt = 주입 now · getDoc 같음 · 목록 요약 hasDoc", async () => {
    const { repo } = await setup();
    expect(await repo.getDoc("project-1")).toBeUndefined();
    const result = await repo.startDoc("project-1", 1, "B", "create");
    expect(result.doc).toMatchObject({ projectId: "project-1", revision: 1, candidateId: "B", profileVersion: 1, updatedAt: "2026-09-27T09:00:00.000Z" });
    expect(await repo.getDoc("project-1")).toBe(result.doc);
    expect(Object.isFrozen(result.doc)).toBe(true);
    const [summary] = await repo.listProjects();
    expect(summary).toMatchObject({ hasDoc: true, candidateId: "B", docProfileVersion: 1, docSavedAt: "2026-09-27T09:00:00.000Z" });
  });

  it.each(REFS)("픽스처 %s × 3안(A create · B·C restart) 전부 성공 — UNKNOWN_VARIANT 0 · restart는 revision +1 · 스냅샷 +1", async (ref) => {
    const { repo } = await setup(ref);
    expect((await repo.getProject("project-1"))?.baseReferenceId).toBe(ref);
    const a = await repo.startDoc("project-1", 1, "A", "create");
    const b = await repo.startDoc("project-1", 1, "B", "restart", a.doc.revision);
    const c = await repo.startDoc("project-1", 1, "C", "restart", b.doc.revision);
    expect([a.doc.revision, b.doc.revision, c.doc.revision]).toEqual([1, 2, 3]);
    expect((await repo.getDoc("project-1"))?.candidateId).toBe("C");
    expect((await repo.listSnapshots("project-1")).map((s) => [s.kind, s.reason, s.candidateId, s.doc.revision])).toEqual([
      ["auto", "restart", "A", 1],
      ["auto", "restart", "B", 2],
    ]);
  });

  it("판정 순서 — 모양(SCHEMA_INVALID) → NOT_FOUND → DOC_EXISTS·STALE_DOC", async () => {
    const { repo } = await setup();
    expect(await codeOf(repo.startDoc("project-9", 1, "B", "bogus" as never))).toBe("SCHEMA_INVALID");
    expect(await codeOf(repo.startDoc("project-9", 1, "B", "restart"))).toBe("SCHEMA_INVALID");
    expect(await codeOf(repo.startDoc("project-9", 0, "B", "create"))).toBe("SCHEMA_INVALID");
    expect(await codeOf(repo.startDoc("project-9", 1, "B", "create"))).toBe("NOT_FOUND");
    expect(await codeOf(repo.startDoc("project-1", 2, "B", "create"))).toBe("NOT_FOUND");
    expect(await codeOf(repo.startDoc("project-1", 1, "D", "create"))).toBe("NOT_FOUND");
    expect(await codeOf(repo.startDoc("project-1", 1, "B", "restart", 1))).toBe("NOT_FOUND");
    const first = await repo.startDoc("project-1", 1, "A", "create");
    await expect(repo.startDoc("project-1", 1, "B", "create")).rejects.toMatchObject({ code: "DOC_EXISTS", doc: first.doc });
    await expect(repo.startDoc("project-1", 1, "B", "restart", 7)).rejects.toMatchObject({ code: "STALE_DOC", doc: first.doc });
    expect(await repo.listSnapshots("project-1")).toEqual([]);
  });

  it("E-AC-40 create 경쟁 — delay 2건(다른 안) → 문서 1개 · 먼저 판정된 쪽 성공 · 다른 쪽 DOC_EXISTS + 기존 문서 · 같은 인자 2건은 둘 다 성공", async () => {
    const { repo } = await setup("ref-a", { delay: ({ method, phase }) => (method === "startDoc" && phase === "request" ? new Promise((r) => setTimeout(r, 5)) : undefined) });
    const [a, b] = await Promise.allSettled([repo.startDoc("project-1", 1, "A", "create"), repo.startDoc("project-1", 1, "B", "create")]);
    expect(a.status).toBe("fulfilled");
    expect(b).toMatchObject({ status: "rejected", reason: { code: "DOC_EXISTS", doc: { candidateId: "A", revision: 1 } } });
    const doc = await repo.getDoc("project-1");
    expect(doc).toMatchObject({ candidateId: "A", revision: 1, hash: a.status === "fulfilled" ? a.value.doc.hash : "" });
    const [x, y] = await Promise.all([repo.startDoc("project-1", 1, "A", "create"), repo.startDoc("project-1", 1, "A", "create")]);
    expect(x.doc).toBe(doc);
    expect(y.doc).toBe(doc);
  });

  it("E-AC-41 response 실패 뒤 같은 인자 재시도 → 같은 문서(1개 · revision 1) + 같은 바뀐 쌍 · 사이 saveDoc이 있어도 getDoc은 최신", async () => {
    const { repo } = await setup("ref-a", { fail: ({ method, seq, phase }) => (method === "startDoc" && seq === 1 && phase === "response" ? new Error("응답 유실") : undefined) });
    await expect(repo.startDoc("project-1", 1, "B", "create")).rejects.toThrow("응답 유실");
    const written = (await repo.getDoc("project-1"))!;
    const saved = await repo.saveDoc("project-1", 1, edit(written, "새 제목"));
    const replay = await repo.startDoc("project-1", 1, "B", "create");
    expect(replay.doc).toBe(written);
    expect(replay.changes.length).toBeGreaterThan(0);
    expect(await repo.getDoc("project-1")).toBe(saved);
    expect(saved.revision).toBe(2);
  });

  it("E-AC-41 commit 실패 → 문서·스냅샷·멱등 기록 변화 0 (재시도는 새로 쓴다)", async () => {
    const { repo } = await setup("ref-a", { fail: ({ method, seq, phase }) => (method === "startDoc" && (seq === 1 || seq === 3) && phase === "commit" ? new Error("커밋 실패") : undefined) });
    await expect(repo.startDoc("project-1", 1, "B", "create")).rejects.toThrow("커밋 실패");
    expect(await repo.getDoc("project-1")).toBeUndefined();
    const made = await repo.startDoc("project-1", 1, "B", "create");
    await expect(repo.startDoc("project-1", 1, "C", "restart", 1)).rejects.toThrow("커밋 실패");
    expect(await repo.getDoc("project-1")).toBe(made.doc);
    expect(await repo.listSnapshots("project-1")).toEqual([]);
    expect((await repo.startDoc("project-1", 1, "B", "create")).doc).toBe(made.doc);
  });

  it("E-AC-42 restart 경합 — 같은 expectedRevision 2건 → 한쪽만(스냅샷 +1 · revision +1) · 다른 쪽 STALE_DOC + 최신 · 옛 create 키 → DOC_EXISTS · 열린 편집기 저장 → STALE_DOC", async () => {
    const { repo } = await setup("ref-a", { delay: ({ method, phase }) => (method === "startDoc" && phase === "request" ? new Promise((r) => setTimeout(r, 5)) : undefined) });
    const first = await repo.startDoc("project-1", 1, "A", "create");
    const [b, c] = await Promise.allSettled([repo.startDoc("project-1", 1, "B", "restart", 1), repo.startDoc("project-1", 1, "C", "restart", 1)]);
    expect(b).toMatchObject({ status: "fulfilled", value: { doc: { revision: 2, candidateId: "B" } } });
    expect(c).toMatchObject({ status: "rejected", reason: { code: "STALE_DOC", doc: { revision: 2, candidateId: "B" } } });
    expect(await repo.listSnapshots("project-1")).toHaveLength(1);
    await expect(repo.startDoc("project-1", 1, "A", "create")).rejects.toMatchObject({ code: "DOC_EXISTS" });
    await expect(repo.saveDoc("project-1", first.doc.revision, edit(first.doc, "탭 1 편집"))).rejects.toMatchObject({ code: "STALE_DOC", doc: { revision: 2 } });
  });

  it("8.2.1 (b) 표 밖 쌍 → UNKNOWN_VARIANT + 알림 문장 · 문서·스냅샷·기록 0 · 다른 안은 그대로 성공", async () => {
    const { store, repo } = await setup();
    inject(store, "B", "gallery");
    const error = await repo.startDoc("project-1", 1, "B", "create").catch((e: unknown) => e);
    expect(error).toMatchObject({ code: "UNKNOWN_VARIANT", alert: expect.stringMatching(/^이 안에는 편집기가 아직 열 수 없는 섹션이 있습니다\((About|Services) · gallery\) — 다른 안을 고르세요$/) });
    expect(await repo.getDoc("project-1")).toBeUndefined();
    expect(await repo.listSnapshots("project-1")).toEqual([]);
    expect((await repo.startDoc("project-1", 1, "A", "create")).doc.candidateId).toBe("A");
  });
});

describe("saveDoc (8.3 · E-AC-11)", () => {
  it("판정 순서 모양 → 멱등 → NOT_FOUND → STALE_DOC · response 실패 뒤 같은 (revision, hash) 재시도 → revision +1만", async () => {
    const { repo } = await setup("ref-a", { fail: ({ method, seq, phase }) => (method === "saveDoc" && seq === 3 && phase === "response" ? new Error("응답 유실") : undefined) });
    expect(await codeOf(repo.saveDoc("project-9", 1, { nope: true } as never))).toBe("SCHEMA_INVALID");
    const { doc } = await setup().then(({ repo: other }) => other.startDoc("project-1", 1, "B", "create"));
    expect(await codeOf(repo.saveDoc("project-1", 1, doc))).toBe("NOT_FOUND");
    const own = (await repo.startDoc("project-1", 1, "B", "create")).doc;
    const next = edit(own, "바꾼 제목");
    await expect(repo.saveDoc("project-1", 1, next)).rejects.toThrow("응답 유실");
    const retried = await repo.saveDoc("project-1", 1, next);
    expect(retried).toMatchObject({ revision: 2, hash: next.hash, meta: { title: "바꾼 제목" } });
    expect(await repo.getDoc("project-1")).toBe(retried);
    await expect(repo.saveDoc("project-1", 1, edit(own, "다른 제목"))).rejects.toMatchObject({ code: "STALE_DOC", doc: retried });
    expect(await codeOf(repo.saveDoc("project-1", 2, { ...edit(retried, "x"), hash: "0000000000000000" }))).toBe("SCHEMA_INVALID");
    expect((await repo.saveDoc("project-1", 2, edit(retried, "셋째"))).revision).toBe(3);
  });
});

describe("createSnapshot (ER-AC-S1 · 2a-05 5.11 · E-AC-31 앞부분)", () => {
  it("기본 이름 '수동 · 시:분'(주입 now) · kind manual · reason 없음 · 문서 revision 그대로 · 사본 = 저장 문서 · 스냅샷·사본 동결", async () => {
    const { repo } = await setup();
    const { doc } = await repo.startDoc("project-1", 1, "B", "create");
    const snap = await repo.createSnapshot("project-1");
    expect(snap).toMatchObject({ snapshotId: "snapshot-1", projectId: "project-1", kind: "manual", name: "수동 · 09:00", createdAt: "2026-09-27T09:00:01.000Z", profileVersion: 1, candidateId: "B", hash: doc.hash });
    expect("reason" in snap).toBe(false);
    expect(snap.doc).toBe(doc);
    expect(Object.isFrozen(snap) && Object.isFrozen(snap.doc)).toBe(true);
    expect(await repo.getDoc("project-1")).toBe(doc);
    expect(await repo.listSnapshots("project-1")).toEqual([snap]);
  });

  it("이름 = 앞뒤 공백 제거 · 30자(코드포인트) 허용 · 31자 SCHEMA_INVALID · 빈 값·공백만 = 기본 이름 · 판정 순서 모양 → NOT_FOUND(프로젝트·문서)", async () => {
    const { repo } = await setup();
    expect(await codeOf(repo.createSnapshot("project-1", 7 as never))).toBe("SCHEMA_INVALID");
    expect(await codeOf(repo.createSnapshot("project-9", "가".repeat(31)))).toBe("SCHEMA_INVALID");
    expect(await codeOf(repo.createSnapshot("project-9"))).toBe("NOT_FOUND");
    expect(await codeOf(repo.createSnapshot("project-1"))).toBe("NOT_FOUND");
    await repo.startDoc("project-1", 1, "B", "create");
    expect((await repo.createSnapshot("project-1", "  시안 확정  ")).name).toBe("시안 확정");
    expect((await repo.createSnapshot("project-1", "😀".repeat(30))).name).toBe("😀".repeat(30));
    expect(await codeOf(repo.createSnapshot("project-1", "😀".repeat(31)))).toBe("SCHEMA_INVALID");
    expect((await repo.createSnapshot("project-1", "")).name).toMatch(/^수동 · \d\d:\d\d$/);
    expect((await repo.createSnapshot("project-1", "   ")).name).toMatch(/^수동 · \d\d:\d\d$/);
    expect((await repo.listSnapshots("project-1")).map((s) => s.snapshotId)).toEqual(["snapshot-1", "snapshot-2", "snapshot-3", "snapshot-4"]);
  });

  it("목록 계약 — 12개 → listSnapshots 전부(자르지 않음) · 생성 순서 · id snapshot-1..12 연속(최근 10 + '이전 N개 더 보기'는 화면이 자른다)", async () => {
    const { repo } = await setup();
    await repo.startDoc("project-1", 1, "B", "create");
    for (let i = 1; i <= 12; i++) await repo.createSnapshot("project-1", `스냅샷 ${i}`);
    const list = await repo.listSnapshots("project-1");
    expect(list.map((s) => s.snapshotId)).toEqual(Array.from({ length: 12 }, (_, i) => `snapshot-${i + 1}`));
    expect(list.map((s) => s.name)).toEqual(Array.from({ length: 12 }, (_, i) => `스냅샷 ${i + 1}`));
  });

  it("fail phase:'commit' → 스냅샷 0 · 문서 그대로 · 재시도는 빈 번호 없이 snapshot-1", async () => {
    const { repo } = await setup("ref-a", { fail: ({ method, seq, phase }) => (method === ("createSnapshot" as never) && seq === 1 && phase === "commit" ? new Error("커밋 실패") : undefined) });
    const { doc } = await repo.startDoc("project-1", 1, "B", "create");
    await expect(repo.createSnapshot("project-1", "첫 시도")).rejects.toThrow("커밋 실패");
    expect(await repo.listSnapshots("project-1")).toEqual([]);
    expect(await repo.getDoc("project-1")).toBe(doc);
    expect((await repo.createSnapshot("project-1", "다시")).snapshotId).toBe("snapshot-1");
  });
});

describe("restoreSnapshot (ER-AC-S2 · 2a-05 E-S30 · E-AC-31)", () => {
  it("'복원 전 · 시:분' auto·restore(지금 문서 사본) + 새 revision(스냅샷 내용) 한 번에 · now 1회 · 기존 스냅샷 동결·그대로 · 다음 저장 STALE_DOC 0", async () => {
    const { repo } = await setup();
    const { doc: first } = await repo.startDoc("project-1", 1, "B", "create");
    const kept = await repo.createSnapshot("project-1", "처음");
    const edited = await repo.saveDoc("project-1", 1, edit(first, "바꾼 제목"));
    const restored = await repo.restoreSnapshot("project-1", kept.snapshotId, edited.revision);
    expect(restored).toEqual({ ...first, revision: 3, updatedAt: "2026-09-27T09:00:03.000Z" });
    expect(restored.hash).toBe(first.hash);
    expect(Object.isFrozen(restored)).toBe(true);
    expect(await repo.getDoc("project-1")).toBe(restored);
    const list = await repo.listSnapshots("project-1");
    expect(list[0]).toBe(kept);
    expect(Object.isFrozen(kept) && Object.isFrozen(kept.doc) && kept.doc === first).toBe(true);
    expect(list.at(-1)).toMatchObject({ snapshotId: "snapshot-2", kind: "auto", reason: "restore", name: "복원 전 · 09:00", createdAt: restored.updatedAt, hash: edited.hash });
    expect(list.at(-1)?.doc).toBe(edited);
    expect((await repo.saveDoc("project-1", restored.revision, edit(restored, "복원 뒤 편집"))).revision).toBe(4);
  });

  it("판정 순서 — 모양(SCHEMA_INVALID) → NOT_FOUND(프로젝트·문서·스냅샷) → STALE_DOC(최신 동봉) · 실패면 스냅샷 0 추가", async () => {
    const { repo } = await setup();
    expect(await codeOf(repo.restoreSnapshot("project-9", "snapshot-1", 1.5))).toBe("SCHEMA_INVALID");
    expect(await codeOf(repo.restoreSnapshot("project-9", 3 as never, 1))).toBe("SCHEMA_INVALID");
    expect(await codeOf(repo.restoreSnapshot("project-9", "snapshot-1", 1))).toBe("NOT_FOUND");
    expect(await codeOf(repo.restoreSnapshot("project-1", "snapshot-1", 1))).toBe("NOT_FOUND");
    const { doc } = await repo.startDoc("project-1", 1, "B", "create");
    expect(await codeOf(repo.restoreSnapshot("project-1", "snapshot-1", 1))).toBe("NOT_FOUND");
    const kept = await repo.createSnapshot("project-1");
    await expect(repo.restoreSnapshot("project-1", kept.snapshotId, 7)).rejects.toMatchObject({ code: "STALE_DOC", doc });
    expect(await repo.listSnapshots("project-1")).toEqual([kept]);
    expect(await repo.getDoc("project-1")).toBe(doc);
  });

  it("fail phase:'commit' → 문서·스냅샷 변화 0 · 재시도 = 같은 revision으로 성공 · 빈 번호 없음", async () => {
    const { repo } = await setup("ref-a", { fail: ({ method, seq, phase }) => (method === ("restoreSnapshot" as never) && seq === 1 && phase === "commit" ? new Error("커밋 실패") : undefined) });
    const { doc } = await repo.startDoc("project-1", 1, "B", "create");
    const kept = await repo.createSnapshot("project-1");
    await expect(repo.restoreSnapshot("project-1", kept.snapshotId, 1)).rejects.toThrow("커밋 실패");
    expect(await repo.getDoc("project-1")).toBe(doc);
    expect(await repo.listSnapshots("project-1")).toEqual([kept]);
    expect((await repo.restoreSnapshot("project-1", kept.snapshotId, 1)).revision).toBe(2);
    expect((await repo.listSnapshots("project-1")).map((s) => s.snapshotId)).toEqual(["snapshot-1", "snapshot-2"]);
  });

  it("자동 스냅샷(새로 시작 전)도 복원 — 안·프로필 버전이 스냅샷 쪽으로 · 번호는 restart와 같은 열", async () => {
    const { repo } = await setup();
    await repo.startDoc("project-1", 1, "A", "create");
    const b = await repo.startDoc("project-1", 1, "B", "restart", 1);
    const [restart] = await repo.listSnapshots("project-1");
    const restored = await repo.restoreSnapshot("project-1", restart!.snapshotId, b.doc.revision);
    expect(restored).toMatchObject({ candidateId: "A", revision: 3, hash: restart!.hash });
    expect((await repo.listSnapshots("project-1")).map((s) => [s.snapshotId, s.reason, s.candidateId])).toEqual([
      ["snapshot-1", "restart", "A"],
      ["snapshot-2", "restore", "B"],
    ]);
  });
});
