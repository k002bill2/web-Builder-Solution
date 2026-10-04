# M2B-1b 보완 — Popover 폴백·포커스 링 검증 공백 종결

- 영환님 ★A 승인: 2a 전에 별도 보완 레인. 390 nav 빈 값+utility 있음 보조 줄 위치는 현행(바 위) 유지, Jarvis가 SPEC-BOUND B-2 4절 결정 반영. Developer는 명세 수정 금지.
- 책임 Developer / 실행 Orca managed Claude Code(Opus medium) / 보고 Jarvis. 단일 레인 `m2b-1b-hardening`, 80턴, 60턴부터 REPORT 마감 우선. 서브에이전트 금지(429 이력).
- 저장소 /Users/younghwankang/Work/web-builder-solution. 원본 base 9e87308, 실제 worker 시작은 이 브리프·명세 결정 커밋 후 HEAD(기록할 것).
- 입력: dev/active/m2b-2r/REPORT.md 3·4.1·4.2·7절, docs/design/m2b/SPEC-BOUND.md B-1~3·KB-AC·B-2 4절, docs/design/m2a/SPEC.md 헤더 미지원 폴백·포커스 규약, dev/active/m2b-1b/{qb.mjs,judge.mjs,logs/qb-b.json}, app/src/kit/kit.css·headerParts.tsx·HeaderStickyRightCta.tsx.

## 목적·허용 범위
1. Popover 미지원 폴백 주장의 사실/추정을 분리하고, 필요한 경우에만 최소 CSS 수정으로 명시적 계약을 보장한다.
2. footer 실제 링크 표본을 넣어 포커스 링을 측정한다.
3. 링이 놓이는 바깥 면 대비를 수치로 판정한다.
4. 승인한 nav 빈 값+utility 있음 390 보조 줄 상태도 실제 브라우저에서 확인한다.
- 쓰기 허용: app/src/kit/kit.css, 관련 표적 테스트(예: popoverFallback.test.ts), 검증용 기존 app/src/render/testing/drawKit.tsx 필요 최소, dev/active/m2b-1b-hardening/ 기록·스크립트·로컬 사이트 표본·캡처. 기존 1b 증거 파일은 덮어쓰지 말고 복사해 개선한다.
- 쓰기 금지: docs/·design/·CLAUDE.md·package*.json/lock·엔진 계약·새 슬롯·새 변형. 킷 React state/event·추가 script·allow-same-origin·새 의존성·외부 사이트/이미지 요청 0.

