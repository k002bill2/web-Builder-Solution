# ER-3b REPORT — 스냅샷 화면 (재개 완료 · Codex r2 지적 3건 미반영)

- **4차 첫 줄: 마감 수정 1·2·3·5 커밋 `cba9f28` — /studio 128.42 ≤ 128.43(감량 2회) · vitest 236/2105 exit 0 · Codex r4 P1 0·P2 2(새 범위, 미반영) · Ego Lite 항목 5 계산 스타일 확인 · 항목 1 실브라우저 재현 실패 · 캡처 0(CDP 캡처 타임아웃).**
- **3차 첫 줄: 마감 수정 1·2·3·5는 GREEN(19/19)이나 합산 /studio 128.45 > 128.43 → 즉시 멈춤 · 미커밋(`wip-fix3.patch`). 커밋은 항목 4(로컬 시각)만 — HEAD 128.32. Codex r2 P1·P2 2건은 tip에 여전히 열림(r3 같은 3건 · 새 P1 0) → 병합 금지 유지.**
- **첫 줄: /studio 진입 127.69 → 128.33KB(+0.64) — 판정선 128.43 이내 통과, 목표 128.04 미달. ER-3b 몫 0.64 > 0.35 → ER-4 여유는 0.10KB뿐(경고).** 첫 화면 91.76(±0.00).
- base `45a5721` · 브랜치 `k002bill2/er-3b` · 서브에이전트 0 · push/merge/삭제 0 · main 5480 무접촉 · 엔진·계약·data 인터페이스·docs·scripts·lock 수정 0
- 재개 커밋: `9a96a51`(B·C + 감량 + 가드 대체) · `d9f92bb`(Codex r1 3건) · `c12aad6`(S6·S10 테스트) · 이 REPORT 커밋
- **열린 것: Codex r2 P1 1 · P2 2 미반영**(턴 상한 55 도달 규칙 — 6절). 다음 레인 1순위.

## 1. 번들 (결정 1 — 감량 3회, `logs/build-*.txt`)

| 시도 | 바꾼 것 | /studio 진입 | 판정 |
|---|---|---|---|
| 기준 | `logs/build-base.txt` | 127.69 | — |
| 멈춤 당시 | `logs/build-bc.txt` | 128.49 | 초과 |
| 1 | SnapshotPreview `ds/Callout` → 같은 토큰 자체 마크업(Icon 0) | 128.51 | 초과 — Callout 청크는 **기준 빌드에도 있음**(1차 REPORT 추정 틀림) |
| 2 | 대화상자·미리보기·복원·되돌리기 처리를 조작 뒤 청크 `SnapshotLayer` 1개로, 진입 훅은 상태·버튼·참조 집합만 | 128.35 | 통과 |
| 3 | 지연 청크의 `isPageDoc` 직접 import 제거(props 전달 — 진입 청크 미리 받기 목록에서 파일 4개 빠짐) + lazy 로더 파일 분리 | **128.30** | 통과 |
| 최종 | Codex r1 반영 뒤(`logs/build-e.txt`) | **128.33** | 통과 · 몫 0.64 |

- 원인 실측: 증가분은 거의 전부 `StudioLayout` 청크(17.46 → 18.1) — 정적 훅 + 연결선. 남은 0.6KB를 더 줄이려면 연결선(버튼 3곳·참조 집합·게이트 캡션·미리보기 폭 감싸개)을 옮겨야 해 범위가 커져 멈춤.
- 다른 화면: /compare·/profile·/projects 변화 ≤0.01(로그 대조). 렌더 문서 84.19 그대로.

## 2. AC 판정

