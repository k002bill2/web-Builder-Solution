# EXTRACT-THREAT REPORT r0

**결론: ★ 실행 위치 = (B) 사용자 PC 로컬 CLI(정적 fetch 우선·JS 끔) · 착수 전 Blocker 7건(BL-1~7).** 정본: `docs/security/extract/THREAT-MODEL.md`

## 고위험 위협 Top 5
1. **T09 추출값 경유 앱 CSS 주입/외부 요청** — [L1] 앱 2차 검증 `isCssValue`(`app/src/render/protocol.ts:70`)가 `url(`·함수 표기를 막지 않음 → 외부 값이 `--site-primary` 등으로 렌더 iframe·정적 HTML에 들어가면 추적 요청 가능. BL-4(외부 출처 팔레트 `^#[0-9a-f]{6}$`만).
2. **T01~T04 SSRF(사설·메타데이터·표기 우회·DNS 재바인딩)** — (A)에서 치명(클라우드 자격증명), (B)에서 사용자 LAN. 연결 IP 고정 + 모든 A/AAAA CIDR 판정 + IP 리터럴 거부. BL-2·BL-3.
3. **T14 남용(제3자 공격 프록시)** — (A) 고유. 우리 IP·평판·책임. ★(B)로 회피.
4. **T12 쿠키/자격증명 유출** — (C) 구조적(사용자 세션 탭), ADR-009 2절 2 "로그인 영역 금지"를 기술적으로 보장 불가.
5. **T06·T08 응답 폭탄·재귀 fetch** — 본문 2MB(해제 후)·압축비 20:1·하위 CSS 5개·`url()` fetch 0. BL-6.

## 산출물
- `docs/security/extract/THREAT-MODEL.md` r0 (1~6절 전부)
- SAMPLE-SPEC 반영 제안 S1~S11(6절, 직접 수정 안 함)

## 확인 필요
- [L3] OWASP SSRF Cheat Sheet·RFC 9309 4xx/5xx·PSL·메타데이터 주소 목록 원문 대조(구현 착수 시).
- [추정] 정적 fetch 모드의 추출 정확도(JS 렌더 사이트) — BL-1 해제 뒤 프로토타입 측정.
- `[Newton 결과 대기]`: 법무(BL-1)·프록시/아카이브 거부 목록 범위·추출 정밀도 상한·오픈 CLI 정책 우회 책임.

## 미수행·사유
- 서브에이전트 분할(BRIEF 권장): 미사용 — 외부 정지 15분 상한, 입력 620줄이라 메인 직접이 빨랐음.
- Codex 검증: 미실행 — 문서 전용 산출물·시간 상한. 필요 시 `node "$SCRIPT" adversarial-review --scope branch --base 1f773b07`.
