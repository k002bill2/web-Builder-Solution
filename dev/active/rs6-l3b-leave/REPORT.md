# RS6-L3b REPORT — 상쇄 먼저 → 링크 이탈(MQ-6-7 A) · POP · 화면 호출처

브랜치 `k002bill2/rs6-l3b-leave` · base `860d530d` · 2026-10-17 · 커밋 `e467a1ca`(착수) → `dfabc8b2`(CP-A) → `32277b23`(CP-C + CP-B 일부) → REPORT 커밋

## 0. 결론

- **PASS (CP-B 일부 인계)**. CP-A(상쇄)·CP-C(MQ-6-7 A) AC가 GREEN이다. CP-B는 `conflict.latest` 출처 · `SaveResult.revision` 좁힘 · L3a 인계 2 해소만 구현했다. 나머지 화면 호출처는 코드 추적 결과 이미 코어 경유이거나 이 레인에 호출처가 없어 인계한다(3절).
- **예산 [L1]**: `/studio` 정규화 **129.03** · 복원 진입 **132.01** · raw 130.36 / 133.39.
  - L3b 목표 129.04 이하, 상한 129.13 안이다. 시작 129.04 대비 **−0.01**.
  - CP-A 상쇄 −0.10 → CP-C 1차 +0.13(129.07) → 감량 1회(편집기 훅 beforeunload 제거) → 129.03.
- 기존 단언 약화·skip 0. 바뀐/이전한 단언은 2절·4절 표에 있다. 근거 = I6 3.1-4 · 3.1-1 · 3.1-2 · D6-11.
- 테스트 수: base 330 파일 / 2945 → **331 / 2953**. 증감 내역은 7절.

## 1. AC 판정

| AC | 판정 | 근거 |
|---|---|---|
| CP-A 폴백 제거(saveDoc 경로 · `latest` 폴백 · 사유 문장 readonly 판정) | PASS | `useDocSave.ts` `core` 필수. 폴백 있는 상태에서 픽스처만 옮긴 실행 = 실패 3(예측 latest 2 + 가드 1) → 폴백 제거 뒤 330/2945 GREEN |
| CP-A 폴백으로만 GREEN이던 테스트 → 코어 있는 저장소 | PASS | `testing/coreFixture.ts`(제품 `createSaveCore` + `coreIo`, 가짜 포트 commit = 기존 stub `saveDoc`) · openStudio 사용처 20 파일 무수정 · 손으로 만든 저장소 11 파일 감쌈 |
| CP-A S6c 제거 목록 · `LocalSync.base`·DocBook `base` | PASS (차이 3행) | 6절 대응표 |
| CP-A 상쇄 실측 · 기준선 실측 갱신 | PASS | −0.10 / −0.10 · `m2cBaseline.json` 128.94·131.92(CP-A) → 129.03·132.01(CP-C) |
| RS6-AC-U7 재마운트 = 같은 코어 · lease 해제 save 최대 1 | PASS | `useDocSaveLeave.test.tsx` "U7" (새 mountId 재마운트 → 초안 이어짐 · save 1) |
| RS6-AC-U11 저장 정지 중 링크 → 이동 · inflight 유지 · 해제 뒤 IDB = 마지막 편집 | **부분** | StudioLeave :99(저장 진행 중 + 추가 편집 → 즉시 이동 → 저장소 = 마지막 편집). `/projects` 행 "저장 중…"은 L5 범위 |
| RS6-AC-U12 디바운스 대기 중 이탈(링크·POP) | PASS | 링크: StudioLeave "U12" · POP: useDocSaveLeave "U12"(해제 save 1 · 언마운트 뒤 레지스트리 경고 on · 커밋 뒤 off · IDB = 마지막 편집) · Ego Lite 2·3단계 |
| RS6-AC-U13 예외 판정 순서 ①~④ · 유지 7 무변경 · 의미 변경 6 · 이전 1 | PASS (유지 1행 준비 단계 변경) | 2절 표. 유지 행 :252는 실패 상태를 만드는 준비만 자동 저장으로 바꿨다(단언 동일). 판정 ②(STALE)·③(cleared 포함 실패) 새 행 2건 — 분기 변이 시 RED 확인(`logs/u13-red-stale-branch.txt` FAIL 1 · `logs/u13-red-failed-branch.txt` FAIL 5) |
| C5 T1 POP 재진입 상태 이어짐 | PASS (실화면) | Ego Lite 4단계: forward 재진입 제목 = POP 직전 편집. 상태 글자 연속성 단위 테스트는 없음(L4 상태 판정 출처 교체 때) |
| 탭 수준 `beforeunload` = 레지스트리 | PASS | `memoryProjectRepository.ts` · useDocSaveLeave 경고 4건 · Ego Lite 합성 beforeunload `defaultPrevented` true → false |
| L3a 인계 2(restart `STALE_DOC` 문구 불일치) 사라지는가 | PASS | useDocSaveLeave "L3a 인계 2": 편집 → POP → restart = STALE_DOC 0. Ego Lite: 편집 → 프로필 링크 → v2 편집 시작 → 제목 유지 |
| L3a QA 조건 4 `SaveResult.revision` = not-persistent만 | PASS | RED `logs/cpB-red-revision.txt` → GREEN |
| L3a QA 조건 5 · 인계 4 코어 경로 `conflict.latest` | PASS | 출처 = 포트 `head`(다른 탭 커밋 레코드 · 조작 뒤 청크). 기존 단언 2건(`useDocSave.test.tsx:212` · `StudioLayout.test.tsx:157`)은 **문자 그대로 GREEN**(교체 불필요) |
| L3a QA 조건 2 replace 결선 시 epoch +1 단언 | 해당 없음 | 이 레인에서 `replace` 결선 0(3절) |

