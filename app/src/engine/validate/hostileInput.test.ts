/**
 * 저장 경계 검증기는 어떤 입력에도 throw하지 않는다 (Codex j1 medium 3) — getter·Proxy·순환·깊이 초과 → SCHEMA_INVALID.
 */
import { sampleDoc } from "../testing/sampleDoc";
import { validatePageDoc } from "./validatePageDoc";
import { validateProjectName } from "./validateProjectName";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 테스트: JSON 왕복 값을 틀린 모양으로 자유롭게 고친다
type Loose = any;

const raw = (edit?: (doc: Loose) => void): Loose => {
  const doc: Loose = JSON.parse(JSON.stringify(sampleDoc()));
  edit?.(doc);
  return doc;
};

const boom = () => {
  throw new Error("boom");
};
/** 모든 trap이 throw하는 Proxy — 핸들러 자체도 Proxy라 어떤 trap 이름을 읽어도 throw하는 함수를 준다 */
const hostile = (): object => new Proxy({}, new Proxy({}, { get: () => boom }));
const revoked = (): object => {
  const { proxy, revoke } = Proxy.revocable({}, {});
  revoke();
  return proxy;
};

/** throw 0 + SCHEMA_INVALID. 문제 경로를 돌려준다 */
function rejected(input: unknown): string[] {
  let result: ReturnType<typeof validatePageDoc> | undefined;
  expect(() => (result = validatePageDoc(input))).not.toThrow();
  expect(result).toMatchObject({ ok: false, code: "SCHEMA_INVALID" });
  return result && !result.ok ? result.issues.map((i) => i.path) : [];
}

describe("validatePageDoc — 접근자 속성(getter·setter)", () => {
  it("throw하는 getter(루트·섹션·슬롯) → SCHEMA_INVALID", () => {
    rejected(Object.defineProperty(raw(), "projectId", { get: boom, enumerable: true }));
    rejected(raw((d) => Object.defineProperty(d.sections[0], "variant", { get: boom, enumerable: true })));
    rejected(raw((d) => Object.defineProperty(d.sections[1].slots, "title", { get: boom, enumerable: true })));
  });

  it("값을 돌려주는 getter도 거부하고 부르지 않는다", () => {
    const get = vi.fn(() => "project-1");
    const paths = rejected(Object.defineProperty(raw((d) => delete d.projectId), "projectId", { get, enumerable: true }));
    expect(paths).toContain("$.projectId");
    expect(get).not.toHaveBeenCalled();
  });

  it("setter만 있는 필드(읽으면 undefined)를 통과시키지 않는다", () => {
    const paths = rejected(Object.defineProperty(raw((d) => delete d.projectId), "projectId", { set: () => undefined, enumerable: true }));
    expect(paths).toContain("$.projectId");
  });

  it("값이 undefined인 데이터 속성 = 누락", () => {
    expect(rejected(raw((d) => (d.projectId = undefined)))).toContain("$.projectId");
    expect(rejected(raw((d) => (d.sections[1].slots.image.alt = undefined)))).toContain("$.sections[1].slots.image.alt");
    expect(rejected(raw((d) => (d.sections[1].slots.title = undefined)))).toContain("$.sections[1].slots.title");
  });

  it("배열 원소 getter · 심볼 키", () => {
    rejected(raw((d) => Object.defineProperty(d.sections, 2, { get: boom, enumerable: true })));
    expect(rejected(raw((d) => (d.meta[Symbol("x")] = 1)))).toContain("$.meta");
  });
});

describe("validatePageDoc — Proxy", () => {
  it.each([
    ["루트", (): unknown => hostile()],
    ["meta", () => raw((d) => (d.meta = hostile()))],
    ["sections", () => raw((d) => (d.sections = new Proxy([], new Proxy({}, { get: () => boom }))))],
    ["섹션", () => raw((d) => (d.sections[2] = hostile()))],
    ["slots", () => raw((d) => (d.sections[1].slots = hostile()))],
    ["이미지 source", () => raw((d) => (d.sections[1].slots.image.source = hostile()))],
  ])("모든 trap이 throw하는 Proxy — %s", (_, make) => {
    rejected(make());
  });

  it.each([
    ["루트", (): unknown => revoked()],
    ["sections", () => raw((d) => (d.sections = revoked()))],
    ["slots", () => raw((d) => (d.sections[1].slots = revoked()))],
  ])("폐기된 Proxy — %s", (_, make) => {
    rejected(make());
  });

  it("ownKeys가 거짓말하는 Proxy — 없는 키를 보고 · 있는 키를 숨김 · get이 다른 값을 줌", () => {
    const target = raw();
    rejected(new Proxy(target, { ownKeys: () => [...Reflect.ownKeys(target), "ghost"] }));
    rejected(new Proxy(target, { ownKeys: () => ["projectId"] }));
    const get = vi.fn(() => "project-1");
    rejected(new Proxy(raw((d) => (d.projectId = 7)), { get }));
    expect(get).not.toHaveBeenCalled();
  });
});

