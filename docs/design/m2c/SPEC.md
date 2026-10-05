# M2c 이미지 — 명세 (SPEC r3)

- 작성: Designer (Orca managed Claude Code · worktree `m2c-spec` · base `92f8e2f`) · 2026-10-05 · 브리프 `dev/active/m2c-spec/BRIEF.md`
- 상위: `docs/04-plan/DEVELOPMENT_PLAN.md` 19행(M2c = 토큰 기반 자체 그래픽 · 업로드 변환 · 산출물 동봉 · 종료 게이트 "F2 시안 등급") · TRD TR-SEC-04 · TR-POL-01 · R-09 · 8절 · ADR-004 개정 4 · 2a-05 SPEC 5.9(이미지 슬롯·보관소 — 이 SPEC이 이어받는다)
- 결정 대기: `docs/design/m2c/MQ-M2C.md`(MQ-C1~C8). 이 SPEC은 각 MQ의 ★추천안을 기준으로 쓴다 — 다른 안이 고르면 표시된 절만 바뀐다.
- 근거 표기: **[L1]** = 이 레인에서 파일·로그로 직접 확인 · **[L3]** = 설계 제안 · **[추정]** = 측정 전 값 · **[확인 필요]** = 실측·문서 대조가 남음.
- 원칙(ADR-003): 목업 모양 복제 금지. 기능·사용자 흐름 → 사용성 → DS 일관성 → 목업 순.

---

## 0. 지금 사실 (L1)

| 항목 | 현재 | 근거 |
|---|---|---|
| 이미지 슬롯 값 | `ImageSlotValue{kind, enabled, source, alt, decorative}` · `source` = 플레이스홀더 `{kind:"placeholder", patternId:"diagonal"}` 또는 로컬 id(UUID v4 소문자 — 브랜드 타입) | `app/src/engine/contracts/pageDoc.ts:33-59` · `engine/sections/defaults.ts:8-13` · `engine/validate/localImageId.ts:7` |
| 이미지 슬롯 위치 | hero `fullbleed-left`·`split`·`grid`·`image` = `image` · about `story` = `image` · portfolio `grid-3`·`masonry` = `image1~3`, `grid-2` = `image1~2` · footer `biz-extended-map` = `map` | `engine/sections/boundSections.ts:17,34-43` · `bodySections.ts:51-62` |
| 렌더 | `Media`: `images[source]` URL이 있으면 `<img>`(alt·장식 `""`·width/height = 비율값·hero eager+fetchpriority high·그 밖 lazy), 없으면 `div.kit-gradient aria-hidden` — `patternId`는 쓰지 않음 | `app/src/kit/Media.tsx:20-34` · `kit/kit.css:289-291` |
| 렌더 문서 전달 | 부모 → 렌더 `render{images?: Record<id, Blob>}` → 렌더 문서가 자기 object URL 생성·해제(`createObjectUrlCache`) | `render/protocol.ts:38` · `render/objectUrls.ts` · `render/RenderApp.tsx:59` |
| **업로드 경로** | **없음.** 편집 패널은 "이미지 슬롯 N개는 다음 단계에서 편집할 수 있습니다" 한 줄 · 이미지 보관소 코드 0 · `StudioLayout`이 캔버스에 images를 넘기지 않음 → 제품에서 images 맵은 늘 비어 있음 | `components/studio/EditFields.tsx:22,44` · `grep images components/studio/StudioLayout.tsx` = 0건 |
| 정적 HTML | 숨은 iframe(`sandbox="allow-scripts"`)에 그리고 serialize. **render 메시지에 images를 싣지 않음** → 지금 내보내기는 늘 그라디언트. `serializeSite`는 이미 `img[src^="blob:"]` → data URL 변환. 결과에 `blob:` 남으면 실패 · CSS 외부 요청 실패 | `features/studio/staticHtml/staticHtml.ts:90` · `render/serializeSite.ts:21` · `staticHtml/staticMarkup.ts:4,26,69` |
| PNG | SVG foreignObject → **data: URL** Image → canvas → PNG(blob: 쓰면 캔버스 오염) · 같은 `renderAndSerialize` 사용 → 지금은 이미지 0 | `features/studio/png/pngCapture.ts:4,56,117` |
| 내보내기 생성기 계약 | `ExportGenerator(input: {projectId, format, doc})` — 이미지 입력 없음 | `data/projectRepository.ts:126` |
| 슬롯 UI 설계 | 2a-05 SPEC 5.9: 스위치 · 대체텍스트(필수) · 장식 체크 · 파일 고르기 · 실패 문구 · **파일당 5MB · JPEG·PNG·WebP · SVG 불가 · 문서 12개·30MB · 탭 24개·60MB** · 참조 집합 기반 URL 해제 · 잃은 이미지(E-S20) · 탭 메모리 보관 캡션 | `docs/design/2a-05/SPEC.md:305-323` |
| 편집 패널 청크 | `EditFields`는 `StudioLayout`이 **정적 import → `/studio` 진입 청크** · 조작 뒤 청크 7개(docEngine·AddSectionDialog·VariantOptions·ContactOwnerNote·exportFlow·ExportAfter·pngCapture) | `StudioLayout.tsx:20` · `dev/active/m2b-d1/logs/jarvis-final/build.txt:150-157` |
| 예산 | `/studio` 첫 화면 91.79/100 · **진입 127.36/128**(절대 멈춤선 127.70 · 감지선 = 기준선 + 0.03 → **127.39**) · `/profile` 첫 99.62/100 · 렌더 문서 JS 83.03 / 멈춤선 89.70 · CSS 8.75/30 | `build.txt:139,150` · ADR-004 개정 4 82·84행 · `docs/design/m2b/SPEC-COMPARE3.md:213`(±0.03 감지선 선례) · m2b-5-spec REPORT 19행 |
| 시안 등급 | F1 = 실렌더 + 토큰 + 자체 플레이스홀더 · **F2 = F1 + 자체 그래픽/사용자 이미지 + 자체 호스팅 폰트 + 모션 프리셋 = MVP "최종 시안"** · 캔버스 캡션 F0/F1 문구는 `canvasCaption.ts` | `docs/00-research/buzz/claude-fable-r2.md:42-47` · m2a SPEC 561-569행 |

> 예산 수치 두 줄의 뜻(BRIEF "멈춤선 127.37" 정리): **127.70 = ADR 절대 멈춤선**, **기준선 + 0.03 = 레인 감지선**(m2b 관례 — 공유 청크 분할을 잡는 선). M2c 레인의 멈춤 조건은 **`/studio` 진입 증가 ≤ +0.03KB**(127.36 기준이면 ≤ 127.39). 둘 중 먼저 걸리는 쪽에서 멈춘다.

---

## 1. 범위

