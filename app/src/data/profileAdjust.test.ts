/**
 * DS-2A-04 2a-04b1 — 조정 범위·조정 저장·보드 재확정 이어받기 (SPEC 3.4 · 6.1-3·4 · 6.3, P-AC-13·17·20·38·39 저장소 몫).
 * 보드·프로필 메모리 저장소를 store 하나로 만든다. 조정 버전은 saveAdjustments로 만든다(브리프 1절).
 */
import { describe, expect, it } from "vitest";
import type { AdjustmentRange, PaletteCorrection, ProfileAdjustments } from "../domain/profile";
import { carryOverAdjustments, effectiveProfile } from "../domain/profileAdjustments";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { deferred } from "../test/deferred";
import type { Picks } from "../domain/compareBoard";
import { CompareBoardError } from "./compareBoardRepository";
import { createMemoryCompareBoardRepository, type BoardCall } from "./memoryCompareBoardRepository";
import { createMemoryProfileRepository, type ProfileCall } from "./memoryProfileRepository";
import { ProfileError } from "./profileRepository";
import { createStudioStore } from "./studioStore";

const IDS = ["ref-a", "ref-b", "ref-c"];
const NOW = () => "2026-09-26T00:00:00.000Z";
const MUTED_FIX: PaletteCorrection = { role: "muted", from: "#9A7B63", to: "#8E715B", check: "C-5" };
const INK_FIX: PaletteCorrection = { role: "ink", from: "#C9A96E", to: "#7E622F", check: "C-4" };

function setup(
  options: { picks?: Picks; range?: AdjustmentRange; delay?: (call: ProfileCall) => Promise<void> | undefined; fail?: (call: ProfileCall) => Error | undefined } = {},
) {
  const { picks = { hero: "ref-a" }, ...profileOptions } = options;
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, now: NOW, initialBoard: boardOf(IDS, picks), store });
  const profiles = createMemoryProfileRepository({ store, now: NOW, ...profileOptions });
  const versionsOf = async () => (await profiles.getProfile("profile-1"))?.versions ?? [];
  /** 보드 선택을 바꾸고 계열 최신 위에 재확정한다 */
  const reconfirm = async (next: Picks) => {
    const { board: current } = await board.getBoard();
    const saved = await board.savePicks(next, {}, current.revision);
    const latest = (await profiles.getProfile("profile-1"))!.latestVersion;
    const result = await board.createProfileVersion("profile-1", saved.revision, latest);
    return (await versionsOf()).find((v) => v.version === result.version)!;
  };
  return { store, board, profiles, versionsOf, reconfirm };
}

async function errorOf(promise: Promise<unknown>): Promise<ProfileError | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    return error as ProfileError;
  }
}

const NARROW: AdjustmentRange = { density: ["comfortable"], contrast: ["aa", "enhanced"], motion: ["L0", "L1"], source: "테스트 무드" };

describe("P-AC-13(저장소) 조정 범위 — getAdjustmentRange · RANGE_VIOLATION", () => {
  it("기본 범위 1벌: 밀도 2 · 대비 2 · 모션 L0~L2(L3 없음), 없는 프로필·버전은 NOT_FOUND", async () => {
    const { board, profiles } = setup();
    await board.confirmProfile(1, 0);
    expect(await profiles.getAdjustmentRange("profile-1", 1)).toEqual({
      density: ["comfortable", "compact"],
      contrast: ["aa", "enhanced"],
      motion: ["L0", "L1", "L2"],
      source: "기본 범위",
    });
    expect((await errorOf(profiles.getAdjustmentRange("profile-9", 1)))?.code).toBe("NOT_FOUND");
    expect((await errorOf(profiles.getAdjustmentRange("profile-1", 2)))?.code).toBe("NOT_FOUND");
  });

  it("좁은 range 주입 → 그 범위를 돌려주고, 범위 밖 저장은 RANGE_VIOLATION · 새 버전 0, 범위 안은 저장된다", async () => {
    const { board, profiles, versionsOf } = setup({ range: NARROW });
    await board.confirmProfile(1, 0);
    expect(await profiles.getAdjustmentRange("profile-1", 1)).toEqual(NARROW);
    for (const adjustments of [{ density: "compact" }, { motion: "L2" }] satisfies ProfileAdjustments[]) {
      const error = await errorOf(profiles.saveAdjustments("profile-1", 1, adjustments));
      expect(error).toBeInstanceOf(ProfileError);
      expect(error?.code).toBe("RANGE_VIOLATION");
    }
    expect((await versionsOf()).map((v) => v.version)).toEqual([1]);
    const saved = await profiles.saveAdjustments("profile-1", 1, { density: "comfortable", motion: "L0", contrast: "enhanced" });
    expect(saved.version).toBe(2);
  });
});

