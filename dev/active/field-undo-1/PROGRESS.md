# FIELD-UNDO-1 PROGRESS

- base main `b3f8894` · 브랜치 `k002bill2/field-undo-1` · `npm ci` exit 0 · lock 변경 0
- 기준선 실측(base 빌드): `/studio` 129.28 · 복원 132.31 · `/profile` 99.87 · docEngine 조작 뒤 +3.44(2개 파일)
- 서브에이전트: 사용 안 함 — 조사 대상(useSectionOps·opAfter·undoStack·EditFields·테스트 2건)이 메인 컨텍스트에 이미 있어 재적재 비용이 더 큼(글로벌 위임 상한). 결과 0건.

## 체크포인트

- [ ] ① 묶음·사슬 FU-AC-1~7 커밋
- [ ] ② 참조·거절·IME·탭 FU-AC-8~12 커밋
- [ ] ③ 단언 변경(SPEC 6절 2건)·예산 FU-AC-14~16 커밋
- [ ] ④ Ego FU-QB-1(1280·1024·390)·FU-QB-2
- [ ] ⑤ 게이트 4종 · Codex(최대 2라운드) · REPORT
- [ ] FU-QB-3(실제 한글 IME) — 범위 밖: 영환님 수동 1회 필요

## 설계 메모

- 진입(useSectionOps): 열린 묶음 ref `{key,label,base,after}` · `field()`(편집 경계 → docRef 같은 틱 → 키 바뀌면 앞 묶음 닫기) · `held`에 base 포함 · 로드된 청크 ref.
- 조작 뒤 청크(opAfter → docEngine): `fieldTyped`(600ms 타이머 · 조합 중 타이머 없음) · `closeField`(push · 내용 같으면 기록 0 + 문서 참조 복귀) · `listenHistory`에 focusout(= blur 닫기).
- 닫힘 호출: run 본문(before 캡처 전) · step 본문 · undoLast · edit 바뀜(미리보기 열기/닫기) · 충돌 해결 시작(StudioLayout choose) · 언마운트 = 버림.

## TDD 기록 (RED 예측 → 결과)

