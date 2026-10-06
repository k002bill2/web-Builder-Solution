# ER-4 REPORT — 실행 취소 (B-ER-04~06 완료 · U1~U5 판정선 멈춤)

- 레인: Developer · worktree er-4 · 브랜치 `k002bill2/er-4` · base `dd6b0f7`
- 결론: **①②③(B-ER-05·06·04) 완료·커밋. ④(U1·U2·U5)는 구현·테스트 통과했지만 `/studio` 진입 128.96 > 판정선 128.70 → 브리프 규칙대로 즉시 멈춤.** ④ 코드는 로컬 브랜치 `k002bill2/er-4-step4-wip`(fd3385a, push 0)에만 있고 er-4 tip에는 없다. ⑤⑥ 미착수.

## 1. 완료 (er-4 tip)

| # | 커밋 | 내용 | 테스트 |
|---|---|---|---|
| P0 | c5f3559 | BRIEF 명시 커밋 | — |
| ① B-ER-05 | 05bded2 | `commitOp`가 `edit()`를 먼저 부르고 `false`(미리보기 편집 경계 거절)면 `{ok:false, reason:"스냅샷을 보는 중에는 편집할 수 없습니다"}` — docRef·스택·last 불변. 이유 문장은 SnapshotPreview와 같고, 호출부는 엔진 거부와 같은 경로(`setNotice(outcome.reason)`)로 알린다 | pin 테스트 1건 기대 변경 |
| ② B-ER-06 | f7bea33 · e2301c4 | `requestExportOnce(…, onSnapshot)` — `repository.requestExport` 응답(스냅샷 커밋) 직후 콜백 → `useExportFlow({onSnapshot})` → StudioLayout `snaps.refresh`(스냅샷 목록 = 참조 집합 다시 읽기). 결과 뒤 refresh(기존)는 그대로 | exportFlow.test +1 |
| ③ B-ER-04 | e2301c4 · 70bae59 | 알림 줄 "되돌리기"가 문서 전체(테마) 대상이면 `goTo("studio-theme-swap", {tab:"sections"})` — 사라지는 버튼 대신 유지되는 "테마 바꾸기"로 포커스(<1024는 "섹션" 탭 먼저) | ThemeSwap.test +2(1280·390) |

### ① pin 테스트 의도 변경 (약화 아님)
`useSectionOps.pin.test.tsx` "edit 거절" 단언은 ER-OFF2에서 **당시 동작**(거절해도 ok · 스택에 쌓음 · docRef 이동)을 고정한 것이다. B-ER-05가 그 동작을 결함으로 판정했으므로 새 기대로 바꿨다. 새 단언이 더 엄격하다: `ok false + 이유 문장 정확 일치` · 스택 0 · `canUndoLast` false · 두 번째 연산도 원래 문서 기준(edit 인자가 첫 번째와 같음). 사유는 테스트 주석에도 적었다.

### ② 한계
- 단위 테스트(응답 직후 콜백 → 그다음 폴링 · 요청 거부면 0회)만 있다. StudioLayout에서 "내보내기 중 이미지 교체 → Blob 유지"를 끝까지 재현하는 통합 테스트는 없다.
- 메모리 저장소 `requestExport`는 스냅샷 커밋 직후 반환하고 잡은 따로 돈다(`memoryDocBook.ts:258-272`). 그래서 생성 중 교체 시간 창은 닫힌다. 남은 틈은 `listSnapshots` 비동기 응답까지의 짧은 구간(L3).

## 2. ④ 멈춤 — 실측과 원인

| 단계 | `/studio` 진입 직후 | 첫 화면 | 근거 |
|---|---|---|---|
| 기준 dd6b0f7 | 128.24 | 91.76 | logs/build-base.txt:154 |
| ①②③ | 128.28 (+0.04) | 91.76 | logs/build-1-3.txt:154 — 다른 화면 +0.01~0.02(±0.03 안) |
| ④ WIP | **128.96 (+0.68) > 128.70** | 91.76 | logs/build-4.txt:154·165 — build exit 1 |

- 늘어난 곳은 StudioLayout 청크 하나다. gzip 18.04 → 18.75(+0.71), raw 54.85 → 56.62KB(+1.77). docEngine(조작 뒤)은 +0.09이고 나머지 청크는 ±0.01이다. 공유 청크가 쪼개진 것이 아니라, 진입 청크에 넣은 코드가 그대로 늘었다(L1, 빌드 로그 대조).
- 진입 청크에 들어간 것:
  - `historyKeys.ts` 전체(키 판정·입력칸 판별)
  - `undoStack`의 peek·undo·redo·reachable
  - `useSectionOps`의 step·이름·held
  - StudioLayout의 리스너·알림 문장·라벨 문자열
- SPEC 8절은 "Ctrl/⌘+Z 리스너 + 필드 편집 기록 묶음" 추정을 +0.02~0.08로 잡았다. 실측은 그보다 약 8배 크다.
- 규칙("판정선 초과 시 즉시 멈춤 · 추가 빌드 시도 금지")에 따라 상쇄 빌드를 시도하지 않았다. 판정선 아래로 줄이는 수정도 측정할 수 없으므로 하지 않았다.
- ④ WIP의 상태: tsc 0 · lint 0 · vitest 239 파일 / 2121 통과(logs/vitest-4.txt).
  - 새 테스트: undoStack +2, historyKeys +2, UndoKeys +4.

