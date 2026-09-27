import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { brand } from "../../brand/brand.config";
import { CURRENT_USER } from "../../fixtures/currentUser";
import { Avatar } from "../ds/Avatar";
import { Button } from "../ds/Button";

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
  return { catalog: (onCatalog && !saved) || pathname.startsWith("/references/"), saved };
}

/** 상단 GNB — 52px 한 줄, <768에서는 주 메뉴가 헤더 아래 한 줄로 내려간다 (v2 SPEC 4.1 · Q5). */
export function AppHeader() {
  const navigate = useNavigate();
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
        className="order-last -mx-1 -mt-1 flex w-full gap-5.5 overflow-x-auto whitespace-nowrap px-1 pt-1 pb-3 text-body3 font-medium text-label-alternative md:order-none md:m-0 md:w-auto md:flex-1 md:overflow-visible md:p-0"
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
        <NavLink to="/profile" className={navClass}>
          프로젝트
        </NavLink>
      </nav>
      <div className="ml-auto flex flex-none items-center gap-2.5">
        <Button variant="primary" size="sm" leadingIcon="plus" onClick={() => navigate("/profile")}>
          새 프로젝트
        </Button>
        <Avatar name={CURRENT_USER.name} size="sm" />
      </div>
    </header>
  );
}
