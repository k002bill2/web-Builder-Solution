/**
 * DS-2A-04 2a-04b2 프로필 화면 전역 조정 — P-AC-12~20(화면) · 08 유지 · 33 · 37 · Q2 이름표 · Q5 제목·배치.
 * 보드·프로필 메모리 저장소는 store 하나. P-S13은 좁은 범위(range)를 주입한 프로필 저장소로 렌더하고,
 * 범위 밖 값은 같은 store에 붙은 기본 범위 저장소로 먼저 저장한다(좁은 범위 저장소는 그 값을 거부하므로).
 */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { createMemoryCompareBoardRepository } from "../data/memoryCompareBoardRepository";
import { createMemoryProfileRepository, type ProfileCall } from "../data/memoryProfileRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { createStudioStore } from "../data/studioStore";
import type { AdjustmentRange, ProfileSeries } from "../domain/profile";
import { proposeCorrections } from "../domain/profileContrast";
import { PROFILE_EVENT, type ProfileEvent } from "../features/profile/profileEvents";
import { referenceComparisonAttributes } from "../fixtures/referenceComparisons";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";

const NARROW: AdjustmentRange = { density: ["comfortable"], contrast: ["aa", "enhanced"], motion: ["L0", "L1", "L2"], source: "테스트 무드" };

interface Options {
  readonly columns?: readonly string[];
  readonly hero?: string;
  /** 렌더에 쓰는 프로필 저장소의 범위 */
  readonly range?: AdjustmentRange;
  readonly delay?: (call: ProfileCall) => Promise<void> | undefined;
  readonly fail?: (call: ProfileCall) => Error | undefined;
  /** 렌더 전 쓰기 — 기본 범위 저장소(wide)·보드로 */
  readonly before?: (s: Studio) => Promise<unknown>;
}

type Studio = Awaited<ReturnType<typeof setup>>;

async function setup(options: Options = {}) {
  const store = createStudioStore();
  const columns = options.columns ?? ["ref-a", "ref-b", "ref-c"];
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(columns, { hero: options.hero ?? columns[0]! }), store });
  const wide = createMemoryProfileRepository({ store });
  const profiles = createMemoryProfileRepository({
    store,
    ...(options.range && { range: options.range }),
    ...(options.delay && { delay: options.delay }),
    ...(options.fail && { fail: options.fail }),
  });
  await board.confirmProfile(1, 0);
  return { board, wide, profiles };
}

async function openProfile(path = "/profile/profile-1", options: Options = {}) {
  const studio = await setup(options);
  await options.before?.(studio);
  const view = renderApp(path, createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures), studio.board, studio.profiles);
  await screen.findByRole("heading", { level: 1, name: "디자인 프로필" });
  return { ...view, studio };
}

const group = (name: string) => screen.getByRole("radiogroup", { name });
const radio = (groupName: string, name: string) => within(group(groupName)).getByRole("radio", { name });
const saveButton = () => screen.getByRole("button", { name: /^조정 저장 \(v\d+\)$|^저장 중…$/ });
const series = async (s: Studio): Promise<ProfileSeries> => (await s.wide.getProfile("profile-1"))!;
const events: ProfileEvent[] = [];
const listen = (e: Event) => events.push((e as CustomEvent<ProfileEvent>).detail);
const enhanced = (id: string, role: string) =>
  proposeCorrections(referenceDetailFixtures[id]!.palette, referenceComparisonAttributes[id]!.card.surfaceTone, "enhanced").find((p) => p.role === role)!.to;
const aa = (id: string, role: string) =>
  proposeCorrections(referenceDetailFixtures[id]!.palette, referenceComparisonAttributes[id]!.card.surfaceTone, "aa").find((p) => p.role === role)!.to;

afterEach(() => {
  window.removeEventListener(PROFILE_EVENT, listen);
  events.length = 0;
});

