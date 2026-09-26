import type { ProfileOrigin, ProfileVersion } from "../../domain/profile";
import { relativeTime, versionWith } from "../../features/profile/versionText";
import { Button } from "../ds/Button";
import { Tag } from "../ds/Tag";

const ORIGIN_LABELS: Readonly<Record<ProfileOrigin, string>> = Object.freeze({ board: "보드 확정", "board-reconfirm": "보드 재확정", adjust: "조정", revert: "되돌리기" });
/** 긴 이력: 최근 5개 + 펼침 (3.5) */
const RECENT = 5;

const originText = (v: ProfileVersion) => (v.origin === "revert" && v.basedOn !== undefined ? `${ORIGIN_LABELS.revert} (v${v.basedOn})` : ORIGIN_LABELS[v.origin]);

export interface VersionListProps {
  readonly versions: readonly ProfileVersion[];
  readonly latestVersion: number;
  readonly viewedVersion: number;
  readonly summaryOf: (version: ProfileVersion) => string;
  readonly onView: (version: number) => void;
  readonly onCompare: (version: number) => void;
  readonly rowRef: (version: number) => (el: HTMLLIElement | null) => void;
}

function VersionRow({ v, props }: { readonly v: ProfileVersion; readonly props: VersionListProps }) {
  const current = v.version === props.latestVersion;
  const viewed = v.version === props.viewedVersion;
  // Q3 — 비교는 보는 버전 기준: 최신이면 "현재와 비교", 이전 버전이면 "v1과 비교". 보는 버전 자신의 줄에는 없음
  const compareText = props.viewedVersion === props.latestVersion ? "현재와 비교" : `${versionWith(props.viewedVersion, ["과", "와"])} 비교`;
  return (
    <li
      ref={props.rowRef(v.version)}
      tabIndex={-1}
      aria-label={`v${v.version} ${originText(v)}`}
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line-neutral py-2.5 last:border-b-0 focus:outline-none focus-visible:shadow-(--focus-ring)"
    >
      <span className="ds-label">v{v.version}</span>
      {current && <Tag tone="blue" size="sm">현재</Tag>}
      {viewed && !current && <Tag size="sm">보는 중</Tag>}
      <span className="ds-body3">{originText(v)}</span>
      <span className="ds-caption1 min-w-0 flex-1 text-label-alternative">{props.summaryOf(v)}</span>
      <time dateTime={v.createdAt} className="ds-caption1 text-label-alternative">
        {relativeTime(v.createdAt)}
      </time>
      <span className="flex gap-1.5">
        {!viewed && (
          <Button variant="outline" size="sm" aria-label={`보기 (v${v.version})`} onClick={() => props.onView(v.version)}>
            보기
          </Button>
        )}
        {!viewed && (
          <Button data-compare={v.version} variant="outline" size="sm" aria-label={`${compareText} (v${v.version})`} onClick={() => props.onCompare(v.version)}>
            {compareText}
          </Button>
        )}
      </span>
    </li>
  );
}

/** 3.5 버전 목록 — 최신이 위. 현재·보는 중은 Tag 글자(M-04, 색 하나로 알리지 않음) */
export function VersionList(props: VersionListProps) {
  const ordered = [...props.versions].reverse();
  const recent = ordered.slice(0, RECENT);
  const older = ordered.slice(RECENT);
  return (
    <div className="flex flex-col gap-2">
      <ul aria-label="버전 목록" className="flex flex-col">
        {recent.map((v) => (
          <VersionRow key={v.version} v={v} props={props} />
        ))}
      </ul>
      {older.length > 0 && (
        <details>
          <summary className="ds-label cursor-pointer">이전 버전 {older.length}개 더 보기</summary>
          <ul aria-label="이전 버전 목록" className="flex flex-col">
            {older.map((v) => (
              <VersionRow key={v.version} v={v} props={props} />
            ))}
          </ul>
        </details>
      )}
      {props.versions.length === 1 && <p className="ds-body3 text-label-alternative">비교할 이전 버전이 없습니다</p>}
    </div>
  );
}
