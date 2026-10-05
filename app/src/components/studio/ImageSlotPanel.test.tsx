import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ImageSlotValue, LocalImageId, PageDoc } from "../../engine/contracts/pageDoc";
import { setSlot } from "../../engine/ops/slotOps";
import { section, sampleDoc, withSections } from "../../engine/testing/sampleDoc";
import type { IngestResult } from "../../features/studio/images/ingest";
import type { ImageHost, RenderImages } from "../../features/studio/images/store/types";
import { addImage } from "../../features/studio/images/store/imageStore";
import { Button } from "../ds/Button";
import ImageSlotPanel from "./ImageSlotPanel";

/** 이미지 슬롯 패널 (SPEC m2c 2.2·2.5·6절 · 2a-05 5.9 · IMG-AC-08·09·11·13~16) — 변환기는 모의(jsdom은 디코드 불가) */
const ingest = vi.hoisted(() => ({ fn: vi.fn<(file: File) => Promise<IngestResult>>() }));
vi.mock("../../features/studio/images/ingest", async (original) => ({ ...(await original<object>()), ingestImage: ingest.fn }));

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}` as LocalImageId;
const webp = (bytes = 10) => new Blob([new Uint8Array(bytes)], { type: "image/webp" });
const ok = (width = 1500): IngestResult => ({ ok: true, image: { variants: { 640: webp(), 1280: webp(), [width]: webp(184 * 1024) }, width, height: width / 2, format: "webp", bytes: 3 }) });
const file = (name = "IMG_20261006_secret-phone.jpg") => new File([new Uint8Array([0xff, 0xd8, 0xff])], name, { type: "image/jpeg" });
const hero = (doc: PageDoc) => doc.sections.find((s) => s.instanceId === "s-hero")!.slots.image as ImageSlotValue;

let urls: { created: number; revoked: string[] };
beforeEach(() => {
  urls = { created: 0, revoked: [] };
  URL.createObjectURL = vi.fn(() => `blob:test/${++urls.created}`);
  URL.revokeObjectURL = vi.fn((u: string) => void urls.revoked.push(u));
  ingest.fn.mockReset();
});
afterEach(() => vi.useRealTimers());

/** 편집 틀 흉내 — 문서·images state를 들고 패널에 host 튜플을 넘긴다 */
function setup({ doc = sampleDoc(), images, undoDoc, instanceId = "s-hero" }: { doc?: PageDoc; images?: RenderImages; undoDoc?: PageDoc; instanceId?: string } = {}) {
  const state: { doc: PageDoc; images: RenderImages | undefined } = { doc, images };
  function Host() {
    const [current, setDoc] = useState(doc);
    const [map, setMap] = useState<RenderImages | undefined>(images);
    state.doc = current;
    state.images = map;
    const host: ImageHost = [map, setMap, undoDoc];
    return <ImageSlotPanel doc={current} instanceId={instanceId} onEdit={setDoc} host={host} Button={Button} />;
  }
  const view = render(<Host />);
  return { state, view };
}
const pick = (chosen: File) => fireEvent.change(screen.getByTestId("image-file-image"), { target: { files: [chosen] } });

describe("ImageSlotPanel — 필드·안내", () => {
  it("스위치 라벨 = 슬롯 라벨 · role=switch · 권리 안내는 모든 슬롯 · 지도 안내는 map만", () => {
    setup();
    const toggle = screen.getByRole("switch", { name: "대표 이미지 사용" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("직접 찍었거나 사용 권리가 있는 이미지만 넣어 주세요.")).toBeInTheDocument();
    expect(screen.queryByText(/지도 서비스 화면을 캡처해/)).toBeNull();
    const footer = section("footer", "biz-extended-map", "s-map");
    setup({ doc: withSections(sampleDoc(), [...sampleDoc().sections.slice(0, -1), footer]), instanceId: "s-map" });
    expect(screen.getByRole("switch", { name: "지도 이미지 사용" })).toBeInTheDocument();
    expect(screen.getByText(/지도 서비스 화면을 캡처해 쓰면 그 서비스 약관을 따라야 합니다/)).toBeInTheDocument();
  });

  it("스위치 끄기 → enabled false · 파일·대체텍스트 칸 숨김 · 다시 켜면 값 그대로", () => {
    const { state } = setup();
    fireEvent.click(screen.getByRole("switch", { name: "대표 이미지 사용" }));
    expect(hero(state.doc).enabled).toBe(false);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: "이미지 고르기" })).toBeNull();
    fireEvent.click(screen.getByRole("switch", { name: "대표 이미지 사용" }));
    expect(hero(state.doc)).toEqual({ ...hero(sampleDoc()), enabled: true });
  });

  it("대체텍스트 필수 표시 · 입력 → 문서 · 장식 체크 → 입력 aria-disabled + 이유", () => {
    const { state } = setup();
    const alt = screen.getByRole("textbox", { name: /대체텍스트/ });
    expect(alt.closest("div")!.textContent).toContain("(필수)");
    fireEvent.change(alt, { target: { value: "가게 앞 사진" } });
    expect(hero(state.doc).alt).toBe("가게 앞 사진");
    fireEvent.click(screen.getByRole("checkbox", { name: "장식 이미지 — 대체텍스트 없이 둡니다" }));
    expect(hero(state.doc).decorative).toBe(true);
    const disabled = screen.getByRole("textbox", { name: /대체텍스트/ });
    expect(disabled).toHaveAttribute("aria-disabled", "true");
    expect(disabled).toHaveAccessibleDescription(/장식 이미지라 대체텍스트를 쓰지 않습니다/);
  });
});

describe("ImageSlotPanel — 파일 고르기·상태", () => {
  it("완료 → 문서 source = 새 로컬 id · images = {Blob, 폭, 높이} · 미리보기 + 결과 메타 · 낭독 시작 1회·완료 1회", async () => {
    ingest.fn.mockResolvedValue(ok());
    const { state } = setup();
    const status = screen.getByRole("status");
    pick(file());
    expect(status).toHaveTextContent("이미지를 준비하고 있습니다");
    expect(screen.getByRole("button", { name: "이미지 고르기" })).toHaveAttribute("aria-disabled", "true");
    await act(async () => {});
    const id = hero(state.doc).source as string;
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(state.images?.[id]).toMatchObject({ width: 1500, height: 750 });
    expect(status).toHaveTextContent("이미지를 넣었습니다 대체텍스트를 적어 주세요");
    expect(screen.getByText("1500 × 750 · WebP 184KB")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다른 이미지로 바꾸기" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("실패 → 필드 오류(aria-invalid + 설명) · 문구 그대로 · 이전 이미지·문서·보관소 불변 · alert 0", async () => {
    const images = addImage({}, uuid(1), (ok() as Extract<IngestResult, { ok: true }>).image, 1920);
    const doc = setSlot(sampleDoc(), "s-hero", "image", { ...hero(sampleDoc()), source: uuid(1) });
    ingest.fn.mockResolvedValue({ ok: false, code: "TOO_LARGE", detail: "12.4MB" });
    const { state } = setup({ doc, images });
    pick(file());
    await act(async () => {});
    const button = screen.getByRole("button", { name: "다른 이미지로 바꾸기" });
    expect(button).toHaveAttribute("aria-invalid", "true");
    expect(button).toHaveAccessibleDescription(/10MB까지 쓸 수 있습니다 \(12\.4MB\)/);
    expect(state.doc).toBe(doc);
    expect(state.images).toBe(images);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("변환 중 다른 파일을 고르면 마지막 선택만 반영", async () => {
    let first!: (r: IngestResult) => void;
    ingest.fn.mockImplementationOnce(() => new Promise((r) => (first = r))).mockResolvedValueOnce(ok(900));
    const { state } = setup();
    pick(file("a.jpg"));
    pick(file("b.jpg"));
    await act(async () => {});
    const id = hero(state.doc).source as string;
    expect(state.images?.[id]?.width).toBe(900);
    await act(async () => first(ok(3000)));
    expect(hero(state.doc).source).toBe(id);
    expect(Object.keys(state.images ?? {})).toEqual([id]);
  });

  it("한도 초과(13번째) → 한도 문구 필드 오류 · 문서·보관소 불변", async () => {
    const twelve = Array.from({ length: 12 }, (_, k) => uuid(k + 1));
    const image = (ok() as Extract<IngestResult, { ok: true }>).image;
    const images = twelve.reduce<RenderImages>((acc, id) => addImage(acc, id, image, 640), {});
    const head = sampleDoc().sections[0]!;
    const crowded = { ...head, slots: { ...head.slots, ...Object.fromEntries(twelve.map((id, i) => [`x${i}`, { kind: "image", enabled: true, source: id, alt: "", decorative: true }])) } };
    const doc = withSections(sampleDoc(), [crowded, ...sampleDoc().sections.slice(1)]);
    ingest.fn.mockResolvedValue(ok());
    const { state } = setup({ doc, images });
    pick(file());
    await act(async () => {});
    expect(screen.getByRole("button", { name: "이미지 고르기" })).toHaveAccessibleDescription(/이미지는 한 페이지에 12개까지 쓸 수 있습니다/);
    expect(state.doc).toBe(doc);
    expect(state.images).toBe(images);
  });

  it("2초 넘김 → '큰 이미지라 시간이 걸리고 있습니다' 1회", async () => {
    vi.useFakeTimers();
    ingest.fn.mockImplementation(() => new Promise(() => {}));
    setup();
    pick(file());
    await act(async () => vi.advanceTimersByTime(2100));
    expect(screen.getByRole("status")).toHaveTextContent("큰 이미지라 시간이 걸리고 있습니다");
  });
});

describe("ImageSlotPanel — 잃은 이미지·지우기·URL 수명·파일 이름", () => {
  it("보관소에 없는 로컬 id = 잃은 이미지: 자체 플레이스홀더 + '이미지를 다시 골라 주세요' · 대체텍스트·켜짐 보존", () => {
    const doc = setSlot(sampleDoc(), "s-hero", "image", { kind: "image", enabled: true, source: uuid(7), alt: "가게 앞", decorative: false });
    setup({ doc });
    expect(screen.getByText("이미지를 다시 골라 주세요")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /대체텍스트/ })).toHaveValue("가게 앞");
    expect(screen.getByRole("button", { name: "이미지 고르기" })).toBeInTheDocument();
    expect(screen.getByText("고른 이미지는 이 탭의 편집기 안에서만 보관됩니다 — 편집기를 나가거나 새로고침하면 다시 골라야 합니다")).toBeInTheDocument();
  });

  it("지우기 → 플레이스홀더로 · 참조 밖 Blob 해제 · 미리보기 URL은 패널만 소유 — 언마운트 뒤 살아 있는 URL 0 · 파일 이름 DOM·문서·보관소 0", async () => {
    ingest.fn.mockResolvedValue(ok());
    const { state, view } = setup();
    pick(file());
    await act(async () => {});
    expect(urls.created).toBe(1);
    const html = view.container.innerHTML + JSON.stringify(state.doc) + JSON.stringify(Object.keys(state.images ?? {}));
    expect(html).not.toContain("secret-phone");
    fireEvent.click(screen.getByRole("button", { name: "이미지 지우기" }));
    expect(hero(state.doc).source).toEqual({ kind: "placeholder", patternId: "diagonal" });
    await act(async () => {});
    expect(state.images).toEqual({});
    expect(urls.revoked).toEqual(["blob:test/1"]);
    view.unmount();
    expect(urls.revoked).toHaveLength(urls.created);
    expect(within(document.body).queryByRole("img")).toBeNull();
  });
});
