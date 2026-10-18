import { readFileSync } from "node:fs";
import { DIRECT_DEPS, LOCK_LICENSES, reactZipLicenses } from "./licenses";
import { licensesHead } from "./reactZipText";
import { BODY_DEFAULTS, INDEX_CSS, MAIN_TSX, MENU_LISTENER, PACKAGE_JSON, PACKAGE_LOCK } from "./templates";

/** REACTZIP-SPEC 3·4.2·4.3·6 — 템플릿·lock 대조(RZ-AC-10·11·12·14·15·17). 네트워크 0 */
type Lock = { lockfileVersion: number; packages: Record<string, { version?: string; resolved?: string; integrity?: string; license?: string; link?: boolean; dependencies?: object; devDependencies?: object; engines?: object }> };
const pkg = JSON.parse(PACKAGE_JSON) as { name: string; private: boolean; type: string; engines: { node: string }; scripts: Record<string, string>; dependencies: Record<string, string>; devDependencies: Record<string, string> };
const lock = JSON.parse(PACKAGE_LOCK) as Lock;
const ALLOWED = ["MIT", "Apache-2.0", "ISC", "BSD-2-Clause", "BSD-3-Clause", "0BSD", "MPL-2.0"];

/** 3.2-5 lock 대조 — 위반 목록 */
function lockProblems(l: Lock): string[] {
  const problems: string[] = [];
  if (l.lockfileVersion !== 3) problems.push("lockfileVersion");
  const root = l.packages[""]!;
  for (const key of ["dependencies", "devDependencies", "engines"] as const) if (JSON.stringify(root[key]) !== JSON.stringify(pkg[key])) problems.push(`root ${key}`);
  const installed = Object.entries(l.packages).filter(([k, v]) => k !== "" && !v.link);
  if (installed.some(([k]) => /(^|\/)motion$/.test(k))) problems.push("motion");
  for (const [k, v] of installed) {
    if (!v.resolved?.startsWith("https://registry.npmjs.org/")) problems.push(`${k} resolved`);
    if (!v.integrity) problems.push(`${k} integrity`);
    if (!ALLOWED.includes(v.license ?? "") || (v.license === "MPL-2.0" && !/lightningcss/.test(k))) problems.push(`${k} license ${v.license}`);
  }
  for (const d of DIRECT_DEPS) if (l.packages[`node_modules/${d.name}`]?.version !== d.version) problems.push(`${d.name} version`);
  return problems;
}

describe("package.json 템플릿 (RZ-AC-10 · 3.1·3.3·3.4)", () => {
  it("9개 정확 고정(^·~ 0) = DIRECT_DEPS · motion 0 · engines · scripts", () => {
    expect(Object.keys(pkg)).toEqual(["name", "private", "version", "type", "engines", "scripts", "dependencies", "devDependencies"]);
    expect(pkg).toMatchObject({ name: "site", private: true, type: "module", engines: { node: "^20.19.0 || >=22.12.0" } });
    expect(pkg.scripts).toEqual({ dev: "vite", build: "tsc --noEmit && vite build", preview: "vite preview" });
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(Object.keys(all)).toHaveLength(9);
    expect(Object.values(all).every((v) => /^\d+\.\d+\.\d+$/.test(v))).toBe(true);
    expect(all).not.toHaveProperty("motion");
    for (const d of DIRECT_DEPS) expect(pkg[d.kind][d.name]).toBe(d.version);
  });

  it("engines.node = lock에 기록된 9개 engines.node 중 가장 좁은 값(vite·plugin-react) — 버전이 바뀌면 다시 정한다", () => {
    const engines = DIRECT_DEPS.map((d) => (lock.packages[`node_modules/${d.name}`]?.engines as { node?: string } | undefined)?.node).filter(Boolean);
    expect(engines).toContain(pkg.engines.node);
  });
});

describe("lock 대조 (RZ-AC-11 · 3.2-5)", () => {
  it("정상 lock = 위반 0 (root 메타 = package.json · registry resolved · integrity · motion 0 · 버전 = 3.1 · 라이선스 ⊆ 허용 집합)", () => {
    expect(lockProblems(lock)).toEqual([]);
  });
  it("하위 항목 integrity 누락 → 실패 · root(packages[\"\"])에는 integrity를 요구하지 않는다", () => {
    expect(lock.packages[""]!.integrity).toBeUndefined();
    const broken = structuredClone(lock);
    delete broken.packages["node_modules/react"]!.integrity;
    expect(lockProblems(broken)).toEqual(["node_modules/react integrity"]);
  });
  it("새 라이선스 종류 · MPL-2.0이 lightningcss 밖 → 실패", () => {
    const broken = structuredClone(lock);
    broken.packages["node_modules/react"]!.license = "GPL-3.0";
    broken.packages["node_modules/vite"]!.license = "MPL-2.0";
    expect(lockProblems(broken)).toEqual(["node_modules/react license GPL-3.0", "node_modules/vite license MPL-2.0"]);
  });
});

describe("앱 설치 버전 대조 (RZ-AC-12 · 3.1 버전 출처 규칙)", () => {
  it("산출 9개 버전 = 앱 package-lock.json 설치 버전", () => {
    const app = JSON.parse(readFileSync("package-lock.json", "utf8")) as Lock;
    for (const d of DIRECT_DEPS) expect([d.name, app.packages[`node_modules/${d.name}`]?.version]).toEqual([d.name, d.version]);
  });
});

