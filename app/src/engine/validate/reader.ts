/**
 * 저장 경계 검증 도구 — zod 없이(PARALLEL_LANES Q-P2=A). 문제는 모두 모아(`issues`) 한 번에 돌려준다.
 * 객체 자리는 평범한 객체만(프로토타입 = Object.prototype | null, 심볼 키 0), 오염 키·모르는 키는 거부한다.
 */
export interface ValidationIssue {
  /** `$.sections[2].slots.title` 형식 */
  readonly path: string;
  readonly message: string;
}

export type ValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly code: "SCHEMA_INVALID"; readonly issues: readonly ValidationIssue[] };

/** 프로토타입 오염 키 */
export const POLLUTION_KEYS: ReadonlySet<string> = new Set(["__proto__", "constructor", "prototype"]);
/** 문제 목록 상한 — 큰 쓰레기 입력에서 결과가 커지지 않게 */
const MAX_ISSUES = 50;

export type Rec = Readonly<Record<string, unknown>>;

export interface Reader {
  readonly issues: ValidationIssue[];
  add(path: string, message: string): void;
  /** 허용 필드만 가진 평범한 객체 */
  record(value: unknown, path: string, allowed: readonly string[]): Rec | undefined;
  /** 오염 키만 거부하는 평범한 객체(키 집합은 부르는 쪽이 검사) */
  map(value: unknown, path: string): Rec | undefined;
  /** 오염 키가 아닌 모르는 필드를 알린다 */
  extra(rec: Rec, path: string, allowed: readonly string[]): void;
  field(rec: Rec, key: string, path: string): unknown;
}

export const codePointLength = (text: string): number => [...text].length;

function isPlainObject(value: unknown): value is Rec {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return (proto === Object.prototype || proto === null) && Object.getOwnPropertySymbols(value).length === 0;
}

export function createReader(): Reader {
  const issues: ValidationIssue[] = [];
  const add = (path: string, message: string) => {
    if (issues.length < MAX_ISSUES) issues.push({ path, message });
  };
  const map = (value: unknown, path: string): Rec | undefined => {
    if (!isPlainObject(value)) {
      add(path, "객체여야 합니다");
      return undefined;
    }
    for (const key of Object.keys(value)) {
      if (POLLUTION_KEYS.has(key)) add(`${path}.${key}`, "허용하지 않는 키입니다");
    }
    return value;
  };
  const extra = (rec: Rec, path: string, allowed: readonly string[]) => {
    for (const key of Object.keys(rec)) {
      if (!POLLUTION_KEYS.has(key) && !allowed.includes(key)) add(`${path}.${key}`, "모르는 필드입니다");
    }
  };
  return {
    issues,
    add,
    map,
    extra,
    record(value, path, allowed) {
      const rec = map(value, path);
      if (rec) extra(rec, path, allowed);
      return rec;
    },
    field(rec, key, path) {
      if (!Object.hasOwn(rec, key)) add(`${path}.${key}`, "필드가 없습니다");
      return Object.hasOwn(rec, key) ? rec[key] : undefined;
    },
  };
}

interface StringRule {
  readonly min?: number;
  readonly max: number;
  readonly pattern?: RegExp;
}

export function readString(r: Reader, value: unknown, path: string, rule: StringRule): string | undefined {
  if (value === undefined) return undefined; // 누락은 field()가 이미 알렸다
  if (typeof value !== "string") {
    r.add(path, "문자열이어야 합니다");
    return undefined;
  }
  // UTF-16 길이 > 2×상한이면 코드 포인트도 상한을 넘는다 — 큰 입력을 순회하지 않는다
  const length = value.length > rule.max * 2 ? Infinity : codePointLength(value);
  if (length < (rule.min ?? 0) || length > rule.max) {
    r.add(path, `길이는 ${rule.min ?? 0}~${rule.max}자여야 합니다`);
    return undefined;
  }
  if (rule.pattern && !rule.pattern.test(value)) {
    r.add(path, "허용하지 않는 형식입니다");
    return undefined;
  }
  return value;
}

export function readInt(r: Reader, value: unknown, path: string, min: number): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min) {
    r.add(path, `${min} 이상의 정수여야 합니다`);
    return undefined;
  }
  return value;
}

export function readBool(r: Reader, value: unknown, path: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    r.add(path, "참/거짓이어야 합니다");
    return undefined;
  }
  return value;
}

export function readOneOf<T extends string>(r: Reader, value: unknown, path: string, allowed: readonly T[]): T | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    r.add(path, `${allowed.join(" | ")} 중 하나여야 합니다`);
    return undefined;
  }
  return value as T;
}

export function finish<T>(r: Reader, build: () => T): ValidationResult<T> {
  return r.issues.length === 0 ? { ok: true, value: build() } : { ok: false, code: "SCHEMA_INVALID", issues: [...r.issues] };
}
