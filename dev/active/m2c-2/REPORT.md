# M2C-2 REPORT — 렌더 쪽(자체 그래픽·프로토콜·decode 대기·원본 비율) + 예산 가드

- Developer · worktree `m2c-2` · 브랜치 `k002bill2/m2c-2` · base `c870439` · 2026-10-05
- 서브에이전트 0 · 서버 기동 0(이 레인 IMG-AC에 [B] 없음 → 4337/4339·main 5480 무접촉) · push/merge/삭제 0 · 새 의존성·package*.json/lock·CLAUDE.md·docs/design·docs/decisions 수정 0 · `ingest/**` 무접촉

## 1. 결과 요약
| 단계 | 커밋 | 내용 |
|---|---|---|
| P0 | `d56126f` | BRIEF·PROGRESS·시작 실측 |
| ① 예산 검사기 | `1df0512`(예측 커밋 뒤 RED 6/6) | `app/scripts/m2cBaseline.json`(c870439 · `/studio` 진입 127.36 · 허용 0.03 · 렌더 JS 멈춤선 89.70) + `checkBundle({baseline})` 실패 조건. 한도 128·90·30 상향 0. 기준선 없음·형식 틀림·없는 시나리오 = 실패 |
| ② 프로토콜 | `9797ef6` | `images: Record<id, {blob,width,height}>`(한 변 1~16384 정수) · `loading?: "eager"` · `RenderErrorCode`에 `IMAGE_DECODE_FAILED` · `StructureCanvas` images prop 타입 이전 — 단독 typecheck 통과 |
| ③ 렌더 쪽 | `5e5ed97` | `kit/art.ts` 결정적 SVG · `Media` 빈 슬롯 = `div.kit-art > svg` · masonry 원본 비율 · 지도 contain · `EagerImages` 컨텍스트 · RenderApp decode 대기 · `serializeSite` lazy 복원 |

## 2. IMG-AC ↔ 테스트
| ID | 테스트 |
|---|---|
| IMG-AC-17 | `kit/PortfolioGallery.test.tsx` "IMG-AC-17 [U]: 실제 이미지 칸 = 원본 비율…" (3000×1000 → `2 / 1` · 900×1600 그대로 · 500×2000 → `1 / 2` · width/height = 메타 · 메타 없음·플레이스홀더 = 고정 배열 · grid는 메타 무시) |
| IMG-AC-18 | `kit/art.test.tsx` "이미지 맞춤 (IMG-AC-18)" (kit-img cover center · footer-map contain + `--site-surface` · 9변형 img 전부 kit-img) |
| IMG-AC-19 | `kit/art.test.tsx` "자체 그래픽 결정성" 3개 (2회 렌더 바이트 동일 · instanceId만 다른 섹션 동일 · 시드 함수 · 3계열 모두 쓰임 · ≤12 · 소수 1자리 · 잃은 이미지 = 기본 무늬) |
| IMG-AC-20 | `kit/art.test.tsx` "자체 그래픽 접근성·가드" 2개 (aria-hidden · focusable=false · viewBox/slice · 글자·title·href·image·use·url()·fill/stroke/style 속성 0 · class `kit-art-*`만 · CSS 칠 = `--site-*`만 · `kit-gradient` 0) + 기존 `noHardcodedStyle` 가드 통과 |
| IMG-AC-21 | `kit/art.test.tsx` "스위치 꺼짐 = 미디어 요소 0" (9변형 전부 svg·img·[data-media] 0) — SPEC r2 4절 정정 1(꺼짐 = 요소 없음)의 L1 증거 |
| IMG-AC-22 | `render/protocol.test.ts` images 새 모양 + "IMG-AC-22: images 메타…" · `render/RenderApp.test.tsx` K4(URL 생성·해제 단언 불변) · `objectUrls.test.ts` 무변경 통과 |
| IMG-AC-26b(렌더 쪽) | `render/protocol.test.ts` "render{loading}…" · `kit/art.test.tsx` "내보내기 즉시 로드" · `render/RenderApp.test.tsx` "내보내기 이미지 decode 대기" 3개(decode 뒤 rects · 미리보기는 대기 0 · 실패 = error IMAGE_DECODE_FAILED + rects 0 · 대기 중 새 render = 앞 결과 버림) · `render/serializeSite.test.ts` "IMG-AC-26b: …lazy를 다시 붙인다" |
| IMG-AC-29 | `scripts/bundleBudget.test.mjs` "M2c 기준선 가드" 6개 (개정 전후 127.47·89.80 · 경계 123.03/123.04 · 89.70/89.71 · 출력 줄·다른 시나리오 불변 · 파일 없음/형식 틀림/없는 시나리오 = 실패 · 기준선 파일 값 고정) |

## 3. 번들 전후 (`npm run build` — `logs/build-start.txt` → `logs/build-3.txt`)
| 항목 | 시작 | 끝 | 판정 |
|---|---|---|---|
| `/studio` 진입 직후 | 127.36 | **127.36 (+0.00)** | ≤ 127.39 · 128 통과 |
| 렌더 문서 JS | 83.03 | **84.19 (+1.16)** | ≤ 89.70 멈춤선 통과 (SPEC 추정 +1~1.5 안) |
| 렌더 문서 CSS | 8.75 | **8.80 (+0.05)** | ≤ 30 |
- 중간(②) 빌드에서 `/studio` 진입 127.37(+0.01)을 봤다 — `readRenderMessage`에 코드 문자열을 더한 탓. ③에서 그 변경을 되돌려 +0.00(4절).