describe("P-AC-12 조정 4그룹 = 라디오 그룹 (Q2)", () => {
  it("h2 '전역 조정' 아래 밀도·대비·모션·사이트 목적 radiogroup, 보이는 글자가 값, 그룹당 Tab 정지 1", async () => {
    await openProfile();
    const region = screen.getByRole("region", { name: "전역 조정" });
    expect(within(region).getByRole("heading", { level: 2, name: "전역 조정" })).toBeInTheDocument();
    const names = within(region).getAllByRole("radiogroup").map((g) => g.getAttribute("aria-label"));
    expect(names).toEqual(["밀도", "대비", "모션", "사이트 목적"]);
    expect(within(group("밀도")).getAllByRole("radio").map((r) => r.textContent)).toEqual(["여유", "촘촘"]);
    expect(within(group("대비")).getAllByRole("radio").map((r) => r.textContent)).toEqual(["기본 AA", "강화"]);
    expect(within(group("모션")).getAllByRole("radio").map((r) => r.textContent)).toEqual(["L0 없음", "L1 낮음", "L2 중간"]);
    expect(within(group("사이트 목적")).getAllByRole("radio").map((r) => r.textContent)).toEqual(["예약", "문의", "판매", "정하지 않음"]);
    for (const name of names) expect(within(group(name!)).getAllByRole("radio").filter((r) => r.tabIndex === 0)).toHaveLength(1);
    expect(radio("밀도", "여유")).toHaveAttribute("aria-checked", "true");
    expect(radio("대비", "기본 AA")).toHaveAttribute("aria-checked", "true");
    expect(radio("사이트 목적", "정하지 않음")).toHaveAttribute("aria-checked", "true");
  });

  it("방향키·Home/End로 이동하며 고른다", async () => {
    await openProfile();
    radio("사이트 목적", "정하지 않음").focus();
    await userEvent.keyboard("{Home}");
    expect(radio("사이트 목적", "예약")).toHaveFocus();
    expect(radio("사이트 목적", "예약")).toHaveAttribute("aria-checked", "true");
    await userEvent.keyboard("{ArrowRight}");
    expect(radio("사이트 목적", "문의")).toHaveAttribute("aria-checked", "true");
    await userEvent.keyboard("{End}");
    expect(radio("사이트 목적", "정하지 않음")).toHaveAttribute("aria-checked", "true");
  });
});

describe("P-AC-13 범위 (P-S13 · 모션 L3)", () => {
  it("모션 L3 옵션 없음 + 캡션 '높음(L3)은 생성 상한 밖이라 고를 수 없습니다'(그룹 설명)", async () => {
    await openProfile();
    expect(within(group("모션")).queryByRole("radio", { name: /L3/ })).not.toBeInTheDocument();
    expect(group("모션")).toHaveAccessibleDescription(/높음\(L3\)은 생성 상한 밖이라 고를 수 없습니다/);
  });

  it("좁은 range 주입 → 범위 밖 옵션 aria-disabled + 그룹 설명 '촘촘: 이 테마에서 쓸 수 없음', roving에서 건너뜀", async () => {
    await openProfile(undefined, { range: NARROW });
    expect(radio("밀도", "촘촘")).toHaveAttribute("aria-disabled", "true");
    expect(group("밀도")).toHaveAccessibleDescription(/촘촘: 이 테마에서 쓸 수 없음/);
    radio("밀도", "여유").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(radio("밀도", "여유")).toHaveFocus();
    expect(radio("밀도", "여유")).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByText(/저장하지 않은 조정/)).not.toBeInTheDocument();
  });

  it("이어받은 값이 범위 밖 → 그 그룹에 Callout(cautionary = warning 톤) + '맞추기' → 저장 안 된 조정, 그 전에는 저장 aria-disabled + 이유", async () => {
    const { studio } = await openProfile(undefined, { range: NARROW, before: (s) => s.wide.saveAdjustments("profile-1", 1, { density: "compact" }) });
    const callout = screen.getByText("지금 값 '촘촘'은 허용 범위 밖이라 저장할 수 없습니다").closest("[data-tone]")!;
    expect(callout).toHaveAttribute("data-tone", "warning");
    expect(radio("밀도", "촘촘")).toHaveAttribute("aria-checked", "true");
    await userEvent.click(radio("대비", "강화"));
    expect(saveButton()).toHaveAttribute("aria-disabled", "true");
    expect(saveButton()).toHaveAccessibleDescription(/허용 범위 밖 값이 있어 저장할 수 없습니다/);
    await userEvent.click(within(callout as HTMLElement).getByRole("button", { name: "'여유'로 맞추기" }));
    expect(radio("밀도", "여유")).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByText("지금 값 '촘촘'은 허용 범위 밖이라 저장할 수 없습니다")).not.toBeInTheDocument();
    expect(screen.getByText("저장하지 않은 조정 2개")).toBeInTheDocument();
    await userEvent.click(saveButton());
    expect(await screen.findByRole("status", { name: "프로필 알림" })).toHaveTextContent("v3으로 저장했습니다");
    expect((await series(studio)).versions.at(-1)!.adjustments).toEqual({ contrast: "enhanced" });
  });
});

