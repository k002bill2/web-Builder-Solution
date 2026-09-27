# PROFILE-V2-COMPACT PROGRESS

## 수신·범위 체크포인트 (2026-09-27)
- 브리프 `docs/06-handoff/PROFILE-V2-COMPACT_BRIEF.md` 전체 + 시안 `docs/06-handoff/profile-v2-input/user-profile-mockup.png` 직접 확인.
- 기준: 브랜치 `k002bill2/profile-v2-compact` @ 88828bf (main 184f92f + 브리프 커밋).
- 기준 번들(fresh `npm run build`, exit 0): `/profile` 첫 화면 99.46KB · 진입 직후 124.58KB (예산 100/125).
  - 첫 화면 청크: ProfilePage(ProfileValues·VersionList 포함). 진입 직후: profileEngine(ProfilePanel·PaletteContrast·AdjustmentPanel·CandidatesSection·CandidateCard·CandidateTable).
- 쓰기 범위: `pages/ProfilePage.tsx`, `components/profile/**`, `features/profile/{ProfilePanel,CandidatesSection,CandidateCard,CandidateTable}.tsx`(3안·패널 UI), 테스트, 이 폴더.
- 금지: engine/domain/data/features/compare/라우트/AppHeader/DS 공통/design/docs/design/번들 스크립트/가드 완화/새 의존성·아이콘.
- 유지하는 SPEC 제외 3개: 슬라이더 없음(기존 선택 컨트롤), "다시 생성" 없음, "생성 로그" 버튼 없음.
- 서브에이전트: 사용 안 함 — 두 영역 모두 같은 번들 여유(0.41KB)를 나눠 써서 통합 실측을 메인이 매번 해야 하고, 변경량이 작아 분할 비용이 더 큼.

## 체크리스트
- [ ] RED 테스트: 값 전체 보기 접힘 · 대비 요약 1줄/대비 상세 접힘 · 카드 상세 접힘 + 경고 Tag 노출 · 편집 시작 DOM 순서 · 비교 표 디스클로저 · 링크 색 가드
- [ ] 2단 비율 xl 340 / 나머지
- [ ] 왼쪽 패널 요약 우선(헤더→요약→대비 요약→조정), 값 전체 보기 / 대비 상세 접기
- [ ] 패널 h2 ds-heading1 · 현재 배지 violet · 링크 text-primary-text
- [ ] 3안 카드 간결화(상세 디스클로저 1개, 경고 N Tag)
- [ ] 편집 시작 카드 바로 아래 오른쪽, 3안 비교 표 보기 디스클로저(≥768)
- [ ] 4게이트(typecheck·lint·vitest 전체·build) 로그 보존
- [ ] 번들 실측(통합마다)
- [ ] 4345 실제 클릭 흐름 + 1280/768/390/320 캡처 + 1280 전후 한 쌍, 가로 넘침·포커스 순서
- [ ] 서버 PID 정리 + lsof 근거
- [ ] REPORT.md + 로컬 커밋
