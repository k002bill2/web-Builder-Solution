# P1C-D2 REPORT — 쓰기 잠금(Web Locks) + 최신성 확인(세대 번호)

판정: **완료** — typecheck·lint·build·전체 vitest exit 0 · 번들 관문 그대로 · Ego Lite 탭 2개 실측 3시나리오 통과. Codex 0(Jarvis 몫).

## 1. 변경 (커밋 `f9895ab`, 쓰기 파일 = `app/src/data/persistence/**`만)
| 파일 | 내용 |
|---|---|
| `writerLock.ts`(새) | `design-studio-writer` ifAvailable 요청 · 잡으면 끝나지 않는 Promise로 탭 수명 보유(닫힘·언로드 자연 해제) · steal 없음 · 잡은 직후 `fresh()` 실패면 즉시 놓고 `stale`(새로고침까지 유지) · 못 잡으면 `readonly`(다음 flush=다시 저장 때 재요청) · locks 없음 = `unsupported` |
| `localSync.ts` | 쓰기마다 `meta/generation` +1 · 같은 트랜잭션의 상태 레코드 data `gen`에 같은 값 · 첫 쓰기(saveState·flush) 때 게이트 · 읽기 전용/낡음/미지원 = saveState 쓰기 0, flush = INFRA · 열 때 이미 낡았으면 문서 시드에 진입 문서 |
| `infra.ts` | 사유 상수 2종(SPEC 1.5 원문): `READ_ONLY_TAB` "다른 탭에서 편집 중입니다 — 이 탭의 변경은 저장하지 않습니다" · `STALE_TAB` "다른 탭에서 바뀐 내용이 있습니다 — 새로고침한 뒤 편집하세요" |
| `entryRead.ts` | `LocalState.gen?` 타입만(진입 바이트 0) |
| `fakeLocks.ts`(새, 테스트 전용) | 브라우저 1개 registry + 탭별 핸들(`close()`=탭 닫힘, `held()`=query) · `soloLocks()` |
| `writerLock.test.ts`(새) + 기존 3 테스트 | 새 8건 · 기존 localSync/imagePersist/imageRestoreLoad 호출부에 `soloLocks()` 주입(단언 변경 0) |

## 2. 설계 결정·근거
- **잡는 시점 = 첫 쓰기**(sync 열기 아님): `memoryProjectRepository.entered`가 앱 안 이동(진입 문서 아님 + 머리 있음) 읽기만으로 sync를 연다 → 열기 때 잡으면 "진입만 한 탭"이 잠금 보유(AC-C14 위반). [L1 코드]
- **세대 번호 위치** = `meta` 저장소 `generation`(정본, 최신성 확인 때 작은 레코드 1건만 읽음) + 상태 레코드 `gen`(이 탭이 하이드레이트한 세대). 진입은 상태 레코드를 이미 읽으므로 진입 바이트 0 — meta를 진입에서 읽으면 `/studio` 몫 발생. 모든 쓰기에 상태 레코드가 들어가므로 둘은 늘 같은 트랜잭션.
- **최신성 판정** = 지금 meta gen(없으면 0) = 진입 gen(없으면 0) **그리고** 진입 때 상태 레코드가 있었다면 지금도 있음(지우기 뒤 부활 0 — gen 없는 P1b 레코드도 보호).
- **열 때 낡음 → 진입 문서로 시드**(예측 밖 발견, RED에서): 기존 sync는 열 때 IDB 최신 문서로 DocBook을 시드 → 낡은 탭이 STALE_DOC/NOT_FOUND로 먼저 막혀 SPEC 사유가 안 나옴. 쓰기는 여전히 게이트가 막는다.
- **읽기 전용 vs 낡음 우선순위**: 잠금을 다른 탭이 가지면 읽기 전용 사유가 먼저(잠금 요청 → 못 잡음). 잡았을 때만 최신성 → 낡음.
- **`navigator.locks` 미지원 = 쓰기 차단(읽기 전용)**: SPEC 1.5 + THREATS T5 "읽기 전용 폴백" 그대로. 단일 탭 가정은 미지원 환경에서 두 탭이 서로 덮는 T5 위험을 그대로 남기므로 덜 안전. 사유 = 기존 기본 문장 "브라우저 저장소에 접근하지 못했습니다"(새 문구 0). 주의: Web Locks는 보안 컨텍스트 전용 — `http://LAN-IP` 접속이면 저장 불가(localhost·https는 정상) [L3]. 지원 브라우저(Chrome 69+·Safari 15.4+·Firefox 96+)는 모두 있음 [L3].
- **낡은 탭은 잠금을 즉시 놓음**: 쓰지 못하는 탭이 새로고침한 다른 탭의 쓰기를 영구히 막지 않게.
- **C09 aria-live**: UI 변경 0 — 읽기 전용·낡음은 기존 INFRA reject 경로 그대로라 SaveStatus "저장하지 못했습니다" + "다시 저장" · `role=alert` 1개(실측 alerts 배열 1개).
- 범위 밖(손대지 않음): BroadcastChannel `saved`/`cleared`·지우기(D4) · `/projects` 사유 문장(D3) · 편집기 안 사유 표시(MQ-C1 A로 없음 — 사유는 오류 메시지에만).