describe("body 기본값 (RZ-AC-14 · 4.2 Q6 A)", () => {
  it("템플릿 body = 앱 base.css body의 상속 속성 전부(토큰은 :root 라이트 값으로 풀어 px→rem · hex→rgb) — line-height 포함", () => {
    const body = /\nbody \{([\s\S]*?)\n\}/.exec(readFileSync("src/styles/tokens/base.css", "utf8"))![1]!;
    const decls = Object.fromEntries([...body.matchAll(/^\s*([-a-z]+):\s*([^;]+);/gm)].map((m) => [m[1]!, m[2]!.trim()]));
    const rootOf = (file: string) => /:root[^{]*\{([\s\S]*?)\n\}/.exec(readFileSync(`src/styles/tokens/${file}`, "utf8"))![1]!;
    const tokens = rootOf("colors.css") + rootOf("typography.css");
    const token = (name: string) => new RegExp(`${name}:\\s*([^;]+);`).exec(tokens)![1]!.trim();
    const resolve = (value: string) => {
      const raw = value.replace(/var\((--[a-z0-9-]+)\)/g, (_, name: string) => token(name));
      const px = /^(\d+)px$/.exec(raw);
      if (px) return `${Number(px[1]) / 16}rem`;
      const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(raw);
      return hex ? `rgb(${hex.slice(1).map((h) => parseInt(h, 16)).join(" ")})` : raw;
    };
    const inherited = Object.fromEntries(Object.entries(decls).filter(([k]) => k !== "margin" && k !== "font-family").map(([k, v]) => [k, resolve(v)]));
    expect(BODY_DEFAULTS).toEqual(inherited);
    for (const [k, v] of Object.entries(BODY_DEFAULTS)) expect(INDEX_CSS).toContain(`${k}: ${v};`);
    expect(INDEX_CSS).not.toMatch(/--label-|--background-|--font-size-/);
  });
});

describe("메뉴 닫기 리스너 (RZ-AC-15 · 4.3)", () => {
  it("main.tsx에 들어 있고, popover 안 # 앵커 클릭 → hidePopover 1회 · popover 밖 앵커·# 아닌 링크 → 0", () => {
    expect(MAIN_TSX).toContain(MENU_LISTENER);
    document.body.innerHTML = '<div popover id="m"><a href="#s-hero" id="in">메뉴</a><a href="/x" id="ext">밖</a></div><a href="#s-hero" id="out">본문</a>';
    const menu = document.getElementById("m") as HTMLElement & { hidePopover: () => void };
    const hide = vi.fn();
    menu.hidePopover = hide;
    const before = document.addEventListener.bind(document);
    const added: EventListener[] = [];
    const spy = vi.spyOn(document, "addEventListener").mockImplementation((type: string, fn: EventListenerOrEventListenerObject) => (added.push(fn as EventListener), before(type, fn)));
    new Function(MENU_LISTENER)();
    spy.mockRestore();
    document.getElementById("out")!.click();
    document.getElementById("ext")!.click();
    expect(hide).not.toHaveBeenCalled();
    document.getElementById("in")!.click();
    expect(hide).toHaveBeenCalledTimes(1);
    for (const fn of added) document.removeEventListener("click", fn);
  });
});

describe("LICENSES.md (RZ-AC-17 · 6절)", () => {
  const input = { files: 56, family: "Pretendard", fonts: ["src/assets/fonts/Pretendard-400.woff2"], images: ["src/assets/images/img-01.webp"], lost: 1 };
  it("필수 절 순서 · 의존성 표 = 3.1 9행 · 하위 라이선스 개수 = lock 집계 · lightningcss MPL 고지 · 결정적", () => {
    const md = reactZipLicenses(input);
    const order = ["# LICENSES", "## 사이트 코드 — 킷 소스", "## npm 직접 의존성", "## 하위 의존성", "## 글꼴", "## 이미지", "## 그래픽"].map((t) => md.indexOf(t));
    expect(order.every((at, i) => at >= 0 && (i === 0 || at > order[i - 1]!))).toBe(true);
    for (const d of DIRECT_DEPS) expect(md).toContain(`| ${d.name} | ${d.version} | ${d.kind} | ${d.license} | ${d.url} |`);
    const counted: Record<string, number> = {};
    for (const [k, v] of Object.entries(lock.packages)) if (k !== "" && !v.link) counted[v.license!] = (counted[v.license!] ?? 0) + 1;
    expect(LOCK_LICENSES).toEqual(counted);
    expect(md).toContain("lightningcss");
    expect(md).toContain("src/assets/fonts/OFL.txt");
    expect(md).toContain("서브셋");
    expect(md.startsWith(`${licensesHead(56)}\n`)).toBe(true);
    expect(md).toContain("총 56개 파일이 들어 있습니다.");
    expect(reactZipLicenses(input)).toBe(md);
  });
  it("이미지 0 = '올린 이미지 없음' 1줄 · 글꼴 0 분기", () => {
    const md = reactZipLicenses({ files: 50, fonts: [], images: [], lost: 0 });
    expect(md).toContain("올린 이미지 없음");
    expect(md).toContain("동봉한 글꼴 없음");
  });
});
