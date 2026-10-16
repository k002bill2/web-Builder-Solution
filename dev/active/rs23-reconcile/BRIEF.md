# RS23-RECONCILE BRIEF — rs23-impl ↔ main(RS4 병합본) 대조 (QA, 읽기 전용 판정)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis (2026-10-16)

## 목적
RS4(SPEC-4 r0.3a CP1~3)가 PR #6으로 `main`(`d09f0cd9`)에 병합됐다. 미병합 브랜치 `k002bill2/rs23-impl`(`7d16fac5`, SPEC-3 r0.3 구현)은 같은 문제를 별도 기억 체계(`unconfirmedStart`)로 구현했다.
**main에 RS23 전용 동작·회귀 테스트 중 빠진 것이 있는지 판정**하고, 이식 필요 목록을 만든다. 최종 결정(rs23-impl 폐기 또는 이식 레인 발주)은 Jarvis·영환님이 한다.

## 대상
- 저장소 워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs23-reconcile` (브랜치 `k002bill2/rs23-reconcile`, base `origin/main` `d09f0cd9`)
- 비교 대상 ref: `k002bill2/rs23-impl` (같은 저장소의 로컬 브랜치 — `git show k002bill2/rs23-impl:<path>`로 읽는다. 체크아웃·수정 금지)
- 정본: `docs/design/restart/SPEC-3.md` 7절 RS3-AC 표(18개), `docs/design/restart/SPEC-4.md`(SPEC-3 대체 규칙·RS4-AC 표), `dev/active/rs23-impl/REPORT.md`는 rs23-impl 브랜치 안에 있다.

## 범위
1. RS3-AC-01~13(07b~07e·08b 포함) 각각에 대해 판정한다:
   - `main 충족` — main 테스트/코드 경로·라인 근거 제시
   - `SPEC-4가 대체` — SPEC-4가 그 규칙을 바꾼 근거(절·RS4-AC) 제시. 대체되었으면 이식 대상 아님
   - `main 누락` — rs23-impl의 대응 테스트/코드와 main에 없는 이유
   - `미확인` — 근거 부족
2. rs23-impl 고유 테스트(`createLock.test.ts`, `unconfirmedStart.test.ts`, `ProfileCreateStart.test.tsx`, `ProjectRow.test.tsx`)의 `it(...)` 단위로 위 판정을 매핑한다.
3. **실행 증거(권장):** `app/`에서 `npm ci` 후 main 기준선 게이트 `npm run typecheck`, `npm run lint`, `npm test -- --run`을 1회 실행해 수치를 남긴다. 누락 후보 테스트는 **임시로만** main 코드에 맞게 옮겨 실행해 RED/GREEN을 확인할 수 있다 — 확인 뒤 반드시 되돌리고 커밋하지 않는다(`git status`로 app/ 변경 0 확인).
4. 예산 판정선·ADR·SPEC 수정 금지.

## 제외
- 앱 코드·테스트 수정 커밋 금지(이식은 별도 Developer 레인).
- `k002bill2/rs23-impl` 브랜치 체크아웃·리셋·삭제·push 금지. 원격 쓰기 전부 금지.
- Codex 리뷰 실행 금지(사용량·이번 범위 밖).
- 다른 워크트리·세션 접촉 금지.

## 산출물 (이 워크트리 안)
- `dev/active/rs23-reconcile/REPORT.md`:
  0. 결론 1~3줄: `rs23-impl 폐기 가능` / `이식 필요 N건` / `판정 불가`
  1. RS3-AC 매트릭스(AC · 판정 · main 근거 · rs23-impl 근거 · 비고)
  2. rs23-impl 고유 테스트 `it` 매핑표
  3. 이식 필요 목록(우선순위 P1/P2, 예상 파일, 예산 영향 추정 — 추정이라고 표기)
  4. 실행한 명령·exit code·수치(실행 못 한 것은 미실행으로)
  5. 사실/추정/미확인 구분
- `dev/active/rs23-reconcile/PROGRESS.md`: 체크포인트마다 갱신.
- 로컬 커밋 1개(`dev/active/rs23-reconcile/`만, 명시 경로 `git add`). `package-lock.json` 등 설치 부산물은 커밋 금지.

## 체크포인트
- CP1: AC 매트릭스 초안(정적 대조) → PROGRESS 갱신
- CP2: 게이트·임시 RED/GREEN 실행 → PROGRESS 갱신
- CP3: REPORT 완성 → app/ 변경 0 확인 → 커밋

## 수용 기준
- RS3-AC 18개 전부 판정이 있다(빈칸 0).
- 모든 `main 충족`·`SPEC-4가 대체` 판정에 파일:라인 또는 SPEC 절 근거가 있다.
- 최종 `git status --porcelain`에 `app/` 변경 0, 커밋은 `dev/active/rs23-reconcile/`만 포함.

서브에이전트 분할: 권장(읽기 전용 — AC 그룹별 대조 ①01~06 ②07~07e·08b ③08~13, 최대 3개) / 결과 통합·실행 검증은 메인이 직접.
