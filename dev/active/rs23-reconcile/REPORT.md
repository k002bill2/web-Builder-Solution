# RS23-RECONCILE REPORT — rs23-impl(`7d16fac5`) ↔ main(`d09f0cd9`, RS4 병합본)

QA · 2026-10-16 · 읽기 전용 정적 대조 + main 기준선 게이트 1회. 앱 코드 변경 0.

## 0. 결론

- **이식 필요 5건(P1 2 · P2 3) — 전부 "테스트(회귀 고정) 이식"이고, 동작 이식은 0건으로 추정.** rs23-impl의 기억 체계(`unconfirmedStart`·`startCheck`·`unconfirmedRetry`)는 SPEC-4(`pendingWrites`·`restartFlow` 판정표)가 대체하므로 **코드는 폐기 가능**. 다만 아래 테스트 단언은 main에 대응물이 없어 이식(main API에 맞춰 재작성)이 필요하다.
- 별건(이번 범위 밖, 사실): **main 기준선 `npm test` 1건 실패** — `src/pages/ProjectsPage.test.tsx` "알림 영역은 둘(목록·저장소)" 단언이 `['프로젝트 알림', null, '저장소 알림']`을 받음(RS4 미확인 행 알림 영역 추가로 추정). 이식 레인 전 정리 필요.

## 1. RS3-AC 매트릭스 (18개)

| AC | 판정 | main 근거 | rs23-impl 근거 | 비고 |
|---|---|---|---|---|
| 01 | **main 누락(부분)** | `restartLock.test.ts:146-179` (RS4-AC-15: 다른 탭 잠금 → READ_ONLY_TAB · 메모리 0 · IDB 쓰기 0 · 놓으면 성공) | `createLock.test.ts:80,99,114` | main은 **held 경우만**. create의 stale(C-E2b)·unsupported(C-E3 기본 사유)·cleared(C-E2c) 단언 없음. restart 쪽 stale은 `restartLock.test.ts:113-134`. RS4-AC-15가 "RS3-AC-01 유지"라 대체 아님 |
| 02 | **main 누락(부분)** | 기존 단언 `restartLock.test.ts:136-142` 그대로 존재(통과) | `createLock.test.ts:175` | "다른 탭 writer + IDB 저장 문서 → 편집 시작 F2 이동/F4 대화상자 · 잠금 요청 0 · 기억 0 · 링크 유지" 추가 단언이 main에 없음(`ProfileRestart.test.tsx:76` F2·F3는 다른 탭 잠금 없이) |
| 03 | main 충족 | `restartLock.test.ts:181-200`(RS-AC-08b 재생으로 flush 재제출) · `ProfileRestart.test.tsx:322`(주입 단계별) · `autoSnapshotRetention.test.ts:82`(재생 스냅샷 신규 0) | `unconfirmedStart.test.ts:158` | create 쪽 ①②③ 세 주입 조합을 한 테스트로 묶은 단언은 없음 — 재생 멱등은 저장소 공통이라 충족으로 판단(추정) |
| 04 | **main 누락** | 코드 사실: 프로필·`/projects` 흐름에서 `tryLock` 직접 호출 0(`tryLock` 사용처 = `tabLockHold.ts:46`·`writerLock.ts`뿐, grep) | `createLock.test.ts:124,138,151,168` | ①같은 탭 writer restart 재요청 0 · ②비쓰기 탭 파괴 흐름 뒤 create 자기 잠금 거절 0 · ③싱크 멈춤 뒤 create = C-E2c, 그리고 `tryLock` 가드 테스트 — main에 대응 테스트 없음. RS4-AC-15가 "RS3-AC-04 유지" 명시 |
| 05 | main 충족(부분) | `restartFlow.test.ts:32-59`(F-5~F-9 · RS4-AC-04·16) · `ProfileRestart.test.tsx:322`(restart 단계 주입) | `unconfirmedStart.test.ts:89,107,118,128,139` | 판정표는 SPEC-4 4.1(RS4-AC-04)로 대체·충족. **create 실저장소 단계 주입(commit=C-E3 · response/flush=C-E4)과 거짓 양성(같은 쌍 기존 문서 + request 실패 = C-E3) 단언은 main에서 가짜 저장소 결과 수준만** → P2 이식 후보 |
| 06 | main 충족 | `ProfileRestart.test.tsx:546-`(C-E4 → 다른 안도 같은 Callout · 요청 0 · 재시도 = 재생) · `ProfileRestart.test.tsx:396`(RS-AC-08d R-E4) · RS4-AC-03 | `unconfirmedStart.test.ts:198,210` · `ProfileCreateStart.test.tsx:53` | |
| 07 | main 충족 / SPEC-4가 대체(P-U4) | `ProjectsPending.test.tsx:50,63,77,94,132,146` | `ProjectRow.test.tsx:52,83,108,123,137` | 행 규격은 RS4-AC-07로 대체. restart "요청 전 그대로" P-U4 → SPEC-4 RS4-D5(origin `doc`이면 `PendingRecord`). 연타 1회·aria-busy(`ProjectRow.test.tsx:83`)는 main 대응 미확인 |
| 07b | main 충족(판정 수준) | `restartFlow.test.ts:62-77`(재생 flush 실패 = 유지 → 성공 = 해제) · `:145` | `unconfirmedStart.test.ts:219,241` | 실저장소 "편집 quota → IDB = 메모리(restart+편집)" 단언은 main에 없음 — P2 |
| 07c | main 충족 | `restartFlow.test.ts:133`(더 나감 = 미확인 · STALE_DOC = 사유) · `pendingWrites.test.ts:37` · `restartFlow.test.ts:158`(늦은 결과 세대) | `unconfirmedStart.test.ts:273` | 언마운트 뒤 settle → SPEC-4 0절 2(기억은 모듈 수준, 화면 무관) |
| 07d | SPEC-4가 대체 | `restartFlow.test.ts:94,145`(STALE/DOC_EXISTS → `PendingRecord` · 저장 확인) | `unconfirmedStart.test.ts:292,312,321` · `ProfileCreateStart.test.tsx:76` | RS4-D2 · RS4-AC-02: "기억 삭제·링크 복원" → `PendingRecord` 유지 + `confirmDoc`. rs23 종결 동작은 이식 금지 |
| 07e | main 충족 | `restartFlow.test.ts:61-91`(RS4-AC-01 · before 재조회 0) | `unconfirmedStart.test.ts:336,354` | RS4-D1 · RS4-AC-01이 같은 F1을 닫음 |
| 08 | SPEC-4가 대체 | (E) — RS4-AC-09 경고 실측 | rs23 REPORT [E] | RS4-D3: 경고 없음 → `beforeunload`. 하이드레이션 [U]는 공통 저장소 경로(추정) |
| 08b | SPEC-4가 대체 | `pendingText.ts:17-18` P-U5 캡션(SPEC-4 5절 285행) | `unconfirmedStart.test.ts:364` | "그 뒤 편집은 사라집니다" 문구 → SPEC-4 P-U5 문구로 교체 |
| 09 | SPEC-4가 대체 | RS4-AC-10 [E](main 커밋 `4eb303aa` QA 기록) | rs23 REPORT [E] | 실측 재실행은 미실행 |
| 10 | **main 누락(부분)** | 기존 회귀 전체 suite(4절) | `unconfirmedStart.test.ts:256` | R-E4(flush 실패) → 편집 저장 1회 성공 → IDB = 새 문서+편집 · "새로 시작 전" 스냅샷 1 — main에 대응 없음. RS4-AC-11(편집기 재진입)은 CP4라 main 미병합(브리프: RS4 = CP1~3) |
| 11 | SPEC-4가 대체 | SPEC-4 9절 · RS4-AC-12 | rs23 `cp3-build.txt` | 예산 판정선은 이번 범위에서 미측정(build 미실행) |
| 12 | **main 누락(대응 가드)** | 검증 4종 중 typecheck·lint 통과, test 1 실패(4절). `pendingWrites` import 간선 테스트 없음(grep: `pendingWrites` 참조 = 실코드 4 + 테스트 3, 가드 테스트 0) | `unconfirmedStart.test.ts:379` | RS4-AC-12 "`pendingWrites` 런타임 import 0"을 고정하는 테스트가 main에 없음(빌드 예산 스크립트로만 볼 가능성 — 미확인) |
| 13 | main 충족 | `ProjectRow.tsx:73` `aria-label={`${row.name} ${pending.label}`}` · `ProjectsPending.test.tsx:63`(status)·`:77`(alert)·`:109`(alertdialog) | `ProjectRow.test.tsx:52,83` | 1280·1024·390 [E]는 미실행 |

