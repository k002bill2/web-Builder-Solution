# RS6-L4 BRIEF R2 — L4 전체 구현 재개 (M3a 조합 · 상향 0) (Developer, 구현)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
워크트리: 이 워크트리 `k002bill2/rs6-l4-ux` (tip `1e5d2677`, 앱 = base `aca09805`). 1차 `BRIEF.md`의 정본·범위(CP1~CP4)·규칙·Ego Lite·Codex·마감을 그대로 따르고, 아래만 바꾼다.

## Jarvis 결정 (REPORT-MEASURE 4절 근거)
1. **설계 질문 ① = I6 8.1안**: 다른 탭 stale(포트 `mode()` stale) → `stale` 환경 행("다른 탭에서 바뀐 내용이 있습니다 — 새로고침한 뒤 편집하세요" + "버리고 새로고침" → 폐기 확인 → discard·reload). 정본(I6 8.1)과 일치하고 상향 0. 의미가 바뀌는 4건(`useDocSave.test` 2 · `StudioLayout.test` 2)은 I6 8.1 근거 열과 이전/이후 표로 교체(약화 아님을 행마다 서술). `ConflictCallout`·`resolve`는 lazy로 남긴다 — 제품 도달 경로가 0이 되면 REPORT에 "도달 경로" 표로 명시(삭제는 이번 범위 밖, QA 판정).
2. **설계 질문 ② = 분리안 유지**: 3절(LV) 문구 = `saveStatusText.ts`, UX-5 2.3 환경 문구 = 조작 뒤 `save/reasonText.ts`. G3 문면(3절 새 문구 1곳)과 충돌 없음 — REPORT에 근거 1줄.
3. **상쇄 M2a~M2d 전부 채택**. M2c·M2d `vite.config.ts` 청크 그룹은 `src/build/` 목록 모듈로 정리(선례 `studioEngineChunk.ts`). `/compare` 조작 뒤 `memoryProfileAdjust` +0.66은 판정 밖이지만 REPORT 예산 표에 기록.
- **판정선 상향 없음**(ADR-004 개정 17 그대로). M3a 실측 129.12/130.43/132.10 = 멈춤선과 같아 여유 0이다.

## 예산 규칙 (R2)
- 최종 build가 멈춤선(정규화 > 129.12 · 복원 > 132.10 · raw > 130.5)을 넘으면 감량 1회: 후보 = `resolve`·`conflict.latest` 진입 결선 제거(stale 행 전환으로 진입 사용처가 사라지는 경우만, 동작 변화 0) · 그 밖 A표 성격(동작 변화 0)만. 그래도 넘으면 **멈추고** 수치 보고(상향은 Jarvis가 영환님께). B표(동작 변화) 후보 금지.
- 상한 안이면 `m2cBaseline.json`·`bundleBudget.test.mjs`를 실측으로 같은 커밋에서 갱신(note "개정 17 배분 RS6-L4"). `check-bundle-size.mjs` 수정 금지.

## 진행
- `patches/measure-m3a-stale-row.patch`(M2d + stale 행)는 **참고 구현**이다. CP마다 RED 테스트를 먼저 쓰고(RED 로그 `logs/r2-*`) 해당 CP 부분을 패치에서 옮겨 GREEN — 패치 일괄 적용 후 테스트 맞추기 금지.
- 예상 깨짐 3건(REPORT 4절: StudioLayout STALE→Callout 동기 getBy · StudioLeave 읽기 전용 문구 · liveness aria-busy slow 꼬리)도 UX-5 근거로 이전/이후 표.
- 병렬: L5(FIX1 재QA 중, `rs6-l5-projects`)가 `saveCore.ts`·`coreIo.ts`를 3줄 바꿨다(rebase proof `rebased`). 이 레인은 그 파일의 다른 부분만 건드리고, 머지 순서는 L5 먼저 → Jarvis가 충돌을 판단한다. 다른 워크트리 접촉 0.
- Ego Lite는 1차 BRIEF대로 + stale 행(2탭, 실제 `navigator.locks` held 기록) 1회. preview 서버 반드시 종료·리슨 0.
- 첫 3턴 BRIEF-R2·PROGRESS 커밋. CP2 40턴 전 · 85턴부터 새 구현 중단 → Ego Lite·Codex·게이트·REPORT. **REPORT 초안은 90턴 전에 커밋**. 최대 105턴.
