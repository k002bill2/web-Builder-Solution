import { readdirSync, readFileSync } from "node:fs";
import { referenceRenderInput } from "../../../thumbs/referenceDoc";
import { copyBlock } from "../testing/copyDoc";
import { KIT_CSS, m2 } from "../testing/reactZipFixture";
import { DIRECT_DEPS, TRANSITIVE_LICENSES, reactZipLicenses } from "./licenses";
import { reactZipEntries } from "./reactZip";
import { LICENSES_SITE_CODE, README_MD, REACT_ZIP_FORMAT_LABEL, REACT_ZIP_NEXT, licensesHead, reactZipNote } from "./reactZipText";
import { PACKAGE_LOCK } from "./templates";

/** COPY.md 확정 문안 글자 그대로(FIX1) — 자리표시자 {size}{images}{fonts}{files}{transitiveLicenseTable}만 실제 값 */
const MB = 1024 * 1024;
type Lock = { packages: Record<string, { license?: string; link?: boolean }> };

describe("React zip 문안 = COPY.md 원문", () => {
  it("버튼 · 결과 줄 · 다음 할 일", () => {
    expect(REACT_ZIP_FORMAT_LABEL).toBe(copyBlock("export.format.reactZip (버튼)"));
    expect(reactZipNote(1.5 * MB, 2, 3)).toBe(copyBlock("export.note.reactZip (성공 결과 줄)").replace("{size}", "1.5MB").replace("{images}", "2").replace("{fonts}", "3"));
    expect(REACT_ZIP_NEXT).toBe(copyBlock("export.note.reactZipNext (다음 할 일)"));
  });

  it("README.md 전문 · LICENSES 1절 머리 · 2절 킷 소스", () => {
    expect(README_MD).toBe(`${copyBlock("README.md (전문)")}\n`);
    expect(licensesHead(56)).toBe(`${copyBlock("LICENSES.md 1절 머리").replace("{files}", "56")}\n`);
    expect(LICENSES_SITE_CODE).toBe(`${copyBlock("LICENSES.md 2절 사이트 코드(킷 소스)")}\n`);
  });

  it("4절 하위 의존성 — 표 = 고정 lock에서 직접 의존성 9개·루트 제외한 라이선스 종류별 개수", () => {
    const lock = JSON.parse(PACKAGE_LOCK) as Lock;
    const direct = new Set(DIRECT_DEPS.map((d) => `node_modules/${d.name}`));
    const counted: Record<string, number> = {};
    for (const [k, v] of Object.entries(lock.packages)) if (k !== "" && !v.link && !direct.has(k)) counted[v.license!] = (counted[v.license!] ?? 0) + 1;
    expect(TRANSITIVE_LICENSES).toEqual(counted);
    expect(Object.values(counted).reduce((a, b) => a + b, 0)).toBe(Object.keys(lock.packages).filter((k) => k !== "" && !lock.packages[k]!.link).length - 9);
    const table = ["| 라이선스 | 하위 패키지 수 |", "|---|---|", ...Object.entries(TRANSITIVE_LICENSES).map(([license, n]) => `| ${license} | ${n} |`)].join("\n");
    const md = reactZipLicenses({ files: 50, fonts: [], images: [], lost: 0 });
    expect(md).toContain(`\n${copyBlock("LICENSES.md 4절 하위 의존성").replace("{transitiveLicenseTable}", table)}\n\n## 글꼴`);
    expect(md.startsWith(`${licensesHead(50)}\n${LICENSES_SITE_CODE}\n## npm 직접 의존성`)).toBe(true);
  });

  it("{files} = 실제 zip entry 전체 수(README·LICENSES·OFL.txt 포함)", async () => {
    const entries = await reactZipEntries({ ...m2(referenceRenderInput("ref-a")), css: KIT_CSS });
    const names = entries.map((e) => e.name);
    expect(names).toEqual(expect.arrayContaining(["README.md", "LICENSES.md", "src/assets/fonts/OFL.txt"]));
    const licenses = new TextDecoder().decode(entries.find((e) => e.name === "LICENSES.md")!.data);
    expect(licenses.startsWith(licensesHead(entries.length))).toBe(true);
  });

  it("TODO(copy) 0 — reactZip 소스", () => {
    const dir = "src/features/studio/reactZip";
    const sources = readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
    expect(sources.filter((f) => readFileSync(`${dir}/${f}`, "utf8").includes("TODO(copy)"))).toEqual([]);
  });
});
