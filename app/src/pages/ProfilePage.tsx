import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { Button } from "../components/ds/Button";
import { Callout } from "../components/ds/Callout";
import { Tag } from "../components/ds/Tag";
import { LoadingState } from "../components/layout/LoadingState";
import { ProfileList } from "../components/profile/ProfileList";
import { ProfileValues } from "../components/profile/ProfileValues";
import { VersionDiff } from "../components/profile/VersionDiff";
import { VersionList } from "../components/profile/VersionList";
import type { ProfileVersion } from "../domain/profile";
import { SELECTION_MODE_LABELS } from "../features/profile/profileFields";
import { useProfileDetail, type ProfileDetailState } from "../features/profile/useProfileDetail";
import { missingVersionText, versionWith } from "../features/profile/versionText";

const PAGE = "mx-auto flex max-w-(--layout-max-width) flex-col gap-8 px-4 py-6 md:px-7 md:py-8";

/** P-S02 — 오류가 아니라 빈 상태(role=alert 아님) */
function ProfileNotFound() {
  return (
    <div className="mx-auto flex max-w-(--layout-max-width) flex-col items-start gap-3 px-4 py-16 md:px-7">
      <h1 className="ds-title1">프로필을 찾을 수 없습니다</h1>
      <p className="ds-body2 text-label-alternative">새로고침하면 확정한 프로필이 사라집니다(서버 연결 전)</p>
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/compare" className="ds-label inline-flex h-10 items-center rounded-md bg-primary px-4 text-on-primary hover:bg-primary-hover">
          비교 보드로
        </Link>
        <Link to="/catalog" className="ds-label text-primary-text hover:text-primary-hover">
          카탈로그
        </Link>
      </div>
    </div>
  );
}

/** 보드 재확정이 navigate state로 넘긴 지운 조정 수(P-S25 r6). history state는 밖에서 온 값이라 모양을 확인한다 */
function droppedCountOf(state: unknown): number {
  const n = typeof state === "object" && state !== null && "droppedCount" in state ? state.droppedCount : undefined;
  return typeof n === "number" && Number.isSafeInteger(n) && n > 0 ? n : 0;
}

/** `?v=`가 없거나 없는 버전이면 최신 */
const pick = (versions: readonly ProfileVersion[], param: string | null) => versions.find((v) => String(v.version) === param);
/** 비교 표는 작은 번호 먼저 ("v1과 v2 비교") */
const ordered = (a: ProfileVersion, b: ProfileVersion) => (a.version < b.version ? ([a, b] as const) : ([b, a] as const));

function ProfileDetail({ profileId }: { readonly profileId: string }) {
  const detail = useProfileDetail(profileId);
  const { state, status, announce } = detail;
  // 보드 확정 뒤 지운 조정이 있으면 "프로필 알림"에 한 번 알린다 — 패널을 펼치지 않았어도 (P-S25 r6).
  // 알린 뒤 history state를 replace로 비운다 — 뒤로·앞으로 가기로 이 항목에 돌아와도 다시 알리지 않는다(문장은 알림 state에 남는다)
  const location = useLocation();
  const navigate = useNavigate();
  const dropped = droppedCountOf(location.state);
  useEffect(() => {
    if (dropped === 0) return;
    announce(`조정 ${dropped}개를 지웠습니다`);
    void navigate({ pathname: location.pathname, search: location.search, hash: location.hash }, { replace: true, state: null });
  }, [location.key, location.pathname, location.search, location.hash, dropped, announce, navigate]);
  return (
    <>
      {state.status === "loading" && <LoadingState />}
      {state.status === "not-found" && <ProfileNotFound />}
      {state.status === "ready" && <ProfileView state={state} detail={detail} />}
      {/* 알림 영역은 늘 DOM에 둔다(display:none 금지, 5.3) */}
      <p role="status" aria-label="프로필 알림" className="sr-only">
        {status.text && <span key={status.key}>{status.text}</span>}
      </p>
    </>
  );
}

