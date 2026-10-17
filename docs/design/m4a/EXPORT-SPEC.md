# M4-a EXPORT-SPEC — 내보내기 완성 명세 (정적 zip · LICENSES · 금지 패턴 · 링크 검사)

- 작성: Designer (M4-a-0) · 2026-10-18 · r1 (r0 초안 + 미확인 4건 grep 확인 · 전송 방식 질문화 · APPNOTE 대조)
- 범위: 정적 HTML 단일 파일(현행) · **정적 zip(신규)** · PNG(현행). React zip은 M4-b(영환님 결정 3)라 형식 자리만 다룬다.
- 영환님 결정(2026-10-18, `dev/active/rs8-roadmap-status/REPORT.md` 5절): ① `/studio` 진입 증분 0(늘면 개정 18 재상신) ② zip = 무압축 store 자체 작성·의존성 0 ③ React zip = M4-b ④ 4.3 원장 폐기 ⑤ axe 보류 ⑥ BACKLOG 정리는 Jarvis.
- 병렬 스파이크 `m4a-zip-spike`(Developer, 측정 전용) 결과는 이 문서의 입력이 아니다 — r1에서 Jarvis가 합친다. 이 문서에서 "스파이크 확인"으로 표시한 값은 그 결과로 확정한다.
- 근거 표기: **[사실]** = 코드·문서 직접 확인(L1) · **[추정]** = 코드 읽기 기반 판단(L3) · **[미확인]** = 측정·관찰 필요.

---

## 0. 현재 상태 (근거)

| 항목 | 현행 | 근거 |
|---|---|---|
| 형식 타입 | `ExportFormat = "react-zip" \| "static-html"` | [사실] `app/src/data/projectRepository.ts:94` |
| 내보내기 버튼 | 진입 청크에 버튼 2개 — "React 프로젝트(zip) 내보내기"(생성기 없음 → informative 안내) · "정적 HTML 내보내기" | [사실] `components/studio/ExportButtons.tsx:10-13` · `ExportAfter.tsx:60-63` |
| PNG | 내보내기 묶음 다음 별도 자리, `requestExport` 밖, 게이트 무관 | [사실] `components/studio/PngSave.tsx:23` |
| 흐름 | 검사 재계산 → 차단이면 멈춤 → 경고면 확인 대화상자 → 저장 먼저 → `requestExport` 1회 → 잡 조회(250ms × 40) | [사실] `features/studio/useExportFlow.ts:11-14` · `exportFlow.ts:65-75` |
| 생성기 | 숨은 렌더 iframe(`sandbox="allow-scripts"`) 렌더 → serialize → `buildStaticHtml` → Blob object URL + SHA-256 앞 12자 | [사실] `staticHtml/staticHtml.ts:1-5,158-178` |
| 이미지 | 렌더 문서가 serialize 때 `blob:` → data URL로 바꿔 markup에 넣는다 | [사실] `render/serializeSite.ts:18-20` |
| 메시지 상한 | `HTML_MAX` 8,000,000자 — 넘으면 html 메시지 폐기 → 시간 초과(B-M2C-01). **판정은 부모 쪽**(조작 뒤 청크 `renderAndSerialize`가 `readHtmlMessage` 호출) | [사실] `render/htmlMessage.ts:1-8` · `staticHtml.ts:94` · `docs/06-handoff/BACKLOG.md:22` |
| 렌더 문서 이미지 표 | 렌더 문서는 id → {blob, objectURL} 표를 들고 있다 | [사실] `render/objectUrls.ts:28` |
| 글꼴 | 쓰는 계열 1개 × 굵기 ≤ 2를 data: `@font-face`로 인라인 · `<head>` 주석에 OFL 고지 | [사실] `staticHtml/siteFontEmbed.ts:47-56,88-95` |
| 파일 이름 | `exportFileStem` (NFC·금지 문자 `-`·40 코드 포인트·예약 이름) → `<stem>_r<rev>.html` | [사실] `staticHtml/exportFileName.ts` |
| 3MB 안내 | "메일 첨부에는 클 수 있습니다 — zip 내보내기는 다음 단계에서 지원합니다" | [사실] `exportFlow.ts:60-62` |
| 금지 패턴 | 아래 4.1 표 | [사실] `staticHtml/staticMarkup.ts:1-5` |
| 링크 | 킷이 만드는 링크 = 같은 문서 앵커 `#s-<instanceId>`뿐(CTA = 첫 contact → footer, 메뉴 = heading 일치 섹션). 외부 URL·`mailto:`·`tel:` 0건 | [사실] `kit/text.ts:23-37` · `grep "https?:|mailto:|tel:" app/src/kit` 0건 |
| 게이트 | 8줄(대비 AA·대체텍스트·헤딩 순서·필수 섹션·모션 예산·SEO 메타·글자 수·성능 예산). 계산 = `gateCheck`(`/studio` **auto** — 예산 판정 안) · 표시 = `gateView`(진입) | [사실] `gateView.ts:10-19` · `scripts/check-bundle-size.mjs:131-138` |
| 예산 분류 | `exportFlow.ts`·`ExportAfter.tsx`·`pngCapture.ts` = `STUDIO_AFTER_ACTION`(크기만 출력, 판정 밖) | [사실] `scripts/check-bundle-size.mjs:58-70` |

### 0.1 범위 밖 (한 줄씩)

- **B-M2C-09 ③**(캔버스 픽셀 대조) — 이 SPEC 범위 밖. 4.1 3뷰포트 스크린샷 게이트 레인에서 다룬다.
- **TRD:277 산출물 성능 예산**(초기 JS ≤ 90KB · CSS ≤ 30KB gzip · 폰트 ≤ 2계열 등) — zip이 생기면 측정 가능해지지만 이번 범위 밖. 게이트 "성능 예산" 줄(현재 "측정 전")로 넘긴다.
- React zip(FR-PUB-02 · TR-SEC-06 의존성 허용 목록) — M4-b.

---

## 1. 형식 체계

### 1.1 형식 3개

