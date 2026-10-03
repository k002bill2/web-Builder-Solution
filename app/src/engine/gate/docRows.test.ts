import type { ImageSlotValue, SectionInstance, SectionMotion } from "../contracts/pageDoc";
import type { GateRowId } from "../contracts/records";
import { REASONS } from "../ops/reasons";
import { passingDoc, rowOf, withAlt, withPhoto, withSlot } from "../testing/gateKit";
import { SAMPLE_SECTIONS, section, withSections } from "../testing/sampleDoc";
import { sampleTheme } from "../testing/sampleTheme";
import type { GateTheme } from "../contracts/pending";
import { GATE_TEXT, overMax, overRecommended } from "./gateText";
import { runGate } from "./runGate";

const NONE = sampleTheme();
const header = SAMPLE_SECTIONS[0]!;
const footer = SAMPLE_SECTIONS.at(-1)!;
const byId = (id: string) => withAlt(SAMPLE_SECTIONS.find((s) => s.instanceId === id)!);
const body = (n: number) => Array.from({ length: n }, (_, i) => section("faq", "accordion", `b${i}`));
const hero = byId("s-hero");
const cta = byId("s-cta");
const contact = byId("s-contact");

/** 섹션 목록으로 통과 문서를 만들어 한 줄만 본다 */
const gateRow = (sections: readonly SectionInstance[], id: GateRowId, theme: GateTheme = NONE) =>
  rowOf(runGate(withSections(passingDoc(), sections), theme), id);
const docRow = (id: GateRowId, over: Parameters<typeof passingDoc>[0], theme: GateTheme = NONE) => rowOf(runGate(passingDoc(over), theme), id);
const replace = (id: string, next: SectionInstance) => passingDoc().sections.map((s) => (s.instanceId === id ? next : s));
const image = (s: SectionInstance, key = "image") => s.slots[key] as ImageSlotValue;

describe("대체텍스트 줄 (R-09)", () => {
  // r4.11: 이미지 없이 프로필 색 그라디언트로 그려지는 슬롯(플레이스홀더 · aria-hidden 장식)은 R-09 대상이 아니다
  it("r4.11 — 이미지 없음(플레이스홀더) 슬롯은 대체텍스트가 비어도 차단·경고 0 (샘플 기본 alt '' 그대로)", () => {
    const row = gateRow(SAMPLE_SECTIONS, "alt-text");
    expect(row).toEqual({ id: "alt-text", state: "pass", issues: [] });
    expect(rowOf(runGate(withSections(passingDoc(), SAMPLE_SECTIONS), NONE), "text-length").issues.filter((i) => i.slotKey === "image")).toEqual([]);
  });

  it("block — 실제 이미지가 든 켜진 슬롯의 대체텍스트 빈 값(샘플 기본 alt '')마다 1건 (r4.11 — 이미지 id를 넣은 슬롯)", () => {
    const row = gateRow(SAMPLE_SECTIONS.map((s) => (s.instanceId === "s-hero" || s.instanceId === "s-about" ? withPhoto(s) : s)), "alt-text");
    expect(row.state).toBe("block");
    expect(row.issues.map((i) => [i.ruleId, i.severity, i.instanceId, i.slotKey])).toEqual([
      ["R-09", "block", "s-hero", "image"],
      ["R-09", "block", "s-about", "image"],
    ]);
    expect(row.issues[0]!.cause).toBe("Hero 대표 이미지: 대체텍스트가 없습니다");
  });

  it("공백만 있는 대체텍스트도 빈 값", () => {
    const blank = withSlot(withPhoto(hero), "image", { ...image(withPhoto(hero)), alt: "  " });
    expect(gateRow(replace("s-hero", blank), "alt-text").issues).toHaveLength(1);
  });

  it("pass — 장식 표시 · 꺼진 슬롯 · 대체텍스트 있음 (r4.11 — 실제 이미지가 든 슬롯으로)", () => {
    const raw = withPhoto(SAMPLE_SECTIONS.find((s) => s.instanceId === "s-hero")!);
    const decorative = withSlot(raw, "image", { ...image(raw), decorative: true });
    const off = withSlot(raw, "image", { ...image(raw), enabled: false });
    expect(gateRow(replace("s-hero", raw), "alt-text").state).toBe("block");
    for (const next of [decorative, off, withPhoto(hero)]) expect(gateRow(replace("s-hero", next), "alt-text").state).toBe("pass");
  });
});