describe("validatePageDoc — 배열 사본 일관성 (Codex j2 medium · Proxy 판별 없이 사본 단계에서)", () => {
  /** 섹션 배열만 Proxy로 감싼 문서 — 적지 않은 trap은 실제 배열로 넘어간다 */
  const sectionsProxy = (handler: (target: Loose[]) => ProxyHandler<Loose[]>) => raw((d) => (d.sections = new Proxy(d.sections, handler(d.sections))));
  /** length descriptor만 거짓으로(나머지 descriptor는 실제 배열) */
  const lyingLength = (length: number) => (target: Loose[], key: string | symbol) =>
    key === "length" ? { value: length, writable: true, enumerable: false, configurable: false } : Reflect.getOwnPropertyDescriptor(target, key);

  it("거짓 length 0 + 실제 원소(ownKeys ['length']) — 빈 사본으로 통과시키지 않는다", () => {
    expect(rejected(sectionsProxy(() => ({ getOwnPropertyDescriptor: lyingLength(0), ownKeys: () => ["length"] })))).toContain("$.sections");
  });

  it("거짓 length 2 + ownKeys 0·1 — 뒤 원소(본문·footer)를 숨긴 사본 거부", () => {
    rejected(sectionsProxy(() => ({ getOwnPropertyDescriptor: lyingLength(2), ownKeys: () => ["0", "1", "length"] })));
  });

  it("length가 정수가 아님(NaN · -1 · 2.5) + ownKeys ['length']", () => {
    for (const length of [NaN, -1, 2.5]) rejected(sectionsProxy(() => ({ getOwnPropertyDescriptor: lyingLength(length), ownKeys: () => ["length"] })));
  });

  it("ownKeys가 인덱스 일부 누락 · length보다 큰 인덱스 키 · 인덱스 키가 접근자", () => {
    expect(rejected(sectionsProxy((t) => ({ ownKeys: () => Reflect.ownKeys(t).filter((k) => k !== "2") })))).toContain("$.sections");
    rejected(sectionsProxy((t) => ({ ownKeys: () => [...Reflect.ownKeys(t), "99"] })));
    const get = vi.fn(() => ({}));
    rejected(sectionsProxy((t) => ({ getOwnPropertyDescriptor: (_, key) => (key === "1" ? { get, enumerable: true, configurable: true } : Reflect.getOwnPropertyDescriptor(t, key)) })));
    expect(get).not.toHaveBeenCalled();
  });

  it("정상 배열 · 빈 배열 · 모든 trap을 그대로 넘기는 Proxy는 통과(Proxy 자체를 판별하지 않는다)", () => {
    expect(validatePageDoc(raw()).ok).toBe(true);
    expect(validatePageDoc(raw((d) => (d.sections = []))).ok).toBe(true);
    const passThrough = validatePageDoc(sectionsProxy(() => ({})));
    expect(passThrough.ok).toBe(true);
    if (passThrough.ok) expect(passThrough.value.sections).toHaveLength(sampleDoc().sections.length);
  });
});

describe("validatePageDoc — 순환 · 깊이", () => {
  it("순환 참조(루트 ↔ meta · 섹션 → 자기 자신)", () => {
    rejected(raw((d) => (d.meta = d)));
    rejected(raw((d) => (d.sections[2].slots = d.sections[2])));
    rejected(raw((d) => d.sections.push(d.sections)));
  });

  it("깊이 초과(10만 겹) — 스택을 넘기지 않고 거부", () => {
    let deep: Loose = {};
    for (let i = 0; i < 100_000; i += 1) deep = { source: deep };
    rejected(raw((d) => (d.sections[1].slots.image.source = deep)));
    rejected(raw((d) => (d.meta = deep)));
  });
});

describe("validateProjectName — throw 0", () => {
  it.each([
    ["getter", () => Object.defineProperty({}, "length", { get: boom })],
    ["Proxy", hostile],
    ["폐기된 Proxy", revoked],
  ])("%s → SCHEMA_INVALID", (_, make) => {
    let result: ReturnType<typeof validateProjectName> | undefined;
    expect(() => (result = validateProjectName(make()))).not.toThrow();
    expect(result).toMatchObject({ ok: false, code: "SCHEMA_INVALID" });
  });
});