| 형식 | 무엇 | 언제 쓰나 (안내 문장 원천) | 게이트 | `requestExport` |
|---|---|---|---|---|
| **정적 사이트(zip)** — 신규 · ★기본 | `index.html` + `assets/` + `LICENSES.md` 묶음 | 호스팅에 올리거나 개발자에게 넘길 때. 이미지가 파일로 분리돼 큰 문서도 된다 | 적용(차단 0일 때만) | 예 |
| **HTML 파일 1개** — 현행 | 이미지·글꼴을 모두 안에 넣은 `.html` 1개 | 메일·메신저로 바로 보내 열어 볼 때. 이미지가 많으면 무거워진다 | 적용 | 예 |
| **PNG** — 현행 | 지금 미리보기 폭의 페이지 전체 이미지 1장 | 시안 공유·보고용. 사이트로 동작하지 않는다 | 미적용(현행 유지) | 아니오 |

### 1.2 고르는 방식 — ★버튼 분기(대화상자 없음)

- ★ **A. 버튼 분기(권장)**: 현 `ExportButtons`의 버튼 2개 자리를 그대로 쓴다. 1번 = "정적 사이트(zip) 내보내기"(새 형식 `static-zip`), 2번 = "HTML 파일 1개 내보내기"(`static-html`). React zip 버튼은 M4-b까지 **목록에서 빼는 것을 권장**(지금은 누르면 "생성기 연결 후" 안내만 나오는 자리 — 같은 칸을 정적 zip이 쓴다). 제품에 보이는 결정이라 Q18로 확인.
  - 이유: ① 진입 청크 변경 = `FORMATS` 배열의 글자·형식 키뿐 — 버튼 수 동일, 새 부품 0 [추정: 수십 B 이하 증감, 스파이크/구현 실측]. ② 대화상자 방식은 클릭이 1번 늘고, 대화상자를 진입 청크에 두면 증분이 생기며 조작 뒤 청크에 두면 청크 로드 대기가 한 번 더 생긴다. ③ 기존 흐름(검사 → 경고 확인 → 저장 먼저 → 1회 요청)이 형식만 바꿔 그대로 재사용된다.
  - 각 버튼 아래 한 줄 설명(1.1 "언제 쓰나")은 **넣지 않는다**(진입 글자 증분). 설명은 결과 Callout(조작 뒤 청크)에서만 — 설계 질문 Q2.
- B. 대화상자(대안): 버튼 1개 "내보내기…" → 조작 뒤 청크 대화상자에서 형식 라디오 + 설명. 진입 증분은 버튼 글자 감소로 0 이하 가능하나 클릭 +1·로드 대기 +1. 형식이 3개 이상(React zip 복귀) 될 때 재검토.
- 기본값: 버튼 순서 = zip 먼저(위) — Q18. 마지막 선택 기억은 하지 않는다(저장 상태 증가 · YAGNI).
- PNG는 지금 자리(`PngSave`, "이미지로 저장" 머리) 그대로 — 사이트 형식이 아니라 따로 둔다.

### 1.3 형식 키

- `ExportFormat`에 `"static-zip"` 추가. `"react-zip"` 키는 타입에 남긴다(M4-b · 저장 잡 기록 호환). [사실] 잡 기록이 `format`을 저장한다(`projectRepository.ts:112-114`).
- 생성기 등록 = 정적 HTML과 같은 전역 심볼 슬롯 방식으로 `static-zip` 슬롯 1개 추가(`exportFlow.ts:33` 패턴). [사실] memoryDocBook은 `format === "static-html" && load`일 때만 슬롯 생성기를 쓰고(`memoryDocBook.ts:188`), 저장된 잡의 형식을 `isFormat`(`:121` — 리터럴 2개)으로 검증한다 → `static-zip`을 **두 곳 모두**에 넣어야 한다(빠뜨리면 저장된 zip 잡 기록을 다시 읽을 때 형식 불일치로 버려진다 [추정 — isFormat 실패 시 처리 경로는 구현 때 확인]).
- 계측 이벤트 `export_requested`·`export_succeeded`의 `format` 리터럴 타입(`editorEvents.ts:9-10`)에도 추가 [사실].

---

## 2. zip 구성

### 2.1 파일 트리 (zip 루트 기준, 상위 폴더 없음 — Q3)

```
index.html
LICENSES.md
assets/
  fonts/<Family>-<weight>.woff2      예: KitSansKR-400.woff2 · KitSansKR-700.woff2 (쓰는 계열 1 × 굵기 ≤ 2 · 허용 3계열 Pretendard·Kit Sans KR·Kit Serif KR [사실 `kit/fonts.css:1`]) — Q19
  images/img-<NN>.<webp|jpg|png>     예: img-01.webp · img-02.jpg (NN = 2자리, 문서 첫 등장 순)
```

- 그 밖 파일 0개(4.3 허용표가 막는다). 디렉터리 항목(이름이 `/`로 끝나는 entry)은 넣지 않는다 — 압축 해제 도구가 경로로 만든다 [추정 — macOS 보관 유틸리티·Windows 탐색기 실측은 QA].
- CSS·고정 메뉴 스크립트는 `index.html` 안 `<style>`·`<script>` 1개씩(현행 `buildStaticHtml`과 같은 모양). ★ 별도 `assets/site.css`로 빼지 않는다 — 재사용 최대·검사 대상 단순(Q4).
- zip 안 경로는 **ASCII만**(UTF-8 이름 플래그 불필요 → 해제 도구별 한글 깨짐 위험 0). 사용자 글자(프로젝트 이름)는 zip **파일 이름**에만 들어간다.

### 2.2 이미지 분리 규칙 (data URI → 파일 경로)

