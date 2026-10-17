# RS7-A REPORT — 도달 0 충돌 경로 정리 (B-RS-07) · `/studio` 여유 (B-RS-06)

base `73289c90` · 브랜치 `k002bill2/rs7-dead-conflict`

## 0. 결론 — **PASS**
- CP0: 편집기 충돌 경로(phase `stale` → `conflict` → ConflictCallout → `resolve`) 제품 도달 0 증명 → 제거(`73db17ea`).
- 예산: `/studio` 정규화 129.12 → **128.66** · 복원 132.10 → **131.64** (−0.46 · 여유 0.01 → 0.47) · raw 129.96 · 132.99 · `/projects` 99.08 · `/profile` 99.52 (증분 0). 기준선 하향 같은 커밋.
- fresh 4게이트 exit 0 · 테스트 **340/3018**(base 341/3027 − 파일 1 · −9건, 아래 표) · Codex review 지적 0 · 실화면 stale 행·버리고 새로고침·편집·이탈 회귀 0(이탈 뒤 IDB 반영은 미확인).

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

## 검증 (fresh · 커밋 `73db17ea` 위)
| 게이트 | 명령 | 결과 | 로그 |
|------|------|------|------|
| typecheck | `npm run typecheck` | exit 0 | `logs/gate-typecheck.txt` |
| lint | `npm run lint` | exit 0 | `logs/gate-lint.txt` |
| test | `npm test -- --run` | exit 0 · 340 files / 3018 tests passed | `logs/gate-test.txt` |
| build | `npm run build` | exit 0 · 정규화 128.66 · 131.64 = 기준선 · 멈춤선 128.69 · 131.67 | `logs/gate-build.txt` |
| Codex | `codex-companion review --scope branch --base 73289c90` | 지적 0("수정이 필요한 결함은 발견하지 못했습니다") | `logs/codex-review.txt` |

## 실화면 (Ego Lite · `npx vite preview --host 127.0.0.1 --port 4386 --strictPort` · 앱 안 클릭)
| 단계 | 관측 | 판정 |
|------|------|------|
| 새 프로젝트 → 카탈로그(모던 카페·동네 치과) → A 전부 선택 → 프로필 v1 → 3안 → A안 편집 시작 | `/studio/project-1` · held `design-studio-writer:exclusive` | 통과 |
| 탭A 편집 | "이 브라우저에 저장됨 · 방금" | 통과 |
| 탭B(`/projects` → 편집기 열기) · 탭A 다시 편집·저장 · 탭A 닫기 | held `[]` | 통과 |
| 탭B 편집 | 상태 줄 "다른 탭에서 바뀐 내용이 있습니다 — 새로고침한 뒤 편집하세요" + "버리고 새로고침" 1개 · alert 1개(같은 문장) · "다른 곳에서 이 문서가 바뀌었습니다"·"내 편집으로 저장"·"다른 편집 불러오기" **0** | 통과 |
| 버리고 새로고침 → 대화상자 [취소·버리기] → 버리기 | 새로고침 · 제목 = "탭A 편집 2"(다른 탭 커밋) · 탭B 편집 덮어쓰기 0 | 통과 |
| 새로고침 뒤 편집 | 3.5s 시점 "저장 중…"(저장 진행 관측) | 통과(저장 완료 글자는 미관측) |
| 편집 직후 "프로젝트로 돌아가기" | `/projects` 이동 | 통과 |
| 이탈 뒤 IDB 최종 편집 반영 | — | **미확인**: 확인 직전 preview가 백그라운드 시간 제한으로 종료되고 태스크 공간이 사라짐. 단위 `StudioLeave.test`·`useDocSaveLeave.test` GREEN |
| 정리 | `lsof -iTCP:4386 -sTCP:LISTEN` 빈 출력(exit 1) | 리슨 0 |
- 스크린샷 1회 시도 = CDP 타임아웃(배경 탭) — 관측은 DOM 텍스트로 대신.

## 사실 / 추정 / 미확인
- 사실: 위 CP0 사슬 · 게이트 4종 · 예산 수치 · Codex 0 · 실화면 표의 "통과" 행.
- 추정: CP1a의 무관 경로 +0.01 = 해시 흔들림.
- 미확인: 실화면 이탈 뒤 IDB 최종 반영(단위로만).

## 다른 레인 접촉
- 쓰기 = `components/studio/**`·`features/studio/**`·`app/scripts/m2cBaseline.json`·`app/scripts/bundleBudget.test.mjs`·`dev/active/rs7-dead-conflict/**`만. `features/projects`·`components/projects`·`features/pending`·`features/profile`·`data/**`·`vite.config.ts`·`src/build/**` 변경 0(`memoryDocBook.ts`도 유지라 변경 0).
