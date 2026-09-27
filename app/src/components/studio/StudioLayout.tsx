import { useEffect, useRef, useState } from "react";
import type { Project } from "../../data/projectRepository";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { docTagText, initialSelection, resolveSelection } from "../../features/studio/selection";
import { SectionList } from "./SectionList";
import { StudioToolbar } from "./StudioToolbar";

/**
 * E-S05 기본 편집 틀 (DS-2A-05 3.1 · 4절). 편집 알림(6.3)은 `role=status` 1개 — 늘 그려 두고(비어 있어도) 이동 알림은 첫 표시 뒤 1회 넣는다.
 * `focusHeading` = "편집 시작"으로 도착(이동 state 있음) → h1로 포커스(QA D3).
 */
export function StudioLayout({
  project,
  doc,
  entryNotice,
  focusHeading,
}: {
  readonly project: Project;
  readonly doc: PageDoc;
  readonly entryNotice: string | undefined;
  readonly focusHeading: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const focused = useRef(false);
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(() => initialSelection(doc));
  const selectedId = resolveSelection(doc, selected);

  // 영역을 먼저 비운 채 그린 뒤 글자를 넣는다 — 스크린 리더가 status 변화로 읽는다
  useEffect(() => {
    if (!entryNotice) return;
    const id = setTimeout(() => setNotice(entryNotice), 0);
    return () => clearTimeout(id);
  }, [entryNotice]);
  useEffect(() => {
    if (!focusHeading || focused.current) return;
    focused.current = true;
    heading.current?.focus();
  }, [focusHeading]);

  return (
    <div className="flex flex-col">
      <StudioToolbar projectName={project.name} docTag={docTagText(doc)} headingRef={heading} />
      <p role="status" aria-label="편집 알림" className="ds-body2 px-3 empty:p-0">
        {notice}
      </p>
      <nav aria-labelledby="studio-sections-heading" className="flex flex-col gap-2 p-3">
        <h2 id="studio-sections-heading" className="ds-heading2">
          섹션
        </h2>
        <SectionList sections={doc.sections} selectedId={selectedId} onSelect={setSelected} />
      </nav>
    </div>
  );
}
