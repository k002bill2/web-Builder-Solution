/**
 * 프로필 화면 문구 — 대비 검사·보정 제안·충돌(3.3) · 되돌리기 알림(P-S09·S12) · 조정 저장 알림(P-S11·S12). 엔진 청크 전용(ADR-004).
 * 문구 형식은 1a-03 3.4를 잇는다: 원인 · 수치 · 대체안.
 */
import { formatRatio, type ContrastCheckId } from "../../domain/contrast";
import type { SurfaceTone } from "../../domain/compareBoard";
import type { ContrastLevel } from "../../domain/profile";
import { CONTRAST_TARGET, checkProfileContrast, proposeCorrections, type CorrectionProposal } from "../../domain/profileContrast";
import type { PaletteEntry, PaletteRole } from "../../domain/referenceDetail";
import { versionWith } from "./versionText";

const CHECK_LABELS: Readonly<Record<ContrastCheckId, string>> = Object.freeze({
  "C-1": "흰 글자 / 대표색(primary) — 버튼·CTA",
  "C-2": "본문 글자(ink) / 배경(bg)",
  "C-3": "카드 글자(ink) / 어두운 카드(primary)",
  "C-4": "본문 글자(ink) / 면(surface) — 교차 배경·카드",
  "C-5": "보조 글자(muted) / 배경(bg)",
});
/** 검사의 배경 이름 — 원인 문장 "…에서 3.8:1로" */
const BACKGROUND_NAMES: Readonly<Record<ContrastCheckId, string>> = Object.freeze({ "C-1": "흰 글자", "C-2": "배경", "C-3": "어두운 카드", "C-4": "면", "C-5": "배경" });
const ROLE_SUBJECTS: Readonly<Partial<Record<PaletteRole, string>>> = Object.freeze({ primary: "대표색(primary)이", ink: "본문 글자(ink)가", muted: "보조 글자(muted)가" });
const ROLE_NAMES: Readonly<Partial<Record<PaletteRole, string>>> = Object.freeze({ primary: "대표색(primary)", ink: "본문 글자(ink)", muted: "보조 글자(muted)" });

export interface CheckView {
  readonly id: ContrastCheckId;
  readonly label: string;
  readonly ratio: string;
  readonly pass: boolean;
}

export interface ProposalView {
  readonly role: PaletteRole;
  readonly from: string;
  readonly to: string;
  /** 보정 기준 검사 — 보정 조정의 `check` */
  readonly check: ContrastCheckId;
  /** 저장 안 된 조정에 이미 쓴 보정(검사 통과) — "보정값 쓰기" 대신 쓴 상태를 보인다 */
  readonly written?: boolean;
  /** 원인 · 수치 · 대체안 */
  readonly text: string;
  /** 충돌(P-S15)이면 보정값 쓰기 없음 — 대체안 문장과 보드 링크 이름 */
  readonly conflict?: { readonly text: string; readonly detail: string; readonly link: string };
}

export interface ContrastView {
  readonly target: string;
  readonly checks: readonly CheckView[];
  readonly proposals: readonly ProposalView[];
}

const targetText = (level: ContrastLevel) => `${CONTRAST_TARGET[level].toFixed(1)}:1`;
const deltaText = (delta: number) => `명도 ${delta < 0 ? "−" : "+"}${Math.abs(delta).toFixed(1)}%p`;

function proposalText(p: CorrectionProposal, level: ContrastLevel): string {
  const cause =
    p.role === "primary"
      ? `버튼 글자(흰색)와 대표색(primary) 대비가 ${formatRatio(p.before)}로`
      : `${ROLE_NAMES[p.role]} 대비가 ${BACKGROUND_NAMES[p.basis]}에서 ${formatRatio(p.before)}로`;
  return `${cause} 기준 ${targetText(level)}보다 낮습니다. 대체안: ${p.to}(${formatRatio(p.after)}, ${deltaText(p.lightnessDelta)})`;
}

