# ER-3b REPORT — 스냅샷 화면 · **멈춤(판정선 초과 + 6절 목록 밖 가드 실패)**

- **첫 줄 요약: /studio 진입 127.69 → 128.49KB(+0.80) — 판정선 128.43 초과, ER-3b 몫 목표 0.35 초과. 브리프 규칙대로 즉시 멈춤 · 추가 빌드 시도 0.** 동시에 6절 목록 밖 단언 1건 실패(`memoryExport.test.ts` "화면은 스냅샷을 만들지 않는다 (E-AC-30 · E-AC-43)").
- base `45a5721` · 브랜치 `k002bill2/er-3b` · 서브에이전트 0 · push/merge/삭제 0 · main 5480 무접촉 · 엔진·계약·data·docs·scripts·lock 수정 0
- 커밋된 것 = 단계 A(GREEN)뿐. 단계 B·C 화면 코드는 **커밋하지 않음**(빌드 깨진 채 커밋 금지) → 작업 트리 그대로 + `dev/active/er-3b/wip-stage-bc.patch`(신규 파일 포함 전체 diff)로 보존.

## 1. 멈춘 이유 (L1)

| 조건 | 측정 | 근거 |
|---|---|---|
| /studio 진입 ≤ 128.43(멈춤) · ER-3b 몫 ≤ 0.35 | **128.49 (+0.80)** · 첫 화면 91.76 → 91.75 | `logs/build-base.txt` → `logs/build-bc.txt` (check-bundle-size exit 1) |
| 6절 목록 밖 테스트 깨짐 0 | **1건**: `src/data/memoryExport.test.ts:235` "components·features·pages 비테스트 코드에 createSnapshot 호출 0" | `logs/gate-bc.txt` (708 중 1 실패) |

- 가드 충돌: 이 가드는 "화면은 스냅샷을 만들지 않는다"(E-AC-30·43 — 내보내기 전 스냅샷은 requestExport만)를 **createSnapshot 호출 0** 으로 잰다. ER-AC-S1·S9("지금 상태 저장")는 화면이 `createSnapshot`을 부르는 것이 기능 자체라 정면 충돌. 파일은 6절 목록에 있지만 사유("번호 공유")가 달라 **목록 밖 단언**으로 판정 → 멈춤. 판정 요청(아래 4절).
- 번들 원인 추정(L3, 추가 빌드 없이 산출물만 봄): 새 조작 뒤 청크 `SnapshotPreview` 1.39 · `SnapshotDialog` 1.75(gzip)는 분리됐다. 진입 증가 +0.80은 ① 정적 훅 `useSnapshots.tsx`(버튼·상태·참조 집합·lazy 래퍼) + StudioLayout 연결선, ② **`SnapshotPreview`가 `ds/Callout`(→ `Icon`)을 import → 공통 청크 재분할**(빌드에 `Callout-*.js` 0.42KB 별도 청크 생김 — `StudioToolbar.tsx` 주석의 "Icon import 시 +0.39" 실측과 같은 유형) 로 추정. 재개 시 1순위 = Callout 대신 Icon 없는 자체 마크업, 2순위 = 되돌리기·참조 집합 로직을 조작 뒤로.

## 2. AC 판정 (현재 작업 트리 기준 — 단계 B·C는 미커밋)

