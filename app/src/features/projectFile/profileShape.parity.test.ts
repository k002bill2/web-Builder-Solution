import { describe, expect, it } from "vitest";
import { PALETTE_ROLES } from "../../domain/palette";
import { CONTRAST_TARGET } from "../../domain/profileContrast";
import { PURPOSE_LABELS } from "../../fixtures/catalogFilters";
import { DENSITY_LABELS } from "../profile/adjustmentText";
import { SECTION_TYPE_LABELS } from "../profile/profileFields";
import { PROFILE_SHAPE_KEYS } from "./profileShape";

/** 가져오기 청크가 /profile 첫 화면 모듈을 값으로 끌지 않도록 키를 리터럴로 복제했다(P2-SPEC 6절) — 원천과 키 집합이 같아야 한다 */
const keys = (record: object) => Object.keys(record).sort();

describe("profileShape 리터럴 키 parity", () => {
  it("구역 종류 = SECTION_TYPE_LABELS 키", () => {
    expect(keys(PROFILE_SHAPE_KEYS.sectionTypes)).toEqual(keys(SECTION_TYPE_LABELS));
  });
  it("목적 = PURPOSE_LABELS 키", () => {
    expect(keys(PROFILE_SHAPE_KEYS.purposes)).toEqual(keys(PURPOSE_LABELS));
  });
  it("팔레트 역할 = PALETTE_ROLES (순서 포함)", () => {
    expect([...PROFILE_SHAPE_KEYS.paletteRoles]).toEqual([...PALETTE_ROLES]);
  });
  it("대비 수준 = CONTRAST_TARGET 키", () => {
    expect(keys(PROFILE_SHAPE_KEYS.contrastLevels)).toEqual(keys(CONTRAST_TARGET));
  });
  it("밀도 = DENSITY_LABELS 키", () => {
    expect(keys(PROFILE_SHAPE_KEYS.densities)).toEqual(keys(DENSITY_LABELS));
  });
});
