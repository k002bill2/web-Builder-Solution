# M2C-5 REPORT — M2c 최종 독립 QA (F2 시안 등급 게이트)

## meta
- 역할 QA / Orca managed Claude Code / worktree m2c-5-qa / base `b2da3c4` / P0 `562dddd` · 2026-10-06
- 서브에이전트 0 · 앱/테스트/docs/design/lock/scripts 수정 0 · 쓰기는 `dev/active/m2c-5-qa/`만 · push/merge/삭제 0
- 서버: dev 4337(PID 65826)·preview 4339(PID 65810) 모두 127.0.0.1, cwd = 이 worktree `app` 확인 → 종료 → 4337/4339 리슨 0. main 5480(PID 82062)은 리슨 확인만, 무접촉
- Ego Lite: space 75 하나만 사용. 끝에 `finish({keep:[]})` → `{"closedSpace":true,"closedManagedLabels":["p1"]}`(p2는 그 전에 close) · `listTaskSpaces()` = `[]`
- 이동은 앱 안 클릭만. 예외: QB-10 새로고침 1회(의도적), 내보낸 HTML 열기는 별도 탭 p2(file://)
- **턴 한도(70) 도달로 시각 회귀 기준선 재생성은 실행하지 못했다** — 아래 6절
- 판정 등급: PASS / 결함 / 환경 한계 / 미검증 / 미실행. 모의 결과를 실측으로 쓰지 않았고, N/A를 PASS로 쓰지 않았다

## 1. 결론
**M2c = 조건부 Go.** 업로드·검증·변환·슬롯 UI·자체 그래픽·정적 HTML·PNG 경로는 데스크톱 Chrome(Ego Lite) 실측에서 모두 동작했다. 게이트를 통과한 문서(앱 안 조작으로 대비 4/4·SEO 통과)에서 정적 HTML 9장과 PNG 3폭×5회도 확인했다.
조건 3가지:
1. 시각 회귀 기준선 30×3 재생성과 결정성 확인(미실행)
2. M2C-3 이관 768·390 폭 패널 판정(캡처만 있고 판정 전)
3. QB-10 경로 결정 — 새로고침하면 프로젝트 전체가 사라져 "잃은 이미지" 상태에 제품 흐름으로 갈 수 없다

P0·P1 결함은 없다.

## 2. QB 표
| QB | 판정 | 실측 결과 | 증거 |
|---|---|---|---|
| QB-1 | PASS | Hero 선택만으로는 이미지 청크 요청 0 → "이미지 편집" 펼침 뒤 `ImageSlotPanel-CjoMZvB4.js`·`imageStore-Bkoy43xu.js` → 파일 선택 뒤 `ingest-kIpX0MKj.js`(resource timing 순서). input `accept=image/jpeg,image/png,image/webp` · `capture` 없음 · multiple 아님 | `shots/qb1-panel-open-1280.png` |
| QB-2 | PASS | 12MP JPEG → "4000 × 3000 · WebP 23KB" + 캔버스 반영 · 투명 PNG → **WebP**(Chrome WebP 알파, 결과 형식 기록) "1200 × 800 · WebP 10KB" · WebP → "1600 × 900 · WebP 19KB" | `shots/qb2-*.png` |
| QB-3 | PASS | 위장(.png 이름의 JPEG)·SVG → "JPEG·PNG·WebP 이미지만 쓸 수 있습니다" · 11MB → "10MB까지 쓸 수 있습니다 (11.0MB)" · 41MP → "4천만 화소까지 쓸 수 있습니다 (8000 × 5125)" · 잘린 파일(4096B·12B) → "이미지 파일을 읽을 수 없습니다". 6건 모두 파일 버튼 `aria-invalid=true` + `aria-describedby`가 문구에 연결 · 이전 이미지 메타 유지 · 새 `role=alert` 0(시작 전부터 있던 1개 그대로) | `shots/qb3-fail-41mp-1280.png` · 로그는 이 REPORT |
| QB-4 | PASS | 방향 6 fixture(저장 1200×800) → 메타 "800 × 1200" · 캔버스·HTML·PNG 모두 화살표가 위로 똑바름. 내려받은 HTML의 data: 9개를 디코드한 바이트에서 `Exif\0\0`·`eXIf`·`EXIF`·Make 문자열 `QA-FIXTURE`·`GPS` 0 | `shots/qb4-orient6-1280.png` · `exports/qb8-9img.html` |
| QB-5 | PASS | 12MP JPEG 선택부터 메타 표시까지 **426ms**(목표 ≤ 2초) · 변환 중 16ms 하트비트의 최대 공백 69ms(긴 프레임 1회 수준, 입력 막힘 없음) | 이 REPORT |
| QB-6 | PASS(1280·390) / 미검증(768 수치) | masonry 박스: 3:2 → 293×195(1.50) · 2:3 → 293×440(0.67) · 4:1 → 293×147(**2.0으로 자름**) · 모바일 390에서도 3:2·2:3 비율 유지. HTML `<img width height>` = 메타(1500×1000·1000×1500·3200×800). 태블릿은 캡처만 있고 수치 판정은 안 함 | `shots/qb6-masonry-{데스크톱,태블릿,모바일}.png` |
| QB-7 | PASS(같은 프로필) / 미검증(다른 프로필 색 차이) | 3안 실제 화면 비교: 같은 변형(포트폴리오 masonry)은 3안 모두 같은 그림이었다. 3안이 같은 프로필 v3라 "토큰 색만 다름"은 이 화면에서 볼 수 없다. 접근성 스냅샷에 SVG 노드 0(aria-hidden으로 보임). iframe `sandbox="allow-scripts"`만 | `shots/qb7-compare3-1280.png` |
| QB-8 | PASS | **게이트 통과 문서**: 헤어살롱 프로필 → 비교 보드에서 라이트 카드로 교체 → 프로필 "보정값 쓰기" 2건(ink·muted) → 대비 통과 4·미달 0 → 조정 저장 v3 → 3안 → A안 → 편집 → 페이지 정보 제목·설명 입력 → 품질 게이트 전부 통과(성능 예산은 "측정 전" 표시). 결과 줄 "HTML 1개 · 1.1MB (이미지 9장 포함)". 파일: img 9개 모두 `data:image/webp;base64` · `blob:` 0 · `srcset` 0 · http(s) 0 · script 1 · 동봉 폭 hero 800(원본 폭 상한) · about 1280 · 포트폴리오·지도 640(SPEC 5.1) · hero 밖 `loading="lazy"`. file://로 열었을 때 요청은 파일 자신과 data:뿐(외부 0). 캔버스와 같은 배치이고 9장 모두 그려짐 | `shots/qb8-gate-pass-1280.png` · `qb8-html-result-1280.png` · `qb8-html-open-1280-full.png` · `exports/qb8-9img.html` |
| QB-9 | PASS | PNG 1280×5592 ×5 · 768×4493 ×5 · 390×6050 ×5 — 폭마다 높이·바이트·sha256 동일(`logs/qb9-sha.txt`). 내려받기 성공 = toBlob 성공(캔버스 오염 0). 1280·390 PNG에 이미지 9장 모두 보임 | `logs/qb9-sha.txt` · PNG 원본은 용량 때문에 커밋 안 함(`exports/.gitignore`) |
| QB-10 | 환경 한계(제품 흐름으로 도달 불가) | 새로고침 → **"프로젝트를 찾을 수 없습니다 · 새로고침하면 프로젝트와 편집 내용이 사라집니다(서버 연결 전)"**. 문서도 함께 사라져 잃은 이미지 → 자체 그래픽 + 개수 문구는 실브라우저에서 볼 수 없다. 단위 테스트(IMG-AC-24·28)로만 보증된다 | `shots/qb10-after-reload-1280.png` |
| QB-11 | PASS(포커스·조작) / 미검증(낭독) | 키보드만: 요약(Enter로 펼침) → 스위치 → 다른 이미지로 바꾸기 → 이미지 지우기 → 대체텍스트 → 장식 체크 → 다음 영역. 모든 정지점에 포커스 링 있음 · Space로 스위치 끔/켬 · 장식 체크 → 대체텍스트 `aria-disabled=true` + 설명 "장식 이미지라 대체텍스트를 쓰지 않습니다". 스크린리더 낭독은 실측하지 않음 | `shots/qb11-focus-1280.png` |
| QB-12 | PASS | `npm run build` EXIT 0 · /studio 진입 127.04(멈춤 > 127.39) · 첫 화면 91.77 · 렌더 JS 84.19 / CSS 8.80 · 조작 뒤 청크(vite 출력 gzip): ImageSlotPanel 3.33 · ingest 2.64 · imageStore 0.92 · exportImages 0.69 · exportFlow 3.26 · pngCapture 9.97 | `logs/build.txt` |

## 3. M2C-3 이관 — Ego Lite 4폭
| 폭 | 판정 | 내용 |
|---|---|---|
| 1280 | PASS | 펼침 → 파일 선택 → 실패 문구 → 대체텍스트·장식 → 캔버스 반영(QB-1~4·11). 이미지 지우기는 키보드 포커스까지만 확인했고 실제 제거는 실행하지 않음 → **미검증** |
| 1024 | 결함 후보 D-3 | 패널은 보임(x=741, 폭 252, 가로 넘침 없음). 1280에서 열려 있던 "이미지 편집"이 폭을 바꾸자 **닫혔다**(`open:false`) |
| 768 · 390 | 미판정 | 이미지 편집 details의 상자 크기 0(편집 패널이 다른 배치로 바뀐 것으로 보임). 캡처 `shots/m2c3-panel-{768,390}.png`는 남겼지만 턴 한도 때문에 육안 판정을 못 함 |

## 4. IMG-AC ↔ 테스트 대조 (08·09·11~16)
| AC | 테스트 파일(grep L1) | QA 실측 |
|---|---|---|
| 08 실패 시 불변·aria-invalid | `components/studio/ImageSlotPanel.test.tsx` | QB-3 PASS |
| 09 마지막 선택만 반영 | `ImageSlotPanel.test.tsx` | 실측 안 함([U]만) |
| 11 보관 바이트 한도 | `features/studio/images/store/imageStore.test.ts` · `ImageSlotPanel.test.tsx` | 한도 근처 문서를 만들지 못함(9슬롯 × 노이즈 변환본이 수 MB 수준) — 미검증 |
| 12 진입 층 버튼·누르기 전 요청 0 | `components/studio/StudioLayoutImages.test.tsx` | QB-1 PASS |
| 13 스위치 라벨·필수·장식 aria-disabled | `ImageSlotPanel.test.tsx` · `StudioLayoutImages.test.tsx` | QB-11 PASS. 스위치 라벨 "대표 이미지 사용"·"사례 이미지 1~3 사용"·"지도 이미지 사용"은 화면 글로 확인. 접근 이름 연결 방식(aria-labelledby 여부)은 확인 필요 |
| 14 상태 낭독(시작·완료·실패, alert 0) | `ImageSlotPanel.test.tsx` | `role=status` 글 "이미지를 넣었습니다 대체텍스트를 적어 주세요"·실패 문구 확인 · 새 alert 0 |
| 15 파일 이름 0 | `ImageSlotPanel.test.tsx` · `images/ingest/ingestImage.test.ts` · `images/store/imageStore.test.ts` · [G] 가드 파일은 확인 안 함 | 패널·캔버스·HTML에 fixture 파일명 0(메타만 표시) |
| 16 권리 안내 + 지도 안내(map만) | `ImageSlotPanel.test.tsx` | 실측: 모든 슬롯에 권리 한 줄, Footer map에만 지도 약관 줄 |
(테스트 이름 단위 매핑은 턴 한도 때문에 파일 단위로 마감했다.)

## 5. 결함·관찰 목록
| ID | 심각도 | 내용 | 재현 | 증거 |
|---|---|---|---|---|
| D-1 | P3 | IMG-AC-29 "조작 뒤 청크 크기 보고"가 빠졌다. `check-bundle-size` 출력의 /studio 조작 뒤 목록에 ImageSlotPanel·ingest·imageStore·exportImages가 없다(예산 판정에는 영향 없음) | `npm run build` → `[bundle] /studio/:projectId 조작 뒤` 줄 확인 | `logs/build.txt` 54·60·81·85행 대 bundle 줄 |
| D-2 | P3(관찰) | QB-10: 새로고침하면 프로젝트까지 사라져 잃은 이미지 경로가 제품에서 도달 불가. SPEC 9절 QB-10 전제와 맞지 않는다 | 편집기에서 새로고침 | `shots/qb10-after-reload-1280.png` |
| D-3 | P3 | 창 폭을 1280 → 1024로 바꾸면 열어 둔 "이미지 편집" 펼침이 닫힌다(작업 위치를 잃음) | 1280에서 펼침 → 폭 1024 | 이 REPORT 3절 · `shots/m2c3-panel-1024.png` |
| D-4 | P3 | 스위치 도움말 "끄면 이미지 없이 **색 면**으로 보이고…"가 SPEC r2 4절 정정("꺼짐 = 미디어 요소 없음, 섹션 배경")과 다르다 | 아무 슬롯이나 펼침 | `shots/qb2-jpeg12mp-picked-1280.png` |
| B-M2C-01 | 관찰(재현 안 됨) | 노이즈 3000×2000 JPEG(약 6MB) 4종으로 9슬롯을 채워 정적 HTML을 만들었다. 결과는 **성공, "HTML 1개 · 2.8MB (이미지 9장 포함)"**, 3MB 안내는 없음(경계 아래). 이 문서 구성(동봉 폭 640~1920)으로는 HTML_MAX 8,000,000자에 닿지 않아 실패 문구를 관찰하지 못했다 — 환경/데이터 한계. 고치지 않음 | `/tmp` 잡 파일 → 노이즈 업로드 → 정적 HTML | 결과 줄(이 REPORT) |

## 6. 시각 회귀 기준선 — 미실행
- 턴 한도 70에 도달해 브리프 규칙대로 새 측정을 멈췄다. `dev/active/m2b-6-qa/s1-render30.mjs`의 DIR이 m2b-6-qa worktree 경로로 고정돼 있어, 사본을 이 폴더로 옮겨 경로만 바꿔 돌려야 한다.
- 사용법(다음 레인): ① 4337 dev 기동 ② s1 사본(DIR = 이 폴더) `ego-browser nodejs < s1.mjs` ③ `shots.sh` 사본으로 30×3폭 → `baseline/` ④ 2회 실행해 `pdiff.mjs`로 픽셀 차이 0 확인 ⑤ m2b-6 기준선과 비교 — `.kit-gradient` → `kit-art` SVG 자리의 차이는 의도된 변경, 그 밖의 차이는 결함 후보.
- `baseline/` 폴더는 비어 있다.

## 7. F2 게이트 판정
| 조건 | 판정 | 근거 |
|---|---|---|
| 모든 섹션 실렌더 | PASS(이 문서 9섹션) | 캔버스·HTML·PNG에 폴백 표시 없음(육안). 30변형 전수는 기준선 미실행이라 미확인 |
| 폰트 자체 호스팅 | PASS(육안) | HTML file:// 열기에서 외부 요청 0, Noto Serif KR 제목이 그려짐 |
| 모션(M2b) | 게이트 "모션 예산 통과"만 확인 | 모션 동작 자체는 실측 안 함 |
| 이미지 슬롯 = 사용자 이미지 또는 자체 그래픽 | PASS | 사용자 이미지 9장 + 이미지 없는 슬롯 SVG(QB-7) |
| 정적 HTML·PNG에 같은 이미지 | PASS | QB-8 HTML 9장 · QB-9 PNG 9장 같은 그림 |
| 캔버스 캡션 "시안 (F2)" | 미확인 | 화면 글에서 찾지 못함(새로고침 뒤 확인하려던 시점엔 프로젝트가 사라짐) — 단위 테스트 IMG-AC-28 |
→ **F2 = 조건부 PASS**(기준선 30×3 + 캡션 육안 확인이 남음)

## 8. 회귀 게이트
- `npx vitest run`(기본 1회): **227파일 2034/2034 통과 · EXIT 0** · Errors 0 (`logs/vitest.txt`, 32.4s)
- `npm run build` EXIT 0 (`logs/build.txt`). typecheck는 build 안에서 같이 돎. lint는 이 레인에서 따로 돌리지 않음(코드 변경 0)

## 9. fixture
- 자체 제작만: `fixtures/gen-fixtures.mjs`(Ego Lite OffscreenCanvas 패턴·노이즈 + Node에서 EXIF APP1 직접 작성 — 방향 6, GPS, Make). 외부 이미지·실사진·크롤링 0.
- 24개, `MANIFEST.json`에 크기와 sha256 앞 16자리. 같은 브라우저에서 다시 만들면 바이트가 같다(f01 392,876B 두 번 같음). 바이너리는 `.gitignore`로 빼 두었다. 41MP는 PNG로 만들면 22MB라 V4에 먼저 걸려서, V5를 시험하려고 JPEG(465KB)로 만들었다.

## 10. 책임·환경
- 실측 환경: 데스크톱 Chrome 계열 Ego Lite 1종. **Safari·Firefox·모바일 실기기 = 미검증**(WebP 대체·HEIC·캔버스 면적 한도 포함).
- iframe(교차 출처 sandbox) 안 DOM은 CDP로 접근하지 못해, masonry 비율은 캡처 픽셀로 쟀다.
- 결함은 고치지 않았다.
