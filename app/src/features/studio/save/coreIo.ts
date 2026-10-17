/**
 * 저장 코어 io 부분(INTEGRATE-6 9.2 조작 뒤 몫) — save 본문·confirm·discard·replace. 하네스 saveCore.ts 의미(I1~I8)를 포트 위로 옮겼다.
 * 영속 접근은 포트만(2.2-1). 이 모듈은 DocBook 청크에서만 import한다(감량 ④b — 싱크가 정적 import하면 공유 청크 헬퍼 +53B).
 * 커밋마다 세대 재읽기(하네스 I6b)는 없다 — 잠금 획득 때 fresh() 1회 + 탭 수명 배타 잠금(D6-3).
 */
import { hashDoc } from "../../../engine/ops/hash";
import type { PageDoc } from "../../../engine/contracts/pageDoc";
import { retainedIds } from "../images/store/imageStore";
import type { CoreIo, CoreState, DiscardResult, Receipt, SaveResult } from "./saveCore";

const reasonOf = (error: unknown, fallback = "not-committed") => (error as { reason?: string } | undefined)?.reason ?? fallback;
/** discard 읽기가 이 시간 안에 끝나지 않으면 포기 — `blocked{timeout}` · 가드 해제 · 늦은 결과 버림(LV-2 · 잠정 MQ-6-3b — 근거 `dev/active/rs6-l2-liveness/REPORT.md`) */
export const DISCARD_GIVE_UP_MS = 5000;
/** L1 QA note 3: 포트 판정·재읽기(mode·verify) throw = reject 아님 → `failed{infra}`(거짓 saved 0 — 전진은 성공 뒤에만) */
const safely = <T>(run: () => Promise<T>): Promise<T | { readonly infra: string }> => run().catch((error: unknown) => ({ infra: reasonOf(error, "infra") }));

