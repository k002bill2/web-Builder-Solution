/**
 * 썸네일 SSR 빌드 엔트리 (M3P-2 · SPEC 3절 A) — `vite build --mode thumbs`(SSR)로 묶어 scripts/build-thumbs.mjs가 Node에서 부른다. 앱·렌더 문서 번들 밖.
 * 레퍼런스마다 렌더 입력 → `react-dom/server` 정적 마크업(S0: 렌더 문서 실제 DOM과 구조 동일) → SVG. 파일 = 고정 경로 `thumbs/{id}.svg`,
 * 캐시 무효화는 21장 내용 해시 1개(빌드 버전 상수 `?v=` — scripts/thumbsVersion.mjs, ADR-004 개정 7 결정 1).
 * 대상 = 카탈로그 카드 id 전체(큐레이션 + 생성). 카드는 id별로 썸네일 유무를 모르므로 렌더 입력이 없는 카드 id는 빌드 실패(조용히 빠지지 않는다).
 */
import { renderToStaticMarkup } from "react-dom/server";
import { generatedReferenceFixtures } from "../fixtures/generatedReferences";
import { referenceFixtures } from "../fixtures/references";
import { PageDocument } from "../render/PageDocument";
import { referenceRenderInput } from "./referenceDoc";
import { thumbnailCss, thumbnailSvg } from "./svgWriter";

export { THUMB_HEIGHT, THUMB_WIDTH } from "./svgWriter";
export { thumbnailIssues } from "./guards";

export interface Thumbnail {
  readonly id: string;
  readonly svg: string;
}

/** 파일 이름에 들어가므로 id 모양을 묶는다(경로 조각 0) */
const SAFE_ID = /^[a-z0-9][a-z0-9-]*$/;

export function buildThumbnail(id: string, renderCss: string): Thumbnail {
  if (!SAFE_ID.test(id)) throw new Error(`썸네일 id 모양이 아닙니다: ${id}`);
  const { doc, kitTokens } = referenceRenderInput(id);
  const svg = thumbnailSvg(renderToStaticMarkup(<PageDocument doc={doc} kitTokens={kitTokens} />), thumbnailCss(renderCss));
  return { id, svg };
}

export const thumbnailIds = (): readonly string[] => [...referenceFixtures, ...generatedReferenceFixtures].map((r) => r.id);

export const buildThumbnails = (renderCss: string): readonly Thumbnail[] => thumbnailIds().map((id) => buildThumbnail(id, renderCss));
