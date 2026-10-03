# M2A-3b — 정적 HTML 생성기 + 내려받기 (Developer)

- 책임 Developer / 실행 Orca + Claude Code · 보고 Jarvis · 포트 4337(127.0.0.1) · `--max-turns` 120 · `--effort` medium · **90턴부터 REPORT 마감 우선**
- 서브에이전트 금지(429 이력) · 시작 커밋 = 이 브리프가 들어 있는 main
- 선행: M2A-3a 병합 ✅(`a7e6305` — 게이트 8줄 · `requestExport` 8.3.2 · 생성기 주입 자리 `ExportGenerators` · 버튼 사전 차단 · r4.11) · 영환님 "★A, M2A-3b 브리프"(2026-10-03)
- **REPORT 규칙**: 시작할 때 `dev/active/m2a-3b/REPORT.md` 골격(1 커밋 표 · 2 G0 이관 확인 · 3 생성 방식 PoC·결정 · 4 직렬화 프로토콜 · 5 생성기·내려받기 · 6 K-AC·E-AC 판정 · 7 번들 표 · 8 SPEC 차이 · 9 남은 위험·M2A-3c에 넘길 것)을 커밋하고, **단계를 끝낼 때마다 그 절을 같은 커밋에 채운다.** 최근 레인 4개가 턴 한도로 REPORT·브라우저 확인을 못 끝냈다.

## 목적
"정적 HTML 내보내기"를 누르면 **캔버스에 보이는 그 페이지가 HTML 파일 1개로 내려받아진다.** 3a의 생성기 자리(`ExportGenerators["static-html"]`)에 브라우저 생성기를 꽂아 8.3.2 6단계를 지나게 하고, E-S27 완료 문구 + "내려받기" 링크 + 결과 해시까지. `react-zip`은 계속 `GENERATOR_UNAVAILABLE`(M4).

## 근거 (먼저 읽기 — 절·행 번호로 인용)
- `docs/design/2a-05/SPEC.md`: **5.13**(버튼 · 시작) · **E-S27**(완료 문구 "…을 만들었습니다 · 내보내기 전 상태는 스냅샷 '…'에 있습니다" + "내려받기" + 결과 해시 · 재시도 가능 실패) · **8.3.2**(6단계 형식별 생성기 — r4.8 "M2a부터 `static-html`은 브라우저 생성기") · 8.1 `ExportJob` · 9절 계측 · 5.15 대화상자 · r4.8~r4.11
- `docs/design/m2a/SPEC.md`: 0.9(이미지) · 0.10(링크) · 0.11(상호작용 — 네이티브 HTML) · **2절 K2**(문의 폼 A안 — 정적 HTML도 같은 마크업) · 3.3(PNG — 파일 이름 규칙 K-AC-32를 HTML에도 적용) · **K-AC-06 · 08 · 12 · 30 · 32**
- `docs/decisions/ADR-004-performance-budgets.md` 개정 2(렌더 문서 예산 · 우회 방지) · **개정 3**(`/studio` 진입 127 · 멈춤선 126.70 · 상향 금지)
- 3a 결과: `dev/active/m2a-3a/REPORT.md` 4절(판정 순서·생성기 주입 모양) · 10.4(F3 잡 실행·재실행 = 잡의 스냅샷 문서) · **10.7·10.8(이관 항목)**
- 코드: `app/src/data/{projectRepository,memoryProjectRepository,memoryDocBook,deferredStudio}.ts` · `app/src/features/studio/{useExportFlow,exportFlow}.ts` · `app/src/components/studio/{ExportAfter,StudioPanels}.tsx` · `app/src/render/{protocol,RenderApp,PageDocument,objectUrls,main}.tsx?` · `app/src/kit/` · `app/scripts/check-bundle-size.mjs`

