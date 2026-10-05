# M2C-1 Developer 브리프 — 이미지 변환기(imageIngest 순수 모듈)

- 역할 Developer / Orca managed Claude Code / worktree m2c-1 / base `c870439`(M2c 명세 병합, MQ-C1~C8 전부 ★A).
- 정본: `docs/design/m2c/SPEC.md` 2절(V1~V6·폭 640/1280/1920+원본 폭 단계·WebP→JPEG/PNG 대체·EXIF/방향·원본 미보관)·8절 IMG-AC-01~07·10·10절, `docs/04-plan/M2C_PLAN.md` 1·2·3절(공개 API 고정), `docs/design/m2c/MQ-M2C.md`(C1-A 10MB·40MP).
- 병렬 레인: M2C-2(`kit/**`·`render/**`·`StructureCanvas*`·`app/scripts/**`) — 이 경로 수정 금지.

## 범위
- 쓰기: `app/src/features/studio/images/ingest/**` 신규만 + 자체 제작 fixture 생성 스크립트(같은 폴더 아래) + `dev/active/m2c-1/`.
- `ingestImage(file, deps?)` 공개 API는 PLAN 2절 시그니처 그대로. 헤더 파서(디코드 전 크기·픽셀 검사), 매직바이트/MIME/확장자, 폭 사다리, 포맷 결정, EXIF 제거·방향 적용. 브라우저 캔버스 의존은 deps 주입으로 테스트.
- fixture는 자체 제작만(외부 이미지·실사진 0).

## 규칙
- TDD: 단계별 RED 전 새 테스트 수 예측 커밋, RED 로그 `dev/active/m2c-1/logs/`. 단언 약화·skip 0. BRIEF P0 명시 커밋.
- 이 모듈은 아직 어디서도 import되지 않음 → 번들 변화 0이어야 함(build로 확인·기록).
- 새 의존성 0, package*.json/lock·CLAUDE.md·docs/design·docs/decisions 수정 0. 서브에이전트 0, 서버 필요 시 4337/4339 loopback·자기 PID 종료, main 5480 무접촉, push/merge/삭제 0, 승인 실패 우회 금지.
- 마감: typecheck·lint·build·전체 vitest 기본 1회 exit0, Codex review --scope branch --base c870439 실제 완료(≤2라운드), REPORT(IMG-AC↔테스트 매핑·meta·한계). 40턴부터 마감 우선.
