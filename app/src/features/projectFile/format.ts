/**
 * 프로젝트 파일 형식 (P2-SPEC 2절 formatVersion 1 · 3.2 크기 · 3.3 ⑤ 한도 · 5절 문구) — 가져오기·내보내기 조작 뒤 청크만 import한다.
 * 진입·복원 closure 모듈(envelope·imageStore 등)은 값으로 import하지 않는다(6절) — 값은 리터럴 복제, 같음은 format.test(parity)가 본다.
 */
import type { DocRecord } from "../../data/persistence/entryRead";
import type { Project } from "../../data/projectRepository";
import type { ProfileVersion } from "../../domain/profile";
import type { ImageFormat } from "../studio/images/ingest/types";

const MB = 1024 * 1024;

export const FILE_FORMAT = "design-studio-project";
/** 파일 구조 버전 — 구조가 바뀔 때만 올린다(2.2) */
export const FORMAT_VERSION = 1;
/** 레코드 버전 = envelope.SCHEMA_VERSION(parity) */
export const SCHEMA = 1;
/** 3.2 — 이미지 60MB × 4/3(base64) + 문서 여유 */
export const MAX_FILE_BYTES = 96 * MB;
/** 3.3 ⑤ = imageStore 탭 한도(TAB_COUNT·TAB_BYTES, parity) */
export const MAX_IMAGE_COUNT = 24;
export const MAX_IMAGE_BYTES = 60 * MB;

export const IMPORT_MESSAGES = {
  "IM-1": "파일이 너무 큽니다(최대 96MB) — 이 앱에서 내보낸 프로젝트 파일인지 확인하세요",
  "IM-2": "프로젝트 파일이 아닙니다 — 이 앱의 '파일로 내보내기'로 만든 .json 파일을 고르세요",
  "IM-3": "더 새 버전의 앱에서 만든 파일이라 가져올 수 없습니다 — 새로고침해 최신 앱을 받은 뒤 다시 시도하세요",
  "IM-4": "파일 내용이 손상되어 가져올 수 없습니다",
  "IM-5": "이미지가 24개 · 60MB를 넘어 가져올 수 없습니다",
  "IM-6": "이미지를 읽지 못해 가져올 수 없습니다 — 파일이 손상되었을 수 있습니다",
} as const;
export type ImportCode = keyof typeof IMPORT_MESSAGES;
export type CheckFailure = { readonly ok: false; readonly code: ImportCode; readonly message: string };
export const failure = (code: ImportCode): CheckFailure => ({ ok: false, code, message: IMPORT_MESSAGES[code] });

/** EX-12 — 만든 파일이 가져오기 한도를 넘으면 내려받기 0(3.6 자기 거절 파일 금지) */
export const EXPORT_TOO_LARGE = "이 프로젝트는 가져오기 한도(파일 96MB · 이미지 24개 · 60MB)를 넘어 파일로 만들 수 없습니다 — 쓰지 않는 스냅샷을 지운 뒤 다시 시도하세요";

/** 파일 속 이미지 1건 — 변형본 = 사다리 폭 → 표준 base64(패딩 있음·줄바꿈 0) */
export interface FileImage {
  readonly localId: string;
  readonly width: number;
  readonly height: number;
  readonly format: ImageFormat;
  readonly bytes: number;
  readonly variants: Readonly<Record<string, string>>;
}

/** 2.1 최상위 봉투 */
export interface ProjectFile {
  readonly format: typeof FILE_FORMAT;
  readonly formatVersion: number;
  readonly schemaVersion: number;
  readonly exportedAt: string;
  readonly project: Project;
  readonly series: readonly ProfileVersion[];
  readonly doc: DocRecord | null;
  readonly images: readonly FileImage[];
}
