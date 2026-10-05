# M2B-5 PROGRESS — 3안 실렌더 나란히 비교 (Developer)

- 책임 역할: Developer · 실행 환경: Orca managed worktree `m2b-5` + Claude Code (Opus 5.5, 서브에이전트 0)
- 브리프: `dev/active/m2b-5/BRIEF.md` · 정본 `docs/design/m2b/SPEC-COMPARE3.md` · `MQ-M2B5.md`(1~4 ★A)
- 시작 SHA `48487d5` (브랜치 `k002bill2/m2b-5`) · baseline(브리프) suite 210 files · 1840

## 체크리스트
- [x] P0 npm ci exit 0 · lock 불변(`git diff --exit-code` exit 0) · BRIEF·PROGRESS 커밋 f1b07bb
- [x] S0 기준선 — check-bundle-size `/profile (3안 있음)` 시나리오 추가(한도·판정·예산 변경 0, 시나리오 1개 추가만) · build exit 0 · 실측 **121.11** = SPEC 0.1 일치(logs/s0-build.txt·s0-bundle.txt) · bundleBudget.test 8 passed · 새 테스트 예측 0 = 실제 0
- [x] S1 시제품 예산 실측(버튼·onClick 동적 import·변환 3건, iframe 0) · 6.2 표 — 커밋 66d2f0c · RED logs/s1-red.txt(3 failed + 2파일 import 실패) → GREEN 표적 10 passed · **멈춤선 초과로 중단**(아래)
- [x] S2 대화상자 + 비교 전용 프레임 다리(U3·U4·U9·U10, G2·G3) — `CompareDialog.tsx`(dialog·3열/1안씩·폭) · `CompareColumn.tsx` · `PreviewFrame.tsx`(다리, `CompareFrame.tsx`는 macOS 대소문자 무시 파일시스템에서 `compareFrame.ts`와 충돌해 이름 변경) · `compareFrame.ts` 로컬 상수 · 카드 부품은 CandidateResults 모듈을 부모가 넘김 · RED logs/s2-red.txt(7 failed) → GREEN 11 passed · typecheck·lint exit 0(s2-gate) · build exit 0(s2-build) · StructureCanvas·/studio·render 소스 변경 0
- [ ] S3 상태·알림·폴백·캡션(U6·U7·U11·U12) — BLOCKED: S1 `/studio` 진입 127.50 > 멈춤선 127.37 — 배치 변경 1회차(docKitTokens 복제) 뒤 남은 대안(`readRenderMessage` 로컬 사본)이 브리프 "출처·소스 검증 재사용" 제약과 충돌 → 구현 중단, 영환님 결정 필요(REPORT §5)
- [ ] S4 선택 연동·접근성(U8·포커스·스크롤 영역) — BLOCKED: S1 `/studio` 진입 127.50 > 멈춤선 127.37 — 배치 변경 1회차(docKitTokens 복제) 뒤 남은 대안(`readRenderMessage` 로컬 사본)이 브리프 "출처·소스 검증 재사용" 제약과 충돌 → 구현 중단, 영환님 결정 필요(REPORT §5)
- [ ] S5 브라우저 B1~B6 4폭(1280·1024·768·390) — BLOCKED: S1 `/studio` 진입 127.50 > 멈춤선 127.37 — 배치 변경 1회차(docKitTokens 복제) 뒤 남은 대안(`readRenderMessage` 로컬 사본)이 브리프 "출처·소스 검증 재사용" 제약과 충돌 → 구현 중단, 영환님 결정 필요(REPORT §5)
- [x] S6 전체 vitest exit0 · Codex review --scope branch --base 48487d5 · REPORT — vitest 213 files · 1850 passed · exit 0 · Errors 0(logs/final-full-vitest.txt) · Codex 1라운드 실제 완료 지적 0(logs/codex-review.txt) · REPORT.md(중단 보고 + 결정 요청 A/B/C)

