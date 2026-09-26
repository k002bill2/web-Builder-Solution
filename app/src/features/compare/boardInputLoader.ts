/**
 * 대표색 검사 청크 로더 (BUNDLE-HEADROOM) — boardInput(zod)을 대표색 필드 포커스(미리 받기)·blur·Enter 때만 받는다. 조작 뒤 청크.
 * 저장소 쪽 로더(writeBodyLoader `loadBoardInput`)와 따로 둔다 — 한 모듈을 두 청크가 정적 import하면 작은 공유 청크가 하나 더 생긴다.
 * 한 줄짜리 모듈로 떼어 둔 것은 화면 테스트가 호출 수(진입 때 0)를 세고 실패를 주입하기 위해서다.
 * 실패 뒤 다시 포커스·blur·Enter는 같은 청크를 새 URL로 받는다(retryableImport, F1).
 */
import { retryableImport } from "../../data/chunkRetry";

export const loadBoardInput = retryableImport(() => import("../../domain/boardInput"));