| AC | 판정 | 근거 |
|---|---|---|
| S3 미리보기 | 통과 | `SnapshotFlow.test.tsx` + Ego 1280·390(입력 "XX" 무시 · 포커스 Callout 제목 · `aria-disabled`+이유) |
| S4 복원 | 통과(해석 1차 REPORT 그대로) | 알림 "스냅샷 '통과 상태'으로 복원했습니다 · 복원 전 상태는 '복원 전 · 05:00'에 있습니다" · 포커스 h1 · 되돌리기 1건 |
| S6 이미지 | 통과 | 화면 `SnapshotImages.test.tsx` A→스냅샷→B 교체 = 캔버스 images [A,B] → 복원 = A. Red-Green 확인(참조 집합에서 스냅샷 빼면 실패) |
| S7 | 통과 | Ego: 내보내기 뒤 목록에 "자동 · 내보내기 전 · 14:00" |
| S8 청크 | 통과(경고) | 1절 |
| S9 | 통과 | 저장 먼저 → create · 실패면 create 0 |
| S10 | 통과 | `snapshotRevision.test.tsx` 실메모리: 복원(adopt) → 편집 → 저장 r0+4 → requestExport 잡 docRevision r0+4 · 내보내기 전 스냅샷 = 복원 뒤 편집 |
| 접근성 7절 | 통과 | 1차 테스트 + Ego 390 대화상자 1개 · 탭 전환 뒤 잠김 |

## 3. TDD

| 단계 | 예측 | RED | GREEN |
|---|---|---|---|
| D 가드 | 1(+대체 1) · 동작 가드 RED 아님 | 예측 일치 | `9a96a51` 19/19 |
| E Codex r1 | 3 RED | 3/3 `logs/red-e.txt` | `d9f92bb` (P1 테스트는 RED 뒤 테스트 쪽 실수 1건 수정 — RED 단언 그대로) |
| F 보완 | 2 · RED 아님 | 예측 일치 · S6 Red-Green 별도 확인 | `c12aad6` |

- 가드 대체(결정 2): `memoryExport.test.ts` 정적 가드 = 허용 목록 `components/studio/SnapshotDialog.tsx`만, 실제 호출 파일 목록과 **정확히 같아야** 함(목록 낡음 방지) + 동작 가드 "내보내기 1회 = 내보내기 전 스냅샷 1개 · 수동은 수 불변". 이유는 테스트 주석 2줄.
- Codex r1 반영: P1 복원 요청 중 "편집으로 돌아가기" `aria-disabled`+누름 무시+"복원하는 중입니다 · 끝나면 편집으로 돌아갑니다" · P2 `edit()`이 단계 ref를 동기로 dirty(스케줄러 change 규칙과 같음) · P2 캔버스 kitTokens = 보이는 문서(스냅샷) profileVersion.

## 4. 검증 (fresh)

- 전체 vitest `npx vitest run` → **exit 0 · 235 파일 · 2099 통과** (`logs/vitest-full-final.txt`)
- typecheck 0 · lint 0(경고 0) · build exit 0 `/studio 128.33`(`logs/build-e.txt` — 이후 변경은 테스트 파일뿐)
- Codex r2 `review --scope branch --base 45a5721` 실제 완료 `logs/codex-r2.txt`(라운드 2/2)

## 5. Ego Lite (build + `vite preview 127.0.0.1:4337`, 경로 A) — `shots/r1~r12`

- 시작 전 `listTaskSpaces()` = [] → 공간 85 생성 · 첫 goto 1회 뒤 앱 안 클릭만 · 새로고침 0
- 경로 A: 카탈로그 ref-e·ref-a 비교 추가 → "이 레퍼런스로 전부 선택: A" → 프로필 확정 v1 → 3안 → A안 → "A안으로 편집 시작" → 제목·설명 입력 → 게이트 통과
- 1280: 스냅샷 "통과 상태" 만들기(포커스 = 이름 입력, r2) → 제목 바꿈 → 미리보기(잠금·캡션, r3) → 복원(알림·h1, r4) → 다시 편집 "이 탭에 저장됨"(r5) → 정적 HTML 성공(r6) → 목록에 내보내기 전 자동(r7)
- 390: 대화상자 1개 · "390 수동" 만들기(r9) → 미리보기 → "편집" 탭 컨트롤 전부 `aria-disabled`(r10) → 복원(h1, r11) → 편집·저장 → 검사 탭 정적 HTML 성공(r12)
- 종료: `finish({keep:[]})` 직후 목록에 공간 85가 `ownership:user`로 1회 보였고, 2초 뒤 `listTaskSpaces()` = **[]** 재확인. 미리보기 서버 종료 · 4337 리슨 **0**

