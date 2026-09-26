import { useEffect, useId, useRef, type ComponentType, type Ref } from "react";
import type { BoardWarning, WarningFix } from "../../domain/boardWarnings";
import type { ConfirmAvailability } from "../../domain/confirmGate";
import type { CustomStyle, DraftStatus } from "../../domain/compareBoard";
import type { FontOption } from "../../domain/fonts";
import { confirmLabel, statusLabel } from "../../features/compare/draftLabels";
import type { DraftItemView } from "../../features/compare/draftView";
import type { CustomStyleFieldsProps, PrimaryColorCheck } from "./CustomStyleFields";
import { Button } from "../ds/Button";
import { Callout, type CalloutTone } from "../ds/Callout";
import { cx } from "../ds/cx";
import { Tag, type TagTone } from "../ds/Tag";
import { DraftItem } from "./DraftItem";

/** 패널 상단 안내 — 열 해제(S-08·1.3)·동기화(S-14 STALE)·확정 오류(S-14) */
export interface PanelNotice {
  readonly id: string;
  readonly tone: CalloutTone;
  readonly title: string;
  readonly message: string;
  /** 확정 실패만 alert (A-9) */
  readonly alert?: boolean;
  readonly action?: { readonly label: string; readonly onClick: () => void };
}

export interface UndoView {
  readonly message: string;
  /** 초안 비우기 직후 포커스를 되돌리기로 (S-17) */
  readonly focus: boolean;
}

export interface Announcement {
  readonly text: string;
  /** 같은 문장을 다시 읽히게 바꾸는 키 */
  readonly key: number;
}

export interface DraftPanelProps {
  readonly items: readonly DraftItemView[];
  readonly status: DraftStatus;
  readonly hasPicks: boolean;
  readonly warnings: readonly BoardWarning[];
  readonly notices: readonly PanelNotice[];
  readonly custom: CustomStyle;
  readonly fonts: readonly FontOption[];
  readonly checkPrimaryColor: PrimaryColorCheck;
  readonly canConfirm: ConfirmAvailability;
  readonly confirming: boolean;
  readonly announcement: Announcement;
  readonly undo: UndoView | null;
  readonly onConfirm: () => void;
  readonly onClear: () => void;
  readonly onUndo: () => void;
  readonly onCustomChange: (custom: CustomStyle) => void;
  readonly onApplyFix: (fix: WarningFix) => void;
  /** 사용자 스타일 입력 — 엔진 청크가 싣는다(첫 화면 JS에서 뺌, V2-1 · SPEC B-5). 없으면 그리지 않는다 */
  readonly CustomStyleFields?: ComponentType<CustomStyleFieldsProps>;
  readonly headingRef?: Ref<HTMLHeadingElement>;
  readonly className?: string;
}

const STATUS_TAG: Record<DraftStatus["kind"], TagTone> = { unconfirmed: "neutral", confirmed: "green", changed: "orange" };

function Swatch({ hex }: { readonly hex: string }) {
  return <span aria-hidden="true" className="inline-block size-3.5 flex-none rounded-xs align-middle" style={{ backgroundColor: hex }} />;
}

/** 규칙별 경고 — 원인·수치·대체안 (SPEC 3.3·3.4 · D-11) */
function WarningCallout({ warning, onApplyFix }: { readonly warning: BoardWarning; readonly onApplyFix: (fix: WarningFix) => void }) {
  const actions = warning.fixes.flatMap((fix) =>
    fix.kind === "use-corrected-primary" || fix.kind === "pick-column"
      ? [
          <Button key={`${fix.kind}-${fix.actionLabel}`} variant="outline" size="sm" onClick={() => onApplyFix(fix)}>
            {fix.actionLabel}
          </Button>,
        ]
      : [],
  );
  return (
    <Callout tone={warning.tone === "info" ? "info" : "warning"} title={warning.title} action={actions.length > 0 ? actions : undefined}>
      <p>{warning.message}</p>
      {warning.fixes.map((fix) => {
        if (fix.kind === "use-corrected-primary") {
          return (
            <p key={fix.kind} className="mt-1 flex flex-wrap items-center gap-1.5">
              대체안: 가장 가까운 명도로 보정 <Swatch hex={fix.from} /> {fix.from} → <Swatch hex={fix.hex} /> 보정값 {fix.hex} (대비 {fix.ratio})
            </p>
          );
        }
        if (fix.kind === "auto-business-variant" || fix.kind === "defer-to-profile") {
          return (
            <p key={fix.kind} className="mt-1">
              대체안: {fix.message}
            </p>
          );
        }
        return null;
      })}
    </Callout>
  );
}

