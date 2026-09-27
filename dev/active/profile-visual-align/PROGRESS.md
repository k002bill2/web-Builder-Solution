# PROFILE-VISUAL-ALIGN PROGRESS

## 수신·범위 체크포인트 (2026-09-27)
- 브리프 `docs/06-handoff/PROFILE-VISUAL-ALIGN_BRIEF.md` 전체, 시안 `docs/06-handoff/profile-v2-input/user-profile-mockup.png`, QA REPORT(`k002bill2/qa-profile-visual`) 차이 1·2·3·5와 1280 캡처, 이전 브리프 수용 기준 1~6 직접 확인.
- 기준: 브랜치 `k002bill2/profile-visual-align` @ 34f7318 (main 5562dc2 + 브리프 커밋).
- 기준 번들(fresh `npm run build`, exit 0, `build-baseline.log`): `/profile` 99.54 / 124.67, `/compare` 99.66 / 120.57.
  청크 gzip(Node zlib): ProfilePage 7297 B(첫 화면) · profileEngine 9616 B(진입 직후 — ProfilePanel·PaletteContrast·CandidatesSection 포함).
- 쓰기: ProfilePage.tsx, components/profile/**, features/profile/{ProfilePanel,CandidatesSection,CandidateCard,CandidateTable,AdjustmentPanel}.tsx, 테스트, 이 폴더.
- 금지: engine/domain/data/compare/라우트/레이아웃/AppHeader/DS 공통/번들 스크립트/design/·docs/design/, 기능 삭제, 새 의존성·아이콘, 가드 완화. `/profile` 목록 분기 무접촉.
- 서브에이전트: 브리프 "분할 불필요" — 사용 안 함.

## 설계
- ProfilePage: 바깥 PAGE를 2단 grid로 바꾸고 왼쪽 열 = header(h1·부제·링크) → 알림 Callout들 → ProfilePanel, 오른쪽 = CandidatesSection. div 수는 그대로(바깥 flex → grid). <1280 한 열 = 기존 순서.
- CandidatesSection h2 "3안" → "생성된 3안"(region 이름도 바뀜 → 기존 테스트 이름 갱신, 단언 의미 불변).
- PaletteContrast: `역할 팔레트` 목록 = 한 줄 스와치 5칸 + 보이는 캡션(역할 키). 역할 한글 이름·hex·"조정됨 · 보드 값"은 팔레트 영역 안 "값 전체 보기" 디스클로저의 목록 `역할 팔레트 값`으로.
- 보정 제안: 카드 → 정보 배너(informative 면) 한 덩어리, "보정값 쓰기"는 배너 안 텍스트 버튼(assistive). 접근 이름·aria-disabled·describedby·포커스 불변.

## 체크리스트
- [ ] RED 테스트(배치 DOM 순서 · 팔레트 스와치/캡션 · 배너 버튼)
- [ ] ProfilePage 머리 왼쪽 열
- [ ] "생성된 3안"
- [ ] 팔레트 한 줄 스와치 + 값 전체 보기
- [ ] 대비 보정 배너
- [ ] 번들 실측 `/profile` 순증가 ≤ 0, 다른 라우트 불변
- [ ] 4게이트 로그(typecheck·lint·vitest 전체·build)
- [ ] 4345 실제 클릭 + 1280/768/390/320 전후 캡처, 가로 넘침, 1280 Tab 순서, 디스클로저 Enter/Space
- [ ] 서버 PID 정리 + lsof
- [ ] REPORT.md + 로컬 커밋
