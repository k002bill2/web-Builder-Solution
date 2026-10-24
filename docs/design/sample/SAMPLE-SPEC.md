# SAMPLE-SPEC r0 — 디자인 샘플 추출 명세

- 작성: Designer (Orca + Claude Code) · 2026-10-25 · base main `7aac7b7e` · 근거 ADR-009
- 표기: [L1] 저장소 직접 확인(파일:줄, 경로는 `app/src/` 생략 가능) · [L3] 외부 일반 지식(확인 필요) · [추정] 측정 없음 · `[Newton 결과 대기]` 법무 판단 보류

## 1. 현행 조사 — 지금 샘플이 될 수 있는 것

모든 내려받기는 **`/studio/:projectId` 하나**에서, 고른 1안의 편집 문서(PageDoc) 기준으로 나온다. 위치 = 툴바 "검사 · 내보내기"(`components/studio/StudioLayout.tsx:287-288`) → GatePanel(`StudioPanels.tsx:139-149`) "내보내기" 영역(`StudioLayout.tsx:373-397`) [L1].

| 산출물 | 버튼 라벨 [L1] | 생성 코드 [L1] | 파일 | 게이트 |
|---|---|---|---|---|
| 시안 PNG | "이미지로 저장" / "PNG 내려받기" (`PngSave.tsx:73,82`) — 내보내기 영역 **맨 아래**(`StudioLayout.tsx:387-394`) | `features/studio/png/pngCapture.ts:164` `savePng` → `capturePng`(:99) · 현재 미리보기 폭 1280·768·390(:103,126) · 높이 상한 16384px(:19) | `{이름}_{폭}_r{rev}.png`, 폴백 섹션 있으면 `_구조포함`(:57-58) | 게이트 무관 |
| 정적 zip | "정적 사이트(zip) 내보내기" (`ExportButtons.tsx:12`, 1번째) | `features/studio/zip/zipSite.ts:30` — index.html·LICENSES.md·assets/fonts·images | `{이름}_r{rev}.zip` (`staticHtml/exportFileName.ts:23`) | 게이트·폴백 차단 |
| 시안 HTML 1개 | "HTML 파일 1개 내보내기" (`ExportButtons.tsx:13`, 2번째) | `features/studio/staticHtml/staticHtml.ts:141` — 글꼴·이미지 data: 인라인(3MB 경고 `exportFlow.ts:91`) | `{이름}_r{rev}.html` (`exportFileName.ts:20`) | 게이트·폴백 차단 |
| React zip | "React 프로젝트(zip) 내보내기" (`reactZip/reactZipLabel.ts:6`, 3번째) | `reactZip/reactZip.ts:128`, 내용 `reactZipEntries`(:66-89) — `src/site.json` v1 = `{schema, doc, kitTokens, motion, mainStyle, images}`(`siteJson.ts:15-21,66-67`) | `{이름}_r{rev}_react.zip` (`exportFileName.ts:26`) | 게이트·폴백 차단 |
| 디자인 토큰 | **없음** | 원천: `KitTokenInput`(`render/protocol.ts:19-25`) · 프로필→토큰 `features/studio/docPurpose.ts:45` `docKitTokens` · CSS 변수 `kit/tokens.ts:25-66` `kitVars`·`kitCssText`(:69) · 렌더 메시지 `protocol.ts:49` | — | — |
| 섹션 구성 | **없음**(별도 파일 없음) | `engine/contracts/pageDoc.ts:63-72,82-101` — 순서 = `sections` 배열 순서(별도 order 필드 없음), 유형 12종(:8-21), 변형 정의 `engine/sections/registry.ts:26` | — | — |

- **토큰 단독 내보내기: 없음 [L1].** `tokens.json` 검색 0건. `application/json` Blob은 `features/projectFile/encode.ts:49`(프로젝트 백업 `{이름}_project_YYYYMMDD.json`, `readProject.ts:27`) 한 곳뿐. 토큰이 JSON으로 나가는 유일한 경로는 React zip 안 `src/site.json`.
- 모션은 토큰 입력에 없고 섹션별 `motion: "L0"|"L1"|"L2"`(`pageDoc.ts:25,69` · `domain/compareBoard.ts:167`), 지속 시간은 `kit/motion.css:11-14` 고정값 [L1].
- 3안 실렌더 비교는 `/profile/:profileId`(`features/profile/CandidatesSection.tsx:130,215` "3안 실제 화면으로 비교" → `CompareDialog.tsx`·`CompareColumn.tsx:49`). 이 화면에는 내려받기가 없다. 고른 안 → "{X}안으로 편집 시작"(`CandidatesSection.tsx:253`) → `PageDoc.candidateId` [L1].
- 라우트(`app/routes.tsx:19-34`): `/`→`/catalog` · `/catalog` · `/references/:id` · `/compare` · `/profile/:profileId` · `/projects` · `/studio/:projectId` [L1].

