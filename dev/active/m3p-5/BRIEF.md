# M3P-5 Developer 브리프 — 썸네일 문구 구분(B-M3P-01) + 상세 섹션 계획 정합(B-M3P-02)

- 역할 Developer / Orca managed Claude Code / worktree m3p-5 / base `45e4c1e`(M3P 전 레인 병합, QA 조건부 Go). `app/node_modules` lock 그대로 `npm ci` 완료.
- 근거: `docs/qa/m3p/REPORT.md` QB-01·QB-02, `docs/06-handoff/BACKLOG.md` B-M3P-01·02, `docs/design/m3p/SPEC.md` 2·3·4.3·11절. QA 조건부 Go의 조건 = 이 두 건.

## 범위
1. **B-M3P-01 썸네일 문구**: 지금 21장 hero h1이 모두 `app/src/data/sampleCopy.ts` 기본 문구("일상에 꼭 맞는 서비스를 만듭니다"). **빌드 시 썸네일 렌더 입력(`src/thumbs/referenceDoc.ts`)에서만** 업종·레퍼런스별 hero 제목·부제·섹션 제목을 주입(저장소 안 추상 문구 표 — 실존 상호·외부 문구 0, 업종 5+큐레이션 업종 커버). 목표: 고유 h1 ≥ 업종 수, 같은 업종 안에서도 레퍼런스별 차이(톤·레이아웃 반영). 앱 번들 증가 0 — `sampleCopy`·편집기 문서 생성 경로(`createDocFromCandidate`)는 **건드리지 않음**(`/studio` 여유 0.06 · 편집기 문구 주입은 범위 밖, REPORT에 후속으로 기록).
2. **B-M3P-02 상세 정합**: 생성 레퍼런스 상세의 섹션 계획·와이어가 실제 렌더와 맞게 — (a) About 변형(예: gen-beauty-1 상세 "team-grid-3" vs 렌더 "이야기+이미지") 원인 특정 후 한쪽 기준(렌더 = 진실)으로 생성기 데이터 정합 (b) 상세 섹션 수 7(Footer 없음) vs 보드·편집기 8 — 큐레이션 6개의 기존 규칙과 같은 방식으로 맞춤(큐레이션 픽스처 바이트 변경 0이 기본, 큐레이션에도 같은 불일치가 있으면 기록만). 생성 픽스처는 생성 스크립트로 재생성(`--check` 통과), 손편집 0.
3. 가드: 썸네일 가드(G2 외부 URL·스크립트·이전 브랜드) 그대로 통과, 21장 · 버전 갱신. 새 단위 테스트: 고유 h1 수·업종별 문구 · 상세 섹션 계획 ↔ 렌더 섹션 대응.

## 예산·검증
- 멈춤선: `/catalog` 첫 100.90(현재 100.05) · `/studio` 128.70(현재 128.64) · `/references/:id`·`/compare` 124.70 · 렌더 변화 0. 앱 청크 증가 0이 목표 — 늘면 원인 기록.
- **Ego Lite(영환님 지시)**: build + `vite preview --port 4337`(dev 금지), 창 minimized면 `Browser.setWindowBounds normal`, 캡처 `captureBeyondViewport:false`+뷰포트 clip(fullPage 금지), 첫 goto 1회 뒤 앱 안 클릭·스크롤만. `/catalog` 1280 썸네일 문구 차이 캡처 1~2장 + gen-beauty-1 상세 섹션 계획 확인 1장(`dev/active/m3p-5/shots/`). 끝나면 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.
- 마감: typecheck·lint·build · 전체 vitest 1회 exit0 · Codex review --scope branch --base 45e4c1e(≤2) · REPORT.

## 금지·운영
- 엔진·PageDoc 계약·`sampleCopy.ts`·편집기 문서 생성 경로·docs/**·lock·CLAUDE.md 수정 0, 새 의존성 0, 외부 URL·이미지·실존 상호 0, APFS 0. TDD 예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** **턴 관리:** 45턴 도달 시 새 구현 중단 → Ego Lite → vitest → Codex → REPORT. REPORT 초안 50턴 전 커밋.
