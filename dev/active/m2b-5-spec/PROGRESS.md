# M2B-5 SPEC (Designer) — PROGRESS

- 브랜치 `k002bill2/m2b-5-spec` · base `292e7b6` · 레인 = 명세 문서만(코드 0)
- 산출: `docs/design/m2b/SPEC-COMPARE3.md` · `docs/design/m2b/MQ-M2B5.md` · 이 파일 · `REPORT.md`

## 체크리스트
- [x] P0 BRIEF 명시 커밋 (`14ed7a6`)
- [x] L1 사실 확인 — `/profile` 3안 와이어프레임(ProfilePage·CandidatesSection·CandidateCard·CandidateResults·candidateResultsLoader·CandidateTable)
- [x] L1 사실 확인 — 렌더 문서(render.html·render/main·RenderApp·protocol·PageDocument·sectionMotion·siteFontLoad)·캔버스 다리(StructureCanvas·previewFrame)
- [x] L1 사실 확인 — 변환(startDocWrite·engineVariantMap·createDocFromCandidate·memoryDocBook)·킷 토큰(docPurpose.docKitTokens)·engineImportGuard
- [x] L1 예산 실측 — `npm ci` + `npm run build`(exit 0) · manifest closure 계산
- [x] SPEC-COMPARE3.md 1~7절 작성
- [x] MQ-M2B5.md 작성
- [x] SPEC·MQ 커밋
- [x] Codex adversarial-review R1·R2(branch, base 292e7b6) — 둘 다 실제 완료, needs-attention(R1 P1 1·P2 2 / R2 P2 1)
- [x] Codex 지적 반영 — `9b0481c`(R1) · `0d111fe`(R2). R3 미실행(1~2라운드 권장, 마지막 P2 반영 완료)
- [x] REPORT.md 마감 + 커밋

## 실측 기록 (2026-10-05, 이 worktree, `npm run build` exit 0)
- 공통 89.35 · `/catalog` 99.66/100 · `/profile` 첫 화면 99.61/100 · 진입 118.67/125 · `/compare` 98.84 / 121.72 · `/studio/:projectId` 91.78 / 127.34(한도 128, 멈춤선 127.70) · 렌더 JS 83.03/90(멈춤선 89.70) · CSS 8.75/30
- manifest closure(`/profile` 진입 집합 대비 증가): `CandidateResults` +2.44 · `memoryProjectRepository` +2.02 · `memoryDocBook`(writeStartDoc 포함) +18.69
- 발견: `CandidateResults`는 잡이 있는 채 진입하면 effect가 자동으로 받지만 `/profile` 시나리오 auto에 없다(bundleBudget은 목록 밖 dynamic import를 세지 않음 — `staticClosure`만) → 잡 있는 진입 실제 ≈ 121.11 (여유 ≈ 3.89)
- 발견: 3안 `axes.typeScale`은 PageDoc·KitTokenInput 어디에도 전달되지 않는다(`docKitTokens` = base scale) → MQ-M2B5-2

## 목업과 다르게 한 부분
- 목업에 3안 실렌더 비교 화면 없음 — 와이어프레임 카드 유지 + 요청 시 대화상자(사유: 예산·거짓 미리보기 금지, SPEC 1·2절)
