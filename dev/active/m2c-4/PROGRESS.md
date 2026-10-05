# M2C-4 PROGRESS — 산출물 동봉 · 부모 디코드 실패 수신 · F2 캡션

base `2fc32ba` · 시작 build: `/studio` 진입 126.89(멈춤 >127.39) · 첫 91.76 · `/profile` 99.61 · 렌더 JS 84.19 / CSS 8.80 (`logs/build-start.txt`)

- [x] P0 BRIEF·PROGRESS 커밋 (74ba06f)
- [x] ② 부모 IMAGE_DECODE_FAILED 수신 — protocol `readRenderMessage` + compareFrame 사본 동시 개정(가드 무수정 통과)
- [ ] ① 생성기 readImage 주입 · exportImages(pickVariant) · render images + loading eager · data: 단일 파일 규칙 · PNG decode 대기 · D-1 결정성
- [ ] ③ 잃은 이미지 문구 · 크기 표시 · 3MB 안내 · F2 캡션
- [ ] 진입 청크 변경 뒤 build 예산 재측정
- [ ] Ego Lite: 앱 안 클릭 이미지 넣기 → 정적 HTML·PNG 결과 육안·캡처 → finish({keep:[]}) · listTaskSpaces()=[] · 서버 종료·리슨 0
- [ ] 마감 게이트: typecheck · lint · build · 전체 vitest
- [ ] Codex review --scope branch --base 2fc32ba (≤2라운드)
- [ ] REPORT.md

## 쓰기 범위 밖 연결 파일(사유)

## RED 예측 (테스트 작성 전 커밋)
- ② 새 테스트 3개 (기준 2009 → 2012): protocol.test "IMAGE_DECODE_FAILED 수신" · compareFrame.test "사본도 IMAGE_DECODE_FAILED" · staticHtml.test "decode 실패 = 즉시 '이미지를 그리지 못했습니다'(시간 초과 아님)". RED 예상 3 실패.
- ② RED 3 실패(logs/red-2.txt) → GREEN 16파일 116 통과(logs/green-2.txt) · compareFrameGuard 무수정 통과
- ① 새 테스트 11개 (2012 → 2023): exportImages.test 6(SPEC 5.1 세 사례 · 쓰는 id만=docImageIds · 잃은 이미지 · imageReader 파생본 전부) · staticMarkup.test 1(img src data:image/(webp|jpeg|png);base64만 · srcset 0) · staticHtml.test 2(render images+eager · onBuilt 요약 / 이미지 없는 문서도 eager) · pngCapture.test 2(D-1 5회 같은 높이+eager+images+fallbackCount 불변+잃은 문장 / decode 실패 PngError). RED 예상: exportImages 파일 import 실패 + 나머지 5 실패.
