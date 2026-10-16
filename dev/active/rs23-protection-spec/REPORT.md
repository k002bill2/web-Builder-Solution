# RS23 이탈 보호 확장 — REPORT (SPEC-4 r0.1 · MQ-4)

- 레인: Designer · worktree `rs23-fix` · branch `k002bill2/rs23-fix` · 설계 base `7dbf116` · 앱 base `93f8111` · 2026-10-13.
- 승인 범위: 사용자 "2" = 이탈 보호 확장(새로고침·탭 닫기 경고 + 실제 저장 재시도 수단). **예산 상향·새 스키마·새 저장소 인터페이스·의존성·백엔드·push는 승인 밖**이다.
- 산출물: `docs/design/restart/SPEC-4.md`(r0.1) · `docs/design/restart/MQ-4.md` · 이 REPORT · `PROGRESS.md` · `logs/codex-a1.txt`(원문).
- **앱 코드·예산 파일·SPEC-3·MQ-3·ADR·CLAUDE.md 변경 0.** `dev/active/rs23-spec/FINAL-GATE.md`는 건드리지 않고 미추적 그대로 두었다.

## 0. 결론

1. **F1 닫힘(설계)**: 최초 요청 직전 상태를 기억 `origin`(`absent | doc | unknown`)에 1번만 저장한다. 재시도는 before를 다시 읽지 않고 이 origin과 비교한다(SPEC-4 4.2). C-E4 → 재생 → flush 연속 실패는 R-5(미확인 유지)다. origin `unknown`이면 "요청 전 그대로"를 판정하지 않고 기억을 유지한다(R-4u).
2. **F2 닫힘(설계)**: R-E6/C-E6은 기억을 지우지 않는다. `PendingRecord`로 바꾸고 **실행 가능한 "저장 확인" 버튼**을 준다. 수단은 `deleteSnapshot(projectId, "")`다. 계약상 "없는 id = 변화 0 성공"이고, 성공하면 현재 메모리 레코드 전체를 IDB 커밋까지 flush한다(L1). "편집기에서 한 번 저장" 문장은 삭제했다.
3. **보호 범위**: 기억 모듈이 0→1개가 되는 순간 모듈 수준 `beforeunload`를 걸고, 1→0개가 되면 뗀다. 진행 중 요청(`inflight`) 동안에도 건다. 화면 언마운트와 무관하므로 언마운트 공백이 0이다. 앱 공통 진입 코드도 0이다. 기존 편집기 경고는 변경하지 않는다.
4. **history 재진입**(★ MQ-4-1 A): 편집기 진입 인계(CP4)로 닫는다.
   - 미확인이면 편집기가 "저장 확인 전" 상태로 시작한다.
   - 확인 resolve는 그 사이 편집이 없을 때만 `saved`로 바꾼다.
   - POP으로 언마운트될 때 확인되지 않은 편집이 있으면 `PendingDraft`(내용·이미지)로 탭 수명 동안 보존한다.
   - **CP4는 `/studio` 바이트가 필요하다.** 그래서 Developer 예산 스파이크가 먼저다. 넘으면 CP4를 중단하고 수치로 재상신한다. 그동안 링크 게이트는 유지된다.
5. **새 계약 필요 여부**:
   - 저장소·LocalSync·ProjectRepository 인터페이스: **0**(MQ-4-2 A).
   - 화면 내부 훅 인자: **1건**(CP4 — `useAutosaveScheduler`/`useDocSave` 초기 상태). MQ-4-1에 명시했다.
   - 새 flush 전용 메서드(MQ-4-2 B)는 승인 밖이라 차단으로 남겼다.
6. **무손실은 보장하지 않는다.** 브라우저 한계는 4절에 정리했다.

## 1. 닫은 지적 (최종 게이트 F1/F2)

| 지적 | 원인 | SPEC-4 교정 | 수용 기준 |
|---|---|---|---|
| F1 [P1] create 재시도 before 재조회로 기억 삭제 | SPEC-3 5.1 "before가 문서면 음성"을 재시도에도 적용. 기억에 처음 before 없음 | 기억 `origin` 보존 · 재시도 표 R-1~R-5·R-4u · F-9는 최초 요청 전용 | RS4-AC-01 · 16 |
| F2 [P2] R-E6/C-E6 "한 번 저장" 수단 없음 | 편집기는 `idle` 시작 · 수동 저장 없음(`SaveStatus.tsx:57-61`) | `PendingRecord` + "저장 확인"(`deleteSnapshot(p,"")`) · 링크 게이트 유지 | RS4-AC-02 · 07 |
| RS3-R1 history 재진입 | 편집기가 기억을 읽지 않음 | CP4 인계(예산 조건부) · `PendingDraft` | RS4-AC-11 |
| RS3-R4/MQ-3-4 새로고침 손실 | 경고 없음 결정 | 모듈 수준 `beforeunload`(기억·진행 중) · 폐기 확인 | RS4-AC-05 · 08 · 09 |

