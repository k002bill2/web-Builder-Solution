# RS6 최종 QA REPORT — 저장 코어 제품 연결 통합 판정

QA 세션(구현 레인과 별도) · 브랜치 `k002bill2/rs6-qa` · 대상 `0a809b87`(L0~L5 반영) · 2026-10-17 · Ego Lite TaskSpace 23

## 0. 판정 — **PASS with notes**
- FAIL 조건 4종 관측 0: 거짓 saved·confirmed·discarded 0 · 경고 없는 편집 손실 0(이탈 직후 `/projects` 탭 닫기 경고 3회 모두 `defaultPrevented=true`, 저장 뒤 IDB 반영) · 다른 탭 커밋 덮어쓰기 0(B3, IDB에 탭B 편집 0) · 예산 초과 0(129.12 ≤ 멈춤 129.14 · 복원 132.10 ≤ 132.12 · raw 130.43 ≤ 130.5).
- notes: AC 문면과 제품 도달이 어긋나는 3건(B2 "저장 확인" 단계 · B3 "저장 확인" 단계 = L4 N1 · B4/UX5-AC-04·05 충돌 Callout 도달 0) · 예산 여유 0.01 · 390 상태 줄 스크롤 밖 · 대화상자 Tab 2회째 BODY. 4절에 분류.

## 1. 위험 해소표
| 위험 | 정의(I6) | 판정 | 근거 |
|---|---|---|---|
| RS4-R1 | 뒤로 재진입 시 거짓 idle | **닫힘** | 실화면 B1-3: 편집 → IDB 점유(7s) → 뒤로 → 앞으로 = "저장 중…"(`aria-busy=true`) 이어짐 → B1-4 "이 브라우저에 저장됨 · 방금"(IDB rev 5에 편집). 저장 끝난 뒤 재진입(R-1·P-3)은 빈 글자 + 필드 = 마지막 편집(저장 사실과 모순 없음). 단위: `useDocSaveCore.save.test.tsx` "C5 T2" · `SaveStatus.source.test.tsx` "POP 재진입(C5 T1)". main 이전: CP4 미구현이라 재진입 seed가 DocBook이었다(I6 7절) |
| RS4-R8 | 뒤로·주소 이동 무경고 손실 | **닫힘**(주소창 입력은 같은 핸들러 합성 검증) | 실화면 P-1·B1-2·B2-2: 편집 직후 `history.back()` → `/projects`에서 합성 `beforeunload` `defaultPrevented=true` → 저장 뒤 `false`, IDB에 편집(P-2 rev 3 · B2-3 rev 6 + 이미지). 핸들러 = 레지스트리 `memoryProjectRepository.ts:148`(편집기 밖에서도 유지). 실제 주소창 입력·네이티브 대화상자는 미실행 |
| BD-1 | 같은 탭 다른 어댑터 객체 | **닫힘(조건부·가드)** | `save/saveCoreGuard.test.ts` "openIdbPersistence 호출 = localSync.ts 1곳" 외 G2 가드 5건(fresh 테스트 GREEN). 실화면에서 탭당 writer 잠금 1개(B3-0) |
| LV-1 | commit 미종료 → 무기한 대기 | **닫힘(단위 + L4 실화면 상속)** | U4 `save/liveness.test.ts` 3건 · `useAutosaveScheduler.watch.test.tsx`. 실화면 slow 꼬리·hang alert는 L4 QA 6절 (c). 이 QA는 점유 중 "저장 중…"·aria-busy만 관측(slow 꼬리 미측정) |
| LV-2 | discard 읽기 미종료 → discarding 고정 | **닫힘(단위 + L4 실화면 상속)** | U5 `save/liveness.discard.test.ts` 3건 · `SaveActions.test.tsx` "blocked{timeout}". 실화면 L4 QA (d+). 이 QA 재실행 0 |
| H4 | 다른 탭·낡은 증명 × Web Locks | **닫힘** | 실화면 B3: held `[design-studio-writer:exclusive]`(탭A) → 탭B readonly 문구·IDB 변화 0 → 탭A 닫기 → held `[]` → 탭B 저장 = stale 문구 · IDB rev 8 그대로. 단위: `saveCore.modes.test.ts` "h4 제품판"·"h4-4 제품판" · `writerLock.test.ts` "AC-C02" |