describe("헤딩 순서 줄 (R-10 — 섹션 정의 헤딩 수준을 문서 순서로)", () => {
  it("pass — h1(Hero) 뒤 h2들", () => {
    expect(docRow("heading-order", {}).state).toBe("pass");
  });

  it("block — Hero 없음 = h1 없음", () => {
    const row = gateRow(passingDoc().sections.filter((s) => s.type !== "hero"), "heading-order");
    expect(row.state).toBe("block");
    expect(row.issues.map((i) => i.cause)).toContain(GATE_TEXT.headingNoH1);
  });

  it("block — 본문이 Hero보다 먼저: 첫 헤딩 h2 = 건너뛰기, 그 섹션을 가리킨다", () => {
    const [h, heroS, about, ...rest] = passingDoc().sections;
    const row = gateRow([h!, about!, heroS!, ...rest], "heading-order");
    expect(row.state).toBe("block");
    expect(row.issues[0]).toMatchObject({ ruleId: "R-10", severity: "block", instanceId: "s-about" });
  });

  it("block — h1 둘(Hero 2개): 두 번째 Hero를 가리킨다", () => {
    const sections = passingDoc().sections;
    const row = gateRow([sections[0]!, hero, { ...hero, instanceId: "s-hero-2" }, ...sections.slice(2)], "heading-order");
    expect(row.issues.map((i) => i.instanceId)).toEqual(["s-hero-2"]);
  });
});

