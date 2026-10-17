# RS6-L0 BRIEF — 저장 코어 연결 측정 관문 (Developer, 측정 전용 · 앱 커밋 0)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs6-l0-measure` (브랜치 `k002bill2/rs6-l0-measure`, base origin/main `2c1796a2`). `app/node_modules` 설치 완료.
영환님 결정(2026-10-17 "★A 일괄 + L0"): MQ-6-1·2·3·4·5·7 = A, **L0 측정만 승인**. 예산(MQ-6-6)·판정선 상향·L1~L5 구현은 미승인. 결정 기록 = `docs/design/restart/MQ-6.md` "결정 기록"(Jarvis가 이 브랜치에 추가 — 커밋되어 있음).

## 정본
- `docs/04-plan/RS6_INTEGRATE_PLAN.md` **1절 L0 표(CP1~CP4)를 그대로 수행**한다.
- `docs/design/restart/INTEGRATE-6.md` r1 — 2.2-2(코어 동기 생성 + seed · 레지스트리 = 저장소 인스턴스 · 포트 없는 save), 7절(CP4 흡수 · 상쇄 조건), 9.2·9.3(진입/조작 뒤 배치 · S6a~S6d), D6-10.
- 코어: `dev/active/save-core-fix/` core·MINIMAL-CONTRACT. 기존 실측: `dev/active/rs4-cp4-measure/REPORT*.md`·`patches/`(CP4 대체 코드 위치), `dev/active/rs5-spike/REPORT.md`·`tools/`.
- 판정선: `/studio` 정규화 ≤128.53 · 복원 ≤131.51 · raw 한도 130/134. base 기대 128.09/129.40 · 131.07/132.43. 다른 라우트 첫 화면 100(catalog 101)·진입 125.

## 규칙
- S6a~S6d는 **실제 동작 수준 코드**로 붙인다(코어 상태부·레지스트리·포트 io·편집기 배선). 빈 stub을 완성 바이트로 제시 금지 — 못 붙인 부분은 `UNMEASURED` 표. typecheck 통과로 실제 코드임을 보장(테스트 정합성은 범위 밖).
- **S6c 제거 목록을 REPORT에 파일:행으로 고정**(상쇄는 L3가 같은 목록을 머지할 때만 유효).
- 감량 1회만. 그 뒤 초과면 중단, 정규화·raw 수치와 바이트 구성(청크별)을 REPORT에.
- 각 시나리오 패치를 `dev/active/rs6-l0-measure/patches/`에 보존 → 자기 변경만 복원(`git checkout -- <경로>`, 새 파일은 삭제 — reset/clean 금지) → base 재빌드 수치·dist sha 동일 확인.

## 결론 형식 (REPORT 첫 줄)
`판정선 안: S6c 정규화 X / raw Y` / `상향 필요: 정규화 +X KB · raw 한도 +Y KB (S6c 기준, UNMEASURED 하한)` / `판정 불가(사유)`.

## 금지
- 앱 코드 커밋 0(최종 `git diff -- app/` 빈 출력). 기준선·ADR·`m2cBaseline`·시나리오 한도·`check-bundle-size.mjs`·`bundleBudget*`·SPEC·INTEGRATE-6·MQ-6 수정 0. 새 의존성 0. push·merge·원격 쓰기 0. 다른 워크트리 접촉 0. Codex 0. 브라우저 QA 0.

## 산출물·체크포인트
- `dev/active/rs6-l0-measure/{PROGRESS,REPORT}.md`, `raw/`, `patches/`, 필요 시 `tools/`(기존 도구 사본). 명시 경로 커밋.
- 첫 3턴 BRIEF·PROGRESS 커밋 → CP1 base 커밋(10턴 전) → CP2 S6a 커밋 → CP3 S6b·S6c 커밋 → CP4 S6d·원복 커밋. 75턴부터 새 실험 중단 → 원복·게이트·REPORT.
- 마지막 fresh: `npm run build`(base 재현) · `npm run typecheck` · `npm run lint` · `npm test -- --run`(기대 317 files / 2856 tests).
- REPORT: 결론 · CP별 표(정규화·raw·복원·다른 라우트) · 청크 바이트 구성 · S6c 제거 목록 · UNMEASURED · 사실/추정/미확인.
서브에이전트 분할: 불필요(빌드 직렬 · 같은 파일 순차 편집). 읽기 전용 코드 조사 1개는 허용.