## 2. RS6-AC 대조표 (서브에이전트 읽기 전용 대조 + 이 QA fresh 게이트·실화면)
테스트 경로는 `app/src/` 기준. fresh `npm test -- --run` 340/3022 GREEN이 아래 테스트 전부의 실행 근거다.

| AC | 판정 | 근거 | 레인 notes 상속 |
|---|---|---|---|
| U1 | 부분 | `dev/active/rs6-l1-port/HARNESS-MAP.md` 37 = ①30·②6·③1, ① 중 완전 26 + 부분 4(#9·#12·#30·#32) → "①은 전부 GREEN" 문면 미달 | L1 note 4 · #12 양성 분기 테스트 공백 |
| U2 | 부분 | T1·T2·T3·T5·T5b·T10·T12·T13·CX-1 테스트 있음(`SaveStatus.source`·`useDocSaveCore.save`·`saveCore.port`·`ProjectsCoreRows`·`saveCore.images`). **T16(편집기 안 디바운스 중 beforeunload) 상시 테스트 없음** — 실화면 L-1·B1-1에서 `true` 관측 | L3b QA 조건 Q1 미반영 |
| U3 | 충족 | `saveCore.images.test.ts` "U3 …" · `useDocSaveCore.save.test.tsx` "U3: 커밋 실패 …" | — |
| U4 | 충족 | 위 LV-1 | L2 변이 검출 |
| U5 | 충족 | 위 LV-2 | L2 LV-2c 생존(등가 추정) |
| U6 | 충족 | `useDocSaveCore.test.tsx` "StrictMode …" · `saveCore.modes.test.ts` "h5-7" | — |
| U7 | 충족 | `useDocSaveLeave.test.tsx` "U7" · `liveness.status.test.tsx` "재마운트 … 재발화 0" | — |
| U8 | 충족(단위) | `SaveStatus.buttons.test.tsx` · `SaveActions.test.tsx` | **L4 N1**: 편집기 "저장 확인" 제품 도달 0 — 실화면 B3에서도 readonly·stale 동안 "저장 확인" DOM 0 |
| U9 | 충족 | `SaveStatus.buttons.test.tsx` "memory = …(U9)" | — |
| U10 | 충족 | `saveCore.modes.test.ts` "RS6-AC-U10 …" | L1 생존 변이 U10-a |
| U11 | 충족(단위) · 실화면 일부 | `StudioLeave.test.tsx` · `ProjectsCoreRows.test.tsx` "코어 inflight 행". 실화면 L-2: 점유 중 링크 이동 즉시 · 경고 true · 해제 뒤 IDB = 마지막 편집. `/projects` 행 "저장 중…" 글자는 미관측(행 텍스트 수집 셀렉터 불일치) | — |
| U12 | 충족 | `StudioLeave.test.tsx` "U12 …" · `useDocSaveLeave.test.tsx` "U12 … POP" · FIX1 4건. 실화면 L·P·B2 | L3b note 2 → FIX1. **이 QA의 B2가 FIX1 첫 독립 실화면**(이미지 고른 직후 POP → 이미지 레코드 커밋·복원) |
| U13 | 충족 | `StudioLeave.test.tsx` 판정 순서 행 | L3b 판별력 notes(Med) |
| U14 | 충족 | `saveCore.images.test.ts` "U14 …" 3건 | L1 생존 U14-b |
| U15 | 충족 | `saveCore.images.test.ts` "U15 …" · `saveCoreGuard.test.ts` "RS6-AC-U15 …" | — |
| U16 | 충족 | `ProjectsCoreRows.test.tsx` "U16 …" 5건. 실화면 L-3·P-2·B2-3: 저장 성공 뒤 `/projects` 행 기억 0 | L5 생존 M1·M3·M4b |
| G1 | 충족(개정 17 상한 기준) | 5절 fresh build. L0 원 판정 FAIL → ADR-004 개정 17 상한 아래 진행. 여유 0.01 | 예산 note |
| G2 | 충족 | `saveCoreGuard.test.ts` describe "RS6-AC-G2" 5건 | — |
| G3 | 충족(R2-2 ② 해석) / 엄밀히 부분 | `test/saveForbiddenText.test.ts` 8건 · "1곳" 유일성 직접 단언 없음 · 환경 문구는 `save/reasonText.ts` | L4 N2 문자열 2벌 |
| B1 | **충족** | 3절 B1 | — |
| B2 | **부분(문면 단계 대체)** | 이미지 교체 → POP → 새로고침 → 이미지 복원 통과. 단 "`/projects` 저장 확인" 단계는 해제 save가 성공해 행 기억이 0(U16 설계)이라 도달 불가 | — |
| B3 | **충족(경로 대체)** | readonly → 탭A 닫기 → stale 통과 · 덮어쓰기 0. "저장 확인" 대신 편집 저장으로 도달(N1) | L4 N1 |
| B4 | **부분** | 상태 글자 1280·1024 화면 안 · 390 존재·가로 넘침 0이나 내부 스크롤 상태에서 화면 밖(y<0). 충돌 Callout 도달 0 | L4 2절 |

## 3. 실화면 (Ego Lite · `npm run build` fresh → `npx vite preview --host 127.0.0.1 --port 4385 --strictPort` · origin 1개 · 모두 앱 안 클릭, 새 탭 B만 `/projects` goto 뒤 클릭)
- 기동 직후 `indexedDB.databases()=[]` · held `[]`. 경로: 새 프로젝트 → 카탈로그 비교 추가(모던 카페·동네 치과) → 비교 보드 "A 전부 선택" → 프로필 확정(v1) → 3안 → A안 → "A안으로 편집 시작" → `/studio/project-1`(held `[design-studio-writer:exclusive]`).
- 관측 도구: `p.text-caption1.text-label-alternative`(상태 글자) · `[role=alert]` · `navigator.locks.query()` · 합성 `new Event("beforeunload",{cancelable:true})` `defaultPrevented` · IDB `docs/project-1` 원문에 표식 포함 여부·revision · `images` 키. "직후"는 같은 DB `docs` readwrite 트랜잭션을 4~7초 점유해 저장을 진행 중으로 묶었다.
- **뷰포트 주의**: L·R·P·B1 샷은 CDP 오버라이드 전이라 실제 폭 1877(파일명 1280은 잘못 붙은 이름). B2 이후는 1280/1024/390 CDP 오버라이드.

| # | 단계 | 관측 원문(요지) | 판정 | 샷 |
|---|---|---|---|---|
| L-1 | 편집 직후 | "저장 전 변경 있음" · 경고 true · IDB 표식 없음 rev 1 | — | — |
| L-2 | 점유 중 "프로젝트로 돌아가기" | 즉시 `/projects` · 경고 **true** · held 유지 | 통과 | `L-1280-projects-inflight.png`(1877) |
| L-3 | 점유 해제 뒤 | 경고 false · IDB 표식 있음 rev 2 · 행 기억 0 | 통과 | — |
| R-1 | "편집기 열기" 재진입 | 상태 "" · 필드 = 링크 이탈 편집 | 통과 | `R-1280-reenter.png`(1877) |
| P-1 | 편집 직후 뒤로(POP) | `/projects` 경고 **true** | 통과 | `P-1280-projects-after-back.png`(1877) |
| P-2~4 | 해제 뒤 · 앞으로 · 새로고침 | 경고 false · rev 3 표식 · 필드 이어짐 · 새로고침 복원(held `[]` = 첫 쓰기 전 잠금 0) | 통과 | `P-1280-forward-reenter.png` · `P-1280-reload.png`(1877) |
| B1-1~3 | 편집 → 점유 7s → 뒤로 → 앞으로 | 뒤로 경고 true · 앞으로 = **"저장 중…" aria-busy** · 필드 이어짐 | 통과 | `B1-1280-forward-saving.png`(1877) |
| B1-4~5 | 해제 · 새로고침 | "이 브라우저에 저장됨 · 방금" · rev 5 · 새로고침 복원 | 통과 | `B1-1280-after-save.png`(1877) |
| B2-1 | Hero 이미지 고르기(PNG 64×36) | 슬롯 blob 이미지 · "저장 전 변경 있음" | — | `B2-1280-image-bound.png` |
| B2-2~3 | 점유 중 뒤로 → 해제 | 경고 true → false · IDB images `project-1/a074abd0-…` 1건 · rev 6 · `/projects` "저장 확인" 행 없음(기억 0) | 통과(문면 단계 도달 불가) | `B2-1280-projects-after-pop.png` |
| B2-4 | 새로고침 → 편집기 열기 | 슬롯 이미지 blob naturalWidth 64×36 복원 | 통과 | `B2-1280-reload-image.png` |
| B4 | 편집 후 폭 3종 | 1280 [730,17] 화면 안 · 1024 [317,17] 화면 안 · 390 "이 브라우저에 저장됨 · 방금" x 52, y −410(스크롤 밖) · scrollW 375 = clientW 375 | 부분 | `B4-1280/1024/390-status.png` |
| B3-0 | 탭B 열기만 | **held(탭A·탭B 같은 목록) `design-studio-writer:exclusive:5ABB09C2`** · pending 0 · 탭B 상태 "" | — | — |
| B3-1~2 | 탭A 편집 → 탭B 편집 | 탭A "저장됨 · 방금" · 탭B "다른 탭에서 편집 중이라 이 탭은 저장하지 않습니다"(글자 + alert) · 버튼 0 · IDB A 있음 B 없음 rev 8 | 통과 | `B3-1280-tabB-readonly.png` |
| B3-3~5 | 탭A 닫기 → 탭B 편집 ×2 | held `[]` → "다른 탭에서 바뀐 내용이 있습니다 — 새로고침한 뒤 편집하세요" + "버리고 새로고침" 1개 · 두 번째 실패에도 alert 1개·같은 문장 · IDB rev 8 · B 편집 0 | 통과 | `B3-1280-tabB-stale.png` |
| UX12 | 390 stale | "버리고 새로고침" 107×32(Button sm) · 가로 넘침 0 · 내부 스크롤 상태에서 y −482(화면 밖) | 부분 | `UX12-390-stale.png` |
| UX06 | 키보드 폐기 대화상자(390) | Enter → `alertdialog` 첫 포커스 "취소" · Tab → "버리기" · Tab → **activeElement BODY**(대화상자 열린 채) · Esc → 닫힘·포커스 "버리고 새로고침" 복귀 · 다시 열고 "버리기" Enter → reload | 통과(Tab 2회째 note) | `UX06-390-dialog.png` |
| UX06-5 | 버리기 뒤 | navigation `reload` · 필드 = "QA-B3 A커밋" · IDB rev 8 · B 편집 0(거짓 discarded 0) | 통과 | `UX06-1280-after-discard-reload.png` |

- UX5-AC-01: 연속 실패(B3-4·5)에서 alert 요소 1개·같은 문장 유지 → DOM 기준 반대 증거 0(실제 재낭독 여부는 스크린리더 미사용, 미확인). 단위 `liveness.status.test.tsx`.
- UX5-AC-04·05: **도달 0** — 충돌 Callout 렌더 출처 `StudioLayout.tsx:335` `save.conflict`(phase stale)는 STALE_DOC에서만, 제품 저장 경로는 INFRA 고정(L4 QA 2절 grep 근거). 이 QA 실화면에서도 stale·readonly 모두 Callout 0. 단위 `ConflictCallout.test.tsx`.
- final-qa 5-1 제품판: #1–2(save·reload confirm) = P-4·B1-5·B2-4 · #3–4(abort 롤백) = **미실행**(L4 QA (b) put throw 주입 상속) · #6–10 = B3-0~2 · #11–13 = B3-3~5(confirm 대신 편집 저장) · #14 = UX06-5 · #15–17 = 정리.
- 정리: `deleteDatabase('design-studio')` = deleted · `databases()=[]` · held `[]` · `task.finish({keep:[]})` · `listTaskSpaces()`에 space 23 = 0 · preview 종료(exit 144 SIGTERM) · `lsof :4385` 리슨 0 · `:5480` 리슨 0(무접촉) · `git status app/` 변경 0.

## 4. notes 분류 (제안 — 결정은 Jarvis)
**RS6 종료 전 필수(제안)**
1. **L4 N1 + AC 문면 정정**: 편집기 "저장 확인" 도달 0 → RS6-AC-B3·U8 문면을 "편집 저장으로 stale 도달"로 고치거나 readonly·clean 경로를 만들지 결정.
2. **B2·B4·UX5-AC-04·05 문면**: B2 "/projects 저장 확인" 단계(성공 시 도달 불가) · 충돌 Callout 도달 0 → AC 정정 또는 "도달 0" 수용 기록.
3. **예산 여유 0.01**: 129.12/132.10 = 멈춤선 직전, `m2cBaseline.json` 129.11. 다음 진입 변경은 바로 초과 → 기준선 처리 결정.
4. **T16 상시 테스트**(편집기 안 디바운스 중 beforeunload): 실화면에선 true지만 회귀 가드 없음(L3b 조건 Q1).

**백로그**
- L3b note 1 — **L5에서 닫힘 확인**(`ProjectsCoreRows.test.tsx` "해제 save 실패 행" 3건 · L5 QA 실화면).
- L5 생존 변이 M1(P2)·M3·M4b(P2) · L1 생존 U14-b·U10-a·IMG-meta · L3a M2b(복원·restart epoch 단언).
- L4 N2(stale 행 첫 문구 일반 실패 · 문자열 2벌) · N3(폐기 timeout alert 2개) · N4(role=status 2개).
- 이 QA 신규: 390에서 상태 줄·stale 버튼이 내부 스크롤 위치에 따라 화면 밖(sticky 아님) · 대화상자 Tab 2회째 activeElement BODY(네이티브 `showModal` 순환이 브라우저 UI로 나가는 동작 추정) · L3b FIX1 실화면은 이번 B2가 첫 독립 관측.

## 5. fresh 게이트 (`app/`, 직렬)
| 명령 | 결과 | 로그 |
|---|---|---|
| `npm run typecheck` | exit 0 | `logs/rs6qa-tc.log` |
| `npm run lint` | exit 0 | `logs/rs6qa-lint.log` |
| `npm test -- --run` | 1차 3021/3022(`pages/keyboardA11y.test.tsx` 포커스 1건 — 서브에이전트 병행 중) · 단독 9/9 · **2차 전체 340 files / 3022 tests passed, exit 0**(실화면 뒤, 단독 실행) | `logs/rs6qa-test.log` · `logs/rs6qa-test2.log` |
| `npm run build` | exit 0 · `/studio` 정규화 **129.12**(기준선 129.11, 멈춤 >129.14) · raw **130.43**(≤130.5) · 복원 정규화 **132.10**(멈춤 >132.12) · 복원 raw 133.47(≤134) | `logs/rs6qa-build.log` |

## 6. 사실 / 추정 / 미확인
- **사실 [L1]**: 5절 수치 · 3절 관측값(IDB 원문·locks·합성 beforeunload) · 2절 테스트 이름(서브에이전트 grep + fresh 스위트 GREEN).
- **추정 [L2]**: keyboardA11y 1차 실패 = 부하 플레이크(2차 전체·단독 통과) · Tab→BODY = 네이티브 dialog 순환 · B1 rev 3→5 두 번 커밋 = 해제 save + 재진입 뒤 스케줄러 save(데이터 영향 0).
- **미확인**: 실제 주소창 입력·네이티브 beforeunload 대화상자 · abort 롤백(5-1 #3–4) 제품판 · slow 꼬리·hang·discard timeout 재실행(L4 상속) · `cleared`·`unsupported` 실화면 · `/projects` 행 "저장 중…" 글자 · 스크린리더 낭독 · 1024 외 태블릿 실기기 · Safari.
- 서브에이전트: 읽기 전용 1개(2절 대조) — 결과 2·4절에 반영. 앱·테스트 수정 0 · 임시 변이 0 · 원격 쓰기 0.
