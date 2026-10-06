# STUDIO-OFF3 Developer 브리프 — `/studio` 진입 청크 구조 점검 + 동작 변화 0 감량

- 역할 Developer / Orca managed Claude Code / worktree studio-off3 / base `713947d`(origin 반영, M3′ 마감). `app/node_modules` lock 그대로 `npm ci` 완료.
- 영환님 ★A(2026-10-06): 다음 마일스톤 = `/studio` 진입 청크 구조 점검·감량. 목적: 편집기 백로그 B-M3P-06(업종 문구)·B-ER-08(필드 편집 묶음)·B-ER-09(더보기)를 열 예산 확보.
- 현황: `/studio/:projectId` 진입 **128.67 / 한도 129**, M2c 기준선 128.67 + 0.03 → 판정선 128.70(`app/scripts/m2cBaseline.json`). 첫 화면 91.79/100. 렌더 84.19/8.85.
- 근거: `docs/decisions/ADR-004-performance-budgets.md` 개정 4 결정 3·개정 5 결정 5(**다음 상향 요청은 구조 점검 결과와 함께만**)·개정 6. 이전 점검: `dev/active/er-off/REPORT.md`(동작 변화 0 상쇄 최대 −0.16, 자동 저장 지연 −0.77 = 동작 변화)·`dev/active/er-off2/REPORT.md`(A1+A2 적용). **같은 결론 반복 금지 — 그 뒤 추가된 ER-2~4b·M3′ 코드 기준으로 새로 측정.**

## 1단계 — 구조 점검 (L1 실측, 코드 변경 전)
- `npm run build` 후 `dist/.vite/manifest.json`으로 `/studio` 진입 정적·자동 동적 closure의 **청크별·모듈별 gzip 기여 표**(상위 30, 모듈 단위는 `vite build --sourcemap` 또는 rollup 메타로 추정 — 방법 명시). 각 모듈: 첫 화면 필요 여부(첫 페인트·첫 상호작용 전에 쓰이는지)·다른 라우트 공유 여부·지연 가능성.
- 분류: (A) 동작 변화 0 감량(죽은 export·중복 모듈·잘못된 청크 배치·공유 청크 분리·첫 화면 밖 코드의 지연 import 중 사용자 체감 변화 0) / (B) 체감 변화가 있는 지연(첫 상호작용 지연·표시 지연 — 변화 내용 정확히) / (C) 예산 상향만 가능한 몫.
- 결과 `dev/active/studio-off3/AUDIT.md` 커밋(첫 결과물, 30턴 전).

## 2단계 — (A)만 적용
- (A) 항목을 하나씩 적용·실측(표: 단계·변경·`/studio` 진입·다른 라우트 영향). 다른 라우트 증가 0(±0.03 해시 잡음 규칙 — ADR 개정 5 결정 3). 테스트 단언 변경 0이 원칙 — 모듈 경로 이동으로 mock 경로만 바뀌는 경우는 기록.
- **기준선 파일(`m2cBaseline.json`) 수정 0** — 감량 결과로 생긴 여유를 다음 레인 몫으로 배분하는 것은 Jarvis·영환님 결정.
- (B)·(C)는 적용하지 말고 AUDIT.md에 예상 감량·체감 변화·위험으로 정리(영환님 결정 자료).

## 검증·Ego Lite
- 마감: typecheck·lint·build(번들 표 전 행) · 전체 vitest 1회 exit0 · Codex review --scope branch --base 713947d 실제 완료(≤2) · REPORT.
- **Ego Lite(영환님 지시)**: build + `vite preview --port 4337`(dev 금지), 창 minimized면 `Browser.setWindowBounds normal`, 캡처 `captureBeyondViewport:false`+뷰포트 clip(fullPage 금지), 첫 goto 1회 뒤 앱 안 클릭만. 편집기 진입(카탈로그→프로필→3안→편집 시작 또는 기존 경로) 후 지연 처리한 기능이 실제 동작하는지(테마·스냅샷·실행 취소·내보내기 진입 등 건드린 것만) 확인·캡처 ≤3장(`dev/active/studio-off3/shots/`). 끝나면 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.

## 금지·운영
- 동작 변화 있는 변경((B)) 적용 0, 엔진·PageDoc 계약·`docs/**`·lock·CLAUDE.md·`m2cBaseline.json`·`check-bundle-size` 판정 수정 0, 새 의존성 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지.
- **첫 3턴 안에 BRIEF P0 커밋.** **턴 관리:** AUDIT.md는 30턴 전 커밋, 45턴 도달 시 새 감량 중단 → Ego Lite → vitest → Codex → REPORT. REPORT 초안 50턴 전 커밋.