## 재개(결정 A, 2026-10-05, HEAD 25417e9) — S0·S1 재실행 0
- [x] A 적용 — compareFrame에 readRenderMessage·모양 검사 로컬 사본 + 대조 가드 `compareFrameGuard.test.ts` it 2 · RED logs/a-red.txt(2 failed — it 2도 사본 export 없음으로 실패, 예측과 다름) → GREEN logs/a-green.txt · 음성 검증 1회 logs/a-negative.txt(protocol.ts `<= 1024`→`1025` 임시 변경 → 2 failed → 복원 `git diff` 0 → 2 passed) · build exit 0 logs/a-build.txt · typecheck·lint exit 0 · **6.2 전 행 멈춤선 안**(/studio 127.33)

## 6.2 예산 표 (gzip KB)
| 대상 | baseline | S0 | S1 | A | S2 | S1 커밋(이전 최종) | 멈춤선 |
|---|---|---|---|---|---|---|---|
| /profile 첫 | 99.61 | 99.61 | 99.61 (1회차 99.61) | 99.61 | 99.62 | 99.61 | >99.64 |
| /catalog 첫 | 99.66 | 99.66 | 99.65 (99.66) | 99.65 | 99.66 | 99.66 | >99.69 |
| /references/:id 첫 | 97.00 | 97.00 | 97.00 (97.01) | 97.00 | 97.01 | 97.01 | >97.03 |
| /compare 첫 · 진입 | 98.84 · 121.72 | 98.84 · 121.72 | 98.83 · 121.69 (98.84 · 121.70) | 98.83 · 121.69 | 98.84 · 121.72 | 98.84 · 121.70 | >98.87 |
| /profile 진입(잡 없음) | 118.67 | 118.67 | 119.00 (119.02) | 119.00 | 119.15 | 119.02 (+0.35, SPEC 추정 +0.25 초과·멈춤선 안) | >119.50 |
| /profile (3안 있음) 진입 | ≈121.11 | 121.11 | 121.45 (121.46) | 121.44 | 121.62 | 121.46 (+0.35) | >122.00 |
| /studio 진입 | 127.34 | 127.34 | **127.56 (127.50)** | 127.33 | 127.36 (A 대비 +0.03 — 내 코드가 든 /studio 청크 0, 청크 해시 변화 추정) | **127.50 (+0.16) 초과** | >127.37 |
| 렌더 JS · CSS | 83.03 · 8.75 | 83.03 · 8.75 | 83.03 · 8.75 | 83.03 · 8.75 | 83.03 · 8.75 | 83.03 · 8.75 | 변화 시 멈춤 |
| 비교 조작 뒤 청크 | — | — | 17.92 (17.78) | 17.67 | 19.47 | 17.78(S1 시제품 = 변환만) | >25 |

## 새 테스트 delta 사전 예측 (각 단계 RED 전 기록)
- S1 (기준 = baseline fresh 실행값, 브리프 210 files · 1840): 새 파일 3개 · it +9 → **213 files · 1849**
  - `pages/ProfileCompare.test.tsx` it 4 — U1 잡 없음·진행 중 → 버튼 0, 종료+성공 → 있음 · U1 전부 실패 → 0 · U2 클릭 전 로더 0 → 클릭 aria-busy "불러오는 중…" · 저장소 startDoc 0 · U2 청크 실패 → alert + 다시 시도 → 새 요청
  - `features/profile/comparePreviews.test.ts` it 4 — U5 같은 안 2회 같은 hash·projectId "preview" · 프로젝트 없는 프로필도 문서 · 실패 안 = 미생성(failureText) · 표 밖 변형 = UNKNOWN_VARIANT · 킷 토큰 = docKitTokens(전체 계열)과 같음
  - `features/profile/compareFrame.test.ts` it 1 — 프레임별 source 대조 · 모양 틀림 무시
  - S1 실제: **+10 → 213 files · 1850**(예측 +9보다 1 많음 — 배치 변경 1회차에서 docKitTokens 복제 대조 it 1개 추가). 전체 vitest 1회 213/1850 exit 0(logs/final-full-vitest.txt)
  - 내 새 테스트 전제 수정 1건(약화 아님): comparePreviews.test "프로젝트 없는 프로필" — 보드 확정이 프로젝트를 만들어 `series.project` 전제가 틀림 → "프로젝트를 읽지 않고 보는 버전만으로 문서 + 변환 뒤 편집 문서 0(쓰기 0)"으로 바꿈