| 넣음 (M2c) | 뺌 |
|---|---|
| 편집기 이미지 슬롯 필드(2a-05 5.9 이어받기) + 업로드 검증·변환 | AVIF 인코딩(MQ-C5 ★제외) · 생성형 이미지(P2 플래그) · 외부 스톡 |
| 이미지 보관소(탭 메모리, MQ-C2 ★A) + 원본 비율 메타 | 새로고침 뒤 보존(IndexedDB — MQ-C2 B) |
| 자체 그래픽 = 토큰 기반 결정적 SVG(MQ-C6 ★A) | 초점(크롭 위치) 지정 UI · 이미지 편집(자르기·필터) |
| 정적 HTML·PNG에 이미지 동봉 | zip·`public/assets/*`·`srcset` 산출(M4 zip) |
| F2 캡션 문구 · 권리 안내(B-M2B-01) | hero/grid 여러 장(MQ-C7 ★M2c 뒤) · 영상 업로드(TR-SEC-04 50MB — 범위 밖) |

---

## 2. 업로드·변환

### 2.1 진입 위치
- **편집기 오른쪽 편집 패널의 이미지 슬롯** — 섹션을 고르면 그 섹션의 이미지 슬롯마다 한 묶음. 다른 진입(드래그 앤 드롭 캔버스·일괄 업로드)은 두지 않는다 [L3 — 이유: 슬롯과 대체텍스트를 한 자리에서 받아야 R-09가 빠지지 않는다].
- **예산 때문에 두 층으로 나눈다** (ADR-004 · 0절 "편집 패널 청크"):
  - **진입 층(진입 청크 · 증가 ≤ +0.03KB 목표):** 지금 한 줄 문구 자리를 "이미지 슬롯 N개 — [이미지 편집]" 버튼 1개로 바꾼다. 글자·버튼만, 새 로직 0.
  - **조작 뒤 층(`ImageSlotPanel` lazy 청크):** 버튼을 누르면 로드 — 스위치 · 미리보기 · 파일 고르기 · 대체텍스트 · 장식 체크 · 권리 안내 · 진행/실패 문구. 로드 중 = 버튼 `aria-busy` + "불러오는 중…", 청크 실패 = 기존 `chunkRetry` 경로.
  - **목업 차이 사유**(ADR-003): 2a-05 5.9는 패널 안에 바로 펼친다. 진입 여유가 0.34KB(멈춤선까지)뿐이고 섹션 선택만으로 자동 로드하면 "진입 직후 자동 로드"에 셀 위험이 있어(`check-bundle-size.mjs` 분류 [확인 필요]) **사용자 조작(버튼)으로만** 로드한다.
- 변환기(`imageIngest` — 2.3~2.6)는 **파일을 고른 순간** 동적 import하는 별도 청크. 패널 청크에도 넣지 않는다(패널만 열고 파일을 안 고르는 경우가 많다 [추정]).

### 2.2 슬롯 필드 (2a-05 5.9 유지 + 바뀐 점)
- 유지: 스위치 "이미지 사용"(`role=switch`) · 끄면 색 면/자체 그래픽 + R-09 제외 캡션 · 대체텍스트 `TextField`(켜짐 + 장식 아님이면 필수) · 장식 체크 · 잃은 이미지 상태(E-S20) · 탭 메모리 보관 캡션.
- 바뀜: 스위치 라벨은 슬롯 라벨을 쓴다(예: "대표 이미지 사용"·"사례 이미지 2 사용" — 엔진 `image(key, label)` [L1 `boundSections.ts:17`]) — "배경 이미지"는 hero 밖 슬롯에서 틀린 이름.
- 파일 버튼: `<input type="file" accept="image/jpeg,image/png,image/webp">` + 보이는 버튼 "이미지 고르기"(이미지 있으면 "다른 이미지로 바꾸기"). `capture` 속성 없음. 파일 이름은 **어디에도 저장·표시하지 않는다**(개인정보 — 카메라 파일명에 날짜·기기명) — 미리보기 옆은 "1600 × 1067 · WebP 184KB" 같은 결과 메타만.
- 대체텍스트는 파일 이름·EXIF로 미리 채우지 않는다(빈 칸 + 필수 표시).

### 2.3 허용 형식·검증 (TR-SEC-04) — 순서 고정, 앞 단계 실패면 뒤 단계 안 함
| # | 검사 | 규칙 | 실패 문구(필드 오류 `aria-invalid` + 설명 · 이전 이미지 유지) |
|---|---|---|---|
| V1 | 확장자 | `.jpg`·`.jpeg`·`.png`·`.webp`(대소문자 무시) | "JPEG·PNG·WebP 이미지만 쓸 수 있습니다" |
| V2 | MIME | `file.type` ∈ {`image/jpeg`,`image/png`,`image/webp`} — 빈 값이면 V3에 맡긴다(일부 OS) | 같음 |
| V3 | 매직 바이트(앞 16바이트) | JPEG `FF D8 FF` · PNG `89 50 4E 47 0D 0A 1A 0A` · WebP `52 49 46 46 ?? ?? ?? ?? 57 45 42 50` · **세 신호(확장자·MIME·매직)가 같은 형식을 가리켜야 통과** | 같음 (내부 사유 `TYPE_MISMATCH`) |
| V4 | 파일 크기 | ≤ **10MB**(MQ-C1 ★A = TR-SEC-04) | "10MB까지 쓸 수 있습니다 (12.4MB)" |
| V5 | 픽셀 수(**디코드 전 헤더**) | PNG IHDR · JPEG SOFn · WebP VP8/VP8L/VP8X에서 폭·높이 읽기 → 폭 × 높이 ≤ **40,000,000** · 한 변 ≤ 16,384 · 헤더를 못 읽으면 실패 | "4천만 화소까지 쓸 수 있습니다 (8000 × 6000)" / 못 읽음 = "이미지 파일을 읽을 수 없습니다" |
| V6 | 디코드 | `createImageBitmap(file, { imageOrientation: "from-image" })` — 실패면 끝 | "이미지 파일을 읽을 수 없습니다" |
- 압축 폭탄 방어는 V5가 맡는다 — 디코드 뒤 검사는 이미 메모리를 쓴 뒤라 방어가 아니다.
- SVG·GIF·HEIC·AVIF는 V1에서 거른다. HEIC: iOS Safari 파일 선택기가 `accept`에 HEIC가 없으면 JPEG로 바꿔 준다고 알려져 있음 [확인 필요 — 실기기 없음]. 움직이는 WebP는 첫 프레임만 쓴다(캔버스 그리기 결과) — 안내 없음 [L3].
- 문서·탭 한도(2a-05 5.9: 문서 12개·30MB · 탭 24개·60MB)는 **보관 바이트(변환 결과 합계)**로 잰다 — 입력 파일 크기는 V4만 본다(원본은 보관하지 않으므로 2.6).

