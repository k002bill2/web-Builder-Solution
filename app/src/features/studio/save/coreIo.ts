/**
 * 저장 코어 io 부분(INTEGRATE-6 9.2 조작 뒤 몫) — save 본문·confirm·discard·replace. 하네스 saveCore.ts 의미(I1~I8)를 포트 위로 옮겼다.
 * 영속 접근은 포트만(2.2-1). 이 모듈은 DocBook 청크에서만 import한다(감량 ④b — 싱크가 정적 import하면 공유 청크 헬퍼 +53B).
 * 커밋마다 세대 재읽기(하네스 I6b)는 없다 — 잠금 획득 때 fresh() 1회 + 탭 수명 배타 잠금(D6-3).
 */
import { hashDoc } from "../../../engine/ops/hash";
import type { PageDoc } from "../../../engine/contracts/pageDoc";
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
    s.committed = bound;
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
  async discard() {
    return { status: "rejected", reason: "unimplemented" };
  },
  replace() {
    return { status: "rejected", reason: "unimplemented" };
  },
};
