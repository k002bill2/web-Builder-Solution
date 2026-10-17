# RS6 T16 BRIEF — 편집기 안 디바운스 중 beforeunload 상시 회귀 테스트 (Developer, 테스트만)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17 (영환님 "일괄" — RS6 최종 QA 4절 4번)
워크트리: `/Users/younghwankang/orca/workspaces/web-builder-solution/rs6-t16-guard` (브랜치 `k002bill2/rs6-t16-guard`, base origin/main `af76d10b`). `app/node_modules` 설치 완료.
병렬 레인: `rs6-close-docs`(문서만, `docs/**`) — 이 레인은 `docs/` 접촉 0.

## 배경
- L3b 감량에서 편집기 훅의 `beforeunload`를 지우고 레지스트리(`memoryProjectRepository.ts:148` 부근)가 탭 수준 경고를 소유하게 했다. 최종 QA 실화면: 편집기 안 편집 직후(디바운스 ~2초 중) 합성 `beforeunload` `defaultPrevented=true` — 그러나 **이를 지키는 상시 테스트가 없다**(L3b QA 조건 Q1 · `dev/active/rs6-qa/REPORT.md` 4절 4).

## 범위 (테스트 파일만)
- 새 테스트 1파일(위치는 기존 관례 — 예: `app/src/components/studio/StudioLeave*.test.tsx` 옆 또는 `features/studio/save/`): 실제 `memoryProjectRepository`(코어 있는 저장소 · 기존 `testing/coreFixture` 관례) + 편집기 마운트 상태에서
  1. 편집 직후(디바운스 대기 중, 저장 시작 전) `beforeunload` 디스패치 → `defaultPrevented === true`
  2. 저장 진행 중(inflight — 포트 commit 지연) → true
  3. 커밋 완료 뒤 → false
  4. 저장 실패(failed, 코어 dirty) → true
  5. memory 모드(`not-persistent`) — 기존 규칙대로(코드 확인 후 기대값 확정, 근거 줄 인용)
  6. 편집기 언마운트(링크 이탈) 직후 디바운스 미완 → true (L3b CP-C 규칙 — 기존 테스트와 중복이면 생략하고 기존 경로 인용)
- **RED 증명 = 변이**: 앱 코드는 바꾸지 않으므로 RED는 변이로 증명 — 레지스트리 경고 판정에서 `dirty` 조건 제거 / `inflight` 조건 제거 / 리스너 등록 제거 각각 → 새 테스트 FAIL 로그 `dev/active/rs6-t16-guard/logs/` → 매번 `git checkout -- app/src/<앱 파일>`.
- 타이머는 fake timers 또는 기존 테스트의 지연 포트 관례. flaky 금지 — 전체 스위트 3회 연속 GREEN.

## 금지
- 앱(비테스트) 코드·기준선·예산 파일·문서(`docs/**`) 수정 0 (최종 `git diff origin/main -- app/src` 에 `*.test.*`·테스트 헬퍼 외 0). 기존 테스트 단언 변경 0.
- push·merge·원격 쓰기·브라우저 0. Codex review 1회(`--scope branch --base af76d10b`).
- fresh `typecheck`·`lint`·`npm test -- --run`(base 340/3022 + 증분) · build 불필요(앱 무변경 — 단 확인용 1회, `/studio` 129.12 그대로).
- `dev/active/rs6-t16-guard/{PROGRESS,REPORT}.md`(케이스별 기대값 근거 · 변이 표 · 3회 GREEN). 명시 경로 커밋. 첫 3턴 BRIEF·PROGRESS 커밋. 최대 40턴. 서브에이전트 불필요.
