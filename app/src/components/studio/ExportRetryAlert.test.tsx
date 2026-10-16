import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEV_SERVER_UNSUPPORTED } from "../../features/studio/staticHtml/devServer";
import { ExportRetryAlert } from "./ExportRetryAlert";

describe("재시도 가능 실패 alert (E-S27)", () => {
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