## 2. 조사 통합 (서브에이전트 2개 · 읽기 전용 · 병렬)

| 조사 | 결과 | 메인 재확인 |
|---|---|---|
| A unload/history 수명(Explore, 29 tool) | `beforeunload`는 1곳뿐(편집기 effect, `useAutosaveScheduler.ts:290-291`). 저장소는 탭당 1개(`main.tsx:29-40` · `sharedLoader.ts:6-13`). 선언형 라우터라 `useBlocker` 없음. 앱 안 링크는 저장 실패 시 이동 보류, POP·주소 입력은 가로채지 않음(`StudioLayout.tsx:127-148`). 요청 진행 중에는 기억 0. 앱 공통 guard는 index 청크라 9개 시나리오 전부에 더해짐 | grep `beforeunload/popstate/useBlocker/pagehide` = 1곳 · `useAutosaveScheduler.ts:280-292`·`:168-178` 판독 — 일치 |
| B write-confirm 재시도(Explore, 17 tool) | `kept`는 성공 뒤에만 flush. flush 대상은 현재 메모리 레코드 전체이고 IDB `oncomplete` 뒤 resolve. `startDoc` 같은 키 재생은 판정보다 앞이고 `saveDoc` 뒤에도 성공. `saveDoc` 같은 내용은 새 키면 revision+1. `deleteSnapshot(없는 id)`는 변화 0 + flush | `memoryDocBook.ts:285-291,358-366,374-406` · `projectRepository.ts:157` · `localSync.ts:151-161,186-201` · `imageOps.ts:16-30` 판독 — 일치 |

## 3. Codex 적대검토 (1회 · 원문 `logs/codex-a1.txt`)

- 명령: `node ~/.claude/plugins/cache/openai-codex/codex/1.0.6/scripts/codex-companion.mjs adversarial-review --scope branch --base 7dbf116 "<SPEC-4 집중 문장>"`. 대상은 r0 커밋 `d71c852`이고 `--help`는 실행하지 않았다. 결과: **needs-attention · P1 2 · P2 1**.
  - [P1-1] offline·커밋 전 failed 편집을 `PendingRecord`로 넘기면, 잃은 편집에 "확인"이 표시된다(`useAutosaveScheduler.ts:171-176` — offline은 저장 호출 전에 멈춘다). → **반영**: `PendingDraft`로 내용·이미지를 탭 수명 동안 보존하고, 편집기 재진입 뒤 실제 `saveDoc`으로만 해제한다(3.1 · 3.3-5 · 5.3 · RS4-AC-11).
  - [P1-2] 편집기 "저장 확인" resolve가 확인 중 생긴 편집을 `saved`로 덮는다. → **반영**: 스케줄러 version에 묶어, 늘었으면 `dirty`를 유지한다(3.4 · 5.3 · RS4-AC-11).
  - [P2] create before 읽기 실패를 기억에 표현할 수 없다. → **반영**: `Origin.unknown` · F-6/F-6b · R-4u · RS4-AC-16.
- advisor 점검(같은 반영에 묶음):
  - C-E6 "엽니다"·P-OK 이동은 확인 뒤에만 한다.
  - 다시 여는 문구는 기억 종류·cause별로 고른다.
  - **편집기 밖 확인에서 이미지가 빠질 위험**(RS4-R10 · `imageOps.ts:19-25`, L3) → P-3 측정 관문 · RS4-AC-17.
  - QA 경고 판정법: CDP `Page.javascriptDialogOpening`과 신뢰 입력.
  - 폐기 시 `inflight`도 0으로 만든다.
  - MQ-4-1에 훅 인자 변경을 명시한다.
- r0.1 커밋(`cc58057`) 뒤 advisor 추가 1건(r0.1b — `PendingDraft` 재진입 revision: `saving` 중 POP 뒤 자기 저장과 거짓 충돌 → 재진입은 메모리 `getDoc` + 첫 `edit()` · draft 중첩 시 `under` 상속)을 반영했다. r0.1이 새로 만든 문장의 결함이라 고쳤고, 반복 루프는 아니다. Codex는 다시 돌리지 않았다.
- **r0.1/r0.1b 반영분은 Codex 미재검토다.** 브리프에 따라 r2 루프를 돌리지 않았다. **구현 전에 독립 회수(QA 또는 Codex 1회)가 필요하다.**

## 4. 보호 범위와 남는 브라우저 한계 (SPEC-4 5.6)

