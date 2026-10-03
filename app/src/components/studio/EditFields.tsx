import { lazy, Suspense } from "react";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { setSlot } from "../../engine/ops/slotOps";
import { getSectionDefinition } from "../../engine/sections/registry";
import { slotIssue } from "../../features/studio/canvasIssues";
import { selectedSection } from "../../features/studio/selection";
import { Callout } from "../ds/Callout";
import { FieldEditor } from "./FieldEditor";
import { PageInfoFields } from "./PageInfoFields";

/** 사이트 주인용 안내(m2a K2) — contact/form 섹션을 고를 때만 받는다(조작 뒤 청크, /studio 진입 예산 — M2A-2b B6 실측) */
const ContactOwnerNote = lazy(() => import("./ContactOwnerNote"));

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
        <Suspense fallback={null}>
          <ContactOwnerNote Callout={Callout} />
        </Suspense>
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