## 2. 샘플 산출물 포맷

### 2.1 디자인 토큰 파일 — `design-tokens.json` 스키마 초안 (r0)

원천은 이미 있다: 렌더 메시지의 `kitTokens: KitTokenInput`(`app/src/render/protocol.ts:19-25,49` [L1])과 그 파생 CSS 변수 `kitVars()`(`app/src/kit/tokens.ts:25-66` [L1]). 토큰 파일은 **새 값을 만들지 않고 이 둘을 직렬화**한다 — 같은 입력 = 같은 파일(`kitCssText`의 결정성 규칙 `tokens.ts:68-72` 재사용).

| 키 | 타입·단위 | 원천 [L1] | 비고 |
|---|---|---|---|
| `$schema` | 문자열 `"design-sample/tokens@0"` | 신규 | 스키마 버전 |
| `source` | `{ kind: "internal" \| "external_url", profileVersion?, candidateId?, generatorVersion?, libraryVersion? }` | `PageDoc` `pageDoc.ts:82-101` | 경로 B는 `kind:"external_url"`, 호스트만(전체 URL 저장 금지 — 4절) |
| `color.primary/surface/ink/muted/bg` | CSS 색 문자열(현재 hex) | `KitTokenInput.palette` · `protocol.ts:65` PALETTE_ROLES | `color.onPrimary` = `rgb(255 255 255)` 고정(`tokens.ts:11`) |
| `font.family` | 계열 이름 문자열 | `type.family` | 스택은 `fontStack()`(`siteFonts.ts`) |
| `font.weight.heading/body` | 숫자(400·700) | `type.headingWeight/bodyWeight` → `siteWeight()` | |
| `typeScale.ratio` | 무단위 비율(1~2) | `type.scale` · `PageDoc.typeScale` `pageDoc.ts:96` | |
| `typeScale.steps` | `{ "t-1"…"t5": rem }` | `kitVars` `--site-t*` `tokens.ts:41` | 파생값(편의) |
| `space.grid` | px 원값(숫자) → 파일에는 **rem**으로 | `space.grid` ÷ 16 `tokens.ts:27` | |
| `space.steps` | `{ s1…s6: rem }` (grid × 0.5·1·1.5·2·3·4) | `tokens.ts:13,42` | |
| `space.sectionGap` | rem | `space.sectionGap`(촘촘 보정 `tokens.ts:23`) | |
| `space.density` | `"comfortable" \| "compact"` | `space.density` | |
| `radius.r1/r2/card/control` | rem 또는 별칭 | `tokens.ts:47-50` | |
| `card.style/tone` | 열거 | `KitTokenInput.card` | |
| `media.ratio` | `"16:9" \| "4:5" \| "1:1"` | `mediaRatio` | |
| `motion.preset` | 섹션별 `"L0" \| "L1" \| "L2"` | `SectionInstance.motion` `pageDoc.ts:69` · `compareBoard.ts:167` | 지속 시간 값은 `kit/motion.css:11-14`(200·420·720ms, 80ms 지연) — 토큰 입력이 아니라 고정값 |
| `cssVars` | `{ "--site-*": string }` | `kitVars()` 전체 | 그대로 붙여 쓸 수 있는 CSS 변수 묶음 |

예시 1개(값은 예시 — Example data):

