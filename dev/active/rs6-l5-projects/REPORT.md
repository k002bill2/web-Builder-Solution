# RS6-L5 REPORT — `/projects`·프로필 연결

브랜치 `k002bill2/rs6-l5-projects` · base `aca09805` · 구현 커밋 `28747748` · 착수 `3be3b529`

## 결론
- **`/projects` 행이 저장 코어 상태를 읽는다.** 코어를 만들지 않고 레지스트리를 읽기만 한다.
  - 저장 중이면 "저장 중…", 해제 save가 실패하면 "저장하지 못했습니다" + "다시 저장"을 보인다.
  - 미확인 기록이 있으면 "저장 확인"(코어 confirm)을 보이고, 시작 대기면 "시작 다시 시도"를 보인다.
- 인계 note 1(Medium, 편집기 밖 실패 표시 없음)과 RS6-AC-U11 나머지("저장 중…")를 **닫았다**. 단위 테스트로 판정했고, "저장 중…"은 실화면에서도 확인했다.
- **예산**: `/studio` 정규화 **129.09 (+0.00)**, 복원 **132.07 (+0.00)**. 목표였던 증분 0을 지켰다. `m2cBaseline.json`·`bundleBudget.test.mjs`·`check-bundle-size.mjs`는 수정하지 않았다.
- **게이트 fresh**: typecheck 0 · lint 0 · test **332 / 2968** (base 331/2957 + 1 / +11) · build exit 0.
- **Codex review**: 1회(`--scope branch --base aca09805`), 지적 0건(`logs/codex-review-1.log`).

## AC 판정
| AC | 판정 | 근거 |
|---|---|---|
| RS6-AC-U11 나머지(`/projects` 행 "저장 중…") | PASS [U]·실화면 | `ProjectsCoreRows.test.tsx` "저장 중 → idle 뒤 일반 행"이 다른 이벤트 없이 복귀한다. 실화면은 지연 주입으로 1280·390에서 확인했다 |
| 인계 note 1(해제 save 실패 표시) | PASS [U] | 실패 행은 "저장하지 못했습니다" + "다시 저장"이다. 버튼은 `core.save`를 1회만 호출하고 연타해도 1회다. 성공하면 status "다시 저장했습니다", 일반 행, 포커스 = 편집기 열기, IDB = 마지막 편집이 된다. 실패(readonly)면 alert에 UX-5 원문을 내고 포커스를 유지한다. reject는 실패로 매핑한다(거짓 saved 0, 진행 표시 해제) |
| CP1 행 "저장 확인" → confirm 1회 · UX5-AC-08 | PASS [U] | 기록 + 코어(clean·커밋) 상태에서 `core.link`(confirm)를 1회 부르고 `confirmDoc`는 0회다. 쓰기 0(C5 T13). 기억 0, 포커스 = 편집기 열기 |
| RS6-AC-U16(RS4-R2) | PASS [U] | 기록 뒤 코어가 local 커밋에 성공하면 행 기억이 0이 된다. 반대로 저장이 없으면 기억을 유지한다 |
| CP2 PendingStart 유지 · "시작 다시 시도" | PASS [U] | 코어 저장이 성공해도 시작 대기는 풀리지 않는다. "시작 다시 시도"를 연타해도 starter(재생 = `startDoc`)는 1회다. 진행 중 `aria-busy`. "저장 확인" DOM 0(UX5-AC-11) |
| CP3 · RS6-AC-B2 단위판(C5 T5) | PASS [U]·실화면 일부 | 새 이미지를 편집하고 해제 save가 실패해 편집 틀 맵이 없어도, "다시 저장"이 코어 바인딩으로 이미지 레코드까지 커밋한다. 실화면은 이미지를 고른 직후 이탈 → 새로고침 → IDB images 1건으로 확인했다 |

## 예산 (fresh `npm run build`, 같은 머신)
| 라우트 | base | 최종 | 증분 | 한도 |
|---|---|---|---|---|
| `/studio` 정규화(raw) | 129.09 (130.42) | 129.09 (130.44) | +0.00 (raw +0.02 해시 흔들림) | 129.13 · raw 130.5 |
| 복원 진입 정규화(raw) | 132.07 (133.45) | 132.07 (133.47) | +0.00 | 132.11 · raw 134 |
| `/projects` 첫 화면 / 진입 | 99.16 / 109.04 | 99.18 / 109.64 | +0.02 / +0.60 | 100 / 125 |
| `/profile` 첫 화면 / 진입 | 99.56 / 120.10 | 99.56 / 120.09 | 0 / −0.01 | 100 / 125 |
| `/catalog` 첫 화면 / 진입 | 100.05 / 102.39 | 100.06 / 102.40 | +0.01 흔들림 | 101 / 125 |
- 레지스트리 접근자만 따로 측정했다(`logs/accessor-build.log`): `/studio` 129.09 · 복원 132.07, 증분 0.
- BRIEF의 `/projects` 진입 108.92와 fresh 기준선 109.04가 다르다. 기준선은 fresh 값으로 잡았다.

