/**
 * M2B-5 SPEC-COMPARE3 2·3·4·5 — 3안 실제 화면 비교 대화상자 (CMP-AC-U3·U4·U9).
 * 렌더 문서는 jsdom에서 뜨지 않는다 — 프레임 contentWindow에서 온 것처럼 message 이벤트를 보내고, 부모 송신은 contentWindow.postMessage spy로 본다.
 */
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryCompareBoardRepository } from "../../data/memoryCompareBoardRepository";
import { createMemoryGenerationRepository, type MemoryGenerationOptions } from "../../data/memoryGenerationRepository";
import { createMemoryProfileRepository } from "../../data/memoryProfileRepository";
import { createStudioStore } from "../../data/studioStore";
import { effectiveProfile } from "../../domain/effectiveProfile";
import { isTerminal, type CandidateId, type GenerationJob } from "../../domain/generation";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import type { WirePalette } from "./CandidateCard";
import * as parts from "./CandidateResults";
import CompareDialog from "./CompareDialog";
import { PALETTE_ROLES } from "./profileFields";

async function fixture(options: Omit<MemoryGenerationOptions, "store"> = {}) {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }), store });
  await board.confirmProfile(1, 0);
  const series = (await createMemoryProfileRepository({ store }).getProfile("profile-1"))!;
  const gen = createMemoryGenerationRepository({ ...options, store });
  let job: GenerationJob = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 6 && !isTerminal(job.state); i += 1) job = await gen.getJob(job.jobId);
  return { viewed: series.versions.at(-1)!, job };
}

async function mountDialog({ selected, options, failure = null }: { selected?: CandidateId; options?: Omit<MemoryGenerationOptions, "store">; failure?: string | null } = {}) {
  const { viewed, job } = await fixture(options);
  const profile = effectiveProfile(viewed.base, viewed.adjustments);
  const palette = Object.fromEntries(PALETTE_ROLES.map((r) => [r, profile.color_tokens[r].$value])) as WirePalette;
  const onSelect = vi.fn();
  const onClose = vi.fn();
  const receivers: ((text: string) => void)[] = [];
  const props = {
    job: selected ? { ...job, selected } : job,
    viewed,
    parts,
    palette,
    profileScale: profile.typography_tokens.scale,
    busy: false,
    failure,
    onSelect,
    onClose,
    listen: (receiver: ((text: string) => void) | undefined) => {
      if (receiver) receivers.push(receiver);
    },
  };
  const view = render(<CompareDialog {...props} />);
  const dialog = screen.getByRole("dialog", { name: "3안 실제 화면 비교" });
  return { ...view, props, dialog, onSelect, onClose, receivers, job: props.job };
}

const framesOf = (dialog: HTMLElement) => [...dialog.querySelectorAll("iframe")];
const send = (frame: HTMLIFrameElement | Window, data: unknown) =>
  act(() => {
    window.dispatchEvent(new MessageEvent("message", { data, source: frame instanceof HTMLIFrameElement ? frame.contentWindow : frame }));
  });
const sectionRect = (bottom: number) => ["s-1", null, 0, 0, 1280, bottom] as const;

