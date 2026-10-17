/**
 * 저장 코어 io 부분(INTEGRATE-6 9.2 조작 뒤 몫) — save 본문·confirm·discard·replace. 하네스 saveCore.ts 의미(I1~I8)를 포트 위로 옮겼다.
 * 영속 접근은 포트만(2.2-1). 이 모듈은 DocBook 청크에서만 import한다(감량 ④b — 싱크가 정적 import하면 공유 청크 헬퍼 +53B).
 * 커밋마다 세대 재읽기(하네스 I6b)는 없다 — 잠금 획득 때 fresh() 1회 + 탭 수명 배타 잠금(D6-3).
 */
import { hashDoc } from "../../../engine/ops/hash";
import type { PageDoc } from "../../../engine/contracts/pageDoc";
import { retainedIds } from "../images/store/imageStore";
import type { CoreIo, Receipt, SaveResult } from "./saveCore";

const reasonOf = (error: unknown) => (error as { reason?: string } | undefined)?.reason ?? "not-committed";

export const coreIo: CoreIo = {
  async save(s, link): Promise<SaveResult> {
    // CE-2: 제출 doc·바인딩·mark를 같은 동기 구간에서 동결(edit·replace는 늘 새 객체를 할당 — 참조 캡처 = 사본)
    const target = s.doc;
    const bound = s.attached;
    const submitted = s.mark;
    const newer = () => s.mark > submitted;
    const { port } = link;
    // I5: 영속 없음
    if (!port) return { status: "failed", reason: "not-persistent", newer: newer() };
    const mode = await port.mode();
    if (mode !== "writer") return { status: "failed", reason: mode, newer: newer() };
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
      const mode = await port.mode();
      if (mode !== "writer") return { status: "failed", reason: mode };
      const proof = s.confirmed;
      if (!(await port.verify(projectId, proof))) return { status: "failed", reason: "stale" };
      // 진입 뒤(await 사이) 편집이 있으면 확정 아님
      if (s.mark !== entered) return { status: "newer", receipt: { ...proof, proof: "fresh" } };
      return { status: "confirmed", wrote: false, receipt: { ...proof, proof: "fresh" } };
    }
    const result = await save();
    if (result.status === "failed") return { status: "failed", reason: result.reason };
    if (!(await port.verify(projectId, result.receipt))) return { status: "failed", reason: "not-committed" };
    if (s.mark > result.receipt.mark) return { status: "newer", receipt: result.receipt };
    return { status: "confirmed", wrote: true, receipt: result.receipt };
  },
  /** H5·CE-1: 진행 중이면 거절 · 복귀 근거(IDB 재읽기 = 마지막 증명)가 있을 때만 폐기, 없으면 blocked(초안 보존) · 진입~끝 배타(finally 해제) */
  async discard(s, link) {
    if (s.discarding) return { status: "rejected", reason: "discarding" };
    if (s.inflight > 0) return { status: "rejected", reason: "inflight" };
    const { port, projectId } = link;
    if (!port) return { status: "blocked", reason: "not-persistent" };
    const proof = s.confirmed;
    if (!proof) return { status: "blocked", reason: "no-saved-state" };
    s.discarding = true;
    try {
      const entered = s.mark;
      const head = await port.head(projectId);
      if (!head || !(await port.verify(projectId, proof))) return { status: "blocked", reason: "stale" };
      // 진입 뒤(await 사이) 편집이 있으면 그 초안을 버리지 않는다(바인딩도 보존)
      if (s.mark !== entered) return { status: "blocked", reason: "newer" };
      s.doc = head;
      // CX-3: 바인딩 = 복귀 문서 커밋 때 실린 이미지만 · delete op 0
      s.attached = s.committed;
      s.savedMark = s.mark;
      s.epoch += 1;
      return { status: "discarded", restored: { ...proof, proof: "fresh" } };
    } finally {
      s.discarding = false;
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
