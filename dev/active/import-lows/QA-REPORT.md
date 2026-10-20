# IMPORT-LOWS QA REPORT — B-SEC-01·02·03 독립 검증 (정적·회귀, 브라우저 0)

대상 tip `0a89ef10` · 브랜치 `k002bill2/import-lows` · base `2531ebf8` · QA 2026-10-20

## 판정
(초안 — 진행 중)

## 1. fresh 게이트 · 예산 — PASS
워킹 트리 = `0a89ef10` + 문서만(앱 diff 0). app/에서 순차 실행(2026-10-20 10:19–10:21).
| 게이트 | 명령 | 결과 |
|---|---|---|
| typecheck | `npm run typecheck` | exit 0 |
| lint | `npm run lint` | exit 0 |
| test | `npx vitest --run` | Test Files 375 passed · Tests 3374 passed · exit 0 |
| build | `npm run build` | exit 0 · 618 modules (`logs/qa-build.txt`) |
- 예산: `/studio/:projectId` 해시 정규화 진입 **128.76KB**(기준선 128.76 · 멈춤 > 128.79) · 저장 데이터 복원 진입 **131.76KB**(기준선 131.75 · 멈춤 > 131.78) — REPORT 6절 값과 일치.
- 주의: `/tmp/qa-build.txt`에 10-18 다른 세션 잔존본이 있어 한때 128.82/131.81로 읽힘 → 파일 mtime 확인 후 fresh 본(10:21)만 근거로 씀.

## 2. 변이 5종 — PASS (전부 FAIL로 잡힘 · 매번 `git checkout -- src` 복원 · `git status --short src` 빈 값 확인)
실행: `npx vitest --run src/features/projectFile src/data/persistence` (337 tests 기준).
| # | 변이 | 결과 | 잡은 테스트 |
|---|---|---|---|
| M1 | `IMPORT_IMAGE_ID`·`EXPORT_IMAGE_ID` → `[0-9a-fA-F]` · 버전/variant 자리 무시 | 2 FAIL | checkImages "레코드 — localId에 / · 중복 · 형식 모름…"(행동) · readProject parity `EXPORT_IMAGE_ID.source` |
| M2 | Blob.type 검사 제거(readImageRecord + exportImageOf 양쪽) | 2 FAIL | imageRecord "변형본 Blob.type ≠ image/<형식>…" · readProject parity "말뭉치 통과·거절 둘 다" |
| M2b | exportImageOf 쪽만 제거 | 5 FAIL | readProject parity SEC L-4 5건(svg+xml·text/html·빈 값·jpeg·한 단만) |
| M3 | readProject: 손상 레코드 1개면 `unreadable`(내보내기 전체 실패) | 3 FAIL | readProject "왕복 보장 — 정상 1 + 손상 1"·"width 1280 + variants 640만…"·"깨진 이미지 레코드는 건너뛴다" |
| M4 | `PROJECT_KEYS`에 `hasDoc: true` 추가 | 1 FAIL + typecheck TS2353 | rekey "project에 hasDoc… → 키 = Project 7개" · `tsc` exit 2 |
| M5 | 정규화를 저장 뒤로(plan = 원본 spread, `recordsHold`만 정규화본) | 2 FAIL | rekey SEC L-2 project·series/DocRecord/스냅샷 2건 |
- 참고: M1에서 readProject 행동 테스트("수정 전 가져온 project-1/a")는 통과 — `a`는 완화 정규식에도 안 맞아서. 대문자·버전 무시 완화는 readProject 쪽에선 parity만이 잡는다(리터럴 복제 구조상 parity가 그 역할 · 결함 아님).

## 3. 기존 사용자 데이터 회귀 — PASS (깨지는 경로 0)
근거: `git diff 2531ebf8 -- app/src`(앱 코드 4파일) + 호출부 grep(`readImageRecord|exportImageOf|readProject(|rekeyImport|checkImages(`).
| 새 검사 | 위치 | 걸리는 경로 | 저장 레코드 읽기에도? | 기존 데이터 영향 |
|---|---|---|---|---|
| localId = UUID v4 소문자 | `checkImages.ts:113` `IMPORT_IMAGE_ID` (← `checkFile.ts:138`) | 가져오기만 | 아니오 | 없음(파일 검사) |
| localId = UUID v4 소문자 | `readProject.ts:126` `EXPORT_IMAGE_ID` | 프로젝트 파일 내보내기만 | 예(내보내기 읽기) | UUID 아닌 레코드 = **그 레코드만 제외**·내보내기 성공. 문서가 그런 id를 참조할 수 없음(`validatePageDoc.ts:50` parseLocalImageId) → 렌더 손실 0 |
| 모르는 키 버림 `pick(PROJECT/VERSION/RECORD/SNAPSHOT_KEYS)` | `rekey.ts:59-60·49-52` (← `writeImport.ts:100`) | 가져오기만 | 아니오 | 없음 — 저장 레코드 읽기(entryRead·localSync)·열기·편집·내보내기 경로 무변경 |
| Blob.type = `image/<format>` | `imageRecord.ts:39` readImageRecord (← `imageRestore.ts:52` 열기 복원) · `readProject.ts:77` exportImageOf | **열기(이미지 복원)** · 프로젝트 파일 내보내기 | **예** | 아래 |
- Blob.type 검사가 저장 레코드 읽기에도 걸리지만 기존 레코드를 떨구지 않는 근거(L1 코드): 저장되는 변형본의 출처는 둘뿐 — (a) 화면 ingest `ingestImage.ts:76-77` `deps.encode(…, choice.type)` 뒤 `blob.type !== choice.type`면 throw(도입 `d703b1e4` 10-05, 이미지 영속 `4950ccb2` 10-07보다 먼저 → 영속된 모든 레코드가 이 검사를 통과한 Blob), (b) 가져오기 `checkImages.ts:74` `new Blob(…, { type: \`image/${format}\` })`. IndexedDB 구조화 복제는 Blob.type을 보존. 따라서 정상 경로로 저장된 레코드는 전부 `image/<format>`이고, 걸리는 것은 외부 변조 레코드뿐이며 그때도 **그 이미지만 잃은 이미지**(열기 실패·편집 실패 아님).
- 편집: 편집 경로(saveCore·localSync)는 이번 diff 무변경 — `localSync.ts:208·226` 이미지 존재 검사는 키 존재·imageMeta만 보고 새 검사 미호출.
- 단위 테스트 위치: `readProject.test.ts:200` "수정 전 가져온 project-1/a(UUID 아님) + 정상 UUID → UUID만 · encode → checkFile ok" · `readProject.test.ts:174` 정상1+손상1 왕복 · `rekey.test.ts:98·105` 모르는 키 → 빠짐 · `imageRecord.test.ts:80-83` Blob.type 5종 → undefined · `imageRestore.test.ts:63` 불량 레코드 id만 빠지고 나머지 복원 · 1항 fresh test 3374 pass(기존 저장 픽스처 `persistenceContract.ts:67`·`imageRestore.test.ts:20` 모두 `type: "image/png"`).
- 한계(Low): 브라우저 실데이터(실 IndexedDB 기존 프로필) 확인은 브리프상 금지라 미실시 — 코드 경로 근거(L1)만.

## 4. B-SEC-03 그 이미지만 잃은 이미지
(진행 중)

## 5. 픽스처 이전/이후 단언 약화
(진행 중)
