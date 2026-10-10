# FIELD-UNDO-2 REPORT — 이미지 패널 편집 실행 취소 (B-ER-08 2/2 · FU-AC-13 · MQ-F3 A)

- 브랜치 `k002bill2/field-undo-2` · base `09c2623` · 커밋 `096a32d`(P0) · `a4766b5`(구현) · `f4b95da`(Codex r1 P2) · 이 REPORT 커밋
- 정본: `docs/design/field-undo/SPEC.md` 4.4 · 4.5 · 9.2 FU-AC-13 · `MQ.md` F3 A
- 미병합 · push 0

## 0. 영환님 결정 1건 — 진입 +11B gzip

- **결과**: `/studio` 진입 실측 **129.56 → 129.57**(멈춤 규칙 "> 129.57"에는 걸리지 않음 · 판정선 129.65 안) · 복원 132.59 → **132.60**(≤132.60).
- 해시를 정규화한 실제 코드 증가 = **`StudioLayout` 청크 +11B gzip**(18,746 → 18,757B). 브리프 "진입 증가 0"과 다름.
  - 섹션 이름 전달 `name={sectionName(section)}`(EditFields → 패널) ≈ 8B — SPEC 4.5 라벨 "{섹션 이름} 이미지 고르기"에 필요하고, SPEC 8.2가 "라벨 문자열은 진입 쪽에서 만들어 넘긴다"고 정함.
  - `field()`의 거절 반환 `return false` ≈ 3B — 없으면 미리보기 중 고르기가 거절을 몰라 이미지를 보관소에 넣는다. 실측: 빼면 기존 `SnapshotImages.test.tsx` 2건("변환 중 미리보기 → 완료 = 문서·이미지 그대로 + 상태 문장" · "변환 중 미리보기 → 복원 → 늦은 완료 = 복원 결과 유지")이 깨진다.
- 0으로 만드는 대안(실측): 이름 계산을 한 번으로 끌어올림 = +2B(더 큼) · 패널이 `selection`을 직접 import = 새 공유 청크 `selection` 371B 생김(더 큼) · `return false` 제거 = −3B지만 위 기존 동작 깨짐.
- **구현을 빼지 않은 이유**: 3B는 기존 동작 보호라 뺄 수 없고, 8B를 빼면 SPEC 4.5 라벨 형식에서 벗어난다. 멈춤선은 넘지 않았다.
- 선택지: ① +11B 승인(이 브랜치 그대로) · ② 라벨에서 섹션 이름 제거("이미지 고르기" 등 — −8B, SPEC 4.5 이탈, 3B는 남음).
- 주의: 원시 실측은 청크 파일명 해시 때문에 ±0.03 흔들린다 — 진입 소스가 같은 `a4766b5`와 `f4b95da`가 129.54 / 129.57로 나왔다(정규화 값은 둘 다 128.29). main 병합 뒤 실측은 다시 달라질 수 있다.

## 1. FU-AC-13 갈래별 결과

| 갈래 | 결과 | 근거(테스트) |
|---|---|---|
| 고르기 = 즉시 1건 | 통과 | `ImageUndo.test.tsx` "고르기 → 칸 밖 Ctrl+Z = 이미지 빠짐 + '실행 취소: Hero 이미지 고르기' · Shift+Ctrl+Z = 같은 이미지(id·render images)" |
| 바꾸기(A→B) 되돌림 = A 이미지 유지 | 통과 | 같은 파일 "바꾸기(A → B) → Ctrl+Z = 문서 A · A 이미지가 render images에 그대로" + `ImageSlotPanel.test.tsx` 새 it(같은 틱 두 슬롯 바꾸기 — Codex r1) |
| 지우기 = 1건 | 통과 | "지우기 → Ctrl+Z = 같은 이미지 id로 복원 + '실행 취소: Hero 이미지 지우기' · 한 번 더 = 고르기 취소" |
| 끄기/켜기 = 1건씩(묶이지 않음) | 통과 | "끄기 → 켜기 = 기록 2건 · Ctrl+Z = '… 켜기' 취소 · 한 번 더 = '… 끄기' 취소" · 훅 단위 "같은 키 클릭 2회(같은 틱 포함) = 2건" |
| 장식 = 1건 | 통과 | "장식 체크 → Ctrl+Z = 장식 해제 + '실행 취소: Hero 이미지 장식'" |
| 대체텍스트 = 필드 묶음 | 통과 | "대체텍스트 2회 입력 + blur = 기록 1건 '실행 취소: Hero 대체텍스트 편집' · 텍스트만 원복(이미지 그대로)" · 키 = `image-{instanceId}-{slot}-alt` · `isComposing` 전달(4.6) |
| 변환 거절(TOO_LARGE) = 기록 0 | 통과 | "변환 거절(TOO_LARGE) = 기록 0 — Ctrl+Z 1회가 앞의 고르기를 되돌린다" (한도 초과도 같은 `fail` 경로 — 편집 전 종료) |
| 미리보기 중 거절 = 기록 0 | 통과 | 훅 단위 "편집 경계 거절(미리보기 중) = false 반환 · 기록 0 · 문서 그대로" + 기존 `SnapshotImages.test.tsx` PAUSED 2건(변경 0). 컴포넌트 단위 전용 it은 없음 |
| 묶음 열린 채 이미지 조작 = 앞 묶음 닫힘 후 1건 | 통과 | "글자 묶음이 열린 채 스위치 끄기 = 앞 묶음 닫힘 후 1건 — Ctrl+Z = 끄기만 · 한 번 더 = 제목" · 훅 단위 "클릭 뒤 같은 틱 글자 입력 = 클릭 1건 + 글자 묶음" (field-undo-1 REPORT 6절 4 해소) |
| 이미지만 조작한 세션 단축키 | 통과 | 위 it들이 모두 입력 없이 칸 밖 Ctrl+Z로 동작(리스너 = 첫 `field` 뒤) |
| 알림 문구 | 새 문장 0 | "실행 취소: / 다시 실행: {라벨}" 기존 형식 · 라벨 = SPEC 4.5 |

