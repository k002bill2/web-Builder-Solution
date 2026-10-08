import { useEffect, useState } from "react";
import { Button } from "../ds/Button";
import { Callout } from "../ds/Callout";
import type { ProjectPersistence } from "../../data/projectRepository";
import { checkStorage, issueText, type StorageIssue } from "../../features/projects/storageCheck";
import { isQuotaHigh, usageText } from "../../features/projects/storageUsage";

/** `navigator.storage`에서 이 영역이 쓰는 것만 — 없는 메서드는 그 줄을 숨긴다 */
export type StorageApi = Partial<Pick<StorageManager, "estimate" | "persisted" | "persist">>;

const LOCAL_TEXT = "프로젝트·편집 문서·스냅샷·이미지를 이 브라우저에만 저장합니다. 공용 PC라면 다 쓴 뒤 지우세요.";
const EVICT_TEXT = "브라우저는 저장 공간이 부족하면 이 데이터를 지울 수 있습니다";
const KEPT_TEXT = "브라우저에 자동 삭제하지 않도록 요청해 두었습니다";
const REFUSED_TEXT = "브라우저가 요청을 받지 않았습니다";
const FULL_TEXT = "저장 공간이 부족하면 저장이 실패합니다 — 쓰지 않는 프로젝트의 이미지나 스냅샷을 지우세요";

const defaultStorage = (): StorageApi | undefined => (typeof navigator === "undefined" ? undefined : navigator.storage);
const defaultFactory = (): IDBFactory | undefined => (typeof indexedDB === "undefined" ? undefined : indexedDB);
const reloadPage = () => window.location.reload();

/** 사용량(1.3) · 보관 요청 상태(MQ-C4 A — `persist()`는 버튼 누를 때만, 진입은 `persisted()` 조회만) */
function useLocalStorageInfo(storage: StorageApi | undefined, enabled: boolean) {
  const [estimate, setEstimate] = useState<StorageEstimate>();
  /** refused = 버튼으로 요청했으나 거절 — 보이는 문장을 거절 문장으로 바꾸고 버튼은 남긴다 */
  const [kept, setKept] = useState<boolean | "refused">();
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    storage?.estimate?.().then(
      (e) => !cancelled && setEstimate(e),
      () => undefined,
    );
    if (storage?.persist)
      storage.persisted?.().then(
        (p) => !cancelled && setKept(p),
        () => undefined,
      );
    return () => {
      cancelled = true;
    };
  }, [storage, enabled]);
  return { estimate, kept, setKept };
}

/** 강등 사유(1.7 · 1.8) — local이 아닐 때만 다시 연다 */
function useStorageIssue(factory: IDBFactory | undefined, enabled: boolean) {
  const [issue, setIssue] = useState<StorageIssue>();
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void checkStorage(factory).then((found) => !cancelled && setIssue(found));
    return () => {
      cancelled = true;
    };
  }, [factory, enabled]);
  return issue;
}

/**
 * `/projects` "이 브라우저 저장소" 영역 (P1C-SPEC 2절 1~3줄 · 1.7 · 1.8). 지우기(4줄)·다중 탭 문장·탭 간 알림은 P1C-D4·D2 몫.
 * 영역 안 알림은 `role=status` 1개(보관 요청 결과) — 늘 DOM에 둔다(display:none 금지, D-QA06).
 */
export function BrowserStorageSection({
  persistence,
  storage = defaultStorage(),
  factory = defaultFactory(),
  reload = reloadPage,
}: {
  readonly persistence: ProjectPersistence;
  readonly storage?: StorageApi;
  readonly factory?: IDBFactory;
  readonly reload?: () => void;
}) {
  const local = persistence === "local";
  const { estimate, kept, setKept } = useLocalStorageInfo(storage, local);
  const issue = useStorageIssue(factory, persistence === "memory");
  const [notice, setNotice] = useState({ text: "", key: 0 });
  const usage = usageText(estimate);

  const requestPersist = async () => {
    const granted = await Promise.resolve(storage?.persist?.()).catch(() => false);
    setKept(granted ? true : "refused");
    setNotice((n) => ({ text: granted ? KEPT_TEXT : REFUSED_TEXT, key: n.key + 1 }));
  };

  return (
    <section aria-labelledby="browser-storage-title" className="flex w-full flex-col gap-2 border-t border-line-alternative pt-6">
      <h2 id="browser-storage-title" className="ds-title3">
        이 브라우저 저장소
      </h2>
      <p role="status" aria-label="저장소 알림" className="sr-only">
        {notice.text && <span key={notice.key}>{notice.text}</span>}
      </p>
      {local && <p className="ds-body3">{LOCAL_TEXT}</p>}
      {issue && (
        <Callout
          tone="warning"
          title={issueText(issue)}
          action={
            issue === "newer" && (
              <Button variant="outline" size="sm" onClick={reload}>
                새로고침
              </Button>
            )
          }
        />
      )}
      {local && usage && <p className="ds-caption1 text-label-alternative">{usage}</p>}
      {local && isQuotaHigh(estimate) && <p className="ds-caption1 text-label-alternative">{FULL_TEXT}</p>}
      {local && kept === true && <p className="ds-caption1 text-label-alternative">{KEPT_TEXT}</p>}
      {local && (kept === false || kept === "refused") && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="ds-caption1 text-label-alternative">{kept === "refused" ? REFUSED_TEXT : EVICT_TEXT}</p>
          <Button variant="assistive" size="sm" onClick={() => void requestPersist()}>
            자동 삭제 막기 요청
          </Button>
        </div>
      )}
    </section>
  );
}