### 2.4 재인코딩 — 폭 단계·포맷
- **폭 사다리: 640 · 1280 · 1920** (긴 변이 아니라 **가로 폭**) [L3 · Opus r2 174행 "3~4단" 중 3단 — 2048은 1280 프레임 × DPR 1.5까지 1920으로 덮인다 [추정]]. 원본 폭보다 큰 단계는 만들지 않는다(업스케일 0). 원본 폭이 1920 미만이고 단계와 다르면 **원본 폭 1단을 맨 위에 더한다**(예: 1500 → 640·1280·1500 · 500 → 500) — hero가 1280으로 깎이지 않게(r1 · Codex P2).
- 축소: `OffscreenCanvas`(없으면 `HTMLCanvasElement`)에 `drawImage` + `imageSmoothingQuality = "high"`. 큰 원본은 **반씩 단계 축소**(1/2씩 내려가며 마지막에 목표 폭) — 한 번에 1/4 이하로 줄이면 계단 현상 [추정].
- 캔버스 면적 한도: 모바일 Safari 캔버스 면적 상한이 40MP보다 낮을 수 있다 [확인 필요 — 공개 자료 수치 편차, 실기기 없음]. 대응: 디코드한 `ImageBitmap`을 `createImageBitmap(bitmap, {resizeWidth})`로 먼저 1920 이하로 줄인 뒤 캔버스에 올린다(큰 캔버스를 만들지 않는다). 그래도 실패하면 V6 문구.
- **포맷 결정(원본별 1회):**
  1. **알파 여부(헤더)**: PNG 색 유형 4·6 또는 `tRNS` 청크 · WebP VP8X 알파 플래그 또는 VP8L → "투명 있음". JPEG = 없음.
  2. 1순위 **WebP**(품질 0.82 [L3]). `canvas.toBlob(cb, "image/webp", q)` / `convertToBlob({type})` 결과 **`blob.type`이 `image/webp`가 아니면 미지원**으로 본다 — 미지원 형식 요청은 PNG로 조용히 떨어지는 동작 [확인 필요 — HTML 표준 동작, Safari 실측 없음]. Safari는 `toBlob('image/webp')` 미지원(Opus r2 174행, caniuse) [사실 — 2026-09-29 기준].
  3. 대체: 투명 없음 → **JPEG 0.85** · 투명 있음 → **PNG**(JPEG는 투명을 검게 만든다 — 금지).
  4. 감지 결과는 탭에서 1번만 재고 기억한다(첫 변환에서 1×1 시험 인코딩 [L3]).
- **EXIF 제거**: 캔버스 재인코딩 결과에는 메타데이터가 실리지 않는다 → TR-SEC-04 "EXIF 제거"를 이 경로가 충족. 방향(orientation)은 V6의 `imageOrientation:"from-image"`로 **재인코딩 전에 적용**된다 — 결과 이미지는 똑바로, 방향 태그 없음. 원본 비율 메타(3절)도 **방향 적용 뒤** 폭·높이.
- 색 공간: 캔버스 기본(sRGB). Display P3 원본의 색 차이는 받아들인다 [L3].

### 2.5 진행·실패 상태 (패널 안 · 라이브 영역 = 패널의 `role=status` 1개 재사용)
| 상태 | 보이는 글 | 읽기(낭독) |
|---|---|---|
| 검사·변환 중 | 미리보기 자리 스피너(모션 축소면 정지 아이콘) + "이미지를 준비하고 있습니다…" · 파일 버튼 `aria-disabled` | 시작 때 1회 "이미지를 준비하고 있습니다" |
| 완료 | 미리보기 + "1600 × 1067 · WebP 184KB" | "이미지를 넣었습니다" (대체텍스트가 비면 "대체텍스트를 적어 주세요"를 이어서) |
| 실패 | 2.3 문구 | 같은 문구(alert 아님 — 필드 오류) |
| 한도 초과 | 2a-05 5.9 문구 그대로 | 같음 |
| 변환 2초 넘김 | "큰 이미지라 시간이 걸리고 있습니다" 추가 [L3] | 1회 |
| 취소 | 변환 중 다른 파일을 고르면 앞 작업 결과는 버린다(마지막 선택만 반영) | — |
- 변환은 메인 스레드를 막지 않게 `OffscreenCanvas` 가능하면 Worker에서 [L3 — Worker 분리는 Developer가 실측 후 판단, 필수 아님]. 1장 변환 목표 ≤ 2초(12MP JPEG, 데스크톱 Chrome) [추정 — QB-5에서 실측].

### 2.6 원본·보관 (서버 0 전제)
- **원본은 보관하지 않는다.** 변환이 끝나면 `File`·`ImageBitmap` 참조를 놓는다(`bitmap.close()`). 원본 비공개(TR-SEC-04)는 "어디에도 남기지 않음"으로 충족 — 서버 전송 0.
- 보관소(MQ-C2 ★A = 탭 메모리, 2a-05 5.9 그대로): 로컬 id → `{ variants: {640?, 1280?, 1920?}: Blob, width, height, format, bytes }`. id 발급·비재사용·참조 집합 해제 규칙은 2a-05 5.9 그대로.
- 보관소는 `/studio` **조작 뒤 청크**(패널 청크와 함께 로드) — 진입 청크에 두지 않는다.

### 2.7 대체텍스트(R-09)
- R-09 판정은 지금 규칙 그대로(켜짐 + 장식 아님 + alt 빈 값 = 차단) — 게이트 줄 수·문구 변경 0.
- 자체 그래픽(이미지 없음)일 때는 alt를 읽지 않는다(m2a 0.9 · MQ-5 결정 유지) — 대체텍스트는 실제 이미지를 넣었을 때 쓰인다.
- 대체텍스트 도움말 한 줄: "이미지에 담긴 내용을 한 문장으로 적어 주세요. 꾸밈용이면 '장식 이미지'를 고르세요." [L3]
- **이미지가 바뀔 때 대체텍스트 (r3 결정 — B-M2C-08)**: 대체텍스트·장식 여부는 **그 이미지의 설명**이다. 다른 그림으로 넘어가면 비운다 — 남기면 이전 그림의 설명이 새 그림에 붙은 채 R-09 게이트가 "통과"로 보여 오류가 숨는다(WCAG 1.1.1).
  | 조작 (L1 `ImageSlotField.tsx`) | `alt` | `decorative` | 상태 문장(`role=status`) |
  |---|---|---|---|
  | **이미지 지우기**(`source` → 자체 그래픽) | `""` | `false` | "이미지를 지웠습니다 — 자체 그래픽으로 보입니다" |
  | **다른 이미지로 바꾸기**(Blob 있는 상태에서 새 파일 성공) | `""` | `false` | "이미지를 바꿨습니다 대체텍스트를 다시 적어 주세요" |
  | 첫 넣기(자체 그래픽 → 이미지) | 유지(이미지 전에 적어 둔 값 — 그 슬롯을 위해 쓴 글) | 유지 | 지금 그대로("이미지를 넣었습니다" · 빈 alt면 "…대체텍스트를 적어 주세요") |
  | 잃은 이미지 다시 고르기(`source` = 로컬 id · Blob 없음) | **유지**(2a-05 E-S20 "대체텍스트 보존" — 같은 그림을 다시 고르는 경우) | 유지 | 빈 alt 아니면 "이미지를 넣었습니다 대체텍스트가 맞는지 확인해 주세요" |
  | 실패·취소(형식·크기·한도·스위치 끄기) | 유지 | 유지 | 지금 그대로(이전 이미지 유지) |
  - 비우는 시점 = 새 이미지가 **문서에 들어가는 같은 편집 1회**(`setSlot` 한 번에 `source`·`alt`·`decorative`) — 실패하면 아무것도 비우지 않는다. 되돌리기 대상 아님(이미지 조작은 지금도 섹션 연산 되돌리기 밖).
  - 스위치 끄기(`enabled: false`)는 이미지·alt를 그대로 둔다(다시 켜면 그대로 — 2a-05 5.9 참조 집합 규칙과 같은 뜻).
  - 게이트 R-09 규칙·문구 변경 0. **바꾸기** 뒤에는 실제 이미지 + 빈 alt라 기존 규칙대로 "대체텍스트 필요" 차단이 다시 뜬다(의도). **지우기** 뒤에는 자체 그래픽이라 R-09 대상 밖(L1 `slotRows.ts` — 문자열 `source`만 판정) — 차단 없음. 지우기 초기화의 목적은 다음에 고를 이미지에 이전 설명이 따라가지 않게 하는 것이다(r3 Codex P2 반영).

