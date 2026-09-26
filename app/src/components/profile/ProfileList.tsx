import { Link } from "react-router";
import { useProfileList } from "../../features/profile/useProfileList";
import { relativeTime } from "../../features/profile/versionText";
import { LoadingState } from "../layout/LoadingState";

/** `/profile` 목록 (P-S04 빈 안내 · P-S05 줄마다 기준 레퍼런스·최신 버전·시각·열기) */
export function ProfileList() {
  const items = useProfileList();
  if (!items) return <LoadingState />;
  return (
    <div className="mx-auto flex max-w-(--layout-max-width) flex-col items-start gap-4 px-4 py-8 md:px-7">
      <h1 className="ds-title1">디자인 프로필</h1>
      {items.length === 0 ? (
        <>
          <p className="ds-body2 text-label-alternative">프로필은 비교 보드에서 요소를 골라 확정하면 만들어집니다</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/compare" className="ds-label inline-flex h-10 items-center rounded-md bg-primary px-4 text-on-primary hover:bg-primary-hover">
              비교 보드로
            </Link>
            <Link to="/catalog" className="ds-label text-primary hover:text-primary-hover">
              카탈로그에서 고르기
            </Link>
          </div>
        </>
      ) : (
        <ul aria-label="프로필 목록" className="flex w-full flex-col">
          {items.map(({ summary, reference }) => {
            const title = reference?.title ?? "기준 레퍼런스 회수됨";
            return (
              <li key={summary.profileId} aria-label={`${title} · 최신 v${summary.latestVersion}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line-neutral py-3">
                <span className="ds-body2 min-w-0 flex-1 font-semibold">{title}</span>
                <span className="ds-body3">최신 v{summary.latestVersion}</span>
                <time dateTime={summary.updatedAt} className="ds-caption1 text-label-alternative">
                  {relativeTime(summary.updatedAt)}
                </time>
                <Link to={`/profile/${summary.profileId}`} aria-label={`${title} 열기`} className="ds-label text-primary hover:text-primary-hover">
                  열기
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
