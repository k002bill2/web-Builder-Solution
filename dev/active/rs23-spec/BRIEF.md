# RS23-SPEC — B-RS-02/03 설계
책임 역할 Designer / 실행 환경 Orca + Claude Code. 저장소 전용 worktree rs23-fix, base 93f8111. 사용자 승인 1→2→3 마지막 단계. 단일 산출물 docs/design/restart/SPEC-3.md 및 MQ-3.md와 dev/active/rs23-spec/{PROGRESS,REPORT}. 코드 수정 금지.

문제: BACKLOG B-RS-02 잠금 없는 탭 startDoc(create)의 메모리 commit 후 IDB flush INFRA로 메모리/IDB 갈라짐. B-RS-03 R-E4 미확인 restart를 /projects→편집기로 열 때 미확인 쓰기 상태 인계 누락. 기존 SPEC r2/MQ 및 저장소 ADR-007/성능 ADR-004를 먼저 읽는다.

1. root cause 코드 흐름을 trace: memoryProjectRepository·localSync·restartFlow·ProjectsPage→Studio 진입. 실패 전/commit 뒤/flush 뒤 재조회 실패 및 탭 잠금 상태를 나눈다. 원문 기존 계약과 현재 구현을 구별한다.
2. SPEC-3에 상태·메시지·재시도/취소/복구 및 데이터 유실 방지 수용 기준을 구체적으로 작성. 같은 탭 create/restart/failed flow의 잠금 소유는 탭 범위 공통 소유자로 유지(흐름별 held 중복 금지). 다른 탭은 실제 편집하여 writer lock을 취득한 뒤 차단 시나리오를 검증하도록 명시.
3. 영속 미확인 상태를 메모리만으로 전달할지 저장소 계약 변경이 필요한지 구분. 새 스키마/엔진 계약/의존성/백엔드/예산 상향 필요하면 결정 질문으로 멈춤. 기존 권한 및 저장소 계약만으로 안전한 최소 수정이 추천. 결과 미확인은 성공/실패로 단정 금지.
4. /studio main 실측129.87+0.03, 복원132.91+0.03. 판정선 수정 금지; 구현 전 진입 증분 측정을 precondition으로 명시. 예산 초과는 감량1회 뒤 중단. /profile 일반첫화면100/진입125 유지. 기존 계약 위반을 승인 없이 바꾸지 않는다.
5. Developer 구현 순서를 RED→GREEN 체크포인트 4개 안팎으로 제시. QA 필수: create 거절 시 메모리/IDB 동일, commit 후 오류 재시도 중복없음, /projects 경유 미확인 안내·재시도, 새로고침/탭 변경 한계, 기존 save-on-leave·undo·export 회귀.
6. Codex 설계 적대검토 1회(필요시2회), 지적 반영 후 REPORT·산출물 커밋. source 수정/push/merge 금지. 45턴60분. PROGRESS 시작→trace→draft→review 체크포인트. 독립 원인 조사 서브에이전트 권장(읽기전용 2개 RS02/RS03, 최대4), 메인이 통합. 
Designer 생략 불가: B-RS-03 저장 상태/사용자 인계 흐름 명세가 필요. 구현은 Jarvis 회수 후 Developer에 전달하며 최종 QA는 별도 레인.
