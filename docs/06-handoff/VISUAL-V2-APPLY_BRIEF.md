# VISUAL-V2-APPLY — 기존 화면 v2 밀도·타이포 적용

## 책임/목표
- 책임 Developer / 실행 Orca + Claude Code. Jarvis에게 보고. Run run_3e572deefb13, task_001d97efc671 (native Dispatch 아님, 상태는 Jarvis가 회수 뒤 관리).
- 사용자 승인: 다음 단계 디자인 실제 적용, 편집기 기능 개발, 가능한 병렬 진행. 현재 ui-2a04c 생성 화면 레인과 병렬. 이 작업은 하나의 bounded visual consistency patch다.
- 기준 main 9bcf0d2, 별도 worktree visual-v2-apply. Designer 회수 커밋 1c7adfe의 REPORT/HANDOFF를 docs/06-handoff/visual-v2-input/에서 읽는다. 원본 캡처/로그는 ../design-apply-check/docs/design/design-apply-check/ 읽기 전용으로 참조.
- 기능·사용성·일관성 우선, 목업 px 복제 금지. 보고서의 모든 제안은 승인된 결정이 아니다. 아래 범위만 구현하고 의도된 차이는 보존.

## 쓰기 범위 (하드 경계)
1. app/src/styles/tokens/base.css: UI 기본 글자 body3(14) 토큰 연결. 토큰 이름·브랜드 불변.
2. app/src/components/ds/{Button,TextField,Checkbox}.tsx: 기본 밀도 조정. lg 버튼·필드 40 기준, 체크 박스 시각16/행 대상 최소24. 기존 size별 시각 계층이 역전되지 않게 검사; md/sm을 무심코 더 크게 남기지 말고 최소 일관성 조정. 터치·긴글·줄바꿈·접근 이름·포커스 유지. Chip은 변경 금지.
3. app/src/components/layout/AppHeader.tsx: 메뉴 text-body3만. 프로젝트 링크/라우트/구조 변경 금지.
4. app/src/components/catalog/{ReferenceCard,CatalogHero}.tsx: 카드 제목 ds-body2+semibold·2줄 유지, 추천 버튼 md. 기능/URL/데이터 불변.
5. app/src/pages/ReferenceDetailPage.tsx 및 components/detail/DetailSidebar.tsx: 태그 중립/보라 사용, 링크 primary-text, 데스크톱 주요행동 위치 정렬. 모바일 흐름·내용 잘림·의미 손실 금지.
6. app/src/components/compare/{ComparisonTable,PickButton}.tsx 및 pages/CompareBoardPage.tsx: 표 외곽 테두리/과한 선택 셀 테두리 정돈, 데스크톱 초안 패널 300 토큰 기준. aria-pressed·접근 이름·선택됨 글자·포커스·5폭 리플로우 유지.
7. 위에 대응하는 테스트 + dev/active/visual-v2-apply/ 근거/REPORT/PROGRESS. 다른 경로 변경 필요시 중지하여 이유 보고.

## 명시 금지
- ProfilePage 및 components/profile, features/profile, app/routes.tsx, 모든 domain/data/engine/features/compare 코드, 공통 store 변경 금지. ui-2a04c 레인과 충돌 금지.
- engineImportGuard·@source 제외·Q-17~24·addSection 인자 변경 금지. Designer Q24는 미승인 제안이며 적용하지 않는다.
- Chip B-4, 비교 필 문구, 툴바 캡션은 기존대로. 새 의존성/아이콘/브랜드/설정/CLAUDE.md/design 원본/docs/design 변경 금지.
- GDWEB 포함 외부 접근 금지. fable 파일 무접촉. push·삭제·병합 금지.

## 실행/수용
- 수신 및 범위 체크포인트 PROGRESS부터. TDD RED→GREEN: 스타일·토큰/접근성/기능 불변의 새 회귀, 예상 테스트 증감 먼저 기록. 기존 단언을 새 디자인에 맞춰 수정하면 보호하던 의미와 승인 근거 기록. 단순 테스트 삭제 금지.
- 서브에이전트 분할 권장: 카탈로그·상세 파일 vs 비교 시각 파일 독립 단위. 쓰기 서브에이전트 worktree 격리, 최대2; 메인은 DS/통합/측정, 전체 레인당 상한4. 분할/회수 결과 기록.
- 통합마다 npm run build 측정. ADR 첫100KB/자동125KB, 최소여유0.3KB 유지. baseline compare99.59/118.99, profile99.39/118.97. UI 로딩 시점 오분류나 예산 상향으로 통과 금지. 초과 위험시 같은 범위 클래스/구조 단순화 우선, 불가능하면 측정·REPORT 커밋 후 중지.
- npm run typecheck / npm run lint / 관련 DS·catalog·detail·compare·접근성·토큰·하드코딩 가드 테스트 / npm run build 수행. 전체 test suite는 ui-2a04c 전담이므로 여기서 반복하지 말고 통합 회수 때 전체 게이트 대기임을 명시.
- 127.0.0.1:4345 strictPort에서 1280/390 전후 캡처, 768/320 넘침·터치·긴 문자열·비교 선택·이동 검증. 기존 profile에도 DS 변경 회귀 spot-check. 원본 React 외부자산 다운로드 없이 마크업/토큰과 대조. 픽셀 완전 일치 PASS 주장 금지.
- 시각 검토 1회 + 수정 확인 1회만. 문서 작성으로 종료하지 말고 실제 코드를 수정하고 실행 결과를 남긴다. 검증 미실행은 미실행으로.
- 서버 종료 시 자신의 PID만 종료, lsof 종료 근거 남김. *.log ignore 주의: 비밀 없는 지정 로그만 force-add하여 원본 근거 보존. 화면 캡처도 commit.
- 최대60턴, 45턴부터 신규 범위 중단·REPORT 먼저 커밋. 구간별 코드 커밋, 마지막 REPORT. git commit -- <명시 경로>, git add -A 금지.
- 결과: 로컬 SHA, 변경 파일, 테스트 증감, 빌드 수치, 캡처 경로, 실제 화면 변화, 의도된 목업 차이, 미완료/독립QA 대기. 별도 ui-2a04c 결과를 검증 사실로 인용하지 않는다.
