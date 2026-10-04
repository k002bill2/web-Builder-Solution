# M2A-CLOSE-DEV — M2a 마감: Codex P2 6건 — REPORT

- 브리프 `docs/06-handoff/M2A-CLOSE_DEV_BRIEF.md` · 시작 커밋 `0180860`(main `b8a270b` + 브리프) · 브랜치 `k002bill2/m2a-close-dev`

## 1. 커밋 표
| 단계 | 커밋 | 내용 |
|---|---|---|
| 수신 | b0066a8 | 수신 기록 · REPORT 골격 · `gate.sh` |
| D1 | 73b4aad | P2-2 생성기 청크 실패 기억 |
| D2 | 6910c33 | P2-3 `blob:` 검사를 URL 자리로 |
| D3 | 19891a1 | P2-1 이탈 해제 제거 — 잡 수명 동안 URL 유지 |
| D4 | 832ba3b | P2-a PNG 준비 = 저장 idle·saved |
| D5 | 1da91cb | P2-b 토큰 없는 PNG = 폴백으로 성공 |
| D6 | 84593a0 | P2-c PNG 좌표계 = 실제 rem px |
| D7 | 마감 커밋(브랜치 HEAD) | Codex 1회(P1 0) · REPORT 마감 · 서버 0 — 코드 변경 0 |