## 체크포인트
### P0
- 먼저 dev/active/m2b-1b-hardening/PROGRESS.md 수신·REPORT 골격·gate.sh 커밋.
- app에서 npm ci 필요 시 설치(잠금파일 불변), baseline typecheck/lint/build 및 표적 테스트. 전체 suite 기준 1738개(현재 코드 unchanged, 정확 기준 재확인). 설치 실패는 환경 차단으로 보고.
### P1 폴백 진단·최소 수정
- Codex 주장은 :popover-open 미지원 시 selector list 전체 무효화와 충돌한다. 실제 미지원 브라우저를 확보하지 못하면 그 한계를 표시하고 현대 브라우저의 모의 무지원 재현을 실제 구형 UA 검증이라고 말하지 않는다.
- 허용 대안: 로컬 시험 문서에서 @supports selector(:popover-open) 분기를 무지원 경로로 강제하고 UA popover 기본 숨김도 모의하되, 운영 마크업은 그대로 두며 변환 내역·원본/모의 차이를 로그에 남긴다. 원본 CSS 구조 검사 + 강제 분기 동작 검증을 결합한다. 실제 엔진의 selector 무효화 의미를 단순 문자열 제거로 증명했다고 주장하지 않는다.
- header 기존 sticky-right-cta 포함 4변형, 1280·768·390. 미지원 상태에서 조작되지 않는 메뉴 버튼 숨김, 해당 메뉴 링크 접근 가능·불필요한 nav 중복0·넘침0. 미지원 보조 utility도 노출되어야 한다. 지원 상태에서 네이티브 메뉴 열기·Esc·앵커 닫기 기존 동작 유지.
- 명시적 @supports 지원/미지원 블록을 검사하는 RED 테스트부터 작성하고, 필요한 CSS만 수정해 GREEN. 현재 동작이 정상인 경우에도 구조 가드로 우연한 selector 무효화 의존을 방지할 수 있다. 신규 CSS 값/단위 규칙 그대로, SCRIPT 바이트 변경0. 기존 behavior 단언 약화0.
### P2 링 판정 보완
- 기존 qb.mjs를 이 레인 기록 경로로 복사. footer 3변형(기존 biz-extended도 회귀 포함 권장) links에 실제 문서 제목과 동일한 글자를 넣어 a[href]가 생겼음을 먼저 단언. 각 대상에 실제 a 수 및 링 측정 수>0. span만 있는 표본으로 PASS 금지.
- 실제 focus() 후 :focus-visible·outlineStyle·outlineWidth 확인. 링 바깥 면은 부모의 실제 불투명 면을 찾되, 복합 offset/shadow 링이면 구성 요소와 맞닿는 면을 따로 판정. 버튼 자신의 fill을 링 배경으로 오인하지 않는다.
- 색 역할 허용 규칙 + 실제 contrast ratio>=3 둘 다 검사. 부정 표본(의도적 같은 링/주변면 색)이 FAIL하는 RED 증거를 남긴다. 링 대상0·색 파싱 실패·focus 실패는 FAIL/미판정이지 PASS 아님.
- header4/footer4 × 3폭 × light/dark 통과 프로필, 관련 섹션 톤도 대조. script 생성·렌더 코드 수정 없이 판정 도구만 개선. 최솟값·측정 건수·실제 링크수·목록·허용밖 쌍을 로그로 남긴다.
### P3 390 예외 상태
- sticky-two-tier nav 빈 값 + utility 있음 390: 메뉴 버튼/시트 없음, 보조 줄은 바 위, DOM·시각 순서 일치, 넘침0. 캡처1장·계산 rect 증거. 이 위치는 승인된 정본이므로 구현 위치 변경0.
### P4 마감
- gate.sh: typecheck·lint·표적/가드 vitest·build. 전체 npx vitest run 1회 exit0/Errors0, 실제 추가 테스트 delta를 사전 예측하고 비교. 기존 skip/단언 약화0.
- 번들 baseline 렌더 JS81.13/CSS7.12, studio 진입127.40. 렌더 JS<=89.70/CSS<=30·studio 진입<=127.70 및 증가<=0.03·다른화면±0.03. 예산 초과면 상향 없이 정지.
- Codex review --scope branch --base <worker 시작SHA> 1회(Orca CODEX_HOME), 완료 결과 회수. P1/P2 모두 실질 영향으로 분류; 실결함이면 남겨 둔 채 통과 처리하지 않는다. 승인 만료·인증 실패 시 우회0.
- REPORT 1 커밋표, 2 폴백 증거(원본·모의·실제 UA 구분), 3 링 표본/ratio, 4 390 예외 상태, 5 번들/전체suite, 6 Codex, 7 한계/2a gate, 8 서버. 각 커밋에 PROGRESS·REPORT 동기화. 미지원 실제 UA 미확보는 한계로 유지.
- 포트127.0.0.1:4337(보조4339), 기존 main5480 무접촉. 자기 서버 cwd 확인 후 자기 PID만 종료, LISTEN0 증거. sandbox fullPage 금지, 캡처는 viewport. 재시도2회→Chrome headless 래퍼 실제폭.
- 로컬 git commit -- <명시경로>만. push·merge·삭제·다른서버 재시작0. 2a 자동기동0.

## 수용 기준
- 원래 Codex 폴백 주장의 재현 여부/한계가 분리되고, 폴백 계약이 명시 CSS+회귀 테스트로 보호됨. 지원 상태 회귀0.
- footer 실제 링크 링 측정0이 아님, 바깥면 대비3:1 실제 계산·실패검출 증거.
- 390 예외 상태 정본 대조 PASS.
- 전체suite exit0/Errors0, gate·예산PASS, Codex 결과·REPORT·서버정리 증거. 기동완료/검토완료/수정완료/실제UA검증은 별도 표시.
- Jarvis 회수 후 코드·추가테스트delta·전체suite3회·번들 확인。수정 뒤 독립 QA는 구현자와 분리된 Orca QA 레인에서 수행하며, 이 worker 자체 검증을 독립 QA라고 부르지 않는다.
