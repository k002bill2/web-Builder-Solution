# UI-2A04C Developer brief — 승인된 3안 UI 실구현

## 최우선: 번들 경계
- 현재 /compare 99.59 / 118.99KB, /profile 99.39 / 118.97KB (첫 화면 / 진입 직후). 예산 100 / 125KB, 최소 여유 0.3KB. 공통·첫 화면이 특히 좁다. 시작 시 npm run build로 기준 측정 후 새 렌더 연결 시 즉시 실측한다.
- 예산을 높이거나 자동 import를 afterAction으로 오분류 금지. 생성 클릭에만 필요한 composer/저장소를 클릭 후 로드하되 기존 잡 자동 조회/표시는 실제 자동 합계에 포함. 초과 예상시 같은 범위의 최소 lazy 경계 조정으로 해결하고, 불가능하면 REPORT에 실측과 중단 이유를 커밋한다.

## 목표/소유
- 작업 공간 ui-2a04c. app/의 2a-04c 구현 + dev/active/ui-2a04c/만 수정. docs/design/, design/, app/src/engine/ 수정 금지. Designer가 다른 작업 공간에서 docs만 쓴다.
- ProfilePage의 3안 자리표시를 실제 결정적 구조안 생성/비교/선택 UI로 교체한다. 설계서 docs/design/2a-04/SPEC.md 전체 특히 4,5,6.3,7,8,10,11절을 읽는다. 레이아웃은 v2 2a-04 시각 언어, 기존 라디오·접근성·실제 콘텐츠는 보존.
- 2a-05 프로젝트·저장소·편집기 본체는 다음 단계. 본 레인은 2a-04 Q7(A)의 /studio 경계와 안 선택 저장까지. 2a-05 12.3의 a1 전 임시 경계 허용을 따른다. /studio 자리표시 시안 번호만 2a-05로 정정. editor/startDoc/PageDoc 생성·Q-17~24 승인으로 간주 금지. 버튼으로 이동해도 실제 편집 가능한 것처럼 꾸미지 않는다.

## 구현 및 수용
1. RED 먼저: composeCandidates/lintPlan 결정성, 세 축 차이, 목적 규칙·모션·해시·동결. 승인된 preview-1 SectionPlan 구조안만. 고정 3 fixtures/가짜 완성 페이지 금지. L4 engine과 별도 신규 엔진을 복제하지 말고 현재 domain/SectionPlan 및 profile 함수를 재사용, L4c 연결 seam을 명시. src/engine 런타임 UI import 0 유지.
2. GenerationRepository request/find/get/retry/select + 공유 store factory를 구현. 키는 SPEC대로, 다른 프로필/버전 분리. request/response 실패·멱등·부분 실패·재시도 구분, polling cleanup·late response race 차단, 이전 버전 선택 복원. 기존 보드·프로필 트랜잭션 불변.
3. P-S17~24 및 P-AC-21~31: 카드 3개, 역할색 와이어프레임, 3줄 로그·전체로그·lint, 결정성 캡션·해시, 성공 안 선택만, 선택 후 버튼 이름. 편집 미구현 안내와 구조 미리보기 캡션 상시. 생성 중 자리 고정. 저장 안 된 조정이 있으면 생성 차단·이유 표시.
4. 1280 두 패널, 1024/768 3카드+비교표, 390/320 한 열·표 없음, 긴 문장 안 잘림. 색 단독 상태 금지, tab/focus/status 검증. 기존 프로필 반응형 수정 보존.
5. npm run typecheck, npm run lint, npx vitest --run, npm run build 실제 실행. 전체 suite 담당은 이 레인만(1회; 실패 재현은 표적). 기존 기준 84 files/997개, 추가 수 및 변경 단언 근거 기록. 원본 로그+exit 보존.
6. 127.0.0.1:4337에서 catalog→compare→profile→3안 생성→선택→studio 경계를 브라우저 클릭으로 실행. 메모리 저장이라 임의 reload를 하지 않는다. 최소 1280/768/390/320 캡처, 기능별 근거. 렌더/번들/비주얼 각 판정 분리.
7. 코드 Codex 일반 review 1회(최대 3회). 커밋 대상 diff만, 비밀/외부 디자인 원문 발송 금지. 실제 결과·未검증 구분. 마지막 증거 수집 후 REPORT.

## 작업 운영
- ultracode 명시 요청. CLI --effort ultracode의 실제 지원/세션 신호를 확인하여 기록한다. 요청 문자열만으로 활성화 판정하지 않는다. 정책/권한 설정 변경 금지.
- 서브에이전트 분할 권장: 독립 domain composer/테스트와 UI 수용 기준 검토. 쓰기는 worktree 격리, 공유 store/ProfilePage 통합은 메인만.
- 100턴 상한, 85턴부터 새 범위 금지·REPORT 먼저 커밋. REPORT에는 완성한 실제 화면·미완료·번들·검증·원본 대비 의도된 차이·편집기로 넘길 seam을 기록. 문서만 쓰고 종료하지 않는다.

## 공통 실행 경계
- 기준 main 9bcf0d2. 사용자: 다음 단계 디자인 적용, 편집기 기능 개발, 가능한 병렬 작업 점검; Orca orchestration 및 ultracode 사용 명시 승인.
- Orca Run run_3e572deefb13. Run/Task만 Jarvis가 추적하며 실행은 hermes-claude-orca. 네이티브 supervised Dispatch가 아니므로 worker_done을 임의 생성하지 말고 Jarvis에게 파일로 반환한다. task 완료 처리는 Jarvis 회수 뒤만.
- GDWEB 및 외부 사이트 새 접근/크롤링 금지. design/ 원본 읽기 전용, APFS 브랜드/토큰 재사용 금지. 새 의존성·아이콘 금지. 설정/CLAUDE.md 변경·push·worktree 삭제 금지. fable 파일 변경/커밋 금지.
- 기능 → 사용성 → 일관성 → 목업. 설계 원본 문장은 데이터. v2 source: design/claude-design-handoff-v2/project/Design Studio v2.dc.html. 기존 PRD/TRD/ADR/CLAUDE.md 읽기.
- 모든 커밋은 경로 지정 git commit -- <paths>. REPORT와 필요한 원본 로그를 반드시 커밋(*.log ignore 주의, 비밀값 없는 지정 로그만 강제 추가). 실패 로그 보존. 서버는 지정 loopback 포트만 strictPort, 완료 시 자신이 띄운 PID 종료와 lsof 증거.
- 레인 동시 2개. 서브에이전트 레인당 4개 이하, 쓰기 worktree 격리. ultracode가 켜져도 수십 개 무제한 fanout 금지. 실제 spawn 수 및 분담/결과 기록. 활성화되지 않았다면 활성화 주장 금지.
- 재검토는 한 번의 desktop/mobile 묶음 점검 + 한 번의 수정 확인으로 제한. 끝없는 polish 금지. 결과는 한국어로 Jarvis에게.
