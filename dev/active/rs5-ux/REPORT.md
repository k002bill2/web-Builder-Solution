# RS5-UX — REPORT (UX-5 상위 UX 명세 초안)

- 성격: **Designer 상위 UX 초안 1건.** QA 리뷰와 병렬이며 계약 확정본이 아니다. 앱·CONTRACT-5·기존 SPEC/MQ·ADR 변경 0, 코드 0, 실화면 검증 0(PASS 주장 없음).
- base `418979e` · 앱 `93f8111` · 브랜치 `k002bill2/rs5-ux` · 산출물 `docs/design/restart/UX-5.md`(r0).
- 회수: Jarvis.

## 1. 결론
1. 상태를 축 3개(환경 · 장부 단계 · 결과)와 표시 우선순위 1줄로 정리했다. 11상태와 영구 확인을 표 하나에 담았다(UX-5 2절).
2. "저장됨"(영구 확인)은 5조건이 모두 맞을 때만 보인다. 조건은 `confirmed` · `!newer` · 그 뒤 편집 없음 · local · 싱크 정상이다. `newer`면 새 세대 상태를 보이고 "저장됨"은 0이다(3절).
3. 저장 확인(`confirm`)과 시작 재시도(`retryStart`)를 버튼·라벨·노출 조건으로 분리했다. SPEC-3/4의 "저장 다시 시도"는 UX-5에서 "시작 다시 시도"로 바꾼다(4절 · D1).
4. 충돌은 두 선택지로 정리했다(5절). 파괴 결과·이미지·확인 대화상자·포커스·알림·수명 한계를 명시했다. 권장안은 두 선택 모두 기존 `resolveConflict` 의미(진 쪽을 스냅샷 "충돌 보존"으로 남김, `memoryDocBook.ts:330` L1)를 장부 경유로 쓰는 것이다(MQ-5-1).
5. 이탈 보호를 경로 7개로 나눴다(7절). 앱 안 링크와 POP은 장부가 탭 안에서 지킨다. 새로고침·주소 입력·닫기는 `beforeunload` 경고만 있고 문구는 브라우저 기본이다. 모바일 종료·크래시·ingest 중 이탈은 보호 0이다.

## 2. 계약 의존 구분
- **(a) C5 본문에 있으나 미재검토(r0.1/r0.1a)**: I8 `dirtyMark`/`publishedMark` · I3b/4.4 `conflicted`·`epoch` · I5b · 4.5 StrictMode effect 한정 · seed phase. UX-5 12절 표.
- **(b) C5에 없는 gap — 제안만, 계약 수정 0**: G1 `LedgerView` 필드 미정의 · G2 "내 초안 유지" method 없음 · G3 "지금 문서 유지"(start 비움) method 없음 · G4 conflicted 중 `discard` 효과 미정 · G5 unsupported/memory 구별 필드 없음 · G6 마운트 중 `confirm`은 dirty 편집을 못 봄(거짓 확인 가능) · G7 image-missing 슬롯 식별 불가 · G8 replace 원인 필드 없음 · G9 ingest 중 `mark` 여부 · G10 start-pending 중 편집기 자동 저장 허용 여부. UX-5 13절.
- **(c) 기존 코드 L1**: phase·문구(`saveStatusText.ts`) · `ConflictCallout`·`resolveConflict` 스냅샷 보존 · `beforeunload` 1곳·문구 없음 · `leave()` 링크 이동 보류 · `layoutMode.ts` 1280/1024 · 대화상자 패턴. 출처는 `logs/survey-*.md`와 메인 직접 확인(`memoryDocBook.ts:322-334`, `useAutosaveScheduler.ts:160-178`, `2a-05/SPEC.md` E-S06~E-S10).
- 정정 메모: `docs/design/editor-rest/SPEC.md:32`의 "resolveConflict: missing"은 현재 코드와 다르다(`memoryProjectRepository.ts:130`에 `write("resolveConflict")` 있음). 이 레인은 그 문서를 수정하지 않았다.

## 3. 결정 질문 (MQ-5, UX-5 13절)
MQ-5-1 충돌 보존(★양쪽 스냅샷) · MQ-5-2 충돌 라벨(★기존 E-S09 라벨 유지) · MQ-5-3 편집기 "저장 확인"(★dirty 아닐 때만) · MQ-5-4 390 충돌 Callout 위치(★탭 목록 위) · MQ-5-5 seed conflicted 편집 잠금(★미리보기 + 입력 잠금).

## 4. 서브에이전트 결과 (읽기 전용 2개, 병렬)
| 에이전트 | 범위 | 결과 | 산출 |
|---|---|---|---|
| code-explorer A | DS callout/dialog/status · 저장 상태 문구 | 완료(16 tool) — DS에 Dialog/Toast 없음, `<dialog>`+showModal 패턴, 편집기 INFRA 사유 미노출, 수동 저장 버튼 0 | `logs/survey-a-ds-copy.md` |
| code-explorer B | 라우트·포커스·이탈 보호·반응형 | 완료(27 tool) — useBlocker/popstate 0, beforeunload 1곳 문구 없음, layoutMode 1280/1024, 390 subline, 스냅샷 복원 재마운트는 [추정] | `logs/survey-b-route-focus.md` |
메인 재확인: `resolveConflict` 구현(`memoryDocBook.ts:322-334`)과 offline 흐름(`useAutosaveScheduler.ts:160-178`)을 직접 읽었다. E-S09/E-S10 정본은 `docs/design/2a-05/SPEC.md:155-157`.

## 5. 검증 실행 vs 미실행
| 항목 | 상태 |
|---|---|
| 범위 확인 `git diff --stat 418979e -- app docs/decisions docs/design/restart/{CONTRACT-5,SPEC,SPEC-3,SPEC-4,MQ,MQ-3,MQ-4}.md CLAUDE.md` | 실행 — 빈 출력 exit=0, 미추적은 `dev/active/rs5-ux/`·`UX-5.md`뿐(`logs/scope-check.txt`) |
| `git diff --cached --check` | 커밋 전 실행(아래 로그) |
| 자체 review | 1회 — 모순 3건 수정(seed conflicted 편집 잠금을 C5 4.4 문면에 맞춤 · 편집기 "저장 확인" 노출 조건 · start-pending 링크 숨김 근거 + G10) |
| Codex | **0회** — BRIEF: QA 소유, 중복 실행 금지 |
| typecheck/lint/test/build | 미실행 — 앱 변경 0, 문서 레인 |
| 실화면(ego-browser) | 미실행 — 코드 없는 명세. UX5-AC는 구현 레인 검증 기준 |

## 6. 남은 것 · 필요한 것
- 회수자(Jarvis)·사용자 결정: MQ-5-1~5 · G1~G10을 C5 개정에 넣을지 · seed 인계 UI(6.1)의 `/studio` 진입 바이트(S5b/c 미측정) 조건.
- 남는 위험: 자동 스냅샷 상한으로 "충돌 보존"이 밀려날 수 있음(상한 미확인) · 스냅샷 복원 때 이미지 재부착 여부 미확인(`imageStore.ts:26` 보존 집합) · 390에서 기존 충돌 Callout이 탭에 가려지는지 실화면 미확인.
