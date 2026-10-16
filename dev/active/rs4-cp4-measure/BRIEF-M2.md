# RS4-CP4-MEASURE M2 BRIEF — `/studio` 동작 변화 0 감량 후보 실측 (Developer, 측정 전용)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17 (영환님 "1" — M2만 실측)
워크트리: 이 worktree(`k002bill2/rs4-cp4-measure`, tip `adcbc571`, base `f477c161`). `app/node_modules` 설치 완료.
입력: `dev/active/rs4-cp4-measure/REPORT.md` M0·M1·M2 추정표, `patches/`(M1 배치안 a 패치), `tools/chunks.mjs`, `raw/base-*`.

## 범위 (빌드 직렬, 후보마다 build 실측)
1. **후보 1** preload 중복 제거(`vite.config.ts` `build.modulePreload.resolveDependencies` — 정적 import로 이미 받는 청크 제외). 기본 `/studio`·복원 진입 정규화/raw, 다른 모든 라우트 첫 화면·진입 증감 표.
2. **후보 2** `build.modulePreload.polyfill: false`. 같은 표. modulepreload 미지원 브라우저 영향(지원 목록 근거)을 한 줄로.
3. **후보 4** `writeBodyLoader` 분리(`src/data/writeBodyLoader.ts`). 같은 표. 새 작은 공유 청크·rolldown 런타임 청크 생기면 기각 사유로 기록.
4. 효과 있는 후보 **조합 1회** 빌드(base 위).
5. 조합 + M1 배치안 a 패치(`patches/` 중 a) **합산 1회** 빌드 → 결론 산출.
6. 시간이 남으면 후보 3(react 청크 엔트리 병합)만 추가. 나머지(5·6, B분류)는 실측 안 함.

## 결론 형식 (REPORT-M2.md 첫 줄)
`감량만으로 가능` / `상향 필요: 정규화 +X KB · raw 한도 +Y KB (조합+배치안 a 기준, UNMEASURED 하한)` / `판정 불가(사유)`.
추가로 **CP4와 무관하게** 조합 감량을 main에 적용할 가치(현재 `/studio` raw 여유 0.14KB 확보) 판정 1줄.

## 금지
- 판정선·기준선·`check-bundle-size.mjs`·`bundleBudget*`·ADR·SPEC 수정 0. 앱·`vite.config.ts` 커밋 0 — 패치는 `patches/m2-*.patch`로 보존 후 자기 변경만 복원(`git checkout -- <경로>`, reset/clean 금지). 마지막 `git diff -- app/` 빈 출력.
- 새 의존성·push·merge·원격 쓰기·다른 worktree 접촉·Codex·브라우저 QA 0. 서브에이전트 불필요(빌드 직렬).

## 산출물·턴
- `dev/active/rs4-cp4-measure/REPORT-M2.md`(표·결론·사실/추정/미확인), `raw/m2-*`, `patches/m2-*`, PROGRESS 갱신 — 명시 경로 커밋, 후보마다 체크포인트 커밋.
- 마지막 fresh `npm run build`(base 수치 재현 128.47·131.45) + `npm test -- --run` 1회(315/2842).
- 첫 3턴 BRIEF-M2·PROGRESS 커밋. 45턴부터 새 빌드 중단 → 복원·게이트·REPORT.
