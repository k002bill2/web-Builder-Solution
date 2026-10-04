# M2A-CLOSE-DEV — M2a 마감: Codex P2 6건 — REPORT

- 브리프 `docs/06-handoff/M2A-CLOSE_DEV_BRIEF.md` · 시작 커밋 `0180860`(main `b8a270b` + 브리프) · 브랜치 `k002bill2/m2a-close-dev`

## 1. 커밋 표
| 단계 | 커밋 | 내용 |
|---|---|---|
| 수신 | b0066a8 | 수신 기록 · REPORT 골격 · `gate.sh` |
| D1 | 73b4aad | P2-2 생성기 청크 실패 기억 |
| D2 | 6910c33 | P2-3 `blob:` 검사를 URL 자리로 |
| D3 | (D3 커밋) | P2-1 이탈 해제 제거 — 잡 수명 동안 URL 유지 |

## 2. P2 6건
| # | 원인 | 수정 | 테스트(RED → GREEN) | 커밋 |
|---|---|---|---|---|
| D1 P2-2 | `memoryDocBook.ts` `browser ??= load().then(...)`가 rejected Promise를 그대로 기억 → 다시 시도해도 즉시 실패. 슬롯 로더(`exportFlow.ts`)가 `retryableImport`가 아니라 브라우저가 실패한 동적 import URL을 기억 | 실패 시 `browser = undefined`(다음 실행이 슬롯 로더를 다시 부름) · 슬롯 로더 = `retryableImport(() => import("./staticHtml/staticHtml"))` | RED `logs/d1-red.txt`(2 실패) → GREEN: `memoryExport.test.ts` "P2-2 첫 로드 실패 → INFRA → 같은 요청 재시도 → 성공 · 로더 2회" · `chunkRetryWiring.test.ts` "슬롯 로더도 retryableImport" · gate `logs/d1.txt` exit 0 | 73b4aad |
| D2 P2-3 | `staticMarkup.ts` `blob:` 검사가 `site.outerHTML` 전체 정규식 → 본문·대체텍스트의 글자 "blob:"도 영구 INFRA 실패 | `hasBlobUrl` — `src`·`href`·`srcset`·`poster` 값(목록 항목 머리)과 `style` 속성·`<style>` 글자의 `url(blob:`만 검사 | RED `logs/d2-red.txt`(1 실패) → GREEN: `staticMarkup.test.ts` "P2-3 — 본문·alt·title 글자 성공 · src·href(공백·대문자)·srcset·poster·style url( 6종 실패" + 기존 `img src="blob:"` 단언 그대로 · gate `logs/d2.txt` exit 0 | 6910c33 |
| D3 P2-1 | `ExportAfter.tsx` `DownloadLink`가 편집기 이탈(경로 변경) 때 `releaseDownloads()`로 이 탭의 object URL을 모두 해제 → 돌아와 같은 revision을 요청하면 멱등(8.3.2)이 같은 잡의 해제된 `downloadRef`를 돌려줘 링크가 죽음 | **Jarvis 기본안 그대로**: 이탈 해제 제거(`DownloadLink` effect · `exportDownloads.ts` 장부 · `exportFlow`의 `rememberDownload` 삭제) → URL은 잡(=메모리 저장소)이 살아 있는 동안 유지. 해제는 생성기(`createStaticHtmlGenerator`)가 이미 하던 대로 같은 프로젝트의 **새 결과가 나올 때** 이전 URL 1회(프로젝트당 살아 있는 URL ≤ 1). 멱등 규칙 변경 0 | RED `logs/d3-red.txt`(revokeObjectURL 1회) → GREEN: `ExportFlow.test.tsx` "P2-1 내보내기 → 이탈 → 돌아와 같은 revision → 같은 href 링크 · revoke 0" · `staticHtml.test.ts` "P2-1 새 revision 결과 → 이전 URL 해제 1회 · 새 revision 생성 실패면 이전 URL 유지"(기존 동작 고정 — 처음부터 GREEN) · gate `logs/d3.txt` exit 0 | (D3 커밋) |
| D4 P2-a | (진행 중) | | | |
| D5 P2-b | (진행 중) | | | |
| D6 P2-c | (진행 중) | | | |

## 3. 번들
| 시점 | `/studio` 진입(≤127.70) | 렌더 JS(≤89.70) | 그 밖 | 로그 |
|---|---|---|---|---|
| 기준(3c 마감 `logs/c4-fix.txt`) | 127.20 | 80.12 | 공통 89.35 · catalog 102.03 · references 99.38 · compare 121.69 · profile 118.66 · projects 100.30 | `dev/active/m2a-3c/logs/c4-fix.txt` |
| D1 | 127.19 | 80.12 | 공통 89.34 · 102.03 · 99.38 · 121.69 · 118.65 · 100.28 (모두 ±0.03 안) | `logs/d1.txt` |
| D2 | 127.22 | 80.12 | 공통 89.35 · 102.04 · 99.39 · 121.71 · 118.67 · 100.30 (기준 대비 +0.02 이하) | `logs/d2.txt` |
| D3 | 127.20 | 80.12 | 공통 89.35 · 102.04 · 99.39 · 121.71 · 118.67 · 100.30 | `logs/d3.txt` |

## 4. SPEC 차이
(진행 중)

## 5. Codex
(D7)

## 6. 남은 위험
(D7)

## 7. 서버
(D7)
