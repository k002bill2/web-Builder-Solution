# RS6-L0-SLIM BRIEF — S6c 감량 1회 실측 (Developer, 측정 전용 · 앱 커밋 0)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17 (영환님 MQ-6-6 "1" — 감량 1회 실측 후 재판정)
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs6-l0-slim` (브랜치 `k002bill2/rs6-l0-slim`, base origin/main `0143c032`). `app/node_modules` 설치 완료. `git apply --check dev/active/rs6-l0-measure/patches/s6c.patch` 통과 확인.
입력: `dev/active/rs6-l0-measure/REPORT.md`(L0 FAIL — S6c 정규화 128.75 > 128.53 · raw 130.06 > 130 · 복원 131.74 > 131.51, 2절 청크 구성 · 감량 후보 ①②③ · 5절 UNMEASURED), `patches/s6c.patch`, `tools/chunks.mjs`. 설계 `docs/design/restart/INTEGRATE-6.md` r1 2.2-2·9.2.

## 목표
S6c 대비 **정규화 −0.22 이상(복원 −0.23 이상) · raw −0.06 이상**. 동작·코어 불변식(I1·I2·G1·G7)·MQ-6 결정 범위 변화 0.

## 절차
1. CP1: base build 재현(128.09/129.40). `s6c.patch` 적용 → S6c 재현(128.75/130.06 ± 잡음 기록, 다르면 원인 기록). 테스트 tsc 16건 실패는 기존과 같으면 L0 방식대로 tsc 단계만 빼고 빌드.
2. CP2: 감량 후보를 **하나씩** 적용·build 실측(정규화·raw·복원·다른 라우트 첫 화면):
   - ① `memoryProjectRepository` 인라인 상태부의 `confirm`·`discard`·`replace` 위임 3개 → `link` 1개
   - ② `view()` 객체 구성 축소(진입에서 필요한 필드만 동기, 나머지 lazy 조립)
   - ③ `useDocSave` 남은 `resolve`·`latest` 경로를 코어 경유로 축소
   - ④ (선택) 코어 상태부를 `memoryProjectRepository` 인라인에서 별도 모듈로 두되 진입 closure 밖(첫 `edit` 동기 요구 때문에 불가하면 근거만) · react 청크 +53B 원인 조사(청크 경계)
   - 효과 있는 것만 남기고 조합 1회 build. 동작이 바뀌는 감량(편집기 진입 뒤 첫 편집 지연 등)은 적용 금지, 별도 B표.
3. CP3: 결과 패치 `patches/s6c-slim.patch` 보존 → 자기 변경만 복원(`git checkout -- <경로>`·새 파일 삭제, reset/clean 금지) → base 재빌드 dist sha 동일 확인.
4. CP4: fresh 게이트 `npm run build`·`typecheck`·`lint`·`npm test -- --run`(317/2856).

## 결론 형식 (REPORT 첫 줄)
`판정선 안: 정규화 X / raw Y / 복원 Z (S6c-slim, UNMEASURED 하한 · 여유 정규화 a · raw b)` / `여전히 초과: 정규화 +X · raw +Y`.
UNMEASURED(이미지 바인딩·상태 표시·이탈 경고)를 더하면 여유가 충분한지 L0 REPORT 5절 기준으로 추정 1줄(추정 표기).

## 금지
- 앱 코드 커밋 0(최종 `git diff -- app/` 빈 출력). 기준선·ADR·`m2cBaseline`·시나리오 한도·`check-bundle-size.mjs`·`bundleBudget*`·SPEC·INTEGRATE-6·MQ-6 수정 0. 새 의존성·push·merge·원격 쓰기·다른 워크트리 접촉·Codex·브라우저 0.
- 감량은 이 레인 1회분(후보 조합 포함)만. 서브에이전트 불필요(빌드 직렬).

## 산출물
- `dev/active/rs6-l0-slim/{PROGRESS,REPORT}.md`, `raw/`, `patches/`. 명시 경로 커밋, CP마다.
- 첫 3턴 BRIEF·PROGRESS 커밋. 55턴부터 새 후보 중단 → 원복·게이트·REPORT. 최대 70턴.
