import { useEffect, useRef, useState, type RefObject } from "react";
import type { ImageSlotValue, LocalImageId, PageDoc, SectionInstance } from "../../engine/contracts/pageDoc";
import type { SlotSchemaEntry } from "../../engine/contracts/sectionDefinition";
import { setSlot } from "../../engine/ops/slotOps";
import { addImage, checkLimits, imageMeta, pruneImages, retainedIds, slotTarget } from "../../features/studio/images/store/imageStore";
import type { ImageHost, RenderImages } from "../../features/studio/images/store/types";
import type { Button as ButtonType } from "../ds/Button";

/** 변환이 끝난 순간의 문서·맵 — 변환 중 편집(글자 입력 등)을 덮어쓰지 않게 최신 값으로 넣는다 */
export interface PanelLatest {
  readonly doc: PageDoc;
  readonly images: RenderImages | undefined;
  readonly undoDoc: PageDoc | undefined;
}

interface FieldProps {
  readonly section: SectionInstance;
  readonly entry: SlotSchemaEntry;
  readonly doc: PageDoc;
  readonly images: RenderImages | undefined;
  readonly latest: RefObject<PanelLatest>;
  /** 넣은 결과를 최신 값에 바로 올린다 — 같은 틱에 끝난 다른 슬롯 결과가 이 위에 쌓이게(Codex r2 P2 — 원자적 병합) */
  readonly remember: (doc: PageDoc, images: RenderImages) => void;
  readonly publish: ImageHost[1];
  readonly onEdit: (next: PageDoc) => void;
  readonly announce: (text: string) => void;
  readonly Button: typeof ButtonType;
}

const PLACEHOLDER = { kind: "placeholder", patternId: "diagonal" } as const;
const FORMAT = { webp: "WebP", jpeg: "JPEG", png: "PNG" } as const;
const SLOW_MS = 2000;
const CHUNK_FAILED = "이미지를 준비하지 못했습니다 — 다시 골라 주세요";
const BOX =
  "w-full rounded-md border-(length:--border-thick) border-line-strong bg-background-normal px-4 py-2 text-body3 text-label-normal outline-none " +
  "focus:border-primary focus:shadow-(--focus-ring) aria-disabled:bg-fill-normal aria-disabled:text-label-alternative";

const slotValue = (section: SectionInstance, key: string): ImageSlotValue | undefined => {
  const value = section.slots[key];
  return typeof value === "object" ? value : undefined;
};

/**
 * 파일 고르기 → 변환기(파일을 고른 순간 동적 import, SPEC 2.1) → 한도(보관 바이트) → 문서·맵 반영.
 * 마지막 선택만 반영(IMG-AC-09) · 실패·한도 초과 = 필드 오류, 문서·맵 불변(IMG-AC-08·11) · 파일 이름은 어디에도 두지 않는다(IMG-AC-15).
 */
function useImagePick({ section, entry, latest, remember, publish, onEdit, announce }: FieldProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const turn = useRef(0);
  const slow = useRef<ReturnType<typeof setTimeout>>(undefined);
  // 패널이 닫히면(섹션 바꿈·펼침 닫음) 진행 중 작업을 버린다 — 늦게 끝난 결과가 그 사이 편집을 덮어쓰지 않게(Codex r1 P1)
  useEffect(() => {
    const turns = turn;
    return () => {
      turns.current += 1;
      clearTimeout(slow.current);
    };
  }, []);
  const fail = (message: string) => {
    setError(message);
    announce(message);
  };
  /** 스위치 끄기·이미지 지우기 — 진행 중 작업을 버린다(늦게 끝난 결과가 그 조작을 되돌리지 않게, Codex r2 P2) */
  const cancel = () => {
    turn.current += 1;
    clearTimeout(slow.current);
    setBusy(false);
  };
  const pick = async (file: File) => {
    const mine = ++turn.current;
    setBusy(true);
    setError("");
    announce("이미지를 준비하고 있습니다");
    clearTimeout(slow.current);
    slow.current = setTimeout(() => announce("큰 이미지라 시간이 걸리고 있습니다"), SLOW_MS);
    // 변환기 청크 로드·변환 실패 = 다시 고를 수 있는 필드 오류(진행 해제, Codex r2 P2)
    const outcome = await import("../../features/studio/images/ingest")
      .then(async ({ ingestImage, ingestErrorMessage }) => {
        const result = await ingestImage(file);
        return result.ok ? result : ingestErrorMessage(result);
      })
      .catch(() => CHUNK_FAILED);
    if (mine !== turn.current) return;
    clearTimeout(slow.current);
    setBusy(false);
    if (typeof outcome === "string") return fail(outcome);
    const result = outcome;
    const { doc, images, undoDoc } = latest.current;
    const current = doc.sections.find((s) => s.instanceId === section.instanceId);
    const value = current && slotValue(current, entry.key);
    // randomUUID = UUID v4 소문자 = LOCAL_IMAGE_ID 형식 그대로(Q-13). parseLocalImageId를 import하면 청크가 갈라진다(실측 — REPORT)
    const id = crypto.randomUUID() as LocalImageId;
    if (!current || !value) return;
    const nextDoc = setSlot(doc, current.instanceId, entry.key, { ...value, enabled: true, source: id });
    const nextImages = addImage(pruneImages(images, retainedIds(nextDoc, undoDoc)), id, result.image, slotTarget(current.type, current.variant));
    const limit = checkLimits(nextDoc, undoDoc, nextImages);
    if (!limit.ok) return fail(limit.message);
    remember(nextDoc, nextImages);
    publish(() => nextImages);
    onEdit(nextDoc);
    announce(value.alt.trim() === "" && !value.decorative ? "이미지를 넣었습니다 대체텍스트를 적어 주세요" : "이미지를 넣었습니다");
  };
  return { busy, error, pick, cancel };
}

