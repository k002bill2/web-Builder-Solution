// 썸네일 빌드 버전 상수 (ADR-004 개정 7 결정 1) — 고정 경로 `thumbs/{id}.svg?v=버전`의 캐시 무효화. 내용 해시 키 맵을 대신한다.
// 버전 = id 순 정렬한 (id, SVG) 전부의 sha256 앞 8자 → 어느 한 장·id·장 수가 바뀌어도 바뀐다. build-thumbs(산출)·check-bundle-size(dist 재해시) 공용.
import { createHash } from "node:crypto";

/** @param {ReadonlyArray<{ readonly id: string; readonly svg: string }>} thumbs */
export function thumbsVersion(thumbs) {
  if (thumbs.length === 0) throw new Error("[thumbs] 썸네일 0장 — 버전을 만들 수 없습니다");
  const hash = createHash("sha256");
  for (const { id, svg } of [...thumbs].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) hash.update(`${id}\n${svg}\n`);
  return hash.digest("hex").slice(0, 8);
}