describe("P-AC-14 저장하지 않은 조정 (P-S10)", () => {
  it("바꾸면 '저장하지 않은 조정 N개' + '조정 저장 (v2)' 활성, 취소하면 원래 값 · 캡션 없음 · 포커스는 저장 버튼", async () => {
    await openProfile();
    expect(saveButton()).toHaveAttribute("aria-disabled", "true");
    expect(saveButton()).toHaveAccessibleDescription("바꾼 조정이 없습니다");
    await userEvent.click(radio("밀도", "촘촘"));
    await userEvent.click(radio("사이트 목적", "예약"));
    expect(screen.getByText("저장하지 않은 조정 2개")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "조정 저장 (v2)" })).not.toHaveAttribute("aria-disabled");
    // 고른 값을 다시 원래 값으로 → 개수에서 빠진다
    await userEvent.click(radio("사이트 목적", "정하지 않음"));
    expect(screen.getByText("저장하지 않은 조정 1개")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "조정 취소" }));
    expect(radio("밀도", "여유")).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByText(/저장하지 않은 조정/)).not.toBeInTheDocument();
    expect(saveButton()).toHaveFocus();
  });
});

describe("P-AC-15 조정 저장 (P-S11 저장됨) · P-AC-37 계측", () => {
  it("밀도 촘촘 + 모션 덮어쓰기 저장 → v2(origin adjust) · 간격 96 → 72 · 캡션 '조정됨 · 보드 값 …' · 알림 'v2로 저장했습니다' · profile_saved 1회", async () => {
    window.addEventListener(PROFILE_EVENT, listen);
    const { studio } = await openProfile();
    const base = (await series(studio)).versions[0]!.base;
    const other = (["L0", "L1", "L2"] as const).find((m) => m !== base.motion_preset)!;
    const labels = { L0: "L0 없음", L1: "L1 낮음", L2: "L2 중간" } as const;
    await userEvent.click(radio("밀도", "촘촘"));
    await userEvent.click(radio("모션", labels[other]));
    await userEvent.click(screen.getByRole("button", { name: "조정 저장 (v2)" }));
    expect(await screen.findByRole("status", { name: "프로필 알림" })).toHaveTextContent("v2로 저장했습니다");
    const v2 = (await series(studio)).versions.at(-1)!;
    expect(v2).toMatchObject({ version: 2, origin: "adjust", adjustments: { density: "compact", motion: other } });
    const values = screen.getByRole("region", { name: "프로필 값" });
    expect(within(values).getByText(`그리드 ${base.spacing_tokens.grid} · 섹션 간격 72`)).toBeInTheDocument();
    expect(base.spacing_tokens.sectionGap).toBe(96);
    expect(within(values).getByText("조정됨 · 보드 값 96")).toBeInTheDocument();
    expect(within(values).getByText(labels[other])).toBeInTheDocument();
    expect(within(values).getByText(`조정됨 · 보드 값 ${base.motion_preset}`)).toBeInTheDocument();
    expect(screen.getByText("v2 · 현재")).toBeInTheDocument();
    expect(screen.queryByText(/저장하지 않은 조정/)).not.toBeInTheDocument();
    expect(saveButton()).toHaveTextContent("조정 저장 (v3)");
    expect(events).toEqual([{ name: "profile_saved", version: 2, origin: "adjust" }]);
    // 버전 줄 요약 = 적용된 값 차이
    expect(within(screen.getByRole("listitem", { name: /^v2 조정/ })).getByText(/간격 · 모션/)).toBeInTheDocument();
  });
});