---

## 3. 원본 비율 메타 (MQ-B3 이월 — SPEC-BODY 592·626행)

- **기록**: 보관소 항목의 `width`·`height` = 방향 적용 뒤 원본 픽셀 크기(2.4). 파생본 크기는 비율에서 계산.
- **위치(MQ-C4 ★A)**: 보관소 + 렌더 메시지. `PageDoc` 슬롯 값은 바꾸지 않는다(엔진 계약·`validatePageDoc` strict record 변경 0). 렌더 메시지 `images` 값을 `Blob` → `{ blob: Blob; width: number; height: number }`로 넓힌다(`render/protocol.ts` `isImages` 개정 — 프로토콜 변경, 엔진 계약 아님).
  - 근거: 보관소가 탭 메모리면 메타도 이미지와 같이 사라진다 — 문서에 남겨도 이미지가 없으면 쓸 데가 없다. IndexedDB(MQ-C2 B)를 고르면 보관소에 함께 저장해 여전히 문서 밖.
- **사용 규칙**:
| 자리 | 규칙 |
|---|---|
| portfolio `masonry` | **실제 이미지 칸 = 원본 비율**(가로/세로 비율을 **1:2 ~ 2:1로 자른 값**[L3] — 아주 긴 파노라마가 열을 무너뜨리지 않게) · 이미지 없는 칸 = 지금 고정 배열(1:1·16:9·4:5, SPEC-BODY 216행) 유지 |
| portfolio `grid-3`·`grid-2` · about `story` | 칸 비율 고정(지금 그대로) + `object-fit: cover` — 격자 정렬이 정보 |
| hero 4변형 | 프레임 비율 고정(지금 그대로) + cover · 가운데 기준. 초점 지정은 범위 밖 |
| footer `map` | 4:3 고정 + **`contain`** [L3 — 약도 글자가 잘리면 정보 손실] · 배경 = `--site-surface` 계열 토큰 |
| `<img width height>` | 원본 비율을 쓰는 칸(masonry) = 실제 메타 · 고정 칸 = 지금처럼 비율값 → 자리 이동(CLS) 0 유지 |

---

## 4. 자체 그래픽 — 토큰 기반 결정적 SVG (MQ-C6 ★A)

- **범위**: 켜진 이미지 슬롯 중 이미지가 없는 자리(플레이스홀더 · 잃은 이미지)의 `.kit-gradient`를 SVG로 바꾼다. **스위치 꺼짐 = 지금처럼 미디어 요소 자체가 없음**(`slotImage`가 꺼짐에 `undefined` → 변형이 `--plain`·`--solo` 배치로 그림 [L1 `kit/text.ts:10-13` · `HeroFullbleedLeft.tsx:14,20` · `HeroImage.tsx:15,19`]) — 변경 0. (r2 정정: r0·r1은 "꺼짐 = 색 면"이라 썼으나 실제 코드는 요소 없음 · 섹션 배경 토큰 면이 보인다.)
- **결정성**: 입력 = `(patternId, section.type, section.variant, slotKey)` 문자열 → FNV-1a 32비트 해시 → mulberry32 PRNG 시드. **같은 입력 → 같은 마크업 바이트.** `instanceId`·시각·`Math.random`·뷰포트 폭을 입력에 넣지 않는다(3안 비교에서 같은 변형은 같은 그림 — 차이는 토큰 색만).
- **모양**: 고정 `viewBox="0 0 100 100"` + `preserveAspectRatio="xMidYMid slice"` · 도형 3계열 중 해시로 1개 [L3]: ① 대각 띠(지금 `patternId:"diagonal"`과 이름 일치) ② 겹친 원 2~3개 ③ 점 격자 + 큰 원호. 도형 수 ≤ 12 · 좌표는 소수 1자리로 반올림(직렬화 바이트 고정).
- **색**: 속성에 색 값을 쓰지 않는다. 도형마다 class `kit-art-1`~`kit-art-3`, 배경 `kit-art-bg` → `kit.css`에서 `fill: var(--site-primary | --site-accent | --site-ink | --site-surface)` 계열 토큰만 [L1 `.kit-gradient`가 `--site-primary`·`--site-ink` 사용]. hex 0 → `noHardcodedStyle` 가드 통과(hex·px 정규식 [L1 `test/noHardcodedStyle.test.ts:24-29`] — viewBox·좌표 숫자는 px가 아니라 걸리지 않음). 대비: 그래픽은 정보가 아니라 R-08 대상 아님. 글자는 미디어와 다른 격자 칸(`kit-hx-band` · `grid-template-areas: "media" "copy"`)이거나 **단색 패널 위**(`kit-hero-panel` 배경 `--site-primary` · 글자 `--site-on-primary`)에 있어 그래픽·사용자 사진의 밝기와 무관하다 [L1 `kit/kit.css:301-329` · `HeroImage.tsx:16`] (r2 정정: r0·r1의 "오버레이 유지" 문장은 존재하지 않는 오버레이를 가정 — 삭제). 규칙: M2c는 글자를 미디어 위에 겹치는 배치를 새로 만들지 않는다.
- **접근성**: `<svg aria-hidden="true" focusable="false">` · 글자·`<title>` 0 · 외부 참조(`href`·`url(#)`의 외부 문서·`<image>`·`<use href="외부">`) 0. 그라디언트 정의가 필요하면 문서 안 `id`는 해시 접두어로 충돌 방지(같은 페이지에 여러 장) — 단 **정의 없이 단색 도형만**을 기본으로 한다 [L3 — id 충돌·직렬화 문제 회피].
- **위치**: 렌더 문서 킷 코드(`kit/`)에만 — 앱 진입 청크 증가 0. 예상 렌더 JS +0.6~1.2KB · CSS +0.2KB [추정] (멈춤선까지 6.67KB 여유).
- **정적 HTML·PNG**: 인라인 SVG라 data: 변환·외부 요청 없음 — 지금 경로 그대로 실린다.

