# MQ-6 — 저장 코어 제품 연결: 영환님 결정 항목

- 근거 문서: `docs/design/restart/INTEGRATE-6.md`(I6) r0 · 계획 `docs/04-plan/RS6_INTEGRATE_PLAN.md`. 2026-10-17 · Designer.
- 표기: ★ = 추천 · **사실** = 코드·보고서 행 확인 · **추정** = 실측 없음.
- 순서 = 막는 범위가 큰 순. MQ-6-1·6-3은 L1 착수 전, 6-6은 L0 결과가 나온 뒤에만 의미가 있다.

## MQ-6-1 연결 방식 · 인터페이스 (저장소 인터페이스 변경)

| # | 선택지 | 트레이드오프 |
|---|---|---|
| ★A | **코어 상태기 + `LocalSync` 포트.** `LocalSync`(data 내부, `localSync.ts:45-60` — 지금 `docs` + 메서드 6)에 포트 메서드 **5개 이상**(mode·head·commit·verify·image + commit 안 quota·abort 코드 분류 · DocBook 경로 재쓰기를 코어 chain 뒤로 미루는 규칙, I6 5절 G1 r1) 추가, 저장소 인스턴스에 코어 레지스트리(I6 2.2-2), 코어 접근자 1개 추가. 레코드 형식·스키마·PageDoc 변경 0 | 사실: 코어를 그대로 쓰면 `core-doc`/`core-image` 레코드·문서별 세대·별도 직렬 체인이 제품과 충돌한다(I6 6.1). 비용: 하네스 테스트를 제품 포트 위에서 다시 써야 한다(L1). 포트 `commit`은 기존 `write` 대신 "코어 doc + DocBook snapshots" 레코드 변형(LocalSync 내부 변경, I6 5절 G1). **MC 계약 변경 2건 포함**: ① 커밋마다 문서별 세대 재읽기(I6b)를 잠금 획득 때 `fresh()` 1회로 대체(I6 D6-3) — h4·h5 일부·h6-3은 잠금 기반 테스트로 대체(RS6-AC-U1 ②) ② async 열기(`readStored`)를 편집기 마운트 때 동기 생성 + seed로 대체(I6 D6-10) |

- **ADR-007 관계(r1)**: ADR-007 4절 이유 2는 "저장소 인터페이스를 바꾸지 않는다 — 서버 구현을 같은 인터페이스에 꽂는다"를 근거로 든다(`ADR-007-local-persistence.md:124`). **사실**: 공개 `ProjectRepository`(`projectRepository.ts:143-174`)에 탭 메모리 동기 접근자를 직접 더하면 이 근거 문장과 어긋난다. ★ 접근자 모양 = **선택적 능력 인터페이스** — 지금 `ImageKeeper`(`features/studio/images/store/types.ts:22`, 저장소 = `ProjectRepository & ImageKeeper`, `memoryProjectRepository.ts:51`)와 같은 방식으로 `ProjectRepository & CoreKeeper`(가칭)를 둔다. 그러면 `ProjectRepository`의 REST 모양은 그대로이고 이유 2가 유지된다 → ADR-007 개정 불필요(**추정** — ADR 판단은 Jarvis). 공개 인터페이스에 직접 더하는 쪽을 고르면 ADR-007 개정 1줄이 필요하다.
| B | 코어를 그대로 import, 레코드를 `core-doc`으로 이전 | 하네스 37건을 그대로 쓴다. 대신 스키마 이전·`meta.generation` 이중화·H4 회귀 위험(I6 6.1). PageDoc/스키마 계약 변경 = 별도 ADR |
| C | 연결 보류(코어는 하네스로만 유지) | 비용 0. RS4-R1·R8·C5 P1 5건이 열린 채 남는다 |

## MQ-6-2 화면 상태 출처 필드 (UX-5 G1·G5)

| # | 선택지 | 트레이드오프 |
|---|---|---|
| ★A | `view()`는 코어 그대로, 환경 축(readonly·stale·unsupported·cleared)은 포트 `mode()`를 화면 훅이 함께 읽는다 | 코어 인터페이스 변경 0. 화면 훅이 두 출처를 합친다 |
| B | 코어 `view()`에 `env`·`lastResult` 필드 추가 | 화면이 단순. 코어 계약(MC) 변경 → 하네스 재검증 필요 |

## MQ-6-3 liveness 규칙 · 코어 계약 변경 (MC I7)

| # | 선택지 | 트레이드오프 |
|---|---|---|
| ★A | 저장 감시(표시 전환만) + discard **포기 토큰**(`blocked{timeout}`, 늦은 결과 버림). 시간 값은 L2가 상수 1곳에 두고 아래 MQ-6-3b로 정함 | 사실: 지금 저장 정지 = "저장 중…" 무기한 + 링크 이동 고착(I6 6.5). MC I7 문장이 바뀐다 → CE-1·CX-3 회귀 테스트 필수 |
| B | 감시만(표시), discard 정지는 그대로(새로고침이 유일한 탈출) | 코어 계약 변경 0. LV-2 남음 |
| C | 둘 다 안 함 | 현 상태 유지 |

