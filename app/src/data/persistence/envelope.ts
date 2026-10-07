/**
 * 영속 레코드 봉투 (ADR-007 3절 (a) · 개정 1) — PageDoc 등 엔진 계약은 건드리지 않고 저장 레코드 바깥에 `schemaVersion`을 둔다.
 * 진입 몫이라 의존성 0: 진입 검증은 수제 schemaVersion 확인만(zod를 진입에 두면 +6.17KB — E0 실측). 모양 검증(zod)은 조작 뒤 모듈.
 */
export const SCHEMA_VERSION = 1;
export const DB_NAME = "design-studio";
/** 3절 (a) 오브젝트 스토어 — 키는 봉투 `id`(out-of-line) */
export const STORE_NAMES = ["meta", "studio", "docs", "snapshots", "images", "board", "saved"] as const;
export type StoreName = (typeof STORE_NAMES)[number];

export interface Envelope<T = unknown> {
  readonly schemaVersion: number;
  /** 레코드 종류(예: "doc"·"job") — 같은 저장소에 여러 종류가 섞여도 구분 */
  readonly kind: string;
  readonly id: string;
  readonly data: T;
}

/** ok = 읽음 · missing = 없음 · mismatch = 버전 다름(newer면 앱보다 높음 → 읽기 전용 안내, 아니면 이행 대상) · invalid = 봉투 모양 아님 */
export type EnvelopeCheck =
  | { readonly status: "ok"; readonly data: unknown }
  | { readonly status: "missing" }
  | { readonly status: "mismatch"; readonly found: unknown; readonly newer: boolean }
  | { readonly status: "invalid" };

export function checkEnvelope(record: unknown, kind: string, id: string): EnvelopeCheck {
  if (record === undefined) return { status: "missing" };
  if (!record || typeof record !== "object") return { status: "invalid" };
  const env = record as Partial<Envelope>;
  if (env.kind !== kind || env.id !== id || !("data" in env)) return { status: "invalid" };
  const found = env.schemaVersion;
  if (found === SCHEMA_VERSION) return { status: "ok", data: env.data };
  return { status: "mismatch", found, newer: typeof found === "number" && found > SCHEMA_VERSION };
}
