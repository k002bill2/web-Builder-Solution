# RS7-A QA REPORT — 도달 0 충돌 경로 제거 독립 검증

대상 `k002bill2/rs7-dead-conflict` tip `99e33ac8` · base `73289c90` · QA 브리프 `QA-BRIEF.md` · 로그 `logs/qa/`

## 0. 판정 — **PASS**
- 지운 코드(편집기 phase `stale` → `conflict` → ConflictCallout → `resolve` → 어댑터 `resolveConflict`)는 base `73289c90`에서 **제품 도달 0**이었다(1절 — 코드 사슬 + 임시 테스트 7/7). 도달 경로가 있던 코드 삭제 0.
- 지운·바꾼 테스트는 도달 0 경로 전용이거나 같은 단언을 다른 단계로 이전했다. 살아 있는 동작 단언 삭제 0(2절 표).
- 살아 있는 경로(reason `stale` 행·복원 STALE_DOC·discard reload) 변이 5종 전부 기존 테스트 FAIL(3절).
- 예산 Developer 수치와 일치(128.66·131.64·raw 129.96) · fresh 4게이트 exit 0 · 340/3018(4·6절).
- 실화면: stale 행·버리고 새로고침·링크 이탈 뒤 IDB 반영(Developer 미확인 항목 → **확인**)·스냅샷 복원 통과(5절).

## 1. CP0 독립 재증명 — 지운 경로는 도달 0이었다 (사실 · 코드 사슬 + 임시 테스트)

사슬: 편집기 phase `stale`의 유일한 생산점 = `useAutosaveScheduler.ts:218`(base) `options.save`가 `STALE_DOC`로 reject. 제품 `useAutosaveScheduler` 호출처 = `useDocSave.ts:94` 1곳(`git grep useAutosaveScheduler 73289c90` 비테스트 — 나머지는 타입 import) → `options.save` = `useDocSave.save`.

`useDocSave.save`(base 77-92)가 reject하는 경우:
| 출처 | reject 값 | STALE_DOC? |
|------|------|------|
| 저장 실패(`saved === undefined`) | `ProjectRepositoryError("INFRA", reason)` | 아니오 — 다른 탭 stale도 INFRA + reason `"stale"`(stale 행) |
| `core.link(io.text)` | `.catch(() => undefined)` | 삼킴 |
| `core.save()` reject | 그대로 전달 | 아래 표 — 제품 값에서 0 |

`core.save()`(saveCore.ts 88-100) → `chain.then(connect).then(io.save, () => failed{unavailable})`. `coreIo.save`(base) 안의 throw 후보 전수:
| 후보 | 제품 값 | 보호 | STALE_DOC reject |
|------|------|------|------|
| connect(`link(projectId)` = 청크·DocBook·sync 받기) | — | `then` 두 번째 인자 → failed{unavailable} | 0 (임시 테스트 4) |
| `link.images?.()` | `() => maps.get(projectId)` (memoryProjectRepository.ts:98) | **없음** | 제품 값이 Map.get이라 0 (임시 테스트 7) · 대조: 던지면 reject (테스트 6) |
| `link.book` (memory) | `docs.save(…, docOf().revision …)` | try/catch → failed | 0 (테스트 2·7) |
| `port.mode()` | localSync 포트 | `safely` → failed{infra} | 0 (테스트 3) |
| `hashDoc(target)` | engine/ops/hash — 순수(정규 JSON + FNV) | 없음 | 0 (STALE_DOC 생성 코드 없음 · 테스트 7) |
| `link.now()` | 주입 시계 | 없음 | 0 (문자열 반환) |
| `port.commit` | localSync 포트 | try/catch → failed{reason} | 0 (테스트 1) |
| `retainedIds(next)` | imageStore — 순수 | 없음 | 0 (테스트 7) |
| `link.align(next)` | `docs.adopt` = `state.docs.has`면 Map 교체 (memoryDocBook.ts:295-297) | 없음 | 0 (테스트 7) · 대조: 던지면 reject (테스트 5) |

임시 테스트 `src/features/studio/save/qaTemp.test.ts` 7/7 통과 → 삭제(사본 `logs/qa/cp0-temp-test.ts.txt` · 실행 로그 `logs/qa/cp0-temp-test.txt`). 대조 2건(5·6)은 "채널이 있으나 제품 값이 던지지 않는다"를 보이려는 것.

그 밖 STALE_DOC 생산자(base 비테스트 10파일)는 편집기 스케줄러로 가지 않는다: `memoryDocBook` restore(395)·`settled`(117) = `useDocSave.adopt` → `SnapshotPreview.restore` catch · start(418) = restartFlow/RestartDialog · requestExport(244) = ExportAfter · save(338) = book 경로 try/catch · 저장소 `saveDoc` 제품 호출 0(`git grep "\.saveDoc("` 비테스트 = 저장소 정의뿐) · `resume()` 제품 호출 0. Developer CP0 표와 일치.

