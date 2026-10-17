# RS7-A REPORT — 도달 0 충돌 경로 정리 (B-RS-07) · `/studio` 여유 (B-RS-06)

base `73289c90` · 브랜치 `k002bill2/rs7-dead-conflict` · (초안 — 결론은 마감 때)

## CP0. 도달 증명 (삭제 전)

`grep -rn STALE_DOC app/src` 비테스트 = **10파일**(brief "9" + `features/studio/testing/coreFixture.ts` — 테스트 전용 흉내라 비테스트 이름이지만 제품 번들 밖).

### STALE_DOC 생산·소비 전수표

| 파일 | 역할 | 편집기 `conflict`(스케줄러 phase `stale`)로 이어지나 | 근거 |
|------|------|------|------|
| `data/projectRepository.ts` | 코드 정의·인터페이스 주석 | — | 타입만 |
| `data/memoryDocBook.ts` (save 338 · restoreSnapshot 395 · start 418 · requestExport 244 · CP0 `settled` 117) | 생산 | **아니오** | save = `coreLink.book` → `coreIo.save`가 try/catch로 잡아 `failed{reason}` 반환(reject 0, `coreIo.ts:33-37`). restore = `useDocSave.adopt` 호출자(SnapshotPanel)가 받음 · start = restartFlow · requestExport = ExportAfter |
| `data/memoryProjectRepository.ts` | 주석 | — | 주석만 |
| `features/studio/useAutosaveScheduler.ts:218` | 소비(유일한 phase `stale` 생산점) | 입력 = `options.save` reject | 제품 `options.save` = `useDocSave.save` 1곳(`grep useAutosaveScheduler` 비테스트: useDocSave만 호출) |
| `features/studio/useDocSave.ts:90` | 차단점 | **아니오** | 저장 안 됨 = 모두 `ProjectRepositoryError("INFRA")`로 던짐. `core.save()`는 STALE_DOC로 reject하지 않음: connect 실패 = `unavailable`(`saveCore.ts:96`) · mode/verify = `safely` · commit·book = try/catch. io.save 밖으로 새는 throw 후보(`images()`·`hashDoc`·`retainedIds`·`align`=`docs.adopt`)는 STALE_DOC를 만들지 않음 |
| `features/studio/testing/coreFixture.ts` | 테스트 흉내(포트 reason 변환) | 제품 밖 | STALE_DOC → reason `stale`(= stale 행) |
| `features/profile/restartFlow.ts` · `RestartDialog.tsx` | restart 판정 소비 | 아니오(다른 기능) | 손대지 않음 |
| `components/studio/ExportAfter.tsx` | 내보내기 결과 문구 | 아니오(다른 기능) | 손대지 않음 |
| `components/studio/ConflictCallout.tsx` | 주석 | 렌더 조건 `save.conflict` = phase `stale` | 위 사슬로 도달 0 |

### 판정
- 편집기 phase `stale` → `save.conflict` → `ConflictCallout` → `useDocSave.resolve` → `DocSaveRepository.resolveConflict`: **제품 도달 0** (사실 — 코드 사슬, 위 표).
- 주의: **reason** `"stale"`(포트 mode·confirm·discard·SaveStatus ENV·SaveActions reload·pendingRetry)은 살아 있는 stale 행 — phase와 별개, 건드리지 않는다.
- 유지(쓰기 경로 밖 또는 다른 호출처): `ProjectRepository.resolveConflict`·`ConflictChoice`(projectRepository.ts) · `memoryProjectRepository.resolveConflict` → `memoryDocBook.resolveConflict`(공개 저장소 메서드) · `coreFixture.ts`.
- blocker 확인: `grep Conflict scripts vite.config.ts src/build` = 0건(청크 이름 의존 없음) · AC ID 가드 0 · 레인 밖 테스트의 useDocSave 필드 의존 0(`src/test/pendingImportGuard.test.ts`는 파일 경로만).

## CP1. 제거 (커밋 `73db17ea` — 코드·테스트·기준선 같은 커밋)

### 지운 것 (도달 0 증명 대상만)
| 대상 | 파일 | 비고 |
|------|------|------|
| `ConflictCallout` + lazy 래퍼·렌더 블록 | `components/studio/ConflictCallout.tsx`(삭제) · `StudioLayout.tsx` | 캔버스 head는 `snaps.layer` 그대로 |
| `useDocSave.resolve`·`conflict`·`DocConflict` · `DocSaveRepository.resolveConflict` | `features/studio/useDocSave.ts` | `hashDoc`·`ConflictChoice` import 함께 정리 |
| 어댑터 `resolveConflict` | `features/studio/studioRepository.ts` | `isPageDoc`는 유지(useStudioDoc·useSnapshots) |
| 스케줄러 phase `stale`·`resume()`·`stale` 플래그 | `features/studio/useAutosaveScheduler.ts` | STALE_DOC = 그 밖 예외 → `failed` |
| phase `stale` 소비 | `saveStatusText.ts`(`SAVE_STALE_TEXT`·`SAVE_STALE_ALERT`·case·알림) · `SaveStatus.tsx` alertText · `useExportFlow.ts:88` · `StudioLayout` UNSAVED · `useDocSave.leave` | **reason** `"stale"`(stale 행)은 그대로 |

