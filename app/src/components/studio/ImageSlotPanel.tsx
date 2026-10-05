import type { PageDoc } from "../../engine/contracts/pageDoc";
import type { ImageHost } from "../../features/studio/images/store/types";

export interface ImageSlotPanelProps {
  readonly doc: PageDoc;
  readonly instanceId: string;
  readonly onEdit: (next: PageDoc) => void;
  readonly host: ImageHost;
}

export default function ImageSlotPanel(props: ImageSlotPanelProps) {
  return <p>{props.instanceId}</p>;
}
