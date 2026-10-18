/**
 * 내보내기 청크 로더 (S-B5 조작 뒤 청크) — 내보내기 버튼을 눌렀을 때만 받는다. 실패 뒤 다시 누르면 같은 청크를 새 URL로 받는다(retryableImport, F1).
 * 한 줄짜리 모듈로 떼어 둔 것은 화면 테스트가 로드 실패를 주입하기 위해서다(M2A-3a Codex P2-1).
 */
import { retryableImport } from "../../data/chunkRetry";
import { exportChunk } from "./exportFlowFails";

/** 로드 실패 = 내보내기 청크 실패 시도 1회(B-M4A-08) */
export const trackExportChunk =
  <M,>(load: () => Promise<M>) =>
  () =>
    load().catch((error: unknown) => {
      exportChunk.fails += 1;
      throw error;
    });

export const loadExportFlow = trackExportChunk(retryableImport(() => import("./exportFlow")));