describe("P-AC-16 저장 중 연타 · 실패 (P-S11) · P-AC-37 실패 계측", () => {
  it("저장 중 연타해도 요청 1회(aria-busy '저장 중…')", async () => {
    let release = () => {};
    let calls = 0;
    await openProfile(undefined, {
      delay: (call) => {
        if (call.method !== "saveAdjustments" || call.phase !== "request") return undefined;
        calls += 1;
        return new Promise<void>((resolve) => (release = resolve));
      },
    });
    await userEvent.click(radio("밀도", "촘촘"));
    await userEvent.click(saveButton());
    expect(saveButton()).toHaveTextContent("저장 중…");
    expect(saveButton()).toHaveAttribute("aria-busy", "true");
    await userEvent.click(saveButton());
    await userEvent.click(saveButton());
    release();
    expect(await screen.findByRole("status", { name: "프로필 알림" })).toHaveTextContent("v2로 저장했습니다");
    expect(calls).toBe(1);
  });

  it("요청 실패 → role=alert '저장하지 못했습니다 · 다시 시도하세요' + 조정 유지 · profile_save_failed 1회 → '다시 시도' → v2", async () => {
    window.addEventListener(PROFILE_EVENT, listen);
    await openProfile(undefined, { fail: (call) => (call.method === "saveAdjustments" && call.seq === 1 && call.phase === "request" ? new Error("network") : undefined) });
    await userEvent.click(radio("밀도", "촘촘"));
    await userEvent.click(saveButton());
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("저장하지 못했습니다 · 다시 시도하세요");
    expect(radio("밀도", "촘촘")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("저장하지 않은 조정 1개")).toBeInTheDocument();
    expect(events).toEqual([{ name: "profile_save_failed", reason: "UNKNOWN" }]);
    await userEvent.click(within(alert).getByRole("button", { name: "다시 시도" }));
    expect(await screen.findByRole("status", { name: "프로필 알림" })).toHaveTextContent("v2로 저장했습니다");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(events).toEqual([{ name: "profile_save_failed", reason: "UNKNOWN" }, { name: "profile_saved", version: 2, origin: "adjust" }]);
  });

  it("응답 실패(커밋 뒤) → 같은 인자 재시도는 멱등 결과 'v2로 저장했습니다', 버전 +1만, STALE 문장 0", async () => {
    const { studio } = await openProfile(undefined, {
      delay: (call) => (call.method === "saveAdjustments" && call.seq === 1 && call.phase === "response" ? Promise.reject(new Error("응답 유실")) : undefined),
    });
    await userEvent.click(radio("밀도", "촘촘"));
    await userEvent.click(saveButton());
    expect(await screen.findByRole("alert")).toHaveTextContent("저장하지 못했습니다");
    expect((await series(studio)).versions).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(await screen.findByRole("status", { name: "프로필 알림" })).toHaveTextContent("v2로 저장했습니다");
    expect((await series(studio)).versions).toHaveLength(2);
    expect(screen.queryByText(/다른 곳에서/)).not.toBeInTheDocument();
  });
});

describe("P-AC-17 STALE_PROFILE (P-S12 조정 저장)", () => {
  it("화면이 v1을 본 뒤 다른 탭이 v2를 만들면 저장 거부 → 최신 반영('조정 저장 (v3)') + 조정 유지 + 문장 → 다시 저장하면 v3", async () => {
    const { studio } = await openProfile();
    await studio.wide.saveAdjustments("profile-1", 1, { purpose: "booking" });
    await userEvent.click(radio("밀도", "촘촘"));
    await userEvent.click(screen.getByRole("button", { name: "조정 저장 (v2)" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("다른 곳에서 v2가 만들어졌습니다. 조정은 남겨 두었습니다 — 확인 후 다시 저장하세요");
    expect(screen.getByRole("button", { name: "조정 저장 (v3)" })).toBeInTheDocument();
    expect(radio("밀도", "촘촘")).toHaveAttribute("aria-checked", "true");
    expect(radio("사이트 목적", "예약")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("v2 · 현재")).toBeInTheDocument();
    expect((await series(studio)).versions).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "조정 저장 (v3)" }));
    expect(await screen.findByRole("status", { name: "프로필 알림" })).toHaveTextContent("v3으로 저장했습니다");
    expect((await series(studio)).versions.at(-1)!.adjustments).toEqual({ density: "compact", purpose: "booking" });
  });
});

