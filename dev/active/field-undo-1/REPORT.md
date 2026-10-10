# FIELD-UNDO-1 REPORT — B-ER-08 필드 편집 묶음 실행 취소 (1/2 — 필드)

- 브랜치 `k002bill2/field-undo-1` · base `b3f8894` · 구현 커밋 `67026a5`
- 정본: `docs/design/field-undo/SPEC.md` r0 · `MQ.md` 결정(F0 A · F1 A · F2 A · F4 A)
- 범위: FU-AC-1~12 · 14~16 · FU-QB-1·2. FU-AC-13(이미지 패널 기록)은 FIELD-UNDO-2 — 손대지 않음.

## 1. 수용 기준별 결과

| ID | 결과 | 근거(테스트) |
|---|---|---|
| FU-AC-1 | 통과 | `useSectionOps.field.test.tsx` "같은 칸 10자 … 599ms = 0 · 600ms = 1건"(가짜 타이머) · blur = `FieldUndo.test.tsx` 첫 it |
| FU-AC-2 | 통과 | 다른 칸(blur 없음) · 섹션 바꿈(재마운트) — `FieldUndo.test.tsx` "묶음 닫힘 계기" 2건 + 훅 단위 1건. 탭 전환 언마운트는 step/run 앞 닫기·600ms 타이머로 닫힘(별도 테스트 없음 — 아래 4절) |
| FU-AC-3 | 통과 | "묶음 열린 채 섹션 삭제 = 필드 → 연산 순서 · Ctrl+Z 1회 = 삭제만 · 2회 = 글자" |
| FU-AC-4 | 통과 | "쳤다 지워 원래 값 = 기록 0 · 문서는 입력 전 문서 그대로(사슬 유지)" |
| FU-AC-5 | 통과 | "실행 취소: Hero 제목 편집" · "다시 실행: …" · "실행 취소: 페이지 정보 설명 편집" |
| FU-AC-6 | 통과 | 입력만 한 세션 칸 밖 Ctrl+Z 동작 · 칸 안 Ctrl+Z `fireEvent` 반환 true(defaultPrevented false) |
| FU-AC-7 | 통과 | "실행 취소 뒤 필드 입력 = 다시 실행 목록 버림"(peekStep(true) undefined = "더보기" 다시 실행 비활성 조건) |
| FU-AC-8 | 통과 | `StudioLayoutImages.test.tsx` 바꾼 it — 600ms 전·닫힌 뒤 images 1 · Ctrl+Z 2회 = About + 같은 이미지 id. 훅 단위 held 1건 |
| FU-AC-9 | 통과 | `undoStack.test.ts` 새 it 2건(다시 실행 잘림 · 51번째 push) + `StudioLayoutImages.test.tsx` 상한 50 밀려남 컴포넌트 1건. 충돌 "최신" 컴포넌트 케이스는 기존 사슬 규칙 그대로(새 테스트 없음) |
| FU-AC-10 | 통과 | 미리보기 열기 뒤 돌아와 Ctrl+Z = 그 필드 기록 · 미리보기 중 단축키 무시(true) · 편집 경계 거절 = 기록 0(훅 단위) |
| FU-AC-11 | 통과 | 조합 중 600ms 닫지 않음 · 조합 끝 600ms 닫음 · 조합 중 blur 닫음(훅 단위) |
| FU-AC-12 | 통과 | 저장 거절 `READ_ONLY_TAB`에서 기록·실행 취소 동작 · saved 0. 잠금 요청 경로 변경 0 |
| FU-AC-14 | 통과(경계값) | 4절 예산 표 |
| FU-AC-15 | 통과 | 6절 단언 2건만 변경(아래) · 그 밖 기존 단언 변경 0 · 게이트 4종 |
| FU-AC-16 | 통과 | `role=status` 수 불변 · 묶음 닫힘 알림 0(blur 직후 알림 빈 문자열) · 실행 취소 알림 1문장 |
| FU-QB-1 | 통과(RESUME-1) | 1차 BLOCKED → RESUME-1에서 3폭 통과 — 8절 |
| FU-QB-2 | 통과(RESUME-1) | 1차 BLOCKED → RESUME-1에서 통과 — 8절 |
| FU-QB-3 | 범위 밖 | 실제 한글 IME — **영환님 수동 1회 필요** |

