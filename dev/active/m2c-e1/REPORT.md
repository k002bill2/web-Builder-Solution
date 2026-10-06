# M2C-E1 REPORT — 잃은 이미지 상태 PNG 실패(E-1) 원인 판정

## meta
- 역할 Developer · worktree m2c-e1 · base `9ecc4cf` · BRIEF P0 `3058416`
- 서브에이전트 0 · `app/` 변경 0(`logs/app-diff.txt` 0바이트) · 새 의존성·lock·docs·scripts·CLAUDE.md 수정 0 · push/merge/삭제 0
- Ego Lite space 81(이 레인 생성) · 서버: dev 4337(PID 95897) → preview 4337(PID 97995, cwd = 이 worktree `app`), 둘 다 127.0.0.1 · main 5480(PID 82062) 리슨 확인만, 무접촉

## 0. 결론 — **(c) 환경 한계 · 코드 수정 0**
E-1은 잃은 이미지·이탈·복귀와 무관하다. REQA가 **vite dev 서버**(4337)에서 실측했고, dev의 `render.html`에는 스타일시트 `<link>`가 없어 `kitCss`(`staticHtml.ts:110-115`)가 PngError가 아닌 일반 `Error("render.html에 스타일시트가 없습니다")`를 던진다 → `reportFailure` → `png_failed reason=INFRA`. 빌드 산출물(`vite preview`)에서는 3경로 모두 PNG 성공, ③에서 개수 문구까지 정상.
설계상 실패임: `staticHtml.ts:110` 주석("dev 서버는 CSS를 JS로 넣어 링크가 없다 → 실패") · 선례 `m2a-3c/REPORT.md` 59행 · `m2b-d1/REPORT.md` 44행.

## 1. 대조 매트릭스 (Ego Lite 앱 안 클릭, 1280)
| 서버 | 경로 | 결과 | 증거 |
|---|---|---|---|
| dev 4337 | ① 이미지 없음(편집 시작 직후) | **실패** `png_failed INFRA` · alert "PNG를 만들지 못했습니다" | `logs/dev-path1.txt` · `shots/dev-path1-png.png` |
| dev 4337 | ③ 이탈·복귀(잃은 이미지 2장) | 4/4 실패 INFRA | REQA 원본 `m2c-reqa/logs/t5-png-reason.txt` (재측정 안 함 — ①에서 이미 이미지·이탈 무관 실패 확정) |
| preview(build) 4337 | ① 이미지 없음 | 성공 `png_succeeded fallback_count 0` · `…_1280_r1.png` 1280×4510 | `logs/prev-path1.txt` · `shots/prev-path1.png`·`prev-path1-notice.png` |
| preview(build) 4337 | ② Hero·About 이미지 2장 넣음 | 성공 · `…_1280_r5.png` 1280×4643 · 이미지 2장 육안 확인 | `logs/prev-path2-insert.txt`·`prev-path2.txt` · `shots/prev-path2.png` |
| preview(build) 4337 | ③ "프로젝트로 돌아가기" → `/projects` → 같은 프로젝트 복귀(잃은 이미지 2장) | 성공 · status "PNG를 내려받았습니다 · …_1280_r5.png · **이미지 2장을 다시 골라야 해 자체 그래픽으로 넣었습니다**" · F2 캡션 "다시 골라야 하는 이미지 2장" | `logs/prev-path3-return.txt`·`prev-path3.txt` · `shots/prev-path3-canvas.png`·`prev-path3-notice.png`·`prev-path3.png` |

- ③ PNG SHA-256 앞 12자 = ① PNG(`2a4b7a4168e7`, 같은 1280×4510) — 잃은 이미지 = 자체 그래픽이 이미지 없는 문서와 바이트까지 같게 그려짐(D-1 결정성 보너스 증거). ②는 `a9e69684e721`.
- 이벤트 로그의 `png_requested`/`png_succeeded` 2중 기록은 측정 스크립트가 청취기를 두 번 붙인 탓(누름 1회).

## 2. 예외 스택 (dev ①)
- 클릭 경로의 예외 객체는 앱이 노출하지 않으므로(콘솔 오류 0 — PngSave가 잡아 계측만) 다음 두 가지를 합쳐 특정했다. 임시 진단 코드 0(앱 파일 미수정):
  1. 클릭 중 fetch 추적: `/render.html 200` **하나뿐**, CSS 요청 0 → `capturePng` 105행 `kitCss`에서 멈춤(이미지 처리 116행 전).
  2. 같은 dev 모듈 인스턴스로 `kitCss(defaultFetchText)` 직접 호출:
     `Error: render.html에 스타일시트가 없습니다 at Module.kitCss (http://127.0.0.1:4337/src/features/studio/staticHtml/staticHtml.ts:113:32)` · name=Error(PngError 아님) → `pngCapture.ts:173` INFRA.
  3. dev `render.html` 응답 556B · `<link>` 0 / preview `render.html` `<link rel="stylesheet" href="/assets/render-BHkyxf8o.css">`.

## 3. 정적 HTML 개수 문구 — 미검증(사유)
③ 상태 게이트 차단 3건: 대비 AA 1(R-08 C-5 muted/bg 3.8:1, 대체안 "**프로필에서 보정**") · SEO 메타 2(R-11 제목·설명 없음). 대비 AA는 편집기 안 적용 버튼 0(`logs/static-try1.txt`) — 풀려면 프로필 보정·재확정 → 새 문서가 되어 잃은 이미지 상태가 사라지므로 검증 의미 없음. 시드 문서 대비 AA 차단은 기존 알려진 상태.

## 4. RED/GREEN
해당 없음 — (c)라 코드·테스트 변경 0. 전후 동일.

## 5. 회귀 게이트 (fresh)
- `npm run typecheck` EXIT 0 · `npm run lint` EXIT 0 · `npm run build` EXIT 0(`/studio` 127.36+0.03 ≤127.39 · 렌더 JS 84.19KB) · `npx vitest run` EXIT 0 **227 files · 2048 tests passed** (`logs/typecheck.txt`·`lint.txt`·`build.txt`·`vitest.txt`)

## 6. Ego Lite·서버 정리
- `finish({keep:[]})` → 직후 목록에 81(ownership user) 잔존 → 3초 뒤 `listTaskSpaces()` = `[]` (`logs/ego-finish.txt`)
- preview PID 97995 cwd 확인 후 종료 · dev PID 95897은 preview 전환 시 종료 · 4337/4339 리슨 0 · 5480 확인만
- preview 진입은 새 origin 첫 `goto` 1회(새로고침 아님), 이후 앱 안 클릭만

## 7. 권고
- QA에서 PNG·정적 HTML 실측은 `npm run build` + `vite preview`에서 할 것(dev에서는 설계대로 INFRA). E-1은 결함 목록에서 닫음 제안.
- 픽스처 `fixtures/*.jpg`(페이지 OffscreenCanvas 자체 패턴)는 커밋 제외.

## 8. Codex
(아래에 기록)
