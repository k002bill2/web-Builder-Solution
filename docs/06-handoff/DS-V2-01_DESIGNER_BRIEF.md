# Designer 핸드오프 — DS-V2-01: 디자인 v2 전환 설계

- 작성: Jarvis · 2026-09-26 KST · 근거 결정: `docs/decisions/ADR-006-adopt-design-v2.md`
- 책임 역할: Designer / 실행 환경: Orca + Claude Code (`--role designer`) · 작업 공간 `ds-v2-01`(main 기준)
- 성격: **설계 문서만.** `app/`·`design/` 수정 금지. 산출물은 `docs/design/v2/`에만 로컬 커밋, push 금지
- 턴 예산 **80** · 단계마다 `docs/design/v2/PROGRESS.md` 갱신·로컬 커밋 · **65턴을 넘기면 새 작업을 멈추고 SPEC을 먼저 커밋**

## 0. 읽기 순서
1. `CLAUDE.md`, ADR-002·003·004·005·006
2. v2 원본: `design/claude-design-handoff-v2/README.md` → `project/Design Studio v2.dc.html`(2a-01~07) → `project/_ds/*/_ds_bundle.css`(토큰 `:root`·`.dark` 블록 위주. JS 번들은 잘려 있으니 참고만)
3. v1 원본: `design/claude-design-handoff/project/Design Studio Mockups.dc.html`(1a) — 차이 비교용
4. 현재 구현: `app/src/styles/tokens/*.css`, `app/src/components/ds/*`, `app/src/pages/*`, `app/src/components/**`
5. 기존 설계: `docs/design/1a-03/SPEC.md`(비교 보드), `docs/design/a11y-01/SPEC.md`(대비 방법·배경 집합·`contrast_calc.py`), `docs/qa/1a-03/REPORT.md`

## 1. 과제
1. **v1 → v2 차이표**: 화면별(2a-01~07) 구조·정보 위계·컴포넌트·상태 변화. v2에서 빠진 것(1b 전체, 사이드 필터 레일, 카드 보더, 큰 비교 트레이 등)과 새로 생긴 것(한 줄 칩 필터, 플로팅 비교 필, 52px 헤더 등)
2. **토큰 매핑**: v2 DS 토큰(`--primary`, `--muted`, `--card`, `--bg`, `--bg-deep`, `--border(-strong)`, `--caption`, `--foreground`, `--muted-foreground`, 상태색, 그림자, 반경, 타이포 `t-*`)을 **우리 토큰 이름**(`app/src/styles/tokens/`)에 어떻게 옮길지 표로. 라이트/다크 모두. 쓰지 않는 토큰(차트 20색 등)은 제외 사유. `apfs` 이름 금지(ADR-002). 브랜드 색 위치는 `brand.css` 유지
3. **대비 재계산 (A11Y-01 방법 재사용)**: 매핑한 글자·상태 토큰을 A11Y-01 SPEC 1절 배경 집합(v2 표면으로 갱신)에서 계산. 4.5:1(본문)·3:1(UI) 미달이면 보정값 제시(0.1 이상 여유). v2 목업 자체의 미달 값(예: `--caption` 계열)도 명시. A11Y-01의 새 토큰 제안(역상 면 글자, 오류 글자 전용 토큰, D-QA04·06 문구)을 v2에 맞게 이어받을지 결정
4. **구현 화면 영향 분석** — 1a-01 카탈로그, 1a-02 상세, 1a-03 비교 보드:
   - 유지할 기능(URL 동기화 필터, 6개 제한, 자동 저장, v1/v2 확정, 반응형 3단, 접근성 A-1~A-12 등)이 v2 레이아웃에서 어떻게 들어가는지
   - v2 목업이 기능 결정과 충돌하는 곳(예: 칩 한 줄 필터에 필터 그룹이 다 들어가는지, 플로팅 필이 트레이 기능·포커스 이동 D07을 유지하는지, 비교 보드 v2 표 구조 vs SPEC 1a-03)과 결정(ADR-003 우선순위)
   - 번들 영향(`/compare` 99.98KB 여유 0.02KB) — 번들 증가 없는 방식 제안
5. **단계 구현 계획**: Developer 작업 단위로 쪼갠 순서(예: V2-1 토큰·DS 컴포넌트 → V2-2 앱 셸(52px 헤더)·카탈로그 → V2-3 상세 → V2-4 비교 보드 → 이후 2a-04~07은 신규 화면 설계로 별도). 단계별 수용 기준(AC ID), 깨질 기존 테스트 예상
6. **설계 질문**: 영환님 결정이 필요한 것만 (번호·추천안 포함)

## 2. 금지·제약
- 목업 px 복제 금지(ADR-003). 구조·위계·톤 기준
- 외부 폰트 URL·CDN 금지(자체 호스팅). 외부 이미지·캡처 금지
- 원본 `_ds_bundle.css`를 앱에 통째로 넣는 설계 금지(ADR-006 결정 3)

## 3. 산출물
- `docs/design/v2/SPEC.md` — 1~6 전부, 수용 기준 표
- `docs/design/v2/PROGRESS.md`
- 필요 시 계산 스크립트(`docs/design/v2/contrast_calc_v2.py`, A11Y-01 스크립트 재사용 가능)

## 4. 마지막 응답
SPEC 요약(차이 핵심, 토큰 매핑 수, 대비 미달·보정, 충돌·결정, 단계 계획, AC 수, 설계 질문)과 커밋 해시
