import type { PageDoc, SectionInstance } from "../../engine/contracts/pageDoc";
import { getSectionDefinition, SECTION_TYPE_INFO } from "../../engine/sections/registry";

/** 유형 이름(SPEC 화면 표기 "Hero"·"Services") */
export const sectionName = (s: SectionInstance): string => SECTION_TYPE_INFO[s.type].name;
/** 변형 이름표(한국어) — 화면에 변형 키를 쓰지 않는다(E-AC-20). 정의가 없으면 키 그대로 */
export const variantName = (s: SectionInstance): string => getSectionDefinition(s.type, s.variant)?.label ?? s.variant;

/** E-S05 첫 선택 = 첫 본문(보통 Hero) — header·footer가 아닌 첫 섹션, 없으면 첫 섹션 */
export function initialSelection(doc: PageDoc): string {
  const body = doc.sections.find((s) => s.type !== "header" && s.type !== "footer");
  return (body ?? doc.sections[0])?.instanceId ?? "";
}

/** "페이지 정보" 줄(5.1) — 섹션이 아니다(이동·삭제 없음). 섹션 instanceId 형식(`INSTANCE_ID`)과 겹치지 않게 `:`를 넣는다 */
export const PAGE_INFO_ID = ":page-info";

/** 선택 id가 문서에 없으면(삭제 등) 첫 선택으로. "페이지 정보"는 늘 있다 */
export function resolveSelection(doc: PageDoc, selectedId: string): string {
  if (selectedId === PAGE_INFO_ID) return selectedId;
  return doc.sections.some((s) => s.instanceId === selectedId) ? selectedId : initialSelection(doc);
}

/** 선택한 섹션(페이지 정보면 undefined) */
export const selectedSection = (doc: PageDoc, selectedId: string): SectionInstance | undefined => doc.sections.find((s) => s.instanceId === selectedId);

/** 편집 패널 제목 "편집 · Hero"(6.1)의 이름 */
export function selectionName(doc: PageDoc, selectedId: string): string {
  const section = selectedSection(doc, selectedId);
  return section ? sectionName(section) : "페이지 정보";
}

/** 문서 Tag "B안 · 프로필 v3"(3.1) — candidateId는 안 문자("A"~"C") */
export const docTagText = (doc: PageDoc): string => `${doc.candidateId}안 · 프로필 v${doc.profileVersion}`;
