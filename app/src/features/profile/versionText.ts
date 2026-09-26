/** 버전 번호 + 조사 ("v1을"·"v2를"·"v3이"·"v1과") — 숫자 끝 발음이 이·사·오·구(2·4·5·9)면 받침 없음, 0은 영·십·백·천·만 모두 받침 */
export function versionWith(version: number, [final, open]: readonly [string, string]): string {
  return `v${version}${[2, 4, 5, 9].includes(version % 10) ? open : final}`;
}

/** "방금" · "12분 전" · "3시간 전" · "2일 전" — `<time datetime>`의 보이는 글자 */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000);
  if (!(minutes >= 1)) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}시간 전` : `${Math.floor(hours / 24)}일 전`;
}