/** 미리보기 object URL은 이 요소만 소유한다 — 사라지면 해제(편집기를 떠나면 살아 있는 URL 0, E-AC-46) */
function Preview({ blob }: { readonly blob: Blob }) {
  const img = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const created = URL.createObjectURL(blob);
    if (img.current) img.current.src = created;
    return () => URL.revokeObjectURL(created);
  }, [blob]);
  return <img ref={img} alt="" className="aspect-video w-full rounded-md bg-fill-normal object-cover" />;
}

function AltFields({ id, value, onChange }: { readonly id: string; readonly value: ImageSlotValue; readonly onChange: (next: ImageSlotValue) => void }) {
  const help = `${id}-help`;
  const reason = `${id}-reason`;
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="ds-label text-label-normal">
          대체텍스트
          {!value.decorative && <span className="ml-1 text-label-alternative">(필수)</span>}
        </label>
        <input
          id={id}
          type="text"
          value={value.alt}
          readOnly={value.decorative}
          aria-disabled={value.decorative || undefined}
          aria-describedby={value.decorative ? `${reason} ${help}` : help}
          onChange={(e) => onChange({ ...value, alt: e.target.value })}
          className={BOX}
        />
        {value.decorative && (
          <p id={reason} className="ds-caption1 text-label-alternative">
            장식 이미지라 대체텍스트를 쓰지 않습니다
          </p>
        )}
        <p id={help} className="ds-caption1 text-label-alternative">
          이미지에 담긴 내용을 한 문장으로 적어 주세요. 꾸밈용이면 &apos;장식 이미지&apos;를 고르세요.
        </p>
      </div>
      <label className="inline-flex min-h-6 cursor-pointer items-center gap-2 text-body3 text-label-normal">
        <input type="checkbox" checked={value.decorative} onChange={(e) => onChange({ ...value, decorative: e.target.checked })} className="size-4 accent-primary" />
        장식 이미지 — 대체텍스트 없이 둡니다
      </label>
    </>
  );
}

function SlotSwitch({ id, label, value, error, onChange }: { readonly id: string; readonly label: string; readonly value: ImageSlotValue; readonly error: string; readonly onChange: (next: ImageSlotValue) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <span id={`${id}-label`} className="ds-label text-label-normal">
          {label} 사용
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={value.enabled}
          aria-labelledby={`${id}-label`}
          aria-describedby={error ? `${id}-caption ${id}-switch-error` : `${id}-caption`}
          onClick={() => onChange({ ...value, enabled: !value.enabled })}
          className="group inline-flex h-6 w-10 flex-none items-center rounded-full bg-fill-strong px-0.5 transition-colors duration-(--duration-fast) focus-visible:shadow-(--focus-ring) focus-visible:outline-none aria-checked:bg-primary"
        >
          <span aria-hidden="true" className="size-5 rounded-full bg-background-normal transition-transform duration-(--duration-fast) group-aria-checked:translate-x-4" />
        </button>
      </div>
      <p id={`${id}-caption`} className="ds-caption1 text-label-alternative">
        끄면 이미지 없이 색 면으로 보이고 대체텍스트 검사에서 빠집니다
      </p>
      {error && (
        <p id={`${id}-switch-error`} className="ds-caption1 text-status-negative-text">
          {error}
        </p>
      )}
    </div>
  );
}