describe("P-AC-18 보정값 쓰기 (Q6 · P-S14)", () => {
  it("ref-a muted '보정값 쓰기' → 저장 안 된 조정 1개 → 저장하면 적용된 팔레트 = 보정값, C-5 '통과'", async () => {
    const { studio } = await openProfile();
    const palette = screen.getByRole("region", { name: "역할 팔레트와 대비" });
    const write = within(palette).getByRole("button", { name: "보정값 쓰기 (보조 글자 muted)" });
    await userEvent.click(write);
    expect(write).toHaveFocus();
    expect(write).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("저장하지 않은 조정 1개")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "조정 저장 (v2)" }));
    expect(await screen.findByRole("status", { name: "프로필 알림" })).toHaveTextContent("v2로 저장했습니다");
    const to = aa("ref-a", "muted");
    expect((await series(studio)).versions.at(-1)!.adjustments.corrections).toEqual([{ role: "muted", from: expect.stringMatching(/^#/), to, check: "C-5" }]);
    const swatches = within(palette).getByRole("list", { name: "역할 팔레트" });
    expect(within(swatches).getByText(to)).toBeInTheDocument();
    expect(within(swatches).getByText(/^조정됨 · 보드 값 #/)).toBeInTheDocument();
    expect(within(within(palette).getByRole("list", { name: "대비 검사" })).getByText(/^C-5/).closest("li")).toHaveTextContent("통과");
    expect(within(palette).queryByRole("button", { name: /보정값 쓰기/ })).not.toBeInTheDocument();
  });

  it("ref-b(어두운 카드): ink는 충돌이라 버튼 없음(P-S15) · muted만 '보정값 쓰기'", async () => {
    await openProfile(undefined, { hero: "ref-b", columns: ["ref-b", "ref-a"] });
    const palette = screen.getByRole("region", { name: "역할 팔레트와 대비" });
    expect(within(palette).queryByRole("button", { name: /본문 글자 ink/ })).not.toBeInTheDocument();
    expect(within(palette).getByRole("link", { name: "비교 보드에서 카드 바꾸기" })).toBeInTheDocument();
    expect(within(palette).getByRole("button", { name: "보정값 쓰기 (보조 글자 muted)" })).toBeInTheDocument();
  });
});

describe("P-AC-19 대비 강화 → 목표 7.0 · 강화 열 제안", () => {
  it("ref-a: 강화를 고르면 목표 7.0:1, primary·muted 제안 = 강화 열, 보정값 쓰기 + 저장 → 두 검사 통과", async () => {
    const { studio } = await openProfile();
    await userEvent.click(radio("대비", "강화"));
    const palette = screen.getByRole("region", { name: "역할 팔레트와 대비" });
    expect(within(palette).getByText("대비 검사 · 목표 7.0:1")).toBeInTheDocument();
    expect(within(palette).getByText(new RegExp(`대체안: ${enhanced("ref-a", "primary")}\\(7\\.0:1`))).toBeInTheDocument();
    expect(within(palette).getByText(new RegExp(`대체안: ${enhanced("ref-a", "muted")}\\(7\\.0:1`))).toBeInTheDocument();
    await userEvent.click(within(palette).getByRole("button", { name: "보정값 쓰기 (대표색 primary)" }));
    await userEvent.click(within(palette).getByRole("button", { name: "보정값 쓰기 (보조 글자 muted)" }));
    expect(screen.getByText("저장하지 않은 조정 3개")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "조정 저장 (v2)" }));
    expect(await screen.findByRole("status", { name: "프로필 알림" })).toHaveTextContent("v2로 저장했습니다");
    const saved = (await series(studio)).versions.at(-1)!.adjustments;
    expect(saved.contrast).toBe("enhanced");
    expect(saved.corrections?.map((c) => [c.role, c.to])).toEqual([["primary", enhanced("ref-a", "primary")], ["muted", enhanced("ref-a", "muted")]]);
    const checks = within(palette).getByRole("list", { name: "대비 검사" });
    expect(within(checks).getAllByRole("listitem").every((li) => li.textContent?.includes("통과"))).toBe(true);
  });

  it("ref-e: 강화면 ink 제안 = 강화 열", async () => {
    await openProfile(undefined, { hero: "ref-e", columns: ["ref-e", "ref-a"] });
    await userEvent.click(radio("대비", "강화"));
    expect(screen.getByText(new RegExp(`대체안: ${enhanced("ref-e", "ink")}\\(7\\.0:1`))).toBeInTheDocument();
  });
});

describe("P-AC-20 (화면) 이어받은 조정 · P-S13 · 버전 요약", () => {
  it("v2 조정(촘촘) 뒤 보드에서 Hero를 바꿔 재확정 → v3에 촘촘 이어짐, 좁은 범위면 P-S13 Callout", async () => {
    await openProfile(undefined, {
      range: NARROW,
      before: async (s) => {
        await s.wide.saveAdjustments("profile-1", 1, { density: "compact" });
        const { board } = await s.board.getBoard();
        const changed = await s.board.savePicks({ ...board.picks, hero: "ref-b" }, board.custom, board.revision);
        await s.board.createProfileVersion("profile-1", changed.revision, 2);
      },
    });
    expect(screen.getByText("v3 · 현재")).toBeInTheDocument();
    expect(radio("밀도", "촘촘")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("지금 값 '촘촘'은 허용 범위 밖이라 저장할 수 없습니다")).toBeInTheDocument();
    expect(within(screen.getByRole("listitem", { name: /^v2 조정/ })).getByText(/간격/)).toBeInTheDocument();
    // 재확정 요약은 적용된 값 차이(보드에서 바꾼 필드) — 이어받은 밀도는 차이가 아니다
    expect(screen.getByRole("listitem", { name: /^v3 보드 재확정/ })).not.toHaveTextContent(/바뀐 값 없음|간격/);
  });
});

describe("P-AC-08 유지 — 이전 버전 보기(P-S07)에서 조정 컨트롤 aria-disabled + 이유", () => {
  it("?v=1 → 4그룹 aria-disabled, 이유 '이전 버전은 바꿀 수 없습니다'(그룹 설명), 눌러도 바뀌지 않음, 보정값 쓰기도 aria-disabled", async () => {
    await openProfile("/profile/profile-1?v=1", { before: (s) => s.wide.saveAdjustments("profile-1", 1, { density: "compact" }) });
    expect(screen.getByText("v1을 보고 있습니다 · 현재 v2")).toBeInTheDocument();
    for (const name of ["밀도", "대비", "모션", "사이트 목적"]) {
      expect(group(name)).toHaveAttribute("aria-disabled", "true");
      expect(group(name)).toHaveAccessibleDescription(/이전 버전은 바꿀 수 없습니다/);
    }
    expect(radio("밀도", "여유")).toHaveAttribute("aria-checked", "true");
    await userEvent.click(radio("밀도", "촘촘"));
    expect(radio("밀도", "여유")).toHaveAttribute("aria-checked", "true");
    expect(saveButton()).toHaveAttribute("aria-disabled", "true");
    const write = screen.getByRole("button", { name: "보정값 쓰기 (보조 글자 muted)" });
    expect(write).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(write);
    expect(screen.queryByText(/저장하지 않은 조정/)).not.toBeInTheDocument();
  });
});

describe("Q2 이름표 (M-06) · Q5 제목·배치 · P-AC-33", () => {
  it("CTA 위치·카드 스타일·이미지 비율·모바일 구조 = 요소 라이브러리 이름표, 키는 캡션", async () => {
    await openProfile();
    const values = screen.getByRole("region", { name: "프로필 값" });
    const dd = (label: string) => within(values).getByText(label, { selector: "dt" }).nextElementSibling as HTMLElement;
    expect(dd("CTA 위치")).toHaveTextContent("히어로 좌측 하단");
    expect(within(dd("CTA 위치")).getByText("hero-inline")).toBeInTheDocument();
    expect(dd("카드 스타일")).toHaveTextContent(/^보더 카드 · 모서리 큼 · 밝은 카드/);
    expect(within(dd("카드 스타일")).getByText("bordered-lg")).toBeInTheDocument();
    expect(dd("이미지 비율")).toHaveTextContent(/^가로형 16:9/);
    expect(within(dd("이미지 비율")).getByText("16:9")).toBeInTheDocument();
    expect(dd("모바일 구조")).toHaveTextContent("단일 컬럼 · 하단 CTA");
    expect(within(dd("모바일 구조")).getByText("single-column-bottom-cta")).toBeInTheDocument();
  });

  it("1280 2단(프로필 패널 + 3안 자리) · 1024 패널 안 2열 · DOM 순서 = 값 → 팔레트 → 조정 → 버전 → 3안, disabled 속성 0", async () => {
    await openProfile();
    const regions = ["프로필 값", "역할 팔레트와 대비", "전역 조정", "버전", "3안"].map((name) => screen.getByRole("region", { name }));
    for (let i = 1; i < regions.length; i += 1) expect(regions[i - 1]!.compareDocumentPosition(regions[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const candidates = regions[4]!;
    expect(within(candidates).getByRole("heading", { level: 2, name: "3안" })).toBeInTheDocument();
    expect(within(candidates).queryByRole("button")).not.toBeInTheDocument();
    const layout = candidates.parentElement!;
    expect(layout.className).toMatch(/xl:grid-cols-/);
    const panel = layout.firstElementChild as HTMLElement;
    expect(panel.className).toMatch(/lg:grid-cols-2/);
    expect(panel.className).toMatch(/xl:grid-cols-1/);
    for (const g of screen.getAllByRole("radiogroup")) expect(g.className).toMatch(/flex-wrap/);
    const main = document.querySelector("main")!;
    expect(main.querySelectorAll("[disabled]")).toHaveLength(0);
    await waitFor(() => expect(screen.getByRole("heading", { level: 2, name: "전역 조정" })).toBeInTheDocument());
  });
});
