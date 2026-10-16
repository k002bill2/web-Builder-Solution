# SPEC-3 r0.2 최종 독립 안전 검토 (구현 전 마지막)
책임 QA / Orca Claude Code. base93f8111, headf9feeef. 읽기전용 코드/설계. 쓰기 dev/active/rs23-spec/final-gate/만. 앞 Designer 래퍼 exit1이나 f9feeef의 문서·r2 로그·결정 기록이 모두 커밋됨. 메타 실패와 산출물 상태 분리.

Codex 설계 리뷰는 r1+r2 모두 추가 정확성 결함 발견, r2 P1 2 P2 1 반영본 r0.2는 아직 재검토 안 됨. 이 레인은 마지막 게이트 검증만. 설계/코드 수정·자동 추가 리뷰/수정 반복·merge/push 금지.

1. SPEC-3 r0.2 6절3-1/3-2, R-E6/C-E6의 기억 삭제/링크복원은 실제 영속 확인 없이 기존 미확인 후속 편집을 정직하게 표현하는지 코드로 검증. r2 3가지 실패 경로와 same-key replay의 STALE 안남 추론을 확인. 못 검증한 것은 미확인.
2. 본인 판단을 독립 기록 후 Codex adversarial-review --scope branch --base93f8111 실행 1회(r3 원문 보존). 사용법 help를 실행하지 말 것(실제 리뷰 부수실행 발생). 기존 plugin 실행경로 logs/PROGRESS 참조.
3. 새 P1/P2 사용자 결과 결함이면 수정하지 말고 구현 BLOCKED 명시. 0이면 설계 검토만 PASS, 예산·runtime·코드 검증은 미실행 구분. QA와 Codex 불일치일 때 양쪽/근거/미확인 분리. 시간20분 max20턴.
4. REPORT.md·raw log 및 diff check/앱 변경0 증거를 커밋. 원문 *.log gitignore 여부 확인. 서브에이전트 불필요. 다른 세션 무접촉. 

중요: MQ-3-4 '경고없음' 선택은 처음 무손실 근거가 틀렸으므로 사용자 재확인 대기다. 이 리뷰 PASS도 구현 승인을 대신하지 않는다. 새로고침이 이전 IDB를 보존할 뿐 저장되지 않은 새 문서·후속 편집 소실 가능; 위험을 숨기지 않는다. 최종 보고에 경고 없음 유지/이탈보호 확장 선택의 필요사항을 정확히 기술한다.