/**
 * 프로필 초안 패널 (SPEC 2.4 · 7.2 · v2 4.4 흰 면 + 넓은 화면 왼쪽 선). 초안 목록 · 사용자 스타일 · 경고 · 확정/비우기.
 * 확정할 수 없으면 disabled 대신 aria-disabled + 이유 텍스트 연결(A-8) — 누르면 화면이 이유를 다시 알린다.
 */
export function DraftPanel({
  items,
  status,
  hasPicks,
  warnings,
  notices,
  custom,
  fonts,
  checkPrimaryColor,
  canConfirm,
  confirming,
  announcement,
  undo,
  onConfirm,
  onClear,
  onUndo,
  onCustomChange,
  onApplyFix,
  CustomStyleFields,
  headingRef,
  className,
}: DraftPanelProps) {
  const headingId = useId();
  const reasonId = useId();
  const undoBox = useRef<HTMLDivElement>(null);
  const blocked = confirming || !canConfirm.ok;

  useEffect(() => {
    if (undo?.focus) undoBox.current?.querySelector("button")?.focus();
  }, [undo]);

  return (
    <section aria-labelledby={headingId} className={cx("flex flex-col gap-4 border-line-neutral max-xl:border-t max-xl:pt-6 xl:border-l xl:pl-6", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 id={headingId} ref={headingRef} tabIndex={-1} className="ds-heading1 focus:outline-none">
          프로필 초안
        </h2>
        <Tag tone={STATUS_TAG[status.kind]}>{statusLabel(status)}</Tag>
      </div>
      <p className="ds-caption1 text-label-alternative">고른 요소가 여기에 담기고, 고르지 않은 항목은 Hero를 고른 레퍼런스의 값으로 채워집니다.</p>
      <p role="status" aria-label="선택 알림" className="sr-only">
        <span key={announcement.key}>{announcement.text}</span>
      </p>
      {notices.map((notice) => {
        const box = (
          <Callout
            key={notice.id}
            tone={notice.tone}
            title={notice.title}
            action={notice.action && (
              <Button variant="outline" size="sm" onClick={notice.action.onClick}>
                {notice.action.label}
              </Button>
            )}
          >
            {notice.message}
          </Callout>
        );
        return notice.alert ? (
          <div key={notice.id} role="alert">
            {box}
          </div>
        ) : (
          box
        );
      })}
      {undo && (
        <div ref={undoBox} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-fill-normal px-3.5 py-2.5">
          <p className="ds-body3">{undo.message}</p>
          <Button variant="outline" size="sm" onClick={onUndo}>
            되돌리기
          </Button>
        </div>
      )}
      {hasPicks ? (
        <ul aria-label="초안 항목" className="flex flex-col">
          {items.map((item) => (
            <DraftItem key={item.rowId} rowLabel={item.label} valueLabel={item.valueLabel} source={item.source} note={item.note} swatch={item.swatch} dot={item.dot} />
          ))}
        </ul>
      ) : (
        <p className="ds-body3 rounded-md bg-fill-normal px-3.5 py-3 text-label-alternative">항목에서 '이 요소 선택'을 누르면 여기에 담깁니다</p>
      )}
      {CustomStyleFields && <CustomStyleFields value={custom} fonts={fonts} checkPrimaryColor={checkPrimaryColor} onChange={onCustomChange} />}
      {warnings.length > 0 && (
        <div className="flex flex-col gap-2">
          {warnings.map((warning) => (
            <WarningCallout key={`${warning.rule}-${warning.check ?? ""}`} warning={warning} onApplyFix={onApplyFix} />
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          aria-disabled={blocked || undefined}
          aria-busy={confirming || undefined}
          aria-describedby={!confirming && !canConfirm.ok ? reasonId : undefined}
          onClick={onConfirm}
          className="aria-disabled:cursor-not-allowed aria-disabled:bg-fill-strong aria-disabled:text-label-disable"
        >
          {confirmLabel(status, confirming)}
        </Button>
        {!confirming && !canConfirm.ok && (
          <p id={reasonId} className="ds-caption1 text-label-neutral">
            {canConfirm.reason}
          </p>
        )}
        <Button variant="assistive" fullWidth onClick={onClear}>
          초안 비우기
        </Button>
      </div>
    </section>
  );
}
