import { Link } from "react-router";

/**
 * 편집기 진입 빈 상태 (DS-2A-05 SPEC E-S02 · E-S03). 오류가 아니라 빈 상태(`role=alert` 아님, 2a-04 P-S02 선례).
 * 집중 모드라 GNB·툴바를 그리지 않는다. 긴 프로젝트 이름은 h1에서 자르지 않는다(전역 keep-all · overflow-wrap 상속).
 */
const WRAP = "mx-auto flex max-w-(--layout-max-width) flex-col items-start gap-3 px-4 py-16 md:px-7";
const PRIMARY_LINK =
  "ds-label inline-flex h-10 items-center rounded-md bg-primary px-4 text-on-primary hover:bg-primary-hover";
const TEXT_LINK = "ds-label text-primary hover:text-primary-hover";

/** E-S02 — 없는 id · 새로고침 · 직접 진입 */
export function StudioProjectNotFound() {
  return (
    <div className={WRAP}>
      <h1 className="ds-title1">프로젝트를 찾을 수 없습니다</h1>
      <p className="ds-body2 text-label-alternative">이 브라우저에 저장된 프로젝트만 열 수 있습니다</p>
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/projects" className={PRIMARY_LINK}>
          프로젝트 목록
        </Link>
        <Link to="/compare" className={TEXT_LINK}>
          비교 보드로
        </Link>
      </div>
    </div>
  );
}

/** E-S03 — 프로젝트는 있고 편집 문서 없음. 이 화면은 문서를 만들지 않는다(startDoc은 2a-04c "편집 시작"만) */
export function StudioNoDoc({ projectName, profileId }: { readonly projectName: string; readonly profileId: string }) {
  return (
    <div className={WRAP}>
      <h1 className="ds-title1">{projectName}</h1>
      <p className="ds-body2 text-label-alternative">
        아직 편집할 페이지가 없습니다 — 프로필에서 3안을 만들고 하나를 고르세요
      </p>
      <Link to={`/profile/${profileId}`} className={PRIMARY_LINK}>
        프로필에서 3안 고르기
      </Link>
    </div>
  );
}
