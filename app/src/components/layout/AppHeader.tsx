import { Link, NavLink, useNavigate } from "react-router";
import { brand } from "../../brand/brand.config";
import { CURRENT_USER } from "../../fixtures/catalogFilters";
import { Avatar } from "../ds/Avatar";
import { Button } from "../ds/Button";

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "font-bold text-label-normal" : "hover:text-label-normal";

/** 상단 GNB (목업 57~64행). */
export function AppHeader() {
  const navigate = useNavigate();
  const { Logo, name } = brand;
  return (
    <header className="flex h-15 items-center gap-7 border-b border-line-neutral bg-background-normal px-4 md:px-7">
      <Link to="/catalog" className="flex flex-none items-center gap-2.5">
        <Logo size={24} />
        <span className="text-body1 font-bold tracking-(--tracking-tight)">{name}</span>
      </Link>
      <nav aria-label="주 메뉴" className="hidden flex-1 gap-5.5 text-body2 font-medium text-label-alternative md:flex">
        <NavLink to="/catalog" end className={navClass}>
          카탈로그
        </NavLink>
        <Link to="/catalog?tab=saved" className="hover:text-label-normal">
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