## 3. TDD
- RED 8/8 FAIL → GREEN 8/8. 배선 뒤 기존 22건 FAIL(예측: jsdom 잠금 없음) → `soloLocks()` 주입 → persistence 91/91.
- Red-Green: 최신성 확인 임시 무력화(`return true ||`) → 4 FAIL(회귀·AC-C02·지운 뒤·AC-C14) → 복원 8/8.
- 테스트 헬퍼 1건 정정: 오류 메시지가 이미 "INFRA: …"라 `failureOf`의 코드 접두어 중복 제거(기대 문자열 그대로).

## 4. 번들 (`npm run build` 출력)
| 라우트 | 진입 직후 합계 | 관문 |
|---|---|---|
| `/studio/:projectId` | **129.62** | 129.62 그대로 ✅ |
| 저장 데이터 복원 진입 | **132.65** | 132.65±0.03 ✅ |
| `/projects` · `/compare` · `/profile`(3안) | 101.39 · 122.59 · 122.31 | ≤125 ✅ |

## 5. Ego Lite (build + `vite preview --port 4337`, TaskSpace 24, 창 `normal` — 조작 0)
1. 시드 탭 p1: `/references/ref-a` 비교 추가 → 보드 → 프로필 확정 → 3안 → A안 편집 → 제목 입력 → "이 브라우저에 저장됨 · 방금" · `locks.query().held`=[writer] → p1 닫음.
2. **AC-C14**: p2(A)·p3(B) 둘 다 `/studio/project-1` 진입 → held **[]** → B 먼저 편집 → "이 브라우저에 저장됨" · held [writer] → A 편집 → "저장하지 못했습니다" + "다시 저장" · `role=alert` 1개 · IDB rev 3 = B 값(A 글자 0) · gen 9. `shots/1-tabA-readonly.png`
3. **AC-C02**: B 닫기 → held [] → A "다시 저장" → 여전히 실패 · IDB rev3/gen9 그대로 · held [](낡아 놓음). `shots/2-tabA-stale-after-retry.png` → A 새로고침 → 제목 "B가 먼저 편집" 표시 · held [] → 편집 → 저장됨 · rev4/gen10.
4. **BRIEF 회귀**: p4(A) 진입(rev4/gen10) → p2(B) 편집·저장(rev5/gen11)·닫기 → A 편집 → "저장하지 못했습니다" · alert 1개 · IDB rev5/gen11 그대로(A 글자 0) · held []. `shots/3-stale-tab-regression.png`
- 정리: `indexedDB.deleteDatabase("design-studio")` = **success** · `databases()` = [] · `finish({keep:[]})` · `listTaskSpaces()` = **[]**(자기 공간만 사용·종료, 다른 레인 공간 조작 0) · preview 종료 · 4337 리슨 **0**. 캡처 3장(clip 1400×160, 뷰포트 캡처).
- 미실측: 떠나기 경고(beforeunload) — 기존 `needsUnloadGuard`가 failed에서 켜짐(새 조건 0, 단위 테스트 기존 그대로). 사유 문장 자체는 편집기에 표시되지 않으므로(MQ-C1 A) 단위 테스트가 증거.

## 6. 게이트 (마지막 코드 기준 fresh)
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0(번들 체크 포함) · `npx vitest --run` exit 0 — **265 files / 2313 tests passed**.

## 7. 지키기
- 엔진·PageDoc 계약·docs·lock·CLAUDE.md 수정 0 · 새 의존성 0 · 서브에이전트 0 · Codex 0 · push/merge/삭제 0(테스트 IDB 삭제만) · amend/rebase 0 · main 5480 무접촉 · ProjectsPage·문구 파일 0.
- 목업과 다르게 한 부분: 없음(UI 변경 0).

## 8. 남은 것 / Jarvis에게
- Codex 리뷰(Jarvis 몫). 리뷰 포인트 제안: ① 쓰기 탭이 잠금을 쥔 채 IDB 지우기(D4)가 오면 `cleared` 수신 전까지 쓰기 가능 — D4에서 큐 정지 필요 ② `saveState`가 게이트 대기 중 연속 호출되면 각 호출이 then 체인으로 순서대로 제출(최신 의도는 큐가 정리) ③ 세대 계수는 탭 안 계수(쓰기 탭 단독 작성자 전제).
- ADR-007/SPEC에 "세대 번호 = meta `generation` + 상태 레코드 `gen`" 기록(문서 수정은 이 레인 금지).