## 2. rs23-impl 고유 테스트 `it` 매핑

| 파일:행 | AC | 판정 | main 대응 |
|---|---|---|---|
| createLock:80 held→재시도 성공 | 01 | 충족 | restartLock:162 |
| createLock:99 stale → 다시 시도 쓰기 0 | 01 | **누락** | 없음(restart만 :113) |
| createLock:114 unsupported → 기본 INFRA | 01 | **누락** | 없음 |
| createLock:124 ① 같은 탭 restart 재요청 0 | 04 | **누락** | 없음 |
| createLock:138 ② 파괴 흐름 뒤 create 거절 0 | 04 | **누락** | 없음 |
| createLock:151 ③ 싱크 멈춤 뒤 create = cleared | 04 | **누락** | 없음 |
| createLock:168 `tryLock` 직접 호출 0 | 04 | **누락**(코드 사실은 충족) | 없음 |
| createLock:175 저장 문서 열기 + 다른 탭 writer | 02 | **누락** | 없음 |
| unconfirmedStart:89 단계별 C-E3/C-E4 | 05 | 부분(P2) | restartFlow:33-49(가짜) |
| unconfirmedStart:107 commit 단계 = C-E3 | 05 | 부분(P2) | 없음(실저장소) |
| unconfirmedStart:118 거짓 양성 0 | 05 | 부분(P2) | restartFlow:40 F-9(가짜) |
| unconfirmedStart:128 C-E5 | 05 | 충족 | restartFlow:49 |
| unconfirmedStart:139 음성 사유 매핑 | 05/01 | 부분 | restartFlow:40(사유 전달) |
| unconfirmedStart:158 describe 03 | 03 | 충족 | restartLock:182 · ProfileRestart:322 |
| unconfirmedStart:198 · 210 | 06 | 충족 | ProfileRestart:546 · :396 |
| unconfirmedStart:219 · 241 | 07b | 판정 충족 / IDB 단언 P2 | restartFlow:62 |
| unconfirmedStart:256 RS3-R1 편집 저장으로 닫힘 | 10 | **누락** | 없음 |
| unconfirmedStart:273 | 07c | 충족 | restartFlow:133 · pendingWrites:37 |
| unconfirmedStart:292 · 312 · 321 | 07d | SPEC-4 대체 | restartFlow:94 · :145 |
| unconfirmedStart:336 · 354 | 07e | 충족 | restartFlow:62 · :85 |
| unconfirmedStart:364 P-U5 문구 | 08b | SPEC-4 대체 | pendingText.ts:18 |
| unconfirmedStart:379 import 간선 | 12 | **누락(대응 가드)** | 없음 |
| ProfileCreateStart:53 | 05·06 | 충족 | ProfileRestart:546 |
| ProfileCreateStart:76 R-E6 종결 | 07d | SPEC-4 대체 | restartFlow:145 |
| ProjectRow:52 | 07·13 | 충족 | ProjectsPending:50·63 |
| ProjectRow:83 연타 1회·aria-busy | 07·13 | 미확인 | main 대응 테스트 미발견 |
| ProjectRow:108 restart 음성 P-U4 | 07 | SPEC-4 대체 | RS4-D5 |
| ProjectRow:123 create 음성 P-U4 | 07 | 충족(판정) | restartFlow:85 |
| ProjectRow:137 repo 없이 = 링크 | 07 | 미확인 | — |