1. 목표 = `index.html`의 `img src`가 `assets/images/img-NN.ext` 상대 경로, 바이트는 파일 entry. `srcset` 0(현행 단일 후보 규칙 유지 — srcset은 RS8 "의도적 제외").
2. 고르는 바이트 = 현행 `exportImages`(id당 1장 · 목표 폭 = 그 id를 쓰는 슬롯 중 최대 · `pickVariant`) 그대로 [사실] `exportImages.ts:26-40`. 같은 id를 여러 슬롯이 쓰면 파일 1개.
3. 번호 = 문서 섹션 순서 → 슬롯 순서에서 id가 처음 나온 순서(01부터). 99장 초과 시 3자리(`img-100`) — 현 이미지 상한(≤ 64, `htmlMessage.ts:7` 주석)으로는 발생하지 않는다 [사실].
4. 확장자 = Blob `type`: `image/webp`→`webp` · `image/jpeg`→`jpg` · `image/png`→`png`. 그 밖 type = 생성 실패(업로드 3신호 검증이 이미 막는다 [사실 RS8 REPORT:10]).
5. **전송 방식 — 두 안 비교(Q17)**. 상한 판정이 부모 쪽이라 [사실 0.표] 두 안 모두 B-M2C-01을 풀 수 있다:

   | | (a) 상한 상향 + 부모 분리 | ★(b) 참조 직렬화 |
   |---|---|---|
   | 방식 | 렌더 문서는 지금처럼 data URL로 직렬화. 부모가 형식별 상한(zip = 이미지 보관 한도 기준, 예: 48,000,000자)으로 받고 `img src` data URL을 디코드해 파일로 뗀다 | serialize 요청에 표식(예: `images: "ref"`)을 주면 렌더 문서가 `blob:`을 data URL 대신 **이미지 id 표식**(예: `data-export-image="<id>"`)으로 바꿔 보낸다. 부모는 id → 파일 경로, 바이트는 자기가 가진 Blob(2번)을 쓴다. 렌더 문서는 id → objectURL 표를 이미 가진다 [사실 `objectUrls.ts:28`] |
   | 렌더 문서 변경 | 0 (`render.html` 예산 무관) | 있음 — serialize 분기 → 렌더 문서 JS 예산(≤ 90KB, `check-bundle-size.mjs:7`) 판정 대상 [미확인 — 스파이크] |
   | 메모리·시간 | 30MB 이미지 → base64 ≈ 40MB 문자열 왕복(iframe 쪽 FileReader·postMessage 복제·부모 디코드) [추정] | markup이 이미지 크기와 무관(수십~수백 KB) · 이미지 바이트는 부모 Blob 그대로 |
   | 방어선 | 불투명 출처 iframe 메시지 상한이 느슨해진다(상한은 Codex 지적으로 둔 방어선 — 주석 `htmlMessage.ts:7`) | 상한 8M 그대로 유지 |
   | 단일 HTML | 상한 상향만으로 함께 해소(data URL 그대로 사용) | 부모가 id → data URL 주입으로 바꾸면 함께 해소(경로 1개 — Q5) |

   ★(b) 이유: 방어선 유지 · 큰 문자열 왕복 0 · 바이트 출처가 부모 Blob 하나로 합쳐진다. 렌더 문서 예산 증분이 스파이크에서 문제로 나오면 (a)로 바꾼다.
6. 잃은 이미지(보관소에 없음) = 현행대로 파일 없이 렌더 문서 자체 그래픽 · 결과 줄 개수 안내(`lostImageText`) [사실 `exportImages.ts:21`].

### 2.3 파일 이름

- zip 파일: `<stem>_r<revision>.zip` — `exportFileStem` 계승(NFC·금지 문자·40 코드 포인트·`page`·예약 이름) [사실 `exportFileName.ts`]. `staticZipFileName` 신설(형식만 다름).
- HTML 1개: 현행 `<stem>_r<revision>.html` 유지.
- zip 안 이름은 2.1 고정 규칙 — 사용자 글자 0.

### 2.4 zip 바이트 규칙 (무압축 store · 의존성 0)

APPNOTE 6.3.10 기준(출처 7절). 필수 필드만:

| 항목 | 값 |
|---|---|
| 압축 방식 | 0 (stored) — 이미지(WebP/JPEG/PNG)·woff2는 이미 압축본 [사실 RS8 REPORT:11] |
| 구조 | [local file header + 파일 바이트] × N → central directory header × N → end of central directory record |
| 서명 | local `0x04034b50` · central `0x02014b50` · EOCD `0x06054b50` (리틀 엔디언) |
| version needed | 10 (1.0 Default — APPNOTE 4.4.3.2. 디렉터리 entry는 2.0이라 넣지 않는 것과 맞물린다) |
| general purpose bit | 0 (경로 ASCII라 bit 11 불필요 · 크기를 미리 알아 data descriptor bit 3 불필요) |
| CRC-32 | APPNOTE 4.4.7: 초기값 `0xFFFFFFFF` · 결과 1의 보수 · magic residue `0xDEBB20E3`. 다항식 = 표준 reflected `0xEDB88320`(APPNOTE 본문엔 다항식 표기 없음 — 일반 구현 관례 [추정 L2]) · 파일마다 · 이미지 Blob은 `arrayBuffer()`로 읽어 계산 |
| 시각 | MS-DOS 날짜·시각(1980 기준 · 2초 단위 — APPNOTE 4.4.6). ★ 그 revision 문서의 `updatedAt`(같은 revision → 같은 값 → 같은 결과 해시, Q6). 로컬 시각 변환·초 내림 |
| ZIP64 | 쓰지 않는다 — APPNOTE 4.3.7: 크기가 `0xFFFFFFFF`를 넘을 때 ZIP64. entry < 65,535 · 파일·전체 < 4GiB를 상한(2.5)이 보장 |
| entry 순서 | `index.html` → `LICENSES.md` → `assets/fonts/*`(이름순) → `assets/images/*`(번호순) — 결정적 |
| 결과 | Blob(`application/zip`) object URL + 결과 바이트 SHA-256 앞 12자(현행 해시 규칙) |

- 메모리: zip Blob은 `new Blob([헤더, 이미지Blob, ...])`로 조립 — 이미지 바이트 복사는 CRC 계산용 1회 [추정 — 스파이크가 30MB 문서 시간·메모리 실측].

### 2.5 크기 상한·초과 안내