| AC | 판정 | 근거 |
|---|---|---|
| ER-AC-S3 | 테스트 통과(미커밋) | `SnapshotFlow.test.tsx` 미리보기: 캔버스 = 스냅샷 문서(`frame.lastDoc`) · 포커스 Callout 제목 · 편집 필드·"검사 · 내보내기" `aria-disabled` + 같은 이유 · 입력 무시 · 2.3초 진행 뒤 저장 추가 0 · 돌아가기 → 포커스 "스냅샷" · 잠금 해제 |
| ER-AC-S4 | 테스트 통과(미커밋) · **해석 명시** | 알림 "스냅샷 '수동 1'으로 복원했습니다 · 복원 전 상태는 '복원 전 · 14:05'에 있습니다" · 포커스 h1. "기록 스택 1건" = 알림 줄 "되돌리기" 1건(복원 직전 문서를 새 편집으로 → 새 revision 저장). `useSectionOps` 내부 기록 스택(쓰기 목록 밖)에는 넣지 않음 — ER-4(키보드·다시 실행) 몫으로 넘김 |
| ER-AC-S9 | 단위 + 화면 통과 | 단위 `useDocSaveWrite.test.tsx`(커밋) · 화면: 입력 직후 "지금 상태 저장" = `save` → `create` 순서 · 스냅샷 = 최신 입력 / 저장 실패 → create 0 + "저장하지 못해 스냅샷을 만들지 않았습니다" |
| ER-AC-S10 | 단위 통과(커밋) · 화면 부분 | 단위: 진행 중 저장 → 저장 먼저 → 쓰기 직렬(`save:r → saved → save:r+1 → restore:r+2`) · 채택 뒤 다음 저장 STALE 0. 화면: 복원 → 편집 → 저장(expectedRevision = 복원 revision, STALE 0) · 되돌리기 → 새 revision. **내보내기 요청 revision 단언은 화면 테스트에 없음**(상태 있는 저장소 흉내 사용 — 실메모리 저장소 통합은 미작성) |
| ER-AC-S6 | 단위 통과(커밋) · 화면 미작성 | `imageStore.test.ts` 참조 집합 ∪ 스냅샷 · 탭 한도 스냅샷 거부 문장(2a-05 5.9 표 원문). 화면 연결(StudioLayout 렌더 중 prune · ImageSlotField 교체 prune에 스냅샷 문서 전달)은 코드만 — "A → 스냅샷 → 교체 → 복원 = A 유지" 화면 테스트 미작성 |
| ER-AC-S7 | 테스트 통과(미커밋) | "자동 · 내보내기 전 · 시:분" 종류 글자 + 미리보기. 내보내기 결과 뒤 목록 다시 읽기(참조 집합) 연결 |
| ER-AC-S8 | 청크 분리됨 · **진입 예산 미충족** | 위 1절 |
| 접근성(7절) | 테스트 통과(미커밋) | 대화상자 포커스 = 이름 입력 · 닫기 → "스냅샷" · "더 보기"(사라짐) → 새로 보인 첫 "미리보기" · 복원 실패 `role=alert` 1회 · 포커스 = 남는 복원 버튼 · 390·1024 대화상자 정확히 1개 · 390 "편집" 탭 전환 뒤 새 필드도 잠김 |

## 3. TDD (예측 → RED → GREEN)

| 단계 | 예측 | RED | GREEN |
|---|---|---|---|
| A | 5 | 5/5 `logs/red-a.txt` | `d402383` + lint 수정 `ba?`(아래 git log) · 표적 24/24 · typecheck·lint·src/test exit 0 `logs/gate-a.txt` |
| B+C | 8 + 5 = 13 | **11/11**(테스트 11개로 합침 — 예측보다 2 적음: S6 화면·S10 내보내기 단언 미작성) `logs/red-bc.txt` = 단계 A 커밋(HEAD)을 `/tmp/er3b-red`에 풀어 같은 테스트 실행 | 11/11 `logs/green-bc.txt` · 미커밋 |

- 깨진 기존 테스트: 6절 목록 밖 1건(1절). 그 밖 studio·features·src/test·data 707 통과(`logs/gate-bc.txt`).
- 구현 중 수정: act 콜백 안에서 저장 약속을 기다리면 교착(테스트 도우미로 해결) · 렌더 중 ref 쓰기 lint · 3단 배치 대화상자 누락 · 참조 배열 매 렌더 새로 만들어 무한 렌더(useMemo) · 미리보기 진입 직전 디바운스 저장이 미리보기 중 나감(진입도 저장 먼저).

## 4. 판정 요청 (영환님)

1. 번들: (a) Callout→자체 마크업 등 진입 감량 후 재측정 허용 여부 / (b) 예산 조정(MQ-R3·ADR-004)
2. 가드 `memoryExport.test.ts:235`: "화면 createSnapshot 0"을 "내보내기 흐름에서 createSnapshot 0"(스냅샷 화면 파일 제외)으로 좁혀도 되는지 — E-AC-30·43 취지(내보내기 전 스냅샷은 requestExport만)는 유지

## 5. 미실행 (멈춤 규칙에 따름)

- Ego Lite 브라우저 확인·캡처: **미실행**(빌드 판정 실패 상태 — 이 레인이 연 창 0, 서버 기동 0, 리슨 0)
- 전체 vitest · Codex: 아래 6절

## 6. 쓰기 범위 메모

- PLAN 목록 밖 쓴 파일: `features/studio/images/store/types.ts`(ImageHost 튜플 선택적 4번째 = 스냅샷 문서 — 컴파일상 필요) · `components/studio/useSnapshots.tsx`(신규 정적 훅 — StudioLayout 증가 방지) · 테스트 `useDocSaveWrite.test.tsx`·`SnapshotFlow.test.tsx`
- SPEC과 다르게 한 곳: "스냅샷" 버튼을 모든 폭 툴바에 둠(SPEC: <1280 "더보기" 안 — "더보기" 메뉴는 ER-4 몫이라 아직 없음)
