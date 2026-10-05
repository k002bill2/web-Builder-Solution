# M2C-1 REPORT — 이미지 변환기(imageIngest 순수 모듈)

- 레인: Developer · worktree `m2c-1` · 브랜치 `k002bill2/m2c-1` · base `c870439` · 서브에이전트 0 · 서버 기동 0 · main 5480 무접촉 · push/merge/삭제 0
- 쓰기 경로: `app/src/features/studio/images/ingest/**`(신규) · `dev/active/m2c-1/` 만. package*.json·lock·CLAUDE.md·docs/design·docs/decisions 변경 0(`git diff --stat c870439` 확인).

## 1. 결과 요약
- 공개 API(PLAN 2절 그대로): `ingestImage(file: File, deps?) → Promise<{ok:true; image:{variants, width, height, format, bytes}} | {ok:false; code; detail?}>` — `ingest/index.ts`에서 export. 추가 export: `ingestErrorMessage(failure)`(SPEC 2.3 문구) · `browserIngestDeps`·`IngestDeps`·`IngestBitmap`(주입 경계).
- 검사 순서 V1→V6 고정, 앞 단계 실패면 뒤 단계 안 함. V1~V5는 디코드 전(헤더), V6 = `createImageBitmap(file, {imageOrientation:"from-image"})`.
- **번들 변화 0**: 어디서도 import하지 않음 → build 전후 dist 93개 파일 sha256 완전 동일(`logs/dist-baseline.sha256` ↔ `logs/dist-final.sha256`, diff 0). /studio 진입 127.36 · 렌더 JS 83.03 · CSS 8.75 그대로.

## 2. 파일
| 파일 | 내용 |
|---|---|
| `types.ts` | 공개 타입(PLAN 2절) |
| `fileType.ts` | V1 확장자 · V2 MIME(빈 값 = V3에 맡김) · V3 매직 16바이트 · 3신호 일치 · V4 10MB · MB 표기 |
| `header.ts` | V5 디코드 전 헤더 파서: PNG IHDR(+tRNS 청크 걷기) · JPEG SOFn(세그먼트 길이로 걷기, 채움·RST/TEM 처리, C4·C8·CC 제외) · WebP VP8/VP8L/VP8X · 40MP · 한 변 16,384 · 알파 판정 |
| `ladder.ts` | 폭 사다리 640·1280·1920 + 원본 폭 단(<1920) · 업스케일 0 · 파생본 높이 |
| `format.ts` | WebP 0.82 → 대체 JPEG 0.85 / 투명이면 PNG · WebP 감지 = 1×1 시험 인코딩 `blob.type` 판정, 인코더(키)마다 1회 메모(WeakMap) |
| `deps.ts` | 브라우저 주입 경계 + 기본 구현(OffscreenCanvas → 없으면 HTMLCanvasElement, 호출 시점에만 전역 접근) |
| `ingestImage.ts` | 조립: V1~V6 · 큰 폭부터 반씩 단계 축소(`createImageBitmap` resize, `resizeQuality:"high"`) · 단마다 재인코딩 · 모든 bitmap close(성공·실패) |
| `messages.ts` | SPEC 2.3 실패 문구 |
| `fixtures/imageBytes.ts` | **자체 제작 fixture 생성기**: PNG(색 유형·tRNS·eXIf) · JPEG(SOF0/SOF2·APP1 EXIF 방향·GPS·APP2 채움) · WebP(VP8/VP8L/VP8X 알파) · GIF·SVG·HEIC 서명 · `insertExifApp1`(QA가 캔버스로 만든 실 JPEG에 태그를 붙여 [B] 실측용) |

## 3. IMG-AC ↔ 테스트
| AC | 테스트 | 종류 |
|---|---|---|
| 01 | `fileType.test.ts` V1(통과 4 · 거부 4) · V2·V3(MIME 빈 값 통과 · .png 이름의 JPEG · MIME 불일치 · SVG/GIF/HEIC/HEIC→.jpg · 매직 4) · `ingestImage.test.ts` "V1 실패(GIF)…디코드 호출 0" | [U] |
| 02 | `fileType.test.ts` V4(10MB 통과 · 10MB+1B 실패 "10.0MB" · 문구 "10MB까지 쓸 수 있습니다 (12.4MB)") · `ingestImage.test.ts` "V4 실패…디코드 호출 0" | [U] |
| 03 | `header.test.ts` PNG·JPEG(SOF0·SOF2·EXIF+60KB APP2 뒤 SOF)·WebP 3종 · 잘린 헤더 null · 40MP·16,384 경계 · 0 크기 · `ingestImage.test.ts` "V5 실패…디코드 함수 호출 0(스파이)" · "잘린 헤더 = DECODE_FAILED · 호출 0" | [U] |
| 04 | `ladderFormat.test.ts` 3000/1500/500/1920/1280/640/1 → 사다리(업스케일 0) · `ingestImage.test.ts` 3000폭 → {640,1280,1920} | [U] |
| 05 | `ladderFormat.test.ts` 포맷 4조합 · 감지(webp/png 반환 · 1회 메모) · `header.test.ts` 알파(PNG 4·6·tRNS · VP8X 플래그 · VP8L) · `ingestImage.test.ts` 미지원 인코더 + JPEG → jpeg · + RGBA PNG → png | [U] |
| 06 | `ingestImage.test.ts` "EXIF 제거" ×2(JPEG APP1+GPS · PNG eXIf+GPS, 500폭 = 축소 없음에도 재인코딩 · 원본 File을 인코더/결과에 넘기지 않음 · 결과 바이트 `Exif\0\0`·`eXIf`·GPS 태그 0x8825 = 0) | [U] — [B]는 아래 한계 |
| 07 | `ingestImage.test.ts` "방향": 디코드에 `imageOrientation:"from-image"` 전달 · 메타·사다리 = 디코드(방향 적용 뒤) 크기(헤더 300×200 → 결과 200×300) | [U](옵션 전달) — [B]는 아래 한계 |
| 10 | `ingestImage.test.ts` "원본 미보관"(모든 bitmap close · 결과에 File·파일 이름 0) · "인코딩 실패 = DECODE_FAILED · bitmap 모두 close" | [U] |
| (추가) | 반씩 단계 축소(16,000폭 → 매 단계 ≥ 절반 · `resizeQuality:"high"`) · 기본 deps import 시 전역 무접촉 | [U] |