## 2. P2 6건
| # | 원인 | 수정 | 테스트(RED → GREEN) | 커밋 |
|---|---|---|---|---|
| D1 P2-2 | `memoryDocBook.ts` `browser ??= load().then(...)`가 rejected Promise를 그대로 기억 → 다시 시도해도 즉시 실패. 슬롯 로더(`exportFlow.ts`)가 `retryableImport`가 아니라 브라우저가 실패한 동적 import URL을 기억 | 실패 시 `browser = undefined`(다음 실행이 슬롯 로더를 다시 부름) · 슬롯 로더 = `retryableImport(() => import("./staticHtml/staticHtml"))` | RED `logs/d1-red.txt`(2 실패) → GREEN: `memoryExport.test.ts` "P2-2 첫 로드 실패 → INFRA → 같은 요청 재시도 → 성공 · 로더 2회" · `chunkRetryWiring.test.ts` "슬롯 로더도 retryableImport" · gate `logs/d1.txt` exit 0 | 73b4aad |
| D2 P2-3 | `staticMarkup.ts` `blob:` 검사가 `site.outerHTML` 전체 정규식 → 본문·대체텍스트의 글자 "blob:"도 영구 INFRA 실패 | `hasBlobUrl` — `src`·`href`·`srcset`·`poster` 값(목록 항목 머리)과 `style` 속성·`<style>` 글자의 `url(blob:`만 검사 | RED `logs/d2-red.txt`(1 실패) → GREEN: `staticMarkup.test.ts` "P2-3 — 본문·alt·title 글자 성공 · src·href(공백·대문자)·srcset·poster·style url( 6종 실패" + 기존 `img src="blob:"` 단언 그대로 · gate `logs/d2.txt` exit 0 | 6910c33 |
| D3 P2-1 | `ExportAfter.tsx` `DownloadLink`가 편집기 이탈(경로 변경) 때 `releaseDownloads()`로 이 탭의 object URL을 모두 해제 → 돌아와 같은 revision을 요청하면 멱등(8.3.2)이 같은 잡의 해제된 `downloadRef`를 돌려줘 링크가 죽음 | **Jarvis 기본안 그대로**: 이탈 해제 제거(`DownloadLink` effect · `exportDownloads.ts` 장부 · `exportFlow`의 `rememberDownload` 삭제) → URL은 잡(=메모리 저장소)이 살아 있는 동안 유지. 해제는 생성기(`createStaticHtmlGenerator`)가 이미 하던 대로 같은 프로젝트의 **새 결과가 나올 때** 이전 URL 1회(프로젝트당 살아 있는 URL ≤ 1). 멱등 규칙 변경 0 | RED `logs/d3-red.txt`(revokeObjectURL 1회) → GREEN: `ExportFlow.test.tsx` "P2-1 내보내기 → 이탈 → 돌아와 같은 revision → 같은 href 링크 · revoke 0" · `staticHtml.test.ts` "P2-1 새 revision 결과 → 이전 URL 해제 1회 · 새 revision 생성 실패면 이전 URL 유지"(기존 동작 고정 — 처음부터 GREEN) · gate `logs/d3.txt` exit 0 | 19891a1 |
| D4 P2-a | `StudioLayout.tsx` PNG 준비 조건이 "dirty·saving 아님"이라 자동 저장 `failed`·`offline`·`stale`(미저장 편집이 남음)에서도 열림 → 파일 이름 `r{savedRevision}`과 내용 불일치 | 준비 = 캔버스 그림 + 저장 `idle`·`saved`. `failed`·`offline`·`stale`이면 `PngSave` 새 선택 prop `reason` = 기존 저장 상태 문장(`saveStatusText` — "저장하지 못했습니다" · "오프라인 — 연결되면 저장합니다" · "다른 곳에서 이 문서가 바뀌었습니다"). 그 밖 준비 전 문장은 그대로 | RED `logs/d4-red.txt`(3 실패) → GREEN: `StudioLayout.test.tsx` "저장 failed·offline·stale → aria-disabled + 이유(describedby 첫 id) · 캡션 그대로"(it.each 3) + "saved → 열림" · gate `logs/d4.txt` exit 0 | 832ba3b |
| D5 P2-b | `pngCapture.ts` 킷 토큰 없음(프로필 조회 실패)이면 렌더 문서가 `error{NO_KIT_TOKENS}`를 보내고 `renderAndSerialize`가 이를 즉시 실패로 처리 → 캔버스엔 중립 폴백이 보이는데 PNG는 실패 | `renderAndSerialize`에 선택 인자 `tolerated`(기본 빈 목록) — PNG만 `["NO_KIT_TOKENS"]`를 넘겨 폴백 rects(바닥 > 0)·직렬화를 기다림. 정적 HTML은 인자 없음 = 모든 렌더 오류가 실패(정책 그대로) | RED `logs/d5-red.txt`(1 실패: "렌더 문서 오류 NO_KIT_TOKENS") → GREEN: `pngCapture.test.ts` "토큰 없음 → 성공 · `png_succeeded.fallback_count` = 섹션 수 · `_구조포함`" + "PNG도 INVALID_DOC는 실패" · `staticHtml.test.ts` it.each "렌더 오류 NO_KIT_TOKENS → 실패"(정적 HTML 정책 고정) · gate `logs/d5.txt` exit 0(첫 실행은 내 테스트의 미사용 변수로 lint 1 → 고친 뒤 exit 0) | 1da91cb |
| D6 P2-c | `pngCapture.ts` SVG 폭 = `rem × 16` 고정인데 숨은 iframe 폭은 `${rem}rem`(부모 루트 글꼴 기준) → 기본 글꼴 ≠ 16px이면 iframe 배치 폭·rects 높이와 SVG 폭이 어긋남 | `remPx()`(StructureCanvas의 같은 함수를 `previewFrame.ts`로 옮겨 둘이 공유) — 폭 px = `round(FRAME_REM × remPx)` 하나로 iframe(`width/remPx` rem)·SVG·캔버스 폭을 맞추고 높이 = 그 iframe rects 바닥. iframe 높이 상한도 `MAX_CANVAS_HEIGHT / remPx`. 파일 이름 폭은 프레임 이름(390 등 — 캡션 값) 유지 | RED `logs/d6-red.txt`(iframe 487.5px ≠ SVG 390) → GREEN: `pngCapture.test.ts` "루트 20px · 390 프레임 → iframe 488px = SVG·캔버스 폭 · foreignObject 루트 width 488px · 높이 = 바닥 · 파일 이름 `_390_`" · 기존 16px 단언(iframe 24.375rem · 390×2400) 그대로 · gate `logs/d6.txt` exit 0 | 84593a0 |

## 3. 번들
| 시점 | `/studio` 진입(≤127.70) | 렌더 JS(≤89.70) | 그 밖 | 로그 |
|---|---|---|---|---|
| 기준(3c 마감 `logs/c4-fix.txt`) | 127.20 | 80.12 | 공통 89.35 · catalog 102.03 · references 99.38 · compare 121.69 · profile 118.66 · projects 100.30 | `dev/active/m2a-3c/logs/c4-fix.txt` |
| D1 | 127.19 | 80.12 | 공통 89.34 · 102.03 · 99.38 · 121.69 · 118.65 · 100.28 (모두 ±0.03 안) | `logs/d1.txt` |
| D2 | 127.22 | 80.12 | 공통 89.35 · 102.04 · 99.39 · 121.71 · 118.67 · 100.30 (기준 대비 +0.02 이하) | `logs/d2.txt` |
| D3 | 127.20 | 80.12 | 공통 89.35 · 102.04 · 99.39 · 121.72 · 118.68 · 100.30 | `logs/d3.txt` |
| D4 | 127.23 | 80.12 | 공통 89.35 · 102.04 · 99.39 · 121.70 · 118.67 · 100.30 | `logs/d4.txt` |
| D5 | 127.22 | 80.12 | 공통 89.34 · 102.03 · 99.38 · 121.69 · 118.66 · 100.28 | `logs/d5.txt` |
| D6 | 127.24 | 80.12 | 공통 89.35 · 102.04 · 99.39 · 121.71 · 118.67 · 100.30 | `logs/d6.txt` |

