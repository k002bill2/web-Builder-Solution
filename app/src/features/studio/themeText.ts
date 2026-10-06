import type { ProfileAdjustments, ProfileSeries, ProfileVersion } from "../../domain/profile";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import type { GateRowId } from "../../engine/contracts/records";
import { PURPOSE_LABELS } from "../../fixtures/catalogFilters";
import type { OpResult } from "./docOps";
import type { SectionOps } from "./useSectionOps";
import { docPurpose } from "./docPurpose";
import type { SectionInstance } from "../../engine/contracts/pageDoc";

/**
 * 테마 바꾸기 글자(EDITOR-REST SPEC r1 3.1) — 대화상자 줄 · 적용·되돌리기 알림. 조작 뒤 청크(ThemeDialog가 정적으로, 적용 흐름이 동적으로 받는다).
 * `runGate`는 인자로 받는다 — gateCheck(진입 직후 자동 청크)를 정적 import하면 청크가 다시 나뉘어 번들 검사 키가 사라진다(ER-2 실측).
 */
export type RunGate = (typeof import("./gateCheck"))["runGate"];
/** "예약"으로 · "문의"로 — 받침(ㄹ 제외)이면 "으로". 첫 화면 모듈(particles·selection)을 import하면 그 모듈이 공유 청크로 갈라져 /studio 진입이 커진다(ER-2 실측 128.32) */
const toParticle = (word: string) => {
  const jong = (word.charCodeAt(word.length - 1) - 0xac00) % 28;
  return jong > 0 && jong !== 8 ? "으로" : "로";
};
/** 그 버전으로 본 게이트 줄의 차단 개수 — 게이트와 같은 함수(runGate, 진입 직후 받은 gateCheck 청크) */
const blocksOf = (runGate: RunGate, doc: PageDoc, profile: ProfileVersion, id: GateRowId, purpose: ReturnType<typeof docPurpose> = "none") =>
  runGate(doc, { profile, purpose }).rows.find((r) => r.id === id)?.issues.filter((i) => i.severity === "block").length ?? 0;

/** "조정: 대비 강화, 모션 L2" · "조정 없음" — 보드 P-S25 단어(adjustmentText)와 같은 말. 그 모듈은 프로필 청크라 import하지 않는다(공유 청크 분할 방지) */
function adjustmentText(a: ProfileAdjustments): string {
  const parts = [
    a.contrast === "enhanced" && "대비 강화",
    a.density === "compact" && "밀도 촘촘",
    a.motion && `모션 ${a.motion}`,
    a.purpose && a.purpose !== "none" && `목적 ${PURPOSE_LABELS[a.purpose]}`,
    a.corrections?.length && `보정 ${a.corrections.length}`,
  ].filter(Boolean);
  return parts.length > 0 ? `조정: ${parts.join(", ")}` : "조정 없음";
}

/** 대화상자 줄(최신 먼저) — "v4 · 조정: 대비 강화 · 대비 통과" / "v1 · 조정 없음 · 대비 미달 2"(색 단독 0, Q14) */
export function themeLines(runGate: RunGate, doc: PageDoc, series: ProfileSeries): readonly { readonly version: number; readonly text: string }[] {
  return [...series.versions].reverse().map((v) => {
    const failed = blocksOf(runGate, doc, v, "contrast");
    const contrast = failed === 0 ? "대비 통과" : `대비 미달 ${failed}`;
    return { version: v.version, text: `v${v.version} · ${adjustmentText(v.adjustments)} · ${contrast}${v.version === doc.profileVersion ? " · 지금 쓰는 테마" : ""}` };
  });
}

/** "v3으로"·"v4로" — 숫자 끝 읽기(영·삼·육 = 받침 → "으로", 일·칠 = ㄹ → "로") */
const toVersion = (version: number) => `프로필 v${version}${/[036]$/.test(String(version)) ? "으로" : "로"}`;

/** 되돌리기 알림 — "테마를 프로필 v1로 되돌렸습니다" */
export const themeRevertedNotice = (version: number): string => `테마를 ${toVersion(version)} 되돌렸습니다`;

/**
 * 적용 알림 1문장(SPEC r1 3.1) — 슬롯 값 비교(diffSlotValues + meta) 0이면 "모두 그대로", 아니면 달라진 곳(결함 — 자동 되돌리기 0).
 * 목적이 바뀌어 필수 섹션 차단이 생기면 두 번째 문장(섹션 자동 추가 0).
 */
export function themeAppliedNotice(
  runGate: RunGate,
  sectionName: (section: SectionInstance) => string,
  before: PageDoc,
  result: OpResult,
  series: ProfileSeries | undefined,
): string {
  const after = result.doc;
  const values = result.values ?? { compared: 0, changed: [] };
  const head = `테마를 ${toVersion(after.profileVersion)} 바꿨습니다`;
  const name = (instanceId: string, key: string) => {
    const section = after.sections.find((s) => s.instanceId === instanceId) ?? before.sections.find((s) => s.instanceId === instanceId);
    return section ? `${sectionName(section)} ${key}` : `페이지 정보 ${key}`;
  };
  const slots =
    values.changed.length === 0
      ? `슬롯 값 ${values.compared}개 모두 그대로입니다`
      : `슬롯 값 ${values.changed.length}개가 달라졌습니다: ${values.changed.map((c) => name(c.instanceId, c.key)).join(", ")}`;
  const purpose = docPurpose(series, after.profileVersion);
  const profile = series?.versions.find((v) => v.version === after.profileVersion);
  const required = profile && purpose !== "none" && purpose !== docPurpose(series, before.profileVersion) ? blocksOf(runGate, after, profile, "required-sections", purpose) : 0;
  const label = purpose === "none" ? "" : PURPOSE_LABELS[purpose];
  const purposeText = required > 0 ? ` · 목적이 '${label}'${toParticle(label)} 바뀌어 필수 섹션 ${required}건이 차단입니다` : "";
  return `${head} · ${slots}${purposeText}`;
}


/** 적용 흐름 재료 — 편집 틀(첫 화면)이 넘기고 대화상자 청크가 쓴다 */
export interface ThemeApplyDeps {
  readonly run: SectionOps["run"];
  readonly series: ProfileSeries;
  readonly sectionName: (section: SectionInstance) => string;
  readonly onNotice: (text: string) => void;
  readonly onUndoable: (target: { readonly text: string; readonly before: PageDoc }) => void;
}

/** 적용 = 구조 연산과 같은 경로(기록 스택 · 알림 줄 "되돌리기" 대상, Q7) → 되돌리기 문장 · 적용 알림 1문장 */
export async function applyTheme(runGate: RunGate, deps: ThemeApplyDeps, version: number): Promise<void> {
  const outcome = await deps.run({ kind: "theme", profileVersion: version }, "테마 바꾸기", true);
  if (!outcome.ok) return deps.onNotice(outcome.reason);
  deps.onUndoable({ text: themeRevertedNotice(outcome.before.profileVersion), before: outcome.before });
  deps.onNotice(themeAppliedNotice(runGate, deps.sectionName, outcome.before, outcome.result, deps.series));
}

/** 대비 통과 최신 버전(문서 버전 제외) — 없으면 undefined */
export const passVersion = (runGate: RunGate, doc: PageDoc, series: ProfileSeries): number | undefined =>
  [...series.versions].reverse().find((v) => v.version !== doc.profileVersion && blocksOf(runGate, doc, v, "contrast") === 0)?.version;