- 입력 상한이 이미 있다: 이미지 보관 30MB [사실 BACKLOG:22] · 글꼴 ≤ 2면(각 ≈ 172~176KB [사실 `site-fonts/kit-sans-kr/SOURCE.md`]) · markup(참조 직렬화 후 이미지 무관). 따라서 zip ≈ 30MB + 1MB 안팎이 실제 상한 [추정].
- ★ `ZIP_MAX` = 64MB(64 × 1024 × 1024 B) — 넘으면 생성 실패(non-retryable, 4.0 상태 "용량 초과"). 정상 입력으로는 닿지 않는 안전망(Q7).
- 안내(차단 아님): 결과 줄 "zip 1개 · {n}MB (이미지 {k}장 · 글꼴 {f}개)". 단일 HTML 3MB 초과 안내 문장은 "메일 첨부에는 클 수 있습니다 — 정적 사이트(zip)는 이미지를 파일로 나눠 담습니다"로 바꾼다(문안 Hemingway — 키 `export.note.htmlLarge`). 지금 문장의 "다음 단계에서 지원합니다"는 거짓이 되므로 반드시 교체.

---

## 3. LICENSES.md 문안 구조 (문안은 Hemingway — 구조·필수 필드만)

- 형식: Markdown, UTF-8, 고정 순서. **결정적**(같은 입력 → 같은 바이트 — 생성 시각·사용자 이름 0). 사용자 글자 0(프로젝트 이름도 넣지 않는다 — Q8).

| 순서 | 절 | 필수 필드 | 원천 |
|---|---|---|---|
| 1 | 머리 | 제목 1줄 · 이 묶음의 구성 요약 1줄(파일 수) | 생성기 고정 문장 |
| 2 | 글꼴 (쓰는 계열마다 1절 — 현재 1개) | 계열 이름 · 파일 경로 목록(`assets/fonts/*`) · 원본 글꼴(Modified Version 고지) · 저작권 문장 · 라이선스 이름 `SIL Open Font License 1.1` · Reserved Font Name 고지 · **라이선스 전문**(OFL.txt 원문) | `siteFontEmbed.ts` `COPYRIGHT` 표 [사실 :48-54] · `assets/site-fonts/<family>/OFL.txt` [사실] |
| 3 | 이미지 — 사용자 업로드 | 파일 경로 목록(`assets/images/*`) · "이 이미지는 사이트를 만든 사용자가 올린 것이며 권리는 올린 사람에게 있다" 취지 고지 · 앱은 권리를 주장하지 않음 | 생성기 고정 문장 + 파일 목록 |
| 4 | 그래픽 — 자체 생성 | 이미지가 없거나 잃은 슬롯의 자체 그래픽(인라인 SVG·CSS) 고지 · 사용 조건(Q9 결정 문장) | 생성기 고정 문장 |
| 5 | 코드·스타일 | `index.html` 안 CSS·메뉴 스크립트 = 생성기 산출물 · 사용 조건(Q9와 같은 결정) · 서드파티 코드 0 고지(의존성 0) | 생성기 고정 문장 |

- 이미지 0장이면 3절은 "올린 이미지 없음" 1줄. 잃은 이미지가 있으면 4절에 개수 1줄.
- OFL 조건 2(저작권 고지 + 라이선스 전문 동봉) = 2절이 충족. `index.html` `<head>` 주석은 ★ 전문 대신 "Fonts: SIL OFL 1.1 — see LICENSES.md" 1줄로 줄인다(zip 경로만 · 단일 HTML은 현행 전문 주석 유지 — 파일이 하나뿐이라).
- 브랜드: LICENSES.md에 제품 이름(`brand.name`)을 넣을지 = Q10. ★ 넣지 않는다("이 사이트 생성 도구"처럼 일반 명사) — 산출물에 제품 브랜드 0 원칙을 4.4와 같이 유지.

---

## 4. 금지 패턴 검사 확장

### 4.1 현 정적 HTML 검사 (대조 기준) [사실 `staticMarkup.ts`]

| # | 규칙 | 현행 처리 | zip 경로 |
|---|---|---|---|
| F-01 | 사이트 루트 1개(`data-site-root`, body 자식 1) | 실패 | 같음 |
| F-02 | 폴백·킷 표식(`data-fallback`·`data-kit-marker`) | 실패 | 같음 |
| F-03 | `script`·`iframe`·`object`·`embed` | 제거 | 같음 |
| F-04 | `on*` 속성 | 제거 | 같음 |
| F-05 | `data-*` 중 킷이 안 쓰는 것 | 제거 | 같음 |
| F-06 | `details[open]` | 제거 | 같음 |
| F-07 | 고정 스크립트(`STATIC_MENU_SCRIPT`) 외 script | 결과에 1개만 | 같음 |
| F-08 | `blob:` (URL 속성·style 속성·style 요소) | 실패 | 같음 |
| F-09 | `img src` = `data:image/(webp\|jpeg\|png);base64,`만 · `srcset` 0 | 실패 | **바뀜**: `src` = `^assets/images/img-\d{2,3}\.(webp\|jpg\|png)$`만 · data: img 0 · srcset 0 |
| F-10 | CSS `@import` · `url()`이 data: 아님 | 실패 | **바뀜**: `url()` = `data:` 또는 `^assets/fonts/[A-Za-z]+-\d{3}\.woff2$`만 · `@import` 0 |

### 4.2 신규 검사 (두 형식 공통 — 생성기 안, 조작 뒤 청크)

