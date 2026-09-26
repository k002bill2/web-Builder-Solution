/**
 * 프로필 화면 엔진 — 대비 검사·보정 제안·비교·버전 요약·알림 문구 (DS-2A-04 P-B6).
 * 화면이 데이터와 함께 동적으로 불러온다. 첫 화면 정적 JS(ADR-004)에는 화면 틀·값·견본·버전 목록만 남긴다.
 */
import { diffProfiles, summarizeVersion } from "./profileDiff";
import { contrastView, revertMessages } from "./profileMessages";

export const profileEngine = Object.freeze({ contrastView, diffProfiles, summarizeVersion, revertMessages });

export type ProfileEngine = typeof profileEngine;
