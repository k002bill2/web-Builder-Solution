/**
 * 정적 HTML 생성기 (M2A-3b G3 · 2a-05 8.3.2 6단계 r4.8 "static-html = 브라우저 생성기") — 조작 뒤 청크(memoryDocBook이 처음 쓸 때 import).
 * 잡의 스냅샷 문서를 화면 밖 숨은 렌더 iframe(`sandbox="allow-scripts"` 그대로)에 그리고 serialize → 사이트 루트 마크업.
 * 킷 CSS = 같은 출처 `/render.html`의 스타일시트 텍스트(불투명 출처 iframe 안 cssRules는 못 읽는다 — 부모가 읽는다) → 인라인 `<style>`.
 * 결과 = Blob(text/html;charset=utf-8) object URL + 결과 바이트 SHA-256 앞 12자리. 시간 초과 = JOB_TIMEOUT, 그 밖 = INFRA(저장소가 기록).
 */
import { ProjectRepositoryError, type DocHead, type ExportGenerator } from "../../../data/projectRepository";
import type { StudioReader } from "../../../data/studioStore";
import type { PageDoc } from "../../../engine/contracts/pageDoc";
import { readHtmlMessage } from "../../../render/htmlMessage";
import { readRenderMessage, type FontBytes, type FrameRect, type KitTokenInput, type ParentMessage, type RenderErrorCode } from "../../../render/protocol";
import { docKitTokens } from "../docPurpose";
import { FONT_FAILED, FONT_TIMEOUT_MS, defaultFetchBytes, loadSiteFonts, stripFontFaces, type FetchBytes } from "./siteFontEmbed";
import { buildStaticHtml } from "./staticMarkup";

const RENDER_DOC_SRC = "/render.html";
/** 숨은 iframe 준비·그리기·직렬화 전체 상한 — exportFlow 조회 상한(10초)보다 짧게 */
const TIMEOUT_MS = 8000;

/** 부모 ↔ 숨은 렌더 문서 통로 — 받는 쪽은 그 iframe에서 온 메시지만 */
export interface RenderChannel {
  send(message: ParentMessage): void;
  listen(receive: (data: unknown) => void): void;
  close(): void;
}

/** 화면 밖 숨은 렌더 iframe(폭 80rem = 데스크톱 프레임). 캔버스와 같은 sandbox · 출처 검사(`event.source === iframe.contentWindow`) */
export function openRenderFrame(): RenderChannel {
  return openFrame({ position: "fixed", left: "-200vw", top: "0", width: "80rem", height: "50rem", border: "0", visibility: "hidden" });
}

/**
 * PNG 캡처용 렌더 iframe — Chrome은 화면 밖·`visibility:hidden` 교차 출처 iframe을 배치하지 않아 사각형이 0이다(M2A-3c C4 실측).
 * 화면 안 · 투명 · 누름 통과 · 맨 뒤. 높이 = 캔버스 높이 상한(1024rem = 16384px) — 내용보다 낮으면 세로 스크롤바만큼 폭이 줄어 배치가 달라진다.
 */
export function openCaptureFrame(widthRem: number, heightRem = 1024): RenderChannel {
  return openFrame({ position: "fixed", left: "0", top: "0", width: `${widthRem}rem`, height: `${heightRem}rem`, border: "0", opacity: "0", pointerEvents: "none", zIndex: "-1" });
}

function openFrame(style: Partial<CSSStyleDeclaration>): RenderChannel {
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-scripts");
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("data-export-frame", "");
  frame.tabIndex = -1;
  frame.title = "내보내기용 렌더 문서";
  Object.assign(frame.style, style);
  frame.src = RENDER_DOC_SRC;
  document.body.append(frame);
  let handler: ((event: MessageEvent) => void) | undefined;
  return {
    send: (message) => frame.contentWindow?.postMessage(message, "*"),
    listen: (receive) => {
      handler = (event) => {
        if (event.source === frame.contentWindow) receive(event.data);
      };
      window.addEventListener("message", handler);
    },
    close: () => {
      if (handler) window.removeEventListener("message", handler);
      frame.remove();
    },
  };
}