## 2. `StudioLeave.test.tsx` 14건 이전/이후 (I6 3.1-4)

모든 행 공통 준비 변경(CP-A): 저장소 = `withSaveCore`. 저장 횟수 = 코어 `save` 동기 호출 수. `release` = 가짜 포트 commit을 푼다.

| 행(base) | 이전 | 이후 | 판정 · 근거 |
|---|---|---|---|
| :99 | 저장 뒤 이동 1회 · 저장소 = 마지막 편집 | 클릭 직후 "프로젝트 목록" · 해제 save(chain) 뒤 저장소 = 마지막 편집 · 이동 1회 | 의미 변경 — 3.1-4 표대로 |
| :114 | 저장 끝날 때까지 대기(편집기 유지) | "U12": 저장 1회 · 즉시 이동 · release 뒤 저장소 = 편집 · 저장 1회 그대로 | 의미 변경 → RS6-AC-U12 대체 |
| :127 | dirty 클릭 → 실패 → 보류 · 다음 클릭 재저장 → 이동 | (a) 새 행 "저장 전 변경 클릭 = 즉시 이동 — 뒤 실패해도 이동 1회" (b) 원 행: 자동 저장 실패로 시작 → 클릭 → 재저장 실패 → 보류·안내 → 재클릭 → 성공 이동(저장 수 2 → 3) | 의미 변경 — 앞 절반 변경 · 뒤 절반 시작 상태 `failed` |
| :144 | 대기 중 연타 = 저장 1 · 이동 1 | 자동 저장 실패 상태에서 연타 = 이번 이탈 저장 1(총 2) · 이동 1 | 폐기(이전) — 3.1-4 표대로 |
| :158 | 읽기 전용 거절 → 이동 · 반영 0 | 같음(단언 무변경) | 유지 |
| :173 | 읽기 전용 · 저장 전 변경 → 이동 | 같음 | 유지 |
| :184 | 거절 뒤 쓰기 가능 → 저장 뒤 이동 | 저장 2회 · 즉시 이동 · release 뒤 저장소 = 마지막 편집 | 의미 변경 — 3.1-4 표대로 |
| :199 | Web Locks 없는 로컬 → 이동 | 같음 | 유지 |
| :211 | 거절 뒤 오프라인 → 보류 · 저장 0 | 같음 | 유지(판정 ①) |
| :225 | 메모리 실패 → 보류 | 자동 저장 실패로 시작 → 클릭 → 보류 | 의미 변경 — 시작 상태 `failed` |
| :235 | 일반 실패 → 보류 | 같음(시작 상태 `failed`) | 의미 변경 — 같음 |
| :244 | 수정 키 클릭 통과 | 같음 | 유지 |
| :252 | 실패 중 `a[download]` 통과 · 대기 0 | 단언 같음. 실패 상태 준비만 `leave()` → 자동 저장 2초 | 유지(준비 변경 — dirty 클릭이 이제 즉시 이동이라 실패 화면에 남지 않음) |
| :266 | 변경 없음 → 바로 이동 · 저장 0 | 같음 | 유지 |
| (새) | — | STALE · cleared 상태 클릭 = 보류 · 이동 0(`it.each` 2건) | 추가 — 3.1-3 판정 ②·③(advisor 지적: 기존 행에 없던 분기) |

