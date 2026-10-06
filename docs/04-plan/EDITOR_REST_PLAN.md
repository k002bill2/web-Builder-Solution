# EDITOR-REST 개발 계획 — 편집기 잔여(테마 · 스냅샷 · 실행 취소 · QA)

- 기준 명세: `docs/design/editor-rest/SPEC.md` r0(이하 **ER SPEC**) · 결정 대기: `docs/design/editor-rest/MQ.md`(MQ-R1~R5)
- 작성 2026-10-06 · Designer(EDITOR-REST-0) · base `14fd5e2`
- 시간·턴은 모두 **추정(L3)** — 근거는 비슷한 규모 선례 레인(editor-a3-1·a3-2·m2c-4: 50~100턴, 브리프 상한 100턴)과 ER SPEC 범위 크기. 실측이 아니다.

## 1. 레인 한눈에

| 레인 | 역할 | 산출물 1개 | 선행 | 병렬 | 턴(추정) | 시간(추정) |
|---|---|---|---|---|---|---|
| **ER-1** | QA | B-M2C-09 재검 보고(QB-R1·R2, ER SPEC 2.2 경로 A) | 없음(코드 0) | 모든 레인과 병렬 | 30~45 | 1.5~2.5시간 |
| **ER-2** | Developer | 테마 바꾸기(ER-AC-T1~T7 · G1의 대비 줄) | MQ-R4 | ER-3a와 병렬 | 55~70 | 3~4시간 |
| **ER-3a** | Developer | 스냅샷·충돌 저장소 메모리 구현(ER-AC-S1·S2·S5 저장소 부분) | MQ-R1 | ER-2와 병렬 | 40~55 | 2~3시간 |
| **ER-3b** | Developer | 스냅샷 화면(대화상자·미리보기·복원 · 참조 집합 확장 · ER-AC-S3·S4·S6~S8) | ER-2 · ER-3a 병합 | 없음 | 55~70 | 3~4시간 |
| **ER-4** | Developer | 실행 취소 기록(키보드·다시 실행·더보기·필드 묶음 · ER-AC-U1~U5) | ER-3b 병합 | 없음 | 50~65 | 3~4시간 |
| **ER-5** | QA + Designer 시각 QA | QB-R3~R7 · ER-AC-T8 · ER-AC-C2 재측정 | ER-4 병합 | — | 50~65 | 3~4시간 |

- 직렬 경로(가장 긴 길): ER-2 → ER-3b → ER-4 → ER-5 ≈ **12~16시간(추정)**. 병렬로 줄어드는 몫은 ER-1·ER-3a(약 3.5~5.5시간).
- 각 레인 브리프 상한 70턴 · **50턴부터 REPORT 우선**(이 레인 관례). 넘칠 것 같으면 범위를 줄이고 남은 AC를 BLOCKED로 남긴다(단언 약화 금지).

## 2. 쓰기 경로와 병렬 판정

**판정 기준 파일**: `components/studio/StudioLayout.tsx`(481행 — ER SPEC 1.1). ER-2·ER-3b·ER-4가 모두 여기에 연결선을 단다 → **이 셋은 직렬**. 병렬은 이 파일을 건드리지 않는 레인만.

| 레인 | 쓰는 파일(예상) | StudioLayout | 다른 레인과 겹침 |
|---|---|---|---|
| ER-1 | `dev/active/er-1/`만(코드 0) | 아니오 | 없음 |
| ER-2 | 엔진 **범위 예외**: `engine/ops/theme.ts`(신규 `swapTheme`·`diffSlotValues`) + 그 test · 화면: `components/studio/ThemeDialog.tsx`(신규, 조작 뒤) · `StudioPanels.tsx`(`ThemePanel`) · `GateList.tsx`/`features/studio/gateView.ts`(대비 줄 행동) · `features/studio/docOps.ts`·`docOpRun.ts`(연산 종류 `theme`) · `StudioLayout.tsx` | **예** | ER-3a와 0 |
| ER-3a | `data/memoryDocBook.ts` · `data/memoryProjectRepository.ts` · 그 test(`memoryProjectRepository.test.ts`·`memoryExport.test.ts`) | 아니오 | ER-2와 0 |
| ER-3b | `components/studio/SnapshotDialog.tsx`·`SnapshotPreview.tsx`(신규, 조작 뒤) · `features/studio/useDocSave.ts`(복원 = 저장 훅 경로 · revision 동기화 — r1) · `StudioToolbar.tsx` · `features/studio/images/store/imageStore.ts`(`retainedIds` 확장) · `ImageSlotField.tsx`·`ImageSlotPanel.tsx` · `StudioLayout.tsx` | **예** | ER-2(StudioLayout) · ER-4(Toolbar) → 직렬 |
| ER-4 | `features/studio/undoStack.ts`(redo) · `useSectionOps.ts` · `EditFields.tsx`·`PageInfoFields.tsx`·`ImageSlotField.tsx`(편집 묶음) · `components/studio/MoreMenu.tsx`(신규, 조작 뒤) · `StudioToolbar.tsx` · `StudioLayout.tsx` | **예** | 직렬 |
| ER-5 | `dev/active/er-5/`만 | 아니오 | — |

