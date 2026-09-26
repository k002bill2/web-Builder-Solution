/**
 * 전역 조정 (DS-2A-04 3.4 · P-S07·S10~S13) — 밀도·대비·모션·사이트 목적 라디오 그룹(Q2) + 조정 저장·취소. 엔진 청크 전용(첫 화면 예산).
 * 범위 밖 옵션은 aria-disabled + 그룹 설명, 이어받은 값이 범위 밖이면 그 그룹에 Callout + "맞추기"(P-S13).
 * 모든 비활성 행동은 aria-disabled + 보이는 이유(5.2). 버튼이 사라지는 조작(취소·맞추기·다시 시도) 뒤에는 포커스를 옮긴다.
 */
import { useEffect, useId, useRef } from "react";
import { Button } from "../../components/ds/Button";
import { Callout } from "../../components/ds/Callout";
import { SegmentedControl } from "../../components/ds/SegmentedControl";
import type { MotionPreset } from "../../domain/compareBoard";
import type { AdjustmentRange } from "../../domain/profile";
import { PURPOSE_LABELS } from "../../fixtures/catalogFilters";
import type { AdjustKey, AdjustValues, RangedKey } from "./adjustmentDraft";
import { CONTRAST_LABELS, DENSITY_LABELS } from "./adjustmentText";
import { MOTION_PRESET_LABELS } from "./profileFields";

export interface SaveAlert {
  readonly text: string;
  /** 요청·응답 실패 — "다시 시도"(같은 인자, 멱등). STALE_PROFILE이면 없음 */
  readonly retry: boolean;
}

interface Group {
  readonly key: AdjustKey;
  readonly label: string;
  readonly options: Readonly<Record<string, string>>;
  readonly note?: string;
}

const GROUPS: readonly Group[] = [
  { key: "density", label: "밀도", options: DENSITY_LABELS },
  { key: "contrast", label: "대비", options: CONTRAST_LABELS },
  { key: "motion", label: "모션", options: MOTION_PRESET_LABELS satisfies Readonly<Record<MotionPreset, string>>, note: "높음(L3)은 생성 상한 밖이라 고를 수 없습니다" },
  { key: "purpose", label: "사이트 목적", options: { ...PURPOSE_LABELS, none: "정하지 않음" } },
];
export const OLD_VERSION_REASON = "이전 버전은 바꿀 수 없습니다";

/** 따옴표로 감싼 값 + 조사 — 마지막 글자 받침으로 고른다. 한글이 아니면(AA 등) 받침 없음으로 읽고, `rieulOpen`이면 ㄹ 받침도 "로" */
function quoted(word: string, [closed, open]: readonly [string, string], rieulOpen = false): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const final = code >= 0 && code <= 11171 ? code % 28 : 0;
  return `'${word}'${final === 0 || (rieulOpen && final === 8) ? open : closed}`;
}

export interface AdjustmentPanelProps {
  readonly values: AdjustValues;
  readonly range: AdjustmentRange;
  readonly editable: boolean;
  readonly pending: number;
  readonly outOfRange: readonly RangedKey[];
  readonly nextVersion: number;
  readonly saving: boolean;
  readonly alert: SaveAlert | null;
  readonly fitOf: (key: RangedKey) => string;
  readonly onPick: (key: AdjustKey, value: string) => void;
  readonly onSave: () => void;
  readonly onCancel: () => void;
}

export function AdjustmentPanel(props: AdjustmentPanelProps) {
  const { values, range, editable, pending, outOfRange, saving } = props;
  const headingId = useId();
  const reasonId = useId();
  const saveId = useId();
  const section = useRef<HTMLElement>(null);
  const focusAfter = useRef<string | null>(null);
  useEffect(() => {
    const target = focusAfter.current;
    focusAfter.current = null;
    if (target === "save") document.getElementById(saveId)?.focus();
    else if (target) section.current?.querySelector<HTMLElement>(`[role="radiogroup"][aria-label="${target}"] [tabindex="0"]`)?.focus();
  });

  const reason = !editable
    ? OLD_VERSION_REASON
    : saving
      ? undefined
      : outOfRange.length > 0
        ? "허용 범위 밖 값이 있어 저장할 수 없습니다 — '맞추기'로 바꾸세요"
        : pending === 0
          ? "바꾼 조정이 없습니다"
          : undefined;
  const blocked = saving || reason !== undefined;
  const save = () => {
    if (!blocked) props.onSave();
  };

  return (
    <section ref={section} aria-labelledby={headingId} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id={headingId} className="ds-heading2">
          전역 조정
        </h2>
        {pending > 0 && <p className="ds-body3 font-semibold">저장하지 않은 조정 {pending}개</p>}
      </div>
      {GROUPS.map((g) => {
        const allowed = g.key === "purpose" ? undefined : (range[g.key] as readonly string[]);
        const blockedOptions = allowed ? Object.keys(g.options).filter((v) => !allowed.includes(v)) : [];
        const description = [
          !editable && OLD_VERSION_REASON,
          editable && blockedOptions.length > 0 && `${blockedOptions.map((v) => g.options[v]).join("·")}: 이 테마에서 쓸 수 없음`,
          g.note,
        ]
          .filter(Boolean)
          .join(" · ");
        const current = values[g.key];
        const outside = editable && g.key !== "purpose" && outOfRange.includes(g.key);
        const fit = outside ? props.fitOf(g.key as RangedKey) : undefined;
        return (
          <div key={g.key} className="flex flex-col gap-1.5">
            <span aria-hidden="true" className="ds-label">
              {g.label}
            </span>
            <SegmentedControl
              label={g.label}
              options={Object.entries(g.options).map(([value, label]) => ({ value, label, disabled: !editable || blockedOptions.includes(value) }))}
              value={current}
              onChange={(value) => props.onPick(g.key, value)}
              {...(description && { description })}
            />
            {fit !== undefined && (
              <Callout
                tone="warning"
                title={`지금 값 ${quoted(g.options[current] ?? current, ["은", "는"])} 허용 범위 밖이라 저장할 수 없습니다`}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      focusAfter.current = g.label;
                      props.onPick(g.key, fit);
                    }}
                  >
                    {`${quoted(g.options[fit] ?? fit, ["으로", "로"], true)} 맞추기`}
                  </Button>
                }
              />
            )}
          </div>
        );
      })}
      {props.alert && (
        <div role="alert" className="ds-body3 flex flex-wrap items-center gap-2 rounded-md bg-status-negative-bg p-3 text-status-negative-text">
          <span>{props.alert.text}</span>
          {props.alert.retry && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // 저장을 시작하면 알림과 함께 이 버튼이 사라진다 — 포커스를 조정 저장 버튼으로(첫 저장 경로와 같게, D-2A4B2-02)
                if (!blocked) focusAfter.current = "save";
                save();
              }}
            >
              다시 시도
            </Button>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          id={saveId}
          aria-disabled={blocked || undefined}
          aria-busy={saving || undefined}
          aria-describedby={reason ? reasonId : undefined}
          onClick={save}
          className="aria-disabled:cursor-not-allowed aria-disabled:bg-fill-strong aria-disabled:text-label-disable aria-disabled:hover:bg-fill-strong"
        >
          {saving ? "저장 중…" : `조정 저장 (v${props.nextVersion})`}
        </Button>
        {editable && pending > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              focusAfter.current = "save";
              props.onCancel();
            }}
          >
            조정 취소
          </Button>
        )}
      </div>
      {reason && (
        <p id={reasonId} className="ds-caption1 text-label-alternative">
          {reason}
        </p>
      )}
    </section>
  );
}