```json
{
  "$schema": "design-sample/tokens@0",
  "source": { "kind": "internal", "profileVersion": 3, "candidateId": "b", "generatorVersion": "2a-04c" },
  "color": { "primary": "#2F5D50", "surface": "#FFFFFF", "ink": "#1B1F1D", "muted": "#5E6762", "bg": "#F4F1EA", "onPrimary": "rgb(255 255 255)" },
  "font": { "family": "Pretendard", "weight": { "heading": 700, "body": 400 } },
  "typeScale": { "ratio": 1.25, "steps": { "t-1": "0.8rem", "t0": "1rem", "t1": "1.25rem", "t2": "1.5625rem" } },
  "space": { "grid": "0.5rem", "steps": { "s1": "0.25rem", "s2": "0.5rem", "s3": "0.75rem", "s4": "1rem", "s5": "1.5rem", "s6": "2rem" }, "sectionGap": "6rem", "density": "comfortable" },
  "radius": { "r1": "0.5rem", "r2": "1rem", "card": "var(--site-r1)", "control": "var(--site-r1)" },
  "card": { "style": "bordered-md", "tone": "light" },
  "media": { "ratio": "16:9" },
  "cssVars": { "--site-primary": "#2F5D50", "--site-s1": "0.25rem" }
}
```

- 단위 규칙: rem·ch·비율만(`tokens.ts:6` K-AC-01·07과 동일). `cssVars`는 축약 예시.
- **W3C Design Tokens(DTCG) 형식 호환 여부 [L3 확인 필요]**: DTCG는 토큰마다 `$value`·`$type` 객체를 쓰는 형식으로 알려져 있다. r0는 평평한 값 형식으로 두고, 호환이 필요하면 같은 원천에서 DTCG 변환본을 추가 생성하는 안을 MQ-SMP-02로 올린다.

### 2.2 섹션 구성 표기 — `sections.json`

원천: `PageDoc.sections: SectionInstance[]`(`pageDoc.ts:63-72,100` [L1]). **슬롯 값(글·이미지)은 넣지 않는다** — 구성만.

```json
{
  "$schema": "design-sample/sections@0",
  "sections": [
    { "order": 1, "type": "header", "variant": "sticky-right-cta", "tone": "base", "motion": "L0" },
    { "order": 2, "type": "hero", "variant": "split", "tone": "base", "motion": "L1" },
    { "order": 3, "type": "services", "variant": "cards-3", "tone": "alt", "motion": "L1" },
    { "order": 4, "type": "footer", "variant": "minimal", "tone": "base", "motion": "L0" }
  ]
}
```

- `type` 열거 12종: header·hero·about·services·portfolio·statistics·testimonials·pricing·faq·contact·cta-band·footer(`pageDoc.ts:8-21` [L1]). `variant`는 섹션 정의의 변형 id 문자열(예시 값은 Example data — 실제 id는 `features/studio/sectionCatalog.ts`·`kit/registry.ts`에서 가져온다).
- `instanceId`는 넣지 않는다(편집 내부 id, 샘플 독자에게 의미 없음). `order`는 배열 순서와 같다(1부터).

### 2.3 묶음 방식 후보

| 안 | 내용 | 장점 | 단점 |
|---|---|---|---|
| A | 개별 버튼 4개(PNG · 정적 HTML · 토큰 JSON · 섹션 JSON) | 구현 작음 | 버튼 늘어남 → `/studio` 진입 예산(3절) 압박 |
| **B ★** | **"디자인 샘플 내려받기" 1개 = zip(시안 PNG + 시안 HTML + design-tokens.json + sections.json + README.txt)** + 기존 PNG·정적 HTML 개별 버튼 유지 | 샘플의 정의(ADR-009 1절 2)가 한 묶음으로 전달됨 · 버튼 1개 추가만 · zip 생성기는 기존 `features/studio/zip/` 재사용 | zip 청크는 조작 뒤라 진입 영향은 버튼 글자 수준[추정] |
| C | 토큰·섹션 JSON만 개별 추가, 묶음 없음 | 가장 단순 | "샘플 = 묶음" 메시지가 약함 |

★B 근거: 제품 정의가 "샘플 1개 = 4종 산출물"이므로 한 번에 받는 경로가 1순위여야 하고, 기존 개별 버튼은 유지(ADR-009 1절 4 "숨기지 않음")로 회귀 0.

## 3. 경로 A 화면 정리

### 3.1 구축·발행 약속 문구 전수 목록 (사용자 노출, 주석 제외)

전수 grep 결과 "홈페이지"·"웹사이트"·"배포/호스팅/런칭/도메인"·"내 사이트"·publish/deploy/launch 사용자 노출 문구는 **0건** [L1 — 서브에이전트 B grep]. `app/index.html:6` title = "Design Studio", meta description 없음(중립). 브랜드 tagline `brand/brand.config.ts:7`은 레퍼런스 탐색 문구이며 렌더되지 않음.