### ④ WIP 설계 (다음 레인이 재사용할 수 있음)
- `undoStack`: redo 목록 추가. `push`가 redo를 비우고 `clear`는 양쪽을 비운다(U5). `reachable(doc)`는 지금 문서에서 실행 취소·다시 실행으로 닿는 문서만 돌려준다.
- `opAfter.stepHistory`(docEngine 청크): 지금 문서가 기록과 이어질 때만 동작한다(`top.after === docRef.current`). 그래야 스택 밖 변경(필드 글자)을 덮지 않는다. 편집 경계가 거절하면 스택을 그대로 둔다. 연산과 같은 promise 사슬로 하나씩 처리한다.
- 키: 입력칸 밖 Ctrl/⌘+Z, Shift+Ctrl/⌘+Z, Ctrl+Y.
  - 한글 자판에 대비해 `code`(KeyZ/KeyY)도 본다.
  - text input·textarea·select·contenteditable·열린 dialog 안·IME 조합 중·미리보기 중이면 무시한다(`preventDefault`도 하지 않음).
  - 라디오·체크박스는 단축키 대상이다(변형 교체 뒤 포커스가 라디오에 남음).
- 알림: "실행 취소: Services 삭제" / "다시 실행: …" 1문장(C1). 라벨은 호출부가 `sectionName`으로 만든다. 청크가 selection을 import하지 않는다.
- 포커스: 이동 없음. 포커스가 있던 줄이 사라지면 h2 "섹션"으로 간다(`tabIndex=-1` 추가).
- 상쇄 후보(L3, 미측정):
  - (a) `historyKeys`·`reachable`·라벨 계산을 docEngine 청크로 옮긴다. 진입에는 수식 키와 Z/Y 확인 + `preventDefault`만 남긴다. 단, 입력칸 판정은 동기여야 하므로 남는다.
  - (b) 알림 문장 조립을 청크로 옮긴다.
  - 상쇄 여부와 MQ-R3 중 무엇을 고를지는 Jarvis가 판정한다.

## 3. 미구현 · 차단

| 항목 | 상태 | 사유 |
|---|---|---|
| ④ U1·U2·U5 | WIP 브랜치에만 있음 | 판정선 초과 멈춤 |
| ⑤ U4 더보기(MoreMenu · <1280 스냅샷 이동) | 미착수 | ④ 멈춤 |
| ⑥ U3 필드 편집 묶음 | 미착수 | ④ 멈춤. **설계 충돌 메모(L3)**: 필드 편집을 기록에 넣으면 `StudioLayoutImages.test.tsx` "삭제 → (필드 입력으로) 되돌리기 무효화 → 이미지 빠짐" 단언이 깨질 수 있다. 필드 기록이 삭제 전 문서까지 닿는 경로를 만들기 때문이다. SPEC 6절 "단언 약화 금지"와 충돌하므로 SPEC 결정이 필요하다 |
| U1 "3.5 표 넣음 연산마다" | WIP에서도 부분 | 섹션 연산·테마만 기록된다. 필드·이미지·meta·스냅샷 복원·충돌 해결은 아직 스택 밖이다(⑥과 기록 경로가 필요). PASS 아님 |
| Ego Lite(1280·390) | BLOCKED | 판정선 멈춤 규칙 "추가 빌드 시도 금지". 현재 `dist/`는 ④ WIP 산출물이라 tip을 검증할 수 없다. 세션을 열지 않았다. 4337 리슨 0(`lsof` 빈 출력) |

대체 근거(Ego Lite와 동등하지 않음): B-ER-04 포커스를 jsdom에서 1280·390 두 폭으로 고정했다(ThemeSwap.test).

## 4. 검증

| 명령 | 결과 |
|---|---|
| `npx vitest --run`(①②③ tip 앱 코드) | 237 파일 / 2113 통과 — logs/vitest-1-3.txt |
| `npm run build`(①②③) | exit 0 · /studio 128.28 — logs/build-1-3.txt |
| `git diff --stat e2301c4 HEAD -- app/` | 빈 출력(그 뒤 70bae59는 테스트만 바꿈) → 위 빌드가 tip 앱 코드의 빌드다 |
| `npx vitest --run src/components/studio/ThemeSwap.test.tsx`(70bae59) | 12/12 통과 |
| `npx tsc --noEmit` · `npm run lint` | ④ WIP 상태에서 둘 다 0(①②③을 포함한 상위 집합) |
| RED 로그 | logs/red-1-3.txt(예측대로 3 fail) · logs/red-4.txt |

## 5. Codex
- r1 `review --scope branch --base dd6b0f7`(logs/codex-r1.txt): **지적 0** — "수정이 필요한 구체적인 결함을 발견하지 못했습니다". Codex 측 테스트 실행은 읽기 전용 샌드박스(Vite 임시 설정 파일 생성 거부)로 못 했다 — 테스트 근거는 4절의 이 레인 실행.
- r1 시점 tip = 29600bd(70bae59 테스트 추가 전). 70bae59는 테스트 1건을 `it.each([1280, 390])`로 넓힌 것뿐이라 r2는 돌리지 않았다(라운드 상한 ≤2 안에서 1회로 마감).
- ④ WIP 브랜치는 Codex 대상이 아니다(er-4 tip 밖).

## 6. 사용자·Jarvis 결정 필요
1. ④를 상쇄 후보 (a)(b)로 재시도할지, MQ-R3(예산 상향)로 갈지.
2. tip 검증 빌드 1회 + Ego Lite 승인 여부. 판정선 멈춤 규칙 때문에 이 레인에서는 하지 않았다.
3. ⑥ 필드 묶음과 StudioLayoutImages "되돌리기 무효화" 단언의 충돌을 SPEC에서 정리.
4. 로컬 브랜치 `k002bill2/er-4-step4-wip` 보존·정리 여부(삭제하지 않음).