- A (기준 = S1 실제 213 files · 1850): 새 파일 1개 `features/profile/compareFrameGuard.test.ts` it 2 → **214 files · 1852**
  - it 1 소스 텍스트 동일(isObject·isText·isNumber·isRect·readRenderMessage, 정규화 = 선언 줄 묶음 + 공백 1칸) — RED 예상(사본 없음)
  - it 2 코퍼스 동작 동일(정상·다른 창·다른 프레임·모양 틀림·출처 틀림) — 원본 재사용 상태에서도 통과(RED 아님)
- S2 (기준 = A 실제 214 · 1852): 새 파일 2개 + 기존 내 파일 1곳 → it +7 → **216 files · 1859**
  - `features/profile/CompareDialog.test.tsx` it 4 — U4 inert·sandbox·title·src · U3 B열 메시지로 A열 불변·click 무시 · U9 폭 전환 = viewport만(render 재전송 0) · U9 <1280 1안씩 + 안 전환 라디오 기본 = 선택한 안
  - `features/profile/compareGuard.test.ts` it 2 — G2 소스 전체 allow-same-origin 0 · 비교 sandbox 리터럴 · G3 로컬 상수 = RENDER_DOC_SRC·FRAME_REM·PREVIEW_WIDTH_OPTIONS + 축소 계산 동일
  - `pages/ProfileCompare.test.tsx` it +1 — U10 닫기·Esc → 연 버튼 포커스 · 닫으면 iframe 0
- S2 실제: +7 → 216 files · 1859(예측 일치 — 표적 3파일 11 passed)
- S3 (기준 = S2 216 · 1859): 새 파일 0 · it +8 → **216 files · 1867**
  - `CompareDialog.test.tsx` it +7 — U6 그림·킷 없이·그리지 못함(Wireframe, iframe 0) · U6 시간 초과 8000ms → 다시 그리기(그 열만 재마운트)·늦은 rects → 그림 · U6 변환 불가(UNKNOWN_VARIANT 문장·iframe 0)·만들지 못한 안 · U7 3열 2 그림 + 1 지연 → 총계 1회·중간 0·복구 "C안을 그렸습니다" · U7 부분 실패 잡 총계(구조·만들지 못함) · U7 1안씩 = 보이는 안 1회·미방문 대기 0 · U11·U12 캡션 2문장·"(구조안)"
  - `ProfileCompare.test.tsx` it +1 — U11 `CANDIDATE_TEXT.preview` 새 문장

## S1 멈춤선 판정 (청크 diff: logs/s0-build.txt ↔ s1-build.txt · s1b-build.txt)
- 1차(s1-build): 비교 청크가 `render/protocol`(readRenderMessage)·`features/studio/docPurpose`(docKitTokens)를 값 import → 편집기 StudioLayout 청크와 공유 청크 `protocol`(0.88KB = docPurpose + readRenderMessage) 신설, StudioLayout 16.77 → 16.09 → `/studio` 진입 127.56(+0.22)
- 배치 변경 1회차(SPEC 3.2 허용 — docKitTokens 복제 + 대조 it): `protocol` 0.34KB(readRenderMessage만), StudioLayout 16.57 → `/studio` 127.50(+0.16) — 여전히 > 127.37
- startDocWrite 분할(memoryDocBook 8.30 → 2.41 + startDocWrite 6.29)은 `/studio` 진입 무관: `getDoc`은 docBook을 받지 않는다(`memoryProjectRepository.ts:91` `book?.docOf`), docBook은 startDoc·saveDoc·내보내기(조작 뒤)에서만
- 실험(커밋 0, 되돌림 확인 `git status` 깨끗): compareFrame에 readRenderMessage 로컬 사본 → `/studio` 127.33 · /profile 119.00 · 3안 있음 121.44 · 비교 청크 17.67 — 모든 멈춤선 안(logs/s1c-experiment-build.txt). 브리프 "postMessage 출처·소스 검증 재사용" 제약과 충돌하므로 적용하지 않음 → 2회차 배치 변경 없이 **구현 중단·보고**
