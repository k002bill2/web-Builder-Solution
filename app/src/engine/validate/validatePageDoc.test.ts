import { sampleDoc } from "../testing/sampleDoc";
import { LIMITS, validatePageDoc } from "./validatePageDoc";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 테스트: JSON 왕복 값을 틀린 모양으로 자유롭게 고친다
type Loose = any;

/** 문서를 JSON으로 왕복한 뒤 고친다 — 저장 경계로 들어오는 값과 같은 모양(평범한 객체) */
function raw(edit?: (doc: Loose) => void): unknown {
  const doc: Loose = JSON.parse(JSON.stringify(sampleDoc()));
  edit?.(doc);
  return doc;
}

function issuesOf(input: unknown): string[] {
  const result = validatePageDoc(input);
  if (result.ok) throw new Error("통과하면 안 된다");
  expect(result.code).toBe("SCHEMA_INVALID");
  return result.issues.map((i) => i.path);
}

describe("validatePageDoc — 통과", () => {
  it("올바른 문서는 통과하고 같은 내용의 새(동결) 사본을 돌려준다", () => {
    const input = raw();
    const result = validatePageDoc(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual(input);
    expect(result.value).not.toBe(input);
    expect(Object.isFrozen(result.value.sections[0]?.slots)).toBe(true);
  });

  it("게이트 몫은 통과시킨다: 상한 초과 · 필수 빈 값 · 슬롯 키 누락 · 본문 4개", () => {
    const input = raw((d) => {
      d.sections[1].slots.title = "가".repeat(80); // 상한 40 초과(R-13은 게이트)
      d.sections[2].slots.heading = ""; // 필수 빈 값
      delete d.sections[3].slots.intro; // 키 누락 = 빈 값
      d.sections.splice(4, 1); // 본문 5 → 4 (R-01은 게이트)
    });
    expect(validatePageDoc(input).ok).toBe(true);
  });

  it("로컬 이미지 참조·이미지 끔·장식 표시를 통과시킨다", () => {
    const input = raw((d) => {
      d.sections[1].slots.image = { kind: "image", enabled: false, source: { kind: "local", assetId: "asset_01" }, alt: "", decorative: true };
    });
    expect(validatePageDoc(input).ok).toBe(true);
  });
});

describe("validatePageDoc — 거부", () => {
  it.each([null, 1, "doc", [], undefined])("객체가 아닌 값 %j", (input) => {
    expect(issuesOf(input)).toEqual(["$"]);
  });

  it("필드 누락", () => {
    expect(issuesOf(raw((d) => delete d.meta))).toContain("$.meta");
    expect(issuesOf(raw((d) => delete d.sections[0].motion))).toContain("$.sections[0].motion");
  });

  it("타입 틀림", () => {
    expect(issuesOf(raw((d) => (d.revision = "3")))).toContain("$.revision");
    expect(issuesOf(raw((d) => (d.revision = -1)))).toContain("$.revision");
    expect(issuesOf(raw((d) => (d.profileVersion = 1.5)))).toContain("$.profileVersion");
    expect(issuesOf(raw((d) => (d.sections[0].slots.brand = 7)))).toContain("$.sections[0].slots.brand");
    expect(issuesOf(raw((d) => (d.sections = {})))).toContain("$.sections");
    expect(issuesOf(raw((d) => (d.meta = [])))).toContain("$.meta");
  });

  it("모르는 키(모든 층)", () => {
    expect(issuesOf(raw((d) => (d.extra = 1)))).toContain("$.extra");
    expect(issuesOf(raw((d) => (d.meta.canonical = "x")))).toContain("$.meta.canonical");
    expect(issuesOf(raw((d) => (d.sections[0].extra = 1)))).toContain("$.sections[0].extra");
    expect(issuesOf(raw((d) => (d.sections[1].slots.image.url = "x")))).toContain("$.sections[1].slots.image.url");
  });

  it("모르는 type·variant · 모르는 motion·tone", () => {
    expect(issuesOf(raw((d) => (d.sections[2].type = "gallery")))).toContain("$.sections[2].type");
    expect(issuesOf(raw((d) => (d.sections[2].variant = "nope")))).toContain("$.sections[2].variant");
    expect(issuesOf(raw((d) => (d.sections[2].motion = "L3")))).toContain("$.sections[2].motion");
    expect(issuesOf(raw((d) => (d.sections[2].tone = "dark")))).toContain("$.sections[2].tone");
  });

  it("스키마 밖 슬롯 키 · 종류 불일치", () => {
    expect(issuesOf(raw((d) => (d.sections[1].slots.badge = "새 슬롯")))).toContain("$.sections[1].slots.badge");
    expect(issuesOf(raw((d) => (d.sections[1].slots.title = { kind: "image" })))).toContain("$.sections[1].slots.title");
    expect(issuesOf(raw((d) => (d.sections[1].slots.image = "그림")))).toContain("$.sections[1].slots.image");
  });

  it("길이 상한: 글자 · 섹션 수 · id", () => {
    expect(issuesOf(raw((d) => (d.sections[1].slots.title = "가".repeat(LIMITS.text + 1))))).toContain("$.sections[1].slots.title");
    expect(issuesOf(raw((d) => (d.meta.title = "a".repeat(LIMITS.text + 1))))).toContain("$.meta.title");
    expect(issuesOf(raw((d) => (d.sections = Array.from({ length: LIMITS.sections + 1 }, () => d.sections[2]))))).toContain("$.sections");
    expect(issuesOf(raw((d) => (d.projectId = "p".repeat(LIMITS.id + 1))))).toContain("$.projectId");
  });

  it("instanceId 중복 · 빈 id", () => {
    expect(issuesOf(raw((d) => (d.sections[3].instanceId = d.sections[2].instanceId)))).toContain("$.sections[3].instanceId");
    expect(issuesOf(raw((d) => (d.sections[3].instanceId = "")))).toContain("$.sections[3].instanceId");
  });

  it.each(["https://example.test/a.png", "//cdn/a.png", "data:image/png;base64,AAAA", "../a.png"])(
    "이미지 출처에 URL·경로 문자열 %s 거부",
    (assetId) => {
      const path = "$.sections[1].slots.image.source.assetId";
      expect(issuesOf(raw((d) => (d.sections[1].slots.image.source = { kind: "local", assetId })))).toContain(path);
    },
  );

  it("이미지 출처 kind 판별 — 모르는 kind · 다른 kind의 필드", () => {
    expect(issuesOf(raw((d) => (d.sections[1].slots.image.source = { kind: "url", href: "x" })))).toContain("$.sections[1].slots.image.source.kind");
    expect(
      issuesOf(raw((d) => (d.sections[1].slots.image.source = { kind: "placeholder", patternId: "diagonal", assetId: "a" }))),
    ).toContain("$.sections[1].slots.image.source.assetId");
  });
});

describe("validatePageDoc — 프로토타입 오염 키", () => {
  const BAD = ["__proto__", "constructor", "prototype"];
  const doc = JSON.stringify(sampleDoc());

  it.each(BAD)("루트 %s", (key) => {
    const input = JSON.parse(doc.replace('{"projectId"', `{"${key}":{"polluted":true},"projectId"`));
    expect(Object.keys(input)).toContain(key);
    expect(issuesOf(input)).toContain(`$.${key}`);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it.each(BAD)("slots 안 %s", (key) => {
    const input = JSON.parse(doc.replace('"slots":{"brand"', `"slots":{"${key}":"x","brand"`));
    expect(issuesOf(input)).toContain(`$.sections[0].slots.${key}`);
  });

  it.each(BAD)("meta · 이미지 값 · source 안 %s", (key) => {
    const input = JSON.parse(
      doc
        .replace('"meta":{', `"meta":{"${key}":1,`)
        .replace('"image":{"kind":"image"', `"image":{"${key}":1,"kind":"image"`)
        .replace('"source":{"kind"', `"source":{"${key}":1,"kind"`),
    );
    const paths = issuesOf(input);
    expect(paths).toContain(`$.meta.${key}`);
    expect(paths).toContain(`$.sections[1].slots.image.${key}`);
    expect(paths).toContain(`$.sections[1].slots.image.source.${key}`);
  });

  it("평범한 객체가 아닌 값(클래스 인스턴스·Map)을 거부", () => {
    expect(issuesOf(new Map())).toEqual(["$"]);
    expect(issuesOf(raw((d) => (d.meta = new Date(0))))).toContain("$.meta");
  });
});