## 3. 이식 필요 목록 (테스트 이식 — main API로 재작성)

| # | 우선 | 내용 | 예상 파일 | 예산 영향(추정) |
|---|---|---|---|---|
| 1 | P1 | RS3-AC-04 ①②③ + `tryLock` 직접 호출 0 가드 (RS4-AC-15가 유지 명시) | `app/src/data/persistence/restartLock.test.ts` 또는 신규 `createLock.test.ts` | 0B(테스트만) |
| 2 | P1 | RS3-AC-01 create stale(C-E2b)·unsupported·cleared 쓰기 0 | 같은 파일 | 0B |
| 3 | P2 | RS3-AC-02 다른 탭 writer + 저장 문서 → F2/F4 · 잠금 요청 0 · 기억 0 | `app/src/pages/ProfileRestart.test.tsx` 또는 위 파일 | 0B |
| 4 | P2 | RS3-AC-10 [U] R-E4 → 편집 저장 성공 → IDB = 메모리 + 스냅샷 1 · RS3-AC-07b 실저장소 IDB 단언 · RS3-AC-05 create 실저장소 단계 주입 | `restartLock.test.ts` | 0B |
| 5 | P2 | RS3-AC-12 대응 — `pendingWrites` 정적·동적 import 간선 가드(`StudioPage`·`StudioLayout`·`useDocSave`·`memoryProjectRepository`) | 신규 `app/src/test/pendingImportGuard.test.ts` | 0B |

단, 위 테스트를 main에 옮겼을 때 GREEN인지(동작까지 있는지)는 **미확인** — RED면 동작 이식으로 바뀐다.

## 4. 실행 명령 · 결과 (`app/`, main `d09f0cd9`)

| 명령 | exit | 수치 |
|---|---|---|
| `npm ci` | 0 | — |
| `npm run typecheck` | 0 | 오류 0 |
| `npm run lint` | 0 | 오류 0 |
| `npm test -- --run` | **1** | Test Files 1 failed / 308 passed (309) · Tests 1 failed / 2811 passed (2812). 실패 = `src/pages/ProjectsPage.test.tsx` "목록이 비어도·있어도 … 알림 영역은 둘(목록·저장소)" — `expected ['프로젝트 알림', null, '저장소 알림'] to deeply equal ['프로젝트 알림', '저장소 알림']` |
| `npm run build` | 미실행 | 범위 3 외 |
| 누락 후보 임시 이식 RED/GREEN | **미실행** | 15분 실행 예산 부족 |
| 최종 `git status --porcelain` | — | `app/` 변경 0 확인(커밋 직전) |

## 5. 사실 / 추정 / 미확인

- **사실(L1)**: 1·2절의 파일:행, 4절 수치, `tryLock` 사용처, main 기준선 테스트 1건 실패.
- **추정(L3)**: 동작 이식 0건(테스트만 이식이면 GREEN일 것) · 예산 영향 0B · ProjectsPage 실패 원인(RS4 미확인 행 알림 영역).
- **미확인**: 이식 후보 테스트의 main RED/GREEN · RS3-AC-08·09·13 [E] 재실측 · ProjectRow:83·137 대응 · `pendingWrites` import 간선이 예산 스크립트로 고정되는지.
