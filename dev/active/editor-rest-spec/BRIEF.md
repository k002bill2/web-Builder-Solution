# EDITOR-REST-0 Designer 브리프 — 편집기 잔여(a3-3 테마 · a4 게이트 표시·내보내기·스냅샷) 실렌더 기준 재명세·계획

- 역할 Designer / Orca managed Claude Code / worktree editor-rest-spec / base `14fd5e2`(M2c·정리 완료, origin 반영). 코드 0. `app/node_modules` lock 그대로 `npm ci` 완료(화면 확인용).
- 영환님 ★A(2026-10-06): 다음 마일스톤 = 편집기 잔여. `DEVELOPMENT_PLAN.md` 28·36행 "a3-3·a4는 M2a 뒤 실렌더 기준으로 다시 브리프". 목업 모양 복제 금지, 기능·솔루션 우선.

## 1단계 — 지금 사실 확인 (L1, 코드 읽기·화면)
- 원 명세: `docs/design/2a-05/SPEC.md` r4.7 5.8 테마 · 5.9 이미지(→ M2c로 대체됨, `docs/design/m2c/SPEC.md` r3) · 5.10 자동 저장 · 5.11 스냅샷 · 5.12 품질 게이트 · 5.13 내보내기 · 5.14 실행 취소 · E-S·E-AC 목록. 원 브리프 `docs/06-handoff/EDITOR-A3-3_BRIEF.md`(번들 숫자는 낡음 — 현재 ADR-004 개정4·M2c 기준선 파일 127.39).
- 이미 구현된 것 / 일부 / 미구현 표를 만든다: 테마 바꾸기(`swapTheme`), 게이트 표시(현재 패널·차단 목록), 정적 HTML·PNG 내보내기(M2a~M2c), 스냅샷(`restoreSnapshot` 미구현 — m2c-specfix MQ·m2c-reqa 기록), 자동 저장, 실행 취소. grep·파일 경로로 근거.
- 막힌 검증과의 연결: B-M2C-09(⑩ 동일성·QB-10 정적 HTML 개수 문구 — 시드 문서 게이트 차단), QB-10 스냅샷 보조 경로, B-M2B-09. 시드 문서가 대비 AA·SEO로 막히는 원인(시드 데이터 vs 게이트 규칙)과 사용자가 편집기 안에서 해소할 수 있는 경로가 있는지 확인.
- 화면 확인 필요 시 **Ego Lite**: 빌드+`vite preview`(4337 loopback — PNG·정적 HTML은 dev 서버에서 설계상 실패, m2c-e1 REPORT) 앱 안 클릭만, 끝나면 이 레인이 연 창·탭 모두 `finish({keep:[]})` · `listTaskSpaces()`=[] 재확인 기록, 자기 서버 종료·리슨 0. 영환님 창·main 5480 무접촉.

## 2단계 — 산출 (쓰기: `docs/design/editor-rest/`, `docs/04-plan/EDITOR_REST_PLAN.md`, `dev/active/editor-rest-spec/`만)
1. `docs/design/editor-rest/SPEC.md`: 실렌더 기준 재명세 — 테마 바꾸기(실렌더 캔버스·3안 비교와의 관계·되돌리기), 스냅샷(수동·자동·복원·이미지 맵/잃은 이미지와의 관계 — MQ-S1 A 전제), 게이트 표시(차단 사유를 편집기 안에서 해소하는 길 — 예: 대비 보정 진입, SEO 메타 입력 위치), 내보내기 잔여(이미 된 것 제외), 실행 취소 경계. 각 항목 수용 기준(ER-AC [U]/[G]/[B])·QB·깨질 기존 테스트 예상·접근성(포커스·라이브 영역)·예산 배치(`/studio` 진입 127.05 · 기준선 파일 127.39 · 여유 0.34 — 새 UI는 조작 뒤 청크).
2. `docs/04-plan/EDITOR_REST_PLAN.md`: Developer 레인 분할(각 레인 1산출물, 50~70턴 안), 순서·병렬 가능 여부(쓰기 경로), 레인별 시간 추정(추정 표기), QA 게이트(preview 환경 명시).
3. `docs/design/editor-rest/MQ.md`: 영환님 결정 필요 항목만(번호 선택지 ★추천·트레이드오프·사실/추정). 예산 상향·엔진/PageDoc 계약 변경·새 의존성·백엔드(문서 영속)는 반드시 MQ로.
4. `dev/active/editor-rest-spec/{PROGRESS,REPORT}.md`.

## 금지·운영
- 코드·package*.json/lock·CLAUDE.md·`docs/decisions/`·`docs/06-handoff/BACKLOG.md` 수정 0. 외부 크롤링·GDWEB/dbcut 0, APFS 브랜드 0.
- 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지. Codex review/adversarial 1~2라운드 실제 완료만 기록.
- **턴 관리:** 50턴부터 새 조사 중단·REPORT 마감 우선. 한국어 보고.
