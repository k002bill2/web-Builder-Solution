/**
 * 비교 보드 저장소 경계 (SPEC 8.2). 화면·트레이는 이 인터페이스에만 의존한다.
 * 이 파일은 트레이(공통 청크)가 쓰므로 타입·오류 클래스만 둔다 — 구현은 memoryCompareBoardRepository.
 */
import type { ReleasedPicks } from "../domain/boardColumns";
import type { ReleasedByStatus } from "../domain/boardPicks";
import type {
  CompareBoard,
  CompareBoardErrorCode,
  ComparisonResult,
  CustomStyle,
  Picks,
} from "../domain/compareBoard";
import type { ProfileVersion, ProfileHead } from "../domain/profile";

export type AddReferenceResult =
  | { readonly ok: true; readonly board: CompareBoard }
  | { readonly ok: false; readonly reason: "limit" | "duplicate" | "unavailable"; readonly board: CompareBoard };

/** 진입 시 보드. 회수·삭제로 자동 해제한 선택이 있으면 이번 응답에만 `released`로 한 번 알린다 (S-08·S-09). */
export interface BoardLoad {
  readonly board: CompareBoard;
  readonly released: readonly ReleasedByStatus[];
}

export interface ConfirmResult {
  readonly profileId: string;
  readonly version: number;
  /** 재확정 이어받기에서 지운 조정 수(6.1-3 개수 단위) — 1 이상일 때만. 확정 뒤 "조정 M개를 지웠습니다"(P-S25 r6) */
  readonly droppedCount?: number;
}

export interface CompareBoardRepository {
  /** GET /compare-boards/current — 없으면 빈 보드 */
  getBoard(): Promise<BoardLoad>;
  /** POST …/references — 한도·중복·비노출 거부, 비어 있는 가장 앞 열 문자 */
  addReference(referenceId: string): Promise<AddReferenceResult>;
  /** DELETE …/references/{id} — 그 열의 선택 해제까지 한 번에 */
  removeReference(referenceId: string): Promise<{ readonly board: CompareBoard; readonly released?: ReleasedPicks }>;
  /** PUT …/picks (If-Match: revision) — 다르면 STALE_BOARD */
  savePicks(picks: Picks, custom: CustomStyle, expectedRevision: number): Promise<CompareBoard>;
  /** POST /compare — 모든 셀을 libraryVersion 하나로 해석, 회수·없음은 상태로 */
  getComparison(referenceIds: readonly string[]): Promise<{ readonly libraryVersion: string; readonly results: readonly ComparisonResult[] }>;
  /**
   * 처음 POST /profiles(v1), 이미 확정했으면 POST /profiles/{id}/versions.
   * `expectedLatest` = 호출자가 본 계열 최신 버전(첫 확정 0) — 다르면 STALE_PROFILE (DS-2A-04 6.1-4).
   * 멱등 키 = (보드 id, revision, expectedLatest): 커밋된 요청의 재시도는 같은 결과 (6.3 r3)
   */
  confirmProfile(revision: number, expectedLatest: number): Promise<ConfirmResult>;
  /** POST /profiles/{profileId}/versions — 이전 버전 불변. `expectedLatest`·멱등은 confirmProfile과 같다 */
  createProfileVersion(profileId: string, revision: number, expectedLatest: number): Promise<ConfirmResult>;
  getProfileVersions(profileId: string): Promise<readonly ProfileVersion[]>;
}

export class CompareBoardError extends Error {
  readonly code: CompareBoardErrorCode;
  /** STALE_BOARD일 때 서버의 최신 보드 */
  readonly board?: CompareBoard;
  /** STALE_PROFILE일 때 계열 최신 (DS-2A-04 6.1-4) */
  readonly profileHead?: ProfileHead;

  constructor(code: CompareBoardErrorCode, message: string, board?: CompareBoard, profileHead?: ProfileHead) {
    super(`${code}: ${message}`);
    this.name = "CompareBoardError";
    this.code = code;
    if (board) this.board = board;
    if (profileHead) this.profileHead = profileHead;
  }
}
