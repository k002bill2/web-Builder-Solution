/**
 * 코어 있는 저장소 테스트 장치(RS6-L3b CP-A) — 제품 저장 코어(`createSaveCore` + `coreIo`) 그대로, 영속 경계만 가짜다.
 * 테스트 전용(제품 코드가 import하지 않는다). 기존 화면 테스트의 저장소 흉내(`saveDoc` 스파이·지연·실패 주입)를 그대로 쓰도록
 * 가짜 포트가 그 `saveDoc`을 부른다:
 * - `commit` = `saveDoc` 대기(코어가 제출 doc·mark를 동결한 뒤 — 제품 commit 지점) · 거절은 포트 reason으로 바꾼다(STALE_DOC = stale ·
 *   읽기 전용 탭 문장 = readonly · Web Locks 없는 로컬 = unsupported — 제품 포트가 내는 reason과 같다). `head` = 마지막 STALE_DOC 동봉 문서(다른 탭 커밋).
 * - persistence 라벨이 memory여도 포트를 단다(제품 memory = 포트 없음) — 기존 화면 테스트의 비동기 저장 주입(대기·실패·STALE)을 commit 지점에 싣기 위해서.
 *   제품 memory 경로(not-persistent)는 `useDocSaveCore*.test`·`save/` 테스트가 실제 저장소로 잰다.
 * - 저장소 흉내의 `restoreSnapshot`·`resolveConflict`(revision을 올리는 쓰기)는 그 코어 chain 뒤에서 부르고 결과로 코어 기준을 맞춘다(제품 DocBook CP0 `rebase`와 같은 자리).
 */
import { vi } from "vitest";
import { projectErrorCode } from "../../../data/projectRepository";
import { READ_ONLY_TAB } from "../../../data/persistence/infra";
import type { PageDoc } from "../../../engine/contracts/pageDoc";
import { coreIo, rebase } from "../save/coreIo";
import { createSaveCore, type CoreKeeper, type CoreLink, type CorePort, type SaveCore } from "../save/saveCore";

interface SaveDocLike {
  readonly persistence: string;
  readonly saveDoc: (projectId: string, revision: number, doc: PageDoc) => Promise<unknown>;
  restoreSnapshot?: (...args: never[]) => Promise<unknown>;
  resolveConflict?: (...args: never[]) => Promise<unknown>;
}

export interface CoreFixtureOptions {
  /** 포트 일부 덮어쓰기(local) — 예: mode 지연 */
  readonly port?: Partial<CorePort>;
  /** 청크·싱크 연결(connect) — 실패 주입 = 코어 `failed{unavailable}` */
  readonly connect?: () => Promise<void> | void;
}

const reasonOf = (error: unknown, persistence: string) => {
  if (projectErrorCode(error) === "STALE_DOC") return "stale";
  if (String((error as Error)?.message).includes(READ_ONLY_TAB)) return "readonly";
  if (persistence === "local" && !navigator.locks) return "unsupported";
  return (error as { reason?: string })?.reason ?? "not-committed";
};

/** revision을 올리는 쓰기(첫 인자 = projectId)를 코어 chain 뒤에서 부르고 쓴 문서로 코어 기준을 맞춘다 — 저장소 밖 쓰기 함수(`adopt` 인자)에도 쓴다 */
export const rebasing =
  (cores: ReadonlyMap<string, SaveCore>) =>
  <A extends unknown[]>(run: (...args: A) => Promise<unknown>, mine?: (args: A) => boolean) =>
  async (...args: A) => {
    const found = cores.get(args[0] as string);
    await found?.idle();
    const doc = (await run(...args)) as PageDoc | undefined;
    if (doc) await found?.link((_, s) => rebase(s, doc, mine?.(args)));
    return doc;
  };

/** 저장소 흉내에 코어 레지스트리(`core`)를 단다 — 같은 저장소·projectId = 같은 코어(제품 레지스트리와 같은 규칙) */
export function withSaveCore<R extends SaveDocLike>(repository: R, options: CoreFixtureOptions = {}): R & { core: NonNullable<CoreKeeper["core"]>; readonly cores: Map<string, SaveCore> } {
  const cores = new Map<string, SaveCore>();
  const linkOf = (projectId: string): CoreLink => {
    let theirs: PageDoc | undefined;
    const port: CorePort = {
      mode: async () => "writer",
      head: async () => theirs,
      commit: async (id, doc) => {
        try {
          await repository.saveDoc(id, doc.revision - 1, doc);
        } catch (error) {
          if (projectErrorCode(error) === "STALE_DOC") theirs = (error as { readonly doc?: PageDoc }).doc;
          throw Object.assign(new Error("commit"), { reason: reasonOf(error, repository.persistence) });
        }
      },
      verify: async () => true,
      ...options.port,
    };
    return { projectId, io: coreIo, port, now: () => "2026-10-17T00:00:00.000Z", book: (doc) => doc, align: () => undefined };
  };
  // revision을 올리는 쓰기 = 코어 chain 뒤 · 쓴 문서로 코어 기준 맞춤(제품 DocBook CP0) — 스파이(vi.fn)면 구현만 감싼다(호출 기록·1회 덮어쓰기 유지)
  const rebased = rebasing(cores);
  for (const key of ["restoreSnapshot", "resolveConflict"] as const) {
    const run = repository[key] as ((...args: unknown[]) => Promise<unknown>) | undefined;
    if (!run) continue;
    const mine = key === "resolveConflict" ? (args: unknown[]) => args[1] === "mine" : undefined;
    if (vi.isMockFunction(run)) run.mockImplementation(rebased(run.getMockImplementation() ?? (async () => undefined), mine));
    else (repository as Record<string, unknown>)[key] = rebased(run, mine);
  }
  const core = (projectId: string, seed: PageDoc) => {
    let found = cores.get(projectId);
    if (!found) {
      const link = linkOf(projectId);
      cores.set(projectId, (found = createSaveCore(seed, async () => (await options.connect?.(), link))));
    }
    return found;
  };
  return Object.assign(repository, { core, cores });
}
