/**
 * 내보내기 글꼴 인라인 (M2B-4a · SPEC-MOTION-FONT 2.4 · MQ-M2B3-3 ★A) — 정적 HTML·PNG 생성기(조작 뒤 청크)가 쓴다.
 * 킷 CSS(render.html 스타일시트)의 `@font-face`(같은 서버 url, `kit/fonts.css`)를 빼고, 그 사이트가 쓰는 계열 1개 × 대응 굵기(≤ 2)만
 * 바이트로 받아 `data:` 규칙으로 바꾼다. 같은 바이트를 숨은 렌더 문서에도 넘겨(render.fonts) 측정 글꼴 = 결과 글꼴.
 * 받기 실패·5초 넘김 = FontLoadError(내보내기 실패 — 폴백 글꼴로 만들지 않는다). 상한 뒤 도착은 무시(이미 실패).
 */
import ofl from "../../../assets/site-fonts/kit-sans-kr/OFL.txt?raw";
import { siteFaces } from "../../../kit/siteFonts";
import type { FontBytes } from "../../../render/protocol";

export const FONT_TIMEOUT_MS = 5000;
export const FONT_FAILED = "글꼴을 불러오지 못했습니다 — 다시 시도하세요";
export class FontLoadError extends Error {
  constructor() {
    super(FONT_FAILED);
    this.name = "FontLoadError";
  }
}

export type FetchBytes = (url: string) => Promise<ArrayBuffer>;
export const defaultFetchBytes: FetchBytes = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} ${response.status}`);
  return response.arrayBuffer();
};

const FACE_RULE = /@font-face\s*\{[^}]*\}/g;

/** 킷 CSS의 `@font-face` → 계열·굵기·url */
export function cssFontFaces(css: string): readonly { readonly family: string; readonly weight: number; readonly url: string }[] {
  return (css.match(FACE_RULE) ?? []).flatMap((rule) => {
    const family = /font-family:\s*["']?([^"';]+)["']?/.exec(rule)?.[1];
    const weight = Number(/font-weight:\s*(\d+)/.exec(rule)?.[1]);
    const url = /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(rule)?.[1];
    return family && url ? [{ family, weight, url }] : [];
  });
}

export const stripFontFaces = (css: string) => css.replace(FACE_RULE, "");

const base64 = (data: ArrayBuffer) => {
  const bytes = new Uint8Array(data);
  let text = "";
  for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(text);
};

/** 고지 — 계열마다 고정 문자열(사용자 글자 0). OFL 조건 2: 저작권 고지 + 라이선스 전문 */
const COPYRIGHT: Readonly<Record<string, string>> = {
  Pretendard: "Pretendard — Copyright (c) 2021, Kil Hyung-jin (https://github.com/orioncactus/pretendard), with Reserved Font Name Pretendard.",
  "Kit Sans KR":
    "Kit Sans KR is a Modified Version of Noto Sans KR (Copyright 2014-2021 Adobe, with Reserved Font Name 'Source'), subset and renamed. Licensed under the SIL Open Font License 1.1.",
  "Kit Serif KR":
    "Kit Serif KR is a Modified Version of Noto Serif KR (Copyright 2017-2024 Adobe; upstream OFL.txt: Copyright 2012 Google Inc. All Rights Reserved.), subset and renamed. Licensed under the SIL Open Font License 1.1.",
};
const LICENSE = ofl.slice(ofl.indexOf("This Font Software is licensed")).trim();
export const fontNotice = (family: string) => `\nFonts: ${COPYRIGHT[family] ?? family}\n\n${LICENSE}\n`;

export interface SiteFonts {
  /** 렌더 문서에 넘길 바이트(측정용) */
  readonly bytes: readonly FontBytes[];
  /** 결과물 `@font-face` 규칙(data:) */
  readonly css: string;
  /** 정적 HTML `<head>` 주석 */
  readonly notice: string;
}

/** 쓰는 면만 받는다 — 상한 안에 전부 와야 성공 */
export async function loadSiteFonts(
  css: string,
  type: { readonly family: string; readonly headingWeight: number; readonly bodyWeight: number },
  fetchBytes: FetchBytes,
  timeoutMs = FONT_TIMEOUT_MS,
): Promise<SiteFonts> {
  const faces = siteFaces(type);
  if (faces.length === 0) return { bytes: [], css: "", notice: "" };
  const rules = cssFontFaces(css);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_, reject) => (timer = setTimeout(() => reject(new FontLoadError()), timeoutMs)));
  const fetched = Promise.all(
    faces.map(async (face) => {
      const url = rules.find((rule) => rule.family === face.family && rule.weight === face.weight)?.url;
      if (!url) throw new FontLoadError();
      return { ...face, data: await fetchBytes(url) };
    }),
  );
  try {
    const bytes = await Promise.race([fetched, expired]);
    return {
      bytes,
      css: bytes
        .map((f) => `@font-face{font-family:"${f.family}";font-weight:${f.weight};font-style:normal;font-display:swap;src:url(data:font/woff2;base64,${base64(f.data)}) format("woff2")}`)
        .join(""),
      notice: fontNotice(faces[0]!.family),
    };
  } catch {
    throw new FontLoadError();
  } finally {
    clearTimeout(timer);
    fetched.catch(() => undefined);
  }
}
