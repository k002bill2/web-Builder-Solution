# RS6-L3a QA-REPORT — 편집기 배선 전반부 독립 검증

대상 `k002bill2/rs6-l3-editor` tip `e0f19594`(base `0323c4a0`) · QA 2026-10-17 · 앱·테스트 변경 0(임시 테스트·변이 전부 되돌림 — `git status` app/ 깨끗)

## 0. 판정 — **PASS with notes**

- **main 대비 새 데이터 손실 경로: 없음** [L1 코드 추적 + 임시 테스트 + 실화면].
  - 앱 안 링크 이탈은 코어 경로에서도 `core.save()`를 내고 IDB 반영 뒤에 이동한다(임시 테스트 + Ego Lite rev 7).
  - POP·새로고침은 main과 같거나 낫다. POP는 main에서 편집을 버리지만, tip은 탭 메모리 코어에 초안을 남겨 재진입 때 저장한다.
  - 새 이미지 Blob은 IDB `images`에 커밋되고 새로고침 뒤 복원된다.
  - 스냅샷 복원 뒤 편집은 rev 6 = 복원 rev 5 + 1이다. 덮어쓰기 0.
- **note**:
  1. 변이 1종 생존: rebase `epoch` 갱신 제거(제품 호출처 없는 `replace`만 영향). 테스트 공백이다. 2절 참고.
  2. `StudioLeave` 14건 중 10건 계약이 코어 경로에서 테스트로 미검증이다. 핵심 3건은 QA 임시 테스트로 확인했다(삭제함). 3절 참고.
  3. 계약 변경 2건은 수용 가능하다. 4절 참고.

## 1. 손실 경로 표

| 경로 | main(base) | tip(L3a) | 새 손실? | 근거 |
|---|---|---|---|---|
| 디바운스 중 앱 안 링크(`프로젝트로 돌아가기`) | `flushBeforeLeave` → `leave()` → `saveDoc` 대기 뒤 이동 | 같은 `leave()`(본문 동일, `useDocSave.ts:176-181`) → `retry` → `save` → **`await core.save()`**(`:74`) 대기 뒤 이동 | 아니오 | 임시 테스트(3건 GREEN): 로컬 IDB = 마지막 편집 뒤 이동 · core.save 1회 · saveDoc 0 / 실패 → 이동 보류·"저장하지 못했습니다" / memory DocBook = 마지막 편집. Ego Lite: 편집 직후 클릭 → 1.13초 뒤 `/projects`, IDB rev 7 = "QA L3a 이탈 직전", 재진입 제목 유지 |
| 디바운스 중 POP(뒤로) | 스케줄러 dispose → 편집 버림(저장 주체 0) | `core.edit` 초안이 탭 메모리 코어에 남음(F9). 저장 0. 재진입하면 dirty → 저장 | 아니오(개선) | 임시 테스트: 언마운트 2.5초 뒤 core dirty · IDB 미반영. Ego Lite: POP 3.8초 뒤 IDB rev 7 그대로 → forward 재진입 시 제목 "POP 직전" → rev 8 저장. **POP 뒤 재진입 없이 새로고침·탭 닫기 = 유실(경고 없음)** — main도 같다(이미 POP 때 버림). L3b 인계 1 |
| 디바운스 중 새로고침 | `needsUnloadGuard` beforeunload 경고 | 같은 가드(스케줄러 코드 변경 0) | 아니오 | Ego Lite: dirty 동안 합성 beforeunload `defaultPrevented=true`, 저장됨 뒤 `false`. CDP `Page.reload`는 프롬프트를 우회해 편집이 유실됨(자동화 특성 — 실사용자는 경고를 본다 [L2 추정]) |
| 새 이미지 편집 저장(`45831121`) | `kept` flush가 맵 Blob 실음 | `coreIo.save` 시작 때 `link.images()` 맵 → 바인딩 합침 | 아니오 | Ego Lite: 640×400 PNG 업로드 → IDB `images` 레코드 `[Blob image/webp 3348]`, docs rev 3 → 새로고침 뒤 미리보기·패널 이미지 복원(`qa-shots/01`). 변이 M5 → 테스트 FAIL |
| 스냅샷 복원 뒤 편집(CP0) | adopt → restoreSnapshot | 같고 + DocBook 쓰기 시 `settled` 판정 + `rebase` | 아니오 | Ego Lite: 스냅샷 "QA 기준" → 편집 rev 4 → 복원 rev 5 → 편집 rev 6 = "복원 뒤 편집" → 새로고침 유지(`qa-shots/02`). 테스트 `saveCore.rebase` 9건 |
| 충돌 해결(mine/theirs) 뒤 편집 | resolveConflict | 같고 + rebase(mine이면 새 편집 초안 유지) | 아니오 | 테스트만(rebase mine 2건·theirs 1건). 실화면 미확인(다중 탭 필요) |
| restart(편집기 밖) | startDoc | 코어 dirty면 `STALE_DOC` 거절(쓰기 0) | 아니오(안전 방향) | REPORT 8절 2: 문구 불일치만 있음. 손실 아님 |

