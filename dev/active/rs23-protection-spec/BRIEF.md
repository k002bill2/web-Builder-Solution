# RS23 이탈 보호 확장 설계 — 사용자 2번 승인

책임 역할 Designer / 실행 환경 Orca + Claude Code. 저장소 /Users/younghwankang/orca/workspaces/web-builder-solution/rs23-fix, base 설계7dbf116, 앱93f8111. 사용자 최신 '2'는 이탈 보호 확장(미확인 상태 새로고침·탭닫기 경고 및 실제 저장 재시도 수단) 승인. 예산 상향·새 스키마/인터페이스·의존성·백엔드·push 승인은 아님.

## 목적/범위
SPEC-3 r0.2로 구현하지 않는다. 앞 설계는 superseded 초안으로 보존하고 새 docs/design/restart/SPEC-4.md와 MQ-4.md에 닫힌 상태·보호·재시도/확정 경로를 한 번 재정리한다. 앞 REPORT와 final-gate/REPORT.md·QA-JUDGMENT·codex-r3를 읽어 F1/P1(재시도 before 재조회로 기억삭제), F2/P2(실행 불가 수동저장 지시)를 필수로 닫는다. 내부 create guard는 없는 문서만, 기존 잠금/멱등 동작은 유지.

## 필수 설계 판단
1. 미확인 기억은 프로젝트뿐 아니라 탭 수명·저장소 인스턴스 범위에 있고 새로고침/탭 닫기 beforeunload 가드는 앱이 유지하는 곳에서 실제 pending에만 활성화한다. 화면 언마운트로 보호가 없어지는 순간이 없어야 함. 브라우저 제한(user activation·모바일 종료 등) 때문에 완전 무손실 보장 금지.
2. SPA 앱 안 이동/history와 브라우저 unload는 다르다. history /studio 재진입까지 미확인 상태 인계 및 실제 저장 재시도 버튼을 통해 해결하는 안을 먼저 설계. 보호만 추가하고 false-saved/idle 경로를 남기지 않는다. 이미 확인된 dirty 편집의 기존 보호도 약화하지 않는다. pending 종료 조건은 영속 커밋 확인, '전 상태 같음'은 request 미반영일 뿐 다른 미저장 편집의 저장 확정이 아님.
3. 최초 before와 재시도 before를 구별해 보존하는 타입/판정표를 제시. startDoc 같은-key replay와 R-E5(no commit)→후속 편집→STALE/DOC_EXISTS 복구 경로를 분리. pending을 지우고 링크를 여는 것만으로 저장됐다고 보지 않는다. 명시적 저장 확인 수단이 필요하다면 기존 saveDoc의 revision/stale 부작용·잠금 및 content-preserving 대안을 조사. 새 인터페이스 변경 필요시 구현 차단/MQ로 남김.
4. 현재 실제 불일치 전체 레코드와 IDB 확인을 구별. 메모리 getDoc만으로 영속 성공 단정 금지. 실패/재시도/취소/내용보존 및 폐기 확인을 문구·버튼·포커스·status/alert로 정의. 새로고침 추천을 자동복구라 표현하지 않는다.
5. 예산 유지: /studio 판정선129.90·복원132.94, /profile100/125, /projects100/125. Designer는 증가0B 단정하지 말고 Developer 예산 스파이크가 선행한다는 관문/측정 후보(앱 공통 guard vs lazy body vs studio 진입인계)를 명시. 기준선/ADR 수정 금지. 다음 Developer는 설계안 최소 prototype baseline/head 실측(같은 머신 raw bytes)·감량1회·초과시 복원 및 중단 보고; 수치 없이 상향 승인 요청 금지.

## 산출물/게이트
- 쓰기 docs/design/restart/SPEC-4.md,MQ-4.md 및 dev/active/rs23-protection-spec/만. 앞 SPEC-3/앱/예산/CLAUDE.md 변경0. FINAL-GATE.md 미추적은 Jarvis 입력이므로 삭제/overwrite 금지, 필요시 별도 pathspec으로 보존.
- PROGRESS 첫3턴 내, 원인/복구표→SPEC→검토→REPORT 체크포인트. 구현 계획(파일 경로·RED 테스트·실행명령·변경전 테스트수 측정→예측 delta, 잠금 실제취득 멀티탭 QA) 포함. 기능 scope를 4 RED/GREEN 체크포인트 이내 레인으로 쪼갠다.
- 서브에이전트 권장: unload/history 수명 조사와 existing write-confirm 재시도 조사 읽기전용 병렬2개, 최대4, 메인이 통합 검증.
- Codex 설계 adversarial-review 1회만(기존 호출 참고, --help 실행 금지). 지적→한 번 문서 반영, 미재검토 명시, 무한r4/r5 루프 금지. 실제 구현 전 독립 회수필요. REPORT 한국어: 닫은 F1/F2, 보호범위·남는 브라우저한계, 새 계약필요 여부, 측정선행, QA 수용기준, 예산/코드/runtime 미실행 구분.
- 최대55턴60분. 명시적 pathspec 커밋(diffcheck), push/merge/코드 구현 금지. 새 설계 승인 범위를 넘어가면 보고하되 의존하지 않는 분석은 완료.
