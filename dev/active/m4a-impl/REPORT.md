# M4-a-2 REPORT — 정적 zip 내보내기 구현

**결론: CP1~CP5 구현 완료, 단위 게이트(typecheck · lint · test 350파일 3105건 · build exit 0) 통과. 결정 1에 따라 멈춤: `/studio` 정규화 진입이 128.66 → 128.67(+0.01)이고, 감량 1회 뒤에도 남았습니다. 개정 18 판단은 Jarvis 몫입니다. 그래서 Ego Lite와 Codex review는 실행하지 않았습니다(BLOCKED).**

근거 수준: 단위·빌드 = L1(실행 출력, 로그 `logs/`). 실화면 = 미실행.
- build exit 0은 스크립트 허용치(+0.03 · 멈춤선 128.69) 안이라는 뜻일 뿐입니다. 결정 1의 "진입 증분 0"을 통과했다는 뜻이 아닙니다.

## 1. 예산 (결정 1 — 진입 증분 0) · 기준선 파일 수정 0
| 시점 | /studio 정규화 | 복원 정규화 | raw | 렌더 JS | 로그 |
|---|---|---|---|---|---|
| 기준선(base d8e548e5) | 128.66 | 131.64 | 129.96 | 84.22 | `logs/build-baseline.txt` |
| CP2 (protocol `serialize{refs}`) | 128.66 (0) | 131.64 (0) | 129.97 | 84.29 (+0.07, 스파이크 실측과 같음) | `logs/build-cp2b.txt` |
| CP5 (버튼 글자 · `static-zip` 키) | **128.67 (+0.01)** | **131.65 (+0.01)** | 129.96 | 84.29 | `logs/build-cp5.txt` |
| 감량 1회 (`isFormat` → `includes`) | 128.67 (+0.01) | 131.65 (+0.01) | 129.97 | 84.29 | `logs/build-cp5-trim.txt` |

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
- **부분:** EXP-AC-02 — 기존 흐름 테스트에서 `static-zip` 요청 1회와 형식별 안내까지 확인했습니다. E-AC-28~30 시나리오 전체를 zip으로 다시 돌리지는 않았습니다.
- **부분:** EXP-AC-14 — 아래 편차 3번 참고.
- **미달:** EXP-AC-19 — 진입 +0.01(1절).
- **BLOCKED:** EXP-AC-R1~R5(실화면) — 결정 1 멈춤.

### 기존 단언 변경 (SPEC 7절 근거 · 약화·skip 0)
| 파일 | 이전 | 이후 | 근거 |
|---|---|---|---|
| `components/studio/ExportFlow.test.tsx` | 버튼 이름 "React 프로젝트(zip) 내보내기"·"정적 HTML 내보내기" · react-zip 안내 문구 | "정적 사이트(zip) 내보내기"·"HTML 파일 1개 내보내기" · static-zip 안내 문구 + 요청 형식 `static-zip` 단언 추가 | 7.3 · Q18 A |
| `components/studio/ExportChunkFailure.test.tsx` | 버튼 이름 "정적 HTML 내보내기" | "HTML 파일 1개 내보내기" | 7.3 |
| `components/studio/PngSave.test.tsx:122` | 버튼 이름 "정적 HTML 내보내기" | "HTML 파일 1개 내보내기" | 7.3(파일 표에 명시) — 아래 편차 2번 |
| `features/studio/exportFlow.test.ts` · `components/studio/ExportResultNotes.test.tsx` | 3MB 안내 "zip 내보내기는 다음 단계에서 지원합니다" | "정적 사이트(zip)는 이미지를 파일로 나눠 담습니다" | 2.5 · EXP-AC-16 |
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
- **Ego Lite: BLOCKED** — 결정 1 멈춤(+0.01). 개정 18 판단 뒤 재개합니다. 할 일: zip 내려받기 → `unzip -l/-t` → `file://` 이미지·글꼴 → 단일 HTML → 1280·390.
- **Codex review(`--scope branch --base d8e548e5`): BLOCKED** — 같은 사유입니다. 재개 순서는 Ego Lite → Codex입니다.

## 6. 서브에이전트
- **CP1 storeZip:** worker 1개, `isolation: worktree`. 24건 통과 보고를 받은 뒤 메인에서 파일을 복사해 다시 실행했고 24 passed를 확인했습니다. 커밋은 c568e661입니다. worktree(`.claude/worktrees/agent-a35f9a039630e0c96`)와 브랜치는 제거했습니다.
