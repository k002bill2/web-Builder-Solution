# M4-a-2 REPORT — 정적 zip 내보내기 구현

**결론(R2 갱신): 개정 18(8aa9a60f)로 예산 멈춤이 풀렸고, BLOCKED 3건(fresh 게이트 · Ego Lite · Codex)을 마쳤습니다. 진입 128.71 · 복원 131.69 = 개정 18 기준선(증분 0, 기준선 갱신 없음). Codex P2 2건은 반영했습니다. Ego Lite에서 단일 HTML 거짓 실패 1건(F-14 브랜드 검사가 인라인 글꼴 base64까지 검사)을 찾아 TDD로 고쳤습니다. 최종 게이트: test 353파일 3130 passed · build exit 0. EXP-AC-R1·R2·R4·R5 통과, R1b 관찰 기록, R3은 BLOCKED(실화면 20MB+ 미실행 — 단위 EXP-AC-17로만 확인).**

_(아래 1~6절 첫 줄까지는 R1 마감 기록입니다. R2 결과는 1절 표 마지막 행과 7·8절에 있습니다.)_

근거 수준: 단위·빌드 = L1(실행 출력, 로그 `logs/`). 실화면 = R1 미실행 → R2에서 실행(L1, 8절).
- build exit 0은 스크립트 허용치(+0.03 · 멈춤선 128.69) 안이라는 뜻일 뿐입니다. 결정 1의 "진입 증분 0"을 통과했다는 뜻이 아닙니다.

