# RS23-SPEC 최종 설계 리뷰 — 좁힌 이어하기
책임 Designer / Orca Claude Code. 구현 금지. 읽을 파일 REPORT·SPEC-3 r0.1·MQ-3·codex-r1.txt. 앞 레인의 조사/스파이크 반복 금지.

Jarvis 결정: 사용자 1→2→3(B-RS-02·03 착수) 승인과 ★안 자동진행 위임에 따라 MQ-3-1~4 모두 A 선택. 새 스키마·엔진/저장소 인터페이스·의존성·백엔드·예산 상향0 조건. 내부 create 가드 순서 변경만 허용. /projects 입구 게이트만 해결하며 history 재진입은 미해결로 남긴다. '새로고침 시 내용 손실 없음'이라는 단정은 미확인 메모리 편집 자체가 소실될 수 있는 경로와 구별하여 작성: 이전 IDB 문서는 보존되지만 저장되지 않은 새 문서·새로 시작·후속 편집은 사라질 수 있음. 사실로 보장 못하면 안전 경고 명시.

1. MQ-3 결정 기록과 위험 문장을 교정. SPEC 범위/AC 변화 필요시 기록.
2. 누락된 Codex 적대검토 r2 한 번 수행(base93f8111, 원문 logs/codex-r2.txt). r1 반영인 음성 판정 축소와 create 가드 조건을 집중 검토. 코드 수정 금지. 새 안전 결함 나오면 SPEC만 교정하고 결과 미재검토 표기. r3 자동 실행 금지. 계약/예산 변경 필요하면 중단 보고.
3. BRIEF.md 줄끝 공백(Jarvis 작성 11줄) 제거 후 diff check0 확인. SPEC-3/MQ-3/REPORT/PROGRESS 및 r2 원문을 명시적 stage/commit. 보고에 r2 지적/반영/남은 항목·확정안·Developer precondition을 구분. DESIGN 코드0. 최대18턴30분. 서브에이전트 불필요.