| # | 규칙 | 처리 | 비고 |
|---|---|---|---|
| F-11 | `a[href]`는 `#`로 시작하는 같은 문서 앵커만 | 실패 | 외부 href 정책 = **전부 금지**(현행 킷이 만들지 않는다 [사실 0.표]). `http(s):`·`mailto:`·`tel:`·`javascript:`·`data:`·상대 경로 포함. 사용자 외부 링크 기능이 생기면 그때 허용 규칙을 새로 정한다(Q11) |
| F-12 | `#` 앵커 대상 `id`가 문서 안에 존재 | 실패 | 5절 링크 검사의 생성기 쪽 방어(게이트가 놓쳐도 결과에 깨진 링크 0) |
| F-13 | 그 밖 URL 속성(`src`·`href`·`poster`·`action`·`formaction`·`srcset`·`style url()`)의 외부 출처 | 실패 | [사실] 킷 문의 폼 `<form>`에 `action` 없음(`kit/ContactForm.tsx:78`) → 현행 결과는 통과. `action`·`formaction`은 값이 있으면 실패(외부·같은 문서 무관) |
| F-14 | 브랜드 문자열 | 실패 | **생성기 고정 부분에만**: `<head>` 주석·CSS·스크립트·클래스·`data-*` 이름·LICENSES.md. 대상 문자열 = `brand.name`·`apfs`(대소문자 무시)·`--apfs-`. **사용자 글자(본문·alt·title·description)는 제외** — 사용자 업종이 "디자인 스튜디오"일 수 있다 |
| F-15 | `<meta http-equiv="refresh">`·`<base>`·`<link rel=preload/prefetch>` 외부 | 실패 | `head`는 생성기가 처음부터 만든다(`head.replaceChildren()` [사실]) — 방어 단언 |

### 4.3 zip 파일 목록 허용표

| 경로 패턴 | 개수 | 내용 검사 |
|---|---|---|
| `index.html` | 정확히 1 | 4.1·4.2 전부 |
| `LICENSES.md` | 정확히 1 | F-14 · 3절 필수 절 존재 |
| `assets/fonts/[A-Za-z]+-\d{3}\.woff2` | 0~2 | 첫 4바이트 `wOF2` [사실 현행 서명 검사 `siteFontEmbed.ts:83`] |
| `assets/images/img-\d{2,3}\.(webp\|jpg\|png)` | 0~이미지 수 | 확장자 ↔ 서명(RIFF/WEBP · FFD8FF · 89504E47) 일치 |