## 범위 (단계 = 체크포인트 · RED→GREEN 커밋 · REPORT 같은 커밋)
- **G0 3a 이관 확인 (코드 변경 없으면 커밋은 REPORT만)**: (1) Codex `review --scope branch --base bec1b38`(3a 전체 = `bec1b38..a7e6305`, 원문 `logs/g0-codex-3a.txt`) — P1은 이 레인에서 고치고(RED→GREEN), P2 이하는 REPORT 2절에 판정과 함께. (2) 3a F6 브라우저: A안 → 폴백 2개 삭제 → (r4.11로 대체텍스트 차단 0) 남은 차단을 앱 안 조작으로 해소 → **G0 시점(생성기 없음)** "정적 HTML 내보내기" → `GENERATOR_UNAVAILABLE` 결과 문구 `shots/g0-1280-unavailable.png` · 경고만 상태면 확인 대화상자 모달(배경 조작 불가 · Esc) `shots/g0-1280-dialog.png`. 앱 안 조작으로 게이트 통과가 불가능하면 남은 차단 줄 이름·원인을 REPORT에 쓰고 **멈춘다**(우회 픽스처 금지 — 3b 전체가 이 경로를 쓴다).
- **G1 생성 방식 PoC (구현 전 결정, REPORT 3절에 비교표)**: 생성기는 **잡의 스냅샷 문서**(3a F3)로 만들어야 하므로 캔버스에 지금 보이는 DOM을 그대로 쓰면 안 된다. 기본안(Jarvis 제안 — PoC로 확인·대체 가능):
  - (a) 부모의 **조작 뒤 청크**가 화면 밖 숨은 iframe(`/render.html`, `sandbox="allow-scripts"` 그대로, 폭 1280)을 만들어 기존 `render{doc, kitTokens, images}`로 그리게 한 뒤, 새 메시지 `serialize` → 렌더 문서가 `html{markup}`(자기 `body` 하위 사이트 루트 직렬화)을 돌려준다. 끝나면 iframe 제거.
  - (b) CSS: 부모 청크가 같은 출처에서 `/render.html`을 받아 `link[rel=stylesheet]` 경로의 CSS 텍스트를 가져와 `<style>`로 넣는다(불투명 출처 iframe 안에서는 `cssRules` 접근 불가 — 부모가 읽는 편이 단순). 사이트에 쓰이지 않는 규칙(폴백 와이어프레임 등) 제거 여부는 크기 실측 후 결정.
  - 비교 대상 예: 렌더 문서 안 `react-dom/server` 정적 렌더(렌더 JS 예산 영향 실측 — 멈춤선 89.70, 지금 79.89) 등. 판정 기준: 결과 = 캔버스와 같은 마크업(FR-PUB-03) · 렌더 문서 예산 · `/studio` 진입 0 증가 · 새 의존성 0.
- **G2 직렬화 프로토콜 (RED 먼저)**: `protocol.ts` 모양 검사에 `serialize`(부모→렌더) · `html`(렌더→부모, 크기 상한) 추가 + 테스트. 직렬화 결과 규칙(K-AC-06·08 포함): `script` 0 · `on*` 속성 0 · `details[open]` 0 · `:popover-open`/열린 상태 0 · 편집기 흔적 0(선택·rect 보고용 속성·`data-*` 내부 표식 — 사이트에 필요 없는 것) · 폴백 섹션 0(7단계가 막지만 생성기도 방어 — 있으면 실패) · `blob:` URL 0.
- **G3 정적 HTML 생성기 (조작 뒤 청크)**: `ExportGenerator` 구현 — 입력 `{projectId, format, doc}` → 완전한 문서 1개: `<!doctype html>` · `<html lang="ko">` · `<meta charset>` · `<meta name="viewport">` · `<title>`·`<meta name="description">` = 문서 SEO 메타(5.12 SEO 줄 값) · 인라인 `<style>`(킷 CSS + 사이트 변수) · 직렬화 마크업. 외부 요청 0(폰트 0 — M2A-2b B8 · 이미지 = 실제 이미지가 있으면 data URL, 없으면 그라디언트 CSS). 사용자 글자는 직렬화 결과 그대로(이스케이프는 렌더 DOM 기준) — 문자열 이어 붙이기로 사용자 글자를 HTML에 넣지 않는다.
  - 반환: `downloadRef` = 부모 탭의 object URL(Blob `text/html;charset=utf-8`) · `resultHash` = 결과 바이트 SHA-256 앞 12자리(`crypto.subtle` — 새 의존성 0).
  - 등록: `deferredStudio`/`memoryProjectRepository` 생성기 주입 경로에 `static-html` = **지연 import 래퍼**. 래퍼가 진입 청크에 더하는 바이트를 실측(아래 번들).
  - 재시도 가능 실패: iframe 준비·직렬화 시간 초과 → `JOB_TIMEOUT` · 그 밖 → `INFRA`(3a 규칙). object URL 해제 시점(편집기 이탈 · 같은 잡 재생성) 테스트.
