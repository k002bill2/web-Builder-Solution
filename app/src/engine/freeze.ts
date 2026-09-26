/**
 * 엔진 값 동결. data/studioStore의 deepFreeze와 같은 동작 — 엔진이 data 계층을 import하지 않도록 따로 둔다.
 */
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
