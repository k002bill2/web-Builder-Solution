import { Link } from "react-router";

/** 이번 handoff 범위 밖 화면의 자리표시 (M1-UI-01 브리프 2절 6). */
export function PlaceholderPage({ title, screen }: { readonly title: string; readonly screen: string }) {
  return (
    <div className="mx-auto flex max-w-(--layout-max-width) flex-col items-start gap-3 px-4 py-16 md:px-7">
      <span className="ds-caption1 text-label-alternative">시안 {screen}</span>
      <h1 className="ds-title1">{title}</h1>
      <p className="ds-body2 text-label-alternative">이 화면은 다음 단계에서 구현됩니다.</p>
      <Link to="/catalog" className="ds-label text-primary hover:text-primary-hover">
        카탈로그로 돌아가기
      </Link>
    </div>
  );
}
