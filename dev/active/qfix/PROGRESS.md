# QFIX PROGRESS

- base f73708f · 레인 포트 4337 · 턴 상한 45

## 체크리스트
- [x] BRIEF P0 커밋
- [x] B-TEST-01 원인 특정 (CMP-AC-U1 · J-S07) + 부하 재현 전후 기록
- [x] B-TEST-01 대기 방식 안정화 (단언 유지)
- [x] B-ER-10 TDD (예측 · RED · GREEN)
- [x] B-ER-11 TDD (예측 · RED · GREEN)
- [x] B-ER-03 문구 교체
- [x] 번들 /studio 증가 ≤0.08 (판정선 128.70)
- [x] typecheck · lint · build
- [ ] 전체 vitest 3회 연속 exit0
- [ ] Ego Lite 4337 (B-ER-10 1280 · B-ER-11 390 · B-ER-03) + finish/리슨0
- [ ] Codex review branch base f73708f (≤2)
- [ ] REPORT 커밋

## 기록

### B-TEST-01
- CMP-AC-U1 원인: "만드는 중…"은 `busy==="request"`(요청 응답 전)에도 보인다. 파일 첫 생성은 계산 청크 `loadGenerate()` 콜드 로드를 기다리는데, 테스트는 "만드는 중…"만 보고 tick 3회(3000ms)를 넘겨 첫 조회 타이머가 예약되기 전에 시간이 소진 → 조회 3회 미달 → 비교 버튼 없음(이전 로그 m2c-4 final-vitest-try1: 71:41 실패 시 DOM "만드는 중…"). 제품 경쟁 조건 아님(응답 뒤 조회 시작은 의도된 순서).
- 수정: `requested()` = 프로필 알림 status가 /^3안을 만/ 될 때까지 waitFor(시작 알림은 follow() 안 — 타이머 예약과 같은 동기 구간). CMP-AC-U1과 `generate` 헬퍼에 적용. 단언·순서 변경 0, timeout 변경 0.
- J-S07 원인: 포커스 복귀는 커밋 뒤 passive `useEffect`, `findByRole`은 커밋(버튼 DOM 등장)에 풀림 → effect flush 지연 시 toHaveFocus 실패. 수정: 같은 단언을 `await waitFor(...)`로. 제품은 정상(브라우저에서 effect는 곧 실행).
- 부하 재현(`yes` ×8 + 병렬 레인, load 30→96, 두 파일 5회): 전 `logs/before-load.txt` CMP-AC-U1 5/5 실패 · J-S07 0/5 → 후 `logs/after-load.txt` 5/5 통과(23/23).

### 기준선 (build-base.txt)
- `/studio` 자동 로드 포함 128.59KB · `/profile` 119.09 · `/profile (3안 있음)` 121.56

### TDD 예측 (RED 전 기록)
- B-ER-10: 새 테스트(브라우저 inert 흉내 — 열린 모달 밖 focus() 무시) 1280·390 Esc, 1280 닫기 → 지금 코드는 모달이 열린 채 `focusButton()` → 무시 → 대화상자 제거 뒤 activeElement = BODY → `toHaveFocus` 3건 RED 예상. 수정 = 대화상자가 닫기 전에 네이티브 `close()` 먼저(Esc·닫기 같은 함수) → GREEN.
- B-ER-11: 390 테마 적용 → 알림 줄(status + "되돌리기" 래퍼)에 `scrollIntoView({block:"nearest"})` 호출 기대 → 지금은 호출 0이라 RED 예상. 범위 = "되돌리기"가 있는 알림만(오프라인 등 문장만 있는 알림까지 스크롤하면 입력 중인 필드가 밀려남). behavior 생략(즉시 — 모션 0, StructureCanvas 선례). 포커스는 그대로(테마 영역 "테마 바꾸기").
- B-ER-03: ProfileCandidates "편집 시작" 설명에 새 문구 기대 + 3안 영역에 "자리표시|2a-05" 없음 → 지금 문구라 RED 예상. 의도된 문구 변경.

### RED → GREEN
- RED `logs/red.txt`(미커밋 상태에서 실행): 5 failed — B-ER-10 3건 포커스 = BODY(예측 일치) · B-ER-11 scrollIntoView 호출 0 · B-ER-03 새 문구 없음.
- 구현: `SnapshotDialog` `close()` = 네이티브 `dialog.close()` 먼저 → `onClose()`(Esc·닫기 공통) · `NoticeRegion` "되돌리기" 있는 알림이 바뀌면 `scrollIntoView?.({block:"nearest"})`(즉시, 포커스 이동 0) · `generationText.editNotice` 새 문구.
- 의도된 테스트 문구 변경: `ProfileCandidates.test.tsx:114` 옛 문구 기대 → 새 문구("이미 편집 중인 문서가 있으면 그 문서를 엽니다").
- GREEN `logs/green.txt` 46/46 · typecheck 0 · lint 0 · build 0.
- 번들(`logs/build-after.txt`): `/studio` 128.59 → **128.62**(+0.03 ≤0.08, 판정선 128.70 이내) · `/profile` 119.09→119.07(−0.02, 문구 몫) · `/profile(3안)` 121.56→121.54 · 그 밖 화면 +0.00~0.02(±0.03 이내).
- 관찰(차단 아님): 섹션 연산은 같은 커밋에서 부모 effect의 `focus()`가 알림 스크롤 뒤에 실행돼 포커스 대상 쪽으로 다시 스크롤할 수 있음.
