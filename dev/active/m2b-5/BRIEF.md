# M2B-5 Developer 브리프 — 3안 실렌더 나란히 비교

- 역할 Developer / Orca managed Claude Code / worktree m2b-5 / base `48487d5`(SPEC 병합 지점).
- 정본: `docs/design/m2b/SPEC-COMPARE3.md` 전체(0·6·7절 필수), `MQ-M2B5.md` 1~4 ★A 확정(영환님 "추천대로 진행" 위임). 와이어프레임 유지, 제목 비율 축 전달은 범위 밖(B-M2B-05).
- baseline: suite 210파일 1840 · `/profile` 첫 99.61 · 진입 118.67 · `/catalog` 99.66 · `/studio` 진입 127.34 · 렌더 JS 83.03 · CSS 8.75.

## 순서 = SPEC 7.4 S0~S6 (단계마다 PROGRESS·6.2 표·명시 경로 커밋, 각 단계 RED 전 새 테스트 수 예측 커밋)
- S0 기준선: `check-bundle-size.mjs`에 `/profile (3안 있음)` 시나리오와 비교 청크 afterAction 키 **추가만** 허용(측정 범위 확대). 예산 값·한도·판정 로직 변경 금지. 실측 ≈121.11 확인, 다르면 PROGRESS에 실측값 기록(SPEC 정정은 Jarvis).
- S1 시제품 예산 실측(iframe 0). 6.2 멈춤선 하나라도 넘으면 배치 변경 ≤2회, 그래도 넘으면 **구현 중단·보고**.
- S2 대화상자·비교 전용 프레임 다리(StructureCanvas·/studio 무변경) → S3 상태·알림·폴백·캡션 → S4 선택 연동·접근성 → S5 브라우저 B1~B5 4폭(1280·1024·768·390, 앱 안 클릭으로만 이동·새로고침 금지) → S6 전체 vitest 기본 1회 exit0·Errors0(부하 타임아웃이면 실패 파일 단독 후 전체 1회 재시도·원시로그), Codex review --scope branch --base 48487d5 실제 완료(라운드 ≤3) → REPORT.

## 제약
- sandbox `allow-scripts`만, `allow-same-origin` 금지, postMessage 출처·소스 검증 재사용, 미리보기 비대화형(inert). 저장소 쓰기 0(순수 변환). 렌더 문서 JS/CSS 변화 0(변화 시 멈춤).
- 첫 화면 증가 0 원칙, 다른 화면 ±30B, 예산 상향·ADR 수정 금지. 4a 폰트·4b 모션(캔버스 최종 상태) 동작 불변.
- 단언 약화·skip 0, 깨질 기존 테스트(7.3)는 의도 유지 이관·전후표.
- package*.json/lock·CLAUDE.md·docs/design·docs/decisions 수정 0, 새 의존성·아이콘 0. 서브에이전트 0, 4337/4339 loopback·자기 PID cwd 확인 종료·lsof 0, main 5480 무접촉, push/merge/삭제 0, 승인 실패 우회 금지.
- 70턴부터 새 범위 확장 금지·검증/REPORT 마감 우선. REPORT(한국어): 실제 meta·커밋표·CMP-AC별 근거·6.2 표 baseline/최종·test delta·Codex·한계·책임/환경.