### 유지 (지우지 않음)
- `ProjectRepository.resolveConflict`·`ConflictChoice`(`data/projectRepository.ts`) · `memoryProjectRepository.resolveConflict` → `memoryDocBook.resolveConflict` — 공개 저장소 메서드 · 쓰기 경로 밖(projectRepository.ts·memoryProjectRepository.ts) · `memoryProjectRepository.test` 등 호출처.
- `features/studio/testing/coreFixture.ts`(resolveConflict 래핑 — 다른 테스트 공용).
- `coreIo` 전부(reason `stale` = confirm·discard).

### 테스트 변경 표 (단언 약화·skip 0)
| 파일 | 이전 | 이후 | 근거 |
|------|------|------|------|
| `ConflictCallout.test.tsx` | 3건 | 파일 삭제 | 대상 컴포넌트 삭제(도달 0, CP0) |
| `useDocSave.test.tsx` "다른 탭 stale(포트)…" | `conflict` toBeUndefined | `not.toHaveProperty("conflict")` + `not.toHaveProperty("resolve")` | **강화**(키 자체 0) — RED `logs/red-useDocSave.txt` |
| `useDocSave.test.tsx` "내 편집으로 저장"·"다른 편집 불러오기"·"해결 실패" | 3건 | 삭제 | `resolve` 제거(호출처 = ConflictCallout뿐) |
| `useAutosaveScheduler.test.ts` "STALE_DOC → stale…resume" · "저장 중 변경 STALE_DOC → stale" · "resume — 남은 변경" | 3건 | 1건 "STALE_DOC 거부 = 일반 실패(failed · alert 1회) — 특별 단계 0 · 다음 변경 디바운스 재저장" | 단계·resume 제거 · 새 단언 = phase `stale` 방출 0 — RED `logs/red-scheduler.txt` |
| `useAutosaveScheduler.test.ts` settle | "STALE 중 settle" phase `stale` | "실패 중 settle" phase `failed`(같은 STALE_DOC 거부, 나머지 단언 그대로) | 단계 제거 — RED 같은 로그 |
| `useAutosaveScheduler.test.ts` needsUnloadGuard | 단계 목록에 `stale` | 목록에서 `stale` 제거 | 타입에서 단계 삭제(남은 단계 단언 그대로) |
| `saveStatusText.test.ts` | 단계별 문구 `stale` 1줄 · "STALE_DOC 진입은 alert 1회" 1건 | 줄·건 삭제 | 단계 제거(타입이 막는다) · stale 행 문구는 `saveStatusText.source.test` 유지 |
| `SaveStatus.test.tsx` "STALE_DOC — saving → stale alert…" | stale 단계로 같은 노드·settle 비움 | 같은 규칙을 `failed`로(같은 노드 · saved → 비움 · status 0 · "다시 저장" 0) | 단계 제거 — 단계 무관 단언 이전 |
| `bundleBudget.test.mjs` 기준선 | eagerKb 130.43·133.46 · norm 129.11·132.09 | 129.96·132.99 · 128.66·131.64 | 실측 하향 — RED `logs/red-baseline.txt` |
| 유지(대체 단언) | `StudioLayout.test` "다른 탭 stale(포트) → … 충돌 Callout 0" | 그대로 | brief "포트 stale → Callout 0" |

테스트 수 예상: base 341/3027 → **340/3018**(−1 파일 · −9건 = ConflictCallout 3 + useDocSave 3 + 스케줄러 3→1(−2) + saveStatusText 1).

## 예산 (실측 · `logs/build-base.txt`·`build-cp1a.txt`·`build-cp1b.txt`)
| 시나리오 | base 73289c90 | CP1a(Callout·resolve) | CP1b(+stale 단계) | 상한 |
|------|------|------|------|------|
| `/studio` 정규화 | 129.12 | 128.86 | **128.66** (−0.46) | 129.13 |
| `/studio` 복원 정규화 | 132.10 | 131.85 | **131.64** (−0.46) | 132.11 |
| `/studio` raw | 130.43 | 130.19 | **129.96** | 130.5 |
| `/studio` 복원 raw | 133.47 | 133.22 | **132.99** | 134 |
| `/projects` 첫 화면 | 99.08 | 99.09 | 99.08 | 100 |
| `/profile` 첫 화면 | 99.52 | 99.53 | 99.52 | 100 |
- CP1a의 `/profile`·`/projects`·`/catalog`·`/compare` +0.01 = 해시 이름 흔들림(raw 판정 · 코드 접촉 0 · CP1b에서 원값 복귀) — 추정(근거: 같은 빌드에서 무관 경로 동시 ±0.01).
- 기준선(`m2cBaseline.json`) = CP1b 실측으로 하향, note "RS7-A 도달 0 정리" · `base`·`toleranceKb` 그대로.

## CP2. 문서 정합 메모 (인계)
- UX5-AC-04·05 · RS6-AC-B4 문서·주석은 수정하지 않았다(문서 레인 아님). **충돌 경로(편집기 충돌 영역·해결 선택)를 재도입하면 UX5-AC-04·05·RS6-AC-B4를 재판정**하고, 스케줄러 `stale` 단계·`ConflictCallout`은 git `73db17ea^`에서 되살린다.
