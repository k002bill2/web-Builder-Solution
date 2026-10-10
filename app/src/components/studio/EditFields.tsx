import { lazy, Suspense, useState } from "react";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { setSlot } from "../../engine/ops/slotOps";
import { getSectionDefinition } from "../../engine/sections/registry";
import { slotIssue } from "../../features/studio/canvasIssues";
import { sectionName, selectedSection } from "../../features/studio/selection";
import { Button } from "../ds/Button";
import { Callout } from "../ds/Callout";
import type { ImageHost } from "../../features/studio/images/store/types";
import { FieldEditor } from "./FieldEditor";
import { PageInfoFields } from "./PageInfoFields";

/** 사이트 주인용 안내(m2a K2 · 예약 MQ-B4) — contact(form · booking) 섹션을 고를 때만 받는다(조작 뒤 청크, /studio 진입 예산 — M2A-2b B6 실측) */
const ContactOwnerNote = lazy(() => import("./ContactOwnerNote"));
/** 이미지 슬롯 패널(SPEC m2c 2.1) — "이미지 편집"을 펼칠 때만 받는다(조작 뒤, VariantSwitch와 같은 모양 — 진입 +0.03KB 예산) */
const ImageSlotPanel = lazy(() => import("./ImageSlotPanel"));

/** 필드 도움말 — services/list `items`는 가운뎃점으로만 나눈다(SPEC-BODY MQ-B1 · 줄바꿈은 구분자가 아니다) */
const ITEMS_HINT = "가운뎃점(·)으로 나눕니다";

/**
 * 편집 패널 필드 (SPEC 5.6 · E-AC-06) — 선택 섹션의 글자 슬롯(`FieldEditor`) 또는 "페이지 정보"(`PageInfoFields`).
 * 필드 key·id에 instanceId를 넣는다 — 섹션을 바꾸면 내부 상태(blur 등)가 새로 시작하고 id가 겹치지 않는다.
 * 이미지 슬롯: 진입 층은 "이미지 편집 (N)" 펼침 1개 — 펼치면 패널 청크를 받는다. 펼친 채 섹션을 바꾸면 그 섹션의 패널을 그린다.
 */
export function EditFields({
  doc,
  selectedId,
  onEdit,
  images: host,
  imagesOpen,
  onField,
}: {
  readonly doc: PageDoc;
  readonly selectedId: string;
  readonly onEdit: (next: PageDoc) => void;
  /** 글자 칸 입력 = 실행 취소 기록 묶음(FIELD-UNDO 4.1 · key · 이름 "{섹션} {라벨} 편집") — 없으면 onEdit */
  readonly onField?: (key: string, label: string, next: PageDoc, composing?: boolean) => void;
  /** 편집 틀의 이미지 보관소 자리 — 없으면(필드만 보는 화면 테스트) 이미지 줄을 그리지 않는다 */
  readonly images?: ImageHost;
  /** "이미지 편집" 펼침 상태 — 편집 틀이 들면 폭 변경(배치 전환 = 이 컴포넌트 재마운트)에도 남는다(B-M2C-04). 없으면 이 안에서 든다 */
  readonly imagesOpen?: readonly [boolean, (open: boolean) => void];
}) {
  const local = useState(false);
  const [open, setOpen] = imagesOpen ?? local;
  const section = selectedSection(doc, selectedId);
  const typed = onField ?? ((_key: string, _label: string, next: PageDoc) => onEdit(next));
  if (!section) return <PageInfoFields meta={doc.meta} onChange={(meta, label, composing) => typed(label, `페이지 정보 ${label} 편집`, { ...doc, meta }, composing)} />;
  const slots = getSectionDefinition(section.type, section.variant)?.slots ?? [];
  const images = slots.filter((entry) => entry.kind === "image").length;
  return (
    <div className="flex flex-col gap-4">
      {section.type === "contact" && (section.variant === "form" || section.variant === "booking") && (
        <Suspense fallback={null}>
          <ContactOwnerNote Callout={Callout} booking={section.variant === "booking"} />
        </Suspense>
      )}
      {slots.map((entry) => {
        if (entry.kind === "image") return null;
        const value = section.slots[entry.key];
        const key = `${section.instanceId}-${entry.key}`;
        return (
          <FieldEditor
            key={key}
            id={`field-${section.instanceId}-${entry.key}`}
            spec={entry}
            value={typeof value === "string" ? value : ""}
            onChange={(next, composing) => typed(key, `${sectionName(section)} ${entry.label} 편집`, setSlot(doc, section.instanceId, entry.key, next), composing)}
            describedBy={slotIssue(section, entry)?.id}
            hint={section.type === "services" && section.variant === "list" && entry.key === "items" ? ITEMS_HINT : undefined}
          />
        );
      })}
      {images > 0 && host && (
        <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="rounded-md border border-line-normal px-3 py-1">
          <summary className="ds-label min-h-8 cursor-pointer py-1.5">이미지 편집 ({images})</summary>
          {open && (
            <Suspense fallback={null}>
              <ImageSlotPanel key={section.instanceId} doc={doc} instanceId={section.instanceId} onEdit={onEdit} slots={slots} host={host} Button={Button} />
            </Suspense>
          )}
        </details>
      )}
    </div>
  );
}