function ProfileView({
  state: { series, range, engine, sources },
  detail: { alert, reverting, revert, announce, withdraw, saving, saveAlert, save },
}: {
  readonly state: Extract<ProfileDetailState, { status: "ready" }>;
  readonly detail: ReturnType<typeof useProfileDetail>;
}) {
  const [params, setParams] = useSearchParams();
  const latest = series.versions.at(-1)!;
  const requested = params.get("v");
  const found = pick(series.versions, requested);
  const viewed = found ?? latest;
  const isLatest = viewed.version === latest.version;
  // Q3 — 비교 쌍 = (보는 버전, diff). diff가 보는 버전과 같거나 없는 버전이면 닫힘
  const diffTarget = pick(series.versions, params.get("diff"));
  const diff = diffTarget && diffTarget.version !== viewed.version ? diffTarget : undefined;
  const [from, to] = ordered(diff ?? viewed, viewed);
  // Q9 — 없는 ?v= 버전: 최신을 보이고 글자로 알린다. 문장은 상시 "프로필 알림" 영역으로(A-9), 요청 값이 바뀔 때 한 번(문장이 같아도).
  // 요청 값이 바뀌면 그 문장을 거둔다 — 유효한 버전으로 가면 알림도 사라진다(D-2A4-04).
  // 같은 요청 값이면 최신 번호가 바뀌어도(조정 저장·STALE) 다시 알리지 않는다 — 저장 알림을 덮지 않게(D-2A4B2-03). 보이는 Callout은 최신 번호를 따른다
  const missing = requested !== null && !found ? missingVersionText(requested, latest.version) : null;
  const latestVersion = useRef(latest.version);
  useEffect(() => {
    latestVersion.current = latest.version;
  });
  const isMissing = missing !== null;
  useEffect(() => {
    if (!isMissing || requested === null) return;
    const text = missingVersionText(requested, latestVersion.current);
    announce(text);
    return () => withdraw(text);
  }, [requested, isMissing, announce, withdraw]);

  const titleOf = (id: string) => sources.get(id)?.title ?? "출처 회수됨";
  const h1 = useRef<HTMLHeadingElement>(null);
  const diffFocus = useRef<HTMLElement>(null);
  const rows = useRef(new Map<number, HTMLLIElement>());
  const focusRow = useRef<number | null>(null);
  const returnCompare = useRef<number | null>(null);
  const firstView = useRef(true);
  // 되돌리기 성공 → 저장 안 된 조정을 버린다(되돌린 버전이 새 저장값)
  const [resetKey, setResetKey] = useState(0);
  const [pending, setPending] = useState(0);

  // 버전 보기(?v=) 전환 → h1, 되돌리기 성공 → 새 버전 줄 (5.2)
  const viewKey = params.get("v");
  useEffect(() => {
    const row = focusRow.current;
    focusRow.current = null;
    if (row !== null) rows.current.get(row)?.focus();
    else if (!firstView.current || viewKey !== null) h1.current?.focus();
    firstView.current = false;
  }, [viewKey]);
  // 비교 열기 → 표 caption, 닫기 → 그 줄의 비교 버튼
  const diffKey = diff?.version;
  useEffect(() => {
    if (diffKey !== undefined) diffFocus.current?.focus();
    else if (returnCompare.current !== null) document.querySelector<HTMLElement>(`[data-compare="${returnCompare.current}"]`)?.focus();
    returnCompare.current = null;
  }, [diffKey]);

  const withParams = (next: Record<string, string | undefined>) => {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined) merged.delete(key);
      else merged.set(key, value);
    }
    setParams(merged);
  };
  const onRevert = async () => {
    const created = await revert(viewed.version);
    if (created === undefined) return;
    setResetKey((k) => k + 1);
    focusRow.current = created;
    setParams(new URLSearchParams());
  };

  const summaryOf = (v: ProfileVersion) => engine.summarizeVersions(series.versions.find((p) => p.version === v.version - 1), v, titleOf);
  const { ProfilePanel, CandidatesSection } = engine;

  return (
    <div className={PAGE}>
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 ref={h1} tabIndex={-1} className="ds-title1 focus:outline-none">
            디자인 프로필
          </h1>
          <Tag tone={isLatest ? "violet" : "neutral"}>{isLatest ? `v${viewed.version} · 현재` : `v${viewed.version} · 이전 버전`}</Tag>
        </div>
        <p className="ds-body3 text-label-alternative">
          기준 레퍼런스: {titleOf(viewed.baseReferenceId)} · {SELECTION_MODE_LABELS[viewed.base.selection_mode]}
        </p>
        <Link to="/compare" className="ds-label self-start text-primary-text hover:text-primary-hover">
          비교 보드에서 선택 바꾸기
        </Link>
      </header>
      {missing && <Callout tone="info" title={missing} />}
      {!isLatest && (
        <Callout
          tone="info"
          title={`${versionWith(viewed.version, ["을", "를"])} 보고 있습니다 · 현재 v${latest.version}`}
          action={
            <>
              <Link to={{ search: "" }} className="ds-label inline-flex h-8 items-center text-primary-text hover:text-primary-hover">
                현재 버전 보기
              </Link>
              <Button size="sm" aria-busy={reverting || undefined} onClick={() => void onRevert()}>
                {reverting ? "되돌리는 중…" : "이 버전으로 되돌리기"}
              </Button>
            </>
          }
        />
      )}
      {alert && (
        <div role="alert" className="ds-body3 rounded-md bg-status-negative-bg p-3 text-status-negative-text">
          {alert}
        </div>
      )}
      {/* 1280 2단: 왼쪽 프로필 패널(요약 우선, 약 340) + 오른쪽 3안(나머지) — 1024는 패널 안 2열, 그 아래 1열 (5.1, Q5 · PROFILE-V2-COMPACT 1) */}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,--spacing(85))_minmax(0,1fr)]">
        <ProfilePanel
          viewed={viewed}
          latest={latest}
          range={range}
          saving={saving}
          saveAlert={saveAlert}
          onSave={save}
          resetKey={resetKey}
          onPending={setPending}
          values={<ProfileValues rows={engine.valueRows(viewed, titleOf)} profile={viewed.base} sources={sources} />}
          versions={
            <section aria-labelledby="profile-versions" className="flex flex-col gap-3">
              <h2 id="profile-versions" className="ds-heading1">버전</h2>
              <VersionList
                versions={series.versions}
                latestVersion={latest.version}
                viewedVersion={viewed.version}
                summaryOf={summaryOf}
                onView={(v) => withParams({ v: v === latest.version ? undefined : String(v), diff: undefined })}
                onCompare={(v) => withParams({ diff: String(v) })}
                rowRef={(v) => (el) => {
                  if (el) rows.current.set(v, el);
                  else rows.current.delete(v);
                }}
              />
              {diff && (
                <VersionDiff
                  from={from.version}
                  to={to.version}
                  rows={engine.diffVersions(from, to, titleOf)}
                  focusRef={diffFocus}
                  onClose={() => {
                    returnCompare.current = diff.version;
                    withParams({ diff: undefined });
                  }}
                />
              )}
            </section>
          }
        />
        <CandidatesSection key={viewed.version} viewed={viewed} pending={pending} announce={announce} />
      </div>
    </div>
  );
}

/** DS-2A-04 — `/profile` 목록 · `/profile/:profileId` 상세 (SPEC 3). 전역 조정 2a-04b2, 3안 2a-04c(엔진 청크) */
export function ProfilePage() {
  const { profileId } = useParams();
  return profileId === undefined ? <ProfileList /> : <ProfileDetail key={profileId} profileId={profileId} />;
}
