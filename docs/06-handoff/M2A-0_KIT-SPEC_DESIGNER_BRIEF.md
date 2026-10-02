# M2A-0 — VS-1 섹션 킷 명세: 실렌더 7변형 · 폴백 표식 · 내보내기 차단 문구 · PNG 버튼 (Designer)

- 책임 Designer / 실행 Orca + Claude Code(`--role designer`) · 보고 Jarvis · 포트 4339(127.0.0.1, 현재 화면 확인용) · `--max-turns` 80 · `--effort` medium · **65턴부터 REPORT 우선**
- 서브에이전트 분할: 불필요 — 429 이력으로 이 프로젝트는 금지 유지
- 대상 저장소: `/Users/younghwankang/Work/web-builder-solution` (레인 worktree) · 시작 커밋 = 이 브리프가 들어 있는 main
- 병렬 레인: **M2A-1 Developer**(렌더 기반, 쓰기 = `app/`·`dev/active/m2a-1/`) — 쓰기 경로가 겹치지 않는다.
- **산출물(쓰기 허용 경로는 이것만)**: `docs/design/m2a/SPEC.md` · `docs/design/m2a/shots/`·`logs/`(필요 시) · `dev/active/m2a-0/{PROGRESS,REPORT}.md`

## 목적
M2a(VS-1)에서 처음으로 **"실제 페이지"로 그려질 섹션 7변형**의 디자인 명세를 만든다. 이 명세가 M2A-2(Developer 킷 구현)의 입력이다. 함께 SPEC r4.8이 Designer에게 넘긴 항목(폴백 표식 · 차단 문구 · PNG 버튼)을 확정한다.

## 근거 (먼저 읽기 — 절·행 번호로 인용)
- `docs/06-handoff/REF-LLM-PIPELINE_BRIEF.md` D4(시안 등급 F0~F3 · F2 = MVP 최종 시안) · D6-3(7변형 · E2E 고정 조건) · D6-4
- `docs/00-research/buzz/claude-fable-r2.md` A-1(시안 등급) · A-4(VS-1 범위) · `docs/00-research/buzz/claude-opus-5.5-r2.md` B-1-9(**킷 상호작용 = 네이티브 HTML + 공용 바닐라 스크립트, React 상태 금지**) · B-1-9 문의 폼 · B-3(이미지 우선순위) · D-2(7변형 근거)
- `docs/design/2a-05/SPEC.md` r4.8: 5.7 · 5.13 · 8.3.2 · E-S27 · E-AC-48~50
- `docs/decisions/ADR-004-performance-budgets.md` 개정 2(렌더 문서 = 생성 홈페이지 예산 JS 90 · CSS 30KB) · `docs/03-trd/TRD.md` 8절(277행 성능 예산 · 폰트 ≤ 2계열) · TRD 4.4
- 데이터 계약: `app/src/engine/sections/boundSections.ts`(header·hero·footer 슬롯) · `app/src/engine/sections/bodySections.ts`(about·services·faq·contact 슬롯) · `app/src/domain/profile.ts`·`compareBoard.ts`(프로필 입력: 팔레트 5역할 `primary·surface·ink·muted·bg` · 글꼴 · 밀도 · 모션) · `app/src/features/studio/canvasLayouts.ts`(지금 와이어프레임 모양 — 비교 기준)
- 디자인 언어 기준: 목업 `design/claude-design-handoff-v2/project/Design Studio v2.dc.html` 2a-05 편집기 캔버스(228~282행) — **화면 구조·위계의 참고일 뿐 px 값은 기준이 아니다**(ADR-003)

## 범위

### K1. 실렌더 7변형 명세 (각 변형 1절)
대상: `header/sticky-right-cta` · `hero/fullbleed-left` · `about/story` · `services/cards-3` · `faq/accordion` · `contact/form` · `footer/biz-extended`.

각 변형에 다음을 적는다.
1. **구조**: 의미 요소(`header`·`nav`·`section`·`h1~h3`·`ul`·`details` 등)와 슬롯 배치. 슬롯 키는 엔진 정의 그대로(새 슬롯 0 — 엔진 계약 변경 금지).
2. **반응형**: 최소 1280 · 390 두 폭(1024는 둘 사이 규칙으로). 열 수·순서·접힘(예: header 메뉴 → 모바일 메뉴).
3. **토큰 대응**: 면·글자·강조·경계가 프로필 팔레트 5역할 중 무엇인지, 타입 스케일 단계, 간격·radius 단계. **값(hex·px)이 아니라 역할·단계로** 적는다. 대비: 각 글자/면 조합이 어느 대비 검사 대상인지(게이트 "대비 AA" 7절).
4. **빈 슬롯·긴 글자**: 선택 슬롯이 비었을 때 모양 · 권장 글자 수를 넘을 때(말줄임 금지 여부 포함).
5. **이미지 슬롯**: VS-1 = 토큰 그라디언트 1종(자체 그래픽 최소안, Fable A-4) · 사용자 로컬 이미지가 있으면 그 이미지. 비율·`alt` 처리.
6. **상호작용**: 네이티브 HTML만(B-1-9). `faq/accordion` = `<details>/<summary>` · header 모바일 메뉴 = `popover` 또는 `details`(선택하고 근거) · **React 상태로 만드는 상호작용 0**.
7. **모션**: VS-1은 모션 없음(M2b). `prefers-reduced-motion`과 충돌 없는 정적 상태만 명세.

