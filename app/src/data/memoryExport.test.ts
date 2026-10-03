/**
 * requestExport 판정 순서 · 내보내기 전 스냅샷 (DS-2A-05 8.3.2 · E-AC-43 · E-AC-44 · E-AC-48).
 * 순서: 1 모양 → 2 멱등 → 3 NOT_FOUND → 4 STALE_DOC → 5 GATE_FAILED → 6 GENERATOR_UNAVAILABLE(형식별) → 7 UNRENDERED_SECTIONS → 8 쓰기(한 트랜잭션).
 * 픽스처 ref-e(대비 통과 팔레트) + 렌더러 있는 7변형 문서(대체텍스트·SEO 채움) = 게이트 통과 문서.
 */
import { isTerminal } from "../domain/generation";
import type { PageDoc, SectionInstance } from "../engine/contracts/pageDoc";
import { hashDoc } from "../engine/ops/hash";
import { withAlt } from "../engine/testing/gateKit";
import { section } from "../engine/testing/sampleDoc";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { createMemoryCompareBoardRepository } from "./memoryCompareBoardRepository";
import { createMemoryGenerationRepository } from "./memoryGenerationRepository";
import { STATIC_HTML_SLOT } from "./memoryDocBook";
import { createMemoryProjectRepository, type ProjectCall } from "./memoryProjectRepository";
import { ProjectRepositoryError, type ExportGenerator, type ExportGenerators, type ProjectRepository } from "./projectRepository";
import { createStudioStore } from "./studioStore";

type Hooks = { readonly fail?: (c: ProjectCall) => Error | undefined; readonly generators?: ExportGenerators };

/** 앱 경로 정적 HTML 생성기 — 편집기 조작 뒤 청크(exportFlow)가 전역 슬롯(STATIC_HTML_SLOT)을 채운다. 여기서는 가짜 공장으로 채워 호출만 본다 */
const browser = { made: 0, inputs: [] as unknown[] };
const fakeFactory = () => {
  browser.made++;
  return async (input: unknown) => (browser.inputs.push(input), { downloadRef: "blob:browser", resultHash: "b-1" });
};

const RENDERED: readonly SectionInstance[] = [
  section("header", "sticky-right-cta", "s-header"),
  section("hero", "fullbleed-left", "s-hero"),
  section("about", "story", "s-about"),
  section("services", "cards-3", "s-services"),
  section("faq", "accordion", "s-faq"),
  section("contact", "form", "s-contact"),
  section("footer", "biz-extended", "s-footer"),
].map((s) => withAlt(s));
const FALLBACKS = [withAlt(section("portfolio", "masonry", "s-portfolio")), withAlt(section("testimonials", "quotes-2", "s-quotes"))];

async function setup(hooks: Hooks = {}) {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-e", "ref-a", "ref-b"], { hero: "ref-e" }), store });
  await board.confirmProfile(1, 0);
  const gen = createMemoryGenerationRepository({ store });
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i++) job = await gen.getJob(job.jobId);
  let ticks = 0;
  const now = () => `2026-10-03T14:0${ticks++}:00.000Z`;
  const repo = createMemoryProjectRepository({ store, now, ...hooks }) as ProjectRepository<PageDoc>;
  const { doc: started } = await repo.startDoc("project-1", 1, "A", "create");
  /** 저장된 문서를 sections·meta로 바꿔 저장(revision +1) */
  const save = async (sections: readonly SectionInstance[], meta = { title: "동네 치과", description: "동네 치과를 소개합니다." }) => {
    const current = (await repo.getDoc("project-1"))!;
    const next = { ...current, meta, sections };
    return repo.saveDoc("project-1", current.revision, { ...next, hash: hashDoc(next) });
  };
  return { repo, save, started };
}

const fake: ExportGenerator = async ({ format }) => ({ downloadRef: `blob:${format}`, resultHash: "h-1" });
const codeOf = (p: Promise<unknown>) => p.then(() => "ok", (e: { code?: string }) => e.code ?? String(e));
const exportSnapshots = async (repo: ProjectRepository<PageDoc>) => (await repo.listSnapshots("project-1")).filter((s) => s.kind === "auto" && s.reason === "export");

