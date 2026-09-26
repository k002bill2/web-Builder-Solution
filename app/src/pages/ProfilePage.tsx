import { useEffect, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { Button } from "../components/ds/Button";
import { Callout } from "../components/ds/Callout";
import { Tag } from "../components/ds/Tag";
import { LoadingState } from "../components/layout/LoadingState";
import { PaletteContrast } from "../components/profile/PaletteContrast";
import { ProfileList } from "../components/profile/ProfileList";
import { ProfileValues } from "../components/profile/ProfileValues";
import { VersionDiff } from "../components/profile/VersionDiff";
import { VersionList } from "../components/profile/VersionList";
import type { ProfileVersion } from "../domain/profile";
import { PALETTE_ROLES, SELECTION_MODE_LABELS } from "../features/profile/profileFields";
import { useProfileDetail, type ProfileDetailState } from "../features/profile/useProfileDetail";
import { versionWith } from "../features/profile/versionText";

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
        <Link to="/catalog" className="ds-label text-primary hover:text-primary-hover">
          카탈로그
        </Link>
      </div>
    </div>
  );
}

/** `?v=`가 없거나 없는 버전이면 최신 */
const pick = (versions: readonly ProfileVersion[], param: string | null) => versions.find((v) => String(v.version) === param);

function ProfileDetail({ profileId }: { readonly profileId: string }) {
  const { state, status, alert, reverting, revert } = useProfileDetail(profileId);
  return (
    <>
      {state.status === "loading" && <LoadingState />}
      {state.status === "not-found" && <ProfileNotFound />}
      {state.status === "ready" && <ProfileView state={state} alert={alert} reverting={reverting} revert={revert} />}
      {/* 알림 영역은 늘 DOM에 둔다(display:none 금지, 5.3) */}
      <p role="status" aria-label="프로필 알림" className="sr-only">
        {status.text && <span key={status.key}>{status.text}</span>}
      </p>
    </>
  );
}

function ProfileView({
  state: { series, engine, sources },
  alert,
  reverting,
  revert,
}: {
  readonly state: Extract<ProfileDetailState, { status: "ready" }>;
  readonly alert: string | null;
  readonly reverting: boolean;
  readonly revert: (version: number) => Promise<number | undefined>;
}) {
  const [params, setParams] = useSearchParams();
  const latest = series.versions.at(-1)!;
  const viewed = pick(series.versions, params.get("v")) ?? latest;
  const isLatest = viewed.version === latest.version;
  const diffTarget = pick(series.versions, params.get("diff"));
  const diff = diffTarget && diffTarget.version !== latest.version ? diffTarget : undefined;

  const titleOf = (id: string) => sources.get(id)?.title ?? "출처 회수됨";
  const h1 = useRef<HTMLHeadingElement>(null);
  const diffFocus = useRef<HTMLElement>(null);
  const rows = useRef(new Map<number, HTMLLIElement>());
  const focusRow = useRef<number | null>(null);
  const returnCompare = useRef<number | null>(null);
  const firstView = useRef(true);

  // 버전 보기(?v=) 전환 → h1, 되돌리기 성공 → 새 버전 줄 (5.2)
  const viewKey = params.get("v");
  useEffect(() => {
    const row = focusRow.current;
    focusRow.current = null;
    if (row !== null) rows.current.get(row)?.focus();
    else if (!firstView.current || viewKey !== null) h1.current?.focus();
    firstView.current = false;
  }, [viewKey]);
  // 비교 열기 → 표 caption, 닫기 → 그 줄의 "현재와 비교" 버튼
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
    focusRow.current = created;
    setParams(new URLSearchParams());
  };

  const palette = PALETTE_ROLES.map((role) => ({ role, hex: viewed.base.color_tokens[role].$value }));
  const contrast = engine.contrastView(palette, viewed.base.component_choices.card_style?.surfaceTone, viewed.adjustments.contrast ?? "aa");
  const summaryOf = (v: ProfileVersion) => engine.summarizeVersion(series.versions.find((p) => p.version === v.version - 1)?.base, v.base, titleOf);

  return (
    <div className={PAGE}>
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 ref={h1} tabIndex={-1} className="ds-title1 focus:outline-none">
            디자인 프로필
          </h1>
          <Tag tone={isLatest ? "blue" : "neutral"}>{isLatest ? `v${viewed.version} · 현재` : `v${viewed.version} · 이전 버전`}</Tag>
        </div>
        <p className="ds-body3 text-label-alternative">
          기준 레퍼런스: {titleOf(viewed.baseReferenceId)} · {SELECTION_MODE_LABELS[viewed.base.selection_mode]}
        </p>
        <Link to="/compare" className="ds-label self-start text-primary hover:text-primary-hover">
          비교 보드에서 선택 바꾸기
        </Link>
      </header>
      {!isLatest && (
        <Callout
          tone="info"
          title={`${versionWith(viewed.version, ["을", "를"])} 보고 있습니다 · 현재 v${latest.version}`}
          action={
            <>
              <Link to={{ search: "" }} className="ds-label inline-flex h-8 items-center text-primary hover:text-primary-hover">
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
      <ProfileValues profile={viewed.base} sources={sources} titleOf={titleOf} />
      <PaletteContrast palette={palette} contrast={contrast} />
      <section aria-labelledby="profile-versions" className="flex flex-col gap-3">
        <h2 id="profile-versions" className="ds-heading2">버전</h2>
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
            from={diff.version}
            to={latest.version}
            rows={engine.diffProfiles(diff.base, latest.base, titleOf)}
            focusRef={diffFocus}
            onClose={() => {
              returnCompare.current = diff.version;
              withParams({ diff: undefined });
            }}
          />
        )}
      </section>
    </div>
  );
}

/** DS-2A-04 2a-04a2 — `/profile` 목록 · `/profile/:profileId` 상세 (SPEC 3). 전역 조정(2a-04b)·3안(2a-04c)은 다음 단계 */
export function ProfilePage() {
  const { profileId } = useParams();
  return profileId === undefined ? <ProfileList /> : <ProfileDetail key={profileId} profileId={profileId} />;
}