## 바뀐 것 (파일)
- `app/src/features/projects/pendingRows.ts`: 진입 직후 청크.
  - `describeRow`: 행 상태 1개를 고른다. 우선순위 = 시작 대기 > 저장 중 > 저장 실패 > 미확인 기록.
  - `watchCores`: 저장 중인 코어는 `idle()` 뒤 다시 판정한다. U16 해제도 여기서 한다.
  - `coreOf`: 레지스트리 읽기.
- `app/src/features/projects/pendingRetry.ts`: 조작 뒤 청크. `retryRow`가 버튼 → method를 1:1로 고른다.
  - "다시 저장" = `core.save`
  - "저장 확인" = 코어 `confirm`(코어가 없으면 기존 `confirmDoc`)
  - "시작 다시 시도" = 기존 재생
- `app/src/features/projects/coreRowText.ts`(신설): 행 문구. UX-5 원문만 쓴다.
- `app/src/features/pending/pendingText.ts`: `retrySave` "저장 다시 시도" → `retryStart` "시작 다시 시도"(UX-5 4.1 · D1).
- `app/src/components/projects/ProjectRow.tsx`: 버튼 이름 선택(없으면 버튼 0), `open`(편집기 열기 유지), `quiet`(저장 중은 실패 색을 쓰지 않음).
- `app/src/pages/ProjectsPage.tsx`(배선만):
  - `describeRow`·`watchCores`를 사용한다.
  - 본문 reject를 실패로 매핑한다(진행 표시가 고착되지 않게).
  - 실패면 포커스를 유지한다(UX5-AC-08).
  - 폐기 버튼은 미확인 기억이 있을 때만 보인다.
- `app/src/data/memoryProjectRepository.ts`: 반환 객체에 `cores`를 더했다(1줄). `features/studio/save/saveCore.ts`의 `CoreKeeper.cores?`는 타입만 바뀌었다.
- 테스트:
  - `components/projects/ProjectsCoreRows.test.tsx`(신설, 10건)
  - `pages/ProjectsPending.test.tsx`: 라벨 단언을 교체했다(약화 아님 — 같은 버튼이고 이름만 UX-5 D1). 연타 1회 테스트를 새로 넣었다.

## 설계 판단·차이 (사유 1줄씩)
- **쓰기 표 밖 3파일**: `memoryProjectRepository.ts`(접근자 1줄) · `saveCore.ts`(타입) · `pages/ProjectsPage.tsx`(배선)는 PLAN L5 쓰기 표에 없다. 레지스트리가 저장소 closure 안에 있어 읽기 접근자가 필요했고, `/projects` 배선은 페이지에 있다. L4 경로와 겹치는 곳은 0이다.
- **`repo.core(id, seed)`는 `/projects`에서 부르지 않는다**: starter가 없는 코어가 생기고, memory 모드에서는 탭 경고가 늘 켜지기 때문이다.
- **"다시 저장"(= save) vs UX-5 2.3 "편집기 밖 dirty = unconfirmed '저장 확인'"**: BRIEF CP1b를 따랐다(실패 + "다시 저장" = 코어 `save`). I6 12절 "/projects 행 '다시 저장'"과 같다.
- **"저장 확인" + 코어**: clean이면 confirm은 재읽기만 하고 쓰기 0이다.
  - 재읽기가 마지막 증명과 다르면(`stale`·`not-committed`) 쓰기 탭(`mode() === "writer"`)에서만 초안을 같은 문서로 한 번 표시하고 다시 confirm한다(save + verify).
  - 이 경우 `link`는 3회(confirm·mode·confirm)다. clean이지만 receipt가 IDB에 없는 경우(restart `rebase` 뒤 flush 실패 · 어댑터 거짓 성공)에 거짓 `stale`이나 거짓 확인이 나지 않게 하려는 조치다.
