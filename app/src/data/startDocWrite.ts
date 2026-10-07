/**
 * 편집 문서 쓰기 본문 (DS-2A-05 SPEC 8.2.1 어댑터 · 8.3 saveDoc 모양 검사) — 조작 뒤 청크("편집 시작" onClick·저장 때 로드).
 * engine을 부를 수 있는 data/ 파일은 이것 하나(engineImportGuard 허용 목록). 순수·동기 — 판정·쓰기 원자성은 저장소 동기 구간이 맡는다.
 * 어댑터: 구조안 섹션 → 표로 엔진 변형(표 밖 = UNKNOWN_VARIANT, 엔진 호출 전) → `createDocFromCandidate`(motion 전달, Q-18 A) →
 * 텍스트 슬롯은 예시 문구로 채운다(r4.7 A3-Q8, `sampleCopy`) — 부르는 쪽이 레퍼런스 문구(`copy`, B-M3P-06)를 주면 그 키만 먼저 쓴다. 엔진 예외는 잡아 결과로 돌려준다(쓰기 0). `toEngineCandidate`는 쓰지 않는다(모션을 버리고 /profile 청크에 있다).
 */
import type { SectionType } from "../domain/compareBoard";
import type { PlannedSection } from "../domain/generation";
import { createDocFromCandidate } from "../engine/doc/createDocFromCandidate";
import type { PageDoc } from "../engine/contracts/pageDoc";
import { EngineOpError } from "../engine/ops/errors";
import { hashDoc } from "../engine/ops/hash";
import { setSlot } from "../engine/ops/slotOps";
import { getSectionDefinition, isSectionType, SECTION_TYPE_INFO } from "../engine/sections/registry";
import { validatePageDoc } from "../engine/validate/validatePageDoc";
import { runGate } from "../engine/gate/runGate";
import type { ProfileVersion } from "../domain/profile";
import { RENDERED_VARIANTS } from "../features/studio/renderedVariants";
import { fromLabelOf, mapVariant } from "./engineVariantMap";
import { sampleCopyOf } from "./sampleCopy";
import type { DocHead } from "./projectRepository";

/** 바뀐 쌍(8.2.1 (a)) — 문서에 저장하지 않는다 */
export interface VariantChange {
  readonly type: SectionType;
  readonly from: string;
  readonly to: string;
}

export interface StartDocInput {
  readonly candidateId: string;
  readonly sections: readonly PlannedSection[];
  readonly libraryVersion: string;
  readonly generatorVersion: string;
  readonly profileVersion: number;
  /** DocStart — 저장소가 정한 값(주입 now 한 번) */
  readonly projectId: string;
  readonly updatedAt: string;
  /** 레퍼런스 문구(B-M3P-06, `industryCopyOf`) — 키 = `섹션 유형/슬롯 키`. 없으면 예시 문구만 */
  readonly copy?: Readonly<Record<string, string>>;
}

export type StartDocWrite =
  | { readonly ok: true; readonly doc: PageDoc; readonly changes: readonly VariantChange[]; readonly changeNotice?: string }
  | { readonly ok: false; readonly reason: "UNKNOWN_VARIANT" | "BAD_VALUE"; readonly alert: string };

const typeName = (type: string) => (isSectionType(type) ? SECTION_TYPE_INFO[type].name : type);

function noticeOf(changes: readonly VariantChange[], count: number): string | undefined {
  if (changes.length === 0) return undefined;
  const pairs = changes.map((c) => `${typeName(c.type)} ${fromLabelOf(c.type, c.from)} → ${getSectionDefinition(c.type, c.to)?.label ?? c.to}`);
  return `구조안의 섹션 ${count}개를 편집기 변형으로 바꿔 열었습니다 — ${pairs.join(" · ")}`;
}

