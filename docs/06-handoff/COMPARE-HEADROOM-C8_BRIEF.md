# COMPARE-HEADROOM-C8 — `/compare` 첫 화면 여유 확보 (a1-β 선행)

## 책임/목표
- 책임 Developer / 실행 Orca + Claude Code. 보고 대상 Jarvis. 기준 main `5562dc2`. 작업 공간 `compare-headroom-c8`. 포트 4339.
- 배경: a1-β 0단계(`k002bill2/editor-a1-beta` `9d1ae3e`, `dev/active/editor-a1-beta/REPORT.md` — 이 worktree에는 없으니 `git show k002bill2/editor-a1-beta:dev/active/editor-a1-beta/REPORT.md`로 읽기)가 공통 JS **+0.20**으로 `/compare` 첫 화면 여유 0.15 → 불합격. S-B9(보드 확정 대상 UI, 첫 화면 +0.10~0.20 L3)도 남아 있다.
- **목표(수용 기준)**: 이 브랜치 단독으로 `/compare`·`/compare (조정 있음)` 첫 화면 **−0.45KB 이상**(99.66 → ≤ 99.21), 다른 모든 라우트 첫 화면·진입 직후 **증가 0**(또는 여유 ≥ 0.3 유지), 동작·접근성 불변. 예산 상수·분류 규칙·`check-bundle-size.mjs` 변경 금지.

## 방법 (순서대로, 앞 단계로 목표 달성하면 멈춘다)
1. **C8** (`docs/perf/bundle-01/REPORT.md` 156·167행): 보드 준비(엔진 로드) 뒤에만 그려지는 페이지 컴포넌트(`components/compare/DraftPanel`·`DraftItem`·`DraftSummaryBar` 등)를 엔진 청크(`features/compare/boardEngine.ts` 동적 그래프)로. 추정 첫 화면 −0.8~−1.2(L3, 실험 안 됨). 진입 직후는 거의 불변 예상 — 실측.
   - 먼저 **로딩 표시 구간이 이미 있는지** 확인(엔진 로드 전 화면이 이 컴포넌트를 그리지 않아야 한다). 그려야 하면 멈추고 보고.
   - 2a-04b1 FIX3 교훈(`dev/active/2a-04b1/REPORT.md` 14.1): 새 모듈이 저장소·엔진을 직접 정적 import하면 공유 청크가 다시 쪼개져 오히려 늘 수 있다 → 의존은 주입/`import type`, 매 이동마다 build 실측.
2. (1로 부족할 때만) a1-β에서 확인된 **routes 비용 +0.11 원인 분해**: lazy 라우트 추가 시 엔트리의 preload 의존 목록(`__vitePreload` deps 배열) 증가인지 확인하는 **측정 스파이크**만 — a1-β 코드를 이 브랜치에 넣지 말고, 임시 브랜치/스태시에서 lazy 라우트 1개를 추가해 공통 증감을 재고 원인·대책(예: 공유 deps 정리)을 REPORT에 L1/L2로 기록. 제품 코드 반영은 하지 않는다.

## 쓰기 범위
- `app/src/components/compare/**`, `app/src/pages/CompareBoardPage.tsx`, `app/src/features/compare/boardEngine.ts`(엔진 청크 진입점 export 추가만), 관련 테스트, `dev/active/compare-headroom-c8/`.
- 금지: `data/**` 저장소 로직, `app/routes.tsx`, `components/layout/**`, `main.tsx`, profile 관련 파일(병렬 레인 `profile-visual-align`이 수정 중), `design/`·`docs/design/`, 번들 스크립트, 가드 완화, 새 의존성·아이콘, engine(`src/engine/**`) 수정.

## 검증
- 매 이동 후 `npm run build` → `[bundle]` 전 시나리오 + 공통 JS 기록(`dev/active/compare-headroom-c8/logs/`). 최종 표: 기준 5562dc2 vs 결과, 첫 화면/진입 직후, 여유.
- TDD: 로딩 구간·엔진 로드 실패 시 표시·기존 보드 테스트 불변(단언 약화·삭제 금지). 전체 vitest 1회·typecheck·lint·build.
- 127.0.0.1:4339 실제 클릭: /compare 진입(로딩 → 보드) · 레퍼런스 담기/빼기 · 요약 바 · 확정까지 1280/390 캡처. 자기 PID만 종료+lsof.
- 서브에이전트 분할: 불필요(한 그래프의 연쇄 실측이라 메인이 직접).
- `--max-turns` 60, 45턴부터 REPORT 우선. 단계마다 PROGRESS 커밋. push·병합·삭제 금지. fable 무접촉.
- REPORT: 로컬 SHA, 변경 파일, 번들 전후 표, 목표 달성 여부, (했다면) routes 원인 분해, 미검증.
