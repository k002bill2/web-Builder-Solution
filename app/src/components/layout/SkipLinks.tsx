import type { MouseEvent } from "react";
import { useLocation } from "react-router";

/** 건너뛰기 대상 id. 대상 요소는 tabIndex={-1}로 프로그램 포커스를 받는다. */
export const MAIN_CONTENT_ID = "main-content";
export const CATALOG_RESULTS_ID = "catalog-results";

const LINK_CLASS =
  "ds-label sr-only rounded-md bg-surface-inverse px-4 py-2.5 text-on-surface-inverse shadow-4 " +
  "focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:outline-none focus:shadow-(--focus-ring)";

/**
 * 첫 Tab 정지점의 건너뛰기 링크 (A03). 해시 이동 대신 대상에 직접 포커스를 준다 —
 * 라우터 안에서 `#id`로 이동하면 history 항목이 생기고 스크롤 관리가 반응한다.
 */
function SkipLink({ target, children }: { readonly target: string; readonly children: string }) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById(target)?.focus();
  };
  return (
    <a href={`#${target}`} onClick={onClick} className={LINK_CLASS}>
      {children}
    </a>
  );
}

export function SkipLinks() {
  const { pathname } = useLocation();
  return (
    <>
      <SkipLink target={MAIN_CONTENT_ID}>본문으로 건너뛰기</SkipLink>
      {pathname === "/catalog" && <SkipLink target={CATALOG_RESULTS_ID}>결과로 건너뛰기</SkipLink>}
    </>
  );
}
