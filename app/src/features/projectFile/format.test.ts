// @vitest-environment node
/**
 * 프로젝트 파일 형식 상수 (P2-SPEC 2절 · 3.2 · 3.3 ⑤ · 5절 IM-1~IM-6 · 6절 리터럴 복제 + parity).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION } from "../../data/persistence/envelope";
import { FILE_FORMAT, FORMAT_VERSION, IMPORT_MESSAGES, MAX_FILE_BYTES, MAX_IMAGE_BYTES, MAX_IMAGE_COUNT, SCHEMA, EXPORT_TOO_LARGE } from "./format";

const MB = 1024 * 1024;

describe("프로젝트 파일 형식 상수", () => {
  it("봉투 고정값 — format 문자열 · formatVersion 1 · schemaVersion = 앱 봉투 SCHEMA_VERSION(parity)", () => {
    expect(FILE_FORMAT).toBe("design-studio-project");
    expect(FORMAT_VERSION).toBe(1);
    expect(SCHEMA).toBe(SCHEMA_VERSION);
  });

  it("한도 — 파일 96MB · 이미지 24개 · 60MB = imageStore 탭 한도(parity — 소스 리터럴)", () => {
    expect(MAX_FILE_BYTES).toBe(96 * MB);
    expect(MAX_IMAGE_COUNT).toBe(24);
    expect(MAX_IMAGE_BYTES).toBe(60 * MB);
    const store = readFileSync(fileURLToPath(new URL("../studio/images/store/imageStore.ts", import.meta.url)), "utf8");
    expect(store).toMatch(/const TAB_COUNT = 24;/);
    expect(store).toMatch(/const TAB_BYTES = 60 \* MB;/);
    expect(store).toMatch(/const MB = 1024 \* 1024;/);
  });

  it("검증 실패 문장 IM-1~IM-6 · 내보내기 자기 거절 EX-12 (5절 원문)", () => {
    expect(IMPORT_MESSAGES).toEqual({
      "IM-1": "파일이 너무 큽니다(최대 96MB) — 이 앱에서 내보낸 프로젝트 파일인지 확인하세요",
      "IM-2": "프로젝트 파일이 아닙니다 — 이 앱의 '파일로 내보내기'로 만든 .json 파일을 고르세요",
      "IM-3": "더 새 버전의 앱에서 만든 파일이라 가져올 수 없습니다 — 새로고침해 최신 앱을 받은 뒤 다시 시도하세요",
      "IM-4": "파일 내용이 손상되어 가져올 수 없습니다",
      "IM-5": "이미지가 24개 · 60MB를 넘어 가져올 수 없습니다",
      "IM-6": "이미지를 읽지 못해 가져올 수 없습니다 — 파일이 손상되었을 수 있습니다",
    });
    expect(EXPORT_TOO_LARGE).toBe("이 프로젝트는 가져오기 한도(파일 96MB · 이미지 24개 · 60MB)를 넘어 파일로 만들 수 없습니다 — 쓰지 않는 스냅샷을 지운 뒤 다시 시도하세요");
  });
});
