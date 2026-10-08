/**
 * `/projects` 저장소 영역의 강등 사유 재확인 (P1C-SPEC 1.7 · 1.8) — 진입은 사유를 구분하지 않으므로(MQ-C1 A) 영역이 스스로 다시 연다.
 * 진입 읽기(`data/persistence/entryRead`)를 import하지 않는다: 그 모듈은 `/studio` 진입 closure와 공유라 이 페이지 청크가 끌어오면
 * 공유 청크가 다시 나뉠 수 있다(진입 예산 여유 0.03KB). DB 이름·봉투 확인 규칙은 entryRead와 같다(같음은 storageCheck.test가 본다).
 * 연결은 읽고 바로 닫는다 — 열어 두면 다른 탭의 버전 올리기·데이터 지우기(deleteDatabase)가 막힌다.
 */
export const STORAGE_DB_NAME = "design-studio";

/** none = IndexedDB 없음 · blocked = 열기 실패 · newer = 저장 버전 > 앱 · invalid = 깨진 봉투·이행 불가 · ok = 이상 없음 */
export type StorageIssue = "none" | "blocked" | "newer" | "invalid" | "ok";

const ISSUE_TEXT: Record<StorageIssue, string> = {
  none: "이 브라우저는 저장소를 쓸 수 없어 이 탭에만 저장합니다 — 새로고침하거나 탭을 닫으면 사라집니다",
  blocked: "브라우저 저장소에 접근하지 못해 이 탭에만 저장합니다 — 사설·시크릿 창이거나 사이트 데이터 저장이 꺼져 있을 수 있습니다",
  newer: "이 브라우저의 저장 데이터는 더 새 버전의 앱에서 저장되어 읽지 못했습니다 — 새로고침해 최신 앱을 받으세요. 그 전까지 이 탭의 변경은 저장되지 않습니다",
  invalid: "저장된 데이터를 읽지 못해 이 탭에만 저장합니다 — 계속 이렇다면 '이 브라우저 데이터 지우기'로 비울 수 있습니다",
  // 메모리로 시작했는데 다시 열어 보니 이상 없음(진입 뒤 경합 등) — SPEC 문장이 없어 W1 강등 문장으로 대신한다
  ok: "이 브라우저에 저장할 수 없어 새로고침하면 프로젝트가 사라집니다",
};

export const issueText = (issue: StorageIssue) => ISSUE_TEXT[issue];

const done = <T>(request: IDBRequest<T>) =>
  new Promise<T>((ok, ko) => {
    request.onsuccess = () => ok(request.result);
    request.onerror = () => ko(request.error);
  });

function envelopeIssue(record: unknown, kind: string, id: unknown): StorageIssue {
  if (record === undefined) return "ok";
  const env = record as { schemaVersion?: unknown; kind?: unknown; id?: unknown } | null;
  if (!env || typeof env !== "object" || env.kind !== kind || env.id !== id || !("data" in env)) return "invalid";
  const found = env.schemaVersion;
  if (found === 1) return "ok";
  return typeof found === "number" && found > 1 ? "newer" : "invalid";
}

/**
 * 문서 봉투(docs 저장소, id = projectId) — 진입은 상태가 정상이어도 진입 문서 봉투가 newer·깨짐이면 메모리로 시작한다(Codex r1).
 * 어느 문서로 진입했는지 이 페이지는 모르므로(진입에 기록을 남기면 진입 바이트가 는다) 전부 보고, 새로고침으로 풀 수 있는 newer를 앞세운다.
 */
async function docsIssue(db: IDBDatabase): Promise<StorageIssue> {
  if (!db.objectStoreNames.contains("docs")) return "ok";
  const store = db.transaction("docs").objectStore("docs");
  const [keys, records] = await Promise.all([done(store.getAllKeys()), done(store.getAll())]);
  const issues = records.map((record, i) => envelopeIssue(record, "doc", keys[i]));
  return issues.includes("newer") ? "newer" : issues.includes("invalid") ? "invalid" : "ok";
}

export async function checkStorage(factory: IDBFactory | undefined): Promise<StorageIssue> {
  if (!factory) return "none";
  let db: IDBDatabase;
  try {
    db = await done(factory.open(STORAGE_DB_NAME));
  } catch {
    return "blocked";
  }
  db.onversionchange = () => db.close();
  try {
    if (!db.objectStoreNames.contains("studio")) return "ok";
    const state = await done(db.transaction("studio").objectStore("studio").get("state"));
    const issue = envelopeIssue(state, "state", "state");
    // 상태 레코드가 없으면 진입은 문서와 무관하게 빈 상태(local)로 시작한다 — 문서는 상태가 정상일 때만 강등 원인이 된다
    return issue === "ok" && state !== undefined ? await docsIssue(db) : issue;
  } catch {
    return "blocked";
  } finally {
    db.close();
  }
}