describe("requestExport 판정 순서 (8.3.2 · E-AC-44 · E-AC-48)", () => {
  it("1 모양 — 형식·revision이 아니면 SCHEMA_INVALID", async () => {
    const { repo, save } = await setup({ generators: { "static-html": fake } });
    const doc = await save(RENDERED);
    expect(await codeOf(repo.requestExport("project-1", "pdf" as never, doc.revision))).toBe("SCHEMA_INVALID");
    expect(await codeOf(repo.requestExport("project-1", "static-html", 1.5))).toBe("SCHEMA_INVALID");
  });

  it("3 NOT_FOUND → 4 STALE_DOC — 스냅샷 0", async () => {
    const { repo, save } = await setup({ generators: { "static-html": fake } });
    const doc = await save(RENDERED);
    expect(await codeOf(repo.requestExport("project-x", "static-html", doc.revision))).toBe("NOT_FOUND");
    expect(await codeOf(repo.requestExport("project-1", "static-html", doc.revision - 1))).toBe("STALE_DOC");
    expect(await exportSnapshots(repo)).toEqual([]);
  });

  it("5 GATE_FAILED가 6·7보다 먼저 — 게이트 차단(SEO 빈 값) + 폴백 + 생성기 없음 → GATE_FAILED · 스냅샷 0", async () => {
    const { repo, save } = await setup();
    const doc = await save([...RENDERED.slice(0, 3), ...FALLBACKS, ...RENDERED.slice(3)], { title: "", description: "" });
    expect(await codeOf(repo.requestExport("project-1", "static-html", doc.revision))).toBe("GATE_FAILED");
    expect(await codeOf(repo.requestExport("project-1", "react-zip", doc.revision))).toBe("GATE_FAILED");
    expect(await exportSnapshots(repo)).toEqual([]);
  });

  it("6 GENERATOR_UNAVAILABLE는 형식별 · 7보다 먼저 — react-zip + 폴백 → GENERATOR_UNAVAILABLE (static-html만 등록)", async () => {
    const { repo, save } = await setup({ generators: { "static-html": fake } });
    const doc = await save([...RENDERED.slice(0, 3), ...FALLBACKS, ...RENDERED.slice(3)]);
    expect(await codeOf(repo.requestExport("project-1", "react-zip", doc.revision))).toBe("GENERATOR_UNAVAILABLE");
  });

  it("7 UNRENDERED_SECTIONS — 개수 2 · instanceId 문서 순서 · 스냅샷·잡·멱등 기록 0 → 폴백을 지운 새 revision은 쓰기 진행 (E-AC-48)", async () => {
    const { repo, save } = await setup({ generators: { "static-html": fake } });
    const doc = await save([...RENDERED.slice(0, 3), ...FALLBACKS, ...RENDERED.slice(3)]);
    const error = await repo.requestExport("project-1", "static-html", doc.revision).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProjectRepositoryError);
    expect((error as ProjectRepositoryError).code).toBe("UNRENDERED_SECTIONS");
    expect((error as ProjectRepositoryError).sections).toEqual(["s-portfolio", "s-quotes"]);
    // 멱등 기록 0 — 같은 요청을 다시 해도 다시 판정(같은 오류)
    expect(await codeOf(repo.requestExport("project-1", "static-html", doc.revision))).toBe("UNRENDERED_SECTIONS");
    expect(await exportSnapshots(repo)).toEqual([]);
    const fixed = await save(RENDERED);
    const result = await repo.requestExport("project-1", "static-html", fixed.revision);
    expect(result).toMatchObject({ wrote: true, job: { format: "static-html", docRevision: fixed.revision } });
  });

  it("기본 구현(생성기 둘 다 없음) — 게이트 통과 문서로 2회 → GENERATOR_UNAVAILABLE · 스냅샷 0 · 잡 0 (E-AC-44)", async () => {
    const { repo, save } = await setup();
    const doc = await save(RENDERED);
    for (const format of ["static-html", "react-zip", "static-html"] as const) expect(await codeOf(repo.requestExport("project-1", format, doc.revision))).toBe("GENERATOR_UNAVAILABLE");
    expect(await exportSnapshots(repo)).toEqual([]);
    expect(await repo.getExportJob("export-1")).toBeUndefined();
  });
});