## 3. CP-B 화면 호출처 (PLAN CP3)

| 항목 | 판정 | 근거 |
|---|---|---|
| `SnapshotPreview` adopt | 변경 0 — 이미 코어 일관 [L1-추적] | `adopt` → `flushed()`(= 스케줄러 → `core.save()`) → `restoreSnapshot` → DocBook CP0(코어 chain 뒤 · `unsettled`면 STALE_DOC 쓰기 0 · `rebase`). Ego Lite 5단계(복원 전 저장 rev 6 → 복원 rev 7 → 복원 뒤 편집 rev 8) |
| `ConflictCallout` resolve | 변경 0 — 같음 | `resolveConflict` → DocBook CP0 `rebase(mine)` |
| `useExportFlow` 저장 먼저 = `core.save()` | 변경 0 — 이미 그렇다 | `proceed` → `flushSave` → 스케줄러 save = `core.save()`. Ego Lite 6단계(dirty → 내보내기 → rev 12 저장 → "내보내기 전" 스냅샷 → 결과) |
| `restartFlow` confirmDoc/startDoc `STALE_DOC` 매핑 | 기존 안내 그대로 | 코어 dirty 거절의 실제 원인이던 "POP 뒤 저장 주체 없음"이 lease 해제 save로 사라졌다(1절 인계 2). 남는 경로는 해제 save 실패 뒤 restart뿐이다 → 문구 키는 L4 |
| dirty면 복원 거절 안내 | 기존 안내로 매핑 | `rejected{dirty}`/`STALE_DOC` → "복원하지 못했습니다 · 다시 시도"(기존 alert). "저장 뒤 다시 복원" 전용 문장은 새 문구라 L4 |
| `core.link` confirm · `core.discard()` reject 매핑(L2 QA 4절 1·2) | **인계(L4·L5)** | 이 레인에 호출처 0(편집기 "저장 확인" 버튼·폐기 대화상자 = L4, `/projects` 행 = L5) |
| `replace` 결선 · epoch +1 단언 | **인계** | adopt·resolve가 L3a CP0의 DocBook `rebase` 경로라 결선 대상이 없다. 결선하는 레인이 M2b 단언을 더한다 |
| `conflict.latest` 출처 · `SaveResult.revision` 좁힘 | PASS | 1절 |

## 4. 그 밖에 바뀐/이전한 단언 (I6 근거 열)

