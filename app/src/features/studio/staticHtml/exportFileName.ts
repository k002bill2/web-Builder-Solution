/**
 * 내보내기 파일 이름 (m2a 3.3 K-AC-32) — 프로젝트 이름 정리값. 사용자 기기에 저장되는 이름일 뿐 계측·전송에 넣지 않는다.
 * NFC → 금지 문자·제어 문자·연속 공백을 `-` → 연속 `-` 하나 → 앞뒤 `.`·`-`·공백 제거 → 40 코드 포인트 → 비면 page → Windows 예약 이름이면 `page-` 앞에.
 */
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

export function exportFileStem(name: string): string {
  const cleaned = name
    .normalize("NFC")
    // eslint-disable-next-line no-control-regex -- 제어 문자 제거가 규칙이다
    .replace(/[\\/:*?"<>|\u0000-\u001f\u007f]|\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.\-\s]+|[.\-\s]+$/g, "");
  const cut = [...cleaned].slice(0, 40).join("").replace(/^[.\-\s]+|[.\-\s]+$/g, "");
  const stem = cut || "page";
  return RESERVED.test(stem) ? `page-${stem}` : stem;
}

/** 정적 HTML판 — 폭 표기 없음(REPORT 8절): `<이름>_r<revision>.html` */
export const staticHtmlFileName = (projectName: string, revision: number) => `${exportFileStem(projectName)}_r${revision}.html`;
