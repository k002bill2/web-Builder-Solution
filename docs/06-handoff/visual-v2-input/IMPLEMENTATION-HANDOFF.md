# IMPLEMENTATION-HANDOFF — design-apply-check (짧은 판)

근거 전문: `REPORT.md`. 기준 main 9bcf0d2. 모든 경로는 `app/src/` 기준.

## 레인 A — 화면 시각 적용 (지금 착수 가능, engine·PageDoc 무관)
(REPORT 2절 묶음 1~5 순서대로. 각 묶음 = 한 커밋, 완료 기준 = typecheck·lint·표적 test·build + 1280/390 캡처 1회)

1. **밀도·타이포 기반** — `styles/tokens/base.css`(body 14) · `components/ds/{Button,TextField,Checkbox}.tsx`(lg 40·필드 40·체크 16) · `components/layout/AppHeader.tsx:38`(`text-body3`). Chip 불변. a1-β보다 먼저 병합.
2. **카탈로그** — `components/catalog/ReferenceCard.tsx:103`(`ds-body2 font-semibold`) · `CatalogHero.tsx:29`(`size="md"`).
3. **상세** — `components/detail/DetailSidebar.tsx`(1280 버튼 `mt-auto`) · `pages/ReferenceDetailPage.tsx:26,62`(태그 중립/보라)·`:82`(`text-primary-text`).
4. **비교 보드** — `components/compare/ComparisonTable.tsx:113`(바깥 테두리 제거) · `PickButton.tsx`(테두리 제거·`h-8`) · `pages/CompareBoardPage.tsx:163`(패널 300). `features/compare/*`·`data/*` 금지.
5. **프로필** (ui-2a04c 병합 뒤) — `ProfilePage.tsx:191`(왼쪽 340) · 패널 h2 `ds-heading1` · 현재 배지 violet · 링크 `text-primary` → `text-primary-text` + 가드 테스트.
- 1~4는 파일이 겹치지 않아 병렬 가능(worktree 격리). 번들 여유 0.4~0.6KB라 병합은 1→2→3→4 순, 병합마다 `npm run build` 재실측.
- 결정 필요(막지 않음): Chip 28px(B-4), 비교 필 문구 C-05, 툴바 캡션 유지 여부.

## 레인 B — 편집기 a1-α (지금 착수 가능, 새 파일만)
1. `data/projectRepository.ts` — SPEC 8.3 인터페이스·오류 코드(문서 타입은 제네릭, engine import 0).
2. `domain/projectName.ts`, `features/projects/{projectListView,useProjectList,renameDraft}.ts`.
3. `components/projects/{ProjectList,ProjectRow,RenameField}.tsx`, `pages/ProjectsPage.tsx` — 라우트 연결은 하지 않는다.
4. `components/studio/StudioEmptyStates.tsx`, `features/studio/{saveStatusText,useAutosaveScheduler}.ts`.
- 수용: J-AC-02·03·08·10, E-AC-01·02·07·09·12를 목 저장소·가짜 타이머 테스트로 RED→GREEN.
- 금지: `engine/**`, `app/routes.tsx`, `components/layout/*`, `data/studioStore.ts`·`memoryStudio.ts`, `features/compare/*`, `pages/ProfilePage.tsx`·`features/profile/*`·`components/profile/*`, `domain/generation.ts`·`profileDraft.ts`.

## 순차 (병렬 불가)
- **a1-β**: ui-2a04c 병합 뒤 한 레인. 번들 실측 → `engineImportGuard.test.ts` 개정(lazy `/studio`·`/projects` 청크 허용) → store → routes/AppHeader/AppLayout → 보드 확정 트랜잭션 → 12.4 테스트.
- **a2 → a3 → a4**: 2a-04c 와이어프레임 렌더러 + a1-β 뒤. a2 착수 전 Q-17(DocStart 3인자)·Q-21(변형 매핑) 결정, a3 전 Q-19(purpose 파생)·addSection 5인자 SPEC 반영.

## 사용자 결정 필요 (막는 것만)
- Q-17·Q-19·Q-21 승인(제안은 REPORT 3.2). **시각 적용 레인과 a1-α는 막지 않는다.**