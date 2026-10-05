// @vitest-environment node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * 사이트 글꼴 자산 가드 (M2B-4a · SPEC-MOTION-FONT 2.5·2.6 · MF-AC-G3·G5·G6).
 * RFN 검사는 저장소 밖 fontTools로 했고(바이너리 파서 의존성 0), 여기서는 그 출력이 SOURCE.md에 남았는지·자산 경계를 본다.
 */
const APP = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(APP + path, "utf8");
const FAMILIES = [
  { dir: "src/assets/site-fonts/kit-sans-kr", alias: "Kit Sans KR" },
  { dir: "src/assets/site-fonts/kit-serif-kr", alias: "Kit Serif KR" },
];

describe("사이트 글꼴 자산 (G3·G5·G6)", () => {
  it("G3 라이선스: 계열 폴더마다 OFL.txt(OFL 1.1 원문) + SOURCE.md(커밋 해시 고정 URL — /main/ 0 · sha256 64자 ≥ 2) · Pretendard 출처·체크섬 기록", () => {
    for (const { dir } of FAMILIES) {
      expect(read(`${dir}/OFL.txt`)).toContain("SIL OPEN FONT LICENSE Version 1.1");
      const source = read(`${dir}/SOURCE.md`);
      expect(source).toMatch(/\| 원본 URL \| https:\/\/raw\.githubusercontent\.com\/google\/fonts\/[0-9a-f]{40}\/ofl\//);
      expect(source).not.toMatch(/\/main\/|\/master\//);
      expect((source.match(/\b[0-9a-f]{64}\b/g) ?? []).length).toBeGreaterThanOrEqual(2);
    }
    const pretendard = read("src/assets/fonts/SOURCE.md");
    expect(pretendard).toMatch(/releases\/download\/v1\.3\.9\//);
    expect(pretendard).toContain("01dd73155fdfab7ce9b25224523e85a96927e21aef97f21957d41f1bfa7e3878");
    expect(pretendard).toContain("78eb71c33101ee7d4f8d1b777d193a12d00f8a296e712a8c417cf27abe946397");
  });

  it("G5 RFN: SOURCE.md에 'RFN 사후 검사 | 0건' 행 + 검사 출력 합계 0건 · 별칭·파일 이름에 RFN 문자열(source·pretendard·inter·m plus 1·noto) 0", () => {
    for (const { dir, alias } of FAMILIES) {
      const source = read(`${dir}/SOURCE.md`);
      expect(source).toMatch(/\| RFN 사후 검사 \| 0건/);
      expect(source).toContain("RFN 사후 검사 합계 0건");
      expect(source).not.toMatch(/금지어 [1-9]/);
      expect(`${alias} ${dir}`.toLowerCase()).not.toMatch(/source|pretendard|inter|m plus 1|noto/);
    }
  });

  it("G6 폰트 의존성 0(package.json·lock) · 저장소에 venv·서브셋 스크립트 파일 0", () => {
    const pkg = read("package.json") + read("package-lock.json");
    expect(pkg).not.toMatch(/fonttools|pretendard|@fontsource|noto|subset-font|fontkit|opentype/i);
    const tracked = execFileSync("git", ["ls-files"], { cwd: APP + "..", encoding: "utf8" }).split("\n");
    // venv 흔적 0 · 서브셋 스크립트(fontTools·pyftsubset을 부르는 .py/.sh) 0 — 기존 대비 계산 .py(docs/design)는 대상 아님
    expect(tracked.filter((f) => /pyvenv\.cfg$|(^|\/)(venv|\.venv|m2b4-fonts)\//.test(f))).toEqual([]);
    const scripts = tracked.filter((f) => /\.(py|sh)$/.test(f) && /fontTools|pyftsubset|varLib\.instancer/.test(readFileSync(APP + "../" + f, "utf8")));
    expect(scripts).toEqual([]);
    expect(existsSync(APP + "src/assets/site-fonts/kit-sans-kr/KitSansKR-400.woff2")).toBe(true);
  });
});
