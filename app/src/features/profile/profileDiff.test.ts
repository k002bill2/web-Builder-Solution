/** DS-2A-04 3.1 필드 표시 · 3.5 비교(diffProfiles)·버전 요약(summarizeVersions, 적용된 값 기준) (P-AC-01·07·09). */
import { describe, expect, it } from "vitest";
import { createMemoryStudio } from "../../data/memoryStudio";
import type { DesignProfileInput } from "../../domain/compareBoard";
import type { ProfileVersion } from "../../domain/profile";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import { diffProfiles, diffVersions, summarizeVersions } from "./profileDiff";
import { profileFieldRows } from "./profileFields";

const titleOf = (id: string) => ({ "ref-a": "모던 카페 브랜드", "ref-c": "동네 치과 클리닉" })[id] ?? id;

async function twoVersions(): Promise<readonly [ProfileVersion, ProfileVersion]> {
  const { board, profiles } = createMemoryStudio({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-c"], { hero: "ref-a" }) });
  await board.confirmProfile(1, 0);
  const changed = await board.savePicks({ hero: "ref-a", palette: "ref-c" }, {}, 1);
  await board.createProfileVersion("profile-1", changed.revision, 1, "current");
  const [v1, v2] = (await profiles.getProfile("profile-1"))!.versions;
  return [v1!, v2!];
}

async function twoBases(): Promise<readonly [DesignProfileInput, DesignProfileInput]> {
  const [v1, v2] = await twoVersions();
  return [v1.base, v2.base];
}

describe("profileFieldRows — 3.1 표 순서·값 누락 0", () => {
  it("구성 요소는 라이브러리 이름표 + 변형 키 캡션, 토큰은 한 줄 문장", async () => {
    const [base] = await twoBases();
    const rows = profileFieldRows(base, titleOf);
    expect(rows.map((r) => r.label)).toEqual([
      "시각 방향", "레이아웃 방향", "Hero", "메뉴", "CTA 위치", "카드 스타일", "이미지 비율", "모바일 구조", "Footer",
      "타이포그래피", "간격", "모션", "섹션 구성", "출처", "생성 정보",
      "대표색 (primary)", "면 (surface)", "본문 글자 (ink)", "보조 글자 (muted)", "배경 (bg)",
    ]);
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r]));
    expect(byLabel["Hero"]).toMatchObject({ value: "풀블리드 이미지 + 좌측 카피", caption: "fullbleed-left" });
    expect(byLabel["타이포그래피"]?.value).toMatch(/^.+ · 제목 \d{3} \/ 본문 \d{3} · 비율 [\d.]+$/);
    expect(byLabel["간격"]?.value).toMatch(/^그리드 .+ · 섹션 간격 \d+$/);
    expect(byLabel["모션"]?.value).toMatch(/^L[0-2] (없음|낮음|중간)$/);
    expect(byLabel["출처"]?.value).toBe("모던 카페 브랜드");
    expect(byLabel["생성 정보"]?.value).toBe(`라이브러리 1.4 · seed ${base.seed} · 템플릿 그대로`);
    expect(rows.every((r) => r.value !== "")).toBe(true);
  });
});

describe("diffProfiles · summarizeVersions (3.5)", () => {
  it("바뀐 줄만 changed, 순서는 3.1 표 순서 고정", async () => {
    const [v1, v2] = await twoBases();
    const rows = diffProfiles(v1, v2, titleOf);
    const changed = rows.filter((r) => r.changed).map((r) => r.label);
    expect(changed).toContain("대표색 (primary)");
    expect(changed).toContain("출처");
    expect(changed).not.toContain("Hero");
    expect(rows.map((r) => r.label)).toEqual(profileFieldRows(v1, titleOf).map((r) => r.label));
  });

  it("같은 값 두 버전은 바뀐 줄 0", async () => {
    const [v1] = await twoBases();
    expect(diffProfiles(v1, v1, titleOf).some((r) => r.changed)).toBe(false);
  });

  it("요약(적용된 값 기준) = 직전 버전과의 차이 최대 2개 + '외 N', 첫 버전·차이 없음 문장", async () => {
    const [v1, v2] = await twoVersions();
    const changed = diffVersions(v1, v2, titleOf).filter((r) => r.changed).map((r) => r.label);
    const rest = changed.length - 2;
    expect(rest).toBeGreaterThan(0);
    expect(summarizeVersions(v1, v2, titleOf)).toBe(`${changed[0]} · ${changed[1]} 외 ${rest}`);
    expect(summarizeVersions(undefined, v1, titleOf)).toBe("첫 버전");
    expect(summarizeVersions(v1, v1, titleOf)).toBe("바뀐 값 없음");
  });
});
