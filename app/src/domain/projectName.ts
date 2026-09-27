/**
 * 프로젝트 이름 규칙 (DS-2A-05 SPEC 2.1 · J-S06 · 8.3 `renameProject`).
 * 정규화 = 앞뒤 공백 제거. 1~40자. 글자 수는 코드포인트로 센다(이모지 1자 — "43/40자" 표기가 어긋나지 않게).
 */
export const PROJECT_NAME_MAX = 40;

const SUFFIX = " 프로젝트";

export type ProjectNameCheck =
  | { readonly ok: true; readonly name: string }
  | { readonly ok: false; readonly reason: "empty" | "tooLong"; readonly message: string };

export function normalizeProjectName(raw: string): string {
  return raw.trim();
}

export function nameLength(name: string): number {
  return [...name].length;
}

export function validateProjectName(raw: string): ProjectNameCheck {
  const name = normalizeProjectName(raw);
  const length = nameLength(name);
  if (length === 0) return { ok: false, reason: "empty", message: "이름을 입력하세요" };
  if (length > PROJECT_NAME_MAX) {
    return { ok: false, reason: "tooLong", message: `${PROJECT_NAME_MAX}자까지 쓸 수 있습니다 (${length}/${PROJECT_NAME_MAX}자)` };
  }
  return { ok: true, name };
}

/** 제목 + 접미사가 상한을 넘으면 제목 쪽을 잘라 접미사(" 프로젝트", " 2")를 지킨다 */
function compose(title: string, tail: string): string {
  const room = PROJECT_NAME_MAX - nameLength(tail);
  return `${[...title].slice(0, room).join("").trimEnd()}${tail}`;
}

/** 기본 이름 = "<기준 레퍼런스 제목> 프로젝트", 같은 이름이 있으면 " 2", " 3"… 중 빈 가장 작은 번호 (2.1) */
export function defaultProjectName(title: string, existingNames: readonly string[]): string {
  const base = normalizeProjectName(title);
  const taken = new Set(existingNames.map(normalizeProjectName));
  const first = compose(base, SUFFIX);
  if (!taken.has(first)) return first;
  for (let n = 2; ; n += 1) {
    const candidate = compose(base, `${SUFFIX} ${n}`);
    if (!taken.has(candidate)) return candidate;
  }
}
