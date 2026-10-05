import { render, screen } from "@testing-library/react";
import { ExportResultView } from "./ExportAfter";
import { ExportRetryAlert } from "./ExportRetryAlert";

/** MQ-C3 ★A · SPEC m2c 5.2·5.3-3 — 결과 화면 크기·안내·잃은 이미지 줄 · 재시도 안내의 decode 실패 사유 */
describe("내보내기 결과 줄 (IMG-AC-24·25 · 26b 부모 쪽)", () => {
  it("done 결과 notes = 상태 영역 안 줄마다 보임 · 결과 해시 그대로", () => {
    const notes = ["HTML 1개 · 4.2MB (이미지 9장 포함)", "메일 첨부에는 클 수 있습니다 — zip 내보내기는 다음 단계에서 지원합니다", "이미지 2장을 다시 골라야 해 자체 그래픽으로 넣었습니다"];
    render(<ExportResultView result={{ kind: "done", format: "static-html", snapshotName: "s", download: { href: "blob:x", fileName: "a.html", hash: "0123456789ab" }, notes }} onFirstFallback={() => undefined} />);
    const status = screen.getByRole("status");
    for (const note of notes) expect(status).toHaveTextContent(note);
    expect(status).toHaveTextContent("결과 해시 0123456789ab");
  });

  it("재시도 안내 + 사유 = alert 안 '이미지를 그리지 못했습니다' · 사유 없으면 제목만", () => {
    const { rerender } = render(<ExportRetryAlert onRetry={() => undefined} reason="이미지를 그리지 못했습니다" />);
    expect(screen.getByRole("alert")).toHaveTextContent("내보내지 못했습니다이미지를 그리지 못했습니다");
    rerender(<ExportRetryAlert onRetry={() => undefined} />);
    expect(screen.getByRole("alert")).not.toHaveTextContent("이미지를");
  });
});
