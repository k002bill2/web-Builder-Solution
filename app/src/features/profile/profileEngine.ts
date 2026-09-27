/**
 * 프로필 화면 엔진 — 대비 검사·보정 제안·비교·버전 요약·알림 문구 · 프로필 패널(팔레트·전역 조정·초안) (DS-2A-04 P-B6).
 * 화면이 데이터와 함께 동적으로 불러온다. 첫 화면 정적 JS(ADR-004, /profile 여유 0.8KB)에는 화면 틀·값 목록·버전 목록만 남기고,
 * 조정 컨트롤·팔레트 견본은 이 청크로 옮겼다(2a-04b2 — 화면은 엔진을 받은 뒤에만 그리므로 보이는 차이 없음).
 * 3안 영역(카드·와이어프레임·비교 표·생성 상태, 2a-04c)도 여기 — 첫 화면 여유(0.6KB)가 없어서다. 3안 계산 본문은 조작 뒤 청크(memoryGenerate).
 */
import { CandidatesSection } from "./CandidatesSection";
import { ProfilePanel } from "./ProfilePanel";
import { diffVersions, summarizeVersions, valueRows } from "./profileDiff";
import { revertMessages, saveMessages } from "./profileMessages";

export const profileEngine = Object.freeze({ ProfilePanel, CandidatesSection, diffVersions, summarizeVersions, valueRows, revertMessages, saveMessages });

export type ProfileEngine = typeof profileEngine;
