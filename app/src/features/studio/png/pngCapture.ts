/**
 * PNG 캡처 (m2a 3.3 · 2a-05 5.13 r4.8 — `requestExport` 밖: 잡·스냅샷·멱등 0) — 조작 뒤 청크(PngSave가 누른 뒤 import).
 * 지금 문서를 지금 미리보기 폭의 숨은 렌더 iframe(`sandbox="allow-scripts"` 그대로)에 새로 그려 serialize → 킷 CSS와 함께 XHTML →
 * SVG `foreignObject` → **`data:` URL** Image → canvas → PNG. `blob:` URL로 그리면 Chrome·Edge·Safari 모두 캔버스가 오염된다(M2A-3c REPORT 4절).
 * 폴백 섹션은 표식과 함께 담는다 — 정적 HTML 생성기의 "폴백 = 실패"는 HTML 전용. 새로 그리므로 선택·문제 오버레이·열린 details·시트 0(0.11).
 */
import type { PageDoc } from "../../../engine/contracts/pageDoc";
import type { PreviewView } from "../../detail/previewView";
import type { FrameRect, KitTokenInput } from "../../../render/protocol";
import { emitEditorEvent } from "../editorEvents";
import { FRAME_REM, remPx } from "../previewFrame";
import { exportFileStem } from "../staticHtml/exportFileName";
import { FONT_FAILED, FONT_TIMEOUT_MS, defaultFetchBytes, loadSiteFonts, stripFontFaces, type FetchBytes } from "../staticHtml/siteFontEmbed";
import { defaultFetchText, kitCss, openCaptureFrame, renderAndSerialize, type RenderChannel } from "../staticHtml/staticHtml";

/** 캔버스 상한 — 높이 16384px · 넓이 16,777,216px(가장 좁은 브라우저 상한 기준). 넘으면 실패 상태 */
export const MAX_CANVAS_HEIGHT = 16384;
const MAX_CANVAS_AREA = 16_777_216;
/** 숨은 iframe 준비·그리기·직렬화 상한 */
const TIMEOUT_MS = 8000;

export type PngErrorCode = "RENDER_TIMEOUT" | "CANVAS_TOO_TALL" | "CANVAS_TAINTED" | "INFRA";
export class PngError extends Error {
  constructor(
    readonly code: PngErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PngError";
  }
}

export interface PngRequest {
  readonly doc: PageDoc;
  readonly kitTokens?: KitTokenInput;
  readonly view: PreviewView;
  readonly name: string;
  readonly revision: number;
}
export interface PngDeps {
  readonly open: (widthRem: number) => RenderChannel;
  readonly fetchText: (url: string) => Promise<string>;
  /** data: URL SVG → PNG Blob (canvas) */
  readonly draw: (url: string, width: number, height: number) => Promise<Blob>;
  readonly download: (blob: Blob, fileName: string) => void;
  readonly timeoutMs: number;
  /** 글꼴 바이트 받기(M2B-4a) · 상한(기본 5초) */
  readonly fetchBytes?: FetchBytes;
  readonly fontTimeoutMs?: number;
}

/** `{이름}_{폭}_r{revision}.png` · 폴백이 있으면 `…_구조포함.png` (3.3 · K-AC-32) */
export const pngFileName = (name: string, width: number, revision: number, fallbackCount: number) =>
  `${exportFileStem(name)}_${width}_r${revision}${fallbackCount > 0 ? "_구조포함" : ""}.png`;

export const svgDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** 사이트 루트 마크업 + 킷 CSS → SVG(원래 폭 × 전체 길이). 실행 코드·on*·열린 details는 지운다(불활성 문서 안에서) */
const MOTION_STOP = "[data-site-root] *, [data-site-root] *::before, [data-site-root] *::after { animation: none !important; transition: none !important; }";