export const coreIo: CoreIo = {
  async save(s, link): Promise<SaveResult> {
    // 편집 틀 이미지 맵 → 코어 바인딩(탭 수명 — 편집기를 떠난 뒤 save도 Blob을 싣는다)
    const map = link.images?.();
    if (map) s.attached = { ...s.attached, ...map };
    // CE-2: 제출 doc·바인딩·mark를 같은 동기 구간에서 동결(edit·replace는 늘 새 객체를 할당 — 참조 캡처 = 사본)
    const target = s.doc;
    const bound = s.attached;
    const submitted = s.mark;
    const newer = () => s.mark > submitted;
    const { port } = link;
    // I5: 영속 없음(memory) = DocBook 메모리 커밋(지금 saveDoc 판정 그대로) 뒤 not-persistent — 영속 증명(confirmed)은 만들지 않는다
    if (!port) {
      let revision: number;
      try {
        revision = link.book({ ...target, hash: hashDoc(target) }).revision;
      } catch (error) {
        return { status: "failed", reason: reasonOf(error), newer: newer() };
      }
      s.savedMark = Math.max(s.savedMark, submitted);
      return { status: "failed", reason: "not-persistent", newer: newer(), revision };
    }
    const mode = await safely(() => port.mode());
    if (mode !== "writer") return { status: "failed", reason: typeof mode === "string" ? mode : mode.infra, newer: newer() };
    const next: PageDoc = Object.freeze({ ...target, revision: (s.confirmed?.revision ?? target.revision) + 1, hash: hashDoc(target), updatedAt: link.now() });
    try {
      await port.commit(link.projectId, next, bound);
    } catch (error) {
      return { status: "failed", reason: reasonOf(error), newer: newer() };
    }
    const receipt: Receipt = { hash: next.hash, revision: next.revision, mark: submitted, proof: "committed" };
    s.savedMark = Math.max(s.savedMark, submitted);
    s.confirmed = receipt;
    // CX-3: discard 복귀용 = 이 커밋 문서가 참조한 바인딩만
    const refs = retainedIds(next, undefined);
    s.committed = Object.fromEntries(Object.entries(bound).filter(([id]) => refs.has(id)));
    link.align(next);
    return { status: "saved", receipt, newer: newer() };
  },
  /** I3·I4: dirty면 최신 초안을 저장(진행 중 저장 뒤 직렬) 후 재읽기 증명 · 아니면 writer + 재읽기 = 마지막 증명일 때만 wrote:false */
  async confirm(s, link, save) {
    const { port, projectId } = link;
    if (!port) return { status: "failed", reason: "not-persistent" };
    const entered = s.mark;
    if (s.mark <= s.savedMark && s.confirmed) {
      const mode = await safely(() => port.mode());
      if (mode !== "writer") return { status: "failed", reason: typeof mode === "string" ? mode : mode.infra };
      const proof = s.confirmed;
      const fresh = await safely(() => port.verify(projectId, proof));
      if (fresh !== true) return { status: "failed", reason: fresh ? fresh.infra : "stale" };
      // 진입 뒤(await 사이) 편집이 있으면 확정 아님
      if (s.mark !== entered) return { status: "newer", receipt: { ...proof, proof: "fresh" } };
      return { status: "confirmed", wrote: false, receipt: { ...proof, proof: "fresh" } };
    }
    const result = await save();
    if (result.status === "failed") return { status: "failed", reason: result.reason };
    const fresh = await safely(() => port.verify(projectId, result.receipt));
    if (fresh !== true) return { status: "failed", reason: fresh ? fresh.infra : "not-committed" };
    if (s.mark > result.receipt.mark) return { status: "newer", receipt: result.receipt };
    return { status: "confirmed", wrote: true, receipt: result.receipt };
  },
  /** H5·CE-1: 진행 중이면 거절 · 복귀 근거(IDB 재읽기 = 마지막 증명)가 있을 때만 폐기, 없으면 blocked(초안 보존) · 진입~끝 배타
   * LV-2(MC I7 변경): 읽기가 `DISCARD_GIVE_UP_MS` 안에 안 끝나면 포기 — blocked{timeout} · 배타 해제 · 토큰을 올려 늦은 결과를 버린다 */
  async discard(s, link, entered) {
    if (s.discarding) return { status: "rejected", reason: "discarding" };
    if (s.inflight > 0) return { status: "rejected", reason: "inflight" };
    const { port, projectId } = link;
    if (!port) return { status: "blocked", reason: "not-persistent" };
    const proof = s.confirmed;
    if (!proof) return { status: "blocked", reason: "no-saved-state" };
    s.discarding = true;
    const token = (s.discards += 1);
    const live = () => s.discards === token;
    const read = (async (): Promise<DiscardResult | undefined> => {
      const head = await port.head(projectId);
      if (!live()) return undefined;
      if (!head || !(await port.verify(projectId, proof))) return { status: "blocked", reason: "stale" };
      // 포기 뒤 늦게 온 결과 = 버림(doc·바인딩·savedMark·epoch 변경 0)
      if (!live()) return undefined;
      // 진입 뒤(호출~await 사이) 편집·교체가 있으면 그 초안을 버리지 않는다(바인딩도 보존)
      if (s.mark !== entered) return { status: "blocked", reason: "newer" };
      s.doc = head;
      // CX-3: 바인딩 = 복귀 문서 커밋 때 실린 이미지만 · delete op 0
      s.attached = s.committed;
      s.savedMark = s.mark;
      s.epoch += 1;
      return { status: "discarded", restored: { ...proof, proof: "fresh" } };
    })();
    // 포기한 읽기의 늦은 reject는 삼킨다(결과는 이미 timeout)
    read.catch(() => undefined);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const giveUp = new Promise<DiscardResult>((done) => (timer = setTimeout(() => done({ status: "blocked", reason: "timeout" }), DISCARD_GIVE_UP_MS)));
    try {
      return (await Promise.race([read, giveUp]))!;
    } finally {
      clearTimeout(timer);
      // 이 차례가 아직 현재일 때만 배타를 푼다 — 포기 뒤 다음 discard의 배타를 늦은 끝이 풀지 않게
      if (live()) {
        s.discarding = false;
        s.discards += 1;
      }
    }
  },
  /** H5·I8: 문서 교체는 명시 intent + 예상 epoch · 진행 중/미저장 편집이면 거절(덮어쓰기 0) */
  replace(s, next, request, blobs) {
    if (request.intent !== "replace") return { status: "rejected", reason: "intent-required" };
    if (s.inflight > 0) return { status: "rejected", reason: "inflight" };
    if (s.mark > s.savedMark) return { status: "rejected", reason: "dirty" };
    if (request.expectedEpoch !== s.epoch) return { status: "rejected", reason: "epoch" };
    s.doc = { ...next };
    if (blobs) s.attached = { ...s.attached, ...blobs };
    s.mark += 1;
    s.epoch += 1;
    return { status: "replaced", epoch: s.epoch };
  },
};

/**
 * RS6-L3a CP0(L1 QA note 2 · I6 6.4) — DocBook이 revision을 올리는 쓰기(복원·충돌 해결·restart)와 코어 기준 맞춤. 코어가 있는 프로젝트에서 DocBook이 부른다(같은 동기 구간).
 * 쓰기 전 판정: 코어 save 진행 중이거나 덮어쓸 미저장 편집이 있으면 쓰기 0(충돌 해결은 내 초안이 입력이라 dirty 허용).
 */
export const unsettled = (s: CoreState, draft = false) => s.inflight > 0 || (!draft && s.mark > s.savedMark);
/**
 * 쓰기 뒤 맞춤 — 코어 기준 = 쓴 문서(confirmed hash·revision · 다음 save = 그 revision + 1, 같은 revision 덮어쓰기 0) · epoch +1(옛 replace 요청 거절).
 * 초안 = 쓴 문서(clean) — `mine`이고 초안이 쓴 문서와 다르면(요청 뒤 새 편집) 초안 유지(dirty). 복귀 바인딩 = 쓴 문서가 참조한 것만(CX-3).
 */
export function rebase(s: CoreState, doc: PageDoc, mine = false) {
  if (!mine || hashDoc(s.doc) === doc.hash) {
    s.doc = doc;
    s.mark += 1;
    s.savedMark = s.mark;
  }
  s.confirmed = { hash: doc.hash, revision: doc.revision, mark: s.savedMark, proof: "committed" };
  s.epoch += 1;
  const refs = retainedIds(doc, undefined);
  s.committed = Object.fromEntries(Object.entries(s.attached).filter(([id]) => refs.has(id)));
}
