# CSP-SPEC BRIEF — 내보낸 HTML·zip 고정 CSP 명세 (Designer, 명세만)

책임 역할: Designer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (자동 진행 — BACKLOG B-SEC-04 Medium "SPEC 개정 후 구현")
base origin/main `2531ebf8`. 정본: `dev/active/sec-readproject/REPORT.md` 4절(CSP 권고안·메뉴 스크립트 sha256) · `docs/design/m4a/EXPORT-SPEC.md` r1 · `docs/design/m4b/REACTZIP-SPEC.md` r1.

## 산출: `docs/design/csp/CSP-SPEC.md`
1. 형식별 정책(정적 HTML 1개 · 정적 zip `index.html` · React zip `index.html`/빌드 산출물) — 지시어 표·근거(쓰는 리소스 목록).
2. 메뉴 스크립트 해시: 상수 옆 고정 + 대조 테스트(런타임 계산 금지). 대안(popover 버튼으로 스크립트 제거) 비교.
3. 렌더 결과 불변 계약(정규화 DOM·스크린샷) · React zip은 Vite 빌드 산출물 해시 처리 방안(meta 위치·dev 서버 영향).
4. 수용 기준 CSP-AC-xx · 테스트 계획 · 예산 영향(생성기 청크 안, 진입 0).
5. 설계 질문 CQ-xx(★). 예산 상향·엔진 계약·새 의존성·백엔드만 사용자 질의로 분리.
## 규칙
- 명세만 — 앱 코드 0, 외부 리서치 0. Codex adversarial 1회(`--help` 금지). **git push·pull·fetch 등 원격 명령 일절 금지.** 첫 2턴 BRIEF·PROGRESS 커밋, SPEC 초안 12턴 안. 마감 전 `git status --short` 빈 값. 최대 45턴, 36턴부터 마감.
