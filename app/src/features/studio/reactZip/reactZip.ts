/**
 * React 프로젝트(zip) 생성기 (REACTZIP-SPEC r1 · FR-PUB-02) — 조작 뒤 청크(exportFlow의 별도 retryableImport 슬롯, RZQ-02 A).
 * (a)안: 킷 원문 `?raw` 동봉 + `site.json`. 렌더 iframe을 열지 않는다 — 입력 = 저장된 revision 문서 · 킷 토큰 · 글꼴 바이트(loadSiteFonts) · 이미지 Blob(readImage).
 * 결과 = store zip Blob(application/zip) object URL + SHA-256 앞 12자. 허용표 위반·스키마 실패 = 단언 실패(사유 표시) · 64MB 초과 = 용량 실패(사유 표시).
 */
import { ProjectRepositoryError, type DocHead, type ExportFormat, type ExportGenerator } from "../../../data/projectRepository";
import type { StudioReader } from "../../../data/studioStore";
import type { PageDoc } from "../../../engine/contracts/pageDoc";
import type { FontBytes, KitTokenInput, RenderImage } from "../../../render/protocol";
import { docKitTokens } from "../docPurpose";
import { exportImages, type ExportSummary, type ReadImage } from "../staticHtml/exportImages";
import { defaultFetchText, hex12, kitCss } from "../staticHtml/kitCss";
import { FONT_FAILED, FONT_TIMEOUT_MS, defaultFetchBytes, faceRule, fontLicenseText, loadSiteFonts, type FetchBytes } from "../staticHtml/siteFontEmbed";
import { EXT, ZIP_MAX, fontFileName, tooLargeText } from "../zip/staticZip";
import { zipParts, type ZipEntry } from "../zip/storeZip";
import { checkReactZipEntries, orderReactZipEntries } from "./checkReactZipEntries";
import { kitSources, typeSources, type KitCss } from "./kitSources";
import { reactZipLicenses } from "./licenses";
import { README_MD, REACT_ZIP_FAIL_PATTERN } from "./reactZipText";
import { siteJson, siteJsonProblems, type SiteImage } from "./siteJson";
import { IMAGES_TS, INDEX_CSS, MAIN_TSX, PACKAGE_JSON, PACKAGE_LOCK, PAGE_DOCUMENT_TSX, TSCONFIG, VITE_CONFIG, indexHtml } from "./templates";

/** 사유를 사용자에게 보일 실패(단언 · 용량) — exportFlow가 `shown`을 보고 사유를 싣는다. 진단은 cause */
export class ReactZipError extends Error {
  readonly shown = true;
  /** 같은 문서로 다시 해도 같은 결과 — exportFlow가 재시도 없는 거절로 보인다(SPEC 1.3) */
  readonly retry = false;
}

/** 생성 전체 상한(render.html·CSS·글꼴 조회 포함) — exportFlow 조회 상한(10초)보다 짧게. 넘으면 JOB_TIMEOUT으로 잡을 끝낸다(Codex r1) */
const TIMEOUT_MS = 8000;

export interface ReactZipInput {
  readonly doc: PageDoc;
  readonly kitTokens: KitTokenInput;
  readonly fonts: readonly FontBytes[];
  /** exportImages 결과(id당 1장 — 정적 zip과 같은 파생본) · 잃은 이미지 수 */
  readonly images: Readonly<Record<string, RenderImage>>;
  readonly lost: number;
  /** entry 시각 = 그 revision 문서의 updatedAt(M4-a Q6 B) */
  readonly date: Date;
  /** 킷 CSS 원문 주입 — vitest(css: false)에서는 `?raw` CSS가 빈 문자열이라 테스트가 넣는다 */
  readonly css?: KitCss;
}

const encoder = new TextEncoder();
const textEntry = (name: string, body: string): ZipEntry => ({ name, data: encoder.encode(body) });
const fail = (detail: string): never => {
  throw new ReactZipError(REACT_ZIP_FAIL_PATTERN, { cause: detail });
};

