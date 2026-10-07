# PERSIST-E0 REPORT — P1-E0 번들 실측 스파이크

## 결론
- **판정: 128.58KB 이하 배치안 없음.** 최저는 안1-min 129.00KB로 판정선보다 **+0.42KB**(잡음 포함 +0.42~0.46) 크고, 검사기는 라우트 한도 129에도 실패로 판정한다. → ADR-007 P5 ★A에 따라 P1을 멈추고 예산 MQ를 재상신해야 한다(자료 = E0.md "MQ 재상신 자료").
- **② 생성 잡 복원 추천: ★B hidden 영속.** 진입 비용 +0이고 getJob·retryFailed 변경도 0이다. 재계산 재시작은 /profile(3안 있음)을 121.59 → 127.08로 올려 125를 넘는다.

## 근거 (L1)
- 측정값은 모두 `npm run build`(tsc → thumbs → vite build ×2 → check-bundle-size) 출력이다. 안2의 /compare·/profile만 검사기가 세지 않는 자동 청크 0.56KB를 수동으로 더했다(E0.md 각주 1).
- 표·모듈별 원인·안별 커밋은 `dev/active/persist-e0/E0.md`에 있다.
  - 조각별 한계 비용: 읽기기+대기 +0.37 · "local" +0.01 · 이미지 자동 복원 +0.15.
  - zod 봉투를 진입에 두면 +6.17로 125 한도 3개 라우트도 깨진다 → 진입은 수제 schemaVersion 확인만 둔다.

## 변경 파일 (스파이크 — 병합 대상 아님, 브랜치 보존)
- 새 파일: `app/src/data/localEntry.ts` — 진입 읽기기·이미지 읽기.
- 진입·하이드레이션 연결: `app/src/data/deferredStudio.ts`(`loadDeferredStudio` 대기) · `app/src/main.tsx`(호출 이름 1곳) · `app/src/data/studioStore.ts`(초기 상태 인자).
- 저장소: `app/src/data/memoryProjectRepository.ts` — 문서 머리 폴백 · "local" · images.
- 화면: `app/src/features/studio/saveStatusText.ts`(문구 분기) · `app/src/components/studio/StudioLayout.tsx`(이미지 복원 effect).
- 문서: `dev/active/persist-e0/{BRIEF,PROGRESS,E0,REPORT}.md`.
- 수정하지 않은 것(`git diff --stat a55966c HEAD`로 확인): m2cBaseline·check-bundle-size·bundleBudget·엔진·`engine/contracts`·`projectRepository.ts`(ProjectPersistence 타입)·docs/**·package-lock·CLAUDE.md.

## 검증
- `npm run build`(HEAD 소스): /studio 129.00으로 exit 1이다. 예산 실패가 이 스파이크의 측정 결과다. tsc는 통과했다.
- `npx vitest --run`: 2218/2219.
  - 실패 1건은 `src/pages/keyboardA11y.test.tsx` 포커스 이동이다.
  - `npx vitest --run src/pages/keyboardA11y.test.tsx`를 단독으로 돌리면 스파이크 9/9, base `a0c9024` 9/9로 모두 통과했다 → 전체 실행 부하에서 나는 타이밍 flaky로 판단해 수정하지 않았다.
- lint는 돌리지 않았다(측정 스파이크 — 4게이트 완료 대상 아님).

## 하지 않은 것 · 사유
- **Ego Lite 미사용**: 판정이 정적 번들 closure만으로 정해진다. 스파이크에 쓰기 경로가 없어 IDB에 실제 데이터를 넣을 방법이 앱 안 클릭으로는 없다. 그래서 실 IDB 읽기 실측은 P1a(쓰기 큐 생긴 뒤)로 미룬다.
- Codex 검증: Jarvis 몫(BRIEF)이라 하지 않았다.
- 서브에이전트 0 · push/merge/삭제 0 · main 무접촉.

## 턴 관리
- E0.md 측정표 커밋(`c18147c`): 약 33턴째 — **목표(30턴 전) 미달**. REPORT 초안 커밋(`562c6cf`): 약 37턴째 — 목표(40턴 전) 충족. 35턴 뒤 새 측정은 안1-min 연결 정리 재측정 1회(advisor 지적 반영 — 판정 숫자 정밀화)뿐이다.

## 주의·가정
- gzip 측정에는 ±0.01~0.02 잡음이 있다(해시 이름 변화로 공통 청크가 흔들림).
- 스파이크는 hydrate된 상태에 deepFreeze를 걸지 않고, `/projects` hasDoc는 진입 문서 1건만 맞추며, StudioPanels 안내 문구는 분기하지 않았다. 이 차이에 따른 실제 P1a 진입 몫은 ±0.05 안팎으로 추정한다[추정].
- `"local"`을 타입에 넣는 것은 바이트 0이지만, 그 파일이 "계약" 범위인지 판단은 Jarvis에게 남긴다.

## 다음 (Jarvis)
1. E0.md "MQ 재상신 자료"로 MQ-P5 재상신 — 선택지: 판정선·한도 개정 / /studio 구조 점검으로 0.45KB 이상 확보.
2. ② 추천(B)을 채택하면 ADR-007 3절 `studio` 행("job만, hidden·attempts 제외")을 개정한다.
