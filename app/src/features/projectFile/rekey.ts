/**
 * 가져오기 id 재매김 (P2-SPEC 3.4 ★ 항상 새 id — 덮어쓰기 없음) — 순수. 대상 = 트랜잭션 안에서 읽은 IDB 상태(탭 메모리 금지 — L3가 넘긴다).
 * 새 projectId·profileId = `nextSeqId`(현존 최대·묘비 중 큰 값 + 1) · 대상 `seq`는 그대로(발급이지 삭제가 아니다).
 * 문서·각 스냅샷 문서 = `rekeyDoc`(projectId 치환 + hash 재계산) · 스냅샷 hash = 그 문서의 새 hash · snapshotId·snapshotSeq 그대로.
 * 재매김 뒤 ④ 규칙(checkSaveDoc(새 id)·계열·이름)을 다시 통과해야 계획을 낸다 — 열기가 깨지면 모든 프로젝트가 INFRA(F4).
 */
import type { DocRecord, LocalState } from "../../data/persistence/entryRead";
import type { DocHead, Project } from "../../data/projectRepository";
import { nextSeqId } from "../../data/seqId";
import { rekeyDoc } from "../../data/startDocWrite";
import type { ProfileVersion } from "../../domain/profile";
import { recordsHold, type CheckedFile } from "./checkFile";
import type { CheckedImage } from "./checkImages";
import { failure, type CheckFailure } from "./format";

/** undefined = 상태 레코드 없음(첫 실행·지운 직후) */
export type ImportTarget = Pick<LocalState, "projects" | "series" | "seq"> | undefined;

export interface ImportPlan {
  readonly projectId: string;
  readonly profileId: string;
  readonly project: Project;
  readonly series: readonly ProfileVersion[];
  /** docs/<projectId> 레코드 값 · null = 문서 없음(쓰지 않는다) */
  readonly doc: DocRecord | null;
  /** 상태 레코드 heads에 더할 머리 — 문서 없으면 없음(목록 hasDoc:false) */
  readonly head?: DocHead;
  /** images 레코드 — 키 `${새 projectId}/${localId}` */
  readonly images: readonly { readonly key: string; readonly image: CheckedImage }[];
}

/** localSync headOf와 같은 필드 */
const headOf = ({ projectId, revision, hash, profileVersion, candidateId, updatedAt }: DocHead): DocHead => ({ projectId, revision, hash, profileVersion, candidateId, updatedAt });

function rekeyRecord(record: DocRecord, projectId: string): DocRecord {
  const snapshots = record.snapshots.map((snapshot) => {
    const doc = rekeyDoc(snapshot.doc, projectId);
    return { ...snapshot, projectId, doc, hash: doc.hash };
  });
  return { ...record, doc: rekeyDoc(record.doc, projectId), snapshots };
}

export function rekeyImport(file: CheckedFile, target: ImportTarget, now: string): { readonly ok: true; readonly plan: ImportPlan } | CheckFailure {
  const projectId = nextSeqId("project", target?.projects.keys() ?? [], target?.seq?.project);
  const profileId = nextSeqId("profile", target?.series.keys() ?? [], target?.seq?.profile);
  const project: Project = { ...file.project, projectId, profileId, updatedAt: now };
  const series = file.series.map((version) => ({ ...version, profileId }));
  const doc = file.doc && rekeyRecord(file.doc, projectId);
  if (!recordsHold({ project, series, doc })) return failure("IM-4");
  return {
    ok: true,
    plan: { projectId, profileId, project, series, doc, ...(doc && { head: headOf(doc.doc) }), images: file.images.map((image) => ({ key: `${projectId}/${image.localId}`, image })) },
  };
}

const EMPTY: LocalState = { series: new Map(), commits: new Map(), adjustCommits: new Map(), jobs: new Map(), projects: new Map(), heads: new Map() };

/** 새 상태 = 대상 + 가져온 프로젝트·계열·머리(기존 레코드는 같은 참조 그대로 · seq·gen 그대로 — gen은 쓰기 단계가 정한다) */
export function mergeImport(state: LocalState | undefined, plan: ImportPlan): LocalState {
  const base = state ?? EMPTY;
  const heads = base.heads ?? new Map<string, DocHead>();
  return {
    ...base,
    projects: new Map([...base.projects, [plan.projectId, plan.project]]),
    series: new Map([...base.series, [plan.profileId, plan.series]]),
    heads: plan.head ? new Map([...heads, [plan.projectId, plan.head]]) : heads,
  };
}