- **U16 해제 조건**: 코어가 clean이고 inflight 0이며 `confirmed.proof === "committed"`이고 `confirmed.revision > record.head.revision`일 때 해제한다. `rebase`도 proof를 `committed`로 만들기 때문에 revision으로 "기록 뒤 새 커밋"을 가린다. head가 없는 기록은 자동으로 해제하지 않는다(보수적).
- **CP2 starter 주입**: 레지스트리 코어는 편집기가 starter 없이 만든다. 주입점을 만들려면 `memoryProjectRepository` 생성 경로를 바꿔야 해서(`/studio` 진입 바이트), 대신 `/projects` "시작 다시 시도"가 starter(기존 `retryPending` 재생)를 직접 1회 부른다. `restartFlow.ts`는 바꾸지 않았다.
- **새 문장 1개**: image-missing 행 "이미지가 빠져 있어 저장을 확인하지 못했습니다". UX-5 원문은 "이미지 {n}개가 빠져 있어 저장을 확인하지 못했습니다"인데, 코어 결과에 개수가 없어 개수를 뺐다.
- **"저장 중" 행**은 "편집기 열기"를 유지하고 버튼은 두지 않는다(UX-5 `saving` 행동 없음). 실패 행도 편집기 열기를 유지한다(재진입 seed가 dirty 초안을 다시 저장한다 — L3).
- `/profile`의 "저장 다시 시도"(restartText)는 바꾸지 않았다. 쓰기 표 밖이고 `/profile` 첫 화면 여유가 0.44다. UX-5 D1 전면 적용은 남은 일이다.

## 실화면 (Ego Lite · `npm run build` + `vite preview --port 4381 --strictPort` · TaskSpace 18)
1. 카탈로그 → 비교 2개 → A 전부 선택 → 프로필 확정 → 3안 → A안 편집 시작 → 제목을 편집하고 바로 "프로젝트로 돌아가기"를 눌렀다. 실제 IDB에서는 목록이 그려지기 전에 저장이 끝나 일반 행만 보였다(거짓 실패 0).
2. 지연을 주입했다: 페이지 안에서 `design-studio` 전 store에 readwrite 트랜잭션을 3~4초 점유한 뒤 같은 흐름을 반복했다. 결과는 행 "저장 중…"(편집기 열기 유지 · 버튼 0 · 캡션) → 2023ms 뒤 일반 행이다(다른 이벤트 없음). 1280·390 스크린샷: `shots/1280-saving.png`·`1280-saved.png`·`390-saving.png`·`390-saved.png`·`1280-after-leave.png`.
3. 새로고침 뒤 마지막 편집 "폭 390 이탈 편집"이 복원됐다.
4. 이미지: 편집기에서 이미지를 고르고 바로 링크로 이탈했다 → 일반 행 → 새로고침 → IDB `images` = `project-1/4a758fcb-766f-4dcf-8c4f-6299bfa58779` 1건, 문서 참조와 일치.
5. **BLOCKED(단위로 갈음)**: 해제 save **실패** 주입과 `PendingStart` 행("시작 다시 시도")은 앱 안에서 만들 경로가 없다(IDB 쓰기 실패·restart 실패 주입 0). `ProjectsCoreRows.test.tsx`·`ProjectsPending.test.tsx`로 판정했다.
6. 정리: IDB `design-studio` 삭제(`databases()` = []) · `finish` · `listTaskSpaces` 0 · 서버 종료(4381 리슨 0) · 5480 무접촉.

## 검증 명령 (fresh)
- `npm run typecheck` → 오류 0 · `npm run lint` → 0
- `npm test -- --run` → 332 files / 2968 tests passed (`logs/full-test-1.log`)
- `npm run build` → exit 0 (`logs/cp-build.log`)
- 변이 5/5 FAIL(`logs/mutations.log`): idle 대기 제거 · U16 해제 제거 · 확인 재쓰기 제거 · 실패 포커스 유지 제거 · save reject 매핑 제거
- Codex `review --scope branch --base aca09805` → 지적 0

## QA 게이트 인계
- 실화면 PASS 주장은 QA만 한다. 이 레인은 위 관측만 남긴다.
- QA가 볼 것:
  - 실패 행(앱 안 주입 수단이 생기면)
  - `PendingStart` 행 실화면
  - B2 원문 시나리오("저장 확인" 라벨 — 이 레인은 실패 시 "다시 저장")
  - 390에서 실패 행 버튼 줄바꿈
- 남은 일: `/profile` "저장 다시 시도" → "시작 다시 시도"(D1) · 코어 starter 주입점(편집기 생성 경로 — L4 이후).
- L3b note 2(링크 이미지 경로 순서 의존)는 이 레인 범위 밖이다. FIX1(`keep`)이 이미 머지돼 있고, 실화면 4번은 이미지 저장을 확인했다.

## 사실 / 추정 / 미확인
- **사실**: 위 게이트·변이·예산 수치와 실화면 관측(명령 출력·스크린샷).
- **추정**: 실 IDB에서는 해제 save가 목록 렌더보다 먼저 끝나는 경우가 대부분이다(관측 1회). 느린 기기에서는 "저장 중…"이 보인다.
- **미확인**: 실제 쓰기 실패(quota 등)에서 실패 행이 실화면에 뜨는지. 다른 탭 잠금(readonly)이 실화면 행 문구로 나오는지(QA RS6-AC-B3).

## 서브에이전트
- 0개(BRIEF "서브에이전트 분할: 불필요").