### K2. `contact/form`의 정적 내보내기 동작 (결정 제안)
정적 HTML에는 보낼 곳이 없다(Opus B-1-9). **"비활성 폼 + 안내 문구"(권장)** vs "사용자 지정 수신 엔드포인트" 비교 → 권장안 1개 + 안내 문구 초안. 엔드포인트 안은 Security 검토가 필요하다고 표시만 한다.

### K3. SPEC r4.8이 넘긴 항목 확정
1. **폴백 표식 "구조 미리보기"**(5.7): 위치·글자·토큰. 캔버스와 PNG 둘 다에서 읽혀야 한다.
2. **내보내기 차단 문구**(5.13 · E-S27 r4.8 초안): 버튼 이유 문장 · 링크 문구 · 게이트 차단과 함께일 때 순서 표시.
3. **PNG 버튼**(5.13 r4.8): 위치(게이트 영역 아래 내보내기 버튼들과의 관계) · 문구 · 파일 이름 규칙(예: 프로젝트 이름 + 폭 + revision — 개인정보·사용자 글자 규칙 9절 확인) · 진행·실패 상태.
4. **캔버스 캡션 등급 표시**: 지금 캡션(`StructureCanvas.tsx` `CANVAS_CAPTION`)을 시안 등급(F0 구조 미리보기 / F1 실렌더) 표시로 바꾸는 문구 — 일부만 실렌더인 문서 포함.

### K4. 수용 기준 · 시각 QA 기준
- 명세별 수용 기준 `K-AC-NN`(Developer 테스트로 옮길 수 있게 관찰 가능한 문장으로).
- M2a 시각 QA 때 Designer가 볼 대조 항목(1280·390 스크린샷 기준).

## 제외
- 나머지 23변형 · 모션 프리셋 · 폰트 자체 호스팅 · 자체 그래픽 생성기 본편(M2b·M2c) · 앱 화면(편집기 패널·툴바) 재설계 · 코드 작성.

## 규칙
- 판단 순서 ADR-003: 기능·흐름 → 사용성(접근성·반응형·성능) → 디자인 시스템 일관성 → 목업.
- **브랜드 (ADR-002)**: 킷은 **사용자 사이트**의 디자인이다. 앱 브랜드·APFS 명칭·`--apfs-*` 금지. 앱 DS 토큰과 킷 토큰(사용자 프로필)을 섞지 않는다.
- **권리 (PRD 원칙 2·4)**: 외부 사이트 이미지·문구·구체 수치를 가져오지 않는다. GDWEB·dbcut 등 레퍼런스의 특정 사이트 재현 금지.
- 예산 감각: 렌더 문서 JS 90 · CSS 30KB 안(ADR-004 개정 2) — 무거운 장식(대형 SVG·웹폰트 추가)은 명세에 넣지 않는다.
- 대비 값은 계산 근거를 남긴다(기존 `contrast_calc.py` 방식 등, L2 표기).
- `app/`·`design/`·다른 `docs/` 수정 금지. fable 무접촉. 커밋은 `git commit -- <경로>`. 로컬 커밋만, push·병합·삭제 금지. 서버는 127.0.0.1:4339·자기 PID만.
- 마지막에 Codex 적대적 검토 1회(턴 남을 때) — 원문은 `docs/design/m2a/logs/`.
- PROGRESS: `dev/active/m2a-0/PROGRESS.md`(시작 시 수신 기록, K1 변형마다 갱신). REPORT: `dev/active/m2a-0/REPORT.md` — 산출물 목록 · K2 권장안 · 미결 질문(`MQ-N`) · 목업과 다르게 한 곳 · 남은 위험.

## 수용 기준
1. 7변형 모두 K1의 1~7 항목이 채워져 있다(빈 항목 0, 해당 없음은 사유).
2. 모든 색·크기가 역할·단계로 적혀 있다(hex·px 0, 대비 계산 근거 제외).
3. 상호작용 명세에 React 상태 의존 0.
4. K2 권장안 1개 · K3 4항목 확정 문구 · K-AC 목록.

## 확정
- REF-LLM 브리프 D4·D6 · SPEC r4.8 · 영환님 2026-10-03 "★A, 확인 1~3 승인".
