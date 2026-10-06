/**
 * 썸네일 SSR 빌드 엔트리 (M3P-2 · SPEC 3절 A) — `vite build --mode thumbs`(SSR)로 묶어 scripts/build-thumbs.mjs가 Node에서 부른다. 앱·렌더 문서 번들 밖.
 * 레퍼런스마다 렌더 입력 → `react-dom/server` 정적 마크업(S0: 렌더 문서 실제 DOM과 구조 동일) → SVG. 키 = `{id}.{SVG sha256 앞 8자}`(콘텐츠 해시 — 파일 이름·THUMBNAIL_KEYS).
 * 대상 = 상세·비교 데이터가 둘 다 있는 레퍼런스 전부(생성 레퍼런스가 같은 데이터로 합쳐지면 자동 포함).
 */
import { createHash } from "node:crypto";
import { renderToStaticMarkup } from "react-dom/server";
import { referenceComparisonAttributes } from "../fixtures/referenceComparisons";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { PageDocument } from "../render/PageDocument";
import { referenceRenderInput } from "./referenceDoc";
import { thumbnailCss, thumbnailSvg } from "./svgWriter";

export { THUMB_HEIGHT, THUMB_WIDTH } from "./svgWriter";
export { thumbnailIssues } from "./guards";

export interface Thumbnail {
  readonly id: string;
  readonly key: string;
  readonly svg: string;
}

/** 파일 이름에 들어가므로 id 모양을 묶는다(경로 조각 0) */
const SAFE_ID = /^[a-z0-9][a-z0-9-]*$/;

export function buildThumbnail(id: string, renderCss: string): Thumbnail {
  if (!SAFE_ID.test(id)) throw new Error(`썸네일 id 모양이 아닙니다: ${id}`);
  const { doc, kitTokens } = referenceRenderInput(id);
  const svg = thumbnailSvg(renderToStaticMarkup(<PageDocument doc={doc} kitTokens={kitTokens} />), thumbnailCss(renderCss));
  return { id, key: `${id}.${createHash("sha256").update(svg).digest("hex").slice(0, 8)}`, svg };
}

export const thumbnailIds = (): readonly string[] => Object.keys(referenceComparisonAttributes).filter((id) => id in referenceDetailFixtures);

export const buildThumbnails = (renderCss: string): readonly Thumbnail[] => thumbnailIds().map((id) => buildThumbnail(id, renderCss));