/** 2.2 — exportImages 순서(문서 섹션 → 슬롯 첫 등장) = img-01부터 · 99 초과 3자리 · 확장자 = Blob type */
function imageKeys(images: Readonly<Record<string, RenderImage>>) {
  const keys = new Map<string, string>();
  const files: Record<string, SiteImage> = {};
  for (const [id, image] of Object.entries(images)) {
    const ext = EXT[image.blob.type] ?? fail(`zip 이미지 형식이 아닙니다: ${image.blob.type}`);
    const key = `img-${String(keys.size + 1).padStart(2, "0")}`;
    keys.set(id, key);
    files[key] = { file: `${key}.${ext}`, width: image.width, height: image.height };
  }
  return { keys, files };
}

/** 2.1 entry 목록(2.4 순서) — 허용표 검사 전 */
export async function reactZipEntries({ doc, kitTokens, fonts, images, lost, css }: Omit<ReactZipInput, "date">): Promise<ZipEntry[]> {
  const { keys, files } = imageKeys(images);
  const site = siteJson(doc, kitTokens, keys, files);
  const problems = siteJsonProblems(site);
  if (problems.length > 0) fail(`site.json ${problems.join(" · ")}`);
  const fontFiles = fonts.map((face) => ({ face, name: `assets/fonts/${fontFileName(face.family, face.weight)}` }));
  const fontsCss = fontFiles.map(({ face, name }) => faceRule(face, `./${name}`)).join("\n") + "\n[data-site-root] {\n  font-synthesis: none;\n}\n";
  const imageEntries = await Promise.all(
    [...keys].map(async ([id, key]) => ({ name: `src/assets/images/${files[key]!.file}`, data: new Uint8Array(await images[id]!.blob.arrayBuffer()) })),
  );
  const family = fonts[0]?.family;
  const body: ZipEntry[] = [
    textEntry("package.json", PACKAGE_JSON),
    textEntry("package-lock.json", PACKAGE_LOCK),
    textEntry("index.html", indexHtml(doc.meta.title, doc.meta.description)),
    textEntry("vite.config.ts", VITE_CONFIG),
    textEntry("tsconfig.json", TSCONFIG),
    textEntry("README.md", README_MD),
    textEntry("src/PageDocument.tsx", PAGE_DOCUMENT_TSX),
    textEntry("src/fonts.css", fontsCss),
    textEntry("src/images.ts", IMAGES_TS),
    textEntry("src/index.css", INDEX_CSS),
    textEntry("src/main.tsx", MAIN_TSX),
    textEntry("src/site.json", JSON.stringify(site, null, 2) + "\n"),
    ...typeSources().map((t) => textEntry(t.name, t.text)),
    ...kitSources(css).map((k) => textEntry(k.name, k.text)),
    ...fontFiles.map(({ face, name }) => ({ name: `src/${name}`, data: new Uint8Array(face.data) })),
    ...(family ? [textEntry("src/assets/fonts/OFL.txt", fontLicenseText(family))] : []),
    ...imageEntries,
  ];
  const licenses = reactZipLicenses({ files: body.length + 1, family, fonts: fontFiles.map((f) => `src/${f.name}`).sort(), images: imageEntries.map((e) => e.name), lost });
  return orderReactZipEntries([...body, textEntry("LICENSES.md", licenses)]);
}

