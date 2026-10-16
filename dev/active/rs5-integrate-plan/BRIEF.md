# RS5-INTEGRATE-PLAN BRIEF — 저장 코어 제품 연결 설계·계획 (Designer 주도, 코드 0)

책임 역할: Designer(구조·상태·수용 기준) — 기술 경계는 코드 근거로 / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17 (영환님 "2+1")
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs5-integrate-plan` (브랜치 `k002bill2/rs5-integrate-plan`, base origin/main `c7a7a2a8`). `app/node_modules` 설치 완료(코드 읽기·번들 수치 확인용).
병렬 레인: BACKLOG-RS-STATUS(Developer, `docs/06-handoff/BACKLOG.md`·`dev/active/backlog-rs-status/`) — 그 경로 접촉 금지. 그 결과는 회수 뒤 Jarvis가 반영 요청할 수 있음.

## 승인 범위
- 영환님 "1": 연결 **설계·계획만**. 앱 코드·실험 코드·예산 파일·ADR 수정, 구현 착수, 새 의존성, push·merge 금지. 새 저장소 인터페이스·예산 상향·엔진/PageDoc 계약 변경이 필요하면 **MQ로만** 올린다(실행 승인 아님).

## 입력 (읽기)
- 코어: `dev/active/save-core-fix/{MINIMAL-CONTRACT,REPORT}.md`·core 코드, `dev/active/save-core-final-qa/REPORT.md`(H1~H5 · H4 PARTIAL · BD-1/BD-2 · LV-1/LV-2 · 제품 미통합), `save-core-harness/`·`save-core-qa/` REPORT.
- 설계: `docs/design/restart/CONTRACT-5.md`, `UX-5.md`, `SPEC-4.md`(5.3·5.4·5.6 · RS4-R1/R2), `dev/active/rs5-review/REPORT.md`, `dev/active/rs5-spike/REPORT.md`.
- 예산: `docs/decisions/ADR-004-performance-budgets.md` 개정 13·16, `dev/active/rs4-cp4-measure/REPORT.md`·`REPORT-M2.md`(CP4 전체 +1.20KB, 감량 반영 후 +0.80 하한), 현재 main `/studio` 정규화 128.09/판정선 128.53 · raw 129.40/130.
- 제품 현재 코드(읽기 전용): `projectRepository`·`memoryProjectRepository`·`localSync`·`writeQueue`·`imageOps`·`DocBook`·`useAutosaveScheduler`·`useDocSave`·`StudioLayout`·`features/pending/pendingWrites`·`useStudioDoc`.

## 산출물 (쓰기 = 아래만)
1. `docs/design/restart/INTEGRATE-6.md` — 연결 설계:
   - 코어 ↔ 제품 경계 매핑표(코어 API·불변식 → 제품 모듈·훅·저장소 메서드, 신설/변경/유지 구분, 파일:행 근거).
   - 같은 탭 단일 소유자(BD-1 · CE-3a 다른 어댑터 객체) 해결안 — 제품에서 어댑터가 1개로 보장되는 구조인지 코드 근거로 판정, 아니면 최소안.
   - liveness LV-1·LV-2: 시간 제한·취소·사용자 표시(UX-5 상태 대응) 규칙.
   - H4 다른 탭·낡은 증명: 실제 Web Locks·writerLock과의 결합 규칙.
   - CP4(편집기 인계 · RS4-R1)를 RS5 연결에 흡수할지 판정 — 흡수 시 진입 바이트를 어떻게 공유·상쇄하는지, 별도 유지 시 이유.
   - UX-5 상태표와 화면 버튼 ↔ 코어 메서드 1:1 대응, 문구 재사용, 접근성(status/alert·포커스).
   - 예산: 진입 closure에 들어올 것/조작 뒤 청크로 보낼 것 표, **측정 선행 관문**(Developer 스파이크 시나리오·판정선 128.53/131.51·raw 130/134). 수치 없는 KB 추정 금지 — 기존 실측(rs4-cp4-measure·rs5-spike) 인용만.
   - 수용 기준(RS6-AC [U]/[G]/[B]) · 깨질 기존 테스트 예상 · 데이터 손실 잔존 한계(모바일 종료·크래시).
2. `docs/04-plan/RS6_INTEGRATE_PLAN.md` — Developer 레인 분할(각 1산출물, 50~90턴 안, 4 RED/GREEN 체크포인트 이내), 순서·병렬 가능 여부(쓰기 경로), 측정 관문 레인 우선, QA 게이트(preview 환경·멀티탭 실제 잠금), 시간 추정(추정 표기).
3. `docs/design/restart/MQ-6.md` — 영환님 결정 필요 항목만(번호 선택지 ★추천·트레이드오프·사실/추정). 저장소 인터페이스 변경·예산 상향·엔진/PageDoc 계약·새 의존성은 반드시 MQ로.
4. `dev/active/rs5-integrate-plan/{PROGRESS,REPORT}.md`.

## 운영
- PROGRESS 첫 3턴 커밋 → 코드 trace → 경계표 → 설계 초안 → 계획 → 자체 검토 1회 → REPORT 체크포인트, 각 체크포인트 명시 경로 커밋(`git diff --check`).
- 기존 SPEC·CONTRACT-5·UX-5·ADR·BACKLOG 수정 0(차이·대체는 INTEGRATE-6에 "대체/차이" 절로). 코드 0 · 화면 확인 불필요(실화면 PASS 주장 금지).
- Codex 0(이번 범위 — 독립 검토는 회수 뒤 Jarvis가 별도 QA로).
- 서브에이전트 분할: 권장(읽기 전용 3개 — ① 코어 API·불변식 ↔ 제품 저장 경로 trace ② 편집기 생명주기·스케줄러·pendingWrites·CP4 trace ③ 예산 실측 기록·진입 closure 정리). 최대 3, 쓰기는 메인만.
- 최대 80턴. 60턴부터 새 조사 중단 → 계획·MQ·REPORT 마감. 한국어. REPORT: 결론·MQ 목록·측정 선행 항목·사실/추정/미확인·서브에이전트별 결과.
