import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generatedReferenceFixtures } from "../../fixtures/generatedReferences";
import { referenceFixtures } from "../../fixtures/references";
import { ReferenceCard } from "./ReferenceCard";

const cafe = referenceFixtures[0]!;

function renderCard(overrides: Partial<Parameters<typeof ReferenceCard>[0]> = {}) {
  const props = {
    reference: cafe,
    saved: false,
    inTray: false,
    onToggleSave: vi.fn(),
    onToggleCompare: vi.fn(),
    ...overrides,
  };
  render(
    <MemoryRouter>
      <ReferenceCard {...props} />
    </MemoryRouter>,
  );
  return { ...props, card: screen.getByRole("article", { name: "모던 카페 브랜드" }) };
}

describe("ReferenceCard", () => {
  it("FR-CAT-02 필드를 빠짐없이 표시하고, 점수에는 라벨과 측정일이 붙는다 (V2-AC-22 · C-04)", () => {
    const { card } = renderCard();
    const q = within(card);
    expect(q.getByRole("img", { name: "모던 카페 브랜드 썸네일 (자체 렌더 플레이스홀더)" })).toBeInTheDocument();
    expect(q.getByRole("heading", { name: "모던 카페 브랜드" })).toBeInTheDocument();
    expect(q.getByText("카페·F&B · 풀블리드 히어로 · 모션 낮음")).toBeInTheDocument();
    expect(q.getByText("미니멀 · 따뜻한 · 반응형 지원")).toBeInTheDocument();
    const { primary, surface, ink } = cafe.colorPalette;
    expect(q.getByRole("img", { name: `대표 색상 ${primary} · ${surface} · ${ink}` })).toBeInTheDocument();
    const score = q.getByText(/^접근성/);
    expect(score).toHaveTextContent("접근성 96 · 성능 92 · 09.20 측정");
    expect(score.querySelector("time")).toHaveAttribute("datetime", "2026-09-20");
    expect(q.getByText("internal")).toBeInTheDocument();
  });

  it("반응형 미지원이면 캡션 2에 그렇게 적는다", () => {
    const { card } = renderCard({ reference: { ...cafe, responsive: false } });
    expect(within(card).getByText("미니멀 · 따뜻한 · 반응형 미지원")).toBeInTheDocument();
  });

  it("v2 카드: 보더 없음, 썸네일만 muted 면, 제목 2줄까지 (V2-AC-22 · C-03)", () => {
    const { card } = renderCard();
    expect(card.className).not.toMatch(/\bborder\b/);
    expect(card.className).not.toMatch(/\bbg-/);
    expect(within(card).getByRole("img", { name: /썸네일/ })).toHaveClass("bg-background-alternative");
    // clamp(overflow:hidden)는 링크 자신에 — h3에 걸면 링크 바깥 포커스 링(2중 링)이 잘린다
    expect(within(card).getByRole("link", { name: "모던 카페 브랜드" })).toHaveClass("line-clamp-2");
    expect(within(card).getByRole("heading", { name: "모던 카페 브랜드" }).className).not.toMatch(/line-clamp|overflow|truncate/);
  });

  it("v2 카드 제목: ds-body2 + semibold, 2줄 clamp는 링크에 유지, 링크 hover·URL 불변 (VISUAL-V2-APPLY 4, REPORT 1.2)", () => {
    const { card } = renderCard();
    const title = within(card).getByRole("heading", { name: "모던 카페 브랜드" });
    expect(title).toHaveClass("ds-body2", "font-semibold");
    expect(title).not.toHaveClass("ds-heading2");
    const link = within(card).getByRole("link", { name: "모던 카페 브랜드" });
    expect(link).toHaveClass("line-clamp-2", "hover:text-primary");
    expect(link).toHaveAttribute("href", "/references/ref-a");
  });

  it("상태가 바뀌면 아이콘 모양도 바뀐다 — 색 말고 모양 단서 (저장 bookmark → bookmark-fill, 비교 plus → check)", () => {
    const iconOf = (button: HTMLElement) => button.querySelector("i")?.getAttribute("style");
    const off = within(renderCard().card);
    const offSave = iconOf(off.getByRole("button", { name: "모던 카페 브랜드 저장" }));
    const offCompare = iconOf(off.getByRole("button", { name: "모던 카페 브랜드 비교 추가" }));
    cleanup();
    const on = within(renderCard({ saved: true, inTray: true }).card);
    expect(iconOf(on.getByRole("button", { name: "모던 카페 브랜드 저장" }))).not.toBe(offSave);
    expect(iconOf(on.getByRole("button", { name: "모던 카페 브랜드 비교 중, 비교에서 빼기" }))).not.toBe(offCompare);
  });

  it("이름은 레퍼런스 상세로 연결된다", () => {
    const { card } = renderCard();
    expect(within(card).getByRole("link", { name: "모던 카페 브랜드" })).toHaveAttribute("href", "/references/ref-a");
  });

  it("저장은 32px ghost 아이콘 버튼 — 이름·aria-pressed 유지, 저장됨은 채운 북마크 + primary (V2-AC-23)", async () => {
    const { card, onToggleSave } = renderCard({ saved: true });
    const save = within(card).getByRole("button", { name: "모던 카페 브랜드 저장" });
    expect(save).toHaveAttribute("aria-pressed", "true");
    expect(save).toHaveClass("size-8", "text-primary");
    await userEvent.click(save);
    expect(onToggleSave).toHaveBeenCalledWith("ref-a");
  });

  it("저장 전에는 aria-pressed=false, 빈 북마크", () => {
    const { card } = renderCard();
    const save = within(card).getByRole("button", { name: "모던 카페 브랜드 저장" });
    expect(save).toHaveAttribute("aria-pressed", "false");
  });

  it("비교는 32px ghost 아이콘 버튼 — 이름에 상태 글자를 담고 aria-pressed는 없다 (V2-AC-23)", async () => {
    const { card, onToggleCompare } = renderCard();
    const compare = within(card).getByRole("button", { name: "모던 카페 브랜드 비교 추가" });
    expect(compare).toHaveClass("size-8");
    expect(compare).toHaveTextContent("비교 추가");
    expect(compare).not.toHaveAttribute("aria-pressed");
    await userEvent.click(compare);
    expect(onToggleCompare).toHaveBeenCalledWith("ref-a");
  });

  it("트레이에 담긴 카드는 check 아이콘 + primary, 이름은 '비교 중, 비교에서 빼기'", async () => {
    const { card, onToggleCompare } = renderCard({ inTray: true });
    const compare = within(card).getByRole("button", { name: "모던 카페 브랜드 비교 중, 비교에서 빼기" });
    expect(compare).toHaveTextContent("비교 중");
    expect(compare).toHaveClass("text-primary");
    expect(compare).not.toHaveAttribute("aria-pressed");
    await userEvent.click(compare);
    expect(onToggleCompare).toHaveBeenCalledWith("ref-a");
  });

  it("licensed 레퍼런스는 licensed 배지를 표시한다", () => {
    render(
      <MemoryRouter>
        <ReferenceCard
          reference={referenceFixtures[1]!}
          saved={false}
          inTray={false}
          onToggleSave={vi.fn()}
          onToggleCompare={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(within(screen.getByRole("article", { name: "프리미엄 헤어살롱" })).getByText("licensed")).toBeInTheDocument();
  });
});

describe("ReferenceCard 생성 레퍼런스 표식 (M3P-3 · SPEC m3p 4.1·7절)", () => {
  it("생성 레퍼런스: '생성 조합' 글자 Tag(읽힘)·'접근성·성능 미측정'·<time> 0, 큐레이션 카드엔 '생성 조합' 0 (M3P-AC-U5)", () => {
    const generated = generatedReferenceFixtures[0]!;
    render(
      <MemoryRouter>
        <ReferenceCard reference={generated} saved={false} inTray={false} onToggleSave={vi.fn()} onToggleCompare={vi.fn()} />
      </MemoryRouter>,
    );
    const card = screen.getByRole("article", { name: generated.title });
    const q = within(card);
    expect(q.getByText("생성 조합")).toBeVisible();
    expect(q.getByText("생성 조합").closest('[aria-hidden="true"], [role="img"]')).toBeNull();
    expect(q.getByText("접근성·성능 미측정")).toBeInTheDocument();
    expect(card.querySelector("time")).toBeNull();
    cleanup();
    expect(within(renderCard().card).queryByText("생성 조합")).toBeNull();
  });
});

describe("ReferenceCard 실렌더 썸네일 (M3P-3b · SPEC m3p 4.1·5·7절 · ADR-004 개정 7)", () => {
  const VERSION = "0123abcd";
  const PLACEHOLDER = "모던 카페 브랜드 썸네일 (자체 렌더 플레이스홀더)";
  const RENDERED = "모던 카페 브랜드 첫 화면 실제 렌더 미리보기";

  // 썸네일 빌드 버전 — 테스트 기본은 빈 값(dev·vitest = img 0), 썸네일 테스트만 정의 상수를 바꿔 끼운다
  const withVersion = () => vi.stubGlobal("__THUMBS_VERSION__", VERSION);

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("버전이 있으면 같은 출처 고정 경로 lazy img가 이름을 갖고, 와이어는 이름 없는 배경으로 남는다(레이아웃 이동 0)", () => {
    withVersion();
    const { card } = renderCard();
    const img = within(card).getByRole("img", { name: RENDERED });
    expect(img).toHaveAttribute("src", `/thumbs/${cafe.id}.svg?v=${VERSION}`);
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
    expect(img).toHaveClass("absolute", "inset-0", "object-cover", "object-top");
    expect(within(card).queryByRole("img", { name: PLACEHOLDER })).toBeNull();
    const wire = img.parentElement;
    expect(wire).toHaveClass("relative", "bg-background-alternative", "aspect-video", "sm:aspect-[4/3]");
    expect(wire).not.toHaveAttribute("role");
    expect(wire).not.toHaveAttribute("aria-label");
    // GM-AC-U3: 라이선스 Tag는 썸네일 밖으로 나와 읽힌다(SPEC gen-mark 5절 — 기존 aria-hidden 단언을 뒤집음)
    expect(within(card).getByText(cafe.licenseStatus).closest('[aria-hidden="true"]')).toBeNull();
    expect(wire!.contains(within(card).getByText(cafe.licenseStatus))).toBe(false);
    expect(within(card).getAllByRole("img", { name: /미리보기|썸네일/ })).toHaveLength(1);
  });

  it("img 실패 → img 제거·와이어 role=img 이름 복귀, 알림·콘솔 0 (M3P-AC-U6)", () => {
    withVersion();
    const consoleError = vi.spyOn(console, "error");
    const consoleWarn = vi.spyOn(console, "warn");
    const { card } = renderCard();
    fireEvent.error(within(card).getByRole("img", { name: RENDERED }));
    expect(within(card).queryByRole("img", { name: RENDERED })).toBeNull();
    expect(card.querySelector("img")).toBeNull();
    expect(within(card).getByRole("img", { name: PLACEHOLDER })).not.toHaveAttribute("aria-hidden");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it("버전 빈 값(dev·테스트 — 썸네일 산출물 없음)이면 img 0·와이어 이름 유지, 콘솔 0 (id 누락은 빌드가 막는다 — thumbnail.test·check-bundle-size)", () => {
    const consoleError = vi.spyOn(console, "error");
    const { card } = renderCard();
    expect(card.querySelector("img")).toBeNull();
    expect(within(card).getByRole("img", { name: PLACEHOLDER })).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("생성 레퍼런스 카드: 썸네일 img와 '생성 조합' Tag가 함께 있고 Tag는 이름 있는 그림 밖(읽힘)", () => {
    withVersion();
    const generated = generatedReferenceFixtures[0]!;
    render(
      <MemoryRouter>
        <ReferenceCard reference={generated} saved={false} inTray={false} onToggleSave={vi.fn()} onToggleCompare={vi.fn()} />
      </MemoryRouter>,
    );
    const card = screen.getByRole("article", { name: generated.title });
    const img = within(card).getByRole("img", { name: `${generated.title} 첫 화면 실제 렌더 미리보기` });
    expect(img).toHaveAttribute("src", `/thumbs/${generated.id}.svg?v=${VERSION}`);
    const tag = within(card).getByText("생성 조합");
    expect(tag).toBeVisible();
    expect(tag.closest('[aria-hidden="true"], [role="img"]')).toBeNull();
    expect(img.contains(tag)).toBe(false);
  });
});

describe("ReferenceCard 출처 줄 (GEN-MARK · SPEC gen-mark 3.1·5·7절)", () => {
  const generated = generatedReferenceFixtures[0]!;
  const renderGenerated = () => {
    render(
      <MemoryRouter>
        <ReferenceCard reference={generated} saved={false} inTray={false} onToggleSave={vi.fn()} onToggleCompare={vi.fn()} />
      </MemoryRouter>,
    );
    return screen.getByRole("article", { name: generated.title });
  };
  const thumbnailOf = (card: HTMLElement) => within(card).getByRole("img", { name: /썸네일|미리보기/ });
  const absoluteAncestor = (el: HTMLElement, card: HTMLElement) => {
    for (let n: HTMLElement | null = el; n && n !== card; n = n.parentElement) if (n.classList.contains("absolute")) return n;
    return null;
  };

  it("GM-AC-U1·U2: 라이선스·'생성 조합' Tag는 썸네일 밖에 있고 absolute 배치 0, '생성 조합'은 읽힌다", () => {
    const card = renderGenerated();
    const thumb = thumbnailOf(card);
    for (const text of [generated.licenseStatus, "생성 조합"]) {
      const tag = within(card).getByText(text);
      expect(thumb.contains(tag), text).toBe(false);
      expect(absoluteAncestor(tag, card), text).toBeNull();
      expect(tag.closest('[aria-hidden="true"], [role="img"]'), text).toBeNull();
    }
  });

  it("GM-AC-U3: 라이선스는 sr-only 접두 '라이선스' + Tag로 읽힌다(internal·licensed), aria-hidden 조상 0", () => {
    const { card } = renderCard();
    const prefix = within(card).getByText("라이선스");
    expect(prefix).toHaveClass("sr-only");
    expect(prefix.nextElementSibling).toHaveTextContent(/^internal$/);
    expect(prefix.closest('[aria-hidden="true"]')).toBeNull();
    expect(within(card).getByText("internal").closest('[aria-hidden="true"]')).toBeNull();
    cleanup();
    render(
      <MemoryRouter>
        <ReferenceCard reference={referenceFixtures[1]!} saved={false} inTray={false} onToggleSave={vi.fn()} onToggleCompare={vi.fn()} />
      </MemoryRouter>,
    );
    const licensed = screen.getByRole("article", { name: referenceFixtures[1]!.title });
    expect(within(licensed).getByText("라이선스").nextElementSibling).toHaveTextContent(/^licensed$/);
  });

  it("GM-AC-U4: 큐레이션 카드는 '생성 조합' 0 · 라이선스 Tag 1개", () => {
    const { card } = renderCard();
    expect(within(card).queryByText("생성 조합")).toBeNull();
    expect(within(card).getAllByText("internal")).toHaveLength(1);
  });

  it("GM-AC-U7: 출처 표식 DOM 순서 = 라이선스 → 생성 조합, 둘 다 썸네일 뒤·제목 앞", () => {
    const card = renderGenerated();
    const license = within(card).getByText(generated.licenseStatus);
    const gen = within(card).getByText("생성 조합");
    const title = within(card).getByRole("heading", { name: generated.title });
    const follows = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    expect(follows(thumbnailOf(card), license)).toBe(true);
    expect(follows(license, gen)).toBe(true);
    expect(follows(gen, title)).toBe(true);
  });
});
