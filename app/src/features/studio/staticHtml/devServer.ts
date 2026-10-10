/**
 * dev 서버의 render.html에는 스타일시트 `<link>`가 없다(Vite가 CSS를 JS로 주입) — 킷 CSS를 읽지 못해 정적 HTML·PNG가 실패한다.
 * 결함이 아니라 환경이므로 실패 사유로 preview 확인을 안내한다(같은 오인 4회 반복 — m2a-3c·m2b-d1·m2c-reqa·2026-10-10).
 */
export const DEV_SERVER_UNSUPPORTED = "개발 서버에서는 스타일시트를 읽을 수 없습니다 — npm run build 후 vite preview에서 확인해 주세요";
