# RS6_INTEGRATE_PLAN — 저장 코어 제품 연결 Developer 레인 계획

- 상태: **r0 계획 — 실행 승인 아님.** 설계 = `docs/design/restart/INTEGRATE-6.md`(이하 **I6**) r0. 결정 대기 = `docs/design/restart/MQ-6.md`. 작성 Designer · 2026-10-17 · base `c7a7a2a8`.
- 착수 조건: L0는 **MQ-6-1 ★A 가정으로 결정 전 착수 가능**(앱 커밋 0). L1 이후 = **L0 PASS** + MQ-6-1·MQ-6-3 결정. L0 FAIL이면 L1 이후 전부 보류하고 MQ-6-6(예산)으로 간다.
- 시간 추정은 전부 **추정(L3)** 이다. 근거는 비슷한 범위의 지난 레인(rs5-spike·rs4-cp4-measure = 측정 1레인 · save-core-fix = 코어 수정 1레인)의 규모 감각뿐이며 실측이 아니다.

## 0. 순서 한눈에

```
L0 측정 관문(필수 선행) ──PASS──▶ L1 포트·코어 이식 ──▶ L2 liveness ──▶ L3 편집기 배선(CP4 흡수) ──▶ L4 UX 상태·버튼 ──▶ QA 게이트
                └─FAIL──▶ MQ-6-6 상신(구현 중단)                       └─(병렬 가능)─ L5 /projects·프로필 연결
```

| 레인 | 산출물(1개) | 쓰기 경로(겹침 검사용) | 선행 | 병렬 | 턴 상한 | 시간(추정) |
|---|---|---|---|---|---|---|
| **L0** 측정 관문 | `dev/active/rs6-measure/REPORT.md`(S6-base·S6a~d 수치·패치) | `dev/active/rs6-measure/`만 (앱 패치는 측정 뒤 원복, 커밋 0) | 없음(★A 가정) | 없음 | 60 | 1.5~2.5시간 |
| **L1** 포트·코어 이식 | 코어 모듈 + `LocalSync` 포트 + 하네스 의미 재현 테스트 | `app/src/features/studio/save/**`(신설) · `app/src/data/persistence/localSync.ts` · `imageOps.ts` · 그 테스트 | L0 PASS · MQ-6-1 · MQ-6-2 | 없음 | 90 | 4~6시간 |
| **L2** liveness | 감시·포기 토큰 + 상수 1곳 | `save/**`(L1과 같은 디렉터리 — 그래서 직렬) · `useAutosaveScheduler.ts` | L1 · MQ-6-3 | 없음 | 60 | 2~3시간 |
| **L3** 편집기 배선(CP4 흡수) | `useDocSave`·스케줄러·`StudioLayout`이 코어 경유 | `features/studio/useDocSave.ts` · `useAutosaveScheduler.ts` · `studioRepository.ts` · `components/studio/StudioLayout.tsx` · `SnapshotPreview.tsx`·`SnapshotDialog.tsx`·`useExportFlow.ts`(호출부만) | L2 | 없음(L2와 스케줄러 겹침) | 90 | 5~8시간 |
| **L4** UX 상태·버튼 | `SaveStatus`·`ConflictCallout`·폐기 대화상자·문구 | `components/studio/SaveStatus.tsx` · `ConflictCallout.tsx` · `features/studio/saveStatusText.ts` · 새 대화상자 1개 | L3 · MQ-6-5 | **L5와 병렬 가능**(경로 겹침 0) | 70 | 3~5시간 |
| **L5** `/projects`·프로필 연결 | 행 "저장 확인"→`confirm` · `PendingRecord` 대체 여부 · `starter` 주입 | `features/projects/pendingRows.ts` · `components/projects/**` · `features/profile/restartFlow.ts` · `features/pending/**` | L3 | L4와 병렬 | 70 | 3~4시간 |
| **QA** | `dev/active/rs6-qa/REPORT.md` | `dev/active/rs6-qa/`만 | L4·L5 | 없음 | 60 | 2~3시간 |

- 합계(추정): 20~31시간 · 레인 7개. L0 FAIL이면 L0 1개로 끝난다.
- L1→L2→L3는 쓰기 경로가 겹치거나(코어 디렉터리·스케줄러) 앞 레인 API에 의존해 **직렬**이다. 병렬은 L4∥L5만.
- 각 레인은 `dev/active/<lane>/PROGRESS.md`를 첫 3턴에 커밋, 명시 pathspec 커밋, `git diff --check`, 게이트 4종(typecheck·lint·test·build).