/** ready → render → (첫 rects) → serialize → html{markup} + 그 rects. error 코드 = 실패, 상한 넘김 = JOB_TIMEOUT. 어느 쪽이든 iframe을 닫는다 */
export function renderAndSerialize(
  channel: RenderChannel,
  doc: PageDoc,
  kitTokens: KitTokenInput | undefined,
  timeoutMs: number,
  /** 이 사각형으로 serialize해도 되는지(PNG = 레이아웃 뒤 바닥 > 0). 아니면 다음 rects를 기다린다 */
  settled: (rects: readonly FrameRect[]) => boolean = () => true,
  /** 실패로 보지 않을 렌더 문서 오류(PNG = NO_KIT_TOKENS — 폴백은 계속 그린다). 정적 HTML은 비움 = 모든 오류가 실패 */
  tolerated: readonly RenderErrorCode[] = [],
  /** 쓰는 글꼴 바이트(M2B-4a) — 렌더 문서가 이 바이트로 측정한다 */
  fonts: readonly FontBytes[] = [],
): Promise<{ readonly markup: string; readonly rects: readonly FrameRect[] }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rects: readonly FrameRect[] = [];
  return new Promise<{ readonly markup: string; readonly rects: readonly FrameRect[] }>((resolve, reject) => {
    let stage: "wait" | "render" | "serialize" = "wait";
    timer = setTimeout(() => reject(new ProjectRepositoryError("JOB_TIMEOUT", "정적 HTML 렌더 문서 시간 초과")), timeoutMs);
    channel.listen((data) => {
      const html = readHtmlMessage(data);
      if (html && stage === "serialize") return resolve({ markup: html.markup, rects });
      const message = readRenderMessage(data);
      if (message?.type === "ready" && stage === "wait") {
        stage = "render";
        channel.send({ type: "render", doc, ...(kitTokens && { kitTokens }), ...(fonts.length > 0 && { fonts }) });
      } else if (message?.type === "rects" && stage === "render" && settled(message.rects)) {
        stage = "serialize";
        rects = message.rects;
        channel.send({ type: "serialize" });
      } else if (message?.type === "error" && !tolerated.includes(message.code)) {
        reject(new Error(`렌더 문서 오류 ${message.code}`));
      }
    });
  }).finally(() => {
    clearTimeout(timer);
    channel.close();
  });
}

/** `/render.html`의 스타일시트 텍스트 — 빌드 산출물 기준(dev 서버는 CSS를 JS로 넣어 링크가 없다 → 실패) */
export async function kitCss(fetchText: (url: string) => Promise<string>): Promise<string> {
  const page = new DOMParser().parseFromString(await fetchText(RENDER_DOC_SRC), "text/html");
  const hrefs = [...page.querySelectorAll('link[rel="stylesheet"]')].map((link) => link.getAttribute("href") ?? "").filter(Boolean);
  if (hrefs.length === 0) throw new Error("render.html에 스타일시트가 없습니다");
  return (await Promise.all(hrefs.map(fetchText))).join("\n");
}

const hex12 = async (bytes: Uint8Array<ArrayBuffer>) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 12);

export const defaultFetchText = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} ${response.status}`);
  return response.text();
};

export interface StaticHtmlDeps {
  readonly open: () => RenderChannel;
  readonly fetchText: (url: string) => Promise<string>;
  readonly urls: Pick<typeof URL, "createObjectURL" | "revokeObjectURL">;
  readonly timeoutMs: number;
  /** 글꼴 바이트 받기(M2B-4a) · 상한 5초 */
  readonly fetchBytes: FetchBytes;
  readonly fontTimeoutMs: number;
}
export type StaticHtmlGenerator = ExportGenerator & {
  /** 편집기 이탈 — 그 프로젝트의 내려받기 object URL 해제 */
  readonly release: (projectId: string) => void;
};

/** 저장소(store)당 1개 — 프로젝트별 마지막 object URL을 들고, 같은 프로젝트를 다시 만들면 이전 것을 해제한다 */
export function createStaticHtmlGenerator(store: StudioReader, deps: Partial<StaticHtmlDeps> = {}): StaticHtmlGenerator {
  const { open = openRenderFrame, fetchText = defaultFetchText, urls = URL, timeoutMs = TIMEOUT_MS, fetchBytes = defaultFetchBytes, fontTimeoutMs = FONT_TIMEOUT_MS } = deps;
  const held = new Map<string, string>();
  const release = (projectId: string) => {
    const url = held.get(projectId);
    if (url) urls.revokeObjectURL(url);
    held.delete(projectId);
  };
  const generate = async ({ projectId, doc: head }: { readonly projectId: string; readonly doc: DocHead }) => {
    const doc = head as PageDoc;
    const project = store.projects().find((p) => p.projectId === projectId);
    const versions = project ? store.versions(project.profileId) : [];
    const kitTokens = project && docKitTokens({ profileId: project.profileId, versions, latestVersion: versions.at(-1)?.version ?? 0 }, doc.profileVersion);
    if (!kitTokens) throw new Error("킷 토큰을 만들 수 없는 문서입니다");
    const css = await kitCss(fetchText);
    // 글꼴 실패 = 내보내기 실패(시간 초과와 같은 재시도 경로 · 렌더 문서를 열지 않는다). 전체 상한은 글꼴 시간을 포함한다
    const started = Date.now();
    const fonts = await loadSiteFonts(css, kitTokens.type, fetchBytes, fontTimeoutMs).catch(() => {
      throw new ProjectRepositoryError("JOB_TIMEOUT", FONT_FAILED);
    });
    const { markup } = await renderAndSerialize(open(), doc, kitTokens, Math.max(0, timeoutMs - (Date.now() - started)), undefined, [], fonts.bytes);
    const page = buildStaticHtml({ markup, css: stripFontFaces(css) + fonts.css, title: doc.meta.title, description: doc.meta.description, notice: fonts.notice });
    const bytes = new TextEncoder().encode(page);
    const resultHash = await hex12(bytes);
    release(projectId);
    const downloadRef = urls.createObjectURL(new Blob([bytes], { type: "text/html;charset=utf-8" }));
    held.set(projectId, downloadRef);
    return { downloadRef, resultHash };
  };
  return Object.assign(generate, { release });
}
