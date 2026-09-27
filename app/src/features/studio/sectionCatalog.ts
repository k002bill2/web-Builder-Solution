import type { PageDoc, SectionType } from "../../engine/contracts/pageDoc";
import { canAdd, type Permission } from "../../engine/ops/rules";
import { getSectionDefinition, listSectionTypes } from "../../engine/sections/registry";

export interface AddableVariant {
  readonly variant: string;
  /** 이름표(한국어) — 화면에 변형 키를 쓰지 않는다(E-AC-20 원칙) */
  readonly label: string;
}

export interface AddableType {
  readonly type: SectionType;
  readonly name: string;
  readonly description: string;
  /** 중복 불가 유형(Header·Hero·Footer, 5.3) — canAdd(doc, type) */
  readonly permission: Permission;
  readonly variants: readonly AddableVariant[];
}

/** 섹션 추가 대화상자 목록(5.3) — 라이브러리 순서 유형 + 그 변형 이름표. 변형 목록은 레지스트리를 그대로 따른다(엔진 레인이 더한 변형 포함) */
export function addableTypes(doc: PageDoc): readonly AddableType[] {
  return listSectionTypes().map((info) => ({
    type: info.type,
    name: info.name,
    description: info.description,
    permission: canAdd(doc, info.type),
    variants: info.variants.map((variant) => ({ variant, label: getSectionDefinition(info.type, variant)?.label ?? variant })),
  }));
}