## 2. 변이 표 (매번 `git checkout -- src scripts`)

| # | 변이 | 실행 테스트 | 결과 |
|---|---|---|---|
| M1 | CP0 dirty 거절 제거(`settled` 무력화) | saveCore.rebase | **FAIL 1** (미저장 편집 복원 = STALE_DOC) |
| M2a | rebase `s.savedMark = s.mark` 제거(앵커 재실행) | save/ 전체 + useDocSaveCore* + snapshotRevision (13파일) | **FAIL 5** (복원·mine·theirs·restart·memory 복원) |
| M2b | rebase `s.epoch += 1` 제거 | 같은 13파일 88건 | **생존** (88/88 통과) |
| M2c | rebase `s.confirmed` 갱신 제거 | saveCore.rebase | FAIL 4 |
| M3 | `core?.edit(next)` 제거 | useDocSaveCore·save + QA 임시 | FAIL 10 |
| M4 | lease 즉시 release | useDocSaveCore | FAIL 1 (StrictMode) |
| M5 | 이미지 맵 합치기 제거 | useDocSaveCore.save + save/ | FAIL 1 (새 이미지 편집 저장) |
| M6 | `watch.stop()` 제거 | useAutosaveScheduler.watch | FAIL 1 (남은 타이머 0) |
| M7(QA 추가) | 코어 경로 save가 `core.save()` 없이 즉시 성공 | QA 임시 이탈 테스트 | FAIL 3 (임시 테스트가 이탈 저장을 실제로 잡음) |

- **M2a 1차 실행 무효 기록**: 앵커 없는 정규식이 `coreIo.ts:101`(discard 경로의 같은 텍스트)에 먼저 걸려 "생존"으로 잘못 나왔다(diffstat `1 insertion, 2 deletions`). `rebase` 블록 앵커 + `git diff`로 헝크 위치를 확인한 뒤 재실행했고 FAIL 5다. 변이는 적용 직후 헝크 위치를 확인해야 한다.
- **M2b 영향**: `replace`(epoch 비교, `coreIo.ts:125`)는 제품 호출처가 0이라 지금은 관찰되지 않는다. L3b·L4가 replace를 결선할 때 테스트 필요.

## 3. 폴백·미검증 범위 (읽기 전용 서브에이전트 조사 + 메인 확인)

- **폴백(saveDoc) 제품 도달: 불가** [L1].
  - `deferredStudio.ts:55`는 local·memory 모두 `createMemoryProjectRepository`를 쓴다.
  - `memoryProjectRepository.ts:146-150`의 `core`는 조건 없이 들어간다(local 스프레드 밖).
  - `StudioPage`는 저장소 로드 전에 `LoadingState`만 그린다(`useStudioDoc.ts:20`).
  - readonly·Locks 없음이어도 `core`는 그대로 있고, `failed{readonly|unsupported}`만 나온다.
  - 제품 래퍼 중 `core`를 떨어뜨리는 것은 0이다.
- 결과적으로 폴백 경로는 테스트 mock(`core` 없음)에서만 실행된다. 아래 계약은 폴백으로만 GREEN이다.