const original = window.matchMedia;
/** 뷰포트 폭(px)으로 matchMedia를 흉내 낸다 — (min-width: Nrem)만 */
function viewport(px: number) {
  window.matchMedia = ((query: string) => {
    const rem = /min-width:\s*([\d.]+)rem/.exec(query)?.[1];
    return { matches: rem ? px >= Number(rem) * 16 : false, media: query, addEventListener() {}, removeEventListener() {} } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
}
afterEach(() => {
  window.matchMedia = original;
});

describe("비교 프레임 (CMP-AC-U4)", () => {
  it("열마다 iframe 1개 — 감싸개 inert · sandbox = allow-scripts · title 'X안 실제 화면 미리보기' · src /render.html", async () => {
    const { dialog } = await mountDialog();
    const frames = framesOf(dialog);
    expect(frames).toHaveLength(3);
    frames.forEach((frame, i) => {
      expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
      expect(frame).toHaveAttribute("title", `${"ABC"[i]}안 실제 화면 미리보기`);
      expect(frame.getAttribute("src")).toBe("/render.html");
      expect(frame.parentElement?.closest("[inert]")).not.toBeNull();
    });
  });
});

describe("프레임별 다리 (CMP-AC-U3)", () => {
  it("B열 프레임 메시지로 A열이 바뀌지 않는다 · 그 프레임 ready → render · rects → 높이 · click 무시", async () => {
    const { dialog, onSelect } = await mountDialog();
    const [a, b] = framesOf(dialog) as [HTMLIFrameElement, HTMLIFrameElement];
    const postA = vi.spyOn(a.contentWindow!, "postMessage");
    await send(b, { type: "ready" });
    await send(window, { type: "ready" });
    expect(postA).not.toHaveBeenCalled();
    await send(a, { type: "ready" });
    expect(postA.mock.calls.filter(([m]) => (m as { type: string }).type === "render")).toHaveLength(1);
    await send(b, { type: "rects", rects: [sectionRect(700)] });
    expect(a.style.height).toBe("");
    await send(a, { type: "rects", rects: [["x", null, 0, 0, "w", 1]] });
    expect(a.style.height).toBe("");
    await send(a, { type: "rects", rects: [sectionRect(900)] });
    expect(a.style.height).toBe("900px");
    await send(a, { type: "click", instanceId: "s-1" });
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("미리보기 폭 · 배치 (CMP-AC-U9)", () => {
  it("폭 전환 = 세 프레임 viewport만(문서 재전송 0) — 데스크톱 1280 → 모바일 390", async () => {
    const { dialog } = await mountDialog();
    const frames = framesOf(dialog);
    const posts = frames.map((f) => vi.spyOn(f.contentWindow!, "postMessage"));
    for (const f of frames) await send(f, { type: "ready" });
    const radio = within(dialog).getByRole("radiogroup", { name: "미리보기 폭" });
    expect(within(radio).getByRole("radio", { name: "데스크톱" })).toHaveAttribute("aria-checked", "true");
    await userEvent.click(within(radio).getByRole("radio", { name: "모바일" }));
    for (const post of posts) {
      const types = post.mock.calls.map(([m]) => m as { type: string; width?: number });
      expect(types.filter((m) => m.type === "render")).toHaveLength(1);
      expect(types.filter((m) => m.type === "viewport").map((m) => m.width)).toEqual([1280, 390]);
    }
  });

  it("<1280 = 1안씩 + '보는 안' 라디오(기본 = 선택한 안) — 전환하면 그 안 프레임 1개만", async () => {
    viewport(1024);
    const { dialog } = await mountDialog({ selected: "B" });
    expect(framesOf(dialog)).toHaveLength(1);
    const pick = within(dialog).getByRole("radiogroup", { name: "보는 안" });
    expect(within(pick).getByRole("radio", { name: "B안" })).toHaveAttribute("aria-checked", "true");
    expect(framesOf(dialog)[0]).toHaveAttribute("title", "B안 실제 화면 미리보기");
    await userEvent.click(within(pick).getByRole("radio", { name: "C안" }));
    expect(framesOf(dialog)).toHaveLength(1);
    expect(framesOf(dialog)[0]).toHaveAttribute("title", "C안 실제 화면 미리보기");
  });
});

const column = (dialog: HTMLElement, id: string) => within(dialog).getByRole("region", { name: `${id}안` });
const frameIn = (col: HTMLElement) => col.querySelector("iframe");
const status = (dialog: HTMLElement) => within(dialog).getByRole("status");

describe("열 상태 (SPEC 3.3 · CMP-AC-U6)", () => {
  it("그리는 중 → 그림 · NO_KIT_TOKENS 뒤 rects = 기본 모양 · INVALID_DOC = 구조 미리보기(Wireframe, iframe 0)", async () => {
    const { dialog } = await mountDialog();
    const [a, b, c] = ["A", "B", "C"].map((id) => column(dialog, id)) as [HTMLElement, HTMLElement, HTMLElement];
    for (const col of [a, b, c]) expect(col).toHaveTextContent("그리는 중…");
    await send(frameIn(a)!, { type: "rects", rects: [sectionRect(900)] });
    expect(a).not.toHaveTextContent("그리는 중…");
    await send(frameIn(b)!, { type: "error", code: "NO_KIT_TOKENS" });
    expect(b).toHaveTextContent("그리는 중…");
    await send(frameIn(b)!, { type: "rects", rects: [sectionRect(900)] });
    expect(b).toHaveTextContent("프로필 색·글꼴이 없어 기본 모양으로 그렸습니다");
    await send(frameIn(c)!, { type: "error", code: "INVALID_DOC" });
    expect(c).toHaveTextContent("이 안을 그리지 못했습니다 — 구조 미리보기로 표시합니다");
    expect(frameIn(c)).toBeNull();
    expect(c.querySelector('[aria-hidden="true"].aspect-4\\/5')).not.toBeNull();
  });

  it("시간 초과 8000ms → '그리는 데 시간이 오래 걸립니다' + 다시 그리기(그 열만 재마운트) · 늦은 rects = 그림", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { dialog } = await mountDialog();
      const [a, b] = [column(dialog, "A"), column(dialog, "B")];
      const before = { a: frameIn(a), b: frameIn(b) };
      await act(() => vi.advanceTimersByTimeAsync(7800));
      expect(a).not.toHaveTextContent("그리는 데 시간이 오래 걸립니다");
      await act(() => vi.advanceTimersByTimeAsync(200));
      expect(a).toHaveTextContent("그리는 데 시간이 오래 걸립니다");
      await send(frameIn(b)!, { type: "rects", rects: [sectionRect(900)] });
      expect(b).not.toHaveTextContent("그리는 데 시간이 오래 걸립니다");
      expect(frameIn(a)).toBe(before.a);
      await act(async () => within(a).getByRole("button", { name: "다시 그리기" }).click());
      expect(frameIn(a)).not.toBe(before.a);
      expect(frameIn(b)).toBe(before.b);
      expect(a).toHaveTextContent("그리는 중…");
      await send(frameIn(a)!, { type: "rects", rects: [sectionRect(900)] });
      expect(a).not.toHaveTextContent("그리는 중…");
      expect(within(a).queryByRole("button", { name: "다시 그리기" })).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("변환 불가(UNKNOWN_VARIANT) = 그 alert 문장 · Wireframe · iframe 0 · 만들지 못한 안 = failureText · 프레임 없음", async () => {
    const { viewed, job } = await fixture({ outcome: ({ id }) => (id === "C" ? "INFRA" : undefined) });
    const a = job.candidates[0]!;
    if (a.status !== "succeeded") throw new Error("A안 성공 전제");
    const odd: GenerationJob = { ...job, candidates: [{ ...a, plan: { ...a.plan, sections: a.plan.sections.map((s, i) => (i === 1 ? { ...s, variant: "nope" } : s)) } }, ...job.candidates.slice(1)] };
    const { dialog, rerender, props } = await mountDialog();
    rerender(<CompareDialog {...props} job={odd} viewed={viewed} />);
    const colA = column(dialog, "A");
    expect(frameIn(colA)).toBeNull();
    expect(colA).toHaveTextContent(/이 안에는 편집기가 아직 열 수 없는 섹션이 있습니다/);
    expect(colA.querySelector('[aria-hidden="true"].aspect-4\\/5')).not.toBeNull();
    const colC = column(dialog, "C");
    expect(frameIn(colC)).toBeNull();
    expect(colC).toHaveTextContent(/^C안.*C안을 만들지 못했습니다 · /);
  });
});

describe("대화상자 알림 role=status (SPEC 3.4 · CMP-AC-U7)", () => {
  it("3열 = 모든 열 범주 확정 때 1회(2 그림 + 1 지연) · 중간 낭독 0 · 지연 안이 늦게 그려지면 그 안만 1회", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { dialog } = await mountDialog();
      await send(frameIn(column(dialog, "A"))!, { type: "rects", rects: [sectionRect(900)] });
      await send(frameIn(column(dialog, "B"))!, { type: "rects", rects: [sectionRect(900)] });
      expect(status(dialog)).toHaveTextContent(/^$/);
      await act(() => vi.advanceTimersByTimeAsync(8000));
      expect(status(dialog)).toHaveTextContent(/^3안 중 2개를 그렸습니다 · 1개는 아직 그려지지 않음$/);
      await send(frameIn(column(dialog, "C"))!, { type: "rects", rects: [sectionRect(900)] });
      expect(status(dialog)).toHaveTextContent(/^C안을 그렸습니다$/);
    } finally {
      vi.useRealTimers();
    }
  });

  it("부분 성공 잡 — 그림 1 · 구조 미리보기 1 · 만들지 못함 1 = 총계 문장에 0 아닌 범주만", async () => {
    const { dialog } = await mountDialog({ options: { outcome: ({ id }) => (id === "C" ? "INFRA" : undefined) } });
    await send(frameIn(column(dialog, "A"))!, { type: "rects", rects: [sectionRect(900)] });
    expect(status(dialog)).toHaveTextContent(/^$/);
    await send(frameIn(column(dialog, "B"))!, { type: "error", code: "INVALID_DOC" });
    expect(status(dialog)).toHaveTextContent(/^3안 중 1개를 그렸습니다 · 1개는 구조 미리보기로 표시 · 1개는 만들지 못했습니다$/);
  });

  it("1안씩 = 보이는 안이 범주에 들면 1회(미방문 안 대기 0) · 전환 자체는 알리지 않음 · 킷 없이 = ' · 기본 모양'", async () => {
    viewport(768);
    const { dialog } = await mountDialog();
    await send(framesOf(dialog)[0]!, { type: "rects", rects: [sectionRect(900)] });
    expect(status(dialog)).toHaveTextContent(/^A안을 그렸습니다$/);
    await userEvent.click(within(dialog).getByRole("radio", { name: "B안" }));
    expect(status(dialog)).toHaveTextContent(/^A안을 그렸습니다$/);
    await send(framesOf(dialog)[0]!, { type: "error", code: "NO_KIT_TOKENS" });
    await send(framesOf(dialog)[0]!, { type: "rects", rects: [sectionRect(900)] });
    expect(status(dialog)).toHaveTextContent(/^B안을 그렸습니다 · 기본 모양$/);
  });
});

describe("캡션 · 요약 (SPEC 2.4 · 2.5 · CMP-AC-U11·U12)", () => {
  it("캡션 1(동일성 범위 + 기존 문서 안내) · 캡션 2(프로필 비율) · 요약 비율 접미 '(구조안)'", async () => {
    const { dialog, props } = await mountDialog();
    expect(dialog).toHaveTextContent(
      "실제 화면 미리보기 — 3안 모두 예시 문구로 그렸습니다. 이 프로젝트에 편집 문서가 없으면 편집 시작이 이 문서로 시작합니다. 이미 편집 중인 문서가 있으면 편집 시작은 그 문서를 엽니다.",
    );
    const scale = props.viewed.base.typography_tokens.scale;
    expect(dialog).toHaveTextContent(`제목 비율 축은 아직 편집 문서에 반영되지 않아 3안 모두 프로필 비율 ${scale}로 그렸습니다 — 비율 차이는 카드의 구조 미리보기에서 보세요.`);
    const a = props.job.candidates[0]!;
    if (a.status !== "succeeded") throw new Error("A안 성공 전제");
    expect(column(dialog, "A")).toHaveTextContent(`${parts.heroText(a.plan.axes)} · `);
    expect(column(dialog, "A")).toHaveTextContent(`${parts.scaleText(a.plan, props.profileScale)} (구조안)`);
  });
});

describe("대화상자 안 선택 · 접근성 (SPEC 2.5 · 4 · CMP-AC-U8)", () => {
  it("열마다 '이 안 선택'(접근 이름 'X안 선택') = onSelect · 선택한 안 = aria-pressed + '선택됨' + Tag 선택 · busy = aria-busy · 만들지 못한 안 = 버튼 0", async () => {
    const { dialog, onSelect, rerender, props } = await mountDialog({ selected: "A", options: { outcome: ({ id }) => (id === "C" ? "INFRA" : undefined) } });
    const a = within(column(dialog, "A")).getByRole("button", { name: "A안 선택" });
    expect(a).toHaveAttribute("aria-pressed", "true");
    expect(a).toHaveTextContent("선택됨");
    expect(within(column(dialog, "A")).getByText("선택")).toBeInTheDocument();
    const b = within(column(dialog, "B")).getByRole("button", { name: "B안 선택" });
    expect(b).toHaveAttribute("aria-pressed", "false");
    expect(b).toHaveTextContent("이 안 선택");
    expect(within(column(dialog, "B")).queryByText("선택")).not.toBeInTheDocument();
    expect(within(column(dialog, "C")).queryByRole("button", { name: "C안 선택" })).not.toBeInTheDocument();
    await userEvent.click(b);
    expect(onSelect).toHaveBeenCalledWith("B");
    rerender(<CompareDialog {...props} busy />);
    expect(within(column(dialog, "B")).getByRole("button", { name: "B안 선택" })).toHaveAttribute("aria-busy", "true");
  });

  it("gen.failure → 머리 아래 role=alert(같은 문장) · 바깥 announce(listen) → 대화상자 status", async () => {
    const { dialog, rerender, props, receivers } = await mountDialog();
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
    rerender(<CompareDialog {...props} failure="안을 선택하지 못했습니다 · 다시 시도하세요" />);
    expect(within(dialog).getByRole("alert")).toHaveTextContent("안을 선택하지 못했습니다 · 다시 시도하세요");
    act(() => receivers.at(-1)!("B안을 선택했습니다"));
    expect(status(dialog)).toHaveTextContent(/^B안을 선택했습니다$/);
  });

  it("열 때 포커스 = 첫 라디오(데스크톱) · 본문 스크롤 영역 tabIndex 0 · 접근 이름 '3안 미리보기 영역'", async () => {
    const { dialog } = await mountDialog();
    expect(within(dialog).getByRole("radio", { name: "데스크톱" })).toHaveFocus();
    expect(within(dialog).getByRole("region", { name: "3안 미리보기 영역" })).toHaveAttribute("tabindex", "0");
  });
});
