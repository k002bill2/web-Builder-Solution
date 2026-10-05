import { useEffect, useRef, useState } from "react";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import type { SlotSchemaEntry } from "../../engine/contracts/sectionDefinition";
import type { ImageHost } from "../../features/studio/images/store/types";
import type { Button as ButtonType } from "../ds/Button";
import { ImageSlotField, type PanelLatest } from "./ImageSlotField";

export interface ImageSlotPanelProps {
  readonly doc: PageDoc;
  readonly instanceId: string;
  readonly onEdit: (next: PageDoc) => void;
  /** 선택 섹션 정의의 슬롯 — 부르는 쪽(EditFields)이 이미 구했다. 패널이 registry를 import하면 청크가 다시 나뉜다(실측) */
  readonly slots: readonly SlotSchemaEntry[];
  readonly host: ImageHost;
  /** DS Button은 부르는 쪽이 넘긴다 — 이 청크가 진입 청크의 DS를 import하면 공유 청크로 갈라진다(`ContactOwnerNote` 관례) */
  readonly Button: typeof ButtonType;
}

/**
 * 이미지 슬롯 패널 (SPEC m2c 2.1 조작 뒤 층 · 2.2 · 2.5 · 2a-05 5.9) — "이미지 편집"을 펼칠 때만 받는 lazy 청크.
 * 슬롯마다 스위치·미리보기·파일 고르기·대체텍스트·장식·안내. 낭독은 패널의 `role=status` 1개.
 * 참조 밖 이미지 해제는 편집 틀(StudioLayout)이 패널 표시와 무관하게 맡는다(Codex r1 P2) — 패널은 넣기 전에 한 번 더 정리한다.
 */
export default function ImageSlotPanel({ doc, instanceId, onEdit, slots, host, Button }: ImageSlotPanelProps) {
  const [images, publish, undoDoc] = host;
  const [status, setStatus] = useState("");
  const latest = useRef<PanelLatest>({ doc, images, undoDoc });
  useEffect(() => {
    latest.current = { doc, images, undoDoc };
  }, [doc, images, undoDoc]);
  const section = doc.sections.find((s) => s.instanceId === instanceId);
  if (!section) return null;
  return (
    <div className="flex flex-col gap-5 pt-2 pb-3">
      <p role="status" className="sr-only">
        {status}
      </p>
      {slots.filter((entry) => entry.kind === "image").map((entry) => (
        <ImageSlotField key={entry.key} section={section} entry={entry} doc={doc} images={images} latest={latest} publish={publish} onEdit={onEdit} announce={setStatus} Button={Button} />
      ))}
      <p className="ds-caption1 text-label-alternative">고른 이미지는 이 탭의 편집기 안에서만 보관됩니다 — 편집기를 나가거나 새로고침하면 다시 골라야 합니다</p>
    </div>
  );
}
