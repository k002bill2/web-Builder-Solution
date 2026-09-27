import { useEffect, type ReactNode, type Ref } from "react";
import { Link } from "react-router";

/**
 * 집중 모드 툴바 (DS-2A-05 3.1 · 4.2 · E-AC-03). 앱 GNB 대신 `header` 1개.
 * h1 = 프로젝트 이름(툴바 글자 크기, 한 줄 말줄임 — E-S33 · J-S08). `tabIndex=-1` = 진입·복원 포커스 대상(6.4).
 * `document.title` = "<프로젝트 이름> 편집"(6.1 · B-05). 폭별 항목(문서 Tag ≥1280 · `Select` 1024 · 저장 상태 <1024 h1 아래 줄)은 부르는 쪽이 정한다(4.2).
 */
export function StudioToolbar({
  projectName,
  docTag,
  headingRef,
  children,
  subline,
}: {
  readonly projectName: string;
  readonly docTag?: string;
  readonly headingRef: Ref<HTMLHeadingElement>;
  /** h1 오른쪽 항목(저장 상태 · 섹션 Select · 미리보기 폭) */
  readonly children?: ReactNode;
  /** h1 아래 줄(<1024 저장 상태) */
  readonly subline?: ReactNode;
}) {
  useEffect(() => {
    document.title = `${projectName} 편집`;
  }, [projectName]);
  return (
    <header className="flex min-h-13 flex-none flex-wrap items-center gap-2 border-b border-line-normal bg-background-normal px-3 py-2">
      <Link
        to="/projects"
        aria-label="프로젝트로 돌아가기"
        className="inline-flex size-8 flex-none items-center justify-center rounded-md text-label-neutral hover:bg-fill-normal"
      >
        {/* chevron-left 모양은 테두리 두 변으로 그린다 — `Icon`·SVG URL을 import하면 공통 청크가 다시 나뉜다(+0.39 · +0.08KB 실측, REPORT) */}
        <span aria-hidden="true" className="ml-1 size-2.5 rotate-45 border-b-2 border-l-2 border-current" />
      </Link>
      <h1 ref={headingRef} tabIndex={-1} title={projectName} className="min-w-0 flex-1 truncate text-body1 font-bold focus:outline-none">
        {projectName}
      </h1>
      {docTag && <span className="ds-caption1 flex-none rounded-sm bg-fill-strong px-2 py-0.5 text-label-neutral">{docTag}</span>}
      {children}
      {subline && <div className="basis-full ps-10">{subline}</div>}
    </header>
  );
}
