# ER-4b REPORT — ④ 키보드 실행 취소·다시 실행 진입 상쇄

## 1. 결론
- ④ 상쇄 완료: `/studio` 진입 직후 **128.96 → 128.56KB**(판정선 128.70 이하, build exit 0). 커밋 `eb988e2`.
- ⑤ U4 "더보기": **시도 안 함**. 조건은 ≤128.55인데 128.56이라 0.01 넘음. → **B-ER-09**.
- **열린 결함 1건 (Codex r1 P2, 수정 안 함)**:
  - 증상: 섹션 연산 → 스냅샷 미리보기 진입 → 편집 복귀. 그 뒤로 단축키 실행 취소·다시 실행이 계속 무시된다.
  - 원인: `useSectionOps`가 리스너를 첫 연산 뒤 한 번만 붙이면서 그때의 `step`(→ 그때의 `edit`)을 잡는다. `useSnapshots`는 미리보기 구간이 바뀔 때 `edit`을 교체하고, 이전 콜백은 영구히 false를 돌려준다.
  - 수정하지 않은 사유: 40턴 규칙("도달 시 새 수정 중단")에 이미 걸려 있었다.
  - 다음 레인 수정안(L3, 진입 바이트 소량 증가):
    1. `HistoryKeys` 맥락에 `step`을 넣는다.
    2. StudioLayout의 맥락 effect가 `ops.step`을 넣어 갱신하게 한다.
    3. `listenHistory`가 `ctx.step`을 호출하게 한다.
    4. "미리보기 복귀 뒤 Ctrl+Z 동작" 회귀 테스트를 추가한다.
- U1 판정(Jarvis 범위: 섹션 연산·테마): 섹션 삭제 → 실행 취소 → 다시 실행은 Ego Lite 1280·390에서 확인했다. 테마는 단위 테스트로 기록 경로를 확인했다. **부분 PASS**: 위 P2(미리보기 복귀 뒤 무시)가 열려 있다. 필드·이미지·meta·복원·충돌은 B-ER-08 범위다.
- U2: 입력칸 안 Ctrl+Z를 가로채지 않음(1280·390 실측 defaultPrevented false) → PASS. U5(push가 redo를 비움, 언마운트 시 비움) → 단위 테스트 GREEN.

## 2. 상쇄 설계 (L1, 빌드 로그 대조)
| 시도 | 내용 | /studio | StudioLayout gz/raw | 결과 |
|---|---|---|---|---|
| 0 | ④ WIP 그대로 | 128.96 | 18.75/56.62 | exit 1 |
| 1 | 스택 생성을 조작 뒤 청크로 지연 + 알림·포커스 꼬리를 청크로 + 선택자 1개 | 128.63 | 18.39/55.76 | 채택 안 함. `useSectionOps.pin.test`(useUndoStack mock) 6건 실패. 테스트를 고치면 단언 약화라 고치지 않음 |
| 2 | 1에서 스택 지연만 되돌림 | 128.84 | 18.60/56.28 | exit 1 |
| 3 | 판정·리스너까지 `listenHistory`(조작 뒤 청크)로 옮김. 첫 연산 뒤 붙임. 스택은 한 줄+커서로 압축. history 카운터 제거 | **128.56** | 18.35/55.71 | exit 0 · 채택 |

- 브리프에는 "진입에는 최소 동기 판정만"이라고 되어 있다. 이와 달리 **진입의 판정을 0으로** 했다.
  - 사유: dist 절단 추정에서 판정만 0.20KB였다(추정, 빌드 아님). 진입에 남기면 128.75로 판정선을 넘는다.
  - 첫 연산 전에는 기록이 없어서 사용자 동작 차이는 없다. 단, 첫 연산 전 Ctrl+Z에는 preventDefault를 하지 않는다.
- 조작 뒤 청크는 진입 모듈을 새로 import하지 않는다. `step`·`setNotice`·`goTo`·`locked`는 인자나 ref로 넘긴다. docEngine은 1.49 → 1.94KB(예산 판정 밖).

## 3. 검증 (fresh)
- `npx tsc --noEmit` 0 · `npm run lint` exit 0(경고 0).
- `npx vitest run` exit 0: 239 파일 / 2122 통과(logs/vitest-3.txt).
  - deps 경고를 고친 뒤 studio 범위를 다시 돌림: 63 파일 / 478 통과.
