# PROFILE-HEADROOM-2 — 3안 결과 카드·표 지연 로드로 `/profile` 여유 확보 (Developer 브리프)

> 발행: Jarvis, 2026-09-27 · 영환님 ★A. 작업 공간 `profile-headroom-2`(브랜치 `k002bill2/profile-headroom-2`, base main `1d5ae03`). 포트 **4345**. 동시 실행 레인 없음(A2-S는 이 레인 병합 뒤 재개).

## 왜
- main `/profile` 진입 직후 **124.70KB(여유 0.30)**. studio만 바꿔도 청크 분할 요동(±0.02~0.03)으로 멈춤선(0.3)에 걸려 A2-S S2~S6·a3가 막힌다(`dev/active/editor-a2-shell/REPORT.md` 4절).
- 직전 레인 기록(`dev/active/profile-headroom-c6/REPORT.md` 3절): 편집 시작 실패 분기(~0.1KB)를 `import()`로 옮기면 로더·mapDeps 비용 때문에 **+0.15 역효과**. 교훈: **옮기는 코드가 gzip 0.2KB 이상이어야** 이득.
- 이번 후보(Jarvis 코드 확인): `profileEngine` 청크 모듈 gzip — `CandidateCard` 1998B · `CandidateTable` 1099B(합 ~3.1KB, 의존 모듈 포함 시 더 클 수 있음).
  - `CandidatesSection.tsx:123` `{job && (<ul aria-label="3안">…<CandidateCard …/>)}` — 카드는 **job이 있을 때만**.
  - `:171` `{job && isTerminal(job.state) && !allFailed && <CandidateTable …/>}` — 표는 **작업 종료 뒤에만**.
  - 즉 처음 프로필에 들어와 3안을 만들기 전에는 둘 다 필요 없다.

## 목표 (수용 기준)
1. `/profile` 진입 직후 **≤ 123.90KB(여유 ≥ 0.80)**, 첫 화면 증가 0, 다른 화면·공통 증가 0(±0.01 해시 요동 허용).
2. 동작·문구·접근성 **불변**: 3안 목록 `aria-label="3안"`, 카드 선택·busy·selected, 표, "B안으로 편집 시작" 흐름, 실패 Callout. 기존 테스트 단언 약화·삭제·skip 금지 — 카드가 비동기로 나타나 `getBy`가 실패하면 **`findBy`/`waitFor`로 기다림만** 바꾼다(단언 내용 동일). 바꾼 테스트 목록을 REPORT에.
3. 이미 job이 있는 상태로 프로필에 들어오면(3안을 만든 뒤 편집기에서 돌아오기 등) 카드 청크가 로드되는 동안 **기존 로딩 표현(`LoadingState` 또는 skeleton DS 컴포넌트)** 을 보이고, 레이아웃이 크게 튀지 않게 한다. 로드 실패는 기존 `retryableImport` 방식을 따르고 사용자에게 다시 시도 경로를 준다(기존 패턴 재사용, 새 문구가 필요하면 `generationText.ts`에).
4. **전체 `npx vitest run` 3회 연속 실패 0**(`logs/full-x3.txt`).

## 방법 (권장 순서, 실측으로 판단)
- **1안(권장)**: 카드 목록 + 표를 새 모듈 `features/profile/CandidateResults.tsx`로 묶고 `CandidatesSection`에서 `React.lazy`(또는 `retryableImport` 기반 로더)로 부른다. `Suspense` fallback = 로딩 표현. 3안 만들기 버튼 onClick 때 **미리 로드(prefetch)** 를 시작해 체감 지연을 없앤다.
- **2안**: 1안의 새 청크 대신, 이미 "3안 만들기" 때 로드되는 `loadGenerate`(`data/writeBodyLoader.ts:16` → `data/memoryGenerate`) 경로에 합류. 데이터 청크에 UI를 섞는 구조라 1안이 목표 미달일 때만.
- 첫 커밋 전에 **임시 실측**으로 1안 효과를 확인(로그 `logs/h1-measure.txt`: profileEngine·새 청크 gzip, `/profile` 진입). 목표 미달이면 그 수치와 함께 2안 시도, 그래도 미달이면 달성치로 커밋하고 REPORT(0.3 미만이면 즉시 중지).
- `Wireframe` 등 CandidateCard가 export하는 것을 다른 파일(편집기 `components/studio/**`, profileEngine 등)이 정적 import하면 지연 로드 효과가 사라진다 — `grep -rn "CandidateCard" app/src` 로 먼저 확인하고, 공유 부분이 있으면 공유 부분만 남기는 방식으로. **studio 파일은 수정 금지**(필요하면 멈추고 보고).

## 체크포인트 (끝날 때마다 커밋)
- **P0** base build → `dev/active/profile-headroom-2/logs/base-build.txt` + PROGRESS 수신.
- **P1** 실측·구현(위 방법) → build 판정 → 커밋.
- **P2** 테스트 기다림 조정(필요 시)·새 테스트(RED→GREEN: 결과 청크 로드 전 로딩 표현, 로드 후 카드 3개, 실패 시 다시 시도) → 커밋.
- **P3** 전체 vitest 3회 → final build → REPORT.

## 금지·운영
- 소유: `features/profile/**` · `pages/ProfilePage.tsx` · `pages/Profile*.test.tsx` · 필요 시 `data/writeBodyLoader.ts`(2안일 때만). 그 밖 앱 코드·`components/studio/**`·`features/studio/**`·`pages/StudioPage.tsx`·`engine/**`·`design/`·`docs/design/` 수정 금지.
- 예산(ADR-004) 변경 금지. 새 의존성·새 아이콘 금지. TDD RED→GREEN(로그 보존).
- **서브에이전트 금지.** 로컬 커밋 `git commit -- <경로>`. push·병합·삭제 금지. 브라우저 흐름 검증은 하지 않는다(병합 뒤 QA).
- `--max-turns` 45 · **32턴부터 REPORT 우선**. REPORT `dev/active/profile-headroom-2/REPORT.md`: SHA·파일·번들 전후 표(청크별)·바꾼 테스트 목록(기다림만)·RED/GREEN·3회 결과·남은 위험. Codex는 이관(Jarvis가 병합 전 판단).