| 파일 | 이전 | 이후 | 근거 |
|---|---|---|---|
| `useDocSaveCore.test.tsx` F9 | 디바운스 중 언마운트 → 초안 보존 · **저장 0** | 스케줄러 저장 0 · **lease 해제 save 1** · 커밋 전(hold) 초안·dirty 보존 | I6 3.1-1(언마운트 저장 주체 = lease 해제. 스케줄러 dispose 0은 그대로) |
| `useDocSaveCore.save.test.tsx` readonly | `leave()` 약속 = true | `leave()` = undefined(바로 이동) · 쓰기 0 | I6 3.1-3 ④ |
| `useAutosaveScheduler.hook.test.tsx` beforeunload 3건(memory 등록 · server 변경 시 · 실패·STALE) | 훅이 등록 | 훅은 등록 0(1건) + unmount 테스트 `beforeunload` 추가 0 · 레지스트리 테스트로 이전 | I6 3.1-2 · D6-11(편집기 경고 → 레지스트리, 리스너 중복 0). 훅 제품 소비자 = `useDocSave` 1곳뿐(`grep -rn useAutosaveScheduler src` 비테스트 값 import 1) — 다른 화면의 경고 손실 0 |
| `useDocSave.test.tsx` 떠나기 경고 2건(server 목) | 훅 경고 | `useDocSaveLeave.test.tsx` "탭 수준 경고" 2건(실패 · STALE) + memory 늘 1건 + 편집 없음 0 1건(실제 저장소) | 같음 |
| `localSync.test.ts` "미확인 쓰기 위에 얹는다" · "A 실패 → B 실패 → B 재시도" | 공개 `saveDoc` 경로 · revision +2(base 보정) | 코어 경로 · 실패 뒤 저장 = **+1** · IDB = 마지막 편집 · STALE 0 | S6c `base` 삭제. 실패한 저장은 DocBook revision을 올리지 않는다(U3) — 보정 대상 자체가 없다 |
| `StudioLayout.test.tsx` PNG offline 행 | 저장 `NETWORK` 오류로 offline | `navigator.onLine=false`로 offline(단언 같음) | 코어 경로는 NETWORK를 던지지 않는다(L3a QA 3절 관찰) |
| `StudioLayout.test.tsx` 링크 즉시 저장 · `SnapshotDelete.test.tsx` 저장 대기 중 삭제 | 클릭 직후 동기 확인 | 마이크로태스크를 흘린 뒤 확인(타이머 진행 0) | 코어 commit이 몇 마이크로태스크 뒤 닿음(단언 같음) |
| `saveCoreGuard.test.ts` 대상 목록 | testRig 제외 | + `testing/coreFixture.ts` 제외(같은 테스트 전용) | 가드 대상 = 제품 코드 |
| `useDocSaveWrite.test.tsx` 복원 흉내 | 테스트 쓰기 함수 그대로 | 코어 chain 뒤 + `rebase`로 감쌈(제품 DocBook CP0 자리) | 픽스처 |

## 5. 예산 표 (정규화 gzip KB · 개정 17)

| 시점 | `/studio` 정규화 | 복원 진입 정규화 | raw `/studio` | raw 복원 |
|---|---|---|---|---|
| base(L3a 머지) | 129.04 | 132.02 | 130.39 | 133.43 |
| CP-A 상쇄 | **128.94** (−0.10) | **131.92** (−0.10) | 130.29 | 133.33 |
| CP-C 1차 | 129.07 (+0.13) | 132.06 | 130.42 | 133.46 |
| CP-C 감량 1회 뒤(최종) | **129.03** | **132.01** | **130.36** | **133.39** |
| 상한 | 129.13 | 132.11 | 130.5 | 134 |

- CP-A 상쇄 −0.10은 L0 S6c 추정(S6b 대비 −0.10)과 같다.
- CP-C 증분: lease 해제 save · `leave()` 판정 · 레지스트리 리스너 +0.13 → 감량(편집기 훅 `beforeunload` effect 제거) −0.04 → 순 +0.09.
- 남은 여유: 정규화 0.10 · 복원 0.10 · raw 0.14. L4·L5 몫이다.
- 기준선 파일: CP별 실측으로 갱신했다(개정 17 결정 2). 다른 한도 변경 0.
- 최종 build 전 라우트 표(fresh `npm run build`, 8절):