---

## 5. 산출물 동봉

### 5.1 이미지 전달 경로 (sandbox 유지)
- 미리보기 캔버스: `StudioLayout` → `StructureCanvas images` → render 메시지 `images`(3절의 넓힌 모양). 경로는 이미 있다 [L1] — 보관소 연결만 새로.
- 정적 HTML·PNG 생성기: **`ExportGenerator` 계약(`{projectId, format, doc}`)은 바꾸지 않는다.** 생성기를 만드는 팩토리에 의존성 `readImage(id) → { variants: Record<폭, Blob>; width; height } | undefined`(**파생본 전부** — r1 · Codex P2)를 주입하고, 부모가 아래 선택 규칙으로 id마다 Blob 1장을 골라 `renderAndSerialize`가 render 메시지에 **그 문서가 쓰는 id만**(`docImageIds` 재사용 [L1 `render/objectUrls.ts:10`]) 실어 보낸다 [L3 — 저장소 계약 변경 회피. 팩토리 위치는 Developer가 L1 확인].
- iframe은 **`sandbox="allow-scripts"`만** — `allow-same-origin` 추가 금지(지금 가드 유지). Blob은 postMessage 구조화 복제로 넘어가고, 렌더 문서가 자기 object URL을 만든다(지금 방식).
- 어떤 파생본을 싣나(**동봉 폭**): 슬롯별 최대 표시 폭 × 2(DPR) 이상인 가장 작은 단계, 원본 폭 상한 [L3]:
| 슬롯 | 최대 CSS 폭(1280 프레임 기준) [추정 — Developer 실측] | 동봉 단계 |
|---|---|---|
| hero `fullbleed-left`·`image` | 1280 | 1920 |
| hero `split`·`grid` · about `story` | ≤ 640 | 1280 |
| portfolio 칸 · footer `map` | ≤ 420 | 640 → 실측 640 미만이면 640, 넘으면 1280 |
- **선택 규칙(`pickVariant(variants, target)` — 순수 함수, r1):** 목표 폭 = 그 id를 쓰는 슬롯들의 동봉 단계 중 **가장 큰 값**(같은 이미지를 hero와 갤러리에 같이 쓰면 hero 기준). 있는 후보 중 목표 이상인 가장 작은 폭, 없으면 **가장 큰 후보**. 후보가 하나도 없으면 잃은 이미지(5.2). 테스트: 500폭 원본 → hero·갤러리 모두 500 · 1500폭 → hero 1500 · 갤러리 640 · 같은 id 두 슬롯 → 큰 쪽.
- 미리보기 캔버스도 같은 규칙으로 id당 1장만 보낸다(렌더 문서 메모리 절약 · 산출물과 같은 픽셀).

### 5.2 정적 HTML (단일 파일)
- `serializeSite`가 이미 `blob:` → data URL로 바꾼다 [L1]. 결과 규칙(blob: 0 · 외부 요청 0 · script 고정 1개)은 그대로 — 새 규칙: **`<img src>`는 `data:image/(webp|jpeg|png);base64,`만 허용**(그 밖 스킴 = 실패).
- **`srcset`은 넣지 않는다 (결정 — MQ 아님).** 근거: 단일 파일에서는 후보가 모두 data:로 들어가 **파일이 후보 수만큼 커지고, 내려받기 절약은 0**(브라우저는 이미 다 받은 상태). `srcset`·`sizes`·`public/assets/*`·AVIF/WebP 이중 제공은 **zip 내보내기(M4)**에서 — TRD 8절 "AVIF/WebP + srcset"의 적용 지점은 M4로 기록.
- **크기**: 이미지 1장 data: ≈ 파생본 × 1.33. 예: 1920 WebP 사진 ≈ 250~450KB · 1280 ≈ 120~250KB · 640 ≈ 40~90KB [추정 — 품질 0.82, 사진 내용에 크게 좌우]. 이미지 12장(hero 1 + 나머지 11) 최대 ≈ 3~4MB + 폰트 ≈ 0.72MB(Pretendard 2굵기 실측 538KB × 1.33 [L1 SPEC-MOTION-FONT 299-300행]) → **HTML 1개 ≈ 4~5MB 상한대** [추정].
- 크기 처리(MQ-C3 ★A): **차단하지 않고 결과 화면에 크기 표시** — "HTML 1개 · 4.2MB (이미지 9장 포함)". 3MB를 넘으면 한 줄 안내 "메일 첨부에는 클 수 있습니다 — zip 내보내기는 다음 단계에서 지원합니다" [L3]. 폰트 예산(≤ 900KB woff2)과 이미지 크기는 **따로** 잰다(이미지 상한 없음 — MQ-C3 B·C 참조).
- 잃은 이미지(보관소에 Blob 없는 로컬 id — **편집기를 떠났다 앱 안에서 돌아옴** 뒤에 생긴다(2a-05 E-S20). 스냅샷 복원은 지금 미구현(L1 `memoryProjectRepository.ts` `restoreSnapshot` = missing) — 구현되면 같은 상태가 생길 수 있다. 새로고침은 해당 없음 — 프로젝트·문서까지 사라진다, r3 정정): **차단하지 않고 자체 그래픽으로 넣고 결과에 개수 표시** — "이미지 2장을 다시 골라야 해 자체 그래픽으로 넣었습니다" [L3 — PNG `fallbackCount` 선례 L1 `pngCapture.ts:95-118`]. 결과 해시는 실제 바이트 기준(지금 그대로).

### 5.3 PNG
- 같은 `renderAndSerialize` → 같은 data: 마크업 → SVG foreignObject 안 `<img src="data:…">`. data: 이미지는 SVG-as-image 안에서도 로드된다고 알려짐(외부 자원만 차단) [확인 필요 — IMG-AC-B4 실측]. 캔버스 오염 0 유지(`blob:` 0).
- PNG 파일 메타·이름의 `fallbackCount` 규칙에 **잃은 이미지 수를 더하지 않는다**(폴백 = 렌더러 없는 섹션 뜻 유지) — 결과 캡션에만 5.2와 같은 문장 [L3].
- 결정성: 같은 문서·같은 보관소 Blob → 같은 PNG 높이(M2B-D1 높이 결정성 수정 유지).
- **내보내기 렌더의 이미지 대기 (r1 · Codex P1)** — 정적 HTML·PNG 공통. 숨은 iframe은 화면 밖이라 `loading="lazy"` 이미지는 요청이 시작되지 않을 수 있고, `decode()`는 lazy 로딩을 강제로 시작하지 않는다(HTML 표준 `img.decode()`) → 그대로 기다리면 8초 `JOB_TIMEOUT`.
  1. 내보내기 render 메시지에 `loading: "eager"`(선택 필드 · 미리보기는 안 보냄)를 싣는다 → `Media`가 모든 `<img>`를 즉시 로드로 그린다.
  2. 렌더 문서는 그린 뒤 모든 `img.decode()`를 `Promise.allSettled`로 기다리고 **그다음** rects를 보낸다. 대기 상한 = 생성기 남은 시간 안(별도 타이머 없음 — 전체 8초 상한이 끊는다).
  3. decode 실패 1장 이상 = 내보내기 실패 "이미지를 그리지 못했습니다"(조용히 빠뜨리지 않음 — 우리가 변환한 Blob이라 드묾 [추정]).
  4. 대기 중 새 render 메시지 = 앞 대기 결과 버림(마지막 render만 rects).
  5. `serializeSite` 복사본에서 hero 밖 `<img>`에 `loading="lazy"`를 다시 붙인다 — 내보낸 HTML은 지금과 같은 로딩 속성.
  - 테스트: 화면 밖 iframe 모의에서 갤러리·지도 이미지 포함 문서가 시간 안에 rects를 보냄(IMG-AC-26b).