- ④ 테스트(undoStack +2, historyKeys +2, UndoKeys +4)와 pin 테스트 단언은 변경 없이 GREEN이다. 이번 레인에서 바꾼 테스트 파일은 0개다.
- `npm run build` exit 0(logs/build-3.txt). 번들 표 전 행:
  - 공통 JS (gzip, 참고): 89.35KB
  - /catalog 첫 화면 합계: 99.65KB / 예산 100KB · 진입 직후 자동 로드 포함: 102.03KB / 예산 125KB
  - /references/:id 첫 화면 합계: 97.00KB / 예산 100KB · 진입 직후 자동 로드 포함: 99.38KB / 예산 125KB
  - /compare 첫 화면 합계: 98.83KB / 예산 100KB · 진입 직후 자동 로드 포함: 121.67KB / 예산 125KB
  - /compare (조정 있음) 첫 화면 합계: 98.83KB / 예산 100KB · 진입 직후 자동 로드 포함: 121.67KB / 예산 125KB
  - /profile 첫 화면 합계: 99.61KB / 예산 100KB · 진입 직후 자동 로드 포함: 119.09KB / 예산 125KB
  - /profile (3안 있음) 첫 화면 합계: 99.61KB / 예산 100KB · 진입 직후 자동 로드 포함: 121.55KB / 예산 125KB
  - /projects 첫 화면 합계: 94.02KB / 예산 100KB · 진입 직후 자동 로드 포함: 100.30KB / 예산 125KB
  - /studio/:projectId 첫 화면 합계: 91.76KB / 예산 100KB · 진입 직후 자동 로드 포함: 128.56KB / 예산 129KB
  -   /studio/:projectId M2c 기준선 128.67KB + 0.03KB (멈춤 > 128.70KB)
  - 렌더 문서(render.html) JS 합계: 84.19KB / 예산 90KB · CSS 합계: 8.85KB / 예산 30KB
  -   렌더 문서 중 앱과 공유: 없음 (합 0.00KB, 양쪽에 다 센다)
- Codex `review --scope branch --base 6658430`: 1라운드 실제 완료(logs/codex-r1.txt). P2 1건(1절)은 미반영이다. 2라운드는 돌리지 않았다(40턴 규칙으로 수정 중단).

## 4. Ego Lite (build + preview 127.0.0.1:4337, space 89)
- 시작 전 `listTaskSpaces()`=[]. goto는 `/catalog` 1회뿐이고, 이후에는 앱 안 클릭·키 입력만 했다. 새로고침 0.
- 경로 A: 카탈로그 → 비교(부티크 법률사무소=ref-e 기준 "전부 선택") → 프로필 확정 v1 → 3안 → A안 → 편집 시작 → `/studio/project-1`.
  - 테마 확인을 위해 앱 안에서 프로필 조정(대비 강화)을 v2로 저장한 뒤, 프로젝트 → 편집기 열기로 다시 들어왔다.
  - 카드 톤을 "밝음"으로 따로 고르지 않았다(기본값).
- **1280**:
  - Services 삭제 → ⌘/Ctrl+Z 복원("실행 취소: Services 삭제") → Shift+Ctrl/⌘+Z("다시 실행: Services 삭제") → Ctrl+Z → Ctrl+Y → ⌘+Z. 모두 행이 기대대로 바뀌었고, preventDefault true, 포커스는 그대로(About 줄)였다.
  - 입력칸(`field-about-1-heading`) 안 Ctrl+Z: prevented false, 문서 그대로.
  - 테마 v1→v2 바꾼 뒤 "되돌리기": v1로 돌아왔고, 포커스는 `#studio-theme-swap`에 있었다(B-ER-04 확인).
- **390**(탭 배치):
  - 섹션 탭에서 삭제 → Ctrl+Z → Shift+Ctrl+Z → Ctrl+Z: 동작, 알림 1문장, 포커스 그대로. 남은 기록이 없을 때 Ctrl+Y는 무변화.
  - 편집 탭 입력칸 안 Ctrl+Z: prevented false.
  - 테마 v2 바꾸기 → 포커스 `#studio-theme-swap`.
  - **"되돌리기" 클릭은 미확인**: 좌표 클릭이 버튼에 닿지 않았다(알림 그대로, 포커스가 h2 "테마"로 감). 재시도하려면 새 goto가 필요한데 규칙상 하지 않았다. 대체 근거는 jsdom ThemeSwap.test 390(ER-4)이다.