### 발견 (이 레인 밖 — 고치지 않음)
1. **스냅샷 이름 시각이 UTC**: `src/data/memoryDocBook.ts:93·96`이 ISO 문자열 `slice(11,16)`을 이름에 씀 → "복원 전 · 05:00"인데 같은 줄 캡션은 "14:00"(KST). data/** 수정 금지라 기록만(B-ER 후보, er-3a 몫).
2. 미리보기 중 툴바 "검사 · 내보내기"·"스냅샷"은 `aria-disabled`이지만 시각적으로 활성처럼 보임(r3) — 패널 버튼은 흐리게 보임. 시각 상태 맞추기는 다음 레인.

## 6. 미반영 — Codex r2 (턴 상한 55 규칙으로 새 수정 중단)

- **P1** 이미지 변환 진행 중 미리보기를 열면 `useImagePick`이 시작 당시 `save.edit`을 쥐고 있어 변환 완료 시 미리보기 중에도 문서·이미지가 바뀌고 자동 저장됨(복원과 겹치면 덮어씀) → 렌더마다 콜백 교체가 아니라 최신 잠금 상태를 보는 편집 경계(ref) + 진행 중 이미지 작업 반영 차단.
- **P2** `SnapshotLayer.tsx:40` 미리보기 진입 시 `flushed()` 결과 무시 → false면 미리보기 열지 말고 대화상자에 저장 실패 문장.
- **P2** `SnapshotPreview.tsx:99-102` 복원 성공 뒤 `listSnapshots()` 실패를 복원 실패로 표시 → 이름 조회는 보조로(실패해도 onRestored · 되돌리기 등록).
- 세 건 모두 이 diff가 만든 코드 → 다음 레인 1순위(TDD 3건 + 번들 재측정, 진입 여유 0.10KB 주의).

## 7. 쓰기 범위 · SPEC 차이

- PLAN 목록 밖: `features/studio/images/store/types.ts`(튜플 4번째) · 신규 `useSnapshots.tsx`·`SnapshotLayer.tsx`·`SnapshotLayerLoader.tsx` · 테스트 `SnapshotImages.test.tsx`·`snapshotRevision.test.tsx`·`memoryExport.test.ts`(결정 2)
- SPEC 차이: "스냅샷" 버튼을 모든 폭 툴바에 둠(SPEC <1280 "더보기" — ER-4 "더보기" 도입 때 이동)

## 8. 마감 수정(3차) — DECISION-FIX3 1~5

### 결과
| 항목 | 상태 | 근거 |
|---|---|---|
| 4 스냅샷 이름 로컬 시각 | **커밋 `f4a0eb5`** | `memoryDocBook.ts` 내부 `hhmm`(getHours·getMinutes) — 시그니처·인터페이스 변경 0 · 테스트 TZ=Asia/Seoul 고정(09:00Z → 18:00) · RED 2/2 → GREEN, 예측 밖 '충돌 보존' 기대 1건도 같은 이유로 갱신 |
| 1 P1 변환 중 미리보기·복원 | GREEN · **미커밋** | `useSnapshots` 편집 경계 = 미리보기 열고 닫을 때마다 새 구간(useMemo) + 최신 구간 ref · 거절 시 false → `ImageSlotField`는 이미지 맵도 안 바꾸고 상태 문장 "스냅샷을 보는 동안 준비된 이미지는 넣지 않았습니다 · 다시 골라 주세요" |
| 2 P2 미리보기 진입 저장 실패 | GREEN · **미커밋** | `SnapshotDialog`가 flushed 성공 뒤에만 `onPreview` · 실패 = "저장하지 못해 미리보기를 열지 않았습니다"(alert) |
| 3 P2 복원 뒤 목록 실패 | GREEN · **미커밋** | 이름 조회 실패 = undefined → 알림 "…복원 전 상태는 스냅샷 목록에 있습니다" · onRestored·되돌리기 그대로 |
| 5 툴바 비활성 시각 | GREEN · **미커밋** | 툴바 두 버튼에 `aria-disabled:` 짝 클래스(primary = bg-fill-strong·text-label-disable · outline = text-label-disable·border-line-alternative) |

- TDD: RED 5/5(`logs/red-fix3.txt`, 예측 일치) → GREEN 19/19(`logs/green-fix3.txt`) · typecheck·lint 0
- 번들: 작업 트리 build exit 1 **128.45 > 128.43**(`logs/build-fix3.txt`) → 브리프 규칙대로 감량 시도 없이 멈춤 · 1·2·3·5를 `wip-fix3.patch`(306줄)로 보존 후 되돌림 · HEAD build exit 0 **128.32**(`logs/build-fix3-head.txt`, 항목 4 증가 −0.01)
- 전체 vitest(HEAD) exit 0 · 235 파일 / 2099 테스트(`logs/vitest-fix3.txt`)
- Codex r3 `review --scope branch --base 45a5721` 1회 완료(`logs/codex-r3.txt`): r2와 같은 P1 1·P2 2(미커밋이라 tip에 그대로) · 새 지적 0 · f4a0eb5 지적 0. Codex 쪽 테스트 실행은 읽기 전용 EPERM으로 못 함(자체 보고)
- Ego Lite: **BLOCKED** — 확인 대상 1·5가 커밋 코드에 없어 미실행(캡처 0). `listTaskSpaces()` = [] · 4337 리슨 0 확인. 자기 서버 0
- 서브에이전트 0 · 엔진·계약·docs·scripts·lock 수정 0 · data는 memoryDocBook 포맷만 · push/merge/삭제 0

### 다음 결정용(적용하지 않음)
1. 감량 1순위 — 항목 5의 새 aria-disabled 변형 규칙(`bg-fill-strong`·`hover:bg-fill-strong`·`active:scale-100`·`border-line-alternative`)은 코드베이스에 없던 규칙. 기존 패턴(`aria-disabled:cursor-not-allowed aria-disabled:text-label-disable`)만 쓰면 줄어들 가능성(추정 · 미측정)
2. 감량 2순위 — 진입 청크에 든 편집 경계 코드(`useSnapshots`의 useRef·useLayoutEffect·span, `StudioLayout`의 `LOCKED_PRIMARY`). 경계 판정을 조작 뒤 청크로 옮길 수 있는지
3. 주의 — patch의 `useSnapshots.edit`는 렌더마다 새 함수(이전엔 안정 `save.edit`). `useSectionOps` 등 의존성 재실행 여부 확인 필요
4. 복구: `git apply dev/active/er-3b/wip-fix3.patch` → 감량 → build ≤128.43 → 커밋

## 9. 마감 수정(4차) — REPORT 8절 "다음 결정용" 1~4

### 결과
| 항목 | 상태 | 근거 |
|---|---|---|
| 복구 | 완료 | `git apply wip-fix3.patch` |
| 결정 1 툴바 비활성 단순화 | **커밋 `cba9f28`** | 새 상수 `LOCKED_PRIMARY`·`LOCKED_OUTLINE` 제거. 스냅샷(outline) = `aria-disabled:cursor-not-allowed aria-disabled:text-label-disable`(SectionOpControls·AddSectionButton 패턴) · 검사(primary) = `CandidatesSection` DISABLED와 같은 4개 클래스(파란 면 위 회색 글자 방지) |
| 결정 2 경계 판정 이동 | 하지 않음 | 결정 1만으로 128.42 ≤ 128.43 — 필요 없음 |
| 결정 3 `useSnapshots.edit` 안정성 | **커밋 `cba9f28`** | 확인: `useSectionOps.run`·`undoLast`(useCallback deps `edit`)와 StudioLayout의 move·remove·swap·undo 콜백이 렌더마다 재생성(effect 재실행은 없음). `useCallback([span, save.edit])`로 고정 — 미리보기 열고 닫을 때만 새 함수. 새 테스트 `useSnapshots.test.tsx` RED(`logs/red-fix4.txt`, toBe 실패) → GREEN |
| 항목 1·2·3·5 | **커밋 `cba9f28`** | RED는 3차 `logs/red-fix3.txt` 재사용 · 단언 약화 0 · 대상 3파일 GREEN 20/20(`logs/green-fix4.txt`) |

- 번들: 시도 1(클래스 최소) 128.40(`logs/build-fix4-try1.txt`) → 시도 2(primary에 bg 2개 추가) **128.42**(`logs/build-fix4-try2.txt`, 예산 검사 통과 · exit 0). 감량 시도 2/3회
- 게이트: typecheck 0 · lint 0 · build exit 0 · 전체 vitest exit 0 **236 파일 / 2105 테스트**(`logs/vitest-fix4.txt`)
- Codex r4 `review --scope branch --base 45a5721` 1회 완료(`logs/codex-r4.txt`): **P1 0** · r2·r3의 P1·P2 3건은 더 이상 지적되지 않음. 새 P2 2건(미반영 — 아래)
- Ego Lite(build + `vite preview 127.0.0.1:4337`, 공간 86, 1280): 첫 goto 1회 뒤 앱 안 클릭만 · 새로고침 0. 경로 = 카탈로그 ref-e·ref-a 비교 → "전부 선택: B" → 프로필 v1 → 3안 → A안 편집 → 스냅샷 "변환 전" → Hero "이미지 고르기"(6000×6000 JPEG 1.2MB, `/tmp`) → 즉시 스냅샷 → 미리보기
  - 항목 5 **확인(계산 스타일)**: 미리보기 중 두 버튼 `aria-disabled=true` · 스냅샷 color `rgba(31,54,40,0.16)`·bg 흰색 · 검사 color 같은 값·bg `rgba(31,54,40,0.12)` · cursor not-allowed (열린 직후 첫 측정은 transition 중간값이라 원색이었음)
  - 항목 1 **재현 실패**: 변환이 미리보기 열기(약 3.1초) 전에 끝나 알림 "이미지를 넣었습니다"가 미리보기 전 정상 삽입 — 경계가 거절할 구간을 만들지 못함. 단위 테스트(SnapshotImages)로만 보증
  - 캡처 **0장**: `Page.captureScreenshot` CDP 타임아웃 반복(`bringToFront`·override 해제 후도 동일, 원인 미확인)
  - 종료: `finish({keep:[]})` → 2.5초 뒤 `listTaskSpaces()` = **[]** · 자기 preview 서버 종료 · 4337 리슨 **0**
- 서브에이전트 0 · 엔진·계약·docs·scripts·lock·data 수정 0 · push/merge/삭제 0

### 미반영 — Codex r4 P2 (턴 상한 35로 새 수정 중단)
1. `StudioLayout.tsx:95` — 편집 경계가 거절해도 `useSectionOps.run`이 `docRef`·실행 취소 스택·`last`를 이미 바꿈(구조 연산 진행 중 미리보기 → 다음 연산이 거절된 변경 포함 저장 가능). `edit`의 false를 `run`이 실패로 처리해야 함(features/studio 수정 필요)
2. `StudioLayout.tsx:371-373` — 내보내기 진행 중 이미지 교체·삭제 시 '내보내기 전' 스냅샷의 Blob이 보관 맵에서 pruning될 수 있음. 스냅샷 생성 응답 시점에 참조 집합 갱신 필요

### 다음 결정용
1. Codex r4 P2 2건 반영 여부(1번은 이번 P1 수정의 연장 — 우선 권고)
2. 항목 1 실브라우저 재현: 변환을 늦출 수단(더 큰 입력·CPU 스로틀 `Emulation.setCPUThrottlingRate`)으로 다시 확인할지
