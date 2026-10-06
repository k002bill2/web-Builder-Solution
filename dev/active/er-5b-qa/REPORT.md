# ER-5b QA REPORT — ER-5 조건 해소 QA

## meta
- 레인 er-5b-qa · base `a192037` · 역할 QA(코드 0) · 2026-10-06 · Ego Lite(Chromium) — **Safari·Firefox 미검증**
- 환경: `npm run build` EXIT 0(`logs/build.txt`) → `vite preview 127.0.0.1:4337`(dev 0). vitest 생략(브리프: 코드 변경 0, ER-5 2124 PASS).
- Ego: 시작 `listTaskSpaces()=[]` → space 3, 창 `normal`(1877×1050, setWindowBounds 불필요). 첫 goto 1회(/catalog) 뒤 앱 안 클릭·키만, 새로고침 0.
- 문서 경로: 카탈로그 ref-e(부티크 법률사무소) 비교 추가 → 이 레퍼런스로 프로필 → 확정 v1 → 3안 → A안으로 편집 시작(`/studio/project-1`) → 프로필 밀도 "촘촘" 조정 저장 v2 → 프로젝트 → 편집기 열기.
- 정리: Emulation override·CPU 스로틀 해제 → `finish({keep:[]})` = closedSpace:true → `listTaskSpaces()=[]` · preview PID 17257 종료 · 4337 리슨 0(`logs/cleanup.txt`). main 5480 무접촉. 서브에이전트 0 · 앱/docs/lock/scripts 수정 0 · push/merge/삭제 0.

## 항목별 판정

| 항목 | 판정 | 증거 |
|---|---|---|
| 1. QB-R7 1280·1024·390 넘침·포커스 | **PASS** (관찰 2) | `logs/qbr7.md` 표. 테마·스냅샷 대화상자·미리보기 Callout: 3폭 모두 문서 가로 넘침 0, 대상 rect 뷰포트 안, 내부 가로 넘침 0, 포커스 요소 뷰포트 안·elementFromPoint 가림 0. 캡처 `shots/qbr7-theme-dialog-{1280,1024}-viewport.png`·`qbr7-theme-dialog-390-nobeyond.png`·`qbr7-snapshot-dialog-{1280,1024,390}.png`·`qbr7-snapshot-dialog-saved-390.png`·`qbr7-preview-callout-{1280,1024}.png` |
| 1-b. 390 테마 적용 → "되돌리기" → 포커스 | **PASS** | v2 바꾸기 → "테마를 프로필 v2로 바꿨습니다 · 슬롯 값 31개 모두 그대로입니다" → 알림 줄 "되돌리기" 클릭 → "테마를 프로필 v1로 되돌렸습니다", **activeElement = `#studio-theme-swap`**(뷰포트 안·가림 0). 캡처는 합성 빈 칸(아래 한계) → DOM 판정 |
| 2. QB-R2·R5 결과 줄 "이미지 N장" 문구 | **미검증** | 35턴 상한으로 새 측정 중단 |
| 3. B-ER-07 변환 중 미리보기 차단 | **미검증** | 35턴 상한. fixture `noise-12mp.jpg`(4000×3000, 12,171,578B)·`big-noise.jpg`(6000×4000, 24,327,838B) 준비만 됨(MANIFEST.json) |
| 4. B-M2C-09 ② | **미검증** | 시간·턴 없음 |

## 결함·관찰
- **P3 결함 후보(재현 1회, 확인 필요)**: 스냅샷 대화상자를 Esc로 닫으면 포커스가 `BODY`로 감(1024·1280 측정). 테마 대화상자는 같은 조작에서 `#studio-theme-swap`으로 복귀 — 대화상자끼리 포커스 복귀가 다름. 재현: 편집기 → "스냅샷" → Esc → `document.activeElement`.
- 관찰(P3): 390에서 테마 적용 직후 알림 줄 "되돌리기"가 뷰포트 위(y=-337)에 있어 화면에서 안 보임. status 영역이라 보조기기는 읽음. 포커스 복귀 자체는 정상.
- 환경 한계(결함 아님): ① 브리프 캡처 방식(captureBeyondViewport:true)은 스크롤된 화면의 fixed `<dialog>`를 어긋난 위치로 그림 → `captureBeyondViewport:false`+뷰포트 clip(`lib.mjs shotV`)이 DOM과 일치. ② 390에서 스크롤 직후 캡처 위쪽이 빈 칸(`qbr7-390-theme-undo-focus.png`, `qbr7-preview-callout-390.png`) → DOM 측정으로 보완.

## 판정: **조건부 Go (ER-5 조건 일부 해소)**
- 해소: ER-5 조건 ① QB-R7(1024·390 넘침·포커스, 390 되돌리기 포커스) — PASS.
- 남은 조건: ② QB-R2/R5 결과 줄 "이미지 N장" 문구 DOM 기록 — 미검증. 스냅샷 Esc 포커스 P3 후보는 Go를 막지 않음(확인 후 백로그).
- 다음 QA 권장 턴 예산: 항목 2·3에 각 15턴 이상(문서 생성 경로만 ~10턴 소요 실측).

## B-ER-07 · B-M2C-09 닫힘 의견
- **B-ER-07: 닫지 않음** — 재현 시도 전 중단. 수단(CPU 스로틀 6→20 + noise-12mp/big-noise)과 fixture는 준비됨.
- **B-M2C-09: 닫지 않음** — ① 개수 문구, ② 태블릿·모바일 PNG↔HTML 대조 모두 미검증.

## 산출물 경로
- 캡처 `dev/active/er-5b-qa/shots/qbr7-*` · 측정 `logs/qbr7.md` · 도구 `lib.mjs`(measure·shotV 추가) · fixture 생성기 `fixtures/gen-fixtures.mjs`
- 내보낸 파일: 없음(`exports/` 비어 있음). fixture 바이너리 `fixtures/*.jpg`는 .gitignore — 생성기로 재생성.