## 2. 변경 파일

- 진입: `features/studio/useSectionOps.ts`(열린 묶음 ref · `field()` · 같은 틱 docRef · `held`에 묶음 시작 문서(상태) · run/step 앞 닫기) · `components/studio/EditFields.tsx`(키·라벨 "{섹션} {라벨} 편집" · `onField`) · `PageInfoFields.tsx`(라벨 전달) · `FieldEditor.tsx`(`nativeEvent.isComposing` 전달) · `StudioLayout.tsx`(`onField={ops.field}` 1줄)
- 조작 뒤 청크: `features/studio/opAfter.ts`(`closeField` · `fieldTyped` — 600ms 타이머 · IME · 내용 같으면 기록 0 + 시작 문서 참조 복귀 · 묶음 첫 입력에 1회 focusout 리스너) · `docEngine.ts`(재수출)
- 주석: `undoStack.ts:27-28` · `opAfter.ts` stepHistory 주석 · `useSectionOps.ts:19` — 필드 글자 예시를 "충돌 해결 '최신' 등"으로
- 테스트: 새 `features/studio/useSectionOps.field.test.tsx`(7) · 새 `components/studio/FieldUndo.test.tsx`(7) · `undoStack.test.ts` +2 · `StudioLayoutImages.test.tsx`(1 변경 +1) · `UndoKeys.test.tsx`(1 변경)

### SPEC 6절 단언 변경 (그 밖 0)

- `StudioLayoutImages.test.tsx` it 제목·끝 단언 → "삭제 → 필드 입력 = 유지(Ctrl+Z 2번으로 닿음)" · images 1 · Ctrl+Z 2회 = About + 같은 id. 무효화 단언은 상한 50 밀려남 it으로 이동.
- `UndoKeys.test.tsx` it 제목·단언 → 필드 묶음 1건만 되돌림(값 원래대로 · 삭제 유지) · 알림 "실행 취소: FAQ 섹션 제목 편집"(삭제 뒤 선택 = FAQ) · 한 번 더 = Services 복원.

## 3. 검증 (fresh 실행)

- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0(번들 검사 포함)
- `npx vitest run` — Test Files 299 passed · Tests 2678 passed(exit 0)
- RED: 구현 전 새 테스트 14건 모두 실패 확인(`ops.field is not a function` · Ctrl+Z 미동작) → GREEN 14/14. 기존 단언 2건은 구현 후 예상대로 실패 → SPEC 6절 문장으로 변경 후 통과.
- Codex `review --scope branch --base b3f8894` — 5절

## 4. 예산 실측 (ADR-004 개정 14)

| 진입 | base | 1차 | MQ-F4 A 이동 후(최종) | 한도 |
|---|---|---|---|---|
| `/studio` | 129.28 | 129.59(+0.31 초과) | **129.55(+0.27)** | ≤129.55 |
| 복원 진입 | 132.31 | 132.63 | **132.58(+0.27)** | ≤132.58 |
| `/profile` | 99.87 | 99.88 | 99.86 | ±0.03 |
| docEngine 조작 뒤 | +3.44 | +3.66 | +3.67 | 판정 밖 |

- 1차 초과 → MQ-F4 A 1회: 미리보기 열기·충돌 해결 앞 명시 닫기와 HistoryKeys `close` 제거(포커스가 떠나면 청크의 focusout 1회 리스너가 닫음) · undoLast 앞 닫기 제거(묶음 뒤엔 canUndoLast가 이미 false) · `close` 공개 제거. 그 뒤 lint(`react-hooks/refs`) 때문에 held를 ref 읽기 → 상태로 바꿔 +0.03 → 최종 129.55 = **배분선과 같음(여유 0.00)**. 기준선 파일·판정 로직 변경 0.
- 주의: 다음 `/studio` 진입 변경은 여유 0.10(잡음 흡수분, 배분 금지)만 남는다.