| # | file:line [L1] | 현재 문구 | 분류 | 제안 문구 | 함께 바꿀 테스트 |
|---|---|---|---|---|---|
| C1 | `components/studio/PageInfoFields.tsx:46-47` | "대표 주소(canonical)" / "발행 주소가 정해지면 채웁니다(2a-05b)" | 발행 | "샘플에는 대표 주소가 필요하지 않습니다"(필드는 유지) | `PageInfoFields.test.tsx` |
| C2 | `domain/boardWarnings.ts:75` | "발행 전에 사업자정보가 있는 푸터가 필요합니다" | 발행 | "실제 사이트로 쓰려면 사업자정보가 있는 푸터가 필요합니다" | `boardWarnings.test.ts` |
| C3 | `components/studio/SnapshotDialog.tsx:9` | 스냅샷 종류 "게시"(kind `published`) | 발행 | "확정"(published 스냅샷은 현재 UI에서 만들지 않음) | `SnapshotDelete.test.tsx` 확인 필요 |
| C4 | `components/studio/ExportButtons.tsx:12` | "정적 사이트(zip) 내보내기" | 구축(약) | "HTML 샘플 묶음(zip) 내보내기" | `ExportFlow.test.tsx:73` |
| C5 | `components/studio/ExportAfter.tsx:64-66,70,122` | "정적 사이트(zip)를 만들었습니다…" 등 | 구축(약) | "HTML 샘플 묶음(zip)을 만들었습니다…" | `ExportFlow.test.tsx:77,83` · `ExportResultNotes.test.tsx` |
| C6 | `features/studio/exportFlow.ts:91` | "…정적 사이트(zip)는 이미지를 파일로 나눠 담습니다" | 구축(약) | C4 라벨명에 맞춤 | `exportFlow.test.ts` |
| C7 | `features/studio/reactZip/reactZipLabel.ts:6` | "React 프로젝트(zip) 내보내기" | 구축(코드 인계) | "React 코드 샘플(zip) 내보내기" | 상수 import라 값만 변경 |
| C8 | `features/studio/reactZip/reactZipText.ts:15,17,52,58-59,85,90` | README "# 사이트 프로젝트" · "배포용 파일을 만드세요" · LICENSES "## 사이트 코드" | 구축·배포 | "# 디자인 샘플 프로젝트" · "빌드용 파일을 만드세요" | `## 사이트 코드`는 `reactZip/checkReactZipEntries.ts:31` LICENSE_SECTIONS(런타임 검사기)와 3곳 동시 변경 |
| C9 | `features/studio/zip/licenses.ts:35,37` | "사이트 파일(index.html)…", "사이트를 만든 사용자가…배포에 필요한 권한" | 약 | "샘플 파일", "샘플을 만든 사용자" — **영환님 승인 고정 문안이라 변경 전 승인 필요**(MQ-SMP-04) | licenses 테스트 확인 필요 |
| C10 | `features/profile/AdjustmentPanel.tsx:34` · `profileDiff.ts:39` · `adjustmentText.ts:25` | "사이트 목적" | 약 | 유지 권장(업종 목적의 뜻) — 선택 시 "샘플 목적" | `ProfileAdjust.test.tsx` · `CompareBoardCarryOver.test.tsx` |

유지(중립): "3안 만들기"(`CandidatesSection.tsx:144`) · "편집 시작"(:253) · "새 프로젝트"(`components/layout/AppHeader.tsx:68`) · `RouteErrorBoundary.tsx:38` "새 버전이 배포되었을 수 있으니"(앱 자체 배포) · `ProjectsPage.tsx:60`.

### 3.2 샘플 추출을 1순위로 보이게 할 최소 변경 후보 (편집기·React zip은 숨기지 않음)

| 후보 | 변경 | 파일 | 진입 예산 영향 [추정] |
|---|---|---|---|
| M1 | 문구 C1~C8 교체 | 위 표 | ±0.01KB 수준(글자 수 차이만) |
| **M2 ★** | 내보내기 영역 순서: **PNG → (신규) 디자인 샘플 묶음 → HTML 1개 → HTML 샘플 zip → React 코드 샘플 zip** | `StudioLayout.tsx:377,387` 블록 이동 · `ExportButtons.tsx:11-15` FORMATS 순서(M4-a Q18 A 결정을 바꾸므로 MQ-SMP-03) | 이동은 0에 가까움, 신규 버튼 1개 = 라벨+핸들러 진입 +0.02~0.05KB, 생성 본문은 조작 뒤 청크 |
| M3 | 툴바 "검사 · 내보내기" → "검사 · 샘플 내려받기" | `StudioLayout.tsx:287-288` | ±0.01 |
| M4 | `/profile` 3안 비교 대화상자에 "이 안 PNG" 버튼 | `CompareColumn.tsx` | `/profile` 진입 증가 가능 — 캡처 코드 조작 뒤라도 버튼·로더 몫 필요. r0에서는 **보류** |

