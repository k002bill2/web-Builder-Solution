import type { PlannedSection } from "../domain/generation";
import { hashDoc } from "../engine/ops/hash";
import { validatePageDoc } from "../engine/validate/validatePageDoc";
import { slotRowIssues } from "../engine/gate/slotRows";
import { defaultSlots } from "../engine/sections/defaults";
import { getSectionDefinition } from "../engine/sections/registry";
import { sampleCopyOf } from "./sampleCopy";
import { boardOf, resultsOf } from "../test/compareFixtures";
import { composeCandidates } from "../domain/composeCandidates";
import { GENERATOR_VERSION } from "../domain/generation";
import { buildProfileDraft } from "../domain/profileDraft";
import { SECTION_LIBRARY } from "../domain/sectionLibrary";
import { checkSaveDoc, writeStartDoc, type StartDocInput } from "./startDocWrite";

const s = (type: PlannedSection["type"], variant: string, motion: PlannedSection["motion"] = "L1"): PlannedSection => ({ type, variant, motion });
const SECTIONS: readonly PlannedSection[] = [
  s("header", "sticky-right-cta"),
  s("hero", "split", "L2"),
  s("about", "split", "L2"),
  s("services", "grid-2", "L2"),
  s("portfolio", "masonry"),
  s("contact", "form"),
  s("footer", "biz-extended"),
];
const input = (sections: readonly PlannedSection[] = SECTIONS): StartDocInput =>
  Object.freeze({ candidateId: "B", sections, libraryVersion: "1.4", generatorVersion: "preview-1", profileVersion: 2, projectId: "project-1", updatedAt: "2026-09-27T01:02:03.000Z" });

describe("startDoc 어댑터 (SPEC 8.2.1 ①~④)", () => {
  it("표로 매핑 · motion 전달(정의 상한) · updatedAt = 주입값 · 바뀐 쌍 목록과 알림 1문장", () => {
    const result = writeStartDoc(input());
    if (!result.ok) throw new Error(result.alert);
    const { doc } = result;
    expect(validatePageDoc(doc).ok).toBe(true);
    expect(doc.hash).toBe(hashDoc(doc));
    expect(doc).toMatchObject({ projectId: "project-1", revision: 1, candidateId: "B", profileVersion: 2, updatedAt: "2026-09-27T01:02:03.000Z" });
    expect(doc.sections.map((x) => `${x.type}/${x.variant}/${x.motion}`)).toEqual([
      "header/sticky-right-cta/L1",
      "hero/split/L2",
      "about/story/L2",
      "services/cards-2/L2",
      "portfolio/masonry/L1",
      "contact/form/L1",
      "footer/biz-extended/L0",
    ]);
    expect(result.changes).toEqual([
      { type: "about", from: "split", to: "story" },
      { type: "services", from: "grid-2", to: "cards-2" },
    ]);
    expect(result.changeNotice).toBe(
      "구조안의 섹션 2개를 편집기 변형으로 바꿔 열었습니다 — About 2단 소개 → 이야기 + 이미지 · Services 2열 → 카드 2열",
    );
  });

  it("바뀐 쌍 0개면 알림 없음 · 같은 쌍 여러 섹션은 한 번만 적는다", () => {
    const same = writeStartDoc(input([s("header", "sticky-right-cta"), s("hero", "split"), s("about", "story"), s("services", "list"), s("portfolio", "grid-3"), s("contact", "form"), s("footer", "biz-extended")]));
    expect(same.ok && same.changes).toEqual([]);
    expect(same.ok && same.changeNotice).toBeUndefined();
    const twice = writeStartDoc(input([s("header", "sticky-right-cta"), s("hero", "split"), s("about", "story"), s("services", "grid-3"), s("services", "grid-3"), s("portfolio", "grid-3"), s("contact", "form"), s("footer", "biz-extended")]));
    expect(twice.ok && twice.changes).toEqual([{ type: "services", from: "grid-3", to: "cards-3" }]);
    expect(twice.ok && twice.changeNotice).toBe("구조안의 섹션 2개를 편집기 변형으로 바꿔 열었습니다 — Services 3열 → 카드 3개");
  });

  it("표 밖 쌍 → UNKNOWN_VARIANT (b) 문장 · 엔진 호출 전 거부", () => {
    expect(writeStartDoc(input([...SECTIONS.slice(0, 3), s("about", "gallery"), ...SECTIONS.slice(3)]))).toEqual({
      ok: false,
      reason: "UNKNOWN_VARIANT",
      alert: "이 안에는 편집기가 아직 열 수 없는 섹션이 있습니다(About · gallery) — 다른 안을 고르세요",
    });
    const unknownType = writeStartDoc(input([...SECTIONS, { type: "gallery", variant: "grid", motion: "L1" } as unknown as PlannedSection]));
    expect(unknownType).toMatchObject({ ok: false, reason: "UNKNOWN_VARIANT", alert: expect.stringContaining("(gallery · grid)") });
  });

  it("엔진 예외(BAD_VALUE — 구조 R-01·R-02·검증) → 쓰기 대신 (b) 다른 문장", () => {
    expect(writeStartDoc(input(SECTIONS.filter((x) => x.type !== "footer")))).toEqual({
      ok: false,
      reason: "BAD_VALUE",
      alert: "이 안으로 편집 문서를 만들 수 없습니다 — 다른 안을 고르세요",
    });
    expect(writeStartDoc({ ...input(), updatedAt: "어제" })).toMatchObject({ ok: false, reason: "BAD_VALUE" });
  });
});

