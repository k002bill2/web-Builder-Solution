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
| D5 | (D5 커밋) | P2-b 토큰 없는 PNG = 폴백으로 성공 |

## 2. P2 6건
| # | 원인 | 수정 | 테스트(RED → GREEN) | 커밋 |
|---|---|---|---|---|
| D1 P2-2 | `memoryDocBook.ts` `browser ??= load().then(...)`가 rejected Promise를 그대로 기억 → 다시 시도해도 즉시 실패. 슬롯 로더(`exportFlow.ts`)가 `retryableImport`가 아니라 브라우저가 실패한 동적 import URL을 기억 | 실패 시 `browser = undefined`(다음 실행이 슬롯 로더를 다시 부름) · 슬롯 로더 = `retryableImport(() => import("./staticHtml/staticHtml"))` | RED `logs/d1-red.txt`(2 실패) → GREEN: `memoryExport.test.ts` "P2-2 첫 로드 실패 → INFRA → 같은 요청 재시도 → 성공 · 로더 2회" · `chunkRetryWiring.test.ts` "슬롯 로더도 retryableImport" · gate `logs/d1.txt` exit 0 | 73b4aad |
| D2 P2-3 | `staticMarkup.ts` `blob:` 검사가 `site.outerHTML` 전체 정규식 → 본문·대체텍스트의 글자 "blob:"도 영구 INFRA 실패 | `hasBlobUrl` — `src`·`href`·`srcset`·`poster` 값(목록 항목 머리)과 `style` 속성·`<style>` 글자의 `url(blob:`만 검사 | RED `logs/d2-red.txt`(1 실패) → GREEN: `staticMarkup.test.ts` "P2-3 — 본문·alt·title 글자 성공 · src·href(공백·대문자)·srcset·poster·style url( 6종 실패" + 기존 `img src="blob:"` 단언 그대로 · gate `logs/d2.txt` exit 0 | 6910c33 |
| D3 P2-1 | `ExportAfter.tsx` `DownloadLink`가 편집기 이탈(경로 변경) 때 `releaseDownloads()`로 이 탭의 object URL을 모두 해제 → 돌아와 같은 revision을 요청하면 멱등(8.3.2)이 같은 잡의 해제된 `downloadRef`를 돌려줘 링크가 죽음 | **Jarvis 기본안 그대로**: 이탈 해제 제거(`DownloadLink` effect · `exportDownloads.ts` 장부 · `exportFlow`의 `rememberDownload` 삭제) → URL은 잡(=메모리 저장소)이 살아 있는 동안 유지. 해제는 생성기(`createStaticHtmlGenerator`)가 이미 하던 대로 같은 프로젝트의 **새 결과가 나올 때** 이전 URL 1회(프로젝트당 살아 있는 URL ≤ 1). 멱등 규칙 변경 0 | RED `logs/d3-red.txt`(revokeObjectURL 1회) → GREEN: `ExportFlow.test.tsx` "P2-1 내보내기 → 이탈 → 돌아와 같은 revision → 같은 href 링크 · revoke 0" · `staticHtml.test.ts` "P2-1 새 revision 결과 → 이전 URL 해제 1회 · 새 revision 생성 실패면 이전 URL 유지"(기존 동작 고정 — 처음부터 GREEN) · gate `logs/d3.txt` exit 0 | 19891a1 |
| D4 P2-a | `StudioLayout.tsx` PNG 준비 조건이 "dirty·saving 아님"이라 자동 저장 `failed`·`offline`·`stale`(미저장 편집이 남음)에서도 열림 → 파일 이름 `r{savedRevision}`과 내용 불일치 | 준비 = 캔버스 그림 + 저장 `idle`·`saved`. `failed`·`offline`·`stale`이면 `PngSave` 새 선택 prop `reason` = 기존 저장 상태 문장(`saveStatusText` — "저장하지 못했습니다" · "오프라인 — 연결되면 저장합니다" · "다른 곳에서 이 문서가 바뀌었습니다"). 그 밖 준비 전 문장은 그대로 | RED `logs/d4-red.txt`(3 실패) → GREEN: `StudioLayout.test.tsx` "저장 failed·offline·stale → aria-disabled + 이유(describedby 첫 id) · 캡션 그대로"(it.each 3) + "saved → 열림" · gate `logs/d4.txt` exit 0 | 832ba3b |
| D5 P2-b | `pngCapture.ts` 킷 토큰 없음(프로필 조회 실패)이면 렌더 문서가 `error{NO_KIT_TOKENS}`를 보내고 `renderAndSerialize`가 이를 즉시 실패로 처리 → 캔버스엔 중립 폴백이 보이는데 PNG는 실패 | `renderAndSerialize`에 선택 인자 `tolerated`(기본 빈 목록) — PNG만 `["NO_KIT_TOKENS"]`를 넘겨 폴백 rects(바닥 > 0)·직렬화를 기다림. 정적 HTML은 인자 없음 = 모든 렌더 오류가 실패(정책 그대로) | RED `logs/d5-red.txt`(1 실패: "렌더 문서 오류 NO_KIT_TOKENS") → GREEN: `pngCapture.test.ts` "토큰 없음 → 성공 · `png_succeeded.fallback_count` = 섹션 수 · `_구조포함`" + "PNG도 INVALID_DOC는 실패" · `staticHtml.test.ts` it.each "렌더 오류 NO_KIT_TOKENS → 실패"(정적 HTML 정책 고정) · gate `logs/d5.txt` exit 0(첫 실행은 내 테스트의 미사용 변수로 lint 1 → 고친 뒤 exit 0) | (D5 커밋) |
| D6 P2-c | (진행 중) | | | |

## 3. 번들
| 시점 | `/studio` 진입(≤127.70) | 렌더 JS(≤89.70) | 그 밖 | 로그 |
|---|---|---|---|---|
| 기준(3c 마감 `logs/c4-fix.txt`) | 127.20 | 80.12 | 공통 89.35 · catalog 102.03 · references 99.38 · compare 121.69 · profile 118.66 · projects 100.30 | `dev/active/m2a-3c/logs/c4-fix.txt` |
| D1 | 127.19 | 80.12 | 공통 89.34 · 102.03 · 99.38 · 121.69 · 118.65 · 100.28 (모두 ±0.03 안) | `logs/d1.txt` |
| D2 | 127.22 | 80.12 | 공통 89.35 · 102.04 · 99.39 · 121.71 · 118.67 · 100.30 (기준 대비 +0.02 이하) | `logs/d2.txt` |
| D3 | 127.20 | 80.12 | 공통 89.35 · 102.04 · 99.39 · 121.72 · 118.68 · 100.30 | `logs/d3.txt` |
| D4 | 127.23 | 80.12 | 공통 89.35 · 102.04 · 99.39 · 121.70 · 118.67 · 100.30 | `logs/d4.txt` |
| D5 | 127.22 | 80.12 | 공통 89.34 · 102.03 · 99.38 · 121.69 · 118.66 · 100.28 | `logs/d5.txt` |

## 4. SPEC 차이
(진행 중)

## 5. Codex
(D7)

## 6. 남은 위험
(D7)

## 7. 서버
(D7)