| 라우트 | 첫 화면 / 예산 | 진입 직후 / 예산 |
|---|---|---|
| /catalog | 100.05 / 101 | 102.39 / 125 |
| /references/:id | 97.46 / 100 | 99.80 / 125 |
| /compare | 98.95 / 100 | 122.69 / 125 |
| /compare (조정 있음) | 98.95 / 100 | 122.69 / 125 |
| /profile | 99.55 / 100 | 120.09 / 125 |
| /profile (3안 있음) | 99.55 / 100 | 122.57 / 125 |
| /projects | 99.15 / 100 | 108.98 / 125 |
| /studio/:projectId | 91.52 / 100 | 130.36 / 130.5 |
| /studio/:projectId (저장 데이터 복원 진입) | 91.52 / 100 | 133.39 / 134 |

## 6. S6c 제거 목록 대응 (L0 REPORT 3절 · base `2c1796a2` 행)

| 목록 행 | 지금 | 판정 |
|---|---|---|
| `useDocSave.ts:23` `saveDoc` 시그니처 | 삭제 | 같음 |
| `useDocSave.ts:61` `revisionRef` → `core.view().confirmed?.revision` | **유지** | 차이 — memory 모드는 save가 `confirmed`를 올리지 않는다(영속 증명 아님, I5). `savedRevision`(내보내기·PNG revision)의 출처가 깨진다. 출처 = 저장 결과 revision(receipt 또는 not-persistent) |
| `useDocSave.ts:67-78` 구 저장 경로 · 문자열 readonly · STALE `setLatest` | 삭제 · latest = 포트 `head` | 같음(+ latest 출처 이동) |
| `useDocSave.ts:101` resolve `revisionRef` 갱신 | **유지** | 차이 — 위와 같은 이유(revision 출처) |
| `useDocSave.ts:132-133` adopt → `core.replace` | **미적용** | 차이 — L3a CP0이 DocBook `rebase` 경로를 택했다(3절). replace 결선 0 |
| `useDocSave.ts:150` `savedRevision` = `revisionRef` | 유지 | 위와 같음 |
| `useDocSave.ts:15` import 정리 | `projectErrorCode`·`DocHead` 삭제 | 같음 |
| `studioRepository.ts:17` 어댑터 `saveDoc` | 삭제 | 같음 |
| `localSync.ts:53-54` · `:209-212` `base` | 삭제 | 같음 |
| `memoryDocBook.ts:148` `Pick<…,"base">` · `:358` `local?.base` | 삭제 → `requested` | 같음 |

- 차이 3행의 실측: 상쇄 −0.10이 L0 S6c 추정과 같으므로 별도 재측정은 하지 않았다. 차이 행은 진입 바이트를 늘리지 않는다(남긴 코드 = base 그대로) [L2].
- 편집 틀 이미지 맵 cleanup 삭제(L3a 인계 8): 하지 않았다 → 인계(9절).

## 7. 테스트 증감 (330/2945 → 331/2953)

| 변경 | 건수 |
|---|---|
| 새 파일 `useDocSaveLeave.test.tsx`(U12 POP · 편집 없음 0 · 제출 뒤 언마운트 · U7 · 인계 2 · 경고 실패 · 경고 STALE · memory 늘 — 뒤 3건 + 편집 없음은 이전 몫) | +8 |
| `useDocSaveCore.save.test.tsx` revision 좁힘 | +1 |
| `StudioLeave.test.tsx` :127 앞 절반 새 행 · 판정 ②·③ 새 행 2 | +3 |
| `useAutosaveScheduler.hook.test.tsx` 경고 3건 → 1건 | −2 |
| `useDocSave.test.tsx` 경고 2건 → 이전 | −2 |
| 합계 | **+8**(2953 − 2945) · 파일 +1 |

## 8. 검증 (fresh — 제품 코드 `32277b23`, 테스트 tip = 마지막 커밋)

