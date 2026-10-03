/**
 * 내려받기 object URL 장부 (M2A-3b G3) — 내보내기 청크(exportFlow)가 적고 결과 청크(ExportAfter DownloadLink)가 편집기 이탈 때 해제한다.
 * exportFlow에서 떼어 둔 것은 결과 청크가 exportFlow를 정적 import하지 않게 하기 위해서다 — 첫 exportFlow 로드가 실패한 브라우저는
 * 그 URL을 기억해, 재시도(retryableImport ?retry=N)로 복구해도 원래 URL을 import하는 결과 청크까지 거부한다(M2A-3a Codex P2-1 r3).
 */
const made = new Set<string>();

export const rememberDownload = (href: string) => void made.add(href);

/** 편집기 이탈 — 내려받기 object URL 해제. 돌아와 같은 revision을 다시 요청하면 같은 잡(멱등)이라 링크가 죽는다(M2A-3b REPORT 9절) */
export function releaseDownloads() {
  for (const href of made) URL.revokeObjectURL(href);
  made.clear();
}