/** 새 문서의 텍스트 슬롯 = 레퍼런스 문구 → 예시 문구(A3-Q8) — 엔진 setSlot으로 넣고 해시를 다시 잰다(revision·updatedAt 그대로). 둘 다 없는 슬롯은 엔진 기본값 */
function withSampleCopy(doc: PageDoc, copy: Readonly<Record<string, string>> = {}): PageDoc {
  const filled = doc.sections.reduce(
    (current, section) =>
      Object.keys(section.slots).reduce((next, key) => {
        const text = typeof section.slots[key] === "string" ? (copy[`${section.type}/${key}`] ?? sampleCopyOf(section.type, key)) : undefined;
        return text === undefined ? next : setSlot(next, section.instanceId, key, text);
      }, current),
    doc,
  );
  return { ...filled, hash: hashDoc(filled) };
}

export function writeStartDoc(input: StartDocInput): StartDocWrite {
  const unknown = input.sections.find((s) => mapVariant(s.type, s.variant) === undefined);
  if (unknown) {
    return { ok: false, reason: "UNKNOWN_VARIANT", alert: `이 안에는 편집기가 아직 열 수 없는 섹션이 있습니다(${typeName(unknown.type)} · ${unknown.variant}) — 다른 안을 고르세요` };
  }
  const mapped = input.sections.map((s) => ({ type: s.type, variant: mapVariant(s.type, s.variant)!, motion: s.motion }));
  try {
    const doc = withSampleCopy(createDocFromCandidate(
      { candidateId: input.candidateId, sections: mapped, libraryVersion: input.libraryVersion, generatorVersion: input.generatorVersion },
      input.profileVersion,
      { projectId: input.projectId, updatedAt: input.updatedAt },
    ), input.copy);
    const moved = input.sections.filter((s, i) => s.variant !== mapped[i]!.variant);
    const changes = moved
      .map((s) => ({ type: s.type, from: s.variant, to: mapVariant(s.type, s.variant)! }))
      .filter((c, i, all) => all.findIndex((o) => o.type === c.type && o.from === c.from) === i);
    const changeNotice = noticeOf(changes, moved.length);
    return { ok: true, doc, changes, ...(changeNotice && { changeNotice }) };
  } catch (error) {
    if (!(error instanceof EngineOpError)) throw error;
    return { ok: false, reason: "BAD_VALUE", alert: "이 안으로 편집 문서를 만들 수 없습니다 — 다른 안을 고르세요" };
  }
}

/** saveDoc 판정 1(모양) — L4 검증 함수 · 이 프로젝트의 문서 · hash = hashDoc(내용) (멱등 키 (revision, hash)의 전제) */
export function checkSaveDoc(projectId: string, input: unknown): { readonly ok: true; readonly doc: PageDoc } | { readonly ok: false; readonly message: string } {
  const checked = validatePageDoc(input);
  if (!checked.ok) return { ok: false, message: checked.issues.map((i) => `${i.path} ${i.message}`).join(" · ") };
  if (checked.value.projectId !== projectId) return { ok: false, message: `projectId ${checked.value.projectId} ≠ ${projectId}` };
  if (checked.value.hash !== hashDoc(checked.value)) return { ok: false, message: "hash ≠ hashDoc(내용)" };
  return { ok: true, doc: input as PageDoc };
}

/**
 * 내보내기 판정 5·7단계 (DS-2A-05 8.3.2) — 저장된 문서로 서버 게이트(`runGate`)를 다시 돌리고(화면 판정을 믿지 않는다) 렌더러 없는 섹션을 고른다.
 * engine을 부를 수 있는 data 파일이 이것 하나라(engineImportGuard) 여기 둔다 — 같은 조작 뒤 청크(memoryDocBook). 렌더러 목록은 부모 데이터 상수(RENDERED_VARIANTS).
 */
/** 저장소 문서(DocHead)는 엔진이 만든 편집 문서뿐이다(start = createDocFromCandidate · save = validatePageDoc) — 여기서 한 번 좁힌다 */
export function judgeExport(head: DocHead, profile: ProfileVersion): { readonly gateBlocked: boolean; readonly unrendered: readonly string[] } {
  const doc = head as PageDoc;
  const report = runGate(doc, { profile, purpose: profile.adjustments.purpose ?? "none" });
  return {
    gateBlocked: report.rows.some((row) => row.state === "block"),
    unrendered: doc.sections.filter((s) => !RENDERED_VARIANTS.includes(`${s.type}/${s.variant}`)).map((s) => s.instanceId),
  };
}
