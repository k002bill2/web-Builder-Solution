# P1C-D4 REPORT — 이 브라우저 데이터 지우기 + 탭 간 알림 (Jarvis 마감)

> 본 레인 61/60 턴 한도 → 축소 재개 31/30 턴 한도(같은 작업 2회 연속) → 운영 규칙대로 Developer 재실행 없이 **Jarvis 마감**. 설계·TDD·번들 상세는 `PROGRESS.md`.

## 커밋
- `849b079` 지우기 버튼·`ClearDataDialog`(조작 뒤 청크)·흐름 1~5 · 같은 탭 쓰기 탭은 보유 잠금 안에서 지우기(`tabLink.own()?.isWriter()`).
- `60d398d` 탭 간 알림 — `saved`(커밋 뒤)·`cleared` 수신(싱크 stop · 쓰기 직전 INFRA "이 브라우저 데이터가 지워졌습니다 — 새로고침하세요").
- 이 커밋: 재개 레인이 남긴 캡처 3장 · PROGRESS · 이 REPORT(Jarvis).

## 번들 (재개 레인 build, base a0bbede)
- `/studio` 129.64 · 저장 데이터 복원 진입 132.67 · `/projects` 104.44 — 관문 통과. 1차 132.81 초과 → 리터럴 DB 이름 + parity 테스트로 해소(PROGRESS 28행).

## Ego Lite (재개 레인 실측, TaskSpace 25) — Jarvis가 캡처 3장 직접 확인
1. `1-tabA-busy-alert.png` — 다른 탭 B가 쓰기 탭일 때 A의 대화상자: SPEC 1.6 문구 그대로 + alert **"다른 탭에서 편집 중이라 지우지 못했습니다 — 그 탭을 닫은 뒤 다시 시도하세요"** · 버튼 유지. ✅
2. `2-tabA-cleared-status.png` — B 닫은 뒤 A 지우기 → `/projects` 새로고침 · 목록 빈 상태 · 영역 정상. ⚠️ **"이 브라우저 데이터를 지웠습니다" 1회 status 문장은 캡처에 보이지 않음**(시점상 이미 사라졌는지/미표시인지 미확인 — 단위 테스트 증거만).
3. `3-tabC-cleared-received.png` — 열려 있던 다른 탭 C: 영역에 **"이 브라우저 데이터가 지워졌습니다 — 새로고침하세요" + "새로고침"** 버튼. ✅
- **미실측**: ① "같은 탭 편집 → /projects → 지우기" 브라우저 시나리오(턴 한도) — 단위 회귀 테스트(`clearBrowserData`·`clearSync`, Red-Green 확인)만.
- 정리(Jarvis): 공간 25 탭에서 `indexedDB.deleteDatabase("design-studio")` = **success** · `databases()` = `[]` · `finish({keep:[]})` → `listTaskSpaces()` = **[]** · preview PID 2192(cwd = 이 worktree 확인) 종료 → 4337 리슨 0. 직전 PID 92833도 같은 방식으로 종료.

## 검증
- Jarvis 3회 검증·Codex는 `scratch/p1c-d4-final-gates/`·`codex-r1-jarvis.txt`(이 REPORT 이후).

## 남은 것
- 같은 탭 지우기 브라우저 실측 · 지운 뒤 1회 status 문장 표시 확인 → P1c 마감 QA(D5 레인 Ego Lite에 포함).

