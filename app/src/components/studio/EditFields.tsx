import type { PageDoc } from "../../engine/contracts/pageDoc";
import { setSlot } from "../../engine/ops/slotOps";
import { getSectionDefinition } from "../../engine/sections/registry";
import { slotIssue } from "../../features/studio/canvasIssues";
import { selectedSection } from "../../features/studio/selection";
import { Callout } from "../ds/Callout";
import { FieldEditor } from "./FieldEditor";
import { PageInfoFields } from "./PageInfoFields";

/** 사이트 주인용 안내 (m2a K2 문구 2) — 문의 폼은 보내기가 꺼진 채 나간다(A안). 렌더 문서에는 넣지 않는다(편집기 UI 0, 5.7 r4.8) */
const CONTACT_OWNER_NOTE = "내보낸 페이지에서 이 문의 양식은 보내기가 꺼진 채로 나갑니다. 방문자에게는 '온라인 문의는 준비 중입니다' 안내가 보입니다. 받는 곳 연결은 다음 단계에서 다룹니다.";

/**
 * 편집 패널 필드 (SPEC 5.6 · E-AC-06) — 선택 섹션의 글자 슬롯(`FieldEditor`) 또는 "페이지 정보"(`PageInfoFields`).
 * 필드 key·id에 instanceId를 넣는다 — 섹션을 바꾸면 내부 상태(blur 등)가 새로 시작하고 id가 겹치지 않는다. 이미지 슬롯은 a3(E-S20).
 */
export function EditFields({ doc, selectedId, onEdit }: { readonly doc: PageDoc; readonly selectedId: string; readonly onEdit: (next: PageDoc) => void }) {
  const section = selectedSection(doc, selectedId);
  if (!section) return <PageInfoFields meta={doc.meta} onChange={(meta) => onEdit({ ...doc, meta })} />;
  const slots = getSectionDefinition(section.type, section.variant)?.slots ?? [];
  const images = slots.filter((entry) => entry.kind === "image").length;
  return (
    <div className="flex flex-col gap-4">
      {section.type === "contact" && section.variant === "form" && (
        <Callout tone="info" title="내보낸 페이지의 문의 양식">
          {CONTACT_OWNER_NOTE}
        </Callout>
      )}
      {slots.map((entry) => {
        if (entry.kind === "image") return null;
        const value = section.slots[entry.key];
        return (
          <FieldEditor
            key={`${section.instanceId}-${entry.key}`}
            id={`field-${section.instanceId}-${entry.key}`}
            spec={entry}
            value={typeof value === "string" ? value : ""}
            onChange={(next) => onEdit(setSlot(doc, section.instanceId, entry.key, next))}
            describedBy={slotIssue(section, entry)?.id}
          />
        );
      })}
      {images > 0 && <p className="ds-caption1 text-label-alternative">이미지 슬롯 {images}개는 다음 단계에서 편집할 수 있습니다.</p>}
    </div>
  );
}
