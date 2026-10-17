/**
 * RS6-L4 CP3(MQ-6-5 A · L3a QA M2b) — 충돌 두 선택 = 저장소 `resolveConflict`(같은 동기 구간 `rebase`) 1회 → 코어 epoch +1(옛 replace 요청 거절).
 * 뒤이은 `coreIo.replace` 호출은 하지 않는다(REPORT 7절 — replace는 savedMark를 안 맞춰 epoch +2·추가 저장).
 */
import { describe, expect, it } from "vitest";
import { PROJECT, edited, startedRig } from "./testRig";

describe("RS6-L4 CP3 · 충돌 선택 뒤 epoch +1", () => {
  it.each(["mine", "theirs"] as const)("%s 선택 = epoch +1 · dirty 0", async (choice) => {
    const rig = await startedRig();
    const c = rig.core();
    c.edit(edited(rig.doc, "A"));
    await c.save();
    const mine = edited(rig.doc, "M");
    c.edit(mine);
    const before = c.view().epoch;
    await rig.repo.resolveConflict(PROJECT, choice, mine);
    expect(c.view()).toMatchObject({ epoch: before + 1, dirty: false });
  });
});