describe("필수 섹션 줄 (R-01·R-02·R-03·R-04·R-12)", () => {
  const causes = (sections: readonly SectionInstance[], theme: GateTheme = NONE) => gateRow(sections, "required-sections", theme).issues.map((i) => `${i.ruleId} ${i.cause}`);

  it("pass — 샘플(본문 6 · 사업자정보 Footer) · 목적 없음", () => {
    expect(docRow("required-sections", {}).state).toBe("pass");
  });

  it("R-01 — Header 없음 · Footer 없음 · 본문 4 · 본문 10 · Footer 둘", () => {
    const bodyOf = (n: number) => [header, hero, ...body(n - 1), footer];
    expect(causes(passingDoc().sections.slice(1))).toContain(`R-01 ${REASONS.removeHeader}`);
    expect(causes(passingDoc().sections.slice(0, -1))).toContain(`R-01 ${REASONS.removeFooter}`);
    expect(causes(bodyOf(4))).toEqual([`R-01 ${GATE_TEXT.bodyTooFew(4)}`]);
    expect(causes(bodyOf(5))).toEqual([]);
    expect(causes(bodyOf(9))).toEqual([]);
    expect(causes(bodyOf(10))).toEqual([`R-01 ${GATE_TEXT.bodyTooMany(10)}`]);
    expect(causes([...bodyOf(5), { ...footer, instanceId: "f2" }])).toContain(`R-01 ${REASONS.addFooterOnce}`);
  });

  it("R-01 — Header가 맨 위가 아니거나 Footer가 맨 아래가 아니면 차단", () => {
    const [h, ...rest] = passingDoc().sections;
    expect(causes([rest[0]!, h!, ...rest.slice(1)])).toContain(`R-01 ${REASONS.moveHeader}`);
    const f = rest.at(-1)!;
    expect(causes([h!, ...rest.slice(0, 3), f, ...rest.slice(3, -1)])).toContain(`R-01 ${REASONS.moveFooter}`);
  });

  it("R-02 — Hero 없음 · Hero가 첫 본문이 아님 · Hero 둘", () => {
    const [h, heroS, about, ...rest] = passingDoc().sections;
    expect(causes([h!, about!, ...rest])).toContain(`R-02 ${REASONS.removeHero}`);
    const row = gateRow([h!, about!, heroS!, ...rest], "required-sections");
    expect(row.issues.map((i) => [i.ruleId, i.instanceId, i.cause])).toEqual([["R-02", "s-hero", REASONS.moveHero]]);
    expect(causes([h!, heroS!, { ...heroS!, instanceId: "h2" }, about!, ...rest])).toContain(`R-02 ${REASONS.addHeroOnce}`);
  });

  describe("R-03 목적 '문의' — cta-band·contact 1개 이상이 후반 1/3(본문 = Hero 포함 기준)", () => {
    const inquiry = sampleTheme({ purpose: "inquiry" });
    /** 본문 n개 중 index 자리에 contact */
    const withInquiryAt = (n: number, index: number) => {
      const bodies = [hero, ...body(n - 1)];
      return [header, ...bodies.map((s, i) => (i === index ? contact : s)), footer];
    };

    it("본문 6 — 후반 1/3 = 뒤 2개(index 4·5): index 4 pass · index 3 block", () => {
      expect(gateRow(withInquiryAt(6, 4), "required-sections", inquiry).state).toBe("pass");
      const row = gateRow(withInquiryAt(6, 3), "required-sections", inquiry);
      expect(row.issues.map((i) => [i.ruleId, i.instanceId, i.cause])).toEqual([["R-03", "s-contact", GATE_TEXT.inquiryNotLate]]);
    });

    it("본문 7 — 후반 1/3 = 뒤 3개(index 4~6): index 4 pass · index 3 block", () => {
      expect(gateRow(withInquiryAt(7, 4), "required-sections", inquiry).state).toBe("pass");
      expect(gateRow(withInquiryAt(7, 3), "required-sections", inquiry).state).toBe("block");
    });

    it("문의 섹션 없음 → 5.4 R-03 문장 · cta-band 하나로도 충족", () => {
      const none = [header, hero, ...body(5), footer];
      expect(causes(none, inquiry)).toEqual([`R-03 ${REASONS.removeInquiry}`]);
      expect(gateRow([header, hero, ...body(4), cta, footer], "required-sections", inquiry).state).toBe("pass");
    });

    it("목적이 '문의'가 아니면 R-03을 보지 않는다", () => {
      expect(gateRow(withInquiryAt(6, 1), "required-sections", NONE).state).toBe("pass");
      expect(gateRow(withInquiryAt(6, 1), "required-sections", sampleTheme({ purpose: "sales" })).state).toBe("pass");
    });
  });

  it("R-04 목적 '예약' — Contact(예약 변형) 없으면 5.4 R-04 문장, 있으면 pass", () => {
    const booking = sampleTheme({ purpose: "booking" });
    expect(causes(passingDoc().sections, booking)).toEqual([`R-04 ${REASONS.removeBooking}`]);
    const withBooking = replace("s-contact", section("contact", "booking", "s-contact"));
    expect(gateRow(withBooking, "required-sections", booking).state).toBe("pass");
  });

  it("R-12 — 사업자정보 없는 Footer 변형이면 E-S14 문장 · 그 Footer를 가리킨다", () => {
    const row = gateRow(replace("s-footer", section("footer", "minimal", "s-footer")), "required-sections");
    expect(row.issues.map((i) => [i.ruleId, i.instanceId, i.cause])).toEqual([["R-12", "s-footer", GATE_TEXT.footerBusinessInfo]]);
  });

  it("모르는 변형 섹션 — throw 없이 차단, 다른 줄은 그 섹션을 건너뛴다", () => {
    const unknown = { ...byId("s-about"), variant: "no-such" };
    const report = runGate(withSections(passingDoc(), replace("s-about", unknown)), NONE);
    const row = rowOf(report, "required-sections");
    expect(row.issues.map((i) => [i.ruleId, i.instanceId, i.cause])).toEqual([["R-01", "s-about", GATE_TEXT.unknownVariant]]);
    expect(rowOf(report, "text-length").state).toBe("pass");
  });
});

describe("모션 예산 줄 (R-07 — L2 ≤ 3 · L3 = 0)", () => {
  const motions = (list: readonly SectionMotion[]) => passingDoc().sections.map((s, i) => ({ ...s, motion: list[i] ?? "L0" }));

  it("pass — L2 3개", () => {
    expect(gateRow(motions(["L0", "L2", "L2", "L2", "L1"]), "motion-budget").state).toBe("pass");
  });

  it("block — L2 4개: 4번째 L2 섹션을 가리킨다", () => {
    const row = gateRow(motions(["L0", "L2", "L2", "L2", "L2"]), "motion-budget");
    expect(row.issues.map((i) => [i.ruleId, i.severity, i.instanceId, i.cause])).toEqual([["R-07", "block", "s-faq", GATE_TEXT.motionL2Over(4)]]);
  });

  it("block — L3(타입 밖 값)는 1개도 차단", () => {
    const row = gateRow(motions(["L0", "L3" as SectionMotion]), "motion-budget");
    expect(row.issues.map((i) => [i.instanceId, i.cause])).toEqual([["s-hero", GATE_TEXT.motionL3]]);
  });
});