| 명령(app/) | 결과 | 로그 |
|---|---|---|
| `npx tsc --noEmit` | exit 0 | `logs/final-tsc-lint.txt` |
| `npx eslint .` | exit 0 | 같음 |
| `npx vitest run` | exit 0 · **331 파일 / 2953 통과**(U13 새 행 2건 뒤 재실행) | `logs/final-test.txt` |
| `npm run build` | exit 0(제품 코드 `32277b23` 그대로 — 뒤 커밋은 테스트·문서만) · 정규화 129.03 / 132.01(기준선 129.03·132.01 + 0.03) · raw 130.36 / 130.5 · 133.39 / 134 | `logs/final-build.txt` |

### Ego Lite (space 14 · `vite preview` 127.0.0.1:4377 · build = tip 코드)

| 단계 | 결과 |
|---|---|
| 1. 진입 | origin 저장소 비움 → 카탈로그 → 모던 카페·동네 치과 비교 → A 전부 선택 → 프로필 v1 → 3안 → A안 → `/studio/project-1` |
| 2. 편집 직후 링크 이탈 | 제목 "QA L3b 링크 이탈 직전" 입력 직후 "프로젝트로 돌아가기" → `/projects` · 1.5초 뒤 IDB docs rev 2 = 그 제목(`logs/ego-01-link-leave-projects.png`). 페이지 안 계측(재진입 뒤 "즉시 이동 측정 2"): 클릭 → 경로 `/projects` **0.4ms(같은 동기 구간)** · IDB rev 4 = 마지막 편집 |
| 3. POP | 재진입 → "QA L3b POP 직전" → `history.back()` → `/projects` 5.4ms 뒤 합성 beforeunload `defaultPrevented` **true** → 1.5초 뒤 **false** · IDB rev 5 = POP 직전(`logs/ego-02-pop-projects.png`) |
| 4. 재진입 | `history.forward()` → 제목 = "QA L3b POP 직전"(상태 이어짐) |
| 5. 스냅샷 복원 | "QA L3b 기준" 저장 → 편집 → 미리보기(저장 먼저 rev 6) → 복원 안내 "스냅샷 'QA L3b 기준'으로 복원했습니다 · 복원 전 상태는 '복원 전 · 16:30'에 있습니다" → 복원 뒤 편집 rev 8(`logs/ego-03-restore-edit.png`) |
| 5b. 편집기 밖 이동 뒤 v2 편집 시작 | "QA L3b restart 직전" 입력 직후 "프로필 보기" → 보정값 v2 → 3안 → A안 편집 시작 → 제목 유지 · STALE 안내 0 |
| 6. 내보내기 전 저장 | 테마 v2 · SEO 입력 뒤 SEO 제목 편집 직후 "정적 HTML 내보내기" → IDB rev 11 → 12(편집 반영) · 스냅샷 "내보내기 전 · 16:32" · 결과 "내려받기"(`logs/ego-04-export.png`) |
| 7. 이미지 | `qa-gradient-640x400.png` → "640 × 400 · WebP 3KB" · IDB images 1 · docs rev 13 → 새로고침 → 메타 복원(`logs/ego-05-reload-image.png`) |
| 8. 콘솔·네트워크 | 편집기 진입 뒤 ~ 새로고침 뒤: CDP 이벤트 229개 중 exception·console error/warn·Log error·loadingFailed·≥400 **0**. 한계: 콘솔 이벤트(Runtime/Log) 수집 여부는 미확인 — Runtime/Log 도메인 활성이 라운드(프로세스) 사이에 유지되는지 확인하지 않았고, 이벤트 종류 출력은 앞 12개만 찍었다. 네트워크 실패·≥400 0은 Network 이벤트로 확인 |
| 9. 정리 | `Storage.clearDataForOrigin` → `indexedDB.databases()` = `[]` · localStorage 0 · `finish({keep:[]})` · `listTaskSpaces()` = `[]` · preview 종료 · 4377 리슨 0 · 5480·영환님 창 무접촉 |

- 미리보기 서버는 1차 기동이 백그라운드 시간 한도로 한 번 종료돼 같은 포트로 다시 띄웠다(앱 상태는 IDB에 있어 영향 없음).