## 5. Codex

- r1(`logs/codex-r1.txt`): **P2 4건 — 미반영(시간 예산 90분 소진 · 진입 여유 0.00이라 진입을 늘리는 수정은 MQ-F4/ADR 판단 필요)**. r2 미실행.
  1. 청크 로딩 중 다른 칸 이동 = 두 칸이 한 기록으로 합쳐짐(6절 3과 같은 것) — 수정안: 로딩 전 키 변경·blur를 큐에 보존해 청크 준비 뒤 순서대로 처리.
  2. IME 확정 값이 마지막 조합 값과 같으면 onChange가 다시 안 와 `composing=true`가 남아 600ms 타이머가 안 걸림(blur·다른 칸·다른 기록으로만 닫힘) — 수정안: `compositionend`에서 타이머 재개(청크 리스너로 두면 진입 0).
  3. 묶음 열린 채 기록 밖 문서 교체(충돌 "최신") 뒤 같은 칸 입력 = 교체 전 base 재사용 → 실행 취소가 다른 탭 변경을 덮음 — **데이터 덮어쓰기 위험, 다음 레인 최우선**. 수정안: `docRef.current !== open.after`면 새 묶음 시작 + 충돌 해결 시작 때 닫기 복원.
  4. 타이머로 닫힌 묶음의 focusout `once` 리스너가 남아 포커스를 유지하는 동안 누적(메모리) · 언마운트 정리 없음 — 수정안: 제거 함수를 묶음에 보관해 closeField·언마운트에서 해제.

## 6. SPEC과 다르게 한 것

1. **blur = 문서 focusout 1회 리스너(청크)** — FieldEditor `onBlur` 대신. 진입 증가를 줄이려고(MQ-F4 A). 칸에서 포커스가 떠나는 모든 경우(섹션 목록·"더보기"·스냅샷·충돌 버튼)가 같은 닫힘을 낸다.
2. **미리보기 열기·충돌 해결 시작 앞 명시 닫기 없음** — 버튼을 누르면 칸 focusout으로 이미 닫히고, 남은 경우도 600ms 타이머·step/run 앞 닫기가 닫는다. 충돌 "최신"으로 문서가 바뀐 뒤 닫히면 기록은 남지만 사슬이 끊겨 닿지 않고(4.4-3), 내용 같음 복귀도 "지금 문서 = 묶음 마지막 문서"일 때만 해서 바뀐 문서를 덮지 않는다.
3. **청크가 아직 안 왔을 때 다른 칸 입력** — 앞 묶음을 닫을 청크가 없으면 두 칸이 한 묶음(첫 칸 이름)으로 합쳐진다. 첫 입력이 청크를 부르므로 실사용에서 거의 없음(L3).
4. **이미지 패널 편집은 여전히 기록 밖**(FIELD-UNDO-2 범위). 묶음이 열린 채 이미지 패널을 바꾸면 그 변경은 묶음 닫힘의 "마지막 입력 문서" 밖이라 사슬이 끊길 수 있다 — 다음 레인이 같은 `field()` 경로로 붙이면 사라진다.

## 7. 정리 · 남은 것

- Ego: TaskSpace 7 `finish({keep:[]})` · IDB `deleteDatabase("design-studio")` · `listTaskSpaces()` = `[]` · preview 서버 종료 · 4355 리슨 0. 영환님 창·main·다른 레인 무접촉.
- **남은 것**: Codex r1 P2 4건(5절 — 특히 3번) · FU-QB-1·2 Ego 재시도(흐름: /profile "3안 만들기" 셀렉터 보정 필요) · FU-QB-3 영환님 수동 IME 1회 · FIELD-UNDO-2(FU-AC-13).

## 8. RESUME-1 (2026-10-11 · 같은 브랜치 이어서)

