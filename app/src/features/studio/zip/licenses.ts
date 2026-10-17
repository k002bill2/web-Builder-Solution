/**
 * LICENSES.md (M4-a SPEC 3절 · EXP-AC-10) — 정적 사이트(zip) 묶음의 권리 고지. 구조·필수 필드만 고정하고 문장은 자리표시(최종 문안 = Hemingway 후속).
 * 결정적(같은 입력 → 같은 바이트) · 사용자 글자 0(프로젝트 이름 0 — Q8) · 제품 브랜드 0(Q10).
 */
import { fontLicenseText } from "../staticHtml/siteFontEmbed";

export interface LicensesInput {
  /** 쓰는 글꼴 계열(허용 밖이면 없음) */
  readonly family?: string;
  /** `assets/fonts/*.woff2` 경로(OFL.txt 제외) */
  readonly fonts: readonly string[];
  /** `assets/images/*` 경로(번호순) */
  readonly images: readonly string[];
  /** 잃은 이미지(자체 그래픽으로 넣은 슬롯) 수 */
  readonly lost: number;
}

const list = (paths: readonly string[]) => paths.map((path) => `- ${path}`).join("\n");

function fontSection({ family, fonts }: LicensesInput): string {
  if (!family || fonts.length === 0) return "## 글꼴\n\n동봉한 글꼴 없음.";
  return [
    `## 글꼴 — ${family}`,
    list(fonts),
    "라이선스: SIL Open Font License 1.1 (Reserved Font Name 고지는 아래 저작권 문장을 따릅니다). 전문은 assets/fonts/OFL.txt에도 있습니다.",
    "```text\n" + fontLicenseText(family).trim() + "\n```",
  ].join("\n\n");
}

export function licensesMarkdown(input: LicensesInput): string {
  const { fonts, images, lost } = input;
  const files = 2 + fonts.length + (fonts.length > 0 ? 1 : 0) + images.length;
  return [
    "# LICENSES",
    `이 묶음은 파일 ${files}개입니다 — index.html · LICENSES.md · assets/.`,
    fontSection(input),
    ["## 이미지 — 사용자 업로드", images.length > 0 ? list(images) : "올린 이미지 없음.", "이 이미지는 사이트를 만든 사용자가 올린 것이며 권리는 올린 사람에게 있습니다. 생성 도구는 이 이미지에 권리를 주장하지 않습니다."].join("\n\n"),
    [
      "## 그래픽 — 자체 생성",
      "이미지가 없는 슬롯의 그래픽(인라인 SVG·CSS)은 생성 도구가 만든 것으로, 제약 없이 사용·수정할 수 있습니다.",
      ...(lost > 0 ? [`다시 골라야 하는 이미지 ${lost}장은 자체 그래픽으로 넣었습니다.`] : []),
    ].join("\n\n"),
    "## 코드·스타일\n\nindex.html 안 CSS·메뉴 스크립트는 생성 도구의 산출물로, 제약 없이 사용·수정할 수 있습니다. 서드파티 코드는 없습니다.",
  ].join("\n\n") + "\n";
}