### 5.4 캔버스 캡션 — F2 (m2a 569행 이월, MQ-C8 ★A)
- F2 조건 = 모든 섹션 실렌더 + 폰트 자체 호스팅 + 모션 프리셋(M2b 완료 [L1 BRIEF]) + **이미지 슬롯이 사용자 이미지 또는 자체 그래픽**(M2c로 항상 참).
- 문구 ★A: **"시안 (F2) — 프로필의 색·글자·글꼴·모션과 고른 이미지 또는 자체 그래픽으로 그린 페이지입니다."** 잃은 이미지가 있으면 끝에 " 다시 골라야 하는 이미지 N장은 자체 그래픽으로 보입니다." [L3]. "최종"은 붙이지 않는다(게이트·발행 F3 전 — MQ-C8 B 참조).

---

## 6. 보안·권리

| 항목 | 규칙 |
|---|---|
| TR-POL-01 경계 | 생산 스키마(DesignReference · SectionDefinition.provenance · DesignProfile)에는 **이미지 필드 0 유지** — 업로드는 사용자 문서(`PageDoc`)의 **로컬 id**로만 들어간다. 로컬 id = UUID v4만(blob:·data:·URL 거부 [L1 `localImageId.ts:7`]). 문서·스냅샷·저장 요청·계측에 Blob·data URL·파일 이름 0 |
| 원본 비공개 | 원본 미보관(2.6) · 서버 전송 0 · 파생본은 탭 메모리 · 내보낸 파일에만 data:로 들어감(사용자가 직접 받은 파일) |
| 업로드 검증 | 2.3 V1~V6 · SVG 불가(스크립트 벡터) · 디코드 전 픽셀 검사 |
| 렌더 격리 | `sandbox="allow-scripts"`만 유지 · 렌더 문서 object URL은 렌더 문서 안에서만 |
| 계측·로그 | 파일 이름·크기 원값·EXIF 로그 금지. 실패 사유 코드(`TYPE_MISMATCH`·`TOO_LARGE`·`TOO_MANY_PIXELS`·`DECODE_FAILED`·`LIMIT`)만 |
| 권리 안내(패널 상시 한 줄) | "직접 찍었거나 사용 권리가 있는 이미지만 넣어 주세요." [L3] |
| 지도 슬롯(B-M2B-01) | `map` 슬롯에만 추가 한 줄: "지도 서비스 화면을 캡처해 쓰면 그 서비스 약관을 따라야 합니다 — 직접 그린 약도나 사용 허락을 받은 지도를 권장합니다." [L3 — 서비스별 약관 판단은 법무 [확인 필요]] |
| 생성형·외부 스톡 | 0(이 SPEC 범위 밖) |

---

## 7. 예산 배치 (ADR-004 개정 4 — 상향 없음)

| 코드 | 청크 | 예상 증가 [추정] | 판정 |
|---|---|---|---|
| 편집 패널 "[이미지 편집]" 버튼(문구 교체) | `/studio` 진입 | +0.00~0.03 | **≤ +0.03 (감지선)** |
| `ImageSlotPanel`(스위치·필드·안내·상태) + 보관소 | 조작 뒤(버튼) | +2~4 | 판정 밖 — 보고만 |
| `imageIngest`(검증·헤더 파서·재인코딩) | 조작 뒤(파일 선택) | +2~3 | 판정 밖 — 보고만 |
| 캔버스 images 연결(`StudioLayout` → `StructureCanvas`) | `/studio` 진입 | 보관소 조회 몇 줄 → **보관소 모듈 자체는 진입에 import 금지**(구독은 lazy 패널이 등록) | ≤ +0.03에 포함 |
| 생성기 `readImage` 주입 | 조작 뒤(exportFlow·pngCapture) | +0.1~0.3 | 판정 밖 |
| 자체 그래픽 SVG · masonry 원본 비율 · 프로토콜 `isImages` | 렌더 문서 JS/CSS | JS +1~1.5 · CSS +0.3 | 89.70 / 30 안 |
| F2 캡션 문구 | `/studio` 진입(`canvasCaption.ts`) | +0.02~0.05 | **감지선 위험** — 문구 길이 실측 후 조정 |
- **멈춤 규칙**: 각 Developer 레인은 시작 때 시제품 1개로 실측, 레인 끝 예상이 `/studio` 진입 +0.03 또는 127.70을 넘으면 **구현 전에 멈추고 보고**. 상향 요청은 ADR-004 개정 4 결정 3대로 **`/studio` 진입 청크 구조 점검 레인 결과와 함께만** — 이 SPEC은 상향을 요청하지 않는다.
- 진입 증가가 감지선을 넘는 경우의 대안(상향 전 순서): ① 캡션 문구를 F2 조건에서만 lazy 사전(문구 표) 로드 ② `EditFields` 이미지 줄을 패널 청크 쪽으로 이동 ③ 그래도 넘으면 구조 점검 레인 → MQ.

---

## 8. 수용 기준 (IMG-AC)

표기: **[U]** 단위·컴포넌트(Vitest) · **[G]** 가드 테스트 · **[B]** 브라우저 실측(QA).

