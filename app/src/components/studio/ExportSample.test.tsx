import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectRepositoryError, type ExportJob, type ProjectRepository } from "../../data/projectRepository";
import type { ProfileSeries } from "../../domain/profile";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { passingDoc, withPhoto } from "../../engine/testing/gateKit";
import { section, withSections } from "../../engine/testing/sampleDoc";
import { sampleTheme } from "../../engine/testing/sampleTheme";
import { REACT_ZIP_FORMAT_LABEL } from "../../features/studio/reactZip/reactZipText";
import { sampleZip } from "../../features/studio/sample/sampleZip";
import { openStudio, restoreViewport } from "../../features/studio/testing/openStudio";

afterEach(restoreViewport);

/**
 * SAMPLE-BUNDLE CONTINUE-2 — 디자인 샘플 묶음 버튼(SMP-AC-A01 · A06 · MQ-SMP-03 A).
 * 저장소는 가짜(ExportFlow.test 방식) — 잡 결과 Blob은 실제 조립부(sampleZip)에 가짜 캡처 PNG를 넣어 만든다(PngSave 테스트의 가짜 캡처와 같은 취지).
 */
const SERIES = { profileId: "profile-1", latestVersion: 2, versions: [sampleTheme().profile] } as unknown as ProfileSeries;
const clean = (over: Partial<PageDoc> = {}) => {
  const doc = passingDoc(over);
  return withSections(doc, doc.sections.filter((s) => s.type !== "cta-band"));
};
const gateRegion = () => screen.getByRole("region", { name: "품질 게이트" });
const sample = () => within(gateRegion()).getByRole("button", { name: /디자인 샘플 내려받기|내보내는 중…/ });
const FAKE_PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function open(doc: PageDoc, repository: Partial<ProjectRepository> = {}) {
  const requestExport = vi.fn(repository.requestExport ?? (async () => Promise.reject(new ProjectRepositoryError("GENERATOR_UNAVAILABLE", "기본"))));
  const studio = await openStudio({ doc, series: SERIES, repository: { ...repository, requestExport } });
  await waitFor(() => expect(within(gateRegion()).queryByText("검사하는 중입니다")).not.toBeInTheDocument());
  return { ...studio, requestExport };
}

/** STORE zip 중앙 디렉터리(PK\x01\x02) 엔트리 이름 — 순서 그대로 */
async function zipEntryNames(blob: Blob): Promise<string[]> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const names: string[] = [];
  for (let i = 0; i + 46 <= bytes.length; i++) {
    if (view.getUint32(i, true) !== 0x02014b50) continue;
    const length = view.getUint16(i + 28, true);
    names.push(new TextDecoder().decode(bytes.subarray(i + 46, i + 46 + length)));
  }
  return names;
}

describe("디자인 샘플 묶음 버튼 (SMP-AC-A01)", () => {
  it("1회 클릭 → requestExport 1회(sample-zip) · 내려받기 링크 1개 = <이름>_r<rev>_sample.zip · 결과 zip 엔트리 5개", async () => {
    let blob: Blob | undefined;
    const job: ExportJob = { jobId: "export-s", format: "sample-zip", docRevision: 3, state: "queued", retryable: false };
    const requestExport = vi.fn(async () => {
      blob = sampleZip({ png: FAKE_PNG, html: new TextEncoder().encode("<!doctype html>"), tokensJson: "{}\n", sectionsJson: "{}\n" }, new Date("2026-10-25T00:00:00Z"));
      return { job, snapshotId: "snapshot-1", snapshotName: "내보내기 전 · 14:02", wrote: true };
    });
    const getExportJob = async () => ({ ...job, state: "succeeded" as const, downloadRef: "blob:http://127.0.0.1/sample", resultHash: "0123456789ab" });
    await open(clean(), { requestExport, getExportJob });
    act(() => void fireEvent.click(sample()));
    const done = await within(gateRegion()).findByText(/디자인 샘플 묶음\(zip\)을 만들었습니다/, undefined, { timeout: 3000 });
    const links = within(done.closest("[role=status]") as HTMLElement).getAllByRole("link", { name: "내려받기" });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("download", "동네-치과-클리닉-프로젝트_r3_sample.zip");
    expect(links[0]).toHaveAttribute("href", "blob:http://127.0.0.1/sample");
    expect(requestExport).toHaveBeenCalledTimes(1);
    expect(requestExport).toHaveBeenCalledWith("project-1", "sample-zip", 3);
    expect(await zipEntryNames(blob!)).toEqual(["design.png", "design.html", "design-tokens.json", "sections.json", "README.txt"]);
  });
});

describe("내보내기 영역 순서 · 차단 (MQ-SMP-03 A · SMP-AC-A06)", () => {
  it("순서 = PNG → 샘플 묶음 → HTML 1개 → 정적 zip → React zip · 숨김 0", async () => {
    await open(clean());
    const wanted = ["PNG 내려받기", "디자인 샘플 내려받기", "HTML 파일 1개 내보내기", "정적 사이트(zip) 내보내기", REACT_ZIP_FORMAT_LABEL];
    const buttons = within(gateRegion()).getAllByRole("button").filter((b) => wanted.includes(b.textContent ?? ""));
    expect(buttons.map((b) => b.textContent)).toEqual(wanted);
    for (const button of buttons) {
      expect(button).toBeVisible();
      expect(button).not.toHaveAttribute("hidden");
      expect(button).not.toHaveAttribute("aria-hidden");
    }
  });

  it("게이트 차단 문서 → 샘플 묶음 버튼도 다른 형식과 같이 aria-disabled · 같은 aria-describedby · 눌러도 요청 0", async () => {
    const { requestExport } = await open(withSections(clean(), clean().sections.map((s) => (s.type === "hero" ? withPhoto(section("hero", "fullbleed-left", "s-hero")) : s))));
    const html = within(gateRegion()).getByRole("button", { name: "HTML 파일 1개 내보내기" });
    expect(html).toHaveAttribute("aria-disabled", "true");
    expect(sample()).toHaveAttribute("aria-disabled", "true");
    expect(sample().getAttribute("aria-describedby")).toBe(html.getAttribute("aria-describedby"));
    expect(sample()).toHaveAttribute("aria-describedby", "export-reason-gate");
    act(() => void fireEvent.click(sample()));
    expect(requestExport).not.toHaveBeenCalled();
  });
});
