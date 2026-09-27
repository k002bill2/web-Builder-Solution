/**
 * 프로젝트 목록 표시 규칙 (DS-2A-05 SPEC 2.4 J-S04). 순수 함수 — 입력 배열·객체는 바꾸지 않는다.
 * 상대 시각은 `features/profile/versionText`의 것과 문구가 달라("방금 전") 따로 둔다.
 */
import type { ProjectSummary } from "../../data/projectRepository";

export interface ProjectRowView {
  readonly projectId: string;
  readonly name: string;
  readonly profileLabel: string;
  readonly editStatus: string;
  /** `<time dateTime>` — 원래 ISO 값 */
  readonly dateTime: string;
  readonly timeText: string;
  /** 문서가 있을 때만 */
  readonly editorHref?: string;
  readonly profileHref: string;
}

const MINUTE = 60_000;

/** 마지막 변경 내림차순 — 저장소 순서를 믿지 않는다. 읽을 수 없는 시각은 맨 뒤 */
export function sortProjects(items: readonly ProjectSummary[]): readonly ProjectSummary[] {
  const time = (p: ProjectSummary) => {
    const t = Date.parse(p.updatedAt);
    return Number.isNaN(t) ? -Infinity : t;
  };
  return [...items].sort((a, b) => time(b) - time(a));
}

export function profileLabel(version: number): string {
  return `프로필 v${version}`;
}

/** 편집 상태 글자 3종 (색 하나로 알리지 않음 — 글자) */
export function editStatusText(summary: ProjectSummary): string {
  if (!summary.hasDoc) return "편집 전 — 프로필에서 3안을 고르면 시작합니다";
  const docVersion = summary.docProfileVersion ?? summary.latestProfileVersion;
  const base = `편집 중 · ${summary.candidateId ?? "?"}안 · ${profileLabel(docVersion)}`;
  return docVersion < summary.latestProfileVersion ? `${base} · 새 ${profileLabel(summary.latestProfileVersion)} 있음` : base;
}

/** 방금 전 · N분 전 · N시간 전 · N일 전. 읽을 수 없는 시각은 빈 문자열 */
export function relativeTimeText(iso: string, now: number): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const minutes = Math.floor((now - then) / MINUTE);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}시간 전` : `${Math.floor(hours / 24)}일 전`;
}

export function projectRowView(summary: ProjectSummary, now: number): ProjectRowView {
  const view: ProjectRowView = {
    projectId: summary.projectId,
    name: summary.name,
    profileLabel: profileLabel(summary.latestProfileVersion),
    editStatus: editStatusText(summary),
    dateTime: summary.updatedAt,
    timeText: relativeTimeText(summary.updatedAt, now),
    profileHref: `/profile/${encodeURIComponent(summary.profileId)}`,
  };
  return summary.hasDoc ? { ...view, editorHref: `/studio/${encodeURIComponent(summary.projectId)}` } : view;
}
