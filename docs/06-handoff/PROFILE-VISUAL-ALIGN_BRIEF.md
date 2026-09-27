# PROFILE-VISUAL-ALIGN — 프로필 화면 시안 잔여 차이 정리

## 책임/목표
- 책임 Developer / 실행 Orca + Claude Code. 보고 대상 Jarvis. 기준 main `5562dc2`. 작업 공간 `profile-visual-align`. 포트 4345.
- 사용자 결정 ★A: QA 대조에서 남은 시안 차이 1~3번 정리, **번들 증가 0 목표**. 병렬 레인 `compare-headroom-c8`(비교 보드 파일만 수정)과 쓰기 경로가 겹치지 않는다.
- 보류 중인 `k002bill2/editor-a1-beta`가 나중에 이 위로 올라온다(그쪽은 ProfilePage 목록 분기 삭제·"프로젝트: <이름>" 링크 예정). **ProfilePage의 목록 분기(`/profile` 무인자)는 건드리지 말고**, 머리 영역은 링크 1개가 나중에 h1 아래 들어갈 수 있는 구조로 둔다(지금 링크를 만들지는 않는다).
- Designer 생략 사유: 사용자 확정 시안 + QA 대조 결과가 차이를 특정. 구현 후 캡처 대조는 Jarvis가 한다.

## 입력
- 사용자 시안 `docs/06-handoff/profile-v2-input/user-profile-mockup.png` (직접 열어 보기)
- QA 대조: `git show k002bill2/qa-profile-visual:docs/qa/profile-visual/REPORT.md` "시안 대비 남은 시각 차이" 1·2·3·5, 캡처 `git show k002bill2/qa-profile-visual:docs/qa/profile-visual/shots/1280-b-selected-viewport.png > /tmp/...`로 꺼내 보기
- 이전 브리프 `docs/06-handoff/PROFILE-V2-COMPACT_BRIEF.md`(수용 기준 1~6은 유지해야 한다)

## 범위
1. 페이지 머리(h1 "디자인 프로필"·부제·"비교 보드에서 선택 바꾸기")를 ≥1280에서 **왼쪽 열 안**으로. 오른쪽 열은 "생성된 3안" 제목으로 바로 시작. 1024 이하 한 열 흐름 유지. DOM 순서 = 보이는 순서 = Tab 순서(헤더 → h1 → 왼쪽 패널 → 3안 → 편집 시작).
2. 역할 팔레트: **한 줄 스와치**(역할 5개). 역할 이름은 보이는 캡션 또는 접근 이름으로 보존(색 단독 전달 금지), hex·세부는 "값 전체 보기" 안으로.
3. 대비 보정 제안: **한 줄 정보 배너** + "보정값 쓰기"는 배너 안 텍스트 버튼. 동작·확인 흐름·알림(`role=status`/`alert`)·포커스 불변.
4. 결과로 전역 조정·버전 목록이 1280×900 첫 화면에 더 올라오는지 캡처로 보인다.
- 유지(결함 아님): 슬라이더 없음, "다시 생성"·"생성 로그"·"프로필로 돌아가기" 없음, 카드 "이 안 선택" 버튼.

## 쓰기 범위 / 금지
- 쓰기: `app/src/pages/ProfilePage.tsx`, `app/src/components/profile/**`, `app/src/features/profile/{ProfilePanel,CandidatesSection,CandidateCard,CandidateTable,AdjustmentPanel}.tsx`, 해당 테스트, `dev/active/profile-visual-align/`.
- 금지: `engine/**`, `domain/**`, `data/**`, `features/compare/**`, `components/compare/**`, `pages/CompareBoardPage.tsx`, 라우트·레이아웃·AppHeader·DS 공통, 번들 스크립트·예산, `design/`·`docs/design/`, 기능 삭제, 새 의존성·아이콘, 가드 완화.

## 검증
- 번들: 기준 5562dc2 `/profile` 99.54 / 124.67, `/compare` 99.66 / 120.57. **`/profile` 순증가 ≤ 0**(첫 화면·진입 직후), 다른 라우트 불변. 여유 0.3 미만이면 중지·보고.
- TDD: 배치 DOM 순서, 팔레트 접근 이름/캡션, 배너 버튼 동작·알림, 기존 수용 기준 1~6 단언 유지(약화·삭제 금지). 전체 vitest 1회·typecheck·lint·build 로그+exit.
- 127.0.0.1:4345 실제 클릭: /catalog → /compare 확정 → /profile/:id → 3안 만들기 → B안 선택. 1280/768/390/320 캡처 전후(1280 선택 후 = 시안 구도), 가로 넘침 0, **1280 키보드 Tab 순서 기록**, 디스클로저 Enter/Space. 자기 PID만 종료 + lsof.
- 서브에이전트 분할: 불필요(한 화면·같은 번들 여유 공유).
- `--max-turns` 55, 40턴부터 REPORT 우선. 단계마다 `dev/active/profile-visual-align/PROGRESS.md` 커밋. push·병합·삭제 금지. fable 무접촉.
- REPORT: 로컬 SHA, 변경 파일, 번들 전후, 캡처 경로, 시안 대비 반영/의도된 차이, Tab 순서, 미검증.