describe("조정 저장 saveAdjustments (6.3)", () => {
  it("새 버전 1개(origin adjust) — base·기준 레퍼런스는 최신 그대로, 조정은 정규화해 저장, 레코드 동결, 이전 레코드 불변", async () => {
    const { board, profiles, versionsOf } = setup();
    await board.confirmProfile(1, 0);
    const [v1] = await versionsOf();
    const snapshot = structuredClone(v1);
    const v2 = await profiles.saveAdjustments("profile-1", 1, { motion: "L0", density: "compact", corrections: [MUTED_FIX], purpose: undefined });
    expect(v2).toMatchObject({ profileId: "profile-1", version: 2, origin: "adjust", baseReferenceId: v1!.baseReferenceId, createdAt: NOW() });
    expect(v2.base).toEqual(v1!.base);
    expect(v2.adjustments).toEqual({ density: "compact", motion: "L0", corrections: [MUTED_FIX] });
    expect(Object.keys(v2.adjustments)).toEqual(["density", "motion", "corrections"]);
    expect(Object.isFrozen(v2) && Object.isFrozen(v2.adjustments)).toBe(true);
    expect((await versionsOf())[0]).toEqual(snapshot);
    expect(effectiveProfile(v2.base, v2.adjustments).spacing_tokens.sectionGap).toBe(72);
  });

  it("P-AC-17(저장소): expectedLatest가 최신과 다르면 STALE_PROFILE(최신 계열 동봉) · 새 버전 0", async () => {
    const { board, profiles, versionsOf } = setup();
    await board.confirmProfile(1, 0);
    await profiles.saveAdjustments("profile-1", 1, { density: "compact" });
    const error = await errorOf(profiles.saveAdjustments("profile-1", 1, { motion: "L0" }));
    expect(error?.code).toBe("STALE_PROFILE");
    expect(error?.series?.latestVersion).toBe(2);
    expect(error?.series?.versions.map((v) => v.version)).toEqual([1, 2]);
    expect((await versionsOf()).map((v) => v.version)).toEqual([1, 2]);
  });

  it.each([
    ["프리셋 밖 모션 L3(생성 상한 밖)", { motion: "L3" }],
    ["알 수 없는 키", { speed: "fast" }],
    ["hex가 아닌 보정값", { corrections: [{ ...MUTED_FIX, to: "brown" }] }],
    ["같은 역할 보정 2개", { corrections: [MUTED_FIX, { ...MUTED_FIX, to: "#8A6D57" }] }],
    ["보정 from이 최신 base 값과 다름", { corrections: [{ ...MUTED_FIX, from: "#123456" }] }],
    ["최신과 같은 조정(빈 보정 배열 = 없음)", { corrections: [] }],
  ])("SCHEMA_INVALID — %s · 새 버전 0", async (_label, adjustments) => {
    const { board, profiles, versionsOf } = setup();
    await board.confirmProfile(1, 0);
    const error = await errorOf(profiles.saveAdjustments("profile-1", 1, adjustments as ProfileAdjustments));
    expect(error?.code).toBe("SCHEMA_INVALID");
    expect((await versionsOf()).map((v) => v.version)).toEqual([1]);
  });

  it("없는 프로필은 NOT_FOUND", async () => {
    const { profiles } = setup();
    expect((await errorOf(profiles.saveAdjustments("profile-1", 0, { density: "compact" })))?.code).toBe("NOT_FOUND");
  });

  it("P-AC-41 원자성: 같은 expectedLatest로 조정 저장 2개를 동시에(응답 지연) → 1개 성공 · 1개 STALE_PROFILE, 번호 중복 0", async () => {
    const gate = deferred<void>();
    const { board, profiles, versionsOf } = setup({ delay: (call) => (call.method === "saveAdjustments" && call.phase === "response" ? gate.promise : undefined) });
    await board.confirmProfile(1, 0);
    const both = Promise.allSettled([profiles.saveAdjustments("profile-1", 1, { density: "compact" }), profiles.saveAdjustments("profile-1", 1, { motion: "L0" })]);
    gate.resolve();
    const [first, second] = await both;
    expect(first.status).toBe("fulfilled");
    expect(second.status === "rejected" && (second.reason as ProfileError).code).toBe("STALE_PROFILE");
    expect((await versionsOf()).map((v) => v.version)).toEqual([1, 2]);
  });

  it("요청 단계 실패 주입 → 새 버전 0", async () => {
    const { board, profiles, versionsOf } = setup({ fail: (call) => (call.method === "saveAdjustments" ? new Error("네트워크") : undefined) });
    await board.confirmProfile(1, 0);
    await expect(profiles.saveAdjustments("profile-1", 1, { density: "compact" })).rejects.toThrow("네트워크");
    expect((await versionsOf()).map((v) => v.version)).toEqual([1]);
  });
});

