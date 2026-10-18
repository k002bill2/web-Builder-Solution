/**
 * LICENSES.md (M4-a SPEC 3절 · EXP-AC-10) — 정적 사이트(zip) 묶음의 권리 고지. 구조·필수 필드 + 고정 문안(M4-a-5 — Hemingway 문안, 영환님 승인).
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
  if (!family || fonts.length === 0) return "## 글꼴\n\n동봉한 글꼴 파일이 없습니다.";
  return [
    `## 글꼴 — ${family}`,
    list(fonts),
    "동봉한 글꼴에는 SIL Open Font License 1.1이 적용됩니다. 원본 글꼴과 수정 사항은 아래 고지를 참고하세요. 원본에서 글자 일부를 추리거나 파일 형식을 변환한 글꼴은 이 라이선스에서 수정본(Modified Version)으로 정의합니다. 예약 글꼴 이름(Reserved Font Name)은 아래 저작권 고지에 명시된 이름을 뜻합니다. 수정본에서 해당 이름을 사용자에게 표시되는 주된 글꼴 이름으로 사용하려면 해당 저작권자의 명시적인 서면 허가가 필요합니다. 라이선스 전문은 아래와 assets/fonts/OFL.txt에 있습니다.",
    "```text\n" + fontLicenseText(family).trim() + "\n```",
  ].join("\n\n");
}

export function licensesMarkdown(input: LicensesInput): string {
  const { fonts, images, lost } = input;
  const files = 2 + fonts.length + (fonts.length > 0 ? 1 : 0) + images.length;
  return [
    "# LICENSES",
    `이 묶음에는 사이트 파일(index.html), 권리·이용 조건 안내(LICENSES.md), 동봉 자산을 포함해 총 ${files}개 파일이 들어 있습니다.`,
    fontSection(input),
    ["## 이미지 — 사용자 업로드", images.length > 0 ? list(images) : "동봉한 사용자 업로드 이미지가 없습니다.", "이 절의 이미지 파일은 사이트를 만든 사용자가 업로드한 자료입니다. 이미지의 권리는 해당 권리자에게 있으며, 업로드한 사용자는 이용·배포에 필요한 권한을 확인해야 합니다. 생성 도구는 업로드한 이미지에 대한 권리를 주장하지 않습니다."].join("\n\n"),
    [
      "## 그래픽 — 자체 생성",
      "이미지가 없거나 누락된 자리에 표시되는 자체 그래픽(인라인 SVG·CSS)은 생성 도구의 산출물입니다. 생성 도구는 이 자체 그래픽에 대한 권리를 주장하지 않으며, 제약 없이 사용·수정할 수 있습니다.",
      ...(lost > 0 ? [`이미지 ${lost}장을 불러오지 못해 해당 자리에 자체 그래픽을 표시했습니다.`] : []),
    ].join("\n\n"),
    "## 코드·스타일\n\nindex.html 안의 CSS와 메뉴 스크립트는 생성 도구의 산출물입니다. 생성 도구는 이 코드·스타일에 대한 권리를 주장하지 않으며, 제약 없이 사용·수정할 수 있습니다. 이 코드·스타일에는 제3자 코드가 포함되어 있지 않습니다.",
  ].join("\n\n") + "\n";
}