describe("3안 그리드 차이 보존 (Q-21 후속 · SPEC r4.6 A3-Q3)", () => {
  it("같은 픽스처 3안(그리드 축만 다름) → startDoc 문서 3개의 services 변형이 서로 다르다", () => {
    const ids = ["ref-a", "ref-b", "ref-c", "ref-d", "ref-e", "ref-f"];
    const draft = buildProfileDraft(boardOf(ids, { hero: "ref-a" }), resultsOf(ids), SECTION_LIBRARY.version);
    if (draft.status !== "ready") throw new Error("Hero 선택이 필요합니다");
    const plans = composeCandidates({ profile: draft.profile, purpose: "none", contrast: "aa", library: SECTION_LIBRARY, generatorVersion: GENERATOR_VERSION }).map((r) => {
      if (r.status !== "succeeded") throw new Error(`${r.id}안 실패`);
      return r.plan;
    });
    expect(plans.map((p) => p.axes.grid)).toEqual(["grid-3", "grid-2", "masonry"]);
    const services = plans.map((p) => {
      const made = writeStartDoc(input(p.sections));
      if (!made.ok) throw new Error(made.alert);
      return made.doc.sections.filter((x) => x.type === "services").map((x) => x.variant);
    });
    expect(services).toEqual([["cards-3"], ["cards-2"], ["cards-masonry"]]);
  });

  it("masonryFirst 구조안(portfolio가 첫 그리드 섹션) → 3안 portfolio 변형이 서로 다르다 (r4.7 A3-Q6 · composeCandidates.test 134-135행)", () => {
    const ids = ["ref-a", "ref-b", "ref-c", "ref-d", "ref-e", "ref-f"];
    const draft = buildProfileDraft(boardOf(ids, { hero: "ref-a" }), resultsOf(ids), SECTION_LIBRARY.version);
    if (draft.status !== "ready") throw new Error("Hero 선택이 필요합니다");
    const e = (type: PlannedSection["type"], variant: string) => ({ type, variant });
    const profile = {
      ...draft.profile,
      seed: "00000002",
      section_plan: [e("header", "transparent"), e("hero", "fullbleed-left"), e("portfolio", "masonry"), e("services", "grid-3"), e("about", "split"), e("contact", "form"), e("footer", "biz-extended")],
    };
    const plans = composeCandidates({ profile, purpose: "none", contrast: "aa", library: SECTION_LIBRARY, generatorVersion: GENERATOR_VERSION }).map((r) => {
      if (r.status !== "succeeded") throw new Error(`${r.id}안 실패`);
      return r.plan;
    });
    expect(plans.map((p) => p.axes.grid)).toEqual(["masonry", "grid-3", "grid-2"]);
    const portfolio = plans.map((p) => {
      const made = writeStartDoc(input(p.sections));
      if (!made.ok) throw new Error(made.alert);
      return made.doc.sections.filter((x) => x.type === "portfolio").map((x) => x.variant);
    });
    expect(portfolio).toEqual([["masonry"], ["grid-3"], ["grid-2"]]);
  });
});