## 1. 예산 (결정 1 — 진입 증분 0) · 기준선 파일 수정 0
| 시점 | /studio 정규화 | 복원 정규화 | raw | 렌더 JS | 로그 |
|---|---|---|---|---|---|
| 기준선(base d8e548e5) | 128.66 | 131.64 | 129.96 | 84.22 | `logs/build-baseline.txt` |
| CP2 (protocol `serialize{refs}`) | 128.66 (0) | 131.64 (0) | 129.97 | 84.29 (+0.07, 스파이크 실측과 같음) | `logs/build-cp2b.txt` |
| CP5 (버튼 글자 · `static-zip` 키) | **128.67 (+0.01)** | **131.65 (+0.01)** | 129.96 | 84.29 | `logs/build-cp5.txt` |
| 감량 1회 (`isFormat` → `includes`) | 128.67 (+0.01) | 131.65 (+0.01) | 129.97 | 84.29 | `logs/build-cp5-trim.txt` |
| **개정 18 기준선**(8aa9a60f · 128.71 · 131.69 — 병합 #36·#37 포함) | 128.71 | 131.69 | — | — | ADR-004 개정 18 |
| R2 병합 뒤 fresh | 128.71 (0) | 131.69 (0) | 130.00 | 84.29 | `logs/build-r2.txt` |
| R2 Codex 반영 뒤 | 128.71 (0) | 131.69 (0) | 130.00 | 84.29 | `logs/build-r2-fix.txt` |
| R2 Ego Lite 수정 뒤(최종) | 128.71 (0) | 131.69 (0) | 130.01 | 84.29 | `logs/build-r2-ego.txt` |

- **원인 청크(기준선 → CP5, Vite gzip):**
  - 판정에 잡히는 진입 증분은 `StudioLayout` 19.58 → 19.59입니다. ExportButtons 버튼 글자 2개를 바꿨고(SPEC 1.2 A · Q18 A), 버튼 수와 부품은 그대로입니다.
  - `memoryDocBook`은 raw만 13.65 → 13.67kB로 늘었고 gzip은 5.26 그대로입니다(`isFormat`·생성기 조건의 `static-zip` 키).
- **감량 결과:** `isFormat`을 같은 판정(`includes`)으로 바꿨지만 정규화 진입은 그대로였습니다. memoryDocBook gzip은 5.26 → 5.27로 오히려 늘어서 **되돌렸습니다**.
- **커밋된 최종 코드:** 측정한 상태와 같습니다(`build-cp5.txt` · `test-cp5.txt` · `lint-cp5.txt`).
- **조작 뒤 청크(판정 밖):** exportFlow +3.32 → +3.39KB · ExportAfter +1.70 → +1.79KB · staticHtml 청크 6.14 → 9.85KB(zip 작성기·조립·LICENSES·검사 포함).
- **사실 참고:** 병렬 `rs8-ux-fix` 레인이 기준선을 128.70·131.68로 올리는 커밋을 갖고 있습니다(`75f8868f`). 이 판정의 근거로는 쓰지 않았습니다.

## 2. CP 결과 (RED → GREEN)
| CP | 결과 | RED 로그 | 커밋 |
|---|---|---|---|
| CP1 storeZip | version 10 · flag 0 · ASCII 경로 · 거절 표(선행 `/`·`..`·`\`·`:`·빈·끝 `/`·대소문자 중복·100자 초과) · 결정적 DOS 시각(필수 인자) · ZIP64 throw(항목 ≥ 65,535 · 크기 상한 주입) · `unzip -t`/`zipinfo`/`unzip -p` · 24건 | `logs/cp1-red.txt`(24 실패) | c568e661 |
| CP2 참조 직렬화 | 렌더 `serialize{refs}` → `image:<id>`(objectUrls `idOf`) · 부모 Blob → src · `HTML_MAX` 8M 유지 · 단일 HTML도 같은 경로(Q5) · 20MB 이미지 문서 성공(EXP-AC-17) · PNG는 기존 data URL 경로 그대로 | `logs/cp2-red.txt`(6 실패) | c7863aeb |
| CP3 zip 조립 | `index.html` · `LICENSES.md`(5절 구조, 자리표시 문장) · `assets/fonts/<Family>-<w>.woff2` + `OFL.txt` · `assets/images/img-NN.ext` · 순서 2.4 · 시각 = 문서 `updatedAt`(Q6) · `ZIP_MAX` 64MB · `<stem>_r<rev>.zip` · 내려받기 URL 보관 키 = 프로젝트\|형식 | `logs/cp3-cp4-red.txt`(13 실패 + import 2) | 575576b8 |
| CP4 금지 패턴 | zip 열(F-09 assets/images · F-10 assets/fonts) · F-11 링크 = `#` 앵커만 · F-12 대상 id 존재 · F-13 action·formaction·poster·img 밖 src·style url() · F-14 고정 부분 브랜드 0(사용자 글자 제외) · F-15 head 방어 · 4.3 허용표(종류·개수·서명·양방향 참조) | 위와 같음 | 575576b8 |
| CP5 UI | 버튼 = "정적 사이트(zip) 내보내기" → "HTML 파일 1개 내보내기"(React zip 제외, Q18 A) · zip 결과 줄 · 3MB 안내 문장 교체(EXP-AC-16) · 성공 Callout 보조 문장(Q14) · 용량 초과 사유 · 문구는 전부 조작 뒤 청크(ExportAfter·exportFlow) | `logs/cp5-red.txt` | fe4671a1 |

### 수용 기준 (U = 단위 통과)
- **통과(U):** EXP-AC-01 · 03 · 04 · 05 · 06 · 07 · 08 · 09 · 10 · 11 · 12 · 13 · 15 · 16 · 17
- **부분:** EXP-AC-02 — 기존 흐름 테스트에서 `static-zip` 요청 1회와 형식별 안내까지 확인했습니다. E-AC-28~30 시나리오 전체를 zip으로 다시 돌리지는 않았습니다. R2 실화면에서는 zip·HTML 성공 흐름 1회씩만 확인했습니다(실패 분류 전부는 아님).
- **부분:** EXP-AC-14 — 아래 편차 3번 참고. 용량 초과는 SPEC 6.1의 refused가 아니라 재시도 가능 경로(alert + 사유 문구)로 보입니다. 저장소(`memoryDocBook runJob`) 변경이 쓰기 범위 밖이라 그대로 두었습니다.
- **해소:** EXP-AC-19 — R1 진입 +0.01은 개정 18 몫 안으로 기준선에 반영되었습니다. R2 최종 진입 증분은 0입니다(1절).
- **실화면 R1~R5:** 8절 표를 보세요.

### 기존 단언 변경 (SPEC 7절 근거 · 약화·skip 0)
| 파일 | 이전 | 이후 | 근거 |
|---|---|---|---|
| `components/studio/ExportFlow.test.tsx` | 버튼 이름 "React 프로젝트(zip) 내보내기"·"정적 HTML 내보내기" · react-zip 안내 문구 | "정적 사이트(zip) 내보내기"·"HTML 파일 1개 내보내기" · static-zip 안내 문구 + 요청 형식 `static-zip` 단언 추가 | 7.3 · Q18 A |
| `components/studio/ExportChunkFailure.test.tsx` | 버튼 이름 "정적 HTML 내보내기" | "HTML 파일 1개 내보내기" | 7.3 |
| `components/studio/PngSave.test.tsx:122` | 버튼 이름 "정적 HTML 내보내기" | "HTML 파일 1개 내보내기" | 7.3(파일 표에 명시) — 아래 편차 2번 |
| `features/studio/exportFlow.test.ts` · `components/studio/ExportResultNotes.test.tsx` | 3MB 안내 "zip 내보내기는 다음 단계에서 지원합니다" | "정적 사이트(zip)는 이미지를 파일로 나눠 담습니다" | 2.5 · EXP-AC-16 |
| `components/studio/ExportFlow.test.tsx` (FIX1) | "정적 사이트(zip)을 만들었습니다" | "정적 사이트(zip)를 만들었습니다" | 조사 정정(약화 아님) — BRIEF-FIX1 4항 |
| `staticMarkup.ts` 실패 문구 | "정적 HTML 이미지는 data: 단일 파일만 허용합니다" | "정적 HTML 이미지 규칙 위반 — data: 단일 파일(zip은 assets/images) 아님" | 기존 테스트 `toThrow("정적 HTML 이미지")` 그대로 통과 |

## 3. 편차·결정 (한 줄씩)
1. **data 3파일 수정**(`data/projectRepository.ts` 형식 타입 · `data/memoryDocBook.ts` `isFormat`·생성기 조건 `!== "react-zip"` · `features/studio/editorEvents.ts` 리터럴): SPEC 1.3이 필수로 요구하지만 BRIEF 쓰기 목록에는 없었습니다. 리터럴·타입만 바꿨고, 슬롯 1개를 공유하며 생성기가 `input.format`으로 분기합니다. `engine/contracts/records.ts`는 typecheck가 요구하지 않아 손대지 않았습니다.
2. **병렬 경로 겹침 — `components/studio/PngSave.test.tsx:122` 1줄 수정**: `rs8-ux-fix`가 같은 파일을 고칩니다(hunk 65–98 · 135+). 이 레인의 수정은 122줄이라 hunk는 분리돼 있습니다. 컴포넌트 `PngSave.tsx`·`StudioLayout.tsx`는 건드리지 않았습니다. BRIEF의 "겹치면 멈추고 보고"에 해당하므로 **병합 순서·충돌 판단은 Jarvis**에게 넘깁니다.
3. **용량 초과 = 재시도 가능 사유 경로**: SPEC 6.1은 refused를 요구하지만 `memoryDocBook runJob`이 모든 생성기 실패를 retryable로 기록합니다. 그래서 `ZipTooLargeError`(shown)의 문구를 `ExportRetryAlert`(role=alert)로 보입니다. 저장소 변경을 피하려고 이렇게 했고, EXP-AC-14는 부분 충족입니다.
4. **`assets/fonts/OFL.txt`를 허용표에 추가**: 글꼴이 있을 때 정확히 1개이고, 양방향 참조 검사에서는 뺐습니다. Q19 A와 BRIEF를 따랐고 SPEC 4.3 표에는 없습니다.
5. **OFL.txt·LICENSES 글꼴 절의 원문**: 계열 저작권 문장(`siteFontEmbed` COPYRIGHT) + OFL 본문입니다. 단일 HTML `<head>` 주석과 같은 원천이라 Pretendard처럼 site-fonts에 OFL.txt가 없는 계열도 덮습니다.
6. **이미지 번호 = markup 안 `image:<id>` 첫 등장 순서**: 문서 섹션·슬롯 순서와 같습니다. markup에 없는 id에는 파일을 만들지 않습니다(고아 0).
7. **storeZip 항목 상한 = 65,535개 이상 throw**: SPEC 2.4 "entry < 65,535"를 따랐습니다. 0xFFFF는 ZIP64 표지값입니다.
8. **참조 마커 = `img src="image:<id>"`**: SPEC 예시는 `data-export-image`였습니다. 부모가 `clean()` 뒤 바꾸고, 모르는 id나 남은 마커는 이미지 규칙 위반으로 실패합니다.
9. **zip 결과 줄**에는 3MB 메일 안내를 붙이지 않습니다. 메일 안내는 단일 HTML만 해당합니다.
10. **목업 대비**: 화면 배치 변경은 0입니다. 버튼 글자만 바꿨습니다.

## 4. M4-a-2b 이월 (Q1 A — 게이트 링크 줄)
| AC | 내용 | 이유 |
|---|---|---|
| EXP-AC-18 | 링크 게이트 줄 9줄 · 판정 4종 · 경고 확인 대화상자 목록 | Q1 A — 진입·auto 증분 > 0이라 개정 18 대상으로 분리 |

## 5. 검증 실행 기록 (fresh)
- **typecheck:** `cd app && npx tsc --noEmit -p tsconfig.json` → exit 0
- **lint:** `cd app && npx eslint .` → exit 0 (`logs/lint-cp5.txt`)
- **test:** `cd app && npx vitest run` → Test Files 350 passed · Tests 3105 passed (`logs/test-cp5.txt`)
- **build:** `cd app && npm run build` → exit 0, 전 라우트 + 렌더 문서 (`logs/build-cp5.txt`)
- **preview:** 이번 레인에서 띄우지 않았습니다. `lsof -nP -iTCP:4395 -sTCP:LISTEN` → 출력 없음, exit 1(리스너 0).
- **Ego Lite: BLOCKED** — 결정 1 멈춤(+0.01). 개정 18 판단 뒤 재개합니다. 할 일: zip 내려받기 → `unzip -l/-t` → `file://` 이미지·글꼴 → 단일 HTML → 1280·390. → **R2에서 해소, 8절**
- **Codex review(`--scope branch --base d8e548e5`): BLOCKED** — 같은 사유입니다. 재개 순서는 Ego Lite → Codex입니다. → **R2에서 해소, 7절**

## 6. 서브에이전트
- **CP1 storeZip:** worker 1개, `isolation: worktree`. 24건 통과 보고를 받은 뒤 메인에서 파일을 복사해 다시 실행했고 24 passed를 확인했습니다. 커밋은 c568e661입니다. worktree(`.claude/worktrees/agent-a35f9a039630e0c96`)와 브랜치는 제거했습니다.

## 7. R2 Codex (BRIEF-R2 3항)
- **실행:** `codex-companion adversarial-review --scope branch --base d8e548e5 "<관점 4개: zip-slip · 금지 패턴 우회 · 참조 직렬화 누락 이미지 · 거짓 성공>"` 1회. `review` 서브커맨드는 관점 텍스트를 받지 않아 adversarial-review로 돌렸습니다. 결과 원문 `logs/codex-r2.txt`.
- **판정:** needs-attention. Codex가 경로 순회·미해결 이미지·ZIP_MAX 초과는 거부되는 것을 확인했고, 다음 P2 2건을 냈습니다.
| # | 지적 | 반영 | 테스트 |
|---|---|---|---|
| 1 | F-13 우회: a 밖 요소의 외부 `href`(SVG image)·본문 `link`·본문 `style`의 `@import`·style 속성 `URL(`(대문자)이 통과 | `staticMarkup.ts` — href(xlink 포함)는 `#` 조각만 · 본문 `link/base/meta` 0 · `background`·`ping` 속성 0 · 본문 CSS(style 속성·요소)는 url() data:만 + `@import`·`image-set(`·이스케이프 `\` 0 · `url(` 대소문자 무시 | `staticMarkup.test.ts` "F-13 우회(Codex R2)" 10건 + svg `use href="#x"` 통과 |
| 2 | 양방향 참조를 index.html 전체 정규식으로 모아 본문 글자의 `assets/...` 경로 때문에 정상 zip이 실패 | `staticZip.ts` — DOM 파싱 뒤 실제 URL 자리(img src · style 요소·속성 url())만 참조로 셈 | `staticZip.test.ts` "참조 = 실제 URL 자리만(Codex R2)" |
- **RED → GREEN:** `logs/codex-fix-red.txt`(2 실패) → 전체 typecheck 0 · lint 0 · test 353파일 3129 passed · build exit 0 · 진입 128.71 · 복원 131.69 불변(`logs/*-r2-fix.txt`).
- 반영은 1회까지라 재리뷰는 돌리지 않았습니다.
- **Codex 미검토 커밋:** 09c4309d(8절 F-14 수정 — 보안 검사의 범위를 좁히는 변경)는 Codex 뒤에 들어갔습니다. BRIEF-R2의 Codex 1회 상한을 지켜 독립 검증이 0입니다. **다음 레인에서 09c4309d 범위로 Codex 1회를 권고**합니다(판단: Jarvis).

## 8. R2 Ego Lite (BRIEF-R2 2항) — build + `vite preview --port 4395 --strictPort` · space 36
- **문서:** 모던 카페 A v1 → 보정값 v2 → B안 새로 시작 → SEO 입력(게이트 차단 0) → Hero 1200×800 · About 800×800 이미지(PNG 입력 → WebP 저장) · 대체텍스트 입력.
- **1차 실측에서 결함 1건:** zip은 성공했지만 단일 HTML이 "내보내지 못했습니다"로 실패했고, 다시 눌러도 같았습니다. CDP `Debugger.setPauseOnExceptions`로 잡은 원인은 `Error: 정적 HTML 브랜드 문자열이 있습니다`였습니다. CP4의 F-14 검사가 head CSS 전체를 보는데, 단일 HTML은 글꼴을 `url(data:font/woff2;base64,…)`로 넣습니다. Pretendard 글꼴의 base64 안에 금지 4글자(대소문자 무시)가 들어 있어 실패합니다. 글꼴 바이트는 build마다 고정이라 **매번 같은 실패**입니다. 다시 눌러도 같았던 것과 맞습니다. 즉 **CP4(575576b8)부터 Pretendard 킷 단일 HTML 내보내기가 매번 실패하던 회귀**입니다(main 미반영 · 단위 테스트는 가짜 글꼴이라 놓쳤습니다). zip은 글꼴이 파일 경로라 걸리지 않습니다.
  - 수정: `staticMarkup.ts` `assertNoBrand`가 CSS의 `url(data:…)` 본문을 비우고 검사합니다. data: 밖 CSS의 브랜드는 그대로 실패합니다.
  - RED `logs/ego-fix-red.txt` → GREEN 3130 passed. 커밋 09c4309d. 새 build로 처음부터 다시 측정했습니다.
- **2차(최종 build) 결과:** zip 1.1초 · 0.6MB(이미지 2장 · 글꼴 2개) · 단일 HTML 0.4초 · 0.8MB(이미지 2장 포함). 두 결과 모두 내려받았습니다. 내려받기는 결과 줄의 `a download` 링크로 합니다(자동 시작 없음 — 설계대로).

| AC | 판정 | 근거 |
|---|---|---|
| EXP-AC-R1 | **통과** | `ditto -xk`(보관 유틸리티와 같은 엔진)로 해제 → `python3 -m http.server 4396` → 1280·390에서 이미지 2장(1200×800 · 800×800)과 Pretendard 400·700이 `loaded`입니다. 가로 넘침 0. 화면은 미리보기 구성과 같습니다(`shots/r2-zip-http-1280.png` · `r2-zip-http-390.png`). Finder 더블클릭 해제는 하지 않았습니다. |
| EXP-AC-R1b(관찰) | 기록 | Ego Lite(Chromium) `file://`: zip 폴더는 이미지 2장 로드, `document.fonts.check` 400·700 true(`shots/r2-zip-file-1280.png`). 단일 HTML `file://`도 data: 이미지 2장과 글꼴 loaded(`shots/r2-html-file-1280.png`). Safari는 확인하지 않았습니다. Q19 재판정 사유는 관찰되지 않았습니다. |
| EXP-AC-R2 | **통과** | 페이지 요청은 `/assets/images/img-01·02.webp`와 `/assets/fonts/Pretendard-400·700.woff2`, 4건 모두 200입니다. 외부 요청 0. 서버 로그의 404 1건은 브라우저가 스스로 요청한 `/favicon.ico`입니다. 문서가 참조한 것이 아닙니다(head `link`는 F-15로 금지). index.html 안의 `https://tailwindcss.com`은 CSS 라이선스 주석이라 요청이 생기지 않습니다. |
| EXP-AC-R3 | **BLOCKED** | 실화면 20MB+ 문서는 만들지 않았습니다. 입력 한도(파일 10MB · 저장 1920폭 WebP 0.82)라서 노이즈 이미지 10장 이상을 슬롯마다 올려야 합니다. 이 레인은 이미 BRIEF-R2 턴 상한(50턴)을 넘겨 새 측정을 열지 않았습니다. 단위 EXP-AC-17(20MB 이미지 문서 성공)만 근거입니다. |
| EXP-AC-R4 | **부분** | 실패 alert 1개는 **수정 전 build** 1차 실측에서만 관찰했습니다("내보내지 못했습니다 · 다시 시도" 1개, role=alert). 최종 build에서 실패 경로는 다시 보지 않았습니다. 최종 build, 390 폭 기준: 성공 status 1개, alert 글자 0. 포커스는 누른 "정적 사이트(zip) 내보내기" 버튼에 남습니다. 버튼은 351×40, 내려받기 링크는 48×32(WCAG 2.5.8 24px 이상). 1280에서 버튼은 252×40으로 zip이 위, HTML이 아래입니다(`shots/r2-1280-buttons.png` · `r2-390-buttons.png`). 접근성 snapshot에 status·alert 영역이 각 1개 있습니다. |
| EXP-AC-R5 | **통과(일부)** | `unzip -t` → "No errors detected"(exit 0) · `unzip -l` 7파일(index.html · LICENSES.md · OFL.txt · 글꼴 2 · 이미지 2). Windows 탐색기는 환경이 없어 QA 몫으로 넘깁니다. |

- **내려받기 차단 보조 문장:** 두 형식의 성공 Callout 모두 "내려받기가 시작되지 않으면 브라우저의 다운로드 권한을 확인하세요"를 표시합니다(Q14).
- **관찰(이번 범위에서 고치지 않음):** 성공 제목 "정적 사이트(zip)을 만들었습니다" — 조사가 "를"이어야 맞습니다. 형식 이름 뒤에 고정 조사를 붙이는 문구입니다. 문안 담당(Hemingway) 후속으로 넘깁니다.
- **환경:** 첫 preview는 백그라운드 기본 시간 한도(10분)로 종료되어 다시 띄웠습니다. 수정 build 뒤에는 한 번 더 띄웠습니다. 마지막에 둘 다 종료했습니다: `lsof -nP -iTCP:4395 -sTCP:LISTEN` → 출력 없음 exit 1 · 4396(http.server)도 exit 1. IDB `design-studio` 삭제(남은 DB 0) · `finish({keep:[]})` 완료.
- 내려받은 파일·해제 폴더·입력 이미지는 저장소 밖(`/tmp/m4a-r2-ego/`)에 두었습니다. 저장소에는 스크린샷 6장만 커밋합니다.

## 9. FIX1 (BRIEF-FIX1 · base a834eb88 — AppSec M-1·M-2·L-1·L-2 · QA M2a·M2c · 문구 1)
**결론(FIX1):** AppSec M-1·M-2·L-1·L-2와 QA 변이 생존 M2a·M2c, 문구 1건을 TDD로 고쳤습니다(항목마다 RED 로그). M2a·M2c는 이제 FAIL로 잡힙니다(`logs/fix1-f2-mutations.txt`). Codex 1회는 needs-attention(P2 2 · P3 1)이었고, P2-1(루트 template)을 반영했습니다. P2-2·P3은 사유를 남기고 반영하지 않았습니다(아래 Codex 표). 최종 게이트: typecheck 0 · lint 0 · test 353파일 **3134 passed** · build exit 0. 예산은 진입 **128.71** · 복원 **131.69**로 개정 18 기준선과 같습니다(**증분 0**, 기준선 파일 수정 0). 렌더 JS는 84.29/90입니다. 기존 단언 약화·skip 0(조사 1건은 정정).

| 항목 | 수정 | RED → GREEN | 커밋 |
|---|---|---|---|
| F1 M-1·M-2 | `staticMarkup.ts` `clean()` — 지우는 요소를 `localName` 소문자 Set 비교로(기존 4종 + `template`·`animate`·`set`·`animatemotion`·`animatetransform`). template를 지우면 안쪽(fragment)도 함께 사라집니다 | 퍼즈 M06·M07·M12·M13·M41·M42·M43 + animateMotion·animateTransform + 대문자 `SET`·`ANIMATE` 9건 → 결과 `<script` 1개(고정) · `onerror`·`evil.example`·`javascript:`·`<template`·`shadowrootmode`·`<animate`·`<set` 0. RED `logs/fix1-f1-red.txt`(1 실패) → staticHtml+zip 8파일 116 passed | 053ab4ff |
| F2 L-2 | `staticMarkup.ts` F-14 제외 정규식을 `url(data:font/…;base64,<base64 글자>)`로 좁히고(`CSS_FONT_DATA_URL`) **CSS 입력에만** 적용 — `assertNoBrand(site, css, [notice, STATIC_MENU_SCRIPT])`. notice·고정 스크립트는 치환 없이 검사 | Codex 주석 경계(무따옴표·따옴표) · `content:"url(data:…)"`(B03) · notice `url(data:Design Studio)` · zip 글꼴 경로 `assets/fonts/<브랜드>-400.woff2`(M2a 포착) · data 글꼴 2개 사이 규칙(M2c 포착) = 실패, 실제 인라인 글꼴(따옴표 유무·zip) = 통과. RED `logs/fix1-f2-red.txt` → 117 passed. **변이 증명** `logs/fix1-f2-mutations.txt`: M2a·M2c 각각 1 실패 → 복원 26 passed | a6bace1b |
| F3 L-1 | `staticMarkup.ts` `CSS_URL`을 엄격형(큰따옴표·작은따옴표·무따옴표[공백·따옴표·괄호 0])으로 바꾸고 `cssUrls()`가 "`url(` 출현 수 = 엄격 매치 수"가 아니면 실패. 킷 CSS(`assertNoExternalCss`)는 CSS 이스케이프를 해석한 텍스트로 검사하고 `@import`·`image-set(` 1개라도 실패. 본문 CSS(`hasExternalCss`)는 `\` 금지가 이미 있어 수 비교만 추가 | 따옴표 섞인 url() — 본문 style(M28·M29)·style 요소(M30)·킷 CSS(C06 + `'…)…'`) · 킷 `@\69mport`(C03)·`u\72l(`(C04)·`image-set(`(C05) html·zip 양쪽 = 실패. Tailwind 이스케이프 선택자(`.md\:grid`·`\[…\(45deg\,red\)\]`·`.\31 0`)·`content:"\201C"`·따옴표 data: url = 통과. RED `logs/fix1-f3-red.txt` → 118 passed. 실제 build CSS 확인은 F5 | 8436d515 |
| F4 문구 | `components/studio/ExportAfter.tsx` 성공 제목의 `NAME`에 목적격 조사를 형식별로 붙임("zip을" · "정적 HTML을" · "정적 사이트(zip)를"). 공용 템플릿의 고정 "을"을 없앰 — HTML 쪽 문장은 그대로 | `ExportFlow.test.tsx` 기존 단언 "정적 사이트(zip)을 만들었습니다" → "를"로 **정정(약화 아님)** · RED `logs/fix1-f4-red.txt` → components/studio 41파일 300 passed | 86b74a22 |
| F5 게이트·예산 | 코드 변경 0 | typecheck exit 0 · lint exit 0 · test 353파일 **3133 passed** · build exit 0(`logs/*-fix1.txt`). 진입 **128.71 · 복원 131.69 = 개정 18 기준선(증분 0, 기준선 갱신 없음)** · 렌더 JS 84.29/90. 실제 build 킷 CSS(`render-ncA71k8b.css`, url 6 · 이스케이프 선택자 다수)를 `buildStaticHtml`에 넣어 html(글꼴 data:)·zip(assets/fonts) 둘 다 통과 — 임시 vitest 실행 뒤 삭제(`logs/fix1-real-css.txt`). 킷 이스케이프(`@\69mport`·`u\72l(`)는 같은 출현 수 방식으로 잡혀 범위에 포함(정상 빌드 깨짐 0) | b3a3df09 |

### FIX1 Codex (1회 · 반영 1회)
- 실행: `codex-companion adversarial-review --scope branch --base a834eb88 "<관점 4개: 제거 우회 · F-14 경계 · url 출현 수·이스케이프 우회/오탐 · 조사 회귀>"`. 원문 `logs/codex-fix1.txt`. 판정 needs-attention. ExportAfter 조사 변경은 회귀 0.
| # | 지적 | 처리 | 근거 |
|---|---|---|---|
| P2-1 | 사이트 루트 자체가 `<template data-site-root shadowrootmode>`면 `querySelectorAll("*")` 밖이라 내용이 그대로 나감(기준 커밋부터 있던 결함) | **반영** — 루트 localName이 제거 대상이면 "사이트 루트가 없는 마크업" 실패 | RED `logs/codex-fix1-red.txt`(template·script·대문자 TEMPLATE 루트 3건) → 119 passed → 전체 3134 passed(`logs/*-fix1-codex.txt`) |
| P2-2 | 문자열 안 `content:"url("`·`url(`이 든 Tailwind 이스케이프 선택자도 출현 수에 잡혀 정상 CSS가 실패(오탐) | **미반영(의도된 fail-closed)** | BRIEF-FIX1 3항이 "출현 수 = 엄격 매치 수, 다르면 실패"를 지정했습니다. 실제 build 킷 CSS에는 해당 모양이 0이고 통과를 확인했습니다(`logs/fix1-real-css.txt`). 본문 CSS는 렌더 style(`kitVars`)뿐이라 따옴표가 막혀 있습니다. 토큰 문맥 파서는 새 설계라 후속 판단(Jarvis)으로 넘깁니다. 킷 CSS에 `url(` 글자가 든 content·임의값 클래스를 추가하면 내보내기가 실패합니다 — 이를 회귀 신호로 씁니다 |
| P3 | 글꼴 data URL 모양(`url(data:font/woff2;base64,<base64 글자>)`)이 CSS 문자열·주석 안에 있으면 그 안의 브랜드 글자도 제외됨 | **미반영(기록)** | BRIEF 2항·AppSec 패치가 정한 범위(base64 글자 한정 — 주석·규칙 경계를 넘지 못함)는 지켰습니다. 남는 경우는 생성기 고정 CSS의 문자열·주석에 글꼴 URL 모양과 base64 글자의 브랜드를 함께 넣는 경우뿐입니다. 고치려면 CSS 토큰화가 필요해 P2-2와 같은 후속으로 묶습니다 |
- 반영은 1회까지라 재리뷰는 돌리지 않았습니다. 재반영 뒤 예산: 진입 128.71 · 복원 131.69(증분 0) · 렌더 JS 84.29.

### FIX1 범위 밖 이월 (BRIEF-FIX1 "범위 밖")
| 항목 | 내용 | 이월 사유 |
|---|---|---|
| L-3 | `storeZip.ts` `BAD_NAME`이 허용표보다 약함(`a/./b`·`a//b`·Windows 금지 문자) | 현재 호출자가 허용표를 먼저 거쳐 도달 불가 · BRIEF 범위 밖 |
| L-4 | zip DOS 시각 로컬 시간대 의존(같은 revision · 기기 간 해시 차이) | SPEC 2.4 "로컬 시각" 명시 — 설계 판단 필요 |
| L-5 | SPEC 4.3 "LICENSES.md F-14" 미구현 | 내용이 상수·고정 계열뿐 — SPEC 불일치 기록 |
| L-6 | `exportFileStem` bidi·제로폭 문자 · 예약 이름 부분 일치 | 자기 기기 표시에만 영향 |
| Info I-1~I-4 | postMessage `*` · noscript mXSS · ZIP_MAX 사후 검사 · 일반 template | I-4(일반 template)는 F1로 함께 제거됨. 나머지는 기록만 |
| EXP-AC-14 | 용량 초과 refused 경로(저장소 `memoryDocBook runJob`) | 쓰기 범위 밖(저장소 코드) — 3절 편차 3 |
| `readProject` 신뢰 경계 | 프로젝트 파일 가져오기 → `validatePageDoc` 심층 검토 | AppSec [미확인] — 별도 레인 |
| CSP meta(AppSec 항목 6 권고) | 생성기 고정 CSP meta | 새 설계 — SPEC 개정 후보 |

## 10. 열린 항목 (Jarvis)
1. EXP-AC-R3 실화면 20MB+ — BLOCKED(턴 상한). 단위 EXP-AC-17만 확인했습니다.
2. EXP-AC-R5 Windows 탐색기 해제 — QA 몫입니다.
3. 09c4309d Codex 미검토 — 다음 레인에서 1회를 권고합니다.
4. ~~"정적 사이트(zip)을" 조사 오류~~ — FIX1 F4에서 해소.
5. EXP-AC-R4 실패 alert는 최종 build에서 다시 보지 않았습니다.
6. 턴: BRIEF-R2 상한 50턴을 넘겼습니다(Ego Lite 진단·재실측 때문입니다).