## 4. 목록 밖 테스트·결정 (멈춤 규칙 처리)
- **`RenderApp.test.tsx` K4 테스트**: SPEC 10절 grep에 안 걸린 목록 밖 파일. 입력 모양(`Blob` → `{blob,width,height}`)만 바꾸고 **단언은 하나도 바꾸지 않음** — IMG-AC-22 "URL 해제 규칙 유지" 그 자체. Codex 확인 대상.
- **`features/profile/compareFrameGuard.test.ts`(목록 밖)**: ②에서 `readRenderMessage`가 `IMAGE_DECODE_FAILED`를 읽게 바꾸자 "사본 텍스트 동일" 가드가 실패. 사본(`compareFrame.ts`)·단언을 바꾸지 않고 **원본 `readRenderMessage`를 c870439 텍스트로 되돌려** 깨짐 원인을 없앴다. 결과:
  - 렌더 문서는 decode 실패 시 `error{IMAGE_DECODE_FAILED}`를 보내고 rects를 보내지 않는다(SPEC 5.3-3 렌더 쪽).
  - **부모는 아직 이 코드를 읽지 않는다** → 지금 내보내기에서 decode 실패는 생성기 8초 시간 초과로 실패한다(조용히 빠뜨리지는 않음). "이미지를 그리지 못했습니다" 문구는 **M2C-4가 `readRenderMessage` + `compareFrame.ts` 사본을 함께 개정**해야 나온다.
- 시각 회귀 기준선: 그라디언트 → SVG로 픽셀이 바뀐다(의도된 변경). 재생성은 M2C-5 몫 — 이 레인은 기준선 파일 무접촉.

## 5. 설계 메모 (L3 판단)
- SVG는 바깥 `div.kit-art`(기존 레이아웃 class 그대로) 안에 `position:absolute; inset:0` — svg를 칸에 직접 두면 grid/aspect-ratio 칸에서 대체 요소 크기 규칙이 달라 hero·타일 크기가 바뀔 수 있어서. hero 패널(`kit-hero-copy` z-index 1)이 위에 그대로 남는다.
- 색: SPEC "primary | accent | ink | surface"에서 `--site-accent` 토큰이 없어 **`--site-muted`로 대체**(bg = surface · 1 = primary · 2 = muted · 3 = ink).
- 잃은 이미지 시드 = patternId 자리에 기본 무늬 `"diagonal"` — 로컬 id(UUID)는 시드에 넣지 않는다(문서 간 같은 변형 = 같은 그림 유지).
- 원본 크기는 kit `images`(URL 문자열 맵)를 바꾸지 않고 선택 prop `imageSizes`로 따로 넘긴다 — `drawDoc` 쓰는 킷 테스트 입력 불변. 쓰는 곳은 masonry뿐.
- decode 대기는 `loading:"eager"`일 때만 — 미리보기 lazy 이미지는 화면 밖에서 decode가 끝나지 않을 수 있어 캔버스 rects가 멈춘다.
- `serializeSite`: `fetchpriority` 없는 img에 `loading="lazy"` — hero는 Media가 늘 `fetchpriority="high"`를 붙이므로 그 표식으로 구분.

## 6. 검증 (fresh 실행)
- `npx vitest --run` → 217 files / **1897 passed**, exit 0 (`logs/full-after-3b.txt`) — 시작 1876 + ① 6 + ② 2 + ③ 13
- `npm run lint` exit 0 (`logs/lint-3.txt`) · `npm run build`(typecheck + vite 2회 + 예산) exit 0 (`logs/build-3.txt`)
- RED 로그: `logs/red-1-budget.txt`(6/6) · `logs/red-2-protocol.txt`(5 — 예측 5) · `logs/red-3-render.txt`(art.test 모듈 없음 + 6)
- Codex: 7절

## 7. Codex (2라운드 — 상한 안)
| 라운드 | 명령 | 결과 | 원문 |
|---|---|---|---|
| r1 | `review --scope branch --base c870439` | **지적 0** — typecheck 통과, Codex 샌드박스에선 Vitest EPERM으로 미실행 | `logs/codex-r1.txt` |
| r2 | `adversarial-review --scope branch --base c870439` + SPEC r2 정정 2문장 L1 확인 초점 | **approve · No material findings.** SPEC r2 정정 2문장 = 코드와 일치(text.ts 꺼짐 undefined · 두 Hero Media 생략 + --plain/--solo · 단색 패널·media/copy 분리). decode 대기·masonry·SVG 칸 채움 결함 없음. 주의: readRenderMessage가 IMAGE_DECODE_FAILED를 버림 → M2C-4가 송신(eager)·수신을 함께 연결 | `logs/codex-r2.txt` |
- 반영할 지적 없음. Vitest 실행 증거는 6절(이 레인 로컬 실행).

## 8. 한계·남은 일
- 부모 쪽 decode 실패 문구 · 내보내기 render에 images/`loading:"eager"` 싣기 · `pickVariant` = M2C-4.
- 보관소 → 캔버스 images 연결 = M2C-3 (지금도 제품에서 images 맵은 비어 있음 → 제품 화면 변화 = 빈 슬롯 그라디언트가 SVG로 바뀐 것뿐).
- 브라우저 실측(SVG 칸 채움·3안 비교 같은 그림·masonry 3폭) 0 — QB-6·7은 M2C-5. jsdom은 CSS 배치를 계산하지 않는다.
- SPEC r2 정정 2문장은 Codex r2에서 코드와 일치 확인(7절).