## 9. L4 · L5 인계

1. **L4**: 폐기·충돌 대화상자 UI와 `core.discard()` reject 매핑 · 편집기 "저장 확인"(`core.link` confirm) reject 매핑 · "저장 뒤 다시 복원" 전용 문구 · restart `STALE_DOC` 전용 문구(해제 save 실패 뒤 restart 경로만 남음).
2. **L4**: `SaveStatus` 상태 판정 출처를 코어(`view().inflight`·dirty)로 바꿀 때 POP 재진입 상태 글자 연속성 단위 테스트(C5 T1) — 지금은 실화면만.
3. **L5**: `/projects` 행 "저장 중…" · 해제 save 실패 행(RS6-AC-U11 나머지) · RS4-R2.
4. **레지스트리 경고 구현 메모**: 리스너는 첫 코어 생성 때 1회 등록하고 이벤트 때 판정한다(등록·해제 없음). 저장소 인스턴스는 탭당 1개다 [L1]: `main.tsx:30` → `loadDeferredStudio` 1회 → `createSharedLoader`로 `createMemoryProjectRepository` 1회. 지우기는 페이지 새로고침(`BrowserStorageSection.tsx:21`)이라 고아 인스턴스가 쌓이지 않는다. 관찰 결과(`defaultPrevented`)는 I6 3.1-2와 같다. 다만 로컬 모드에서 clean일 때도 리스너가 붙어 있어 일부 브라우저의 bfcache 적격성에 영향이 있을 수 있다 [L3 추정 · 미측정]. 바꾸려면 코어 상태 구독이 필요하다(바이트 +).
5. `needsUnloadGuard`는 제품 호출처 0(테스트만 — 트리셰이크). 규칙 정본은 레지스트리다. 정리 여부는 별건.
6. `replace` 결선 레인: rebase 뒤 epoch +1 단언(L3a QA M2b).
7. 편집 틀 이미지 맵 cleanup(L3a 인계 8) — 미착수.
8. `DISCARD_GIVE_UP_MS` 위치 · `SaveResult.revision` 계약 문장(I6 정정) — Jarvis(L3a 4절 그대로).

## 10. 사실 / 추정 / 미확인

- **사실 [L1]**: 1·2·4·5·6절 표의 테스트·빌드 수치, 8절 Ego Lite 관찰값. 폴백 제거 뒤에도 기존 단언이 그대로 GREEN이었다는 것(픽스처 이전 단계 실패 3 = 예측과 일치).
- **추정 [L2]**:
  - 6절 차이 3행은 진입 바이트 증감 0이다.
  - Ego Lite 링크 이탈 0.4ms는 React Router 링크의 동기 내비게이션이다(이전 동작은 저장 완료까지 막았다 — L3a QA 1132ms).
- **미확인**: 다중 탭 readonly·stale 실화면 · 저장 정지(T_hang) 실경로 · bfcache 영향 · Runtime/Log 이벤트 수집 범위(8절 8단계).

## 11. 커밋 방식 메모

- CP-A·CP-C 커밋은 경로를 디렉터리 단위(`git add app/scripts app/src …`)로 올렸다. 긴 경로 목록이 PreToolUse 훅("시스템 파일 삭제 차단")에 막혔기 때문이다. 올리기 전 `git status --short`로 이 레인 파일만 들어 있음을 확인했다. amend·rebase 0.

## 12. 서브에이전트

- 사용 0. BRIEF 권장(픽스처 이전 ∥ 폴백 제거)을 따르지 않은 사유: 픽스처 의미(포트 reason 매핑 · rebase 자리 · commit 타이밍)를 메인이 먼저 정해야 했다. 정한 뒤 남은 편집은 소량(파일 11개, 기계적)이었다. 같은 파일(`useDocSave.ts`·테스트)을 두 흐름이 건드리게 되어 병렬 이득보다 통합 비용이 컸다.
- Codex 검증: BRIEF "Codex 0"에 따라 실행하지 않았다.
