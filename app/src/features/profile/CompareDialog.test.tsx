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
