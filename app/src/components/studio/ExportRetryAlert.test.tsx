import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EXPORT_RELOAD, exportChunk } from "../../features/studio/exportFlowFails";
import { DEV_SERVER_UNSUPPORTED } from "../../features/studio/staticHtml/devServer";
import { ExportRetryAlert } from "./ExportRetryAlert";

describe("재시도 가능 실패 alert (E-S27)", () => {
  afterEach(() => void (exportChunk.fails = 0));

  it("B-M4A-08 — 내보내기 청크를 2회 연속 받지 못했으면 새로고침 안내 · 다시 시도는 남긴다(새 URL로 다시 받는다)", () => {
    exportChunk.fails = 2;
    render(<ExportRetryAlert onRetry={() => undefined} />);
    expect(screen.getByRole("alert")).toHaveTextContent(EXPORT_RELOAD);
    expect(EXPORT_RELOAD).toContain("새로고침한 뒤 다시 시도하세요");
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
  });

  it("B-M4A-08 — 청크 실패 1회·청크 실패가 아닌 실패(0)는 새로고침 안내 0", () => {
    for (const fails of [0, 1]) {
      exportChunk.fails = fails;
      const { unmount } = render(<ExportRetryAlert onRetry={() => undefined} />);
      expect(screen.getByRole("alert")).not.toHaveTextContent("새로고침");
      unmount();
    }
  });

  it("사유가 있어도 다시 시도 버튼을 보인다", () => {
    render(<ExportRetryAlert onRetry={() => undefined} reason="이미지를 그리지 못했습니다" />);
    expect(screen.getByRole("alert")).toHaveTextContent("이미지를 그리지 못했습니다");
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
  });

  it("dev 서버 사유(DEV_SERVER_UNSUPPORTED) → 안내만 · 다시 시도 버튼 0(다시 눌러도 같은 실패)", () => {
    render(<ExportRetryAlert onRetry={() => undefined} reason={DEV_SERVER_UNSUPPORTED} />);
    expect(screen.getByRole("alert")).toHaveTextContent(DEV_SERVER_UNSUPPORTED);
    expect(screen.queryByRole("button", { name: "다시 시도" })).toBeNull();
  });
});