describe("SEO 메타 줄 (R-11 — 제목·설명, canonical 제외)", () => {
  const meta = (title: string, description: string) => docRow("seo-meta", { meta: { title, description } });

  it("pass — 둘 다 있고 권장 이하(제목 60 · 설명 160자)", () => {
    expect(meta("가".repeat(60), "나".repeat(160)).state).toBe("pass");
  });

  it("block — 빈 값·공백: '제목 없음' · '설명 없음'", () => {
    const row = meta(" ", "");
    expect(row.state).toBe("block");
    expect(row.issues.map((i) => [i.ruleId, i.severity, i.slotKey, i.cause])).toEqual([
      ["R-11", "block", "title", GATE_TEXT.seoTitleEmpty],
      ["R-11", "block", "description", GATE_TEXT.seoDescriptionEmpty],
    ]);
  });

  it("warn — 권장 길이 초과(제목 61 · 설명 161자)", () => {
    const row = meta("가".repeat(61), "나".repeat(161));
    expect(row.state).toBe("warn");
    expect(row.issues.map((i) => [i.severity, i.cause])).toEqual([
      ["warn", overRecommended("제목", 61, 60)],
      ["warn", overRecommended("설명", 161, 160)],
    ]);
  });

  it("block이 warn보다 앞선다 — 제목 빈 값 + 설명 초과 = block", () => {
    expect(meta("", "나".repeat(161)).state).toBe("block");
  });
});

describe("글자 수 줄 (R-13 상한·필수 빈 값 + FR-EDT-05 권장 경고)", () => {
  const heroWith = (key: string, value: string) => gateRow(replace("s-hero", withSlot(hero, key, value)), "text-length");

  it("block — 상한 초과: 5.6 필드 문장을 원인에 담는다", () => {
    const row = heroWith("title", "가".repeat(46));
    expect(row.state).toBe("block");
    expect(row.issues).toEqual([
      { ruleId: "R-13", severity: "block", instanceId: "s-hero", slotKey: "title", cause: `Hero 제목: ${overMax(40, 46)}`, alternative: GATE_TEXT.shortenTo(40) },
    ]);
  });

  it("block — 필수 빈 값 · 공백 · 키 없음(없는 키 = 빈 값)", () => {
    expect(heroWith("title", "   ").issues.map((i) => i.cause)).toEqual([`Hero 제목: ${GATE_TEXT.requiredEmpty}`]);
    const slots = Object.fromEntries(Object.entries(hero.slots).filter(([key]) => key !== "title"));
    expect(gateRow(replace("s-hero", { ...hero, slots }), "text-length").issues.map((i) => i.slotKey)).toEqual(["title"]);
  });

  it("warn — 권장 초과(상한 이하): FR-EDT-05, 5.7 문장 틀", () => {
    const row = heroWith("title", "가".repeat(30));
    expect(row.state).toBe("warn");
    expect(row.issues.map((i) => [i.ruleId, i.severity, i.cause])).toEqual([["FR-EDT-05", "warn", `Hero ${overRecommended("제목", 30, 28)}`]]);
  });

  it("글자 수는 코드 포인트 — 이모지 40개는 상한 40 이내(권장 초과 경고만)", () => {
    expect(heroWith("title", "😀".repeat(40)).state).toBe("warn");
  });

  it("block + warn 섞이면 block · 이슈는 섹션 순서 → 스키마 슬롯 순서", () => {
    const next = withSlot(withSlot(hero, "cta", "가".repeat(17)), "title", "가".repeat(30));
    const row = gateRow(replace("s-hero", next), "text-length");
    expect(row.state).toBe("block");
    expect(row.issues.map((i) => [i.slotKey, i.severity])).toEqual([["title", "warn"], ["cta", "block"]]);
  });

  it("이미지 대체텍스트 상한(120자) 초과 = block · 장식이면 보지 않는다", () => {
    const photo = withPhoto(hero);
    const long = withSlot(photo, "image", { ...image(photo), alt: "가".repeat(121) });
    expect(gateRow(replace("s-hero", long), "text-length").issues.map((i) => [i.slotKey, i.ruleId])).toEqual([["image", "R-13"]]);
    const deco = withSlot(photo, "image", { ...image(photo), alt: "가".repeat(121), decorative: true });
    expect(gateRow(replace("s-hero", deco), "text-length").state).toBe("pass");
  });
});
