/**
 * PERSIST-P1a-2 배선 (ADR-007 3절 하이드레이션·쓰기 방식 · 부록 Codex 제약 3 · 개정 1) — 메모리 가짜 영속으로 앱 조립(deferredStudio)을 돌린다.
 * 진입은 봉투 확인만(entryRead), 조작 뒤 싱크(localSync)가 검증·쓰기 큐·DocBook 시드를 맡는다. 실제 IDB는 Ego Lite 실측.
 */
import { describe, expect, it } from "vitest";
import { isTerminal } from "../../domain/generation";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { hashDoc } from "../../engine/ops/hash";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import { STUDIO_IMPORTS, createDeferredStudio } from "../deferredStudio";
import type { ProjectRepository } from "../projectRepository";
import { checkEnvelope } from "./envelope";
import type { LocalEntry } from "./entryRead";
import { openLocalSync } from "./localSync";
import { createMemoryPersistence, type MemoryPersistenceOptions, type StudioPersistence } from "./studioPersistence";

const imports = {
  ...STUDIO_IMPORTS,
  board: async () => {
    const mod = await STUDIO_IMPORTS.board();
    return {
      ...mod,
      createMemoryCompareBoardRepository: (options: Parameters<typeof mod.createMemoryCompareBoardRepository>[0]) =>
        mod.createMemoryCompareBoardRepository({ ...options, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }) }),
    };
  },
};

const edit = (doc: PageDoc, title: string): PageDoc => {
  const next = { ...doc, meta: { ...doc.meta, title } };
  return { ...next, hash: hashDoc(next) };
};
const codeOf = (p: Promise<unknown>) => p.then(() => "ok", (e: { code?: string }) => e.code ?? String(e));

function studioOn(persistence: StudioPersistence, entry: LocalEntry = {}) {
  return createDeferredStudio(async () => FIXTURE_CATALOG, imports, { entry, sync: (e) => openLocalSync(e, async () => persistence) });
}

/** 확정 → 3안(끝까지) → B안 편집 시작 — 앱 흐름 그대로 */
async function started(persistence: StudioPersistence) {
  const studio = studioOn(persistence);
  await (await studio.board()).confirmProfile(1, 0);
  const gen = await studio.generations();
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i += 1) job = await gen.getJob(job.jobId);
  const projects = (await studio.projects()) as ProjectRepository<PageDoc>;
  const { doc } = await projects.startDoc("project-1", 1, "B", "create");
  return { studio, projects, doc, job };
}

/** 영속 레코드 → 진입 결과(진입 읽기와 같은 봉투 확인) */
async function entryFrom(persistence: StudioPersistence, projectId?: string): Promise<LocalEntry> {
  const state = checkEnvelope(await persistence.get("studio", "state"), "state", "state");
  const doc = projectId ? checkEnvelope(await persistence.get("docs", projectId), "doc", projectId) : undefined;
  return { ...(state.status === "ok" && { state: state.data as LocalEntry["state"] }), ...(doc?.status === "ok" && { doc: doc.data as LocalEntry["doc"] }) };
}

describe("새로고침 생존 — 저장 → 레코드 → 새 store 복원 (D2 왕복)", () => {
  it("확정·생성·편집 시작·이름 변경·저장 뒤 복원하면 목록·문서·프로필·잡이 같다", async () => {
    const persistence = createMemoryPersistence();
    const { studio, projects, doc, job } = await started(persistence);
    expect(projects.persistence).toBe("local");
    await projects.renameProject("project-1", (await projects.getProject("project-1"))!.revision, "새 이름");
    const saved = await projects.saveDoc("project-1", doc.revision, edit(doc, "저장한 제목"));

    const again = studioOn(persistence, await entryFrom(persistence, "project-1"));
    const reloaded = (await again.projects()) as ProjectRepository<PageDoc>;
    expect(await reloaded.listProjects()).toEqual(await projects.listProjects());
    expect(await reloaded.getDoc("project-1")).toEqual(saved);
    expect(await again.profiles.getProfile("profile-1")).toEqual(await studio.profiles.getProfile("profile-1"));
    expect(await (await again.generations()).getJob(job.jobId)).toEqual(job);
    // 복원 뒤에도 저장이 이어진다(revision 연속 · 시드한 DocBook)
    const next = await reloaded.saveDoc("project-1", saved.revision, edit(saved as PageDoc, "다시 저장"));
    expect(next.revision).toBe(saved.revision + 1);
  });

  it("진입 문서가 아닌 프로젝트(/projects → 앱 안 이동)도 문서 머리가 있으면 시드를 기다려 문서를 돌려준다", async () => {
    const persistence = createMemoryPersistence();
    const { projects, doc } = await started(persistence);
    const saved = await projects.saveDoc("project-1", doc.revision, edit(doc, "목록에서 열기"));
    const again = studioOn(persistence, await entryFrom(persistence));
    const reloaded = await again.projects();
    expect(await reloaded.listProjects()).toEqual([expect.objectContaining({ projectId: "project-1", hasDoc: true, docSavedAt: saved.updatedAt })]);
    expect(await reloaded.getDoc("project-1")).toEqual(saved);
  });

  it("새로고침 중 생성 — 진행 중 잡을 복원하면 getJob 반복으로 끝난다(개정 1 StoredJob 통째로)", async () => {
    const persistence = createMemoryPersistence();
    const studio = studioOn(persistence);
    await (await studio.board()).confirmProfile(1, 0);
    const gen = await studio.generations();
    const first = await gen.getJob((await gen.requestGeneration("profile-1", 1)).jobId);
    expect(isTerminal(first.state)).toBe(false);
    // 상태 쓰기는 커밋 뒤 비동기 — 큐가 비도록 이름 변경 없이 프로젝트 저장소 한 번 왕복(같은 큐 뒤)
    await (await studio.projects()).listProjects();
    for (let i = 0; i < 20; i += 1) await Promise.resolve();
    const again = studioOn(persistence, await entryFrom(persistence));
    const regen = await again.generations();
    let job = await regen.getJob(first.jobId);
    for (let i = 0; i < 10 && !isTerminal(job.state); i += 1) job = await regen.getJob(job.jobId);
    expect(job.state).toBe("succeeded");
  });
});