describe("saveDoc 모양 검사 (8.3 판정 1 — L4 검증 함수)", () => {
  const made = writeStartDoc(input());
  const doc = made.ok ? made.doc : undefined!;
  it("통과 · 다른 프로젝트 id · 해시 불일치 · 모양 오류는 거부", () => {
    expect(checkSaveDoc("project-1", doc)).toEqual({ ok: true, doc });
    expect(checkSaveDoc("project-2", doc)).toMatchObject({ ok: false });
    expect(checkSaveDoc("project-1", { ...doc, meta: { title: "바뀜", description: "" } })).toMatchObject({ ok: false, message: expect.stringContaining("hash") });
    expect(checkSaveDoc("project-1", { ...doc, sections: "x" })).toMatchObject({ ok: false });
    expect(checkSaveDoc("project-1", null)).toMatchObject({ ok: false });
  });
});

describe("예시 문구 채우기 (SPEC r4.7 A3-Q8 · V4)", () => {
  const ids = ["ref-a", "ref-b", "ref-c", "ref-d", "ref-e", "ref-f"];
  const docs = ids.flatMap((hero) => {
    const draft = buildProfileDraft(boardOf(ids, { hero }), resultsOf(ids), SECTION_LIBRARY.version);
    if (draft.status !== "ready") throw new Error("Hero 선택이 필요합니다");
    return composeCandidates({ profile: draft.profile, purpose: "none", contrast: "aa", library: SECTION_LIBRARY, generatorVersion: GENERATOR_VERSION }).map((r) => {
      if (r.status !== "succeeded") throw new Error(`${r.id}안 실패`);
      const made = writeStartDoc(input(r.plan.sections));
      if (!made.ok) throw new Error(made.alert);
      return made.doc;
    });
  });

  it("픽스처 6 × 3안 새 문서 — 텍스트 슬롯 빈 값 0 · 예시 문구가 들어감 · 게이트 글자 수 문제 0 · 모양·해시 유효", () => {
    expect(docs).toHaveLength(18);
    for (const doc of docs) {
      expect(validatePageDoc(doc).ok).toBe(true);
      expect(doc.hash).toBe(hashDoc(doc));
      expect(checkSaveDoc("project-1", doc).ok).toBe(true);
      expect(slotRowIssues(doc).textLength).toEqual([]);
      for (const section of doc.sections) {
        for (const slot of getSectionDefinition(section.type, section.variant)!.slots.filter((x) => x.kind !== "image")) {
          const value = section.slots[slot.key];
          expect(typeof value === "string" && value.trim() !== "", `${section.instanceId}.${slot.key}`).toBe(true);
          const sample = sampleCopyOf(section.type, slot.key);
          if (sample !== undefined) expect(value, `${section.instanceId}.${slot.key}`).toBe(sample);
        }
      }
    }
    expect(docs[0]!.sections.find((x) => x.type === "hero")!.slots.title).toBe(sampleCopyOf("hero", "title"));
  });

  it("재진입 멱등 — 같은 입력 두 번 → 같은 문서·해시 (E-AC-40~42 전제)", () => {
    const a = writeStartDoc(input());
    const b = writeStartDoc(input());
    expect(a.ok && b.ok && a.doc).toEqual(b.ok && b.doc);
  });

  it("섹션 추가·변형 교체 기본값(엔진 defaultText)은 그대로 — E-AC-24 불변", () => {
    const hero = getSectionDefinition("hero", "split")!;
    expect(defaultSlots(hero).title).toBe("한 문장으로 소개하는 제목");
    expect(sampleCopyOf("hero", "title")).not.toBe("한 문장으로 소개하는 제목");
  });
});