| 테스트 | 건수 | 저장 계약 | 코어 경로 동등 검증 |
|---|---|---|---|
| StudioLeave | 14 | ① 저장 중 추가 편집 → 마지막까지 저장 후 이동 ② 저장 전 변경 대기 ③ 실패 보류·다시 저장 ④ 연타 1회 ⑤ readonly 이동 허용 ⑥ readonly+미저장 ⑦ 지난 거절 무시 ⑧ Locks 없는 local 허용 ⑨ readonly 뒤 오프라인 보류 ⑩ Locks 없음+memory 실패 보류 ⑪ 일반 실패 보류 ⑫~⑭ 링크 처리(경로 무관) | ⑤만 훅 단위(`useDocSaveCore.save.test.tsx:78`). **②③과 memory 이탈은 QA 임시 테스트로 확인(삭제)**. ①④⑥⑦⑧⑨⑩⑪ 미검증. ⑧은 코드상 `unsupported` → readOnly → 허용으로 같은 의미 [L1] |
| SnapshotImages | 3 | 스냅샷 = 이미지 참조 집합, 복원 = adopt | revision 연속성만(`snapshotRevision.test.tsx:41,57`, `saveCore.rebase`). 이미지 집합은 미검증. 실화면 복원은 확인 |
| ImageUndo | 8 | 저장 단언 0(undo·render images) | 해당 없음 |
| StudioLayoutImages | 7 | 저장 단언 0 | 해당 없음. 새 이미지 저장은 훅 단위 + 실화면 |
| StudioPage | 9 | 저장 단언 0 | 해당 없음 |

- 그 밖에 `openStudio.stubProjectRepository`(core 없음)를 쓰는 SnapshotFlow·FieldUndo·UndoKeys 등 StudioLayout UI 테스트도 전부 폴백 경로다.
- 표 밖 관찰 [L1]:
  - 코어 경로 stale은 문서를 동봉하지 않아 `conflict.latest`가 늘 undefined다(REPORT 8절 4와 같음).
  - 코어 경로 save는 `NETWORK` 코드를 던지지 않는다(`STALE_DOC` 아니면 `INFRA`). local IDB에서는 영향이 작다 [L2].

## 4. 계약 변경 판정

1. **`DISCARD_GIVE_UP_MS` → `coreIo.ts:13`**: 소비자는 `coreIo.ts:108`과 `liveness.discard.test.ts` 하나뿐이다. 다른 import 깨짐은 0이다(typecheck 0).
   - 시간 상수가 `liveness.ts`(SLOW·HANG)와 `coreIo.ts`(GIVE_UP) 2곳으로 나뉜다. `liveness.ts:11` 주석이 위치를 안내한다.
   - 판정: **수용**. 청크 경계 근거(+0.26KB 회피)가 실측이다. "시간 값 1곳" 문장은 INTEGRATE-6 쪽 정정이 필요하다(Jarvis).
2. **`SaveResult` failed에 `revision?`**: 추가 선택 필드라 기존 소비자(`confirm`의 `save` 콜백, 테스트)에는 영향이 없다.
   - 제품 소비자는 `useDocSave.ts:74-81` 하나뿐이다. 이 소비자는 failed라도 revision이 있으면 저장 성공으로 매핑한다.
   - 지금 revision을 싣는 것은 `not-persistent` 하나뿐이다(`coreIo.ts:37`).
   - 판정: **수용 (P3 위험)**: 앞으로 다른 failed 변형이 revision을 실으면 거짓 저장됨이 된다. reason을 `not-persistent`로 좁히는 단언 또는 주석 계약이 권장된다.

## 5. 실화면 (Ego Lite space 13 · `vite preview` 127.0.0.1:4376 · fresh build)

