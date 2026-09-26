/**
 * 프로필 패널 (DS-2A-04 5.1 · 3.3 · 3.4) — 값 · 팔레트와 대비 · 전역 조정 · 버전. 저장 안 된 조정(초안)을 여기서 들고 있다. 엔진 청크 전용.
 * 배치: ≥1280은 한 열(오른쪽은 3안), 1024~1279는 안에서 2열(값·팔레트 / 조정·버전), 그 아래는 한 열. DOM 순서 = 보이는 순서.
 * 견본·값은 보는 버전의 적용된 값, 대비 검사·제안은 초안(대비 수준·쓴 보정)을 따른다 — 강화를 고르고 바로 보정값을 쓸 수 있게(P-AC-19).
 * 초안은 저장 성공에서 비우고, 되돌리기 성공(`resetKey` 변경)에서 버린다. STALE_PROFILE에서는 남긴다(P-S12).
 */
import { useState, type ReactNode } from "react";
import { PaletteContrast, type SwatchEntry } from "../../components/profile/PaletteContrast";
import type { AdjustmentRange, ProfileAdjustments, ProfileVersion } from "../../domain/profile";
import type { PaletteEntry } from "../../domain/referenceDetail";
import { NO_EDITS, applyEdits, fitValue, outOfRange, pendingCount, pickValue, valuesOf, writeCorrection, type AdjustKey, type AdjustValues, type Edits } from "./adjustmentDraft";
import { AdjustmentPanel, OLD_VERSION_REASON, type SaveAlert } from "./AdjustmentPanel";
import { PALETTE_ROLES } from "./profileFields";
import { contrastView } from "./profileMessages";

export interface ProfilePanelProps {
  readonly values: ReactNode;
  readonly versions: ReactNode;
  readonly viewed: ProfileVersion;
  readonly latest: ProfileVersion;
  readonly range: AdjustmentRange;
  readonly saving: boolean;
  readonly saveAlert: SaveAlert | null;
  /** 성공하면 true — 초안을 비운다 */
  readonly onSave: (adjustments: ProfileAdjustments) => Promise<boolean>;
  /** 바뀌면 초안을 버린다(되돌리기 성공) */
  readonly resetKey: number;
}

const paletteOf = (v: ProfileVersion, adjustments: ProfileAdjustments): readonly PaletteEntry[] =>
  PALETTE_ROLES.map((role) => ({ role, hex: adjustments.corrections?.find((c) => c.role === role)?.to ?? v.base.color_tokens[role].$value }));

export function ProfilePanel(props: ProfilePanelProps) {
  const { viewed, latest, range } = props;
  const [state, setState] = useState<{ readonly key: number; readonly edits: Edits }>({ key: props.resetKey, edits: NO_EDITS });
  const edits = state.key === props.resetKey ? state.edits : NO_EDITS;
  const setEdits = (next: Edits) => setState({ key: props.resetKey, edits: next });

  const editable = viewed.version === latest.version;
  const saved = latest.adjustments;
  const draft = editable ? applyEdits(saved, edits, latest.base) : viewed.adjustments;
  const values = valuesOf(draft, viewed.base);
  const pending = editable ? pendingCount(saved, draft, latest.base) : 0;
  const blockedRange = editable ? outOfRange(values, range) : [];

  const board = paletteOf(viewed, {});
  const swatches: readonly SwatchEntry[] = paletteOf(viewed, viewed.adjustments).map((p, i) =>
    p.hex.toUpperCase() === board[i]!.hex.toUpperCase() ? p : { ...p, boardHex: board[i]!.hex.toUpperCase() },
  );
  const written = new Set(editable ? Object.keys(edits.corrections) : []) as ReadonlySet<PaletteEntry["role"]>;
  const contrast = contrastView(paletteOf(viewed, draft), viewed.base.component_choices.card_style?.surfaceTone, values.contrast, board, written);

  const save = async () => {
    if (await props.onSave(draft)) setEdits(NO_EDITS);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-1">
      <div className="flex min-w-0 flex-col gap-8">
        {props.values}
        <PaletteContrast
          palette={swatches}
          contrast={contrast}
          onWrite={(p) => setEdits(writeCorrection(edits, saved, { role: p.role, from: p.from, to: p.to, check: p.check }))}
          {...(!editable && { blockedReason: OLD_VERSION_REASON })}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-8">
        <AdjustmentPanel
          values={values}
          range={range}
          editable={editable}
          pending={pending}
          outOfRange={blockedRange}
          nextVersion={latest.version + 1}
          saving={props.saving}
          alert={props.saveAlert}
          fitOf={(key) => fitValue(key, range, latest.base)}
          onPick={(key: AdjustKey, value: string) => setEdits(pickValue(edits, saved, latest.base, key, value as AdjustValues[AdjustKey]))}
          onSave={() => void save()}
          onCancel={() => setEdits(NO_EDITS)}
        />
        {props.versions}
      </div>
    </div>
  );
}
