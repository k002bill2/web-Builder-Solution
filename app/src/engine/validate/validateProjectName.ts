/**
 * 프로젝트 이름 — 앞뒤 공백 제거 뒤 1~40자(코드 포인트) (SPEC J-S06 · 8.3 renameProject).
 */
import { createReader, finish, neverThrow, readString, type ValidationResult } from "./reader";

export const PROJECT_NAME_MAX = 40;

/** 어떤 입력에도 throw하지 않는다 */
export function validateProjectName(input: unknown): ValidationResult<string> {
  return neverThrow(() => {
    const r = createReader();
    if (typeof input !== "string") r.add("$", "문자열이어야 합니다");
    const name = typeof input === "string" ? readString(r, input.trim(), "$", { min: 1, max: PROJECT_NAME_MAX }) : undefined;
    return finish(r, () => name as string);
  });
}