## Codex r1 수정 (P2 2건 · 2026-10-08)
- 커밋 `706c1ca` — ① `clearerFor(deps)`: 지우기를 탭(링크)당 1개로(WeakMap) — 보유 잠금 `held`·대기 중 삭제 `waiting`이 대화상자 수명 밖에 남아, 같은 탭 편집 → 삭제 실패 → 취소 → 재개 = 자기 잠금에 막히지 않고 삭제 실행 · onblocked 뒤 다시 열어도 두 번째 삭제 0. ② `ClearDataDialog` 취소·Esc = `dialog.close()` 먼저 → `onClose`(열린 modal 바깥 inert로 focus가 무시되던 문제).
- TDD: RED 예측(PROGRESS) 그대로 4건 FAIL → GREEN. 예측 차이 2건(Esc 뒤 modal 닫혀 기존 대화상자 테스트가 경로별 재렌더 + `open=false` 단언으로 강화 · 순서 테스트가 여는 클릭의 focus를 셈 → 연 뒤 spy 초기화). Red-Green: Slot을 createClearer로 · close 줄 제거 → 3건 FAIL → 복원 PASS. 단언 약화 0.
- 검증(fresh): `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0(번들 가드 통과) · `npx vitest run` 272 파일 / 2386 테스트 통과 exit 0.
- 번들: `/studio` 129.63(≤129.65) · 복원 132.66(≤132.68) · `/projects` 104.44(≤125).
- Ego Lite(vite preview 4337, TaskSpace 26): ⓑ 지우기 성공 → `/projects` 새로고침 · status "이 브라우저 데이터를 지웠습니다" 본문 1회 · 1회 키 삭제(null) ✅(캡처는 screenshot 옵션 오류로 미저장) · ⓒ 취소·Esc 각각 dialog 닫힘 + `document.activeElement` = "이 브라우저 데이터 지우기" ✅ (`shots/r1-c-focus-after-esc.png`).
- **미실측 ⓐ** 같은 탭 편집 → /projects → 지우기: 프로젝트 생성(카탈로그→프로필→3안→편집기) 흐름 스크립트화가 턴 한도 안에 불가 — 단위·컴포넌트 회귀(Codex 재현 테스트)만. ⓑ의 지우기 성공은 쓰기 탭 아닌 탭에서 확인.
- 정리: `deleteDatabase("design-studio")` = success · `databases()` = [] · preview 종료 → 4337 리슨 0. **TaskSpace 26**: `finish({keep:[]})` 뒤에도 `listTaskSpaces()`에 ownership `user`로 남음 · `claimTaskSpace(26)` 재정리 실패(exit 1) — 우회하지 않음. 사용자가 Ego Lite에서 공간 26("p1c-d4 codex r1 실측")을 닫아야 함.
- Codex 재검증은 이 레인 금지 — 다음 레인 몫.

## Codex r2 수정 (P2 1건 · 마지막 라운드 · 2026-10-08)
- 지적: 싱크를 열기 전에 받은 `cleared`가 버려져, `/projects`를 연 탭이 알림 뒤 같은 탭에서 편집하면 새 싱크가 `cleared=false`로 시작 → 지운 데이터를 새 DB에 되살림.
- 수정: `tabLink.ts` — 링크가 생성 때 채널 리스너 1개로 `cleared` 수신을 기억(`wasCleared()`, `saved`는 기록 0, 채널 없음 false). `localSync.ts` — 구독 직후 `if (link.wasCleared()) stop()` → `saveState` 쓰기 0 · `flush` = INFRA "이 브라우저 데이터가 지워졌습니다 — 새로고침하세요" · 둘 다 `gate.enter()` 전이라 잠금 획득 0. 새로고침 = 새 페이지 = 새 링크(정상).
- TDD: RED 예측(PROGRESS) — 새 4건 FAIL 확인(빈 DB 재현 쓰기 1건 발생 · 데이터 탭 저장 'ok' · `wasCleared` 없음 TypeError 2건). 예측 차이 1건: "새로고침 뒤" 테스트에 `wasCleared` 단언을 넣어 가드가 아닌 TypeError FAIL.
- 기존 테스트 1건 조정: AC-C06(편집 안 한 탭 → 낡은 탭 사유)의 탭 A가 이제 네트워크 링크로 cleared를 받아 지워짐 사유가 됨(SPEC AC-C06 허용 범위). 최신성 확인 경로를 계속 지키려고 A를 "링크 미생성 /studio 탭"(`createTabLink(undefined)`)으로 명시 — 기대 문장(STALE)·쓰기 0·레코드 없음 단언은 그대로(약화 0). 받는 탭은 새 Codex r2 절이 맡음.
- Red-Green: `if (link.wasCleared()) stop();` 줄 제거 → Codex 재현·부활 0 2건 FAIL → 복원 9/9 PASS.
- 검증(fresh, 1회): `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0 · `npx vitest --run` 272 파일 / 2390 테스트 통과 exit 0.
- 번들: `/studio` 129.62(≤129.65) · 복원 132.66(≤132.68) · `/projects` 104.47(≤125).
- 범위 밖(의도): `/projects`를 거치지 않고 편집도 안 한 순수 `/studio` 탭은 링크(채널)가 없어 `cleared`를 못 받는다 — 최신성 확인(삭제 완료 뒤 낡은 탭 사유)에 의존. 진입 때 링크를 열면 진입 바이트 0 원칙·번들 한도를 깬다.
- 엔진·계약·docs·lock 수정 0 · 새 의존성 0 · Ego Lite·Codex 실행 0(이 레인 금지).