- RED: 구현 전 새 테스트 15건 실패 확인(새 8 · 훅 2 · `StudioLayoutImages` 바꾼 it 1 + 새 it 1 + 패널 prop 변경으로 기존 3 — 진입 배선을 먼저 바꾼 상태) → GREEN. Codex r1 테스트도 RED(이전 이미지 1개 빠짐) → GREEN.

## 2. 변경 파일

- 진입: `components/studio/EditFields.tsx`(패널에 `onEdit={typed}` · `name={sectionName(section)}` · `onField` 타입) · `features/studio/useSectionOps.ts`(`field` 4번째 인자 타입 `FieldMode` · 거절 `return false`)
- 조작 뒤 청크 docEngine: `features/studio/opAfter.ts`(`FieldMode` · `fieldTyped`의 `"click"` = 앞 묶음 닫고 즉시 1건 · 청크 응답 전 뒤따른 입력은 다음 호출이 이어 받게 남김)
- 이미지 패널 청크: `components/studio/ImageSlotField.tsx`(`FieldEdit` 타입 · 클릭 5종 라벨 · 대체텍스트 묶음 · 바꾸기 때 지금 문서를 넣기 전 정리·한도 참조에 포함) · `ImageSlotPanel.tsx`(`name` · `remember`가 바뀌기 전 문서를 `latest.snapshots`에 쌓음 — Codex r1)
- 테스트: 새 `components/studio/ImageUndo.test.tsx`(8) · `features/studio/useSectionOps.field.test.tsx` +4 · `StudioLayoutImages.test.tsx`(1 변경 + 1 새) · `ImageSlotPanel.test.tsx`(하네스 시그니처 + 새 it 1)
- 문서: `docs/06-handoff/BACKLOG.md` B-ER-08 행 끝 · 이 폴더 PROGRESS · REPORT · `qb.mjs` · `logs/` · `shots/`

### 기존 단언 변경 (SPEC 6절 표 밖 1건 — 규칙 이동)

- `StudioLayoutImages.test.tsx` "이미지 지우기 → 참조 밖이 된 이미지가 캔버스 images에서 빠진다" → "이미지 지우기 → 기록(지우기 전 문서)이 쥐는 동안 캔버스 images에 남는다 · Ctrl+Z = 같은 이미지 id". 사유: MQ-F3 A로 지우기가 기록이 되면 SPEC 4.4("이미지 삭제·교체 뒤 이전 이미지는 기록이 쥐므로 남는다")가 적용된다. 약화가 아니라 더 강한 단언(유지 + 되돌림 복원)이고, 무효화 단언은 SPEC 6절 표의 MQ-F3 A 새 it("고르기 → Ctrl+Z → 필드 입력(다시 실행 잘림) → images `[]`")으로 옮겼다.
- `ImageSlotPanel.test.tsx`: 하네스 `onEdit`를 `(key, label, next)` 시그니처로, `name="Hero"` 추가 — 단언 변경 0.
- 동작 변화(의도): 바꾸기 때 이전 이미지가 넣기 전 정리·한도 계산에서 "쥔 이미지"로 센다(실행 취소로 돌아갈 수 있으므로).

## 3. 검증 (fresh · HEAD `f4b95da` 코드)

- `npm ci` exit 0 · `package.json`/`package-lock.json` base 대비 변경 0
- `npm run typecheck` 0 · `npm run lint` 0 · `npm run build` 0(번들 검사 포함)
- `npx vitest run` — Test Files 300 passed · **Tests 2703 passed** · `npx vitest run src/test` — 11 files · 78 passed

## 4. 예산 (ADR-004 개정 14 · 기준선 파일 변경 0)