커밋: `b04c9df`(r1 P2 4건) · `fd37453`(PROGRESS) · `645be5f`(r2 P2 1건 + `logs/codex-r2.txt`) · 이 REPORT 커밋.

### 8.1 Codex r1 P2 4건

| 항목 | 결과 | 근거 |
|---|---|---|
| P2-3 기록 밖 교체 뒤 묶음 재사용 | **반영** | 청크 `fieldTyped`가 이 입력의 시작 문서 ≠ 앞 입력 문서(`seen`)면 앞 묶음을 `seen`까지로 닫고 새 묶음. `FieldUndo.test.tsx` "충돌 '다른 편집 불러오기' 뒤 같은 칸 입력 → Ctrl+Z = 불러온 문서" — RED("첫 편집"으로 덮음) → GREEN |
| P2-4 focusout 리스너 누적 | **반영** | 묶음에 `off()`(타이머·focusout·compositionend 해제) 보관 → `closeField`·언마운트가 부름. 훅 단위: 타이머로 닫힌 묶음 5회 뒤 리스너 0 · 열린 묶음 1 · 언마운트 0 — RED(5) → GREEN |
| P2-2 IME 확정 `composing` 고착 | **반영** | 청크가 묶음 첫 입력에 `compositionend` 문서 리스너 → 600ms 타이머 재개. 훅 단위: 조합 중 입력 + compositionend + 599ms = 0 · 600ms = 1건 — RED → GREEN |
| P2-1 청크 로딩 중 칸 이동 합쳐짐 | **반영(진입 0)** | 칸 바뀜 판정을 진입(`engine.current?.closeField`)에서 청크로 옮김 — 진입은 입력마다 `fieldTyped(rec, composing, key, label, base, next)`를 순서대로 큐에 넣기만. 훅 단위: 같은 틱 제목→부제 = 기록 2건 — RED(한 기록 "Hero 제목 편집") → GREEN |

- 4건 한 커밋: 넷 다 `fieldTyped` 시그니처·본문 한곳을 바꿔 따로 GREEN이 될 수 없음(amend·rebase 금지라 PROGRESS에 사유 기록).
- Codex 제안과 다르게 한 것: "충돌 해결 시작 때 명시 닫기 복원"은 하지 않음 — 진입 증가 0 원칙. 대신 다음 입력에서 교체를 판정하고, 교체 전 묶음이 (타이머·focusout으로) 닫혀 남는 기록은 `after`가 지금 문서와 달라 Ctrl+Z가 닿지 않음(덮어쓰기 0).

### 8.2 Codex r2 (`logs/codex-r2.txt`) — 반영 1회

1. [P2] 청크 로딩 전 blur 경계 유실(첫 입력 → 청크 받는 중 칸을 떠났다가 같은 칸 재입력 = 한 기록) — **미반영(진입 증가 필요)**. 청크 전에는 focusout 리스너가 없어 사건 자체를 못 본다. 고치려면 진입 `field()`에 청크 미로드 시 1회 focusout 표시(예: `document.addEventListener("focusout", () => open.current && (open.current.blurred = true), { once: true })` + 청크 판정 1줄)가 필요 — 추정 +0.03~0.05KB gzip. 진입 여유 0.01(129.54/129.55)이라 영환님 예산 결정 사항. 영향: 청크(+3.79KB) 받는 수십 ms 안에 떠났다 돌아와야 생김 — 결과는 "두 입력이 한 묶음"(데이터 손실 아님, L3).
2. [P2] 쳤다 지운 묶음(기록 0) 뒤 blur 없이 다른 칸 입력 = 다음 기록이 같은 내용 복제 문서에서 시작해 앞 기록과 사슬이 끊김 — **반영** `645be5f`. `closeField`가 "다음 기록이 이어 붙을 문서"(기록 0이면 시작 문서 참조)를 돌려주고, 분리 시 교체가 아니면 그 문서에서 새 묶음 시작. 훅 단위 RED(첫 Ctrl+Z 뒤 앞 기록에 못 닿음) → GREEN. r3 미실행(라운드 상한).

