# M2A-1 렌더 기반 — PROGRESS

## 수신 기록
- 2026-10-03 수신: `docs/06-handoff/M2A-1_RENDER-BASE_BRIEF.md` 전체 읽음 · 시작 커밋 `72fe57f` (main merge m2a-briefs) · 브랜치 `k002bill2/m2a-1`
- 근거 읽음: ADR-004 개정 2 결정 1~5 · SPEC 5.7 r4.8 · S-B12 · E-AC-49 · Opus R2 B-1 ③ 1~8
- 규칙: 서브에이전트 금지 · 새 의존성/아이콘 0 · design/·docs/design/·docs/decisions/ 수정 금지 · navigate(replace) 금지 · 포트 4337 · 로컬 커밋 `git commit -- <경로>`만 · R1 `allow-same-origin` 필요 시 멈춤
- 게이트: `dev/active/m2a-1/gate.sh <로그> [표적]` (표적 + 가드 + typecheck + lint + build)

## 체크리스트
- [x] R0 기준선 — 번들 표 · 1280/390 스크린샷 · 캔버스 테스트 목록 (`R0-BASELINE.md`, 5d8e09a)
- [x] R1 샌드박스 PoC — dev · preview 둘 다 `ready` (allow-scripts만) — `logs/r1-poc.txt` · shots/r1-*.png. 필요 조건 = 서버 CORS `Access-Control-Allow-Origin: null`(vite.config server/preview.cors) → 정적 호스팅 요구사항. allow-same-origin 불필요
- [x] R2 번들 검사 스크립트 — 테스트 RED(391c1db) → GREEN(b023180)
- [x] R3 렌더 문서 본체 — import 가드 RED(be70e29) → 수신기 · 재검증 · 폴백(복사, 앱 캔버스는 R4까지 유지 = 이전 '전' 실측) · 표식
- [ ] R4 부모 호스트 · 오버레이 — 옮긴 단언 표
- [ ] R5 번들 실측(전후) · 브라우저 확인(E-AC-49) · r5 스크린샷
- [ ] R6 전체 vitest ×3 · Codex 1회 · REPORT

## 로그
- R0: gate r0-baseline 전부 exit 0 · /studio 91.72/124.31
- R1: CORS 전 dev ready:false → server/preview.cors ["null", 로컬 호스트] 뒤 dev·preview ready:true(origin "null", event.source = iframe). gate r1-green exit 0 · /studio 91.71/124.30 · 공통 89.31(react-dom이 공유 청크 client-*.js로 분리)
- R2: gate r2-green exit 0. 판정 = scripts/bundleBudget.mjs(순수), CLI는 dist 읽기·출력
- R3 1차 빌드(단일 빌드 두 엔트리): 공통 89.48(+0.17) · /catalog 99.89(+0.24) · /studio 91.97/125.31 → **build FAIL**. 원인 = react·jsx-runtime·rolldown 런타임·엔진 모듈이 공유 청크로 갈라져 청크 오버헤드. codeSplitting groups(client)로 react 계열을 묶어도 rolldown-runtime 분리 남음(공통 89.45, /studio 125.29)
- R3 결정: 렌더 문서를 **별도 빌드**(`vite build --mode render`, render-manifest.json) — 불투명 출처 iframe은 HTTP 캐시 파티션이 달라 공유 청크 이득이 없음. 번들 스크립트는 두 manifest를 합쳐 이름으로 판정. 앱 수치 R0와 같음(±0.01)
- R3 gate r3-green exit 0: 공통 89.34 · /studio 91.72/124.31 · **렌더 문서 JS 76.24 / CSS 4.60** (폴백 이전 '전' — 앱 캔버스 아직 앱에 있음) · 공유 0
