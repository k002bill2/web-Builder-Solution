# EXTRACT-THREAT BRIEF — 경로 B(외부 URL 디자인 추출) 위협 모델 r0 (Security)

책임 역할: Security / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-25 (영환님 "★")
worktree `~/orca/workspaces/web-builder-solution/extract-threat` · 브랜치 `k002bill2/extract-threat` · base `k002bill2/sample-spec` `1f773b07`(SAMPLE-SPEC r0 포함).
쓰기 경로 = `docs/security/extract/` + `dev/active/extract-threat/`만. **앱 코드·테스트·PRD·TRD·ADR·BACKLOG·docs/design 수정 금지.** 읽기 전용 설계 검토다 — 능동 스캔·외부 사이트 요청·코드 실행 0.

## 0. 입력 (먼저 읽기)
- `docs/decisions/ADR-009-sample-extraction-only.md` 2절(경로 B 게이트 1~5)
- `docs/design/sample/SAMPLE-SPEC.md` 4절(경로 B 흐름·상태) · 5절 SMP-AC-B01~B09 · 6절 MQ-SMP-05(실행 위치 — ★C 보류: 이 레인 결과로 결정)
- `docs/03-trd/TRD.md` L238(`external_observed` 조건) · TR-POL-02 · TR-SEC-* 
- 선례 형식: `docs/design/persistence/THREATS.md`
- 법무(저작권·약관)는 Newton 병렬 조사 중 — 이 레인은 판단하지 않고 `[Newton 결과 대기]`로 표기.

## 1. 산출물 — `docs/security/extract/THREAT-MODEL.md` r0
1. **실행 위치 후보 3개를 같은 틀로 비교**: (A) 서버 fetch 서비스(신규 백엔드 — ADR-007 P7 발동) (B) 사용자 PC 로컬 헤드리스 도구/CLI (C) 브라우저 확장(사용자 브라우저 컨텍스트). 각각 신뢰 경계·데이터 흐름(DFD 텍스트)·공격 표면·운영 비용.
2. **위협 목록(STRIDE 기준)**, 최소 포함: SSRF(사설·루프백·링크로컬·클라우드 메타데이터 IP, DNS 재바인딩, 리디렉션 체인, IPv6·10진수 IP 표기 우회) · 응답 폭탄(크기·시간·압축·무한 스트림) · 악성 HTML/CSS/폰트 파싱(파서 취약점, CSS `@import`/`url()` 재귀 fetch) · 추출 결과를 통한 앱 XSS/CSS 주입(색·글꼴 이름 값이 앱 렌더 iframe·토큰 파일로 흘러감 — `design-tokens.json` 신뢰 경계) · 헤드리스 브라우저 샌드박스 탈출·JS 실행 · 쿠키/자격증명 유출(사용자 세션으로 fetch되는 경우 — 특히 (C)) · 남용(우리 도구가 제3자 사이트 공격 프록시가 됨, 레이트 리밋) · 개인정보(페이지 내 PII를 저장하지 않음 보장) · GDWEB/dbcut 차단 우회.
3. **위협별 완화책 + 검증 방법**(단위 테스트·고정 픽스처·계약 테스트로 확인 가능한 형태). Zero Trust·Defense in Depth·Least Privilege·Fail-Secure 기준.
4. **추출 결과 정규화 계약**: 외부에서 온 값이 토큰이 되기 전 허용 형식(색 = 정규화된 hex/rgb만, 글꼴 = 허용 문자 집합·길이 상한, 간격 = 숫자 범위, 섹션 태그 = 고정 열거)과 거부 규칙. SAMPLE-SPEC 2.1 스키마 키 기준.
5. **★ 실행 위치 권고**(MQ-SMP-05 입력): 후보별 잔여 위험 등급 + ★ 1개 + 근거. 착수 전 차단 조건(Blocker) 목록.
6. SAMPLE-SPEC에 반영할 수정 제안(파일:절 단위, 직접 수정 금지 — 목록만).

## 2. 근거 표기
[L1] 저장소 직접 확인(파일:줄) · [L3] 외부 일반 지식(확인 필요, 예: OWASP SSRF Cheat Sheet) · [추정]. 독립 실행형 exploit PoC는 작성하지 않는다.

## 3. 마감
- `dev/active/extract-threat/PROGRESS.md` 1~6 체크리스트, 항목마다 갱신·커밋.
- `dev/active/extract-threat/REPORT.md`: 첫 줄 결론(★ 실행 위치 + Blocker 수), 고위험 위협 Top 5, 확인 필요.
- `git status --short` 빈 값. 경로 명시 커밋.

## 4. 규칙
- **git push·pull·fetch 등 원격 명령 일절 금지.** amend·rebase 금지. 네트워크로 외부 사이트 요청 금지.
- 서브에이전트 분할: 권장(1 실행 위치 3안 조사 ∥ 2 위협 목록 초안 — 읽기 전용 2개). 통합·완화책·권고는 메인이 직접.
- 실행 상한 약 20분. 1→6 순서, 항목마다 커밋. 남으면 REPORT에 미완 표기로 마감. 최대 60턴.