describe("내보내기 전 스냅샷 한 곳 · 멱등 (8.3.2 8단계 · E-AC-43)", () => {
  it("첫 요청 = auto·export 스냅샷 정확히 1 + 잡 1 · 연속 2회 → 같은 잡, 두 번째 스냅샷 +0 · wrote false", async () => {
    const { repo, save } = await setup({ generators: { "static-html": fake } });
    const doc = await save(RENDERED);
    const first = await repo.requestExport("project-1", "static-html", doc.revision);
    expect(first).toMatchObject({ wrote: true, snapshotName: expect.stringMatching(/^내보내기 전 · \d\d:\d\d$/) });
    const second = await repo.requestExport("project-1", "static-html", doc.revision);
    expect(second.job.jobId).toBe(first.job.jobId);
    expect(second).toMatchObject({ wrote: false, snapshotId: first.snapshotId });
    const snaps = await exportSnapshots(repo);
    expect(snaps).toHaveLength(1);
    expect(snaps[0]).toMatchObject({ snapshotId: first.snapshotId, kind: "auto", reason: "export", hash: doc.hash });
    await vi.waitFor(async () => expect(await repo.getExportJob(first.job.jobId)).toMatchObject({ state: "succeeded", downloadRef: "blob:static-html", resultHash: "h-1" }));
  });

  it("fail phase:'commit' → 스냅샷·잡·기록 0 (다음 요청이 새로 쓴다) · fail phase:'response' 뒤 재시도 → 같은 잡, 스냅샷 1", async () => {
    let mode: "commit" | "response" | undefined = "commit";
    const fail = (c: ProjectCall) => (c.method === "requestExport" && c.phase === mode ? new Error(`${mode} 실패`) : undefined);
    const { repo, save } = await setup({ generators: { "static-html": fake }, fail });
    const doc = await save(RENDERED);
    await expect(repo.requestExport("project-1", "static-html", doc.revision)).rejects.toThrow("commit 실패");
    expect(await exportSnapshots(repo)).toEqual([]);
    expect(await repo.getExportJob("export-1")).toBeUndefined();
    mode = "response";
    await expect(repo.requestExport("project-1", "static-html", doc.revision)).rejects.toThrow("response 실패");
    mode = undefined;
    const retried = await repo.requestExport("project-1", "static-html", doc.revision);
    expect(retried).toMatchObject({ wrote: false, job: { jobId: "export-1" } });
    expect(await exportSnapshots(repo)).toHaveLength(1);
  });

  // M2A-3a-fix F3 (Codex P2 2): 커밋 뒤 잡 실행은 응답 전달 성공과 분리 — 응답이 끊겨도 잡은 돈다
  it("fail phase:'response' → 커밋된 잡은 그대로 실행 · 같은 요청 재시도 → 같은 잡 succeeded · 생성기 1회", async () => {
    let lose = true;
    const fail = (c: ProjectCall) => (lose && c.method === "requestExport" && c.phase === "response" ? new Error("response 실패") : undefined);
    const generate = vi.fn(fake);
    const { repo, save } = await setup({ generators: { "static-html": generate }, fail });
    const doc = await save(RENDERED);
    await expect(repo.requestExport("project-1", "static-html", doc.revision)).rejects.toThrow("response 실패");
    lose = false;
    const retried = await repo.requestExport("project-1", "static-html", doc.revision);
    expect(retried).toMatchObject({ wrote: false, job: { jobId: "export-1" } });
    await vi.waitFor(async () => expect(await repo.getExportJob("export-1")).toMatchObject({ state: "succeeded", downloadRef: "blob:static-html" }));
    expect(generate).toHaveBeenCalledTimes(1);
    expect(await exportSnapshots(repo)).toHaveLength(1);
  });

  // M2A-3a-fix F3 (Codex P2 3): 실패 잡 재실행은 지금 문서가 아니라 그 잡의 auto·export 스냅샷 문서로
  it("revision N 잡 실패 → N+1 저장 → N 재시도 → 생성기가 받은 문서 = N(스냅샷 문서) · 같은 잡 · 스냅샷 추가 0", async () => {
    const docs: PageDoc[] = [];
    let calls = 0;
    const flaky: ExportGenerator = async (input) => {
      calls += 1;
      docs.push(input.doc as PageDoc);
      if (calls === 1) throw new ProjectRepositoryError("JOB_TIMEOUT", "시간 초과");
      return fake(input);
    };
    const { repo, save } = await setup({ generators: { "static-html": flaky } });
    const n = await save(RENDERED);
    const first = await repo.requestExport("project-1", "static-html", n.revision);
    await vi.waitFor(async () => expect(await repo.getExportJob(first.job.jobId)).toMatchObject({ state: "failed", retryable: true }));
    const next = await save(RENDERED, { title: "바뀐 제목", description: "동네 치과를 소개합니다." });
    expect(next.revision).toBe(n.revision + 1);
    const again = await repo.requestExport("project-1", "static-html", n.revision);
    expect(again).toMatchObject({ wrote: false, job: { jobId: first.job.jobId, docRevision: n.revision }, snapshotId: first.snapshotId });
    await vi.waitFor(async () => expect(await repo.getExportJob(first.job.jobId)).toMatchObject({ state: "succeeded" }));
    expect(docs).toHaveLength(2);
    expect(docs[1]).toMatchObject({ revision: n.revision, hash: n.hash, meta: { title: "동네 치과" } });
    expect(await exportSnapshots(repo)).toHaveLength(1);
  });

  it("JOB_TIMEOUT 뒤 '다시 시도' = 같은 잡 재실행 · 스냅샷 추가 0", async () => {
    let calls = 0;
    const flaky: ExportGenerator = async (input) => {
      calls += 1;
      if (calls === 1) throw new ProjectRepositoryError("JOB_TIMEOUT", "시간 초과");
      return fake(input);
    };
    const { repo, save } = await setup({ generators: { "static-html": flaky } });
    const doc = await save(RENDERED);
    const first = await repo.requestExport("project-1", "static-html", doc.revision);
    await vi.waitFor(async () => expect(await repo.getExportJob(first.job.jobId)).toMatchObject({ state: "failed", errorCode: "JOB_TIMEOUT", retryable: true }));
    const again = await repo.requestExport("project-1", "static-html", doc.revision);
    expect(again).toMatchObject({ wrote: false, job: { jobId: first.job.jobId }, snapshotId: first.snapshotId });
    await vi.waitFor(async () => expect(await repo.getExportJob(first.job.jobId)).toMatchObject({ state: "succeeded" }));
    expect(calls).toBe(2);
    expect(await exportSnapshots(repo)).toHaveLength(1);
  });
});