| 항목 | base `09c2623` | HEAD | 한도·규칙 |
|---|---|---|---|
| `/studio` 진입(원시) | 129.56 | **129.57** | 멈춤 > 129.57 · 판정 129.65 |
| 복원 진입(원시) | 132.59 | **132.60** | ≤ 132.60 |
| `/profile` 첫 화면 / 자동 로드 | 99.90 / 120.00 | 99.90 / 120.01 | 변화 0 목표 — 정규화 99.41 / 119.00 그대로(0) |
| `/studio` 해시 정규화 | 128.28 | 128.29 | 청크별: StudioLayout +11B · docEngine +39B · ImageSlotPanel +140B |
| docEngine 조작 뒤 | +3.79 | +3.83 | 판정 밖 |
| ImageSlotPanel 조작 뒤 | +4.71 | +4.88 | 판정 밖 |

- 정규화 방법: 빌드 산출물의 `-[8자 해시].js/.css` 참조를 고정 문자열로 바꾼 사본에 같은 `check-bundle-size.mjs`를 돌림(`/tmp` 사본, 저장소 변경 0).

## 5. Codex (`codex-companion review --scope branch --base 09c2623`)

- r1(`logs/codex-r1.txt`): **P2 1건 — 반영 `f4b95da`**. 같은 틱에 두 슬롯 바꾸기가 끝나면 두 번째 결과의 넣기 전 정리가 첫 바꾸기 이전 문서를 몰라 첫 슬롯의 원래 Blob을 지움 → 실행 취소해도 이미지가 안 보임. 수정: `remember`가 바뀌기 전 문서를 `latest.snapshots` 앞에 쌓음(다음 렌더에서 실제 기록 참조로 대체). RED → GREEN.
- r2(`logs/codex-r2.txt`): **지적 0건**. Codex 쪽 테스트 실행은 읽기 전용 환경 EPERM으로 막힘 — 테스트 근거는 3절 자체 실행.

## 6. Ego Lite (preview 127.0.0.1:4357 · `qb.mjs`)

- 경로: field-undo-1 `qb-flow.mjs`와 같은 앱 안 클릭(카탈로그 → 비교 → 프로필 확정 → 3안 → B안 편집). **B안 Hero에는 이미지 슬롯이 없어**(섹션별 실측: portfolio-1만 "이미지 편집 (3)") Portfolio 첫 슬롯 "사례 이미지 1"에서 확인. 이미지 = python3로 만든 640×360 단색 PNG(1,212B, 외부 이미지 0).

| 단계(1280) | 결과 |
|---|---|
| 고르기 | 미리보기 1 · "640 × 360 · WebP 1KB" |
| 줄 클릭 → Ctrl+Z | 알림 "실행 취소: Portfolio 이미지 고르기" · 미리보기 0(이미지 빠짐) |
| Shift+Ctrl+Z | 알림 "다시 실행: Portfolio 이미지 고르기" · 미리보기 1 · 메타 같음(같은 이미지 — id 동일성은 컴포넌트 테스트가 단언) |
| 대체텍스트 "청록 단색 테스트 이미지" → 줄 클릭 → Ctrl+Z | 알림 "실행 취소: Portfolio 대체텍스트 편집" · 대체텍스트 "" 원복 · 이미지 그대로 |

- 캡처(뷰포트 clip 1280×900, PNG 시그니처 확인): `shots/fu2-undo-pick-1280.png` **122,864B** · `shots/fu2-undo-alt-1280.png` **129,006B**
- 정리: IDB `deleteDatabase("design-studio")` = deleted(공간 10) · `finish({keep:[]})` · `listTaskSpaces()` = `[]` · preview 종료 · 4357 LISTEN 0 · `/tmp/fu2-scratch` 삭제. 영환님 창·main 5480 무접촉(5480은 리슨 여부만 조회).

## 7. 브리프·SPEC과 다르게 한 것

1. **진입 +11B**(0절) — 브리프 "진입 증가 0 · 불가피하면 그 항목 구현 안 함"과 다름. 3B는 기존 동작 보호, 8B는 SPEC 4.5·8.2 — 영환님 결정 대기.
2. 클릭 표시를 새 함수 대신 `field`의 4번째 인자(`"click"`)로 실음 — 진입 런타임 바이트 0(타입만 넓힘).
3. 라벨 "{섹션} 이미지 장식"은 체크·해제 모두 같은 이름(SPEC 4.5 그대로).

## 8. 남은 것

- **영환님**: 0절 +11B 승인 여부.
- 이전 레인에서 넘어온 것(이 레인 범위 밖): FU-QB-3 실제 한글 IME 수동 1회 · field-undo-1 Codex r2 P2-1(청크 로딩 전 blur — 진입 예산 결정).
- 대체텍스트 IME 확인도 FU-QB-3과 같은 수동 확인 대상(조합 플래그는 글자 칸과 같은 경로).