### 8.1 업로드·변환
| ID | 기준 | 종류 |
|---|---|---|
| IMG-AC-01 | V1~V3: 확장자·MIME·매직 바이트 3신호 일치만 통과 — `.png` 이름의 JPEG 바이트 · MIME 빈 값 + 올바른 매직 · SVG · GIF · HEIC fixture 각각 기대 결과 | [U] |
| IMG-AC-02 | V4 10MB 경계(10MB 통과 · 10MB+1B 실패 문구에 소수 1자리 MB) | [U] |
| IMG-AC-03 | V5 헤더 파서: PNG IHDR · JPEG SOF0/SOF2 · WebP VP8/VP8L/VP8X 폭·높이 · 40MP 경계 · 한 변 16,384 경계 · 잘린 헤더 = 실패 — **디코드 함수가 호출되지 않음**을 스파이로 확인 | [U] |
| IMG-AC-04 | 폭 사다리: 원본 3000폭 → {640,1280,1920} · 1500폭 → {640,1280,1500} · 500폭 → {500} · 업스케일 0 | [U] |
| IMG-AC-05 | 포맷: `toBlob` 모의가 `image/webp` 반환 → WebP · `image/png` 반환(미지원 모의) + 투명 없음 → JPEG · 투명 있음(PNG 색 유형 6 · tRNS · WebP VP8X 알파) → PNG | [U] |
| IMG-AC-06 | EXIF 제거: 자체 제작 fixture(EXIF APP1 + GPS 태그 포함 JPEG) 변환 결과 바이트에 `Exif\0\0`·`eXIf`·GPS 태그 0 | [U]+[B] |
| IMG-AC-07 | 방향: 자체 제작 방향 태그 6 fixture(세로 사진) → 결과 폭 < 높이 · 메타 width/height도 방향 적용 뒤 | [B] (jsdom은 디코드 불가 — [U]는 옵션 전달만 확인) |
| IMG-AC-08 | 실패 시 이전 이미지·문서·보관소 불변 · 필드 `aria-invalid` + 설명 연결 · 문구 2.3 그대로 | [U] |
| IMG-AC-09 | 변환 중 다른 파일 선택 → 마지막 선택만 반영 | [U] |
| IMG-AC-10 | 원본 미보관: 변환 뒤 보관소 항목에 원본 Blob·File·파일 이름 없음 · `bitmap.close()` 호출 | [U] |
| IMG-AC-11 | 한도는 보관 바이트로: 2a-05 5.9 문서 12개·30MB · 탭 24개·60MB 문구·기록 비움 규칙 그대로 — 2a-05 E-AC-45~47(a3, **아직 미구현** [L1 `docs/design/2a-05/SPEC.md:745`])을 이 레인에서 구현·통과 | [U] |

### 8.2 슬롯 필드·접근성
| ID | 기준 | 종류 |
|---|---|---|
| IMG-AC-12 | 진입 층: 이미지 슬롯 있는 섹션 = "[이미지 편집]" 버튼 1개 · 누르기 전 패널·변환 청크 요청 0 | [U]+[B] |
| IMG-AC-13 | 스위치 라벨 = 슬롯 라벨 · 대체텍스트 필수 · 장식 체크 시 alt 입력 `aria-disabled` + 이유 · R-09 판정 줄 수 변화 0 | [U] |
| IMG-AC-14 | 상태 낭독: 시작 1회 · 완료 1회 · 실패 = 필드 오류(alert 0) | [U] |
| IMG-AC-15 | 파일 이름이 DOM·보관소·문서·계측 어디에도 없음 | [U]+[G] |
| IMG-AC-16 | 권리 안내 한 줄(모든 이미지 슬롯) + 지도 안내(`map`만) | [U] |
| IMG-AC-30 | (r3 · B-M2C-08) 2.7 표: 지우기·바꾸기 성공 = 한 번의 편집으로 `alt` `""`·`decorative` `false` + 표의 상태 문장 / 첫 넣기·잃은 이미지 다시 고르기·실패·스위치 끄기 = `alt`·`decorative` 유지 / 바꾸기 뒤 게이트 R-09 차단 재표시 · 지우기 뒤 그 슬롯은 R-09 대상 밖(차단 0) | [U] |

### 8.3 비율·자체 그래픽·렌더
| ID | 기준 | 종류 |
|---|---|---|
| IMG-AC-17 | masonry: 실제 이미지 칸 비율 = 메타 비율을 1:2~2:1로 자른 값 · 이미지 없는 칸 = 고정 배열 · `<img width height>` = 메타 | [U] |
| IMG-AC-18 | hero·grid·about = 고정 비율 cover · map = contain | [U] |
| IMG-AC-19 | 자체 그래픽 결정성: 같은 입력 2회 렌더 → 마크업 바이트 동일 · `instanceId`만 다른 두 섹션 → 동일 · slotKey 다르면 다를 수 있음 | [U] |
| IMG-AC-20 | 자체 그래픽: `aria-hidden="true"` · `focusable="false"` · 글자 0 · `href`/`<image>`/외부 url 0 · 색 속성 0(class만) | [U]+[G] |
| IMG-AC-21 | 스위치 꺼짐 = 미디어 요소 0(SVG·img·그라디언트 모두 없음) · `--plain`/`--solo` 배치 유지 | [U] |
| IMG-AC-22 | 프로토콜 `images` 새 모양 검증(`{blob,width,height}` · 잘못된 값 거부) · 렌더 문서 URL 해제 규칙 유지 | [U] |

### 8.4 산출물
| ID | 기준 | 종류 |
|---|---|---|
| IMG-AC-23 | 정적 HTML: 쓰는 이미지가 `data:image/(webp|jpeg|png);base64,`로 들어감 · `blob:`·http(s) 이미지 0 · `srcset` 0 · 동봉 단계 = 5.1 표 | [U] |
| IMG-AC-24 | 잃은 이미지 = 자체 그래픽 + 결과 문구 개수 · 내보내기 차단 0 | [U] |
| IMG-AC-25 | 결과 화면 크기 표시 · 3MB 초과 안내 | [U] |
| IMG-AC-26b | 내보내기 render = `loading:"eager"` · 모든 decode 뒤 rects · decode 실패 = 실패 문구 · 대기 중 새 render = 앞 결과 버림 · 직렬화 결과의 hero 밖 img = `loading="lazy"` | [U] |
| IMG-AC-26 | PNG: 이미지 포함 캡처에서 캔버스 오염 0(toBlob 성공) · 이미지 decode 뒤 높이 결정 · 같은 입력 5회 같은 높이 | [B] |
| IMG-AC-27 | sandbox 속성 = `allow-scripts`만(렌더·숨은 iframe 전부) — 기존 가드 유지 | [G] |
| IMG-AC-28 | F2 캡션 문구 · 잃은 이미지 문장 조건 | [U] |
| IMG-AC-29 | 예산: `/studio` 진입 증가 ≤ +0.03 · 렌더 JS ≤ 89.70 · CSS ≤ 30 · 조작 뒤 청크 크기 보고. **지금 검사기는 128·90만 강제한다**(Codex r1 P2 — 127.50·89.80이 통과) → M2C-2가 `app/scripts/`에 **M2c 기준선 파일(시작 실측값) + 허용 +0.03 · 렌더 JS 멈춤선 89.70을 실패 조건으로** 추가 · 새 lazy 청크(패널·변환기)를 조작 뒤로 분류 | [G](`check-bundle-size` 개정) |

---

## 9. QA 블록 (QB) — 브라우저 실측

- 이동 규칙: **앱 안 클릭으로만** 이동(새로고침·주소 직접 입력 금지 — 메모리 store가 비어 **프로젝트·문서까지** 사라진다). 잃은 이미지 검사(QB-10)도 앱 안 클릭으로 만든다(r3 정정 — B-M2C-03).
- 실측 환경 한계(B-M2B-09): Ego Lite는 렌더 정지 이력 · **Safari·Firefox 실측 환경 없음** → Safari WebP 미지원은 `toBlob` 모의 단위 테스트(IMG-AC-05)로만 보증, 실기기 확인은 [확인 필요]로 남긴다. 모바일 Safari 캔버스 면적 한도·HEIC 변환도 같음.
- fixture: **자체 제작만**(캔버스로 만든 패턴 이미지 + 직접 붙인 EXIF/방향 태그). 외부 스톡·크롤링 0.

