# RS6-L3b PROGRESS — 상쇄 먼저 → 링크 이탈(MQ-6-7) · POP · 화면 호출처

브리프: `dev/active/rs6-l3b-leave/BRIEF.md` · base `860d530d` · 예산 상한 `/studio` 정규화 129.13 (현재 129.04)

## 체크리스트
- [x] 0. BRIEF·PROGRESS 커밋 (`e467a1ca`)
- [x] CP-A 상쇄
  - [x] A1 `useDocSave` 코어 없는 폴백 제거 + 폴백 의존 테스트 → 코어 있는 저장소 이전(단언 유지)
  - [x] A2 S6c 제거 목록(L0 REPORT 3절) 적용 · `LocalSync.base`·DocBook `base` 우회 삭제
  - [x] A3 상쇄 실측(정규화·raw·복원) 기준선 파일 갱신 · 커밋
- [ ] CP-B 화면 호출처 전환 (PLAN CP3)
- [x] CP-C 링크 이탈·POP·beforeunload (PLAN CP4 · MQ-6-7 A)
- [ ] Ego Lite 1회
- [ ] 게이트 fresh: typecheck · lint · test · build
- [ ] REPORT.md

## 로그
- CP-A RED 예측: 픽스처만 코어로 옮기면 `conflict.latest` 단언 2건(useDocSave.test:212 · StudioLayout.test:157)만 RED. 실측 RED 2 = 예측 일치(`logs/cpA-red-latest.txt`). 출처 = 포트 `head`(조작 뒤) 추가로 GREEN(`logs/cpA-green-latest.txt`) — BRIEF CP-B 항목을 CP-A로 당김(advisor 권고).
- CP-A 픽스처: `features/studio/testing/coreFixture.ts`(제품 createSaveCore + coreIo · 가짜 포트 commit = 기존 stub saveDoc). 폴백 있는 상태 전체 = 실패 3(latest 2 + 가드 1 → 가드 제외 목록에 픽스처 추가). 폴백 제거 뒤 전체 330/2945 GREEN(`logs/cpA-full-test.txt`).
- CP-A 실측: 정규화 /studio 128.94(−0.10) · 복원 131.92(−0.10) · raw 130.29 · 133.33 → 기준선 파일 실측 갱신.
- 서브에이전트 분할: 하지 않음 — 픽스처 의미(포트·rebase·타이밍)를 메인이 정해야 했고 나머지 편집은 소량.
- CP-C RED 예측: StudioLeave 3.1-4 표 의미 변경 행(:99 · :114→U12 · :127 앞 절반 · :184) 4건 + 새 useDocSaveLeave(U12 POP · 편집 없음 0 · 진행 중 제출 · U7 · memory 늘) 중 레지스트리·해제 save가 필요한 것 RED. 실측 RED 8(`logs/cpC-red.txt` — 편집 없음 0·이전 행 failed 시작 = 지금 동작이라 GREEN, 예측대로).
- CP-C 구현: useDocSave lease 해제 save(제출 mark 뒤 편집 있을 때만) · leave() 판정 순서 ①~④ · memoryProjectRepository 레지스트리 beforeunload. 1차 129.07 → 감량 1회(편집기 훅 beforeunload 제거 = I6 리스너 중복 0) → 129.03.
- CP-C 연쇄 변경(I6 3.1-1·3.1-2 · D6-11): F9 "저장 0" → "해제 save 1 · 커밋 전 초안 보존" · readonly leave() true → undefined(이동) · 스케줄러 훅 경고 3건 + useDocSave 경고 2건 → useDocSaveLeave 레지스트리 테스트로 이전 · StudioLeave :252 실패 상태 준비를 자동 저장으로.
- CP-B 일부: `SaveResult.revision` = not-persistent만(RED `logs/cpB-red-revision.txt` → GREEN) · L3a 인계 2(restart STALE_DOC) = lease 해제 save로 사라짐 테스트.
- CP-C 게이트: 전체 331/2951 GREEN(`logs/cpC-full-test.txt`) · build exit 0 · 정규화 129.03 / 복원 132.01 · raw 130.36 / 133.39 → 기준선 실측 갱신.
