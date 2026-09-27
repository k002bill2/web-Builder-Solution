import { Link, NavLink, useLocation } from "react-router";
import { brand } from "../../brand/brand.config";
import { CURRENT_USER } from "../../fixtures/currentUser";
import { Avatar } from "../ds/Avatar";
import { Icon } from "../ds/Icon";

/** DS 2중 링 (D-V22-01) — UA outline 대신. */
const FOCUS_RING = "rounded-xs focus-visible:outline-none focus-visible:shadow-(--focus-ring)";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `${FOCUS_RING} ${isActive ? "font-bold text-label-normal" : "hover:text-label-normal"}`;

/**
 * 보관함은 카탈로그의 저장함 탭(/catalog?tab=saved)이라 경로만으로는 구분되지 않는다.
 * 레퍼런스 상세(/references/:id)는 카탈로그 하위 화면이다 (목업 1a-02 GNB).
 */
function useCatalogView() {
  const { pathname, search } = useLocation();
  const onCatalog = pathname === "/catalog";
  const saved = onCatalog && new URLSearchParams(search).get("tab") === "saved";
  // 프로필은 프로젝트의 하위 화면이다 (DS-2A-05 2.2 · 12.1)
  return { catalog: (onCatalog && !saved) || pathname.startsWith("/references/"), saved, projects: pathname === "/projects" || pathname.startsWith("/profile/") };
}

/**
 * 상단 GNB — 52px 한 줄, <768에서는 DOM 순서대로 줄을 바꾼다: 로고 / 주 메뉴 / 새 프로젝트·아바타(오른쪽) (v2 SPEC 4.1 · Q5).
 * CSS order로 보이는 순서를 바꾸지 않는다 — DOM 순서 = 보이는 순서 = Tab 순서 (QA D3).
 */
export function AppHeader() {
  const { Logo, name } = brand;
  const view = useCatalogView();
  return (
    <header className="flex flex-wrap items-center gap-x-7 border-b border-line-neutral bg-background-normal px-4 md:h-13 md:px-7">
      {/* 행 높이 52 = 32 + 세로 여백 — 링크가 행을 꽉 채우면 링 위쪽이 뷰포트 밖으로 나간다 */}
      <Link to="/catalog" className={`my-2.5 flex h-8 flex-none items-center gap-2.5 ${FOCUS_RING}`}>
        <Logo size={24} />
        <span className="text-body1 font-bold tracking-(--tracking-tight)">{name}</span>
      </Link>
      <nav
        aria-label="주 메뉴"
        className="-mx-1 -mt-1 flex w-full gap-5.5 overflow-x-auto whitespace-nowrap px-1 pt-1 pb-3 text-body3 font-medium text-label-alternative md:m-0 md:w-auto md:flex-1 md:overflow-visible md:p-0"
      >
        <Link to="/catalog" aria-current={view.catalog ? "page" : undefined} className={navClass({ isActive: view.catalog })}>
          카탈로그
        </Link>
        <Link
          to="/catalog?tab=saved"
          aria-current={view.saved ? "page" : undefined}
          className={navClass({ isActive: view.saved })}
        >
          보관함
        </Link>
        <NavLink to="/compare" className={navClass}>
          비교 보드
        </NavLink>
        <Link to="/projects" aria-current={view.projects ? "page" : undefined} className={navClass({ isActive: view.projects })}>
          프로젝트
        </Link>
      </nav>
      <div className="ml-auto flex flex-none items-center gap-2.5 pb-3 md:p-0">
        {/* 버튼 모양 링크 — 이동이라 링크다(S-B1 상쇄 2순위: 훅·핸들러 제거). 모양은 Button primary sm */}
        <Link
          to="/compare?new=1"
          className={`inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-3 text-caption1 font-semibold leading-none tracking-(--tracking-snug) whitespace-nowrap text-on-primary hover:bg-primary-hover ${FOCUS_RING}`}
        >
          <Icon name="plus" size={16} />
          새 프로젝트
        </Link>
        <Avatar name={CURRENT_USER.name} size="sm" />
      </div>
    </header>
  );
}