- 공통: 경로 ASCII · `/` 구분 · 선행 `/`·`..`·`\`·`:` 0 · 대소문자만 다른 중복 0 · 길이 ≤ 100자(zip slip 방어).
- **양방향 참조 무결성**: `index.html`이 가리키는 `assets/*`는 전부 entry로 존재하고, `assets/*` entry는 전부 `index.html`에서 참조된다(고아 파일 0 · 끊긴 참조 0).
- 의존성 허용 목록(TR-SEC-06): 정적 zip은 패키지 파일이 없어 해당 없음 — React zip(M4-b)에서 정의.

---

## 5. 링크 검사 (게이트 +1줄)

### 5.1 규칙

| 판정 | 조건 | 심각도 |
|---|---|---|
| 내부 앵커 대상 없음 | 문서가 만드는 `#s-<id>` 링크(CTA·메뉴 — `kitLinks` 결과)의 대상 섹션이 문서에 없음 | 차단 |
| 외부 링크 형식 | 문서 데이터에 `#` 아닌 링크가 있음 | 차단 (현재 0건 — F-11과 같은 정책) |
| 메뉴 항목 연결 없음 | 메뉴 글자 중 heading과 일치하는 섹션이 없어 글자(span)로만 나감 | ★ 경고 (Q12 — 사용자가 의도했을 수 있어 차단하지 않는다) |
| CTA 대상 없음 | contact·footer가 없어 CTA가 버튼 모양 글자 | ★ 경고 (필수 섹션 줄과 겹치면 그 줄이 우선 — 중복 이슈 0) |

- 사실: 현 킷은 구성상 존재하는 섹션 앵커만 만든다 [사실 `kit/text.ts:29-37`] → "대상 없음" 차단은 정상 경로에서 0이 기대된다 [추정]. 이 줄의 실효 가치는 **경고 2종**(메뉴 끊김·CTA 대상 없음)과 이후 사용자 링크 기능의 자리다.

### 5.2 표시 위치·문구 키

- 위치: 게이트 목록 9번째 줄, "SEO 메타" 다음 · "글자 수" 앞(링크 = 구조 검사군) — Q13. 줄 이름 키 `gate.row.links` = "링크". 상태 단어는 현행 규칙(`gateRowWord`).
- 이슈 문구 키(문안 Hemingway): `gate.links.missingTarget`("{메뉴/CTA} 링크 대상 섹션이 없습니다") · `gate.links.external`("사이트 밖 링크는 아직 내보낼 수 없습니다") · `gate.links.menuUnlinked`("메뉴 '{항목}'과 같은 제목의 섹션이 없어 링크 없이 나갑니다") · `gate.links.ctaNoTarget`("버튼이 이동할 문의·하단 섹션이 없습니다"). "이동" 동작 = 해당 섹션 선택(현행 이슈 이동 규칙).
- `GateRowId`에 `"links"` 추가 [사실 타입 위치 `engine/contracts/records.ts`].

### 5.3 예산 — 진입 0 조건과의 충돌 (중요)

- 사실: 게이트 계산 `gateCheck`는 `/studio` **auto**(예산 판정 안) · 줄 이름 `GATE_ROW_NAMES`는 진입 청크 [사실 `check-bundle-size.mjs:131-138` · `gateView.ts:1`]. 따라서 **게이트 +1줄은 진입·auto 증분이 0이 될 수 없다** [추정: 판정 함수 + 이름·문구 ≈ 0.2~0.5KB gzip, 미측정].
- ★ 권장(Q1): 게이트 줄은 **개정 18 상신 대상으로 분리**(M4-a-2)하고, M4-a 본체는 F-11·F-12(생성기 안 링크 검사, 조작 뒤 청크 · 진입 0)로 결과물의 깨진 링크 0을 먼저 보장한다. 대안: 이슈 문구만 auto 청크(gateCheck)에 두고 줄 이름 1단어만 진입 — 증분 최소화하되 0은 아님 → 어차피 개정 필요.

---

## 6. 상태 설계

### 6.1 상태표

| 상태 | 트리거 | 버튼 | 결과 자리 | live region | 포커스 |
|---|---|---|---|---|---|
| 대기 | — | 2개 활성(차단 이유 ≥ 1이면 `aria-disabled` + describedby — 현행) | 없음 | — | — |
| 경고 확인 | 경고만 있음 | — | 모달 대화상자(현행 `ExportConfirmDialog`) | 대화상자 안 (P-2) | "경고를 확인했습니다 · 내보내기" → 닫히면 연 버튼 |
| 저장 먼저 | 미저장 변경 | 누른 버튼 `aria-busy` "내보내는 중…" · 두 버튼 `aria-disabled` | 저장 상태 줄(현행) | 셸 alert = SaveStatus(P-1) | 그대로 |
| 생성 중 | 요청~잡 종료 | 같음 | 없음 | 없음(버튼 글자 변경만 — 현행) | 그대로 |
| 성공 | 잡 succeeded | 원래 글자 | Callout info + "내려받기" 링크 + 결과 줄(크기·이미지·글꼴·잃은 이미지) + 결과 해시 | `role=status` (현행 P-3 예외 `ExportAfter.tsx:107`) | 그대로(누른 버튼). 링크는 다음 Tab |
| 실패 — 재시도 가능 | 시간 초과·INFRA·글꼴·이미지 decode·청크 로드 | 원래 글자 | `ExportRetryAlert`(편집기 청크) + "다시 시도" | `role=alert` (P-3 예외) | 그대로 |
| 실패 — 용량 초과(신규) | `ZIP_MAX`(2.5) 초과 | 원래 글자 | Callout negative "묶음이 {n}MB로 상한 64MB를 넘어 만들지 않았습니다 — 큰 이미지를 줄여 주세요" (키 `export.fail.tooLarge`) | `role=alert` (refused 자리 `ExportAfter.tsx:122`) | 그대로 |
| 실패 — 금지 패턴(신규 F-11~15) | 생성기 단언 실패 | 원래 글자 | 재시도 가능 실패와 같은 자리, 사유 = "내보낼 수 없는 내용이 있어 멈췄습니다 — 문제가 계속되면 알려 주세요"(키 `export.fail.pattern`) | `role=alert` | 그대로 |
| 성공 + 이미지 누락 | `lost > 0` | — | 성공 Callout 결과 줄에 `lostImageText`(현행) | status(성공과 1회) | — |
| 내려받기 차단 | 브라우저가 다운로드를 막음 | — | 감지 불가 [사실: `a download` 클릭 결과는 페이지가 알 수 없다] → 성공 Callout 안 고정 보조 문장 "내려받기가 시작되지 않으면 브라우저의 다운로드 권한을 확인하세요"(키 `export.hint.blocked`) — Q14 | 추가 없음 | — |
| 취소 | 경고 확인 대화상자 "취소"·Esc | 원래 | 없음 | 없음 | 연 버튼 |

- **생성 중 취소 버튼은 두지 않는다**(★ Q15): 생성 상한 8초(`TIMEOUT_MS` [사실 `staticHtml.ts:24`]) · 잡은 revision 멱등이라 중간 취소의 이득이 작고, 취소 = 잡 상태기계 변경(저장소 계약)이다. 30MB 문서 생성 시간이 8초 안인지 = 스파이크 확인.
- 자동 다운로드 하지 않는다 — 현행대로 사용자가 "내려받기"를 누른다(렌더 iframe 권한 0 · 사용자 제스처) [사실 `ExportAfter.tsx:66-70`].

### 6.2 live region 원칙 정합 (UX-POLISH-1 P-1~P-3)

- 출처: `docs/design/restart/UX-POLISH-1.md` r0 — **현재 `k002bill2/rs8-ux-polish-spec` 브랜치에만 있음, main 미병합** [사실 `git ls-tree`]. 병합 전 정본 아님.
- P-1(셸 status 1 · alert 1) 기준으로 내보내기 결과 자리 3곳(`ExportAfter.tsx:89,107` status · `:122` alert · `ExportRetryAlert.tsx:13` alert)은 P-3 예외 목록에 이미 있다. **이 SPEC은 예외를 늘리지 않는다** — zip 결과·실패는 같은 자리·같은 role을 재사용한다.
- 예외 해소(결과 문장을 편집 알림 `onAnnounce`로 올림)는 진입 청크 변경이라 이번 범위 밖 — Q16.

### 6.3 390 / 1280

- 1280: 오른쪽 패널 "검사 · 내보내기" 안 — 게이트 목록 → 내보내기 버튼 2개(세로) → 결과 Callout → PNG 묶음(현행 배치).
- 390: 검사 탭 안 같은 순서, 버튼 전폭. 결과 Callout의 "내려받기" 링크는 터치 높이 ≥ `min-h-8`(현행) — 버튼(`min-h-10`)과 같게 올릴지 = 구현 판단(진입 아님, 조작 뒤 청크).
- 실화면 관찰: 이번 레인에서 preview를 띄우지 않았다(7절) — 배치는 코드 기준 [추정], QA가 EXP-AC-R* 로 실측.

---

## 7. 수용 기준 · 예산 · 깨질 테스트

### 7.1 수용 기준 (U = 단위, R = 실화면 build+preview)

| ID | 구분 | 기준 |
|---|---|---|
| EXP-AC-01 | U | 버튼 목록 = "정적 사이트(zip) 내보내기" · "HTML 파일 1개 내보내기" 순서 2개, 형식 `static-zip` · `static-html`. React zip 버튼 0 |
| EXP-AC-02 | U | `static-zip` 요청도 검사 재계산 → 차단 멈춤 → 경고 확인 → 저장 먼저 → `requestExport` 1회(현 E-AC-28~30 시나리오를 형식만 바꿔 통과) |
| EXP-AC-03 | U | zip 바이트: 서명 3종 · stored(0) · CRC-32가 각 파일 바이트와 일치 · EOCD entry 수 = 파일 수 · 시각 고정값 |
| EXP-AC-04 | U | 같은 문서·같은 revision 두 번 생성 → 결과 해시 동일(결정성) |
| EXP-AC-05 | U | entry 목록이 4.3 허용표만 · 순서 2.4 · 디렉터리 entry 0 · 경로 ASCII |
| EXP-AC-06 | U | 이미지 n장(같은 id 2슬롯 포함) → `assets/images` 파일 = 고유 id 수 · 번호 = 첫 등장 순 · 확장자 = type |
| EXP-AC-07 | U | `index.html`에 `data:image` 0 · `img src`가 전부 존재 entry · 고아 entry 0 |
| EXP-AC-08 | U | 렌더 문서 참조 직렬화: markup 길이가 이미지 바이트와 무관(이미지 20MB 문서 markup < 1MB) — B-M2C-01 zip 경로 해소 |
| EXP-AC-09 | U | `@font-face` src = `assets/fonts/*.woff2` 상대 경로 · 글꼴 entry 첫 4바이트 `wOF2` · 쓰는 면만(≤ 2) |
| EXP-AC-10 | U | LICENSES.md: 3절 5개 절 순서 · 글꼴 절에 OFL 전문 · 이미지 파일 목록 = entry 목록 · 사용자 글자 0 · 결정적 |
| EXP-AC-11 | U | F-11: `http:`·`mailto:`·`javascript:`·상대 경로 href 주입 시 생성 실패 |
| EXP-AC-12 | U | F-12: 존재하지 않는 `#s-x` 앵커 주입 시 생성 실패 |
| EXP-AC-13 | U | F-14: 생성기 고정 부분에 `brand.name`·`apfs` 주입 시 실패 · 본문에 "Design Studio" 글자는 통과 |
| EXP-AC-14 | U | `ZIP_MAX` 초과 → refused · 문구 키 `export.fail.tooLarge` · alert 1곳 |
| EXP-AC-15 | U | 파일 이름 `<stem>_r<rev>.zip`(K-AC-32 케이스 재사용) |
| EXP-AC-16 | U | 단일 HTML 3MB 초과 안내 문장에 "다음 단계" 0 · 새 키 문장 |
| EXP-AC-17 | U | (Q5 ★ 채택 시) 단일 HTML도 참조 직렬화 경로 — 기존 정적 HTML 테스트 전부 통과 + 이미지 20MB 문서 성공 |
| EXP-AC-18 | U | (Q1 결정에 따라) 링크 게이트 줄 9줄 · 판정 4종(5.1) · 경고는 내보내기 확인 대화상자 목록에 나온다 |
| EXP-AC-19 | U | 예산: `check-bundle-size` `/studio` 진입·auto 증분 0(게이트 줄 제외 시) — 새 zip 모듈은 `STUDIO_AFTER_ACTION` 목록 |
| EXP-AC-R1 | R | build+preview, 경로 A 문서(모던 카페+보정값 v2+새로 시작 — 시드 문서는 대비 AA 차단)로 zip 내려받기 → macOS 보관 유틸리티 해제 → **로컬 웹서버**(`python3 -m http.server`)로 `index.html`을 열어 미리보기와 같은 화면(1280·390) — PRD FR-PUB-03 기준 |
| EXP-AC-R1b | R(관찰) | 같은 폴더를 `file://`로 열어 글꼴·이미지 적용 여부 기록(Chrome·Safari). [미확인] 상대 경로 `@font-face`가 `file://`에서 막히면 Q19 재판정 — 기준 실패가 아니라 관찰 항목 |
| EXP-AC-R2 | R | 해제한 폴더를 `python3 -m http.server`로 열어 네트워크 요청이 전부 같은 출처 `assets/*` · 404 0 · 외부 요청 0 |
| EXP-AC-R3 | R | 이미지 20MB+ 문서 zip 성공(현 단일 HTML이 실패하던 크기) · 생성 시간 기록 |
| EXP-AC-R4 | R | 성공 status·실패 alert가 접근성 트리에서 각 1개(P-1/P-3 범위) · 포커스가 누른 버튼에 남음 · 390에서 버튼·링크 터치 가능 |
| EXP-AC-R5 | R | `unzip -t` 오류 0 · Windows 탐색기 "압축 풀기" 확인(가능하면 — 불가 시 QA 기록) |

### 7.2 예산 제약

- `/studio` 진입 증분 0 = 버튼 2개 자리 재사용(1.2 A) · 새 부품 0 · 상태 문구는 전부 조작 뒤 청크(`ExportAfter`·`exportFlow`·새 `staticZip` 모듈).
- 새 모듈(zip 작성기·LICENSES 생성·검사 확장)은 `STUDIO_AFTER_ACTION`에 추가 → 판정 밖·크기 출력.
- 진입에 남는 변화: `FORMATS` 글자 2개 교체(약 ±수십 B) · `ExportFormat` 타입(0 B). 실측이 +0.01KB라도 나오면 결정 1 문면상 개정 18 대상 — Q1에 함께 묻는다.
- 렌더 문서 예산(90KB) 영향: Q17=B(참조 직렬화)면 serialize 분기만큼 [미확인 — 스파이크] · Q17=A면 0.
- 게이트 링크 줄 = 진입·auto 증분 > 0 → 5.3 ★ 분리.

### 7.3 깨질 기존 테스트 (예상 — 파일 기준 grep [사실], 실패 여부는 구현 때 확인)

| 파일 | 이유 |
|---|---|
| `components/studio/ExportFlow.test.tsx` | 버튼 이름 "React 프로젝트(zip)"·"정적 HTML 내보내기" · react-zip unavailable 안내 |
| `components/studio/ExportResultNotes.test.tsx` · `features/studio/exportFlow.test.ts` | 3MB 안내 문장 |
| `components/studio/PngSave.test.tsx` | 내보내기 묶음 버튼 이름 참조 [추정] |
| `data/memoryExport.test.ts` · `data/memoryDocBook.ts` 관련 | react-zip `GENERATOR_UNAVAILABLE` · 형식 목록 |
| `features/studio/staticHtml/staticMarkup.test.ts` · `staticHtml.test.ts` | Q5 채택 시 serialize 메시지·이미지 경로 |
| `render/serializeSite.test.ts` · `render/protocol.test.ts` | 참조 직렬화 메시지 필드 |
| `components/studio/GatePanel.test.tsx` · `features/studio/gateView.test.ts` · 엔진 `runGate` 테스트 | 링크 줄 추가 시(Q1) 8 → 9줄 |
| `features/studio/editorEvents.ts` 소비 테스트 | 이벤트 `format` 리터럴 타입(`:9-10`)에 `static-zip` 추가 |
| `data/memoryDocBook.ts` `isFormat`(`:121`) 관련 영속·재열기 테스트 | 리터럴 2개 → 3개. 빠뜨리면 저장된 zip 잡 재읽기 실패(타입은 통과해도 런타임 검증에서) |
| `thumbs/detailRender.test.ts` | `react-zip` 글자 참조 [추정 — 내용 미확인] |

---

## 8. 설계 질문 (★ = 권장)

| # | 질문 | 선택지 | ★ |
|---|---|---|---|
| Q1 | 링크 검사 게이트 줄은 진입·auto 증분 > 0이다(5.3). 어떻게? | A 게이트 줄은 개정 18로 분리(M4-a-2), 본체는 생성기 안 F-11·F-12만 · B M4-a에 포함하고 개정 18 상신 · C 게이트 줄 포기 | **A** |
| Q2 | 형식 설명("언제 쓰나")을 버튼 아래에 보일까? | A 안 보임(결과 Callout에만) · B 버튼 아래 1줄(진입 증분) | **A** |
| Q3 | zip 안 상위 폴더를 둘까? | A 없음(해제 도구가 zip 이름으로 폴더를 만든다 · 경로 ASCII 유지) · B `<stem>/` 폴더(한글 → UTF-8 플래그 필요) · C `site/` 고정 폴더 | **A** |
| Q4 | CSS를 별도 파일로? | A `index.html` 인라인(현행 재사용) · B `assets/site.css` | **A** |
| Q5 | (Q17 답에 따름) 고른 전송 방식을 단일 HTML 경로에도 적용(B-M2C-01 전 경로 해소)? | A 함께(경로 1개) · B zip만 | **A** |
| Q6 | zip entry 시각 | A 고정 1980-01-01(해제 파일 날짜가 1980으로 보임) · B 그 revision 문서의 `updatedAt`(revision별 결정적 — 저장 때 갱신 [사실 `memoryDocBook.ts:396`]) | **B** |
| Q7 | `ZIP_MAX` 값 | A 64MB 안전망 · B 보관 한도와 같은 32MB · C 상한 없음 | **A** |
| Q8 | LICENSES.md에 프로젝트 이름? | A 넣지 않음(결정적·사용자 글자 0) · B 넣음 | **A** |
| Q9 | 자체 그래픽·CSS·스크립트 사용 조건 문장 | A "제약 없이 사용·수정 가능"(권리 주장 0) · B 앱 이용약관 참조 · C 명시 라이선스(MIT 등) | **A** — 문안·법무 확인은 Hemingway/영환님 |
| Q10 | 산출물(LICENSES 포함)에 제품 브랜드 이름? | A 0(브랜드 교체·화이트라벨 무관) · B LICENSES에만 "생성 도구: {brand.name}" | **A** |
| Q11 | 외부 링크 | A 전부 금지(현행 0건 · 기능 생길 때 재정의) · B `https:`만 허용 | **A** |
| Q12 | 메뉴 항목 연결 없음 심각도 | A 경고 · B 통과(정보 없음) · C 차단 | **A** |
| Q13 | 링크 줄 위치 | A SEO 메타 다음 · B 맨 끝(성능 예산 다음) | **A** — 단 Q1=A면 M4-a-2에서 결정 |
| Q14 | 내려받기 차단 보조 문장 | A 성공 Callout에 늘 1줄 · B 넣지 않음 | **A** |
| Q15 | 생성 중 취소 | A 두지 않음(≤ 8초 · 멱등) · B 취소 버튼(잡 상태기계 변경) | **A** — 스파이크가 30MB 문서 > 8초를 보이면 재검토 |
| Q16 | 내보내기 결과 live region P-3 예외 해소 | A 이번엔 유지(진입 0) · B 편집 알림으로 올림(진입 +) | **A** |
| Q17 | 이미지 전송 방식(B-M2C-01 "상한·전송 방식" 결정 — 2.2-5 표) | A 상한 상향 + 부모 분리(렌더 문서 0) · B 참조 직렬화(렌더 문서 변경 · 상한 유지) | **B** — 스파이크가 렌더 문서 예산 문제를 보이면 A |
| Q18 | React zip 버튼을 M4-b까지 목록에서 빼고 그 자리를 정적 zip이 쓸까 · 버튼 순서 | A 뺀다 · zip 위·HTML 아래 · B 3버튼 유지(React zip은 "준비 중" — 진입 증분) · C 뺀다 · HTML 위(현행 순서 유지) | **A** — 누르면 안내만 나오는 버튼을 기본 위치에 두지 않는다. 제품에 보이는 결정이라 영환님 확인 |
| Q19 | zip 안 글꼴을 파일로 뺄까 | A `assets/fonts/*.woff2` 파일(LICENSES와 짝 · CSS 가벼움) · B 현행처럼 data: 인라인(합계 ≈ 350KB · `file://` 열기 안전) | **A** — 단 EXP-AC-R1b에서 `file://` 글꼴 차단이 관찰되면 B |

---

## 9. 출처·관찰 기록

- APPNOTE: PKWARE ".ZIP File Format Specification" **Version 6.3.10, Revised Nov 01, 2022** — https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT (2026-10-18 1회 받음, 174,585 B). 대조한 절: 4.3.7 local header·서명 `0x04034b50` · central `0x02014b50` · EOCD `0x06054b50` · 4.4.3.2 version 1.0 Default / 2.0 folder · 4.4.4 Bit 11 EFS(UTF-8) · 4.4.5 method 0 stored · 4.4.6 MS-DOS 날짜(1980 기준) · 4.4.7 CRC-32 조건(0xFFFFFFFF 초기·1의 보수·residue 0xDEBB20E3) · ZIP64 = 크기 > 0xFFFFFFFF.
- 실화면 관찰: preview **미실행**(이번 SPEC은 기존 화면 배치를 바꾸지 않아 코드 근거로 충분) → 포트 4393 리스너 없음. 실화면은 EXP-AC-R* 로 QA가 실측.
