# M2C-3 Developer 브리프 — 이미지 슬롯 UI · 탭 메모리 보관소 · 캔버스 연결

- 역할 Developer / Orca managed Claude Code / worktree m2c-3 / base `d25fe49`(M2C-1 변환기 + M2C-2 렌더 쪽 병합). 결합 기준선(Jarvis 새 실행): typecheck·lint·build exit0, vitest 221파일 1978 ×3, `/studio` 진입 127.36 · 첫 91.79 · `/profile` 첫 99.62 · 렌더 JS 84.19 / CSS 8.80. `app/node_modules`는 lock 그대로 `npm ci` 완료.
- 정본: `docs/design/m2c/SPEC.md` 2절(2.1 진입 버튼 + lazy 패널 배치 · 2.2 슬롯 라벨 · 2.3~2.6 변환·보관·원본 미보관)·3절·6절·7절 예산·8절 IMG-AC-08·09·11~16·10절, `docs/04-plan/M2C_PLAN.md` 1~3절, `docs/design/m2c/MQ-M2C.md`(C1-A 10MB·40MP · C2-A 탭 메모리 · C4-A 메타는 보관소+렌더 메시지 · 문서 계약 변경 0), 2a-05 SPEC 5.9(슬롯 UI 원안 — SPEC m2c와 다르면 m2c 우선).
- 재사용: `features/studio/images/ingest/`의 `ingestImage`(M2C-1 공개 API 그대로), `render/protocol.ts` images `{blob,width,height}`(M2C-2) · `StructureCanvas` images prop.

## 범위
- 쓰기: `app/src/components/studio/**` · `app/src/features/studio/images/store/**`(신규) · 필요 시 `app/src/data/**` · `dev/active/m2c-3/`.
- 편집기 이미지 슬롯 "[이미지 편집]" 진입 버튼(진입 청크에는 버튼만) → `ImageSlotPanel` lazy 청크(파일 선택·검증 실패 문구·진행 상태·대체텍스트/장식 표시·제거).
- 보관소: 탭 메모리, 문서가 참조하는 id 집합 밖 항목 해제(objectURL revoke 포함), 한도 규칙(SPEC 기준), 새로고침 시 잃은 이미지 = 자체 그래픽 + 안내.
- 캔버스 연결: 보관소 → `StructureCanvas` images. 정적 HTML·PNG 송신(M2C-4)과 부모의 IMAGE_DECODE_FAILED 수신(readRenderMessage 원본 + compareFrame 사본 동시 개정 — M2C-4 이월)은 **이 레인 범위 밖**.

## 규칙
- **예산 멈춤**: 레인 시작 때 시제품으로 build 실측. `/studio` 진입 기준선 파일(127.36+0.03=127.39) 또는 `/studio` 첫 화면·다른 라우트 ±0.03 초과 전망이면 구현 전에 멈추고 SPEC 7절 대안 순서대로 배치 변경 ≤2회 후 보고. 예산 검사기·기준선 파일·한도 수정 금지.
- 엔진·PageDoc·`ImageSlotValue` 계약 변경 0(C4-A). `ExportGenerator` 계약 변경 필요해 보이면 멈춤.
- 깨지는 테스트는 SPEC 10절 목록 안에서만 기대값 개정 — 밖이면 멈춤(가드 약화·사본 수정 금지).
- TDD: 단계별 RED 전 새 테스트 수 예측 커밋, RED 로그 `dev/active/m2c-3/logs/`. 단언 약화·skip 0. BRIEF P0 명시 커밋.
- 브라우저 확인은 앱 안 클릭만(새로고침 금지 — 잃은 이미지 확인만 예외로 1회 허용·기록), 4폭 1280·1024·768·390. fixture는 자체 제작만.
- 새 의존성 0, package*.json/lock·CLAUDE.md·docs/design·docs/decisions·`app/scripts/**` 수정 0. 서브에이전트 0, 4337/4339 loopback·자기 PID cwd 확인 종료·lsof 0, main 5480 무접촉, push/merge/삭제 0, 승인 실패 우회 금지.
- 마감: typecheck·lint·build·전체 vitest 기본 1회 exit0·Errors0(부하 타임아웃 시 단독 후 전체 1회 재시도·원시 로그), Codex review --scope branch --base d25fe49 실제 완료(≤2라운드), REPORT(IMG-AC↔테스트·번들 전후·meta·한계). 70턴부터 마감 우선.
