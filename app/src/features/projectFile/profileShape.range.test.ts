/**
 * SEC L-1 — 가져오기 ④ 타이포·간격 범위 = 렌더 경계(render/protocol isKitTokens) 범위.
 * 가져오기 PASS인데 렌더 메시지가 버려지는(DROPPED) 조합 0 — 같은 입력을 checkFile과 readParentMessage(docKitTokens) 양쪽에 넣어 본다.
 * 퍼즈 입력 S01·S07·S16·S02~S04 = dev/active/sec-readproject/logs/fuzz-import.txt.
 */
import { describe, expect, it } from "vitest";
import type { DesignProfileInput } from "../../domain/compareBoard";
import type { ProfileVersion } from "../../domain/profile";
import { fontStack, siteFaces } from "../../kit/siteFonts";
import { readParentMessage } from "../../render/protocol";
import { jsonFile, seedDoc, seedFile, seedSeries } from "../../test/projectFileFixtures";
import { docKitTokens } from "../studio/docPurpose";
import { checkFile } from "./checkFile";

type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };
type Base = Mutable<DesignProfileInput>;

const withBase = (edit: (base: Base) => void): ProfileVersion[] =>
  seedSeries().map((version) => {
    const base = structuredClone(version.base) as Base;
    edit(base);
    return { ...version, base };
  });

const imported = async (series: ProfileVersion[]) => (await checkFile(jsonFile(seedFile({ series })))).ok;
/** 편집 캔버스·미리보기·내보내기가 렌더 문서에 보내는 그 메시지 — 받으면 true */
const rendered = (series: ProfileVersion[]) => {
  const kitTokens = docKitTokens({ profileId: "profile-1", versions: series, latestVersion: series.length }, 2);
  return kitTokens !== undefined && readParentMessage({ type: "render", doc: seedDoc(), kitTokens }) !== undefined;
};

const CASES: ReadonlyArray<readonly [name: string, edit: (base: Base) => void, accepted: boolean]> = [
  ["S01 family CSS break", (b) => void (b.typography_tokens.family = `x"; } body{background:url(https://evil.example/a)} .y{`), false],
  ["S07 headingWeight 1e9", (b) => void (b.typography_tokens.headingWeight = 1e9), false],
  ["S16 scale 0 / sectionGap -1", (b) => ((b.typography_tokens.scale = 0), (b.spacing_tokens.sectionGap = -1)), false],
  ["family 빈 문자열", (b) => void (b.typography_tokens.family = ""), false],
  ["family 65자", (b) => void (b.typography_tokens.family = "A".repeat(65)), false],
  ["family 64자", (b) => void (b.typography_tokens.family = "A".repeat(64)), true],
  ["family Noto Serif KR", (b) => void (b.typography_tokens.family = "Noto Serif KR"), true],
  ["family 한글", (b) => void (b.typography_tokens.family = "나눔고딕"), false],
  ["family constructor(S02)", (b) => void (b.typography_tokens.family = "constructor"), true],
  ["headingWeight 99", (b) => void (b.typography_tokens.headingWeight = 99), false],
  ["headingWeight 100", (b) => void (b.typography_tokens.headingWeight = 100), true],
  ["bodyWeight 900", (b) => void (b.typography_tokens.bodyWeight = 900), true],
  ["bodyWeight 901", (b) => void (b.typography_tokens.bodyWeight = 901), false],
  ["scale 1", (b) => void (b.typography_tokens.scale = 1), true],
  ["scale 2", (b) => void (b.typography_tokens.scale = 2), true],
  ["scale 0.99", (b) => void (b.typography_tokens.scale = 0.99), false],
  ["scale 2.01", (b) => void (b.typography_tokens.scale = 2.01), false],
  ["sectionGap 0", (b) => void (b.spacing_tokens.sectionGap = 0), true],
  ["sectionGap 512", (b) => void (b.spacing_tokens.sectionGap = 512), true],
  ["sectionGap 513", (b) => void (b.spacing_tokens.sectionGap = 513), false],
  ["grid 0.5", (b) => void (b.spacing_tokens.grid = "0.5"), false],
  ["grid 1", (b) => void (b.spacing_tokens.grid = "1"), true],
  ["grid 64", (b) => void (b.spacing_tokens.grid = "64"), true],
  ["grid 65", (b) => void (b.spacing_tokens.grid = "65"), false],
  ["grid 1000000", (b) => void (b.spacing_tokens.grid = "1000000"), false],
  ["grid 8pt", (b) => void (b.spacing_tokens.grid = "8pt"), true],
  // 숫자가 아니거나 0 이하 = docKitTokens가 8로 바꾼다 → 렌더가 받으므로 가져오기도 받는다
  ["grid abc(→8)", (b) => void (b.spacing_tokens.grid = "abc"), true],
  ["grid 0(→8)", (b) => void (b.spacing_tokens.grid = "0"), true],
  ["grid -3(→8)", (b) => void (b.spacing_tokens.grid = "-3"), true],
];

describe("SEC L-1 가져오기 ④ 범위 = 렌더 isKitTokens 범위", () => {
  it.each(CASES)("%s", async (_name, edit, accepted) => {
    const series = withBase(edit);
    expect(rendered(series)).toBe(accepted);
    expect(await imported(series)).toBe(accepted);
  });
  it("시드(정상 계열)는 양쪽 다 받는다", async () => {
    expect(rendered(seedSeries())).toBe(true);
    expect(await imported(seedSeries())).toBe(true);
  });
});

describe("SEC L-1 S02~S04 프로토타입 키 글꼴 = 허용 밖 계열(면 0 · 이름 그대로)", () => {
  it.each(["constructor", "__proto__", "toString"])("%s", (family) => {
    expect(siteFaces({ family, headingWeight: 700, bodyWeight: 400 })).toEqual([]);
    expect(fontStack(family).startsWith(`"${family}", `)).toBe(true);
  });
  it("허용 3종은 그대로 별칭", () => {
    expect(siteFaces({ family: "Noto Sans KR", headingWeight: 700, bodyWeight: 400 })).toEqual([{ family: "Kit Sans KR", weight: 700 }, { family: "Kit Sans KR", weight: 400 }]);
    expect(fontStack("Pretendard").startsWith('"Pretendard", ')).toBe(true);
  });
});
