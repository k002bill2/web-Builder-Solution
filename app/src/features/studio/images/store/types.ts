/**
 * 이미지 보관소 자리 (SPEC m2c 2.6 · 7절 · 2a-05 5.9) — 진입 청크(StudioLayout·EditFields)는 이 타입만 import한다(`import type` = 번들 0).
 * 보관소 구현(`imageStore.ts`)은 패널 청크와 함께 lazy로 받는다(7절 "보관소 모듈 자체는 진입에 import 금지").
 * 진입 예산(+0.03KB) 때문에 편집 틀은 state 1쌍만 든다: 값 = 캔버스로 보낼 images 맵(로컬 id → {blob, width, height}).
 * 파생본·형식·바이트 메타는 보관소 모듈이 Blob 키로 따로 든다 — 편집 틀이 사라지면(편집기 떠남) 맵과 함께 놓인다.
 */
import type { PageDoc } from "../../../../engine/contracts/pageDoc";
import type { RenderImage } from "../../../../render/protocol";

export type RenderImages = Readonly<Record<string, RenderImage>>;

/** [images 맵, 맵 갱신(함수형 — React state setter), "되돌리기"가 되살릴 이전 문서] — 순서 고정(진입 바이트 절약) */
export type ImageHost = readonly [
  images: RenderImages | undefined,
  publish: (update: (prev: RenderImages | undefined) => RenderImages | undefined) => void,
  undoDoc: PageDoc | undefined,
  /** 스냅샷 문서들(+ 되돌릴 복원 직전 문서) — 참조 집합에 든다(ER SPEC r1 3.2) */
  snapshots?: readonly PageDoc[],
];

/** 로컬 영속 이미지(ADR-007 P1b) — 로컬 저장소에만 있다. 편집 틀이 맵이 바뀔 때마다 부른다: 맵 등록(문서 저장 트랜잭션이 Blob을 함께 쓴다) · 맵 없음(마운트) = 복원 시작 */
export interface ImageKeeper {
  /** 돌려주는 함수 = 편집 틀 effect cleanup(등록 해제 — 편집기를 떠날 때·맵이 바뀔 때) */
  readonly images?: (projectId: string, images: RenderImages | undefined, publish: ImageHost[1]) => () => void;
}