function conflictOf(p: CorrectionProposal, level: ContrastLevel): ProposalView["conflict"] {
  if (!p.conflict) return undefined;
  // 목표 불가(D-2A4B2-01)는 한 값으로 두 배경을 못 맞추는 충돌이 아니다 — 어떤 명도로도 기준 배경 하나를 못 맞춘다. 대체안은 팔레트 바꾸기
  if (p.unreachable) {
    return {
      text: `${ROLE_SUBJECTS[p.role]} ${BACKGROUND_NAMES[p.basis]}(${formatRatio(p.before)})에서 어떤 명도로도 기준 ${targetText(level)}을 맞출 수 없습니다. 대체안: 비교 보드에서 다른 팔레트를 고르세요`,
      detail: `대비가 가장 높은 후보 ${p.to}도 ${formatRatio(p.after)}`,
      link: "비교 보드에서 팔레트 바꾸기",
    };
  }
  const detail = `후보 ${p.to}를 쓰면 ${p.conflict.map((b) => `${b.id} ${formatRatio(b.before)} → ${formatRatio(b.after)}`).join(" · ")}`;
  const darkCard = p.conflict.find((b) => b.id === "C-3");
  if (darkCard) {
    return {
      text: `${ROLE_SUBJECTS[p.role]} ${BACKGROUND_NAMES[p.basis]}(${formatRatio(p.before)})과 어두운 카드(${formatRatio(darkCard.before)})에 함께 쓰여 한 값으로 둘 다 맞출 수 없습니다. 대체안: 비교 보드에서 밝은 카드를 고르면 ink를 어둡게 보정할 수 있습니다`,
      detail,
      link: "비교 보드에서 카드 바꾸기",
    };
  }
  return { text: `${ROLE_SUBJECTS[p.role]} 한 값으로 모든 배경의 기준을 맞출 수 없습니다. 대체안: 비교 보드에서 다른 팔레트를 고르세요`, detail, link: "비교 보드에서 팔레트 바꾸기" };
}

const NONE: ReadonlySet<PaletteRole> = new Set();

/**
 * 검사는 `palette`(보정을 적용한 팔레트)에서 한다. 제안은 `base`(보정 전 보드 팔레트)에서 역할을 고른 뒤, 그 역할만 base 값으로 둔 초안 팔레트에서
 * 후보·충돌을 다시 계산한다 — 제안의 from은 base 값이어야 저장소가 받는다(보정 from 검사).
 * 제안은 보정 팔레트에서 아직 미달인 역할, 또는 저장 안 된 보정을 쓴 역할(`written`)만 보인다. 둘 다 생략하면 base = palette(2a-04a 동작).
 */
export function contrastView(
  palette: readonly PaletteEntry[],
  cardTone: SurfaceTone | undefined,
  level: ContrastLevel,
  base: readonly PaletteEntry[] = palette,
  written: ReadonlySet<PaletteRole> = NONE,
): ContrastView {
  const checks = checkProfileContrast(palette, cardTone, level);
  const failing = new Set(checks.filter((c) => !c.pass).map((c) => c.role));
  return {
    target: targetText(level),
    checks: checks.map((c) => ({ id: c.id, label: CHECK_LABELS[c.id], ratio: formatRatio(c.ratio), pass: c.pass })),
    proposals: proposeCorrections(base, cardTone, level)
      .filter((p) => failing.has(p.role) || written.has(p.role))
      // 후보·충돌은 다른 역할의 보정을 적용한 초안에서, 그 역할만 base 값으로 되돌려 다시 계산한다(Codex P2) — from은 base 값
      .map((p) => proposeCorrections(palette.map((e) => (e.role === p.role ? { ...e, hex: p.from } : e)), cardTone, level).find((q) => q.role === p.role) ?? p)
      .map((p) => {
        const conflict = conflictOf(p, level);
        return { role: p.role, from: p.from, to: p.to, check: p.basis, text: proposalText(p, level), ...(!failing.has(p.role) && { written: true }), ...(conflict && { conflict }) };
      }),
  };
}

/** "v2로"·"v3으로" — 숫자 끝 발음에 받침이 있으면(삼·육·영/십) "으로", ㄹ 받침(일·칠·팔)과 받침 없음은 "로" */
const versionRo = (version: number) => `v${version}${[0, 3, 6].includes(version % 10) ? "으로" : "로"}`;

export const saveMessages = Object.freeze({
  done: (created: number) => `${versionRo(created)} 저장했습니다`,
  stale: (latest: number) => `다른 곳에서 ${versionWith(latest, ["이", "가"])} 만들어졌습니다. 조정은 남겨 두었습니다 — 확인 후 다시 저장하세요`,
  failed: "저장하지 못했습니다 · 다시 시도하세요",
});

export const revertMessages = Object.freeze({
  done: (basedOn: number, created: number) => `v${basedOn} 내용으로 ${versionWith(created, ["을", "를"])} 만들었습니다`,
  stale: (latest: number) => `다른 곳에서 ${versionWith(latest, ["이", "가"])} 만들어졌습니다. 되돌리지 않았습니다 — 확인 후 다시 되돌리세요`,
  failed: "되돌리지 못했습니다 · 다시 시도하세요",
});