- **G4 결과 · 내려받기 (E-S27)**: 완료 Callout "정적 HTML을 만들었습니다 · 내보내기 전 상태는 스냅샷 '…'에 있습니다" + "내려받기"(부모 문서의 `<a download>` — 렌더 iframe은 내려받기 권한 없음) + 결과 해시. 파일 이름 = K-AC-32 규칙의 HTML판(`<정리된 이름>_r<revision>.html`, 폭 표기 없음 — 바꾼 점 REPORT 8절). 계측 `export_succeeded(format)`(사용자 글자 0).
- **G5 정적 HTML 판정 [U]·[B]**: K-AC-06 · 08 · 30(정적 HTML 부분 — 열어서 Enter·버튼 → 이동·요청 0) · 12(정적 HTML에서 메뉴 시트 · 앵커 이동 · 대상 제목이 header에 가려지지 않음) · 32(HTML 이름) · `/compare` 등 다른 화면 영향 0. **[B]는 내려받은 파일을 `file://`이 아니라 127.0.0.1 정적 경로로 열어** 1280·390 뷰포트 캡처 `shots/g5-{1280,390}.png` — 캔버스 캡처와 나란히(같은 문서 · 같은 모양인지).
- **G6 브라우저 끝까지**: A안(폴백 삭제 · 게이트 통과) → "정적 HTML 내보내기" → 완료 문구 · "내려받기" → 파일 저장 확인 · 같은 revision 재요청 = 같은 잡(스냅샷 +0) `shots/g6-*.png` · `logs/g6-flow.txt`(콘솔 오류 0).
- **G7** 전체 vitest 3회(exit 0 · Errors 0) · Codex `review --scope branch --base <시작 커밋>` 1회 · REPORT 마감 · 4337 종료.

## 제외
- PNG(M2A-3c) · zip(M4) · 이미지 업로드(A3-3) · 문의 폼 수신(MQ-6) · 발행(2a-05b) · 호스팅.

## 번들 (가장 빠듯함)
- **`/studio/:projectId` 진입 직후 ≤ 126.70(멈춤선, 지금 126.67 — 여유 0.03).** 생성기·직렬화 부모 쪽·결과 UI는 **전부 조작 뒤 청크**. 진입 청크에 생기는 것은 지연 import 래퍼뿐이어야 하고, 그 크기를 G3에서 실측한다. 0.03을 넘으면: 진입 청크에서 S-B5(조작 뒤)로 옮길 수 있는 것을 먼저 찾아 옮기고(근거·전후 실측), 그래도 넘으면 **멈춰 보고**(127 이상 상향 금지 — ADR-004 개정 3).
- 렌더 문서: JS 멈춤선 89.70 · CSS ≤ 30. `serialize` 처리 코드만 늘어야 한다. 앱 코드를 렌더 문서로 옮기는 것은 ADR-004 개정 2 결정 3에 따라 금지(가드 테스트 유지).
- 그 밖 화면·공통 ±0.03.

## 공통 규칙
- 판단 순서 ADR-003. SPEC과 다르게 한 곳은 REPORT 8절에 한 줄 사유.
- TDD RED→GREEN(RED 로그 커밋). 단언 약화·skip 금지. **새 의존성 0 · 새 아이콘 0.** 엔진 계약 변경 0. `ExportJob`·`ExportGenerator` 타입 변경 0(필요하면 멈추고 보고). `import type`. `navigate(replace)` 금지.
- 보안: 생성 결과에 스크립트 0 · 사용자 입력 URL 0(K2 A안) · `sandbox` 속성 그대로(`allow-same-origin` 금지) · 숨은 iframe도 같은 sandbox · postMessage 출처 검사는 기존 규칙(`event.source === iframe.contentWindow`).
- `design/`·`docs/design/`·`docs/decisions/` 수정 금지. fable 무접촉. `git commit -- <경로>`. **gate.sh exit 0 확인 후에만 커밋.**
- 로컬 커밋만. push·병합·삭제 금지. **끝날 때 자기 서버 PID 종료(vite dev·preview·정적 서버 모두) — `lsof -nP -iTCP:4337 -sTCP:LISTEN` 결과 0을 REPORT에.** 다른 포트를 써야 하면 4339만.

## 수용 기준
1. G0: 3a Codex 판정 · `GENERATOR_UNAVAILABLE` 결과 캡처(또는 근거와 함께 정지).
2. 정적 HTML 생성: 잡의 스냅샷 문서 기준 · 외부 요청 0 · 스크립트 0 · K-AC-06·08·30·12·32 판정.
3. 브라우저: 내려받은 HTML 1280·390이 캔버스와 같은 모양(나란히 캡처) · 콘솔 오류 0.
4. `/studio` 진입 ≤ 126.70 · 렌더 JS ≤ 89.70 · 전체 vitest 3회 exit 0 · REPORT 자리표시 0 · 4337 종료.

## 확정
- 2a-05 SPEC r4.8~r4.11 · m2a SPEC · ADR-004 개정 2·3 · 영환님 "★A, M2A-3b 브리프"(2026-10-03).
