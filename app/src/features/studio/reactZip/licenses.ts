/**
 * React zip LICENSES.md (REACTZIP-SPEC 6절) — 고정 순서 · 결정적(시각·사용자·프로젝트 이름 0) · 브랜드 0. 1·2·4절 문안 = COPY.md 확정본(reactZipText) · 3·5·6·7절 = 현행 유지(COPY.md 결정).
 * 의존성 표 = 3.1 고정 · 하위 의존성 라이선스 개수 = lock과 함께 고정한 상수(생성 시점 계산 0 — template.test가 lock과 대조, RZ-AC-17).
 */
import { LICENSES_SITE_CODE, licensesHead, licensesTransitive } from "./reactZipText";

export interface DirectDep {
  readonly name: string;
  readonly version: string;
  readonly kind: "dependencies" | "devDependencies";
  readonly license: string;
  readonly url: string;
}
/** 3.1 버전 고정 9개(TR-SEC-06 의존성 허용 목록) */
export const DIRECT_DEPS: readonly DirectDep[] = [
  { name: "react", version: "19.3.0", kind: "dependencies", license: "MIT", url: "https://github.com/react/react" },
  { name: "react-dom", version: "19.3.0", kind: "dependencies", license: "MIT", url: "https://github.com/react/react" },
  { name: "vite", version: "8.3.1", kind: "devDependencies", license: "MIT", url: "https://github.com/vitejs/vite" },
  { name: "@vitejs/plugin-react", version: "6.1.1", kind: "devDependencies", license: "MIT", url: "https://github.com/vitejs/vite-plugin-react" },
  { name: "tailwindcss", version: "4.3.3", kind: "devDependencies", license: "MIT", url: "https://github.com/tailwindlabs/tailwindcss" },
  { name: "@tailwindcss/vite", version: "4.3.3", kind: "devDependencies", license: "MIT", url: "https://github.com/tailwindlabs/tailwindcss" },
  { name: "typescript", version: "6.0.3", kind: "devDependencies", license: "Apache-2.0", url: "https://github.com/microsoft/TypeScript" },
  { name: "@types/react", version: "19.3.0", kind: "devDependencies", license: "MIT", url: "https://github.com/DefinitelyTyped/DefinitelyTyped" },
  { name: "@types/react-dom", version: "19.3.0", kind: "devDependencies", license: "MIT", url: "https://github.com/DefinitelyTyped/DefinitelyTyped" },
];
/** lock(template/package-lock.json.tpl) 설치 항목 86개의 라이선스 종류별 개수 — lock을 갱신하면 같이 갱신(template.test 대조) */
export const LOCK_LICENSES: Readonly<Record<string, number>> = { MIT: 57, "Apache-2.0": 2, ISC: 2, "MPL-2.0": 24, "BSD-3-Clause": 1 };
/** 하위 의존성(직접 의존성 9개·루트 제외) 라이선스 종류별 개수 — LICENSES 4절 표(reactZipCopy.test가 lock과 대조) */
export const TRANSITIVE_LICENSES: Readonly<Record<string, number>> = Object.fromEntries(
  Object.entries(LOCK_LICENSES)
    .map(([license, n]) => [license, n - DIRECT_DEPS.filter((d) => d.license === license).length] as const)
    .filter(([, n]) => n > 0),
);

export interface ReactZipLicenseInput {
  /** zip 안 파일 수(LICENSES.md 포함) */
  readonly files: number;
  readonly family?: string;
  readonly fonts: readonly string[];
  readonly images: readonly string[];
  readonly lost: number;
}

export function reactZipLicenses({ files, family, fonts, images, lost }: ReactZipLicenseInput): string {
  const deps = DIRECT_DEPS.map((d) => `| ${d.name} | ${d.version} | ${d.kind} | ${d.license} | ${d.url} |`).join("\n");
  const table = ["| 라이선스 | 하위 패키지 수 |", "|---|---|", ...Object.entries(TRANSITIVE_LICENSES).map(([license, n]) => `| ${license} | ${n} |`)].join("\n");
  return [
    licensesHead(files),
    LICENSES_SITE_CODE,
    `## npm 직접 의존성\n\n| 패키지 | 버전 | 구분 | 라이선스 | 출처 |\n|---|---|---|---|---|\n${deps}\n`,
    licensesTransitive(table),
    family
      ? `## 글꼴\n\n${family} — ${fonts.join(", ")} · SIL Open Font License 1.1 · 전문: src/assets/fonts/OFL.txt\n\n이 글꼴은 서브셋입니다. 문구를 고치면 서브셋에 없는 글자는 대체 글꼴로 보일 수 있습니다.\n`
      : `## 글꼴\n\n동봉한 글꼴 없음\n`,
    images.length > 0 ? `## 이미지\n\n${images.map((name) => `- ${name}`).join("\n")}\n\n올린 이미지의 권리는 올린 사람에게 있습니다.\n` : `## 이미지\n\n올린 이미지 없음\n`,
    `## 그래픽\n\n이미지가 없는 슬롯의 그래픽(SVG·CSS)은 도구가 만든 것으로 제약 없이 사용·수정할 수 있습니다.${lost > 0 ? `\n\n다시 골라야 하는 이미지 ${lost}장은 자체 그래픽으로 넣었습니다.` : ""}\n`,
  ].join("\n");
}
