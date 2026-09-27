/** 프로젝트 목록 표시 규칙 (DS-2A-05 SPEC 2.4 J-S04 · J-AC-03) */
import { describe, expect, it } from "vitest";
import type { ProjectSummary } from "../../data/projectRepository";
import { editStatusText, profileLabel, projectRowView, relativeTimeText, sortProjects } from "./projectListView";

const NOW = Date.parse("2026-09-27T12:00:00.000Z");

const summary = (over: Partial<ProjectSummary> = {}): ProjectSummary =>
  Object.freeze({
    projectId: "p1",
    name: "카페 온도 프로젝트",
    revision: 1,
    profileId: "prof-1",
    baseReferenceId: "ref-1",
    createdAt: "2026-09-20T00:00:00.000Z",
    updatedAt: "2026-09-27T11:00:00.000Z",
    latestProfileVersion: 3,
    hasDoc: false,
    ...over,
  });

describe("sortProjects", () => {
  it("마지막 변경(updatedAt) 내림차순 — 저장소 순서를 믿지 않고, 입력 배열은 바꾸지 않는다", () => {
    const items = Object.freeze([
      summary({ projectId: "old", updatedAt: "2026-09-01T00:00:00.000Z" }),
      summary({ projectId: "new", updatedAt: "2026-09-27T11:59:00.000Z" }),
      summary({ projectId: "mid", updatedAt: "2026-09-15T00:00:00.000Z" }),
    ]);
    expect(sortProjects(items).map((p) => p.projectId)).toEqual(["new", "mid", "old"]);
    expect(items.map((p) => p.projectId)).toEqual(["old", "new", "mid"]);
  });
});

describe("editStatusText", () => {
  it("문서 없음 → 편집 전 안내", () => {
    expect(editStatusText(summary())).toBe("편집 전 — 프로필에서 3안을 고르면 시작합니다");
  });

  it("문서 있음 → 편집 중 · 안 · 문서의 프로필 버전", () => {
    expect(editStatusText(summary({ hasDoc: true, candidateId: "B", docProfileVersion: 3 }))).toBe("편집 중 · B안 · 프로필 v3");
  });

  it("문서의 프로필 버전 < 최신 → 새 프로필 있음을 덧붙인다", () => {
    expect(editStatusText(summary({ hasDoc: true, candidateId: "A", docProfileVersion: 2, latestProfileVersion: 4 }))).toBe(
      "편집 중 · A안 · 프로필 v2 · 새 프로필 v4 있음",
    );
  });
});

describe("profileLabel", () => {
  it("프로필 vN", () => {
    expect(profileLabel(3)).toBe("프로필 v3");
  });
});

describe("relativeTimeText", () => {
  it("1분 미만(미래 포함) → 방금 전", () => {
    expect(relativeTimeText("2026-09-27T11:59:30.000Z", NOW)).toBe("방금 전");
    expect(relativeTimeText("2026-09-27T12:05:00.000Z", NOW)).toBe("방금 전");
  });

  it("분 · 시간 · 일", () => {
    expect(relativeTimeText("2026-09-27T11:55:00.000Z", NOW)).toBe("5분 전");
    expect(relativeTimeText("2026-09-27T09:00:00.000Z", NOW)).toBe("3시간 전");
    expect(relativeTimeText("2026-09-25T12:00:00.000Z", NOW)).toBe("2일 전");
  });

  it("읽을 수 없는 시각 → 방금 전으로 무너지지 않고 빈 문자열", () => {
    expect(relativeTimeText("not-a-date", NOW)).toBe("");
  });
});

describe("projectRowView", () => {
  it("문서 있으면 편집기 경로, 없으면 없음 · 프로필 경로 · time 속성은 원래 ISO", () => {
    const withDoc = projectRowView(summary({ hasDoc: true, candidateId: "B", docProfileVersion: 3 }), NOW);
    expect(withDoc).toEqual({
      projectId: "p1",
      name: "카페 온도 프로젝트",
      profileLabel: "프로필 v3",
      editStatus: "편집 중 · B안 · 프로필 v3",
      dateTime: "2026-09-27T11:00:00.000Z",
      timeText: "1시간 전",
      editorHref: "/studio/p1",
      profileHref: "/profile/prof-1",
    });
    expect(projectRowView(summary(), NOW).editorHref).toBeUndefined();
  });

  it("경로의 id는 인코딩한다", () => {
    const view = projectRowView(summary({ projectId: "a/b", profileId: "c d", hasDoc: true, candidateId: "A", docProfileVersion: 3 }), NOW);
    expect(view.editorHref).toBe("/studio/a%2Fb");
    expect(view.profileHref).toBe("/profile/c%20d");
  });
});