describe("저장됨 = IDB 커밋 확인 뒤 (Codex 제약 3)", () => {
  function gated() {
    const gate: { hold?: Promise<void>; fail?: boolean } = {};
    const options: MemoryPersistenceOptions = { commit: () => gate.hold, fail: () => (gate.fail ? new DOMException("x", "QuotaExceededError") : undefined) };
    return { gate, persistence: createMemoryPersistence(options) };
  }

  it("커밋이 끝나기 전에는 saveDoc이 settle되지 않는다", async () => {
    const { gate, persistence } = gated();
    const { projects, doc } = await started(persistence);
    let release!: () => void;
    gate.hold = new Promise<void>((ok) => (release = ok));
    let settled = false;
    const saving = projects.saveDoc("project-1", doc.revision, edit(doc, "대기")).then(() => (settled = true));
    for (let i = 0; i < 30; i += 1) await Promise.resolve();
    expect(settled).toBe(false);
    release();
    await saving;
    expect(settled).toBe(true);
  });

  it("IDB 실패 = INFRA · 같은 요청 재시도(멱등 재생)는 미확인 기록을 다시 써서 저장된다", async () => {
    const { gate, persistence } = gated();
    const { projects, doc } = await started(persistence);
    const next = edit(doc, "실패 뒤 재시도");
    gate.fail = true;
    expect(await codeOf(projects.saveDoc("project-1", doc.revision, next))).toBe("INFRA");
    gate.fail = false;
    const saved = await projects.saveDoc("project-1", doc.revision, next);
    expect(((await persistence.get("docs", "project-1")) as { data: { doc: PageDoc } }).data.doc).toEqual(saved);
  });

  it("IDB 실패 → 더 편집 → 다음 저장: 내 미확인 쓰기 위에 얹는다(STALE_DOC 아님)", async () => {
    const { gate, persistence } = gated();
    const { projects, doc } = await started(persistence);
    gate.fail = true;
    expect(await codeOf(projects.saveDoc("project-1", doc.revision, edit(doc, "첫 편집")))).toBe("INFRA");
    gate.fail = false;
    const saved = await projects.saveDoc("project-1", doc.revision, edit(doc, "둘째 편집"));
    expect(saved).toMatchObject({ revision: doc.revision + 2 });
    expect(((await persistence.get("docs", "project-1")) as { data: { doc: PageDoc } }).data.doc.meta.title).toBe("둘째 편집");
  });
});

describe("싱크 단위", () => {
  it("복제 실패 = 재시도 불가 INFRA — 원인 문구 일치 · 재호출도 실패(거짓 저장됨 0)", async () => {
    const persistence = createMemoryPersistence();
    const sync = await openLocalSync({}, async () => persistence);
    const book = { docOf: () => ({ projectId: "p", revision: 1, bad: () => 1 }) as never, snapshotsOf: () => [] };
    const first = sync.flush("p", book);
    await expect(first).rejects.toMatchObject({ code: "INFRA" });
    await expect(first).rejects.toThrow("복제");
    await expect(first).rejects.not.toThrow("브라우저 저장소에 접근하지 못했습니다");
    await expect(sync.flush("p", book)).rejects.toMatchObject({ code: "INFRA" });
    expect(await persistence.getAll("docs")).toEqual([]);
  });

  it("복원 검증 = 실제 store 규칙 — 위반이면 쓰기를 거부하고 레코드를 덮지 않는다", async () => {
    const persistence = createMemoryPersistence();
    const { projects, doc } = await started(persistence);
    await projects.saveDoc("project-1", doc.revision, edit(doc, "원본"));
    const good = await entryFrom(persistence);
    const state = good.state!;
    const before = await persistence.getAll("studio");
    const stored = [...state.jobs.values()][0]!;
    const broken: LocalEntry[] = [
      // 잡 state ↔ 후보 진행 상태(stateOf) 불일치
      { state: { ...state, jobs: new Map([[stored.job.jobId, { ...stored, job: { ...stored.job, state: "running" as const } }]]) } },
      // 계열 번호 건너뜀(insert 규칙)
      { state: { ...state, series: new Map([["profile-1", state.series.get("profile-1")!.map((v) => ({ ...v, version: v.version + 1 }))]]) } },
      // 프로젝트 이름 규칙(validateProjectName)
      { state: { ...state, projects: new Map([["project-1", { ...state.projects.get("project-1")!, name: "   " }]]) } },
    ];
    for (const entry of broken) {
      // 열기마다 새 연결(실패 시 닫힘)이 같은 데이터를 본다
      await expect(openLocalSync(entry, async () => ({ ...persistence, close: () => undefined }))).rejects.toMatchObject({ code: "INFRA" });
    }
    expect(await persistence.getAll("studio")).toEqual(before);
  });
});