/** 이미지 슬롯 1개 (SPEC m2c 2.2 · 2a-05 5.9 · E-S20) — 잃은 이미지(보관소에 없는 로컬 id)는 자체 플레이스홀더 + 다시 고르기 */
export function ImageSlotField(props: FieldProps) {
  const { section, entry, doc, images, latest, onEdit, announce, Button } = props;
  const { busy, error, pick, cancel } = useImagePick(props);
  const [switchError, setSwitchError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const actions = useRef<HTMLDivElement>(null);
  const value = slotValue(section, entry.key);
  if (!value) return null;
  const id = `image-${section.instanceId}-${entry.key}`;
  const edit = (next: ImageSlotValue) => onEdit(setSlot(doc, section.instanceId, entry.key, next));
  // 꺼진 슬롯 이미지는 문서 한도에서 빠지므로 다시 켤 때도 잰다 — 넘으면 꺼진 채 둔다(Codex r1 P2)
  const toggle = (next: ImageSlotValue) => {
    const limit = next.enabled ? checkLimits(setSlot(doc, section.instanceId, entry.key, next), latest.current.undoDoc, images ?? {}) : { ok: true as const };
    setSwitchError(limit.ok ? "" : limit.message);
    if (!limit.ok) return announce(limit.message);
    if (!next.enabled) cancel();
    edit(next);
  };
  const local = typeof value.source === "string" ? value.source : undefined;
  const held = local ? images?.[local] : undefined;
  const meta = held && imageMeta(held);
  return (
    <section aria-labelledby={`${id}-label`} className="flex flex-col gap-3">
      <SlotSwitch id={id} label={entry.label} value={value} error={switchError} onChange={toggle} />
      {value.enabled && (
        <>
          {held ? <Preview blob={held.blob} /> : <div aria-hidden="true" className="aspect-video w-full rounded-md bg-fill-normal" />}
          {held && <p className="ds-caption1 text-label-neutral tabular-nums">{`${held.width} × ${held.height} · ${meta ? FORMAT[meta.format] : ""} ${Math.round(held.blob.size / 1024)}KB`}</p>}
          {local && !held && <p className="ds-body3 text-label-normal">이미지를 다시 골라 주세요</p>}
          <div ref={actions} className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-disabled={busy || undefined}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              // 변환 중에도 다른 파일을 고를 수 있다 — 마지막 선택만 반영(IMG-AC-09 · SPEC 2.5 "취소"). aria-disabled는 SPEC 2.5 표시 그대로
              onClick={() => input.current?.click()}
            >
              {held ? "다른 이미지로 바꾸기" : "이미지 고르기"}
            </Button>
            {local && (
              <Button variant="assistive" size="sm" onClick={() => {
                  cancel();
                  // 이 버튼은 사라진다 — 포커스를 같은 자리에 남는 "이미지 고르기"로 옮긴다(BODY 유실 방지, B-M2C-06)
                  actions.current?.querySelector("button")?.focus();
                  edit({ ...value, source: PLACEHOLDER });
                }}>
                이미지 지우기
              </Button>
            )}
          </div>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            tabIndex={-1}
            aria-hidden="true"
            data-testid={`image-file-${entry.key}`}
            className="sr-only"
            onChange={(e) => {
              const chosen = e.target.files?.[0];
              e.target.value = "";
              if (chosen) void pick(chosen);
            }}
          />
          {busy && <p className="ds-caption1 text-label-alternative">이미지를 준비하고 있습니다…</p>}
          {error && (
            <p id={`${id}-error`} className="ds-caption1 text-status-negative-text">
              {error}
            </p>
          )}
          <AltFields id={`${id}-alt`} value={value} onChange={edit} />
          <p className="ds-caption1 text-label-alternative">직접 찍었거나 사용 권리가 있는 이미지만 넣어 주세요.</p>
          {entry.key === "map" && (
            <p className="ds-caption1 text-label-alternative">지도 서비스 화면을 캡처해 쓰면 그 서비스 약관을 따라야 합니다 — 직접 그린 약도나 사용 허락을 받은 지도를 권장합니다.</p>
          )}
        </>
      )}
    </section>
  );
}