export function buildCaptureSvg({ markup, css, width, height }: { readonly markup: string; readonly css: string; readonly width: number; readonly height: number }): string {
  const page = document.implementation.createHTMLDocument("");
  page.body.innerHTML = markup;
  const site = page.body.firstElementChild;
  if (!site?.hasAttribute("data-site-root") || page.body.childElementCount !== 1) throw new PngError("INFRA", "사이트 루트가 없는 마크업입니다");
  for (const el of site.querySelectorAll("script, iframe, object, embed")) el.remove();
  for (const el of [site, ...site.querySelectorAll("*")]) {
    for (const { name } of [...el.attributes]) if (name.startsWith("on")) el.removeAttribute(name);
  }
  for (const el of site.querySelectorAll("details[open]")) el.removeAttribute("open");
  // 모션 = 최종 상태(M2B-4b · SPEC 1.3·C-4 · MF-AC-U5) — 재생 스위치 0 + style 끝 방어 규칙(t≈0 프레임이 찍혀도 최종)
  for (const el of [site, ...site.querySelectorAll("[data-motion-play]")]) el.removeAttribute("data-motion-play");
  const style = page.createElement("style");
  style.textContent = `${css}\n${MOTION_STOP}`;
  page.head.replaceChildren(style);
  page.documentElement.setAttribute("style", `width:${width}px`);
  page.body.setAttribute("style", "margin:0");
  const xhtml = new XMLSerializer().serializeToString(page.documentElement);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject x="0" y="0" width="${width}" height="${height}">${xhtml}</foreignObject></svg>`;
}

/** 문서 바닥 = 섹션 사각형(slotKey null)의 가장 아래 */
const pageBottom = (rects: readonly FrameRect[]) => Math.ceil(rects.filter((r) => r[1] === null).reduce((max, r) => Math.max(max, r[3] + r[5]), 0));
/** 가장 넓은 섹션 폭 = 그 rects를 잰 배치 폭 */
const layoutWidth = (rects: readonly FrameRect[]) => rects.filter((r) => r[1] === null).reduce((max, r) => Math.max(max, r[4]), 0);
/**
 * serialize해도 되는 rects(M2B-D1): 바닥 > 0 + 캡처 폭 배치. iframe 뷰포트가 캡처 폭이 되기 전(0·좁은 폭) 배치도 바닥 > 0일 수 있다 — 그 높이로 그리면 아래가 빈 캔버스.
 * 상한을 넘는 바닥은 폭과 상관없이 받는다(세로 스크롤바로 폭이 줄어도 CANVAS_TOO_TALL 그대로)
 */
const settledAt = (width: number) => (rects: readonly FrameRect[]) => {
  const bottom = pageBottom(rects);
  return bottom > 0 && (Math.abs(layoutWidth(rects) - width) <= 1 || bottom > MAX_CANVAS_HEIGHT);
};

export async function capturePng(request: PngRequest, deps: PngDeps): Promise<{ readonly fileName: string; readonly fallbackCount: number; readonly blob: Blob }> {
  // 좌표계 하나(P2-c): iframe 폭 = SVG·캔버스 폭 = 프레임 rem × 지금 rem px(정수로 맞춤 — 캔버스 폭은 정수). 높이는 그 iframe의 사각형 바닥.
  // 파일 이름 폭은 프레임 이름(1280·768·390 — 캡션과 같은 값)
  const unit = remPx();
  const width = Math.round(FRAME_REM[request.view] * unit);
  const rem = width / unit;
  const css = await kitCss(deps.fetchText);
  // 글꼴 = 정적 HTML과 같은 data: 규칙 · 렌더 문서도 같은 바이트로 측정(높이 = 그린 글꼴). 실패·5초 넘김 = RENDER_TIMEOUT 경로(그리지 않음)
  const started = Date.now();
  const fonts = request.kitTokens
    ? await loadSiteFonts(css, request.kitTokens.type, deps.fetchBytes ?? defaultFetchBytes, deps.fontTimeoutMs ?? FONT_TIMEOUT_MS).catch(() => {
        throw new PngError("RENDER_TIMEOUT", FONT_FAILED);
      })
    : { bytes: [], css: "" };
  // 렌더 문서는 레이아웃 전 0 크기·캡처 폭 전 배치의 사각형을 먼저 보낼 수 있다 — 캡처 폭에서 바닥 > 0인 보고를 기다린다(M2A-3c C4 · M2B-D1 실측).
  // 킷 토큰 없음(NO_KIT_TOKENS)은 실패가 아니다 — 캔버스처럼 중립 폴백으로 그린 rects·직렬화를 기다린다(P2-b · 정적 HTML은 실패 그대로)
  const { markup, rects } = await renderAndSerialize(deps.open(rem), request.doc, request.kitTokens, Math.max(0, deps.timeoutMs - (Date.now() - started)), settledAt(width), ["NO_KIT_TOKENS"], fonts.bytes).catch((error: unknown) => {
    throw (error as { readonly code?: string }).code === "JOB_TIMEOUT" ? new PngError("RENDER_TIMEOUT", "PNG 렌더 문서 시간 초과") : error;
  });
  const height = pageBottom(rects);
  if (height <= 0 || height > MAX_CANVAS_HEIGHT || width * height > MAX_CANVAS_AREA) throw new PngError("CANVAS_TOO_TALL", "페이지가 PNG 한 장 상한을 넘습니다");
  const fallbackCount = (markup.match(/data-fallback="true"/g) ?? []).length;
  const blob = await deps.draw(svgDataUrl(buildCaptureSvg({ markup, css: stripFontFaces(css) + fonts.css, width, height })), width, height);
  return { fileName: pngFileName(request.name, FRAME_REM[request.view] * 16, request.revision, fallbackCount), fallbackCount, blob };
}

async function drawPng(url: string, width: number, height: number): Promise<Blob> {
  const image = new Image();
  image.src = url;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new PngError("INFRA", "캔버스를 만들 수 없습니다");
  context.drawImage(image, 0, 0);
  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new PngError("CANVAS_TOO_TALL", "PNG를 만들 수 없는 크기입니다"))), "image/png");
    } catch {
      reject(new PngError("CANVAS_TAINTED", "캔버스가 오염됐습니다"));
    }
  });
}

/** 부모 문서 `<a download>` 클릭 → 제거 · object URL은 내려받기 시작 뒤 해제 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const DEFAULT_DEPS: PngDeps = { open: (widthRem) => openCaptureFrame(widthRem, MAX_CANVAS_HEIGHT / remPx()), fetchText: defaultFetchText, draw: drawPng, download: downloadBlob, timeoutMs: TIMEOUT_MS };

/** 누름 → 캡처 → 내려받기 · 계측(코드·개수·열거값만 — 이름·파일 이름 0). 성공 문장을 돌려준다 */
export async function savePng(request: PngRequest, deps: PngDeps = DEFAULT_DEPS): Promise<string> {
  emitEditorEvent({ name: "png_requested", view: request.view });
  const { fileName, fallbackCount, blob } = await capturePng(request, deps);
  deps.download(blob, fileName);
  emitEditorEvent({ name: "png_succeeded", view: request.view, fallback_count: fallbackCount });
  return `PNG를 내려받았습니다 · ${fileName}`;
}

export function reportFailure(error: unknown): void {
  emitEditorEvent({ name: "png_failed", reason: error instanceof PngError ? error.code : "INFRA" });
}
