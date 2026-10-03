/**
 * M2A-3a Codex P2-1 r2 — 내보내기 청크(exportFlow)를 받지 못한 브라우저는 그 청크를 정적 import하는 결과 청크(ExportAfter)도 받지 못한다
 * (실패한 모듈 URL을 기억 · 오프라인). 재시도 안내는 그 청크 없이 떠야 한다 — 이 파일은 ExportAfter 로드 자체를 실패시킨다.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ExportJob } from "../../data/projectRepository";
import type { ProfileSeries } from "../../domain/profile";
import { passingDoc } from "../../engine/testing/gateKit";
import { withSections } from "../../engine/testing/sampleDoc";
import { sampleTheme } from "../../engine/testing/sampleTheme";
import { openStudio, restoreViewport } from "../../features/studio/testing/openStudio";

afterEach(restoreViewport);

const flowLoad = vi.hoisted(() => ({ failures: 0 }));
vi.mock("../../features/studio/exportFlowLoader", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../features/studio/exportFlowLoader")>();
  return {
    loadExportFlow: () => (flowLoad.failures-- > 0 ? Promise.reject(new Error("Failed to fetch dynamically imported module")) : actual.loadExportFlow()),
  };
});
vi.mock("./ExportAfter", () => {
  throw new Error("Failed to fetch dynamically imported module: ExportAfter");
});

const SERIES = { profileId: "profile-1", latestVersion: 2, versions: [sampleTheme().profile] } as unknown as ProfileSeries;
const gateRegion = () => screen.getByRole("region", { name: "품질 게이트" });
const html = () => within(gateRegion()).getByRole("button", { name: /정적 HTML 내보내기|내보내는 중…/ });

describe("결과 청크는 내보내기 청크를 런타임 import하지 않는다 (M2A-3a Codex P2-1 r3)", () => {
  // 첫 exportFlow 로드가 실패한 브라우저는 그 URL을 기억한다 — 재시도로 exportFlow를 복구해도 원래 URL을 import하는 결과 청크는 거부된다
  it("ExportAfter·ExportRetryAlert의 exportFlow import는 type 전용", () => {
    for (const file of ["ExportAfter.tsx", "ExportRetryAlert.tsx"]) {
      const source = readFileSync(join(process.cwd(), "src/components/studio", file), "utf8");
      const runtime = source.split("\n").filter((line) => /^import (?!type ).*features\/studio\/exportFlow"/.test(line));
      expect(runtime, file).toEqual([]);
    }
  });
});

describe("내보내기 청크 · 결과 청크 로드 실패", () => {
  it("재시도 안내(alert '내보내지 못했습니다' + '다시 시도')는 결과 청크 없이 뜬다 · 버튼 busy 해제 · 다시 시도 = 요청", async () => {
    flowLoad.failures = 1;
    // 다시 시도도 재시도 가능 실패로 끝나게 — 결과 청크가 필요한 결과(완료·생성기 없음)로 가지 않는다
    const job: ExportJob = { jobId: "export-1", format: "static-html", docRevision: 3, state: "failed", errorCode: "JOB_TIMEOUT", retryable: true };
    const requestExport = vi.fn(async () => ({ job, snapshotId: "snapshot-1", snapshotName: "내보내기 전 · 14:02", wrote: true }));
    const doc = passingDoc();
    await openStudio({ doc: withSections(doc, doc.sections.filter((s) => s.type !== "cta-band")), series: SERIES, repository: { requestExport } });
    await waitFor(() => expect(within(gateRegion()).queryByText("검사하는 중입니다")).not.toBeInTheDocument());
    act(() => void fireEvent.click(html()));
    const alert = await within(gateRegion()).findByRole("alert");
    expect(alert.textContent).toContain("내보내지 못했습니다");
    expect(html()).not.toHaveAttribute("aria-busy");
    expect(requestExport).not.toHaveBeenCalled();
    act(() => void fireEvent.click(within(alert).getByRole("button", { name: "다시 시도" })));
    await waitFor(() => expect(requestExport).toHaveBeenCalledTimes(1));
    expect(await within(gateRegion()).findByRole("alert")).toHaveTextContent("내보내지 못했습니다");
  });
});