## 1. L0 — 측정 관문 (필수 선행 · 앱 커밋 0)

목적: I6 9.2 배치대로 붙였을 때 `/studio` 진입이 판정선 안에 드는지 **실측**한다. 수치 없는 상향 요청 금지.

| CP | RED/GREEN 대신 | 할 일 | 판정 |
|---|---|---|---|
| CP1 | base 재현 | `npm ci` · lock diff 0 · `npm run build` → 정규화 128.09 / raw 129.40 재현 · dist sha 저장 | 다르면 중단·보고 |
| CP2 | S6a(하한) | 코어 상태 부분(진입) + io·포트(localSync 청크) — 호출 배선 0 | 정규화 ≤128.53/131.51 · raw ≤130/134 |
| CP3 | S6b·S6c | S6b = 편집기 배선(CP4 흡수판) · S6c = 대체 코드 제거(상쇄 실측) | 같음. S6c가 최종 후보 |
| CP4 | S6d·원복 | 조건 참 lazy 시나리오(UNAPPROVED, `EXTRA_SCENARIOS`) · `/profile`·`/projects`·`/catalog` 첫 화면 동시 기록 · 원복 뒤 dist sha 동일 | 수치만 |

- 도구: `npm run build`(정식) · `dev/active/rs4-cp4-measure/tools/chunks.mjs`(청크 귀속) · `dev/active/rs5-spike/tools/rawbytes.mjs`(UNAPPROVED 시나리오). 같은 머신·직렬 빌드.
- 감량 1회만. 그 뒤 초과면 중단 → 정규화·raw 수치를 MQ-6-6에. 기준선·ADR·`m2cBaseline`·시나리오 한도·`check-bundle-size.mjs` 수정 0.
- 서브에이전트 불필요(빌드 직렬).

## 2. L1 — 포트·코어 이식 (RS6-AC-U1·U2·U3·U10 · G2)

| CP | RED | GREEN |
|---|---|---|
| CP1 | 하네스 h1·h2 의미를 `createMemoryPersistence` + 제품 `LocalSync` 포트 위에서(제출 mark 고정·직렬·confirm 증명) | 코어 상태기 이식(`saveCore.ts` 로직, 레코드 접근 제거) + 포트 `mode`·`head`·`verify` |
| CP2 | h3·h6 이미지(동결 바인딩·엄격 참조 → 제출 0 · 실패 시 문서·이미지 함께 0) + 기존 `imagePersist`·`imageRecord` 회귀 + 문서 필드 = 코어 doc·스냅샷 = DocBook(I6 5절 G1) | 포트 `commit` = "코어 doc + DocBook snapshots" 레코드 → `queue.submit`→`committed`(도장·cleared·saved 유지) + 엄격 `imageOps` |
| CP3 | h4·h5(readonly·stale·discard·replace·lease) + RS6-AC-U10(cleared 직전 save) | 포트 `mode` = gate·cleared 결합 · discard·replace |
| CP4 | RS6-AC-G2 import 가드 + C5 T10·T13(시드 확인 쓰기 0 · 같은 내용 재확인 쓰기 0) | 레지스트리를 `LocalSync`에 매달기 · 가드 테스트 |

- 하네스 37건 → 3분류 대응표(이식/잠금 기반 대체/폐기)를 REPORT에(RS6-AC-U1).
- 금지: 레코드 형식 변경(MQ-6-1 B를 고르지 않는 한) · `StudioPersistence` 변경 · 새 의존성.

## 3. L2 — liveness (RS6-AC-U4·U5·U11)

| CP | RED | GREEN |
|---|---|---|
| CP1 | LV-1: `commit` 지연 주입 → `T_slow` 뒤 `saving-slow` · 추가 save 0 · 편집 수용 | 스케줄러 감시 타이머 |
| CP2 | LV-2: discard 읽기 정지 → `blocked{timeout}` · 늦은 결과 버림 · CE-1·CX-3 회귀 | 코어 포기 토큰(MQ-6-3 승인 시) |
| CP3 | `T_hang` alert 1회 · 레이아웃 재마운트 재발화 0 | 문구 상수(`saveStatusText.ts` 1곳은 L4 소유 → 여기서는 키만, 문구 본문은 L4) |