| 단계 | 결과 |
|---|---|
| 진입 | origin IDB·localStorage 비움 → 카탈로그 → 모던 카페·동네 치과 비교 → A 전부 선택 → 프로필 확정 v1 → 3안 → A안 → "A안으로 편집 시작" → `/studio/project-1` |
| 제목 편집 | "QA L3a 제목 편집" → "이 브라우저에 저장됨 · 방금" |
| 이미지 교체 | 자체 fixture `qa-fixtures/qa-gradient-640x400.png` → "640 × 400 · WebP 3KB" · 저장됨 · IDB `images` Blob webp 3348B · docs rev 3 |
| 새로고침 | 제목·이미지 복원(`qa-shots/01-reload-title-image.png`) |
| 스냅샷 | "QA 기준" 저장 → "QA L3a 스냅샷 뒤" 저장 → 미리보기 → 복원 안내 "스냅샷 'QA 기준'으로 복원했습니다 · 복원 전 상태는 '복원 전 · 15:45'에 있습니다" · 제목 = "QA L3a 제목 편집" |
| 복원 뒤 편집 | "QA L3a 복원 뒤 편집" → IDB rev 6 → 새로고침 유지(`qa-shots/02-restore-edit-reload.png`) |
| 편집 직후 앱 안 링크 | "QA L3a 이탈 직전" 입력 즉시 링크 → 1132ms 뒤 `/projects` · IDB rev 7 반영(`qa-shots/03-projects.png`) → 다시 열기 = 유지 |
| POP(추가) | 1절 표 |
| 콘솔·네트워크 | 마지막 두 라운드(CDP 이벤트 91개) exception·console error/warn·Log error·loadingFailed·≥400 **0**. 이전 라운드는 이벤트 38개 중 0(수집 범위 한계) |
| 정리 | `Storage.clearDataForOrigin` → `indexedDB.databases()` = `[]` · `finish({keep:[]})` · `listTaskSpaces()` = `[]` · preview 종료 · 4376 리슨 0 · 5480·영환님 창 무접촉 |

## 6. 게이트 (fresh, tip `e0f19594`)

- `npm run typecheck` exit 0
- `npm run lint` exit 0
- `npx vitest run` **330 파일 / 2945 통과** exit 0 (기대값 일치)
- `npm run build` exit 0
  - `/studio` 정규화 **129.04**(기준선 129.04 · 멈춤 > 129.07) · raw 130.39 / 130.5
  - 복원 진입 정규화 **132.03**(멈춤 > 132.05) · raw 133.42 / 134
- raw 판정선 130 → 130.5(`check-bundle-size.mjs:144`): 주석 "ADR-004 개정 17 결정 1·2 — RS6 몫"과 일치. 다른 한도 변경 0.

## 7. 사실 / 추정 / 미확인 · L3b 조건

- **사실 [L1]**: 1·2·4·6절 수치·명령 결과, 폴백 도달 불가 판정, 실화면 IDB revision 열.
- **추정 [L2]**:
  - 실사용자 새로고침은 beforeunload 경고를 본다(자동화 reload는 우회).
  - 다중 탭에서 이 탭 코어가 옛 초안을 seed해도, 다음 save는 port STALE 판정으로 거절된다(조용한 덮어쓰기 아님). 실측은 안 했다.
- **미확인**: 충돌 해결 실화면(다중 탭), slow·hang 표지 실경로, readonly 실화면, 코어 경로 StudioLeave ①④⑥⑦⑨⑩⑪.
- **L3b 조건**:
  1. POP·탭 닫기 저장 주체(MQ-6-7 A lease 해제 save). 지금은 POP 뒤 재진입 없이 새로고침하면 경고 없이 유실된다(main과 같음).
  2. replace 결선 시 rebase 뒤 epoch +1 단언 추가(M2b 생존 해소).
  3. `StudioLeave`를 코어 있는 저장소로 이전하거나 코어 경로 대응 테스트를 추가한다(폴백 제거와 함께. 상쇄 후보와 같은 작업).
  4. `SaveResult.revision` 사용을 `not-persistent`로 좁힌다.
  5. 코어 경로 `conflict.latest` 출처(REPORT 8절 4).

## 서브에이전트

- 읽기 전용 1개(Explore · 3절 폴백 도달·미검증 계약·leave 추적): 완료. 결과는 3절과 1절 첫 행 근거에 통합했다. 메인이 `leave()` 본문·호출처를 직접 재확인했다.
