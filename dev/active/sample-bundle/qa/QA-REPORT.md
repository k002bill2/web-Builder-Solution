판정: **PASS with notes**

# SAMPLE-BUNDLE QA — 디자인 샘플 묶음 실화면 검증

- 일시 2026-10-25 · 브랜치 `k002bill2/sample-bundle` · 기준 HEAD `8aa8b7da`(+QA-BRIEF 커밋 `b91c5571`) · 앱 코드 변경 0
- 환경: `npm run build`(exit 0, `logs/build.log`) → `vite preview --port 4399 --strictPort`(시작 전 LISTEN 0줄, `port-before.txt` 빈 파일) · 브라우저 ego-browser 전용, TaskSpace `sample-bundle qa-1`(새로 만듦), IndexedDB·localStorage 초기화 후 앱 안 클릭으로만 이동
- 흐름(게이트 통과 경로, export-sync-qa 선례): `/catalog` 모던 카페 브랜드 + 프리미엄 헤어살롱 비교 → 모던 카페 A 전부 선택 → 프로필 확정 v1 → 3안 → A안 편집 시작 → 뒤로 → 보정값 쓰기 → 조정 저장 v2 → 3안 v2 → B안 → "B안으로 새로 시작" → SEO 제목·설명 입력 → `/studio/project-1` "검사 · 내보내기"(게이트 8항목 통과, 성능 예산 "측정 전") → "디자인 샘플 내려받기"

## 결과표

| # | 항목 | 결과 | 근거 |
|---|------|------|------|
| 1 | 내보내기 영역 순서 = PNG → 디자인 샘플 → HTML 1개 → 정적 zip → React zip, 숨김 0 | **PASS** | DOM 순서·세로 위치(top 867/959/1007/1055/1103) 동일, 5개 모두 visible, 게이트 통과 후 aria-disabled 0 — `logs/qa-sample-run.txt` "export order", `shots/export-area-1280.png`·`shots/export-after-1280.png` |
| 2 | 결과 줄 "디자인 샘플 묶음(zip) · 파일 5개 · nMB", 콘솔 오류 0 | **PASS** | 결과 줄 `디자인 샘플 묶음(zip) · 파일 5개 · 1.1MB`, 결과 해시 `d4c30094b7d4`(= zip sha256 앞 12자리). 콘솔 error·exception 0건(CDP Runtime/Log 수집; 수집 경로는 `logs/qa-console-probe.txt`에서 주입한 console.error 1건 포착으로 확인) |
| 3 | zip sha256 · 엔트리 5개 | **PASS** | `모던-카페-브랜드-프로젝트_r3_sample.zip` 1,143,297B · sha256 `d4c30094b7d46e501cbb24d4699bf2c200dce8c4ddaa247399070d1f1dc2a237` · `unzip -l` = design.png·design.html·design-tokens.json·sections.json·README.txt(5 files) — `logs/zip-inspect.txt`, 파일 `download/` |
| 4 | design.png 실제 PNG·가로 1280·빈 이미지 아님 | **PASS** | 시그니처 `89504e470d0a1a0a`, sips 1280×4735, 360,239B, 육안 확인 9개 섹션 전부 그려짐(헤더~푸터) |
| 5 | tokens `$schema`=`design-sample/tokens@0`·px 0·cssVars·source.kind=internal / sections 수 = 편집기 섹션 수, instanceId·slot 0 | **PASS** | `$schema` 일치, px 0건, cssVars 43개, source `{kind: internal, profileVersion: 2, candidateId: B, …}` · sections.json 9개(header·hero·about·services·portfolio·testimonials·faq·contact·footer) = 편집기 섹션 목록 9개(`logs/qa-sample-3-run.txt`) · `instanceId` 0 · `slot` 0 |
| 6 | design.html `file://` 렌더 | **PASS** | title "모던 카페", 문서 높이 4728, section/header/footer 9, 본문 글자 756자 — `shots/design-html-file-1280.png`(헤더·히어로·자체 그래픽 렌더). `<img>` 0개는 이미지가 자체 그래픽(CSS/SVG)이라 정상 |

## 결함·노트

- **N1 (노트, 결함 판단 보류) — 버튼 클릭 직후 자동 다운로드가 ego-browser에서 download 이벤트를 내지 않음.** 재현: 위 흐름 → "디자인 샘플 내려받기" 클릭 전 `page.waitForEvent("download", 90s)` 대기 → 결과 줄은 정상 표시되나 이벤트 타임아웃(`logs/qa-sample-run.txt` dlErr). 결과 줄의 폴백 링크 "내려받기"(`<a href=blob: download=…_r3_sample.zip>`)를 누르면 즉시 download 이벤트 발생·저장 성공(`logs/qa-sample-dl2-run.txt`). 앱은 "내려받기가 시작되지 않으면 브라우저의 다운로드 권한을 확인하세요" 안내와 폴백 링크를 제공하므로 사용자 흐름은 막히지 않음. 자동 다운로드 미발생이 앱(비동기 생성 뒤 user activation 소실 등) 원인인지 ego-browser 자동화 환경 원인인지는 이번 범위에서 미판정 — 일반 Chrome 수동 1회 확인 권고.
- N2: 품질 게이트 "성능 예산"은 "측정 전 · 생성기 연결 후 측정"으로 표시(통과 집계 밖). 기존 동작.
- N3: 시드 문서(A안 v1)는 대비 AA 차단으로 내보내기 비활성 — 기존 메모대로 보정값 v2 + B안 새로 시작 경로로 통과시켰다(결함 아님).

## 파일

- 스크립트 `scripts/qa-sample.mjs`(본 흐름) · `qa-sample-dl2.mjs`(폴백 다운로드) · `qa-sample-3.mjs`(섹션 수·file:// 렌더) · `qa-console-probe.mjs`
- 로그 `logs/qa-sample-run.txt`·`logs/qa-sample.json`·`logs/qa-sample-dl2-run.txt`·`logs/qa-sample-3-run.txt`·`logs/zip-inspect.txt`·`logs/qa-console-probe.txt`·`logs/build.log`·`logs/cleanup.txt`
- 스크린샷 `shots/export-area-1280.png`(클릭 전) · `shots/export-after-1280.png`(결과 줄) · `shots/design-html-file-1280.png`
- 다운로드 zip은 저장소에 커밋하지 않음(Jarvis 2026-10-25 — 바이너리 선례 방지). 근거 = 위 sha256 `d4c30094…a237` · `logs/zip-inspect.txt` 엔트리 목록. 원본은 저장소 밖 Jarvis scratch `sample-bundle-qa/`에 보관

## 마감

- preview 종료(`pkill`), `lsof -nP -iTCP:4399 -sTCP:LISTEN` 0줄 — `logs/cleanup.txt`
- ego-browser TaskSpace `sample-bundle qa-1` 페이지 1개(p1) 닫음; file:// 확인용 p2는 스크립트 안에서 닫음
