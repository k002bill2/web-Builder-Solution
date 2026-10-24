export { sampleZipFileName } from "../staticHtml/exportFileName";
import { storeZip, type ZipEntry } from "../zip/storeZip";

/**
 * 디자인 샘플 묶음 zip (SAMPLE-SPEC r0 2.3 ★B · SMP-AC-A01) — 시안 PNG + 시안 HTML 1개 + design-tokens.json + sections.json + README.txt.
 * 조립만 한다(값 생성 0) — PNG는 pngCapture, HTML은 staticHtml 생성기, JSON은 sampleJson이 만든다. 조작 뒤 청크 전용.
 */
export interface SampleParts {
  readonly png: Uint8Array;
  readonly html: Uint8Array;
  readonly tokensJson: string;
  readonly sectionsJson: string;
}

export const SAMPLE_ENTRY_NAMES = ["design.png", "design.html", "design-tokens.json", "sections.json", "README.txt"] as const;

export const SAMPLE_README = [
  "디자인 샘플 묶음 — 파일 5개",
  "design.png: 시안 화면 이미지(현재 미리보기 폭)",
  "design.html: 시안 HTML 1개(글꼴·이미지 포함)",
  "design-tokens.json: 색·글꼴·간격·모서리 토큰과 CSS 변수(--site-*)",
  "sections.json: 섹션 순서·유형·변형·톤·모션(글·이미지 값 없음)",
  "",
].join("\n");

export function sampleZipEntries(parts: SampleParts): readonly ZipEntry[] {
  const text = (s: string) => new TextEncoder().encode(s);
  const data = [parts.png, parts.html, text(parts.tokensJson), text(parts.sectionsJson), text(SAMPLE_README)];
  return SAMPLE_ENTRY_NAMES.map((name, i) => ({ name, data: data[i]! }));
}

export const sampleZip = (parts: SampleParts, date: Date): Blob => storeZip(sampleZipEntries(parts), date);

