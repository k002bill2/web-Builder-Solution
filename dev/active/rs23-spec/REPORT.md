# RS23-SPEC REPORT — B-RS-02 · B-RS-03 상태/복구 설계

- 레인: Designer · worktree `rs23-fix` · branch `k002bill2/rs23-fix` · base `93f8111` · **앱 코드 변경 0**(문서만).
- 산출물: `docs/design/restart/SPEC-3.md` · `docs/design/restart/MQ-3.md` · 이 REPORT · `PROGRESS.md`.

## 0. 결론

1. **B-RS-02**: create도 커밋 전에 기존 `guardWrite()`를 부른다(★ MQ-3-2 A).
   - 잠금 소유자는 탭당 `LocalSync` gate 하나다. 흐름별 `tryLock`·`held`는 없다.
   - 거절되면 메모리와 IDB 둘 다 변화 0이다.
   - 커밋 뒤 실패(flush INFRA·응답 단계)는 restart와 같은 "커밋 확인 → 사유" 순서로 미확인(C-E4)·확인 불가(C-E5)·사유별 거절(C-E2/2b/2c/3)로 나눈다(★ MQ-3-3 A).
2. **B-RS-03**: 미확인 기억을 의존성 없는 탭 메모리 모듈로 옮긴다. `/projects` 행이 그 기억을 읽어 "편집기 열기" 대신 "저장 다시 시도"(같은 인자 `startDoc` 재생)를 보여 준다(★ MQ-3-1 A, `/studio` 진입 0B).
   - 편집기 진입 인계(B)는 `/studio` 예산 상향이 필요해 결정 질문으로 남겼다.
3. **영속 판정**: 미확인 상태는 메모리 전달로 충분하다. 새로고침하면 메모리가 IDB로 돌아가 상태가 일치하므로 기록할 대상이 없다. 새 스키마·저장소 인터페이스·엔진 계약·의존성·백엔드가 모두 0이다. 예산 상향은 ★안에서 0이다.
4. **예산 precondition**: 구현 전에 스파이크 2개로 `/studio` 129.87→판정선 129.90 · 복원 132.91→132.94, `/profile`, `/projects`를 실측한다. 넘으면 감량 1회 뒤 멈추고 재상신한다. 판정선은 수정하지 않는다.

## 1. 남은 결정 (MQ-3 — 영환님 · Jarvis)

| ID | 질문 | ★ | 막는 것 |
|---|---|---|---|
| MQ-3-1 | B-RS-03 인계 위치 | A `/projects` 행 게이트(`/studio` 0B) — B는 `/studio` 예산 상향 결정 필요 | 구현 착수 |
| MQ-3-2 | create 커밋 전 잠금 확인(MQ-S2 C 승격) | A — 내부 순서 변경, `restartLock.test.ts:136` 단언 교체 | 구현 착수 |
| MQ-3-3 | create 커밋 뒤 실패 문장 | A 커밋 확인 → 사유 | 구현 착수 |
| MQ-3-4 | 미확인 중 새로고침 경고 | A 없음(문장으로 밝힘) | 없음(★ 기본) |

## 2. 원인 trace 통합 (서브에이전트 결과 · 메인 재확인)

| 조사 | 방식 | 결과 | 메인 재확인 |
|---|---|---|---|
| RS02 | Explore 읽기 전용(19 tool) | create 잠금 확인 없음(`memoryProjectRepository.ts:121-122`) · 응답 단계 실패 = flush 0회(`:66,79-81`) · 같은 안·다른 버전 `DOC_EXISTS`로 IDB에 없는 문서 편집기 진입 · stale에도 일반 문장 + 다시 시도 · `restartLock.test.ts:136`이 지금 동작 고정 | `memoryProjectRepository.ts`·`localSync.ts`·`writerLock.ts`·`infra.ts`·`restartFlow.ts` 직접 판독 — 일치 |
| RS03 | Explore 읽기 전용(30 tool) | 기억 = `restartFlow.ts:28-35` WeakMap(저장소 인스턴스 키) · `/projects`는 메모리 요약 + state 없는 링크 · 편집기 `idle` 시작(경고·`leave` 없음) · 편집 저장·복원·내보내기가 레코드 전체 flush로 확정 · 큐 `status`는 인터페이스 밖 | `RestartDialog.tsx`·`useDocSave.ts`·`saveStatusText.ts`·`memoryDocBook.ts:353-367`·`check-bundle-size.mjs` 직접 판독 — 일치 |
| advisor | 방향 점검 | B-RS-03 ★를 `/studio` 0B 안으로(예산 여유 30B) · 앱 안 `/studio` 진입 경로 표 · `tabLockHold` 재진입 확인 · 기존 단언 교체 허용 명시 · create 커밋 확인 | 전부 반영(SPEC-3 2.3·3·5·7) |

원래 계약 vs 구현: 현재 구현은 SPEC r2와 일치한다(create는 MQ-S2 C로 의도적 제외, RS-R7은 BACKLOG 후보). 따라서 이번 변경은 계약 위반 수정이 아니라 **승인이 필요한 범위 확장**이다(SPEC-3 2.4).

## 3. 목업과 다르게 한 곳
- 목업(design/)에는 미확인 상태 화면이 없다. ADR-003 우선순위(기능·흐름 → 사용성 → DS 일관성)에 따라 기존 Callout·행 버튼 관례를 썼다.

## 4. Codex 적대검토
- r1: (진행 중 — 결과 반영 후 갱신)

## 5. 검증
- 코드 변경 0 → typecheck·lint·test·build 게이트 대상 없음. `git diff --stat 93f8111 -- app/` = 0을 확인한다(아래 기록).
