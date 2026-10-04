import type { ImageSlotValue, PageDoc } from "../engine/contracts/pageDoc";
import { sampleDoc } from "../engine/testing/sampleDoc";
import { boundDoc, drawDoc, heroDoc, patch, without } from "../render/testing/drawKit";

/** header/transparent (SPEC-BOUND B-3 · MQ-B1 겹침 없는 면 이음 · 비고정) — [U] KB-AC-07 · 구조. 위치·글자색(KB-AC-08·09)은 브라우저 */
const clear = (base: PageDoc) => boundDoc("header", "transparent", base);
const header = (doc: PageDoc) => drawDoc(doc).querySelector<HTMLElement>('[data-section="header/transparent"]')!;
const imageOff = (doc: PageDoc): PageDoc => {
  const image = doc.sections.find((s) => s.instanceId === "s-hero")!.slots.image as ImageSlotValue;
  return patch(doc, "s-hero", { image: { ...image, enabled: false } });
};
/** [data-surface, 면 클래스, 구분선 클래스 있음] */
const face = (doc: PageDoc) => {
  const h = header(clear(doc));
  const cls = [...h.classList].find((c) => c.startsWith("kit-header--face-"));
  return [h.dataset.surface, cls, h.classList.contains("kit-header--edge")];
};

describe("header/transparent (B-3)", () => {
  it("KB-AC-07: heroTop 표 7행 → header data-surface · 면 클래스(정적 HTML 보존) · 구분선은 값 없음일 때만", () => {
    expect(face(sampleDoc())).toEqual(["bg", "kit-header--face-bg", false]); // fullbleed-left 이미지 켬 = media
    expect(face(imageOff(sampleDoc()))).toEqual(["primary", "kit-header--face-primary", false]);
    for (const v of ["split", "grid", "text"]) {
      expect(face(heroDoc(v, { tone: "alt" })), v).toEqual(["surface", "kit-header--face-surface", false]);
      expect(face(heroDoc(v, { tone: "base" })), v).toEqual(["bg", "kit-header--face-bg", false]);
    }
    expect(face(heroDoc("center", { tone: "base" }))).toEqual(["primary", "kit-header--face-primary", false]);
    expect(face(heroDoc("image", { tone: "alt" }))).toEqual(["bg", "kit-header--face-bg", false]);
    expect(face(imageOff(heroDoc("image", { tone: "alt" })))).toEqual(["surface", "kit-header--face-surface", false]);
    expect(face(without(sampleDoc(), "hero"))).toEqual(["bg", "kit-header--face-bg", true]);
  });

  it("구조: 비고정 변형 클래스 · 바(브랜드 · 바 nav · '메뉴' 버튼) · 시트(닫기 · nav) · CTA 0 · nav '주 메뉴' 두 벌(폭마다 한 벌 — K1-1 방식)", () => {
    const h = header(clear(sampleDoc()));
    expect(h.tagName).toBe("HEADER");
    expect(h.id).toBe("s-s-header");
    expect(h).toHaveClass("kit-header", "kit-header--clear");
    expect(h.querySelectorAll("[data-cta]")).toHaveLength(0);
    const bar = h.querySelector(".kit-bar")!;
    expect([...bar.children].map((el) => el.tagName)).toEqual(["P", "NAV", "BUTTON"]);
    const sheet = h.querySelector<HTMLElement>("[popover]")!;
    expect([...sheet.children].map((el) => el.tagName)).toEqual(["BUTTON", "NAV"]);
    expect(h.querySelectorAll('nav[aria-label="주 메뉴"]')).toHaveLength(2);
  });

  it("nav 빈 값 → 버튼·시트·바 nav 0 · 바에 브랜드만", () => {
    const h = header(patch(clear(sampleDoc()), "s-header", { nav: "" }));
    expect(h.querySelectorAll("nav, button, [popover]")).toHaveLength(0);
    expect(h.querySelector(".kit-bar")!.textContent).toBe("브랜드 이름");
  });
});
