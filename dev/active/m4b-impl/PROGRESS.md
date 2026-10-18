# M4-b-2 PROGRESS — React zip 내보내기 구현

정본: `docs/design/m4b/REACTZIP-SPEC.md` r1 + 7a · BRIEF.md · base `631190c7`

## 체크리스트
- [x] 0. BRIEF·PROGRESS 커밋 (e1f48a8a)
- [x] E0. 예산 관문 (ef096651 — 1차 128.97 초과 → 감량 1회 128.81·131.79 통과) — 버튼 + exportFlow retryableImport 슬롯, /studio ≤128.83 · 복원 ≤131.81 · 타 라우트 증분 0, 진입 정적 포함 0 가드
- [x] E0. REPORT 초안
- [ ] E1. 생성기 (`features/studio/reactZip/`) — 킷 ?raw · 템플릿 · site.json v1 · img-NN · 글꼴 서브셋 · 메뉴 닫기 · Q6 A · checkReactZipEntries · `_react.zip`
- [ ] E1. 문구 자리 상수 `reactZipText.ts` (TODO(copy))
- [ ] E2. lock — docker node:22 npm install → 상수 + 대조 테스트(RZ-AC-17)
- [ ] E3. 충실도 — 오프라인 SSR 대조 30 변형 + 단위 테스트(5.2)
- [ ] E4. zip 빌드 docker node:22 `npm ci && npm run build` (+node:20.19)
- [ ] E4. Ego Lite 1회 (preview 4399, 1280·390) → preview 종료·리슨 0
- [ ] 마감. fresh typecheck·lint·test·build
- [ ] 마감. Codex adversarial 1회 + 반영 1회
- [ ] 마감. REPORT (RZ-AC 판정표·예산 표·SHA), git status 빈 값

## 로그
- E0: base 실측 128.80·131.78. 1차 +0.17(reactZipText import로 README 문자열 진입) → 버튼 글자 모듈 분리 감량 1회 → +0.01. 다른 라우트 증분 0, 렌더 84.29 불변. 가드 통과.
