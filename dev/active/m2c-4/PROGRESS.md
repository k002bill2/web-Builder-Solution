# M2C-4 PROGRESS — 산출물 동봉 · 부모 디코드 실패 수신 · F2 캡션

base `2fc32ba` · 시작 build: `/studio` 진입 126.89(멈춤 >127.39) · 첫 91.76 · `/profile` 99.61 · 렌더 JS 84.19 / CSS 8.80 (`logs/build-start.txt`)

- [x] P0 BRIEF·PROGRESS 커밋 (74ba06f)
- [x] ② 부모 IMAGE_DECODE_FAILED 수신 — protocol `readRenderMessage` + compareFrame 사본 동시 개정(가드 무수정 통과)
- [x] ① 생성기 readImage 주입 · exportImages(pickVariant) · render images + loading eager · data: 단일 파일 규칙 · PNG decode 대기 · D-1 결정성
- [x] ③ 잃은 이미지 문구 · 크기 표시 · 3MB 안내 · F2 캡션
- [x] 진입 청크 변경 뒤 build 예산 재측정 — /studio 진입 126.89→127.03 · /profile 99.61→99.62 · /catalog 진입 +0.02 · 그 밖 ±0.01 · 렌더 JS 84.19 불변 (logs/build-3.txt)
- [x] Ego Lite: 이미지 넣기·캔버스·PNG 결과 육안 확인·캡처 · finish({keep:[]}) · listTaskSpaces()=[] · 4337 리슨 0
  - BLOCKED: 정적 HTML 결과 육안 — 시드 문서 기존 게이트 차단(대비 AA C-5)으로 버튼 비활성, QA(QB-8) 이관
- [x] 마감 게이트: typecheck·lint·build exit 0 · 전체 vitest 227파일 2033 통과 exit 0 (logs/final-*.txt)
- [ ] Codex review --scope branch --base 2fc32ba (≤2라운드)
- [x] REPORT.md

## 쓰기 범위 밖 연결 파일(사유)
- `components/studio/StudioLayout.tsx` — images 맵을 useExportFlow·PngSave capture로 넘기기(편집 틀 state가 유일한 보관 자리) · 재시도 alert 사유 전달
- `features/studio/useExportFlow.ts` — requestExportOnce에 images 전달
- `components/studio/StructureCanvas.tsx` — canvasCaption에 images(잃은 이미지 문장)
- `components/studio/ExportAfter.tsx` — 결과 줄(크기·3MB 안내·잃은 이미지) 표시
- `components/studio/ExportRetryAlert.tsx` · `PngSave.tsx` — "이미지를 그리지 못했습니다" 문구(5.3-3)

## RED 예측 (테스트 작성 전 커밋)
- ② 새 테스트 3개 (기준 2009 → 2012): protocol.test "IMAGE_DECODE_FAILED 수신" · compareFrame.test "사본도 IMAGE_DECODE_FAILED" · staticHtml.test "decode 실패 = 즉시 '이미지를 그리지 못했습니다'(시간 초과 아님)". RED 예상 3 실패.
- ② RED 3 실패(logs/red-2.txt) → GREEN 16파일 116 통과(logs/green-2.txt) · compareFrameGuard 무수정 통과
- ① 새 테스트 11개 (2012 → 2023): exportImages.test 6(SPEC 5.1 세 사례 · 쓰는 id만=docImageIds · 잃은 이미지 · imageReader 파생본 전부) · staticMarkup.test 1(img src data:image/(webp|jpeg|png);base64만 · srcset 0) · staticHtml.test 2(render images+eager · onBuilt 요약 / 이미지 없는 문서도 eager) · pngCapture.test 2(D-1 5회 같은 높이+eager+images+fallbackCount 불변+잃은 문장 / decode 실패 PngError). RED 예상: exportImages 파일 import 실패 + 나머지 5 실패.
- ① RED 5 실패+exportImages import 실패(logs/red-1.txt) → GREEN 110파일 703 통과(logs/green-1.txt). staticMarkup.test "on* 0" 픽스처 `src="data:,"` → `data:image/png;base64,AA`(새 5.2 규칙 — 단언 무변경)
- ③ 새 테스트 9개 (2023 → 2032): exportFlow.test 5(크기 줄·이미지 0 괄호 생략 / 3MB 경계 / 잃은 문장 / 슬롯 생성기 readImage+onBuilt→done notes / IMAGE_FAILED→retryable reason) · ExportResultNotes.test 2(결과 notes 표시 / 재시도 alert 사유) · PngSave.test 1(decode 실패 문구) · canvasCaption.test 1(잃은 이미지 문장 조건) + 기존 canvasCaption 문구 단언 F2로 개정(10절 목록). RED 예상: exportFlow 5 + UI 3 + caption 2(개정 1 포함).
- ③ RED 10(새 9 + 개정 1, logs/red-3.txt) → GREEN(61파일 542) · tsc·eslint 통과
- Codex r1 반영 RED 예측: exportFlow.test 새 1개(프로젝트별 맵 · 다른 프로젝트 요청이 덮어쓰지 않음 · 끝나면 해제) (2032 → 2033). RED 예상 1 실패.
- Codex r2 반영 RED 예측: exportFlow.test 새 1개(커밋 뒤 응답 유실에도 생성기가 이미지를 읽고, 생성이 끝나면 놓음) (2033 → 2034). RED 예상 1 실패.