### 8.3 게이트 · 예산 (fresh, `645be5f` 코드)

- `npm run lint` exit 0 · `npm run build` exit 0(typecheck · 번들 검사 포함) · `npx vitest run` — Test Files 299 passed · **Tests 2683 passed** (exit 0)
- 예산: `/studio` 129.55 → **129.54**(한도 129.55) · 복원 132.58 → **132.57**(≤132.58) · `/profile` 첫 화면 99.87 · docEngine 조작 뒤 +3.67 → +3.79(판정 밖). 진입 증가 0(진입의 `engine` ref·`closeField` 호출 제거로 −0.01).

### 8.4 Ego FU-QB-1·2 (preview 4355)

- 1차 실패 원인: `qb.mjs`가 비교 보드에서 Hero A만 골라 프로필 확정 뒤 "3안 만들기"까지 못 감(추정) + `B안 선택`이 aria-label이라 textContent 대기가 놓침. RESUME-1 경로(앱 안 클릭만, 첫 goto 1회): 카탈로그 → 모던 카페 브랜드·프리미엄 헤어살롱 비교 추가 → 비교 보드 "이 레퍼런스로 전부 선택: B" → 프로필 확정 (v1) → 3안 만들기 (v1) → B안 선택 → B안으로 편집 시작(`qb-flow.mjs`). 경로 준비 7턴.
- **FU-QB-1 통과 3/3** (`qb1.mjs`): 제목 입력 → 섹션 목록 Hero 줄 실제 클릭(1024 = 접힌 "섹션 목록 · 순서" 요약 먼저 클릭 · 390 = "섹션" 탭) → "더보기" 메뉴 → Ctrl+Z.

| 폭 | 값 원복 | 알림 | "더보기" 항목 | 캡처(뷰포트 clip) |
|---|---|---|---|---|
| 1280 | 예 | 실행 취소: Hero 제목 편집 | 실행 취소: Hero 제목 편집 · 다시 실행(비활성) | `shots/qb1-1280.png` 150,997B |
| 1024 | 예 | 같음 | 같음 | `shots/qb1-1024.png` 111,378B |
| 390 | 예 | 같음 | 같음 | `shots/qb1-390.png` 57,868B |

- **FU-QB-2 통과** (`qb2.mjs`, 1280): Portfolio "사례 이미지 1"에 자체 이미지(이 레인 390 캡처 파일, 외부 이미지 아님) 넣음 → Portfolio 삭제 → Hero 제목 입력 → 줄 클릭 → Ctrl+Z 1회 = "실행 취소: Hero 제목 편집"(제목 원복) · 2회 = "실행 취소: Portfolio 삭제"(원래 자리 4번째) → 패널 이미지 로드(naturalWidth 390 = 넣은 파일 폭) · 캔버스에 같은 이미지 보임. 캡처 `shots/qb2-1280.png` 452,156B. blob URL은 패널 재마운트로 새로 만들어져 문자열이 다름(이미지 id 동일성은 컴포넌트 테스트 `StudioLayoutImages.test.tsx`가 단언).
- 캡처는 모두 PNG 시그니처 확인. 정리: IDB `deleteDatabase("design-studio")` = deleted(공간 8·9) · `finish({keep:[]})` · `listTaskSpaces()` = `[]` · preview 종료 · 4355 LISTEN 0 · 임시 파일 삭제. 영환님 창·main 5480·다른 레인 무접촉.

### 8.5 남은 것

- Codex r2 P2-1(청크 로딩 전 blur) — 진입 예산 결정 필요(8.2-1).
- compositionend 리스너는 문서 전체 — 조합 입력이 compositionend보다 늦게 오는 브라우저에서 타이머가 다시 지워질 수 있음(최악 = 다음 입력·blur까지 묶음 유지). 실제 IME 확인은 **FU-QB-3 — 영환님 수동 1회 필요**.
- FIELD-UNDO-2(FU-AC-13 이미지 패널 기록).