- **번들 예산 현황 [L1]**: `/studio/:projectId` 정규화 기준선 128.79KB(판정선 128.82, 개정 상한 129.13) · raw 130.12 / 한도 130.5 (`app/scripts/m2cBaseline.json` normEagerKb·eagerKb) · `/catalog` 첫 화면 한도 101(`check-bundle-size.mjs:102`, ADR-004 개정 7). 남은 진입 여유 ≈ 0.03KB(판정선) — **신규 버튼(M2)은 진입 몫 배정(ADR-004 개정) 또는 상쇄 없이는 판정선을 넘을 수 있다 [추정]**. 토큰·섹션 JSON 생성 본문과 zip 조립은 반드시 조작 뒤 청크로 둔다(ADR-004 개정 2 결정 1 분류 규칙).
- `/catalog`·`/profile`은 r0 변경 대상에서 제외(여유가 가장 작음, `chunkRetry` 메모 참고) — 문구 교체 C2(`/compare`)만 해당.
## 4. 경로 B — 외부 URL 추출 흐름·상태 (설계만 · 코드 착수 금지)

> ADR-009 2절 게이트 5개를 모두 통과하기 전에는 이 절은 **설계 기록**일 뿐이다. 법무 판단은 이 문서가 하지 않는다 — `[Newton 결과 대기]`.

### 4.1 흐름

| 단계 | 화면·동작 | 저장되는 것 | 근거 |
|---|---|---|---|
| B1 입력 | 단일 URL 입력 1칸 + "디자인 특징 추출" 버튼. 여러 URL·목록 붙여넣기 불가 | 없음 | ADR-009 2절 1 [L1] |
| B2 사전 차단 | 도메인 거부 목록(GDWEB·dbcut 영구) · 스킴(https만) · 사설/메타데이터 IP 차단을 요청 전에 판정 | 없음 | ADR-009 2절 1·4 [L1] |
| B3 허용 확인 | robots.txt 해당 경로 허용 여부 · 약관 확인 결과 표시(사용자 체크 포함 여부는 MQ-SMP-06) | 판정 결과(허용/거부·사유 코드)만 | ADR-009 2절 2 [L1] · 약관 해석 [Newton 결과 대기] |
| B4 추출 | 요청 1회 · 정직한 UA · 쿠키·로그인 없음 · 시간·크기 상한 · 리디렉션마다 B2 재검증 | 메모리에서만 처리, 원문 폐기 | ADR-009 2절 4 [L1] |
| B5 결과 | 추상 특징 카드: 팔레트(hex 값 ≤ 8) · 글꼴 계열 이름(≤ 3, 계열 분류: serif/sans/mono/display) · 간격 리듬(기본 단위·비율) · 섹션 구조 태그(header/hero/services/…/footer 순서) | 2절 토큰 스키마와 같은 모양의 JSON (`source.kind = "external_url"`) | ADR-009 2절 3 [L1] |
| B6 이어 붙이기 | "이 특징으로 프로필 시작" → 내부 경로 A의 디자인 프로필 초기값(색·글꼴·간격)으로 넘김. 섹션 태그는 3안 생성의 섹션 순서 힌트로만 | 프로필 초기값(내부 데이터) | ADR-009 1절 3 [L1] |

- **표시·저장 금지**: 원본 스크린샷·이미지·로고·파비콘·본문 텍스트·HTML/CSS 원문. 결과 화면에 대상 사이트의 캡처를 보여주지 않는다(ADR-009 2절 3, PRD L41·L166 [L1]).
- 글꼴은 **계열 이름만** 저장하고 폰트 파일을 받지 않는다. 내부 경로로 넘길 때는 앱이 가진 글꼴(`app/src/kit/siteFonts.ts`) 중 가장 가까운 계열로 대응한다 [추정 — 대응표는 후속 SPEC].
- 실행 위치(서버 fetch vs 로컬 헤드리스 도구)는 정하지 않는다 → **MQ-SMP-05**.