- **엔진 파일 소유(Q-18 선례)**: ER-2는 `engine/ops/theme.ts` + test 2파일만 범위 예외로 쓴다. PageDoc·SectionDefinition 계약 변경 0(필드 추가 0) — 바뀌면 멈추고 MQ로.
- **ER-3b가 ER-2 뒤인 이유**: 둘 다 `StudioLayout.tsx`에 연결한다. (r1 정정 — Codex) 복원은 `docOpRun` 일반 연산이 아니라 **저장 훅(`useDocSave`) 경로**다 — 저장소 revision을 올리므로 `resolveConflict`처럼 revision·스케줄러를 함께 갱신해야 다음 저장이 `STALE_DOC`가 되지 않는다(ER SPEC 3.2).
- **선택 레인(권하지 않음)**: `StudioLayout.tsx` 분리 리팩터링을 ER-2 앞에 두면 ER-2·ER-3b 병렬이 가능해진다. 범위 확장이고 테스트 대량 이동이 생겨 이득(약 3시간 단축, 추정)보다 위험이 커서 기본 계획에 넣지 않는다. 각 레인은 **자기가 더하는 코드만** 새 파일로 빼서 StudioLayout 증가를 막는다(파일 800행 한도).

## 3. 레인별 완료 기준 · 체크포인트

공통(모든 Developer 레인 — editor-a3 공통 규칙 계승):
- TDD RED → GREEN(RED 로그 커밋) · 단언 약화·skip 0 · 새 의존성·아이콘 0 · 새 부품 `components/studio/` · `import type` · 화면에서 engine 값 직접 import 금지(기존 동적 청크로만).
- **매 커밋 게이트**: 표적 test + `npx vitest run src/test`(가드 전체) + typecheck + lint + build(번들 스크립트).
- **번들 멈춤**: `/studio` 진입 직후 > 127.39 이면 즉시 멈춤(기준선 파일 수정 금지 — `scripts/bundleBudget.test.mjs:131`이 막는다). 레인 종료 시 남은 여유 < 0.10이면 다음 레인 착수 전 Jarvis 보고. 다른 화면·공통 ±0.03.
- 마지막: 전체 vitest 3회 · Codex `review --scope branch --base <시작 커밋>` 1회(실제 완료만 기록) · REPORT(AC 판정 표·번들 표·깨진 테스트 표 = ER SPEC 6절 대조).

| 레인 | 완료 기준 | 레인 고유 확인 |
|---|---|---|
| ER-1 | QB-R1(동일성 ⑩) · QB-R2(개수 문구) PASS/FAIL + 스크린샷 · B-M2B-09 중 같은 preview 환경에서 닿는 항목은 함께 표시 | 2.2 경로 A가 실제로 통과 문서를 만드는지가 **첫 확인** — 안 되면(예: 3안 중 대비 외 차단) 원인 기록 후 경로 B 시도, 둘 다 실패면 BLOCKED + ER-2 뒤로 |
| ER-2 | ER-AC-T1~T7 · G1(대비 줄) PASS | 첫 화면 증가 실측(ER SPEC 8절 추정 +0.04~0.08 옆에 기록) |
| ER-3a | ER-AC-S1·S2·S5 저장소 단위 PASS · E-AC-43·44(내보내기 스냅샷) 회귀 0 | 스냅샷 id 번호가 내보내기·restart와 같은 순서 |
| ER-3b | ER-AC-S3·S4·S6~S10 PASS | 미리보기 중 자동 저장 0회 · 복원→편집→저장→내보내기 revision 연속 · 참조 집합 확장 뒤 E-AC-45~47 회귀 0 |
| ER-4 | ER-AC-U1~U5 · C1 PASS | 입력칸 안 단축키 가로채기 0 |
| ER-5 | QB-R3~R7 · ER-AC-T8 · C2 재측정 | Designer 시각 QA(1280·1024·390) |

## 4. QA 게이트 — 환경 (ER-1 · ER-5 공통)

1. 빌드: `cd app && npm run build`(EXIT 0 · 번들 로그 저장).
2. 서버: `npx vite preview --host 127.0.0.1 --port 4337 --strictPort` — **dev 서버 금지**(PNG·정적 HTML이 `kitCss` 설계상 INFRA 실패 — `dev/active/m2c-e1/REPORT.md`). 자기 PID 기록.
3. 브라우저: **Ego Lite**(`ego-browser nodejs`). 첫 `goto` 1회 뒤 **앱 안 클릭만**(새로고침 = 메모리 store 소실). 폭 변경은 CDP `Emulation.setDeviceMetricsOverride`. Playwright·Puppeteer 설치 0.
4. 시드: ER SPEC 2.2 경로 A(ref-e 부티크 법률사무소 · 카드 밝음 → 3안 → 편집 시작 → 페이지 정보 입력). 대비 미달 문서가 필요한 QB-R3는 ref-c 등 미달 레퍼런스로 별도 프로젝트.
5. 끝: 이 레인이 연 창·탭 `finish({keep:[]})` · `listTaskSpaces()` = `[]` 재확인 기록 · 자기 서버 종료 · `lsof -iTCP:4337 -sTCP:LISTEN` 0 기록 · main 5480·사용자 창 무접촉.

## 5. 위험

| 위험 | 영향 | 대응 |
|---|---|---|
| 첫 화면 여유 0.34 부족 | ER-2~ER-4 중단 | 새 UI 조작 뒤 청크 · 레인마다 실측 · MQ-R3 |
| StudioLayout 직렬로 일정 김 | 12~16시간 직렬(추정) | ER-1·ER-3a 병렬로 앞당김 · 선택 리팩터링 레인은 기본 제외 |
| 스냅샷이 이미지를 붙잡아 탭 한도 거부가 실제로 생김 | 사용자 혼란 | 문장 2a-05 5.9 그대로 · ER-AC-S6 · QB-R5 |
| ER-1 경로 A가 다른 차단(목적 필수 섹션 등)으로 막힘 | B-M2C-09 계속 미검증 | 경로 B → 실패 시 ER-2 뒤 QB-R3와 묶음 |
| 메모리 스냅샷 = 새로고침 소실 | 사용자가 "저장됐다"고 오해 | 대화상자 캡션 "이 탭에만 보관됩니다 — 새로고침하면 사라집니다"(기존 E-S02 문형) · MQ-R1 |
