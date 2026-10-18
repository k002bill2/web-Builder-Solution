# M4-b-2 PROGRESS — React zip 내보내기 구현

정본: `docs/design/m4b/REACTZIP-SPEC.md` r1 + 7a · BRIEF.md · base `631190c7`

## 체크리스트
- [x] 0. BRIEF·PROGRESS 커밋 (e1f48a8a)
- [x] E0. 예산 관문 (ef096651 — 1차 128.97 초과 → 감량 1회 128.81·131.79 통과) — 버튼 + exportFlow retryableImport 슬롯, /studio ≤128.83 · 복원 ≤131.81 · 타 라우트 증분 0, 진입 정적 포함 0 가드
- [x] E0. REPORT 초안
- [x] E1. 생성기 (c1d3c18b) (`features/studio/reactZip/`) — 킷 ?raw · 템플릿 · site.json v1 · img-NN · 글꼴 서브셋 · 메뉴 닫기 · Q6 A · checkReactZipEntries · `_react.zip`
- [x] E1. 문구 자리 상수 `reactZipText.ts` (TODO(copy))
- [x] E2. lock (c1d3c18b · raw/lock-gen.txt) — docker node:22 npm install → 상수 + 대조 테스트(RZ-AC-17)
- [x] E3. 충실도 — 오프라인 SSR 대조 30 변형 + 단위 테스트(5.2)
- [x] E4. zip 빌드 (raw/zip-build-node22.txt · node20.txt — M1·M2 npm ci/install + build 전부 exit 0) docker node:22 `npm ci && npm run build` (+node:20.19)
- [ ] E4. Ego Lite 1회 — BLOCKED: BRIEF 턴 상한(105턴부터 마감)에 도달해 실화면 QA(R1·R2·R4) 미실행. preview 미기동(리슨 0)
- [x] 마감. fresh typecheck·lint·test·build (0·0·3297 passed·0)
- [x] 마감. Codex adversarial 1회(needs-attention 2건) + 반영 1회
- [x] 마감. REPORT (RZ-AC 판정표·예산 표·SHA), git status 빈 값

## 로그
- E0: base 실측 128.80·131.78. 1차 +0.17(reactZipText import로 README 문자열 진입) → 버튼 글자 모듈 분리 감량 1회 → +0.01. 다른 라우트 증분 0, 렌더 84.29 불변. 가드 통과.
- E1: 1차 배선 실측 128.88(+0.08, 공통 react 청크 +0.05 — reactZip이 exportFlow 청크의 문구 모듈을 import해 exportFlow에 namespace 헬퍼 생성) → 감량 1회(결과 줄 문구 reactZipNotes 분리) → 128.82·131.80. 생성기 청크 53.29KB gzip(판정 밖).
- E2: docker node:22 lock 생성(Linux aarch64 · v22.23.3 · npm 10.9.9), npm ls --all exit 0.
- E3: fidelity.test.tsx 30변형 + M2 이미지 문서 SSR 대조 32/32 통과. 풀 위치 app/.vite/react-zip-fidelity(gitignore · afterAll 삭제). node_modules/.cache는 미시도.
- E4: 테스트 경로 zip(M1·M2) docker node:22 · node:20.19-slim(v20.19.6) npm ci&&build · npm install&&build exit 0. JS 76.35/77.63KB · CSS 5.98KB gzip.
- 서브에이전트: 사용 0.
- Codex r1: 생성 전체 상한 · 단언·용량 refused 반영. 정적 HTML kitCss 상한 없음은 diff 밖(별건).