## 2. 제거 범위 (사실 · `git diff 73289c90 99e33ac8 -- app/src`)

- 비테스트 변경 = `ConflictCallout.tsx`(삭제) · `StudioLayout.tsx`(lazy·렌더 블록·UNSAVED) · `SaveStatus.tsx`(stale alert) · `saveStatusText.ts`(STALE 문구·case·알림) · `studioRepository.ts`(어댑터 resolveConflict) · `useAutosaveScheduler.ts`(phase stale·resume·stale 플래그) · `useDocSave.ts`(resolve·conflict·DocConflict·leave 분기) · `useExportFlow.ts:88`. 모두 phase `stale`/충돌 사슬 전용.
- 무접촉 확인: `git diff --name-only 73289c90 99e33ac8 -- app/src/data app/src/features/profile ExportAfter.tsx SaveActions.tsx app/src/features/studio/save app/src/features/pending app/src/features/projects app/src/components/projects app/scripts/check-bundle-size.mjs vite.config.ts src/build` = **0줄**.
- reason `"stale"` 비테스트 출현: base 대비 tip에서 남은 것 = SaveActions:53(reload) · SaveStatus ENV:10 · localSync · writerLock · pendingRetry:39·58 · coreIo:68·95 · coreFixture:33 — 사라진 것은 phase 비교 8곳뿐(SaveStatus:17 · StudioLayout:48 · saveStatusText 4 · scheduler 2 · useDocSave 2 · useExportFlow:88). reason 쪽 손실 0.
- `memoryDocBook.resolveConflict`·`memoryProjectRepository.resolveConflict`·`ProjectRepository.resolveConflict` 존속(tip `git grep`).
- 동작 등가성: `saveStatusText` `source.text && phase !== "stale"` → `source.text` 등 조건 축약은 phase `stale` 불가능 전제에서 등가. 스케줄러 `STALE_DOC` 거부 → `failed`(이전 `stale`)는 도달 0 입력에 대한 변경.

### 지운·바꾼 테스트 행별 판정
| 테스트 | 판정 | 근거 |
|------|------|------|
| ConflictCallout.test 3건 | 도달 0 전용 | 대상 컴포넌트 삭제 |
| useDocSave "내 편집으로 저장"·"다른 편집 불러오기" | 도달 0 전용 | `resolve` 단독 |
| useDocSave "해결 실패" | 도달 0 전용 · 살아 있는 단언 이전됨 | 남은 단언(phase failed · reason stale · 자동 저장으로 덮지 않음)은 생존 테스트 "다른 탭 stale(포트)…"가 같은 값으로 단언(useDocSave.test.tsx:175-195) |
| useDocSave "다른 탭 stale(포트)" | 강화 | `conflict` undefined → 키 부재 + `resolve` 부재 |
| scheduler 3건 → 1건 | 도달 0 전용 | phase stale·resume 단독. 새 1건 = STALE_DOC → failed |
| scheduler settle "STALE 중" → "실패 중" | 이전 | settle 단언(저장 0·saved·다음 디바운스) 그대로 |
| scheduler needsUnloadGuard 목록 | 이전 | `stale` 원소만 제거 |
| saveStatusText phase stale 문구 1줄 · STALE 진입 alert 1건 | 도달 0 전용 | stale 행 문구는 reasonText·source 테스트 몫 |
| SaveStatus "STALE_DOC — saving → stale alert" | 이전 | 같은 노드 유지·saved 비움·status 0을 failed로 단언 |

## 3. 회귀 변이 (사실 · 매번 전체 `vitest run` 후 `git checkout -- app/` · 복원 뒤 `git status -- app/` 0 · `logs/qa/mut-*.txt`)
| ID | 변이 | 결과 | 잡은 테스트 |
|------|------|------|------|
| M1a | `memoryDocBook.restoreSnapshot` revision 불일치 STALE_DOC throw 삭제 | **FAIL 2** (3016/3018) | memoryProjectRepository.test 판정 순서 · saveCore.rebase.test "코어 save 진행 중 복원 → STALE_DOC" |
| M1b | `restoreSnapshot`의 `settled(core, current)`(코어 미확정 STALE_DOC) 삭제 | **FAIL 1** | saveCore.rebase.test "미저장 편집이 있으면 복원 = STALE_DOC" |
| M2a | `reasonText` `stale` 문구 매핑 삭제 | **FAIL 5** | useDocSave.test "다른 탭 stale(포트)" · StudioLayout.test stale 환경 행·PNG 이유 · FieldUndo.test · saveStatusText.source.test |
| M2b | `SaveStatus` ENV에서 `"stale"` 삭제 | **FAIL 2** | SaveStatus.buttons.test "버리고 새로고침 1개" · StudioLayout.test stale 환경 행 |
| M3 | `SaveActions.discard` `reload()` 삭제 | **FAIL 2** | SaveActions.test "discarded → reload" · "blocked{stale} → reload" |