| QB | 내용 |
|---|---|
| QB-1 | 이미지 편집 버튼 → 패널 로드(네트워크 탭에서 패널 청크가 버튼 뒤에 요청) → 파일 선택 → 변환 청크 요청 |
| QB-2 | JPEG(12MP)·PNG(투명)·WebP 각 1장 → 미리보기·메타 글·캔버스 반영 · 투명 PNG 결과가 PNG(Chrome에서는 WebP 알파 — 결과 형식 기록) |
| QB-3 | 실패 5종(형식 위장·11MB·41MP·잘린 파일·SVG) 문구·이전 이미지 유지 |
| QB-4 | 방향 6 fixture 똑바로 · 결과 파일에서 EXIF 0(내려받은 HTML의 data:를 디코드해 바이트 검사) |
| QB-5 | 12MP 변환 시간(목표 ≤ 2초 [추정]) · 변환 중 편집기 입력 반응 |
| QB-6 | masonry 원본 비율(가로·세로·파노라마 → 2:1 자름) · 3폭(1280·768·390) |
| QB-7 | 자체 그래픽: 3안 비교에서 같은 변형 같은 그림 · 토큰 색만 다름 · 스크린리더 무시 |
| QB-8 | 정적 HTML 이미지 9장: 로컬에서 열어 외부 요청 0(네트워크 탭) · 캔버스와 같은 모양 · 크기 표시 |
| QB-9 | PNG 이미지 포함 3폭 · 5회 같은 높이 |
| QB-10 | (r3 정정) 이미지 2장 넣기 → 툴바 "프로젝트"(앱 안 링크, `/projects`) → 같은 프로젝트 편집기로 다시 들어가기 → 잃은 이미지 상태(필드 "이미지를 다시 골라 주세요" · 캔버스 자체 그래픽 · F2 캡션 "다시 골라야 하는 이미지 N장") → 정적 HTML·PNG 내보내기 = 자체 그래픽 + 개수 문구. [경로는 L1 코드 읽기 — 브라우저 미실측]. 스냅샷 복원 경로는 미구현이라 QB에서 뺀다 — 구현되면 "이미지 A 넣기 → 스냅샷 저장 → A 지우기·다른 편집으로 보관소에서 해제 → 그 스냅샷 복원" 순서로 추가(r3 Codex P2) |
| QB-11 | 키보드만: 버튼 → 스위치 → 파일 → 대체텍스트 → 장식, 포커스 링·낭독 |
| QB-12 | 예산 로그(`npm run build`)를 REPORT에 |

---

## 10. 깨질 기존 테스트 (L1 — `grep -rl 'data-media\|kit-gradient\|다음 단계에서 편집\|renderAndSerialize('` 결과)

| 테스트 | 이유 | 처리 |
|---|---|---|
| `kit/HeroText` · `kitCommon` · `PortfolioGallery` · `HeroCenter` · `heroVariants` · `HeroGrid` · `HeroImage` · `AboutStory` · `HeroSplit` · `FooterBizExtendedMap` · `HeroFullbleedLeft` `.test.tsx` (11개) | `data-media="gradient"`·`kit-gradient` 기대 → SVG(`data-media="art"` 제안)로 바뀜 · masonry 비율 | 기대값 개정(테스트 뜻 유지 — "이미지 없음 = 장식 그래픽 aria-hidden") |
| `components/studio/EditFields` 관련 테스트 | "다음 단계에서 편집" 문구 → 버튼 | 개정 |
| `render/protocol.test.ts` | `images` 값 모양 변경 | 개정 + IMG-AC-22 추가 |
| `staticHtml`·`pngCapture`·`serializeSite` 테스트 | render 메시지에 images 추가 · data: 이미지 허용 규칙 | 개정 + IMG-AC-23~26 |
| `canvasCaption.test.ts` | F2 문구 | 개정 |
| `test/renderedVariants.test.ts`·시각 회귀 기준선(M2B-6) | 그라디언트 → SVG로 픽셀 변경 | 기준선 재생성(QA 레인) — **의도된 변경으로 기록** |
- 위 목록 밖에서 깨지면 Developer가 멈추고 원인 보고(뜻이 바뀌는 개정 금지).

---

## 11. 대상 브라우저·한계
- 실측: 데스크톱 Chrome(Ego Lite / aside) 1종. Safari·Firefox·모바일은 **모의(단위 테스트)만** — `toBlob` WebP 미지원 · `OffscreenCanvas` 부재 · `createImageBitmap` 옵션 미지원(`imageOrientation`·`resizeWidth`)에 대한 대체 경로를 각각 단위 테스트로 보증한다. 대체 경로 동작의 실기기 확인은 [확인 필요]로 BACKLOG에 남긴다.
- `createImageBitmap` 옵션 미지원 시: `resizeWidth` 없음 → 캔버스 단계 축소 · `imageOrientation` 없음 → 브라우저 기본(최신 브라우저는 CSS `image-orientation: from-image`가 기본 [확인 필요]) — 방향이 틀리면 QB-4에서 잡는다.

## 변경 이력
| 판 | 내용 |
|---|---|
| r0 | 초안 (M2C-0) |
| r2 | Designer 정정(**Codex 미검토**): 4절 스위치 꺼짐 = 요소 없음(색 면 아님) · 4절 대비 문장(존재하지 않는 오버레이 가정 삭제 — 글자는 별도 칸·단색 패널) · IMG-AC-21 |
| r3 | 2026-10-06 M2C-SPECFIX(B-M2C-03 · B-M2C-08, 코드 0): QB-10 전제 정정(새로고침 → 앱 안 편집기 이탈·복귀 — 2a-05 E-S20 · L1 `StudioLayout.tsx:282~283` images = 편집 틀 state · 문서 = 모듈 수준 메모리 저장소) · 5.2 잃은 이미지 생기는 경우 · 9절 이동 규칙 · 2.7 이미지 교체·지우기 때 대체텍스트 초기화 + IMG-AC-30 · Codex adversarial r1 P2 2건 반영(지우기 뒤 R-09 대상 밖 · 스냅샷 경로 미구현 표시, 원문 `dev/active/m2c-specfix/codex-adv-r1.txt`). 보관 방식 재론(MQ-C2 B)은 `docs/design/m2c-specfix/MQ.md` MQ-S1. |
| r1 | Codex adversarial 1라운드 4건 반영: 내보내기 이미지 eager + decode 대기(5.3 · IMG-AC-26b) · `readImage` = 파생본 전부 + `pickVariant` 규칙 · 원본 폭 단계 추가(2.4 · IMG-AC-04) · 예산 가드 자동화(IMG-AC-29) — 원문 `dev/active/m2c-spec/logs/codex-adv-r1.txt` |
