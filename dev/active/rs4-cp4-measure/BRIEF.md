# RS4-CP4-MEASURE BRIEF — 편집기 인계 전체 크기 측정 + `/studio` 동작 변화 0 감량 후보 (Developer, 측정 전용)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs4-cp4-measure` (브랜치 `k002bill2/rs4-cp4-measure`, base origin/main `f477c161`). `app/node_modules`는 Jarvis가 `npm ci` 완료.
영환님 결정(2026-10-17 "1"): 판정선 상향 판단 전에 **실측 숫자**를 확보한다. 상향·구현 승인은 아님.

## 입력
- `dev/active/rs4-cp4/REPORT.md` + `raw/` — 직전 S3 스파이크: 뼈대만으로 정규화 128.66 > 판정선 128.53, raw 130.08 > 한도 130.
- `docs/design/restart/SPEC-4.md` 3.5·5.3·5.4·8.4·9절, RS4-AC-05·06·11·18~23. `docs/decisions/ADR-004-performance-budgets.md` 개정 16(정규화 판정 · 한도는 raw).
- 이전 감량 기록(같은 결론 반복 금지, 지금 코드 기준으로 새로 측정): `dev/active/studio-off3/`, `entry-slim/`, `er-off/`, `er-off2/` REPORT·AUDIT.

## 범위
### M0 — base (코드 변경 0)
`npm run build` 원문 저장(`raw/base-*.txt`). `/studio` 정규화·raw, 복원 진입 정규화·raw, `/profile`·`/projects` 첫 화면/진입 수치 표.

### M1 — CP4 전체 측정 스파이크 (측정용, 커밋 금지)
SPEC-4 5.3·5.4·8.4가 요구하는 **편집기 인계 전체**를 실제 동작 수준으로 붙인다: 진입 시 기억 조회 · "저장 확인 전" 상태 · 저장 확인 버튼(`confirmDoc`/`retry()` 분기) · 경고 · 언마운트 cleanup(`PendingDraft` 보관)·재진입 복원 · 훅 초기 상태 옵션. **빈 stub을 완성 바이트로 제시 금지** — 못 붙인 부분은 표에 `UNMEASURED`로 명시.
- 배치안 2개 이상 비교: (a) S3(동기 조회만 진입 + 본문 lazy) (b) 조회까지 lazy/조건부(기억이 없는 기본 진입 0B 지향) — 각각 기본 `/studio`·복원 진입·`pending 있음` 시나리오(자동 dynamic import 조건 참)의 정규화·raw.
- 테스트 정합성 보장은 범위 밖(측정용). 대신 typecheck는 통과시켜 실제 코드 크기임을 보장.
- 끝나면 스파이크 diff를 `dev/active/rs4-cp4-measure/patches/`에 보존 → 자기 변경만 복원(`git checkout -- app/src` 등, reset/clean 금지) → base 재빌드 수치 동일 확인.

### M2 — `/studio` 동작 변화 0 감량 후보 (측정용, 커밋 금지)
현재 `/studio` 진입 closure 청크·모듈별 gzip 상위 표. 동작·문구·접근성 변화 0인 후보(죽은 export·진입에 끌려온 조작 뒤 전용 코드·공유 청크 분리 등)를 후보마다 **build로 실측**, 효과 있는 것만 표에(정규화·raw 각각, 다른 라우트 영향). 동작 변화가 있는 지연은 적용하지 말고 별도 표(B분류)로 예상치·체감 변화. 패치 보존 후 복원.
- 가능하면 M2 최선 조합 + M1 권장 배치안을 함께 적용한 합산 빌드 1회.

### 결론 형식 (REPORT 첫 줄)
`감량만으로 가능` / `상향 필요: 정규화 +X KB · raw 한도 +Y KB (배치안 Z 기준)` / `판정 불가(사유)`.

## 금지
- 판정선·기준선(`m2cBaseline.json`)·`check-bundle-size.mjs`·`bundleBudget*`·ADR·SPEC 수정 0. 앱 코드 커밋 0(최종 `git diff -- app/` 빈 출력). 새 의존성 0. push·merge·원격 쓰기 0. 다른 워크트리 접촉 0. Codex 0. 브라우저 QA 0.
- 빌드는 직렬(부하 혼선 방지).

## 산출물
- `dev/active/rs4-cp4-measure/{REPORT,PROGRESS}.md`, `raw/`, `patches/` — 명시 경로 add로 로컬 커밋(체크포인트마다).
- REPORT: 결론 · M0/M1/M2 표 · 배치안 비교 · UNMEASURED 목록 · 사실/추정/미확인 · 마지막 fresh 게이트(`typecheck`·`lint`·`npm test -- --run`·`build`, base f477c161 = 315 files / 2842 tests 기대).

## 체크포인트·턴
- 첫 3턴 BRIEF·PROGRESS 커밋 → M0 커밋(10턴 전) → M1 표 커밋 → M2 표 커밋 → 70턴부터 새 실험 중단, 복원·게이트·REPORT.
서브에이전트 분할: 권장(읽기 전용 2개 — ① M1용 SPEC-4 5.3·5.4 요구 코드 경로 조사 ② M2용 `/studio` closure 모듈 조사. 쓰기·빌드는 메인만, 최대 2개).
