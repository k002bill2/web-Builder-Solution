# M2B-3 Designer 브리프 — 모션 프리셋 L0~L2 · reduced-motion · 폰트 2계열 서브셋 결정

- 역할 Designer / Orca managed Claude Code / worktree m2b-3 / base `0bede09`(실렌더 30/30, origin 반영).
- 영환님 결정 ★A(2026-10-05): **폰트 파일은 원본 OFL 서브셋 woff2 + 라이선스 파일을 저장소에 커밋**하는 방식. npm 폰트 패키지 의존성 추가 없음. 이 레인은 **명세·결정 문서만**, 폰트 바이너리·코드 추가는 M2B-4 Developer.

## 목적
M2B-4가 추측 없이 구현할 수 있도록 모션 프리셋과 폰트 서브셋 규칙을 확정한다. 기능·접근성·예산이 우선이며 목업 모양 복제가 목적이 아니다.

## 입력 (먼저 읽기)
- `docs/04-plan/M2B_PLAN.md`(범위·M2B-3/4 분할·결정 2), TRD 8절(폰트 ≤ 2계열·내보낸 사이트 예산), TR-POL-04 루브릭.
- `docs/decisions/ADR-005-compare-board-decisions.md` D1-갱신, `docs/00-research/FONT_LICENSE_CHECK.md`(3종 OFL 1.1, 서브셋=수정본 → RFN 이름 사용 금지: Pretendard RFN `Pretendard`·`Source`·`Inter`·`M PLUS 1`, Noto Sans KR RFN `Source`).
- `app/src/domain/fonts.ts`(허용 3종 Pretendard·Noto Sans KR·Noto Serif KR), `docs/decisions/ADR-004-performance-budgets.md` 개정4, `docs/design/m2b/SPEC-BOUND.md`·`SPEC-BODY.md`의 각 변형 "모션 후보 요소", `app/src/kit/kit.css`·`render/`(현재 정적·고정 메뉴 script 1개).

## 산출물 (쓰기 허용: `docs/design/m2b/`, `dev/active/m2b-3/`만)
1. `docs/design/m2b/SPEC-MOTION-FONT.md`
   - **모션 L0~L2**: L0=모션 0, L1/L2 정의. 30변형별 대상 요소·속성(transform/opacity만 원칙)·지속시간·이징을 토큰 이름으로. **CSS만**(JS 0, scroll 연동 JS 0, 고정 메뉴 script 바이트 불변 유지 전제), `prefers-reduced-motion: reduce` → L0와 동등. 첫 그리기·PNG 캡처·정적 HTML에서 최종 상태가 보장되는 규칙(애니메이션 미완 캡처 방지). 사용자 선택 위치(프로필 값인지)와 기본값.
   - **폰트**: 허용 3종 중 ≤2계열 조합 규칙, 프로필이 고르지 않은 폰트를 실을 때/폴백 스택. 굵기 수(최소화), 서브셋 문자 범위(한글 완성형 2,350자 vs 11,172자·Latin·숫자·기호 등 후보별 크기 추정과 추천안·근거), woff2, `font-display`, 앱 미리보기 vs 내보낸 사이트에서 파일 위치·로드 방식. **RFN 준수 방법**(서브셋 파일 패밀리 이름 규칙, OFL·저작권 고지 동봉 경로).
   - 원본 출처(공식 배포 URL·버전 고정 방식·체크섬 기록), 생성 도구는 **저장소 밖**에서만 쓰고 재현 명령을 문서화(신규 의존성 0).
   - 예산: 렌더 JS/CSS 영향(ADR-004 개정4 멈춤선 89.70/30), 폰트 파일은 JS 예산 밖이지만 내보낸 사이트 폰트 예산 기준값 제안. 수치 근거가 추정이면 추정 표기.
   - **수용 기준(MF-AC)·QB 목록**: M2B-4/M2B-6이 검증할 [U]/[G]/[B] 형식. 첫 그리기, reduced-motion, 3폭, 200% 글자, PNG/정적 HTML 동등, 라이선스 파일 존재, RFN 준수.
2. `docs/design/m2b/MQ-M2B3.md`(필요 시): 영환님 결정이 필요한 항목만 번호 선택지(추천 ★)로. 추정·미확인 구분.
3. `dev/active/m2b-3/{PROGRESS.md,REPORT.md}`.

## 금지
- 코드·폰트 바이너리·package*.json/lock·CLAUDE.md·`docs/decisions/` 수정, 네트워크로 폰트 내려받기·서브셋 실행(측정이 필요하면 공개 수치 인용 + 추정 표기, 실측은 M2B-4).
- 외부 사이트 크롤링·GDWEB/dbcut 접속, APFS 브랜드 요소, 모션 JS·스크롤 연동·자동 재생 무한 반복.
- 서브에이전트 0, 서버 기동 불필요(필요 시 4337/4339 loopback·자기 PID 종료), main 5480 무접촉, push/merge/삭제 0.

## 마감
- 단계별 PROGRESS 갱신·명시 경로 커밋. 50턴부터 REPORT 마감 우선.
- REPORT: 실제 산출 경로·결정 요약·MQ 목록·추정/확인 구분·남은 위험·책임 역할/실행 환경(한국어).
