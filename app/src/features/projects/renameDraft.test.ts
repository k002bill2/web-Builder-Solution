/** 이름 바꾸기 초안 (DS-2A-05 SPEC 2.4 J-S05~J-S07 · J-AC-08) — 순수 상태 */
import { describe, expect, it } from "vitest";
import { ProjectRepositoryError, type Project } from "../../data/projectRepository";
import { editRename, failRename, openRename, renamedText, submitRename } from "./renameDraft";

const project: Project = Object.freeze({
  projectId: "p1",
  name: "카페 온도 프로젝트",
  revision: 4,
  profileId: "prof-1",
  baseReferenceId: "ref-1",
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-27T11:00:00.000Z",
});

describe("openRename", () => {
  it("값 = 지금 이름, 기준 revision, 오류·알림 없음, 저장 중 아님", () => {
    expect(openRename(project)).toEqual({ projectId: "p1", revision: 4, value: "카페 온도 프로젝트", submitting: false });
  });
});

describe("editRename", () => {
  it("값만 바꾸고 원본은 그대로", () => {
    const draft = Object.freeze(openRename(project));
    const next = editRename(draft, "새 이름");
    expect(next.value).toBe("새 이름");
    expect(draft.value).toBe("카페 온도 프로젝트");
  });

  it("검증 오류가 보이는 중이면 입력마다 다시 판정한다(고치면 사라진다)", () => {
    const invalid = submitRename(editRename(openRename(project), "  ")).draft;
    expect(invalid.error).toBe("이름을 입력하세요");
    expect(editRename(invalid, "가").error).toBeUndefined();
    expect(editRename(invalid, "").error).toBe("이름을 입력하세요");
  });

  it("검증 오류가 없으면 입력 중에 오류를 새로 띄우지 않는다", () => {
    expect(editRename(openRename(project), "").error).toBeUndefined();
  });
});

describe("submitRename", () => {
  it("0자 → 오류 문장, 요청 없음", () => {
    const result = submitRename(editRename(openRename(project), "   "));
    expect(result.request).toBeUndefined();
    expect(result.draft.error).toBe("이름을 입력하세요");
    expect(result.draft.submitting).toBe(false);
  });

  it("43자 → '40자까지 쓸 수 있습니다 (43/40자)'", () => {
    const result = submitRename(editRename(openRename(project), "가".repeat(43)));
    expect(result.request).toBeUndefined();
    expect(result.draft.error).toBe("40자까지 쓸 수 있습니다 (43/40자)");
  });

  it("유효 → 정규화된 이름 + 기준 revision 요청, 저장 중 · 이전 알림 지움", () => {
    const failed = failRename(editRename(openRename(project), "  새 이름  "), new Error("x"));
    const result = submitRename(failed);
    expect(result.request).toEqual({ projectId: "p1", revision: 4, name: "새 이름" });
    expect(result.draft).toMatchObject({ submitting: true, value: "  새 이름  " });
    expect(result.draft.alert).toBeUndefined();
  });

  it("저장 중이면 무시(연타)", () => {
    const busy = submitRename(openRename(project)).draft;
    const again = submitRename(busy);
    expect(again.request).toBeUndefined();
    expect(again.draft).toBe(busy);
  });
});

describe("failRename", () => {
  it("일반 실패 → 다시 시도 알림, 입력 유지", () => {
    const busy = submitRename(editRename(openRename(project), "내 입력")).draft;
    const failed = failRename(busy, new Error("network"));
    expect(failed).toMatchObject({ submitting: false, value: "내 입력", revision: 4, alert: "이름을 바꾸지 못했습니다 · 다시 시도" });
  });

  it("STALE_PROJECT → 최신 이름 문장, 입력 유지, 다음 저장은 최신 revision", () => {
    const latest = { ...project, name: "다른 곳 이름", revision: 7 };
    const busy = submitRename(editRename(openRename(project), "내 입력")).draft;
    const failed = failRename(busy, new ProjectRepositoryError("STALE_PROJECT", "stale", { project: latest }));
    expect(failed).toMatchObject({
      submitting: false,
      value: "내 입력",
      revision: 7,
      alert: "다른 곳에서 이름이 '다른 곳 이름'로 바뀌었습니다. 입력은 남겨 두었습니다 — 확인 후 다시 저장하세요",
    });
    expect(submitRename(failed).request).toEqual({ projectId: "p1", revision: 7, name: "내 입력" });
  });

  it("STALE_PROJECT인데 최신 프로젝트가 없으면 일반 실패로", () => {
    const busy = submitRename(openRename(project)).draft;
    expect(failRename(busy, new ProjectRepositoryError("STALE_PROJECT", "stale")).alert).toBe("이름을 바꾸지 못했습니다 · 다시 시도");
  });
});

describe("renamedText", () => {
  it("성공 알림 문장", () => {
    expect(renamedText("카페 온도 리브랜딩")).toBe("이름을 '카페 온도 리브랜딩'으로 바꿨습니다");
  });
});
