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