describe("Q1 조정 저장 멱등 — 키 = (profileId, expectedLatest, 정규화한 조정) 별도 기록 (6.3 r3 계약)", () => {
  /** saveAdjustments 첫 호출의 응답 단계에서 거부 — 커밋은 끝났고 호출자만 실패를 본다 */
  const dropFirstResponse = (call: ProfileCall) =>
    call.method === "saveAdjustments" && call.phase === "response" && call.seq === 1 ? Promise.reject(new Error("응답 끊김")) : undefined;

  it("I-1: 커밋 뒤 응답 실패 → 같은 인자로 다시 저장하면 STALE 없이 같은 버전, 새 버전 0 (정규화가 같으면 같은 키)", async () => {
    const { board, profiles, versionsOf } = setup({ delay: dropFirstResponse });
    await board.confirmProfile(1, 0);
    expect(await errorOf(profiles.saveAdjustments("profile-1", 1, { motion: "L0", density: "compact" }))).toMatchObject({ message: "응답 끊김" });
    expect((await versionsOf()).map((v) => v.version)).toEqual([1, 2]);
    const retry = await profiles.saveAdjustments("profile-1", 1, { density: "compact", motion: "L0", corrections: [] });
    expect(retry).toMatchObject({ profileId: "profile-1", version: 2, origin: "adjust", adjustments: { density: "compact", motion: "L0" } });
    expect(retry).toEqual((await versionsOf())[1]);
    expect((await versionsOf()).map((v) => v.version)).toEqual([1, 2]);
  });

  it("I-2: 같은 expectedLatest라도 다른 조정이면 멱등 결과가 아니라 기존 판정 STALE_PROFILE(최신 동봉) · 모르는 키를 붙인 재시도는 SCHEMA_INVALID", async () => {
    const { board, profiles, versionsOf } = setup({ delay: dropFirstResponse });
    await board.confirmProfile(1, 0);
    await errorOf(profiles.saveAdjustments("profile-1", 1, { density: "compact" }));
    const other = await errorOf(profiles.saveAdjustments("profile-1", 1, { motion: "L0" }));
    expect(other?.code).toBe("STALE_PROFILE");
    expect(other?.series?.latestVersion).toBe(2);
    expect((await errorOf(profiles.saveAdjustments("profile-1", 1, { density: "compact", speed: "fast" } as ProfileAdjustments)))?.code).toBe("SCHEMA_INVALID");
    expect((await errorOf(profiles.saveAdjustments("profile-1", 2, { density: "compact" })))?.code).toBe("SCHEMA_INVALID");
    expect((await versionsOf()).map((v) => v.version)).toEqual([1, 2]);
  });

  it("I-3: 커밋 단계 실패 → 버전·멱등 기록 모두 롤백, 주입을 끄고 같은 인자로 다시 저장하면 성공(번호 건너뜀 0)", async () => {
    let failing = true;
    const { store, board, profiles, versionsOf } = setup({ fail: (call) => (failing && call.method === "saveAdjustments" && call.phase === "commit" ? new Error("커밋 실패") : undefined) });
    await board.confirmProfile(1, 0);
    expect(await errorOf(profiles.saveAdjustments("profile-1", 1, { density: "compact" }))).toMatchObject({ message: "커밋 실패" });
    expect((await versionsOf()).map((v) => v.version)).toEqual([1]);
    expect(store.adjustCommitOf("profile-1")).toBeUndefined();
    failing = false;
    expect(await profiles.saveAdjustments("profile-1", 1, { density: "compact" })).toMatchObject({ version: 2, adjustments: { density: "compact" } });
    expect((await versionsOf()).map((v) => v.version)).toEqual([1, 2]);
  });

  it("보드 확정 commits 슬롯을 쓰지 않는다(A-Q4) — 조정 저장 뒤에도 보드 확정의 같은 키 재시도는 커밋된 결과", async () => {
    const { store, board, profiles } = setup();
    await board.confirmProfile(1, 0);
    const boardCommit = store.commitOf("profile-1");
    await profiles.saveAdjustments("profile-1", 1, { density: "compact" });
    expect(store.commitOf("profile-1")).toBe(boardCommit);
    expect(store.adjustCommitOf("profile-1")).toMatchObject({ profileId: "profile-1", version: 2 });
    expect(await board.confirmProfile(1, 0)).toEqual({ profileId: "profile-1", version: 1 });
  });
});