- TDD 이력(예측 → RED → GREEN, 로그 `logs/stageN-{red,green}.log`):
  | 단계 | 예측(새 테스트 · RED 실패) | 실제 RED | GREEN(누적) |
  |---|---|---|---|
  | 1 V1~V4 | 24 · 13 | 13 실패 · 11 통과 | 24 |
  | 2 헤더 | 21 · 14 | **16 실패** · 5 통과(차이 2 = 상수 단언을 예측에서 빠뜨림 · 테스트 변경 없음) | 45 |
  | 3 사다리·포맷 | 16 · 15 | 15 · 1 | 61 |
  | 4 조립 | 15 · 14 | 14 · 1 | 76 |
- 단언 약화·skip 0.

## 4. meta(결정·정의)
- `bytes` = 파생본 Blob 크기 합계(보관 바이트) — SPEC 2.3 문서·탭 한도(30MB·60MB)의 기준.
- `width`·`height` = 디코드(방향 적용) 뒤 원본 픽셀 크기. V5 화소 검사는 헤더 값(회전해도 곱·한 변 결과 같음).
- `variants` 키 = 가로 폭(640·1280·1920 또는 원본 폭 1단). 모든 단이 같은 형식.
- 10MB = 10 × 1024 × 1024 바이트(명세·TRD에 단위 없음 · 앱에 MB 관례 없음 → 너그러운 쪽). 문구 MB도 같은 단위, 소수 1자리.
- 헤더 못 읽음 · 디코드 실패 · 인코딩 실패(형식 불일치 포함) = `DECODE_FAILED`("이미지 파일을 읽을 수 없습니다").
- 축소는 캔버스 `drawImage` 배율 대신 `createImageBitmap(bitmap, {resizeWidth, resizeHeight, resizeQuality:"high"})`로 반씩 하고 캔버스는 1:1로만 그린다 — SPEC 2.4 "큰 캔버스를 만들지 않는다"(모바일 Safari 면적 한도)와 반씩 축소를 한 경로로 충족. 캔버스 최대 = 1920폭.
- WebP 감지 실패(시험 인코딩 예외)는 미지원으로 보고 그 인코더에 대해 기억한다(탭 동안 JPEG/PNG).

## 5. 한계·남은 일
- **IMG-AC-06 [B]·07 [B] 미실측**: jsdom은 디코드·캔버스 인코딩을 못 한다. 이 모듈은 아직 어디서도 import되지 않아 앱 안 클릭으로 닿을 경로가 없고(브라우저 검증 규칙 = 앱 안 이동), 서버 기동도 하지 않았다. → M2C-3 연결 뒤 M2C-5 QA가 `insertExifApp1`로 방향 6·GPS 태그를 붙인 자체 제작 JPEG로 실측.
- Worker 분리 안 함(SPEC 2.5 "필수 아님") · 변환 시간(≤2초 목표) 미측정 — QB-5.
- 취소(마지막 선택만 반영, IMG-AC-09)·UI 오류(08)·한도(11)는 M2C-3 범위. 변환기는 `File`을 받아 결과만 돌려준다(취소는 호출 쪽이 결과를 버림).
- 큰 원본 축소는 `createImageBitmap` resize 옵션에 기댄다 — 미지원 브라우저면 DECODE_FAILED(대상 브라우저 표 SPEC 11절 확인 필요).

## 6. 검증 명령(최종 1회 · 로그 `logs/final-*.txt`)
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npx vitest run` exit 0(220 파일 · 1952 테스트) · `npm run build` exit 0
- dist sha256 비교: `diff logs/dist-baseline.sha256 logs/dist-final.sha256` → 차이 0
- Codex: 아래 7절