- **MQ-6-3b 시간 값**: ★ L2가 지연 주입 테스트로 동작만 고정하고, 값은 QA 실측(preview에서 평소 커밋 시간 관찰) 뒤 Jarvis가 정한다. 대안 = 지금 숫자를 정함. **추정**: 근거 있는 기본값이 아직 없다 — 이 문서는 숫자를 제안하지 않는다.

## MQ-6-4 CP4(편집기 인계 · RS4-R1)

| # | 선택지 | 트레이드오프 |
|---|---|---|
| ★A | **RS6에 흡수.** `PendingDraft`·`hold`·`studioHandoff`를 만들지 않고 코어 lease+seed로 같은 일을 한다. 진입 바이트는 L0 S6b·S6c 1회로 판정 | 사실: CP4 패치와 코어 연결 자리가 겹치는 파일이 4개다(r0 서브에이전트 ② 보고 — `dev/active/rs5-integrate-plan/REPORT.md` 5절). 따로 넣으면 다시 걷어내야 한다 |
| B | CP4를 먼저 별도 착수 | 사실: CP4 조합+a = 정규화 +0.80 · raw +0.70 초과(하한) — 예산 상향 없이 착수 불가 |
| C | CP4 포기, RS4-R1 열린 채 | RS6 범위 축소 경로(L0 FAIL 시 대안) |

## MQ-6-5 충돌·시작 버튼 중 코어 메서드가 없는 3개 (UX-5 G2·G3·G4)

| # | 선택지 | 트레이드오프 |
|---|---|---|
| ★A | 기존 제품 메서드 + 코어 `replace`로 조합: "내 초안으로 저장" = `resolveConflict("mine")` → `replace` · "바뀐 문서 쓰기" = `resolveConflict("theirs")` → `replace`(진 쪽 스냅샷 보존, UX-5 MQ-5-1 ★A 승계) · "지금 문서 유지" = 기존 `PendingStart` 해제(코어 밖) | 코어 인터페이스 변경 0. 사실: 코어 `discard`는 자기 마지막 증명으로 복귀하므로 "바뀐 문서 쓰기"가 될 수 없다(I6 8.2). 충돌 중 dirty면 `replace` 거절 → 선택 전 편집 잠금 필요(UX-5 MQ-5-5 ★A) |
| B | 코어에 `resolve(choice)` 메서드 신설 | 화면 단순. 코어 계약 변경 + 하네스 재검증 |

## MQ-6-7 링크 이탈 규칙 (r1 신설 · B-RS-01 사용자 보장 변경 · SPEC-4 RS4-AC-06 대체)

- r0 초안에 있다가 지운 "MQ-6-7(새 의존성 — 결정 아님)"과는 다른 항목이다. 6-1 A 전제. 근거 = I6 3.1 · D6-9 · D6-11.

| # | 선택지 | 트레이드오프 |
|---|---|---|
| ★A | **lease 해제 save 1회 + 링크 저장 대기 제거 + 탭 수준 경고(레지스트리)**. 예외는 지금 동작 그대로(클릭 시점 `readonly`·`unsupported` = 이동 · `failed`·`offline`·`stale`·`cleared` = 보류 + 지금 `leave()`) | 사실: 지금 저장이 멈추면 링크 이동이 고착된다(I6 6.5 · `StudioLayout.tsx:135-142`). POP·재마운트도 같은 save 경로라 RS4-R8의 IDB 쓰기 주체·경고 공백이 닫힌다. 비용: SPEC-4 RS4-AC-06("`StudioLeave` 전부 변경 없이 통과 · dirty 링크 이탈 = 저장 대기", `SPEC-4.md:349`)을 대체 — `StudioLeave` 유지 7 · 의미 변경 6 · 이전 1(I6 3.1-4). 이탈 뒤 저장 실패는 편집기가 아니라 `/projects` 행·탭 경고로 보인다 |
| B | lease 해제 save·탭 경고는 넣고, 링크는 지금처럼 `core.save()` 결과를 기다린다 | RS4-AC-06·`StudioLeave` 14건 유지. 대신 저장 정지 시 링크 고착이 남는다(LV-1) — 풀려면 `T_hang` 뒤 이동 허용 같은 규칙이 더 필요(**추정**) |
| C | 지금 그대로(해제 save·탭 경고 없음) | 변경 0. 디바운스 대기 중 POP·링크 이탈 = IDB 쓰기 주체 0 · 편집기 밖 탭 닫기 경고 0(QA R1) — 권하지 않음 |

## MQ-6-6 예산 (L0 결과 뒤에만 — 지금은 결정 불가)

| # | 선택지 | 트레이드오프 |
|---|---|---|
| ★A | L0 S6c 수치가 나오면 그 수치(정규화·raw 둘 다)로 판정. 초과면 그때 상향 여부 결정 | 사실: 지금 여유 정규화 0.44KB · raw 0.60KB. 기존 실측(CP4 +0.80 정규화 · C5 장부 S5a-r +417B raw — 다른 base)은 모두 여유 밖이다. 코어 자체는 미측정 |
| B | 측정 전에 상향 폭을 미리 승인 | 수치 근거 없음 — 권하지 않음 |
| C | 상향 없음 확정 → L0 FAIL이면 MQ-6-4 C(범위 축소) | 편집기 밖 확인만 남고 RS4-R1·R8 열림 |