- 폭 전환:
  - `Browser.setWindowBounds`는 "No web contents" 오류로 불가했다.
  - DOM 확인용 폭은 `Emulation.setDeviceMetricsOverride`(1280·390)로 바꿨다.
- 캡처: override 없이 기본 폭(1877)에서 시도했으나 `Page.captureScreenshot` 시간초과. 1회 재시도도 시간초과였다. **캡처 없음 → DOM·포커스 값으로 대체**(위 수치).
- 마감:
  - `finish({keep:[]})` 후 `listTaskSpaces()`=[] 확인.
  - 자기 preview 서버는 종료했고 4337 리슨 0(`lsof` 빈 출력)이다.
  - 도중에 서버를 한 번 일찍 종료했다가 같은 dist로 다시 띄웠다. 페이지 새로고침은 없었다.
  - main 5480·영환님 창에는 접촉하지 않았다.

## 5. 미구현 · 차단
| 항목 | 상태 | 사유 |
|---|---|---|
| Codex P2 미리보기 복귀 뒤 단축키 무시 | 열림 | 40턴 규칙으로 수정 중단. 수정안은 1절 |
| ⑤ U4 더보기 | B-ER-09 | 128.56 > 128.55 조건 미달 |
| 390 테마 되돌리기 포커스(Ego Lite) | 미확인 | 클릭 미도달 · 새 goto 금지 |
| 캡처 | 대체 | captureScreenshot 시간초과(2회) |

## 6. 서브에이전트
없음(브리프 "서브에이전트 0").

## 7. 수정(2차)
- **4f7db01** (Codex r1 P2, 미리보기 복귀 뒤 단축키 무시): `HistoryKeys`에 `step`을 두고, StudioLayout 맥락 effect가 `ops.step`을 갱신, `listenHistory`가 붙일 때가 아니라 맥락의 최신 `ctx.step`을 호출. 회귀 `UndoKeys.test.tsx` "스냅샷 미리보기 복귀 뒤" — RED logs/fix2-red.txt(RED 미커밋). /studio 128.57 · vitest 2123.
- **Codex fix2** (`review --scope branch --base 6658430`, logs/codex-fix2.txt): P2 1건 — `useSectionOps.ts:113-114` 첫 연산의 조회·동적 import 대기 중 언마운트되면 완료 뒤 document keydown 리스너가 등록되고 cleanup이 다시 돌지 않아 누수.
- **누수 수정 a4bf4d1**: `mounted` ref(마운트 effect에서 true, cleanup에서 false) — `keys && mounted.current`일 때만 `listenHistory`. 연산 결과·편집 반영은 그대로.
  - 회귀 `useSectionOps.test.tsx` "첫 연산이 끝나기 전에 언마운트되면…": 조회 대기 중 run → unmount → 조회 완료 → body에서 Ctrl+Z → `step` 미호출 단언. 예측: 수정 전 step 1회 호출. RED 실측 일치(Number of calls: 1, logs/fix2b-red.txt). RED는 커밋하지 않음.
  - fresh: typecheck exit 0 · lint exit 0 · vitest 239 files / 2124 tests exit 0 · build exit 0 — /studio 진입 직후 **128.59KB** ≤128.70 (logs/fix2b-*.txt).
- **Ego Lite** (build + preview localhost:4337, space 91, 1280): 시작 전 `listTaskSpaces()`=[]. goto는 `/catalog` 1회, 이후 앱 안 클릭·키 입력만, 새로고침 0.
  - 경로: 카탈로그 → 법률사무소·치과 비교 추가 → 비교 보드 → ref-A "전부 선택" → 프로필 확정 v1 → 3안 → A안 → `/studio/project-1`.
  - Services 선택 → 삭제(행에서 Services 사라짐) → 스냅샷 → 지금 상태 저장 → 미리보기 → **편집으로 돌아가기** → Ctrl+Z: Services 행 복원, 알림 "실행 취소: Services 삭제", z keydown defaultPrevented true.
  - 캡처 1회 시도 → `Page.captureScreenshot` 시간초과 → **DOM 대체**(위 행 목록·알림 문장·defaultPrevented는 page.evaluate로 읽음). (그 앞 1회는 screenshot에 잘못된 옵션을 넘겨 호출 전 거부됨.)
  - 정리: `finish({keep:[]})` → `listTaskSpaces()`=[] · 자기 preview 종료 · 4337 리슨 0.
- Codex 재검토는 하지 않음(Jarvis 판단).