| 닫힘 | 남음 |
|---|---|
| 기억·진행 중 요청이 있는 동안 새로고침·탭 닫기 경고. 라우트·화면 언마운트와 무관 | RS4-R3: sticky user activation이 없으면 경고가 표시되지 않는다(대개 클릭으로 생기지만 보장 아님) |
| 확인 전 링크 게이트 · 확인 뒤에만 이동 | RS4-R4: 모바일 백그라운드 종료·크래시·강제 종료에는 경고가 없다 |
| 폐기는 사용자 확인으로만 하고 "자동 복구" 표현 0 | RS4-R5: 경고를 지나쳐 떠나면 미확인 변경이 사라진다(이전 IDB 상태만 남음) |
| (CP4) history 재진입 거짓 idle 0 · POP 언마운트 편집 보존 | RS4-R1·R2·R8: CP4 예산 실패 시 거짓 idle·1클릭 재확인이 남고, dirty/offline 편집 POP 손실은 지금 동작 그대로 |
| — | RS4-R10: 편집기 밖 확인의 이미지 누락 가능성(L3 — P-3 측정 전) |
| — | RS4-R6: 다른 탭은 이 탭 미확인을 모른다 · RS4-R7: 리스너가 있는 동안 bfcache 제외 가능(L3) |

## 5. 구현 전 측정 관문 (Developer — SPEC-4 8.0 · 9절)

1. 테스트 수 기준선: `cd app && npm test -- --run`의 파일·테스트 수를 기록한다. 예측 delta는 +34~46(L3)이다.
2. 예산 기준선: 깨끗한 워크트리에서 `npm run build && node scripts/check-bundle-size.mjs`를 돌려 원문을 저장한다(gzip KB = 1000 B). 같은 머신에서 잰다.
3. 스파이크 3개를 재고 버린다(9절).
   - S1: 기억 모듈 + 프로필·`/projects`
   - S2: S1 + 편집기 인계 정적
   - S3: S1 + 편집기 동기 조회 + lazy 본문
   - 후보 (a) 앱 공통 guard는 참고 측정만 한다.
4. P-3 이미지 확인 경로 테스트(RS4-AC-17)를 먼저 돌린다.
5. 판정:
   - `/studio` 129.90 · 복원 132.94, `/profile` 100/125, `/projects` 100/125를 넘으면 감량 1회 → 그래도 넘으면 스파이크를 복원하고 중단한 뒤 raw 수치로 보고한다.
   - **수치 없이 상향을 요청하지 않는다.** 기준선·판정선·ADR은 수정하지 않는다.
   - Designer는 0B를 단정하지 않는다. `/profile`·`/projects` 값은 L2(restart-impl 빌드 기록)라 재측정이 필요하다.

## 6. QA 수용 기준 요약 (SPEC-4 7절)

- [U] RS4-AC-01~06 · 11 · 15~17
- [E] Ego Lite(`npm run build` + `vite preview`, 앱 안 클릭만):
  - RS4-AC-07~11 · 14
  - 멀티 탭 RS4-AC-10은 **잠금 실제 취득**(탭 A 실제 편집 저장)을 먼저 한다.
  - 경고 판정은 CDP `Page.javascriptDialogOpening` `type: "beforeunload"` + 신뢰 입력으로 한다.
- [G] RS4-AC-12 · 13 — 4종 게이트, 간선 가드, `deleteSnapshot(p,"")` 계약 테스트.
- 구현은 4 RED/GREEN 체크포인트로 나눈다.
  - CP1: 모듈·보호·create 가드
  - CP2: 프로필 판정표
  - CP3: `/projects`
  - CP4: 편집기 인계 — 예산 통과 시에만

## 7. 실행/미실행 구분

| 항목 | 상태 |
|---|---|
| 앱 코드 변경 | 0 — `git diff 93f8111 -- app \| wc -l` = **0**(실행) |
| SPEC-3·MQ-3·CLAUDE.md·`app/scripts`·`docs/decisions` 변경 | 0 — `git diff 7dbf116 --stat -- <해당 경로>` 출력 0줄(실행) |
| `git diff --check` | 출력 없음(실행, 커밋 전) |
| typecheck·lint·test·build | **미실행** — 코드 변경 0이라 대상 없음 |
| 예산 빌드·스파이크 | **미실행** — Developer 관문(5절) |
| runtime·브라우저·멀티 탭 | **미실행** — 수용 기준만 정의 |
| Codex 재검토(r0.1) | **미실행** — 브리프상 1회 제한. 구현 전 독립 회수 필요 |

## 8. 사용자/Jarvis 결정

- **2026-10-15 사용자 결정: MQ-4-1 A · 4-2 A · 4-3 A**(MQ-4 결정 기록). 예산 상향 승인은 아니다. 아래 착수 조건은 그대로 남는다.

- MQ-4-1(★A 편집기 인계 — 예산 관문 조건부) · MQ-4-2(★A `deleteSnapshot(p,"")` — P-3 조건부) · MQ-4-3(★A 수치를 본 뒤 결정).
- 결정이 막는 것은 CP4와 편집기 밖 확인(P-3 결과에 따름)이다. CP1~3은 ★안이면 새 계약 0이지만, **r0.1 독립 재검토와 측정 관문이 먼저**다.