describe("화면은 스냅샷을 만들지 않는다 (E-AC-30 · E-AC-43)", () => {
  it("components·features·pages 비테스트 코드에 createSnapshot 호출 0", async () => {
    const { readdirSync, readFileSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");
    const root = join(__dirname, "..");
    const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
    const screens = ["components", "features", "pages"].flatMap((d) => walk(join(root, d))).filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.includes("/testing/"));
    expect(screens.length).toBeGreaterThan(20);
    expect(screens.filter((f) => readFileSync(f, "utf8").includes("createSnapshot("))).toEqual([]);
  });
});

describe("앱 경로 생성기 슬롯 (M2A-3b G3 — STATIC_HTML_SLOT)", () => {
  const slot = globalThis as { [STATIC_HTML_SLOT]?: unknown };
  afterEach(() => void delete slot[STATIC_HTML_SLOT]);

  it("exportFlow 청크가 받히면 슬롯이 채워진다(같은 키)", async () => {
    expect(slot[STATIC_HTML_SLOT]).toBeUndefined();
    await import("../features/studio/exportFlow");
    expect(typeof slot[STATIC_HTML_SLOT]).toBe("function");
  });

  it("슬롯이 비면(기본) static-html도 GENERATOR_UNAVAILABLE · 채우면 브라우저 생성기(처음 쓸 때 공장 1회) → 잡 succeeded · 받은 문서 = 잡의 스냅샷 문서 · react-zip은 계속 GENERATOR_UNAVAILABLE · 주입 생성기가 있으면 그것이 먼저", async () => {
    const { repo, save } = await setup();
    const doc = await save(RENDERED);
    expect(await codeOf(repo.requestExport("project-1", "static-html", doc.revision))).toBe("GENERATOR_UNAVAILABLE");
    slot[STATIC_HTML_SLOT] = async () => fakeFactory;
    expect(await codeOf(repo.requestExport("project-1", "react-zip", doc.revision))).toBe("GENERATOR_UNAVAILABLE");
    const { job } = await repo.requestExport("project-1", "static-html", doc.revision);
    let current = job;
    for (let i = 0; i < 20 && current.state !== "succeeded"; i++) current = (await new Promise((r) => setTimeout(r, 0)), (await repo.getExportJob(job.jobId))!);
    expect(current).toMatchObject({ state: "succeeded", downloadRef: "blob:browser", resultHash: "b-1" });
    expect(browser.made).toBe(1);
    expect(browser.inputs).toEqual([{ projectId: "project-1", format: "static-html", doc }]);
    // 주입 생성기가 있으면 슬롯보다 먼저
    const injected = await setup({ generators: { "static-html": fake } });
    const other = await injected.save(RENDERED);
    const { job: first } = await injected.repo.requestExport("project-1", "static-html", other.revision);
    await new Promise((r) => setTimeout(r, 0));
    expect(await injected.repo.getExportJob(first.jobId)).toMatchObject({ state: "succeeded", downloadRef: "blob:static-html" });
    expect(browser.made).toBe(1);
  });
});