/** entry → 허용표 검사 → store zip 바이트 → 크기 상한(ZIP_MAX — 정적 zip과 같은 64MB) */
export async function buildReactZip(input: ReactZipInput): Promise<Uint8Array<ArrayBuffer>> {
  const entries = await reactZipEntries(input);
  const expect = { kit: new Map(kitSources(input.css).map((k) => [k.name, k.text])), types: new Map(typeSources().map((t) => [t.name, t.text])) };
  const problems = checkReactZipEntries(entries, expect);
  if (problems.length > 0) fail(`허용표 ${problems.join(" · ")}`);
  const parts = zipParts(entries, input.date);
  const bytes = parts.reduce((sum, part) => sum + part.length, 0);
  if (bytes > ZIP_MAX) throw new ReactZipError(tooLargeText(bytes));
  const data = new Uint8Array(new ArrayBuffer(bytes));
  parts.reduce((at, part) => (data.set(part, at), at + part.length), 0);
  return data;
}

export interface ReactZipDeps {
  readonly fetchText: (url: string) => Promise<string>;
  readonly urls: Pick<typeof URL, "createObjectURL" | "revokeObjectURL">;
  /** 글꼴 바이트 받기 · 상한(정적 형식과 같은 loadSiteFonts 경로) */
  readonly fetchBytes: FetchBytes;
  readonly fontTimeoutMs: number;
  /** 생성 전체 상한 */
  readonly timeoutMs: number;
  /** 보관소 이미지 읽기(파생본 전부 — exportFlow 주입) */
  readonly readImage: ReadImage;
  readonly onBuilt: (downloadRef: string, summary: ExportSummary) => void;
}

/** 저장소(store)당 1개 — 프로젝트별 마지막 object URL을 들고, 같은 프로젝트를 다시 만들면 이전 것을 해제한다(정적 생성기와 같은 규칙) */
export function createReactZipGenerator(store: StudioReader, deps: Partial<ReactZipDeps> = {}): ExportGenerator {
  const { fetchText = defaultFetchText, urls = URL, fetchBytes = defaultFetchBytes, fontTimeoutMs = FONT_TIMEOUT_MS, timeoutMs = TIMEOUT_MS, readImage = () => undefined, onBuilt } = deps;
  const held = new Map<string, string>();
  return async ({ projectId, format, doc: head }: { readonly projectId: string; readonly format: ExportFormat; readonly doc: DocHead }) => {
    const doc = head as PageDoc;
    const project = store.projects().find((p) => p.projectId === projectId);
    const versions = project ? store.versions(project.profileId) : [];
    const kitTokens = project && docKitTokens({ profileId: project.profileId, versions, latestVersion: versions.at(-1)?.version ?? 0 }, doc.profileVersion);
    if (!kitTokens) throw new Error("킷 토큰을 만들 수 없는 문서입니다");
    const build = async () => {
      const fonts = await loadSiteFonts(await kitCss(fetchText), kitTokens.type, fetchBytes, fontTimeoutMs).catch(() => {
        throw new ProjectRepositoryError("JOB_TIMEOUT", FONT_FAILED);
      });
      const { images, lost } = exportImages(doc, readImage);
      return { data: await buildReactZip({ doc, kitTokens, fonts: fonts.bytes, images, lost, date: new Date(head.updatedAt) }), fonts, images, lost };
    };
    // 늦게 끝난 생성은 결과를 게시하지 않는다 — URL·onBuilt는 상한 안에 끝난 경우만
    let timer: ReturnType<typeof setTimeout> | undefined;
    const expired = new Promise<never>((_, reject) => (timer = setTimeout(() => reject(new ProjectRepositoryError("JOB_TIMEOUT", "React zip 생성 시간 초과")), timeoutMs)));
    const { data, fonts, images, lost } = await Promise.race([build(), expired]).finally(() => clearTimeout(timer));
    const resultHash = await hex12(data);
    const key = `${projectId}|${format}`;
    const previous = held.get(key);
    if (previous) urls.revokeObjectURL(previous);
    const downloadRef = urls.createObjectURL(new Blob([data], { type: "application/zip" }));
    held.set(key, downloadRef);
    onBuilt?.(downloadRef, { bytes: data.length, images: Object.keys(images).length, lost, fonts: fonts.bytes.length });
    return { downloadRef, resultHash };
  };
}