→ 살아 있는 stale 행·복원 STALE_DOC·discard reload는 이번 diff 뒤에도 기존 테스트가 지킨다.

## 4. 예산 (사실 · fresh `npm run build` exit 0 · `logs/qa/build.txt`)
| 항목 | 실측 | 기대 | 판정 |
|------|------|------|------|
| `/studio` 정규화 | 128.66 (기준선 128.66 + 0.03, 멈춤 > 128.69) | 128.66 | 일치 |
| `/studio` 복원 정규화 | 131.64 (멈춤 > 131.67) | 131.64 | 일치 |
| `/studio` raw | 129.96 / 130.5 | ≤ 130.5 | 통과 |
| `/studio` 복원 raw | 132.99 / 134 | — | 통과 |
| `/projects` · `/profile` | 99.08 · 99.52 | 증분 0 | 일치 |
| `m2cBaseline.json` | normEagerKb 128.66·131.64 · eagerKb 129.96·132.99 · base·toleranceKb 무변경 | = 실측 | 일치 |
| `check-bundle-size.mjs` | diff 0줄 | 무변경 | 일치 |

## 5. 실화면 (사실 · Ego Lite space 27 · `npx vite preview --host 127.0.0.1 --port 4389 --strictPort`(dist = fresh 게이트 빌드) · 앱 안 클릭만)
| 단계 | 관측 | 판정 |
|------|------|------|
| 새 프로젝트 → 카탈로그(모던 카페·동네 치과 비교 추가) → 비교 보드 A 전부 선택 → 프로필 확정 v1 → 3안 만들기 → A안으로 편집 시작 | `/studio/project-1` | 통과 |
| 탭A 제목 "탭A 편집 1" | "이 브라우저에 저장됨 · 방금" | 통과 |
| 탭B(p2) `/projects` → 편집기 열기 | 제목 "탭A 편집 1" | 통과 |
| 탭A "탭A 편집 2" 저장 → 탭A 닫기 → 탭B "탭B 편집" | 상태 "다른 탭에서 바뀐 내용이 있습니다 — 새로고침한 뒤 편집하세요" · alert 1개(같은 문장) · 버튼 "버리고 새로고침"만(다시 저장·내 편집·불러오기 0) · "다른 곳에서 이 문서가 바뀌었습니다" 0 | 통과 |
| 버리고 새로고침 → 대화상자 [취소·버리기] → 버리기 | 새로고침 뒤 제목 "탭A 편집 2"(다른 탭 커밋) · 탭B 편집 덮어쓰기 0 | 통과 |
| "이탈 직전 편집" 입력 직후 "프로젝트로 돌아가기" 링크 | `/projects` 이동 · **IDB `design-studio`/`docs`에 "이탈 직전 편집" 존재** | 통과(Developer 미확인 → 확인) |
| 편집기 다시 열기 | 제목 "이탈 직전 편집" | 통과 |
| 스냅샷 "지금 상태 저장"(수동 · 21:37) → "복원 전 편집" 저장됨 → 미리보기 → 이 스냅샷으로 복원 | 제목 "이탈 직전 편집" · 알림 "스냅샷 '수동 · 21:37'으로 복원했습니다 · 복원 전 상태는 '복원 전 · 21:37'에 있습니다" · 저장됨 | 통과 |
| 정리 | `Storage.clearDataForOrigin(http://127.0.0.1:4389, indexeddb·local_storage)` → `/projects` 프로젝트 0(앱이 열며 빈 `design-studio` DB 재생성 — 데이터 0) · `finish({keep:[]})` · `listTaskSpaces()` = `[]` | 완료 |

## 7. preview 종료 (마지막 커밋 직전)
`pkill -f "vite preview --host 127.0.0.1 --port 4389"` → `lsof -nP -iTCP:4389 -sTCP:LISTEN` **출력 0줄(exit 1)** · `git status --short -- app/` 0줄(앱 변경 0). 5480 무접촉.

## 사실 / 추정 / 미확인
- 사실: 1~7절 전부(명령·로그 근거).
- 추정: 없음.
- 미확인: 없음. 범위 메모 — CP0는 base 제품 조립(memoryProjectRepository·coreLink·localSync 포트) 기준이다. 향후 `link.align`·`link.images`에 throw하는 구현이 들어오면 STALE_DOC가 다시 스케줄러에 닿을 수 있다(현재는 `failed`로 처리되어 안전 쪽).

## 6. fresh 게이트 (사실)
| 게이트 | 결과 | 로그 |
|------|------|------|
| `npm run typecheck` | exit 0 | `logs/qa/typecheck.txt` |
| `npm run lint` | exit 0 | `logs/qa/lint.txt` |
| `npm test -- --run` | exit 0 · **340 files / 3018 tests passed** | `logs/qa/test.txt` |
| `npm run build` | exit 0 | `logs/qa/build.txt` |