describe("보드 재확정 이어받기 — 저장소 confirmInto (6.1-3)", () => {
  it("P-AC-20: 조정 있는 v2 뒤 팔레트를 바꿔 재확정 → v3 base = 보드 초안, 밀도는 이어받고 팔레트가 바뀐 역할의 보정은 빠짐(dropped 기록)", async () => {
    const { board, profiles, reconfirm, versionsOf } = setup();
    await board.confirmProfile(1, 0);
    await profiles.saveAdjustments("profile-1", 1, { density: "compact", corrections: [MUTED_FIX] });
    const v3 = await reconfirm({ hero: "ref-a", palette: "ref-c" });
    expect(v3).toMatchObject({ version: 3, origin: "board-reconfirm", adjustments: { density: "compact" } });
    expect(v3.adjustments.corrections).toBeUndefined();
    expect(v3.dropped).toEqual([{ key: "correction", role: "muted", reason: "palette-changed" }]);
    expect(v3.base.color_tokens.muted.$value).toBe("#6B8CC7");
    const effective = effectiveProfile(v3.base, v3.adjustments);
    expect(effective.color_tokens.muted.$value).toBe("#6B8CC7");
    expect(effective.spacing_tokens.sectionGap).toBe(72);
    expect((await versionsOf()).map((v) => v.version)).toEqual([1, 2, 3]);
  });

  it("P-AC-38: v2 = 밀도 촘촘 + 모션 덮어쓰기 → 보드에서 모션을 바꿔 재확정 → v3 적용된 모션 = 보드 값, motion 조정 없음, 밀도 촘촘 유지(96 → 72)", async () => {
    const { board, profiles, reconfirm } = setup();
    await board.confirmProfile(1, 0);
    const v2 = await profiles.saveAdjustments("profile-1", 1, { density: "compact", motion: "L0" });
    const v3 = await reconfirm({ hero: "ref-a", motion: "ref-b" });
    expect(v3.base.motion_preset).not.toBe(v2.base.motion_preset);
    expect(v3.adjustments).toEqual({ density: "compact" });
    expect(v3.dropped).toEqual([{ key: "motion", reason: "board-changed" }]);
    const effective = effectiveProfile(v3.base, v3.adjustments);
    expect(effective.motion_preset).toBe(v3.base.motion_preset);
    expect(effective.spacing_tokens.sectionGap).toBe(72);
  });

  it("P-AC-39 ① 저장값 = carryOverAdjustments(확정 버전 base, 최신 adjustments, 새 base) · ② 겹치지 않는 필드(Hero)만 바꾸면 조정 전부 이어받음, dropped 없음", async () => {
    const { board, profiles, reconfirm, versionsOf } = setup();
    await board.confirmProfile(1, 0);
    const v2 = await profiles.saveAdjustments("profile-1", 1, { density: "compact", motion: "L0", contrast: "enhanced", purpose: "booking", corrections: [MUTED_FIX] });
    const v3 = await reconfirm({ hero: "ref-c", palette: "ref-a", motion: "ref-a" });
    const [v1] = await versionsOf();
    expect(v3.adjustments).toEqual(carryOverAdjustments(v1!.base, v2.adjustments, v3.base).adjustments);
    expect(v3.adjustments).toEqual(v2.adjustments);
    expect(v3.dropped).toBeUndefined();
  });

  it("P-AC-39 ③: ref-b 팔레트 + 밝은 카드에서 ink 보정 #7E622F 저장 → 어두운 카드로 재확정하면 보정이 지워짐(new-contrast-failure)", async () => {
    const { board, profiles, reconfirm } = setup({ picks: { hero: "ref-a", palette: "ref-b", card: "ref-a" } });
    await board.confirmProfile(1, 0);
    await profiles.saveAdjustments("profile-1", 1, { corrections: [INK_FIX] });
    const v3 = await reconfirm({ hero: "ref-a", palette: "ref-b", card: "ref-b" });
    expect(v3.base.component_choices.card_style?.surfaceTone).toBe("dark");
    expect(v3.adjustments).toEqual({});
    expect(v3.dropped).toEqual([{ key: "correction", role: "ink", reason: "new-contrast-failure" }]);
    expect(effectiveProfile(v3.base, v3.adjustments).color_tokens.ink.$value).toBe("#C9A96E");
  });

  it("P-AC-39 ⑥ 되돌리기 뒤 재확정: v1 확정 → v2 모션 덮어쓰기 → v3 보드 모션 변경(지움) → v4 v2로 되돌리기 → Hero만 바꿔 재확정 → 기준은 v3 base라 모션 조정 이어짐, v5 적용 모션 = v4", async () => {
    const { board, profiles, reconfirm, versionsOf } = setup();
    await board.confirmProfile(1, 0);
    await profiles.saveAdjustments("profile-1", 1, { motion: "L0" });
    const v3 = await reconfirm({ hero: "ref-a", motion: "ref-b" });
    expect(v3.adjustments).toEqual({});
    const v4 = await profiles.revertTo("profile-1", 2, 3);
    expect(v4.adjustments).toEqual({ motion: "L0" });
    const v5 = await reconfirm({ hero: "ref-c", motion: "ref-b" });
    expect(v5.version).toBe(5);
    expect(v5.adjustments).toEqual({ motion: "L0" });
    expect(v5.dropped).toBeUndefined();
    expect(effectiveProfile(v5.base, v5.adjustments).motion_preset).toBe(effectiveProfile(v4.base, v4.adjustments).motion_preset);
    expect((await versionsOf()).map((v) => [v.version, v.origin])).toEqual([[1, "board"], [2, "adjust"], [3, "board-reconfirm"], [4, "revert"], [5, "board-reconfirm"]]);
  });

  it("보드가 읽는 ConfirmedRef.latest는 조정 저장 뒤 최신 adjustments, confirmedBase는 확정 버전 base", async () => {
    const { board, profiles, versionsOf } = setup();
    await board.confirmProfile(1, 0);
    await profiles.saveAdjustments("profile-1", 1, { density: "compact" });
    const { board: loaded } = await board.getBoard();
    const [v1] = await versionsOf();
    expect(loaded.confirmed).toMatchObject({ version: 1, latestVersion: 2, latest: { version: 2, adjustments: { density: "compact" } }, confirmedBase: v1!.base });
  });

  it("Codex P2: 규칙을 받지 않은 채 동기 구간에서 조정이 보이면(요청 지연 중 끼어든 조정 저장) STALE_PROFILE(최신 동봉) — 다시 확정하면 이어받는다", async () => {
    const gate = deferred<void>();
    let hold = false;
    const store = createStudioStore();
    const delay = (call: BoardCall) => (hold && call.method === "createProfileVersion" && call.phase === "request" ? gate.promise : undefined);
    const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, now: NOW, initialBoard: boardOf(IDS, { hero: "ref-a" }), store, delay });
    const profiles = createMemoryProfileRepository({ store, now: NOW });
    await board.confirmProfile(1, 0);
    const saved = await board.savePicks({ hero: "ref-c" }, {}, 1);
    hold = true;
    // 호출자가 곧 생길 v2를 기대 최신으로 보낸다 — 규칙 준비 시점엔 v1(조정 없음)이라 받지 않는다
    const racing = board.createProfileVersion("profile-1", saved.revision, 2).catch((error: unknown) => error);
    await profiles.saveAdjustments("profile-1", 1, { density: "compact" });
    gate.resolve();
    const error = await racing;
    expect(error).toBeInstanceOf(CompareBoardError);
    expect((error as CompareBoardError).code).toBe("STALE_PROFILE");
    expect((error as CompareBoardError).profileHead?.version).toBe(2);
    hold = false;
    const retried = await board.createProfileVersion("profile-1", saved.revision, 2);
    expect(retried.version).toBe(3);
    expect((await profiles.getProfile("profile-1"))!.versions.at(-1)!.adjustments).toEqual({ density: "compact" });
  });
});
