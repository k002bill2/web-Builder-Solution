# M2C-2 Developer 브리프 — 렌더 쪽(자체 그래픽 SVG·이미지 프로토콜·decode 대기·원본 비율) + 예산 가드

- 역할 Developer / Orca managed Claude Code / worktree m2c-2 / base `c870439`(M2c 명세 병합, MQ-C1~C8 전부 ★A).
- 정본: `docs/design/m2c/SPEC.md` 3절(`{blob,width,height}`)·4절(결정적 SVG, C6-A 빈 슬롯 전부·스위치 꺼짐 = 미디어 없음)·5.3(eager+decode 대기)·7절 예산·8절 IMG-AC-17~22·26b(렌더 쪽)·29·10절, `docs/04-plan/M2C_PLAN.md` 1~3절, MQ-M2C.md.
- 병렬 레인: M2C-1(`app/src/features/studio/images/ingest/**`) — 그 경로 수정 금지.

## 순서
1. **맨 먼저 예산 검사기 개정**(`app/scripts/**`): 시작 실측을 M2c 기준선 파일로 고정 + `/studio` 진입 기준선+0.03·렌더 JS 89.70 초과 시 실패 조건. 한도 값 자체 상향 0. 개정 전후 판정 동작을 테스트로.
2. 프로토콜 `images` 모양 `{blob,width,height}` + `loading:"eager"` (`render/protocol.ts`) **+ 부모 송신부 타입 이전**(`StructureCanvas.tsx` images prop 타입·관련 테스트만; 보관소 연결은 M2C-3). 이 레인 단독 typecheck 통과 필수.
3. 결정적 SVG 자체 그래픽(토큰 색·도형 3계열·같은 입력 같은 출력·외부 자산 0·aria-hidden), masonry 원본 비율, map `contain`, decode 대기.

## 규칙
- 렌더 JS ≤89.70(SPEC 추정 +1~1.5KB), CSS ≤30, `/studio` 진입 기준선 +0.03. 넘을 전망이면 구현 전 멈춤 보고(상향 요청 금지).
- 깨지는 테스트는 SPEC 10절 목록 안에서만 기대값 개정 — 밖이면 멈춤. 시각 회귀 기준선 재생성은 M2C-5(여기선 변경 사실만 기록).
- sandbox `allow-scripts`만, 4a 폰트·4b 모션·M2B-5 비교·D-1 PNG 결정성 동작 불변.
- TDD: 단계별 RED 전 새 테스트 수 예측 커밋, RED 로그 `dev/active/m2c-2/logs/`. 단언 약화·skip 0. BRIEF P0 명시 커밋.
- SPEC r2 정정 2문장(4절 스위치 꺼짐·대비 문장)은 Codex 미검토 — 구현 Codex에서 함께 확인.
- 새 의존성 0, package*.json/lock·CLAUDE.md·docs/design·docs/decisions 수정 0. 서브에이전트 0, 4337/4339 loopback·자기 PID 종료, main 5480 무접촉, push/merge/삭제 0, 승인 실패 우회 금지.
- 마감: typecheck·lint·build·전체 vitest 기본 1회 exit0, Codex review --scope branch --base c870439 실제 완료(≤2라운드), REPORT(IMG-AC↔테스트·번들 전후·meta·한계). 70턴부터 마감 우선.