- 시간 값은 MQ-6-3 결정값을 상수 1곳에. 테스트는 가짜 타이머.

## 4. L3 — 편집기 배선 · CP4 흡수 (RS6-AC-U2·U6·U7·U11)

| CP | RED | GREEN |
|---|---|---|
| CP1 | `change`마다 `core.edit` 1회 · dispose 뒤 디바운스 편집 보존(F9) · StrictMode 같은 토큰(U6) | `useDocSave` edit 경로 · `acquire`/`release` effect |
| CP2 | 저장 실패 시 DocBook revision 변화 0(U3) · 재진입 seed = `view()`(거짓 STALE 0, C5 T2) | 저장 대상 = `core.save()` · DocBook 반영은 saved 뒤 |
| CP3 | 충돌 해결·스냅샷 복원·내보내기 전 저장이 코어 경유(I6 6.4) · dirty면 복원 거절 안내 | `replace` 경유 · `flushed` → `core.save()` |
| CP4 | 링크 이탈 저장 대기 제거(U11) · POP 재진입 상태 이어짐(C5 T1) · 레이아웃 재마운트 같은 코어(U7) | `flushBeforeLeave` 규칙 변경 |

- CP4(SPEC-4 8.4) 패치(`rs4-cp4-measure/patches/`)는 **참고만** — `PendingDraft`·`hold`·`studioHandoff`는 만들지 않는다(I6 7절).
- 예상 깨짐: I6 11절 표. RED 전 PROGRESS에 예상 delta 기록.

## 5. L4 — UX 상태·버튼 (RS6-AC-U8·U9 · G3 · UX5-AC)

| CP | RED | GREEN |
|---|---|---|
| CP1 | 상태 판정 표(I6 8.1) — 출처별 1행씩 | `SaveStatus` 판정 출처 교체(문자열 매칭 제거) |
| CP2 | 버튼 1:1 스파이(I6 8.2) · 연타 1회 · `aria-busy`/`aria-disabled` | "저장 확인"·"다시 저장"·폐기 대화상자 |
| CP3 | 충돌 두 선택(MQ-6-5 결정대로) · 포커스 규칙(UX5-AC-04·05·06) | `ConflictCallout` |
| CP4 | 금지 문구 0(UX5-AC-14) · memory 모드(U9) | 문구 `saveStatusText.ts` |

## 6. L5 — `/projects`·프로필 (병렬 · L4와 경로 겹침 0)

| CP | RED | GREEN |
|---|---|---|
| CP1 | 행 "저장 확인" → `confirm` 1회 · 성공 포커스(UX5-AC-08) | `pendingRows` 연결 |
| CP2 | `PendingStart` 유지 · "시작 다시 시도" → `retryStart`(starter 주입) | `restartFlow` 연결 |
| CP3 | 편집기 밖 이미지 확인(C5 T5 · RS6-AC-B2 단위판) | 코어 바인딩 경유 |

## 7. QA 게이트 (독립 · 구현 레인과 다른 세션)

- 환경: `cd app && npm run build && npx vite preview`(dev 서버 금지 — memory `png-export-needs-preview`). origin 1개 고정, 사용자 포트 접근 0.
- 브라우저: **ego-browser만**(Playwright·Puppeteer 설치 금지). 앱 안 클릭으로만 이동(memory `browser-memory-store-reset`).
- 멀티탭: **실제 `navigator.locks` 잠금을 먼저 취득 확인**(held 목록 기록) 뒤 RS6-AC-B3. 탭 2개 = 같은 프로필 페이지 2개.
- 대상: RS6-AC-B1~B4 + UX5-AC-01·04·05·06·12 + final-qa 5-1 시나리오의 제품 화면판.
- 증거: 각 단계 관측 원문·스크린샷 경로를 REPORT에. 실화면 PASS는 QA만 주장한다.
- Codex 검증: 각 구현 레인 끝에 `/codex:review`(scope 명시, 최대 3라운드 — 전역 규칙).

## 8. 중단 규칙

- L0 FAIL(감량 1회 뒤 초과) → 구현 레인 0 · MQ-6-6.
- 같은 RED가 2회 수정에도 안 풀리면 멈추고 근본 원인 보고(전역 verification 규칙).
- 레인이 턴 상한 80%에 닿으면 새 조사 중단 → REPORT 마감.
- 쓰기 경로가 표 밖으로 나가야 하면 멈추고 Jarvis에 범위 확인.
