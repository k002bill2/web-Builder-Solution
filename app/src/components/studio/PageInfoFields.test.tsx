import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { PageMeta } from "../../engine/contracts/pageDoc";
import { seoIssues } from "../../engine/gate/docRows";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { PageInfoFields } from "./PageInfoFields";

function Harness({ initial, onMeta }: { initial: PageMeta; onMeta?: (meta: PageMeta) => void }) {
  const [meta, setMeta] = useState(initial);
  return (
    <PageInfoFields
      meta={meta}
      onChange={(next) => {
        onMeta?.(next);
        setMeta(next);
      }}
      describedBy={{ title: "canvas-seo-title" }}
    />
  );
}

const seoSeverity = (meta: PageMeta, key: "title" | "description") => seoIssues(sampleDoc({ meta })).find((i) => i.slotKey === key)?.severity;

describe("PageInfoFields (SPEC 5.6 \"페이지 정보\" · R-11)", () => {
  it("제목(한 줄)·설명(여러 줄) · (필수) · 권장 60/160 카운터 · canonical 캡션", () => {
    render(<Harness initial={{ title: "브랜드 홈", description: "소개" }} />);
    const title = screen.getByRole("textbox", { name: /제목/ });
    const description = screen.getByRole("textbox", { name: /설명/ });
    expect(title.tagName).toBe("INPUT");
    expect(description.tagName).toBe("TEXTAREA");
    expect(screen.getAllByText("(필수)")).toHaveLength(2);
    expect(screen.getByText("5 / 60자")).toBeInTheDocument();
    expect(screen.getByText("2 / 160자")).toBeInTheDocument();
    expect(screen.getByText("발행 주소가 정해지면 채웁니다(2a-05b)")).toBeInTheDocument();
    expect(title.getAttribute("aria-describedby")?.split(" ")[0]).toBe("canvas-seo-title");
  });

  it("입력 → 새 meta(다른 필드 보존, 입력 객체 불변)", () => {
    const onMeta = vi.fn();
    const initial = Object.freeze({ title: "브랜드 홈", description: "소개" });
    render(<Harness initial={initial} onMeta={onMeta} />);
    fireEvent.change(screen.getByRole("textbox", { name: /설명/ }), { target: { value: "새 설명" } });
    expect(onMeta).toHaveBeenLastCalledWith({ title: "브랜드 홈", description: "새 설명" });
    expect(initial.description).toBe("소개");
  });

  it("권장 경계가 게이트 R-11과 같다 — 60자 조용 · 61자 경고 / 160 · 161", () => {
    const { rerender } = render(<PageInfoFields meta={{ title: "가".repeat(60), description: "나".repeat(160) }} onChange={() => undefined} />);
    expect(screen.queryByText(/권장 60자/)).toBeNull();
    expect(screen.queryByText(/권장 160자/)).toBeNull();
    expect(seoSeverity({ title: "가".repeat(60), description: "나".repeat(160) }, "title")).toBeUndefined();
    const over = { title: "가".repeat(61), description: "나".repeat(161) };
    rerender(<PageInfoFields meta={over} onChange={() => undefined} />);
    expect(screen.getByText("권장 60자 — 넘으면 검색 결과에서 잘릴 수 있습니다")).toBeInTheDocument();
    expect(screen.getByText("권장 160자 — 넘으면 검색 결과에서 잘릴 수 있습니다")).toBeInTheDocument();
    expect(seoSeverity(over, "title")).toBe("warn");
    expect(seoSeverity(over, "description")).toBe("warn");
    expect(screen.getByRole("textbox", { name: /제목/ })).not.toHaveAttribute("aria-invalid");
  });

  it("빈 값 = 차단(게이트) · 필드는 포커스를 떠날 때 \"필수 입력입니다\"", async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ title: "", description: "소개" }} />);
    expect(seoSeverity({ title: "", description: "소개" }, "title")).toBe("block");
    await user.click(screen.getByRole("textbox", { name: /제목/ }));
    await user.tab();
    expect(screen.getByRole("textbox", { name: /제목/ })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("필수 입력입니다")).toBeInTheDocument();
  });
});
