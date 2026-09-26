// @vitest-environment node
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { NOT_INLINED_ICON_NAMES, notInlinedIconLimit } from "./notInlinedIcons";

const ICONS_DIR = fileURLToPath(new URL("../assets/icons/", import.meta.url));
const iconPath = (name: string) => `${ICONS_DIR}${name}.svg`;

describe("notInlinedIcons (BUNDLE-01 R1 회귀 가드)", () => {
  it("R1 아이콘 5개(카탈로그·상세 전용)를 파일로 내보낸다", () => {
    for (const name of ["bookmark", "bookmark-fill", "search", "arrow-right", "chevron-left"]) {
      expect(notInlinedIconLimit(iconPath(name)), name).toBe(false);
    }
  });

  it("공통 셸·/compare 첫 화면 아이콘(plus: AppHeader, close: 트레이·ColumnHeader)은 인라인으로 둔다", () => {
    for (const name of ["plus", "close"]) {
      expect(notInlinedIconLimit(iconPath(name)), name).toBeUndefined();
    }
  });

  it("목록의 이름은 모두 실제 아이콘 파일이다 (오타면 조용히 인라인으로 남는다)", () => {
    const files = new Set(readdirSync(ICONS_DIR));
    for (const name of NOT_INLINED_ICON_NAMES) {
      expect(files.has(`${name}.svg`), name).toBe(true);
    }
  });

  it("아이콘이 아닌 자산은 기본 규칙(undefined)을 따른다", () => {
    expect(notInlinedIconLimit("/app/src/assets/logo/bookmark.svg")).toBeUndefined();
  });
});