## 4. SPEC 차이
- D3: 브리프 기본안 그대로 — 잡·멱등 규칙(8.3.2)과 충돌 없음(같은 revision = 같은 잡 = 같은 URL, 생성기가 같은 프로젝트의 새 결과 때 이전 URL 1회 해제). 대안(해제된 결과 재생성) 미채택. 메모리 저장소라 탭이 살아 있는 동안 프로젝트당 URL ≤ 1개가 남는다(누수 상한 = 프로젝트 수).
- D4: 새 문구 0 — 이유 문장은 저장 상태 문장(`saveStatusText`) 재사용. 캔버스 미그림·dirty·saving은 기존 "미리보기를 그리는 중입니다" 그대로.
- D6: 루트 글꼴 ≠ 16px이면 PNG 픽셀 폭 = `round(프레임 rem × rem px)`(예: 20px → 488, 487.5를 정수로 맞춤 — 캔버스 폭은 정수, 편집기 캔버스 프레임과 ≤0.5px 차이). 파일 이름 `{폭}`은 캡션과 같은 프레임 이름 값(390)을 유지 — 픽셀 폭을 쓰면 같은 "모바일 · 390" 캡션에 다른 파일 이름이 나온다.

## 5. Codex
- `review --scope branch --base b8a270b` 1회(HEAD `84593a0` — D1~D6 + 수신·브리프 문서) · 원문 `logs/d7-codex.txt` · 진행 로그 `logs/d7-codex.raw.txt`.
- 결과: **지적 0(P1 0 · P2 0)** — "기준 커밋 대비 새로 도입된 구체적인 결함은 발견하지 못했습니다". Codex 메모: 읽기 전용 샌드박스라 vitest는 못 돌림(임시 디렉터리 생성 제한) → 테스트 증거는 이 레인 gate 로그(`logs/d1~d6.txt`, 모두 exit 0).
- 수정 0(P1 없음).

## 6. 남은 위험
1. 전체 vitest ×3 미실행 — 브리프대로 Jarvis 담당. 이 레인은 gate 표적(건마다 바뀐 영역)·가드 76/76만 돌렸다.
2. D3: 결과 URL은 탭이 살아 있는 동안 프로젝트당 1개 남는다(편집기 이탈로 해제하지 않음 — 의도). 실서버 저장소(M4)에서는 서버 결과 URL로 바뀌어 이 장부가 사라진다. `StaticHtmlGenerator.release(projectId)`는 앱에서 부르는 곳이 원래 없었고 그대로 둠(테스트만 사용).
3. D3 테스트는 MemoryRouter라 주소창(`location.pathname`)을 테스트가 `history.pushState`로 함께 옮겨 흉내 낸다 — 실제 브라우저 이탈 실측은 안 함(브리프 범위 밖, 서버 0).
4. D5: 토큰 없는 PNG는 모든 섹션이 중립 폴백(구조 미리보기 표식)으로 담긴다 — 캔버스와 같은 화면. 브라우저 실측은 안 함(단위 테스트만).
5. D6: 루트 글꼴 ≠ 16px 브라우저 실측 안 함(jsdom 루트 20px 단위 테스트). 487.5처럼 소수 px 폭은 정수로 맞춰 편집기 캔버스와 ≤0.5px 차이.
6. 번들: `/studio` 진입 127.20 → 127.24(+0.04, 멈춤선 127.70 안). 그 밖 화면 기준 대비 ±0.02 이하 · 렌더 JS 80.12 그대로.

## 7. 서버
- 이 레인은 서버를 띄우지 않았다(vite dev·preview·python 0 — 브라우저 실측 없음). 종료할 PID 0.
- `lsof -nP -iTCP:4337 -sTCP:LISTEN` → 출력 0줄(exit 1) — D7에서 실행.
- 4339(Designer 레인) 무접촉.