### 4.2 상태

| 상태 | 원인 코드 | 사용자 문구(초안) | 다음 행동 |
|---|---|---|---|
| 대기 | — | "사이트 주소를 넣으면 색·글꼴·간격 특징만 뽑아요. 이미지와 글은 가져오지 않아요." | 입력 |
| 진행 | — | "특징을 읽는 중… (최대 N초)" + 취소 | 취소 |
| **차단** | `robots_disallow` | "이 사이트는 자동 읽기를 허용하지 않아요." | 다른 주소 |
| 차단 | `login_required` | "로그인이 필요한 페이지는 읽지 않아요." | 공개 페이지 주소 |
| 차단 | `domain_denied` (GDWEB·dbcut·거부 목록) | "이 주소는 추출 대상이 아니에요." | 다른 주소 |
| 차단 | `unsafe_target` (사설 IP·메타데이터·비 https) | "이 주소는 열 수 없어요." | 다른 주소 |
| 차단 | `terms_denied` | "사이트 약관상 자동 읽기가 허용되지 않아요." `[Newton 결과 대기]` | 다른 주소 |
| **실패** | `timeout` | "응답이 너무 늦어요. 잠시 뒤 다시 해 보세요." | 다시 시도(1회 버튼) |
| 실패 | `too_large` | "페이지가 너무 커서 읽지 않았어요." | 다른 주소 |
| 실패 | `network` | "사이트에 연결하지 못했어요." | 다시 시도 |
| **부분 결과** | `partial` (예: 팔레트만·글꼴 미검출) | 찾은 항목만 표시 + "찾지 못한 항목: 글꼴" 목록. 빠진 항목은 프로필 기본값으로 채운다고 명시 | 프로필로 이어가기 허용 |
| 완료 | — | 특징 카드 + "이 특징으로 프로필 시작" | B6 |

- 차단은 **재시도 버튼을 주지 않는다**(우회 유도 금지). 실패만 재시도 1회 버튼.
- 차단·실패 사유는 코드와 시각만 기록하고 URL 전체 경로·쿼리는 기록하지 않는다(호스트만) [추정 — Security 위협 모델에서 확정].

## 5. 수용 기준 SMP-AC

### 경로 A (내부)

| ID | 기준 | 검증 방법 |
|---|---|---|
| SMP-AC-A01 | `/studio/:projectId` 내보내기 영역에서 "디자인 샘플 묶음" 1회 클릭으로 zip(PNG·HTML·`design-tokens.json`·`sections.json`·README) 1개를 받는다 | 컴포넌트 테스트(다운로드 호출 1회·엔트리 목록) + ego-browser 수동 1회 |
| SMP-AC-A02 | `design-tokens.json`은 2.1 스키마를 따르고 `kitVars()`와 값이 같다(같은 입력 = 같은 바이트) | 단위 테스트: 같은 `KitTokenInput` 2회 직렬화 동일 · `cssVars` = `kitVars()` |
| SMP-AC-A03 | 토큰 파일 단위는 rem·ch·비율·CSS 색만(px 0) | 단위 테스트 정규식 |
| SMP-AC-A04 | `sections.json`은 `PageDoc.sections` 순서·type·variant·tone·motion과 일치하고 슬롯 값(글·이미지)·instanceId를 담지 않는다 | 단위 테스트 |
| SMP-AC-A05 | 3.1 C1~C8 문구가 바뀌고 "발행"·"정적 사이트" 사용자 노출 문자열 0 | 가드 테스트(grep 방식, `src/test/`) |
| SMP-AC-A06 | 편집기·React zip·정적 zip·HTML 1개 버튼이 그대로 보이고 동작한다(숨김 0) | 기존 `ExportFlow.test.tsx` 등 회귀 PASS |
| SMP-AC-A07 | 번들: `/studio` 진입 판정선(ADR-004 현행) 통과, 다른 라우트 변화 ±0.03 이내, 샘플 묶음 생성 본문은 조작 뒤 청크 | `npm run build` → `check-bundle-size.mjs` 출력 |
| SMP-AC-A08 | 완료 게이트 typecheck·lint·test·build 통과 | 4개 명령 출력 |

### 경로 B (외부 URL — 게이트 해제 뒤에만 적용)

| ID | 기준 | 검증 방법 |
|---|---|---|
| SMP-AC-B01 | ADR-009 2절 게이트 5개 해제 결정 문서가 있기 전 B 관련 코드 0 | 리뷰 체크 + grep |
| SMP-AC-B02 | 단일 URL·요청 1회 — 링크 추적·추가 페이지 요청 0 | 가짜 서버 테스트: 요청 수 = 1(+robots 1) |
| SMP-AC-B03 | GDWEB·dbcut·거부 목록·사설/메타데이터 IP·비 https는 요청 전에 `domain_denied`/`unsafe_target`로 차단, 리디렉션마다 재검증 | 단위 테스트(주소 표) |
| SMP-AC-B04 | robots 거부 → `robots_disallow` 차단, 재시도 버튼 없음 | 테스트 |
| SMP-AC-B05 | 시간·크기 상한 초과 → `timeout`/`too_large` 실패, 재시도 1회 버튼 | 테스트(지연·대용량 가짜 응답) |
| SMP-AC-B06 | 결과·저장소에 원본 이미지·로고·본문·HTML/CSS 원문 0 — 추상 특징(팔레트·글꼴 계열·간격·섹션 태그)만 | 저장 데이터 스냅샷 검사 |
| SMP-AC-B07 | 부분 결과는 찾은 항목 + 빠진 항목 목록 표시, 프로필로 이어가기 허용 | 컴포넌트 테스트 |
| SMP-AC-B08 | UA 위장 0 · 쿠키·로그인 0 | 요청 헤더 검사 |
| SMP-AC-B09 | 법무 확인 전 공개 기능 비노출 | `[Newton 결과 대기]` — 결정 문서 확인 |

## 6. MQ-SMP — 영환님 결정 필요

| ID | 질문 | 후보 | ★ | 근거 |
|---|---|---|---|---|
| MQ-SMP-01 | 샘플 묶음 방식 | A 개별 버튼 4개 · **B 묶음 zip 1개 + 기존 개별 유지** · C JSON만 개별 추가 | B | 샘플 정의(ADR-009 1절 2)를 한 번에 전달, 버튼 1개만 추가(2.3절) |
| MQ-SMP-02 | 토큰 파일 형식 | **A 평평한 자체 JSON(r0 스키마)** · B W3C DTCG 형식만 · C A + DTCG 변환본 동시 | A | 원천 `KitTokenInput`과 1:1, DTCG 호환은 [L3 확인 필요] — 확인 뒤 C로 확장 가능 |
| MQ-SMP-03 | 내보내기 버튼 순서(M4-a Q18 A 결정 변경) | **A PNG·샘플 묶음 먼저(M2)** · B 현행 순서 유지 + 문구만 | A | 샘플 추출을 1순위로(BRIEF 1-3), 이동 비용 ≈ 0 |
| MQ-SMP-04 | 승인 고정 문안(LICENSES `zip/licenses.ts:35,37`·React README) 변경 | **A "사이트"→"샘플" 최소 치환** · B 그대로 유지 | A | 공개 카피 금지(ADR-009 1절 6) 취지, 권리 문장 의미는 불변 |
| MQ-SMP-05 | 경로 B 실행 위치 | A 서버 fetch(ADR-007 P7 발동·SSRF 방어) · B 로컬 헤드리스 도구(사용자 PC) · C 결정 보류(Security 위협 모델 뒤) | C | 브라우저 단독은 교차 출처로 불가[추정], 두 안 모두 보안 검토 선행 필요 |
| MQ-SMP-06 | 경로 B 약관 확인 방식 | A 자동 판정만 · **B 자동 robots + 사용자 "약관 확인" 체크** · C 허용 목록 도메인만 | B | robots는 기계 판정 가능, 약관은 기계 판정 어려움[추정] — 최종은 `[Newton 결과 대기]` |
| MQ-SMP-07 | 신규 샘플 묶음 버튼의 `/studio` 진입 몫 | **A ADR-004 개정으로 +0.05 배정** · B 상쇄(기존 진입 코드 감량) 선행 후 0 증가 | A | 판정선 여유 ≈ 0.03KB(3.2절), 상쇄는 별도 레인 비용 |
| MQ-SMP-08 | 정적 HTML 시안의 Safari·Firefox 열람 확인을 "샘플 열람 호환성" 백로그로 남길지 | **A 남김(수동 1회 확인)** · B 동결 | A | 시안 HTML이 샘플 산출물이 되었으므로 열람 보장이 필요(ADR-009 3절) |
